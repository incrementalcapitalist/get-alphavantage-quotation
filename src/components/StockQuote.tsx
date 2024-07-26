// Import React and useState hook from the React library
import React, { useState } from "react";

// Define types for the API response and errors
type APIError = {
  message: string;
  code?: string;
};

interface StockData {
  [key: string]: string;
}

const StockQuote: React.FC = () => {
  // State for user input
  const [symbol, setSymbol] = useState<string>("");
  // State for API response data
  const [stockData, setStockData] = useState<StockData | null>(null);
  // State for error messages (now using APIError type)
  const [error, setError] = useState<APIError | null>(null);
  // State for loading status
  const [loading, setLoading] = useState<boolean>(false);

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
      // Construct the API URL with the environment variable
      const apiUrl = new URL("https://www.alphavantage.co/query");
      apiUrl.searchParams.append("function", "GLOBAL_QUOTE");
      apiUrl.searchParams.append("symbol", symbol);
      apiUrl.searchParams.append("apikey", import.meta.env.VITE_ALPHA_VANTAGE_API_KEY);

      // Fetch data from Alpha Vantage API
      const response = await fetch(apiUrl.toString());

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();

      // Check for API errors or empty responses
      if (data["Error Message"]) {
        throw new Error(data["Error Message"]);
      }

      const quote = data["Global Quote"];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error("No data found for this symbol");
      }

      // Set the stock data state with the received quote
      setStockData(quote);
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
  };

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
    </div>
  );
};

// Export the StockQuote component as the default export
export default StockQuote;