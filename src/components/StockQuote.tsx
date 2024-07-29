import React, { useState, useEffect, useRef } from "react";
import { createChart, IChartApi, CandlestickSeriesOptions } from "lightweight-charts";

// Add type declarations for URL and URLSearchParams
declare global {
  interface Window {
    URL: typeof URL;
    URLSearchParams: typeof URLSearchParams;
  }
}

// Define types for the API response and errors
type APIError = {
  message: string;
  code?: string;
};

// Interface for the stock quote data
interface StockData {
  [key: string]: string;
}

// Interface for the AlphaVantage API response
interface AlphaVantageResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. adjusted close': string;
      '6. volume': string;
      '7. dividend amount': string;
      '8. split coefficient': string;
    };
  };
  'Global Quote'?: {
    [key: string]: string;
  };
}

// Interface for the chart data point
interface ChartDataPoint {
  time: string;
  value: number;
}

// Interface for the Heikin-Ashi candle data point
interface HeikinAshiDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

const StockQuote: React.FC = () => {
  // State for user input
  const [symbol, setSymbol] = useState<string>("");
  // State for API response data
  const [stockData, setStockData] = useState<StockData | null>(null);
  // State for error messages
  const [error, setError] = useState<APIError | null>(null);
  // State for loading status
  const [loading, setLoading] = useState<boolean>(false);
  // State for historical data
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([]);
  // State for Heikin-Ashi data
  const [heikinAshiData, setHeikinAshiData] = useState<HeikinAshiDataPoint[]>([]);

  // Ref for the chart container div
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // Ref for the chart instance
  const chartRef = useRef<IChartApi | null>(null);
  // Ref for the Heikin-Ashi series
  const heikinAshiSeriesRef = useRef<ReturnType<IChartApi['addCandlestickSeries']> | null>(null);

  // Function to construct API URL with parameters
  const constructApiUrl = (baseUrl: string, params: Record<string, string>): string => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  };

  // Function to fetch stock data from the API
  const fetchStockData = async () => {
    // Validate user input
    if (!symbol.trim()) {
      setError({ message: "Please enter a stock symbol" });
      return;
    }

    // Reset states before fetching
    setLoading(true);
    setError(null);
    setStockData(null);

    try {
      // Construct the API URL
      const apiUrl = constructApiUrl('https://www.alphavantage.co/query', {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
      });

      // Fetch data from Alpha Vantage API
      const response = await fetch(apiUrl);

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      const data: AlphaVantageResponse = await response.json();

      // Log the response for debugging
      console.log("Global Quote Response:", data);

      // Check for API errors or empty responses
      if ('Error Message' in data) {
        throw new Error(data['Error Message'] as string);
      }

      const quote = data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error("No data found for this symbol");
      }

      // Set the stock data state with the received quote
      setStockData(quote);

      // Fetch historical data for the symbol
      await fetchHistoricalData(symbol);
    } catch (err) {
      // Handle different types of errors
      handleError(err);
    } finally {
      // Always set loading to false when done
      setLoading(false);
    }
  };

  // Function to fetch historical data
  const fetchHistoricalData = async (symbol: string): Promise<void> => {
    try {
      // Construct the API URL for TIME_SERIES_DAILY_ADJUSTED
      let apiUrl = constructApiUrl('https://www.alphavantage.co/query', {
        function: 'TIME_SERIES_DAILY_ADJUSTED',
        symbol,
        apikey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
      });

      // Fetch data from the API
      let response = await fetch(apiUrl);
      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      let data: AlphaVantageResponse = await response.json();

      // Log the response for debugging
      console.log("Historical Data Response:", data);

      // Check for API errors
      if ('Error Message' in data) {
        throw new Error(data['Error Message'] as string);
      }

      // Extract the time series data
      let timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        // If no data found, try another endpoint
        apiUrl = constructApiUrl('https://www.alphavantage.co/query', {
          function: 'TIME_SERIES_DAILY',
          symbol,
          apikey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
        });

        response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();
        console.log("Historical Data Response (Alternative Endpoint):", data);

        if ('Error Message' in data) {
          throw new Error(data['Error Message'] as string);
        }

        timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) {
          throw new Error('No time series data found');
        }
      }

      // Transform the data into Heikin-Ashi format
      const heikinAshiData: HeikinAshiDataPoint[] = calculateHeikinAshi(timeSeries);

      // Update the state with the processed Heikin-Ashi data
      setHeikinAshiData(heikinAshiData);
    } catch (error) {
      // Handle and rethrow errors
      if (error instanceof Error) {
        throw new Error(`Failed to fetch historical data: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching historical data');
    }
  };

  // Function to calculate Heikin-Ashi candles
  const calculateHeikinAshi = (timeSeries: AlphaVantageResponse['Time Series (Daily)']): HeikinAshiDataPoint[] => {
    const heikinAshiData: HeikinAshiDataPoint[] = [];
    let prevHA = null;

    Object.entries(timeSeries).forEach(([date, values], index) => {
      const open = parseFloat(values['1. open']);
      const high = parseFloat(values['2. high']);
      const low = parseFloat(values['3. low']);
      const close = parseFloat(values['4. close']);

      let haOpen, haClose, haHigh, haLow;

      if (index === 0) {
        haOpen = open;
        haClose = close;
      } else {
        haOpen = (prevHA!.open + prevHA!.close) / 2;
        haClose = (open + high + low + close) / 4;
      }

      haHigh = Math.max(high, haOpen, haClose);
      haLow = Math.min(low, haOpen, haClose);

      const haCandle: HeikinAshiDataPoint = {
        time: date,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose
      };

      heikinAshiData.push(haCandle);
      prevHA = haCandle;
    });

    return heikinAshiData.reverse(); // Reverse to get chronological order
  };

  // Effect to create and update the chart when Heikin-Ashi data changes
  useEffect(() => {
    if (heikinAshiData.length > 0 && chartContainerRef.current) {
      if (!chartRef.current) {
        chartRef.current = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 400,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
          },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
          },
        });
      }

      if (!heikinAshiSeriesRef.current) {
        heikinAshiSeriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });
      }

      heikinAshiSeriesRef.current.setData(heikinAshiData);

      chartRef.current.timeScale().fitContent();
    }
  }, [heikinAshiData]);

  // Format the key names for display
  const formatKey = (key: string): string => {
    return key.split(". ")[1]?.replace(/([A-Z])/g, " $1").trim() || key;
  };

  // Render the component
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Stock Quote Fetcher
      </h2>
      <div className="mb-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="Enter stock symbol (e.g., AAPL)"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Stock Symbol"
        />
      </div>
      <button
        onClick={fetchStockData}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out disabled:opacity-50"
        aria-busy={loading}
      >
        {loading ? "Loading..." : "Fetch Quote"}
      </button>
      {/* Display error message if there is an error */}
      {error && (
        <p className="mt-4 text-red-500" role="alert">
          Error: {error.message}
        </p>
      )}
      {/* Display stock data if it exists */}
      {stockData && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Map over stockData entries to create table rows */}
              {Object.entries(stockData).map(([key, value]) => (
                <tr key={key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatKey(key)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Display the chart */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
        <div ref={chartContainerRef} className="w-full h-[400px]"></div>
      </div>
    </div>
  );
};

// Export the StockQuote component as the default export
export default StockQuote;