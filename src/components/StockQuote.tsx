// Import React and useState hook from the React library
import React, { useState } from "react";

// Define an interface for the stock data structure
// This allows for any string key with a string value
interface StockData {
  [key: string]: string;
}

// Define the StockQuote functional component
const StockQuote: React.FC = () => {
  // State for the stock symbol input
  const [symbol, setSymbol] = useState<string>("");
  // State for the fetched stock data
  const [stockData, setStockData] = useState<StockData | null>(null);
  // State for error messages
  const [error, setError] = useState<string | null>(null);
  // State for loading status
  const [loading, setLoading] = useState<boolean>(false);

  // Asynchronous function to fetch stock data
  const fetchStockData = async () => {
    // Check if a symbol has been entered
    if (!symbol) {
      setError("Please enter a stock symbol");
      return;
    }

    // Set loading to true and clear any previous errors
    setLoading(true);
    setError(null);

    try {
      // Fetch data from Alpha Vantage API using the environment variable
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${import.meta.env.VITE_ALPHA_VANTAGE_API_KEY}`
      );

      // Check if the response is ok (status in the range 200-299)
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Parse the JSON response
      const data = await response.json();
      // Extract the "Global Quote" object from the response
      const quote = data["Global Quote"];

      // Check if quote data was received
      if (quote && Object.keys(quote).length > 0) {
        // Set the stock data state with the received quote
        setStockData(quote);
      } else {
        // Set an error if no data was found for the symbol
        setError("No data found for this symbol");
      }
    } catch (err) {
      // Set an error message if the fetch failed
      setError("Failed to fetch stock data");
    } finally {
      // Set loading to false regardless of success or failure
      setLoading(false);
    }
  };

  // Function to handle key press events on the input field
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // If the pressed key is "Enter", call fetchStockData
    if (event.key === "Enter") {
      fetchStockData();
    }
  };

  // Function to format the key names for display
  const formatKey = (key: string): string => {
    // Split the key by ". ", take the second part, add spaces before capital letters, and trim
    return key
      .split(". ")[1]
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  // Render the component
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Title of the component */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Stock Quote Fetcher
      </h2>
      {/* Input container */}
      <div className="mb-4">
        {/* Input field for stock symbol */}
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="Enter stock symbol (e.g., AAPL)"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {/* Button to fetch stock data */}
      <button
        onClick={fetchStockData}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out"
      >
        {loading ? "Loading..." : "Fetch Quote"}
      </button>
      {/* Display error message if there is an error */}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {/* Display stock data if it exists */}
      {stockData && (
        <div className="mt-6 overflow-x-auto">
          {/* Table to display stock data */}
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table header */}
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Field
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
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