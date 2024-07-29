import React, { useState, useEffect, useRef } from "react";
import { createChart, IChartApi } from "lightweight-charts";
import { ParsedUrlQueryInput, stringify } from 'querystring';

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

  // Ref for the chart container div
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // Ref for the chart instance
  const chartRef = useRef<IChartApi | null>(null);

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
      // Construct the API URL params
      const params: ParsedUrlQueryInput = {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
      };

      // Construct the full API URL
      const apiUrl = `https://www.alphavantage.co/query?${stringify(params)}`;

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
    // Construct the API URL params
    const params: ParsedUrlQueryInput = {
      function: 'TIME_SERIES_DAILY_ADJUSTED',
      symbol,
      apikey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
    };

    // Construct the full API URL
    const url = `https://www.alphavantage.co/query?${stringify(params)}`;

    try {
      // Fetch data from the API
      const response = await fetch(url);
      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      const data: AlphaVantageResponse = await response.json();

      // Log the response for debugging
      console.log("Historical Data Response:", data);

      // Check for API errors
      if ('Error Message' in data) {
        throw new Error(data['Error Message'] as string);
      }

      // Extract the time series data
      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('No time series data found');
      }

      // Transform the data into the format expected by the chart
      const chartData: ChartDataPoint[] = Object.entries(timeSeries)
        .map(([date, values]): ChartDataPoint => ({
          time: date,
          value: parseFloat(values['4. close']),
        }))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      // Update the state with the processed historical data
      setHistoricalData(chartData);
    } catch (error) {
      // Handle and rethrow errors
      if (error instanceof Error) {
        throw new Error(`Failed to fetch historical data: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching historical data');
    }
  };

  // Function to handle errors
  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError({ message: err.message });
    } else if (typeof err === "string") {
      setError({ message: err });
    } else {
      setError({ message: "An unknown error occurred" });
    }
  };

  // Effect to create and update the chart when historical data changes
  useEffect(() => {
    if (historicalData.length > 0 && chartContainerRef.current) {
      // If the chart doesn't exist, create it
      if (!chartRef.current) {
        chartRef.current = createChart(chartContainerRef.current, { width: 600, height: 300 });
      }

      // Add the area series to the chart
      const areaSeries = chartRef.current.addAreaSeries();
      // Set the data for the area series
      areaSeries.setData(historicalData);
    }
  }, [historicalData]);

  // Handle 'Enter' key press in the input field
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchStockData();
    }
  };

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
      <div ref={chartContainerRef} className="mt-6"></div>
    </div>
  );
};

// Export the StockQuote component as the default export
export default StockQuote;