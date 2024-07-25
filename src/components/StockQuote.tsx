// Import React and useState hook from the React library
import React, { useState } from "react";

// Define types for API responses and errors
type APIError = {
  message: string;
  code?: string;
};

interface StockData {
  [key: string]: string;
}

interface OptionContract {
  contractName: string;
  contractType: 'CALL' | 'PUT';
  strikePrice: string;
  lastPrice: string;
  bid: string;
  ask: string;
  expiration: string;
  // Add other relevant fields as needed
}

interface OptionsData {
  calls: OptionContract[];
  puts: OptionContract[];
}

const StockQuote: React.FC = () => {
  // State for user input
  const [symbol, setSymbol] = useState<string>("");
  // State for stock quote data
  const [stockData, setStockData] = useState<StockData | null>(null);
  // State for options chain data
  const [optionsData, setOptionsData] = useState<OptionsData | null>(null);
  // State for error messages
  const [error, setError] = useState<APIError | null>(null);
  // State for loading status
  const [loading, setLoading] = useState<boolean>(false);

  // Function to fetch stock and options data from the API
  const fetchData = useCallback(async () => {
    // Validate user input
    if (!symbol.trim()) {
      setError({ message: "Please enter a stock symbol" });
      return;
    }

    // Reset states before fetching
    setLoading(true);
    setError(null);
    setStockData(null);
    setOptionsData(null);

    try {
      // Fetch stock quote data
      const quoteUrl = new URL("https://www.alphavantage.co/query");
      quoteUrl.searchParams.append("function", "GLOBAL_QUOTE");
      quoteUrl.searchParams.append("symbol", symbol);
      quoteUrl.searchParams.append("apikey", import.meta.env.VITE_ALPHA_VANTAGE_API_KEY);

      const quoteResponse = await fetch(quoteUrl.toString());

      // Check for HTTP errors
      if (!quoteResponse.ok) {
        throw new Error(`HTTP error! status: ${quoteResponse.status}`);
      }

      const quoteData = await quoteResponse.json();

      // Check for API errors or empty responses
      if (quoteData["Error Message"]) {
        throw new Error(quoteData["Error Message"]);
      }

      const quote = quoteData["Global Quote"];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error("No quote data found for this symbol");
      }

      // Set the stock data state with the received quote
      setStockData(quote);

      // Fetch options chain data
      const optionsUrl = new URL("https://www.alphavantage.co/query");
      optionsUrl.searchParams.append("function", "OPTIONS_CHAIN");
      optionsUrl.searchParams.append("symbol", symbol);
      optionsUrl.searchParams.append("apikey", import.meta.env.VITE_ALPHA_VANTAGE_API_KEY);

      const optionsResponse = await fetch(optionsUrl.toString());

      if (!optionsResponse.ok) {
        throw new Error(`HTTP error! status: ${optionsResponse.status}`);
      }

      const optionsData = await optionsResponse.json();

      // Process and set options data
      // Note: Adjust this according to the actual structure of Alpha Vantage's options chain response
      setOptionsData({
        calls: optionsData.calls || [],
        puts: optionsData.puts || []
      });

    } catch (err) {
      // Handle different types of errors
      if (err instanceof Error) {
        setError({ message: err.message });
      } else if (typeof err === "string") {
        setError({ message: err });
      } else {
        setError({ message: "An unknown error occurred" });
      }
    } finally {
      // Always set loading to false when done
      setLoading(false);
    }
  }, [symbol]);

  // Handle 'Enter' key press in the input field
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchData();
    }
  };

  // Format the key names for display
  const formatKey = (key: string): string => {
    return key.split(". ")[1]?.replace(/([A-Z])/g, " $1").trim() || key;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Stock Quote and Options Chain
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
      
      {/* Display stock quote data if it exists */}
      {stockData && (
        <div className="mt-6 sticky top-0 bg-white z-10 p-4 border-b">
          <h3 className="text-xl font-bold mb-2">Stock Quote</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stockData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{formatKey(key)}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Display options chain data if it exists */}
      {optionsData && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Options Chain</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ask</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                </tr>
              </thead>
            {/* Table body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {[...optionsData.calls, ...optionsData.puts].map((option, index) => (
                  <tr key={index} className={option.contractType === 'CALL' ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{option.contractType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.strikePrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.lastPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.bid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.ask}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.expiration}</td>
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