import React from "react";
import StockQuote from "./components/StockQuote";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-8">
            Alpha Vantage Stock Quotation App
          </h1>
          <StockQuote />
        </div>
      </div>
    </div>
  );
};

export default App;
