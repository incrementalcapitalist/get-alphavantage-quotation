// Import necessary hooks and functions from React
import React, { useState, useCallback, useMemo } from 'react';

// Define types for API responses and errors
type APIError = {
  message: string;
  code?: string;
};

// Interface for stock data
interface StockData {
  symbol: string;
  companyName: string;
  lastSalePrice: string;
  netChange: string;
  percentageChange: string;
  volume: string;
}

// Interface for option contract
interface OptionContract {
  symbol: string;
  callPut: 'call' | 'put';
  expirationDate: string;
  strikePrice: string;
  lastPrice: string;
  bid: string;
  ask: string;
  volume: string;
  openInterest: string;
  delta?: string;
  gamma?: string;
  theta?: string;
  vega?: string;
}

// Define the type for sorting keys
type SortKey = keyof OptionContract;

// Define the type for filter options
type FilterOption = 'ALL' | 'CALLS' | 'PUTS';

// Define the StockQuote functional component
const StockQuote: React.FC = () => {
  // State declarations
  const [symbol, setSymbol] = useState<string>("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [optionsData, setOptionsData] = useState<OptionContract[]>([]);
  const [error, setError] = useState<APIError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'strikePrice', direction: 'ascending' });
  const [filterOption, setFilterOption] = useState<FilterOption>('ALL');
  const [expirationFilter, setExpirationFilter] = useState<string>('');

  // Function to fetch both stock and options data
  const fetchData = useCallback(async () => {
    // Validate user input
    if (!symbol.trim()) {
      setError({ message: "Please enter a stock symbol" });
      return;
    }

    // Set loading state and reset data and error states
    setLoading(true);
    setError(null);
    setStockData(null);
    setOptionsData([]);

    try {
      // Fetch stock quote data from NASDAQ API
      const quoteResponse = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=stocks`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_NASDAQ_API_KEY}`
        }
      });

      if (!quoteResponse.ok) {
        throw new Error(`HTTP error! status: ${quoteResponse.status}`);
      }

      // Parse the JSON response
      const quoteData = await quoteResponse.json();

      if (quoteData.data) {
        setStockData({
          symbol: quoteData.data.symbol,
          companyName: quoteData.data.companyName,
          lastSalePrice: quoteData.data.primaryData.lastSalePrice,
          netChange: quoteData.data.primaryData.netChange,
          percentageChange: quoteData.data.primaryData.percentageChange,
          volume: quoteData.data.primaryData.volume
        });
      } else {
        throw new Error("No stock data found for this symbol");
      }

      // Fetch options chain data from NASDAQ API
      const optionsResponse = await fetch(`https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=stocks&limit=100`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_NASDAQ_API_KEY}`
        }
      });

      if (!optionsResponse.ok) {
        throw new Error(`HTTP error! status: ${optionsResponse.status}`);
      }

      // Parse the JSON response for options data
      const optionsData = await optionsResponse.json();

      if (optionsData.data && optionsData.data.table && optionsData.data.table.rows) {
        setOptionsData(optionsData.data.table.rows.map((row: any) => ({
          symbol: row.symbol,
          callPut: row.callPut,
          expirationDate: row.expiryDate,
          strikePrice: row.strike,
          lastPrice: row.lastPrice,
          bid: row.bid,
          ask: row.ask,
          volume: row.volume,
          openInterest: row.openInterest,
          delta: row.delta,
          gamma: row.gamma,
          theta: row.theta,
          vega: row.vega
        })));
      } else {
        throw new Error("No options data found for this symbol");
      }

    } catch (err) {
      // Error handling for different error types
      if (err instanceof Error) {
        setError({ message: err.message });
      } else if (typeof err === "string") {
        setError({ message: err });
      } else {
        setError({ message: "An unknown error occurred" });
      }
    } finally {
      // Set loading to false regardless of success or failure
      setLoading(false);
    }
  }, [symbol]); // Dependency array for useCallback

  // Function to handle 'Enter' key press in the input field
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchData();
    }
  };

  // Function to handle sorting
  const handleSort = (key: SortKey) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  // Memoized sorted and filtered options data
  const sortedAndFilteredOptions = useMemo(() => {
    let filteredOptions = optionsData;

    // Apply call/put filter
    if (filterOption === 'CALLS') {
      filteredOptions = filteredOptions.filter(option => option.callPut === 'call');
    } else if (filterOption === 'PUTS') {
      filteredOptions = filteredOptions.filter(option => option.callPut === 'put');
    }

    // Apply expiration date filter
    if (expirationFilter) {
      filteredOptions = filteredOptions.filter(option => option.expirationDate === expirationFilter);
    }

    // Sort the filtered options
    return filteredOptions.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [optionsData, sortConfig, filterOption, expirationFilter]);

  // Memoized unique expiration dates
  const expirationDates = useMemo(() => {
    const dates = new Set(optionsData.map(option => option.expirationDate));
    return Array.from(dates).sort();
  }, [optionsData]);

  // Render the component
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Stock Quote and Options Chain (NASDAQ Data)
      </h2>
      {/* Input field for stock symbol */}
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
      {/* Button to trigger data fetching */}
      <button
        onClick={fetchData}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out disabled:opacity-50"
        aria-busy={loading}
      >
        {loading ? "Loading..." : "Fetch Data"}
      </button>
      
      {/* Display error message if there is an error */}
      {error && (
        <p className="mt-4 text-red-500" role="alert">
          Error: {error.message}
        </p>
      )}
      
      {/* Display stock quote data if available */}
      {stockData && (
        <div className="mt-6 sticky top-0 bg-white z-10 p-4 border-b">
          <h3 className="text-xl font-bold mb-2">Stock Quote</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="font-medium">Symbol:</span>
              <span>{stockData.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Company Name:</span>
              <span>{stockData.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Last Sale Price:</span>
              <span>{stockData.lastSalePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Net Change:</span>
              <span>{stockData.netChange}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Percentage Change:</span>
              <span>{stockData.percentageChange}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Volume:</span>
              <span>{stockData.volume}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Display options chain data if available */}
      {optionsData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Options Chain</h3>
          
          {/* Filter controls */}
          <div className="mb-4 flex space-x-4">
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value as FilterOption)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">All Options</option>
              <option value="CALLS">Calls Only</option>
              <option value="PUTS">Puts Only</option>
            </select>
            <select
              value={expirationFilter}
              onChange={(e) => setExpirationFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Expiration Dates</option>
              {expirationDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Type', 'Strike', 'Last', 'Bid', 'Ask', 'Volume', 'Open Int.', 'Delta', 'Gamma', 'Theta', 'Vega', 'Expiration'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort(header.toLowerCase().replace(' ', '') as SortKey)}
                    >
                      {header} {sortConfig.key === header.toLowerCase().replace(' ', '') && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredOptions.map((option, index) => (
                  <tr key={index} className={option.callPut === 'call' ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{option.callPut.toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.strikePrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.lastPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.bid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.ask}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.volume}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.openInterest}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.delta}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.gamma}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.theta}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.vega}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.expirationDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the StockQuote component as the default export
export default StockQuote;