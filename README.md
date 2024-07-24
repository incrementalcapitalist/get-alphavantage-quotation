# Get AlphaVantage Quotation

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

Get AlphaVantage Quotation is a modern, responsive web application built with React, TypeScript, and Vite. It allows users to easily fetch and display real-time stock quotes using the Alpha Vantage API. This project demonstrates the implementation of a clean, user-friendly interface for financial data retrieval, showcasing best practices in React development, API integration, and responsive design.

## Features

- Real-time stock quote fetching
- Responsive design for various screen sizes
- User-friendly interface with input validation
- Comprehensive display of stock data in a formatted table
- Error handling for API requests and user inputs
- Keyboard accessibility (Enter key support for quote fetching)

## Technologies Used

- **React**: A JavaScript library for building user interfaces
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript
- **Vite**: A build tool that aims to provide a faster and leaner development experience for modern web projects
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs
- **Alpha Vantage API**: Provides realtime and historical financial market data
- **ESLint**: A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code
- **Prettier**: An opinionated code formatter
- **Vitest**: A Vite-native unit test framework with a Jest-compatible API

## Getting Started

### Prerequisites

- Node.js (version 14.0.0 or later)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone git@github.com:incrementalcapitalist/get-alphavantage-quotation.git
   cd get-alphavantage-quotation
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your Alpha Vantage API key:
   ```
   VITE_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

## Usage

To start the development server:

```
npm run dev
```

Open `http://localhost:3000` in your browser to view the application.

To build for production:

```
npm run build
```

## Project Structure

```
get-alphavantage-quotation/
│
├── src/
│   ├── components/
│   │   └── StockQuote.tsx
│   ├── src/
│   │   └── index.css
│   ├── App.tsx
│   └── main.tsx
│
├── public/
│
├── tests/
│
├── .eslintrc.json
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## API Integration

This project uses the Alpha Vantage API to fetch stock quotes. The API key is stored in an environment variable for security. The `StockQuote` component handles the API request and data processing.

## Styling

Tailwind CSS is used for styling, providing a responsive and clean user interface. The styles are defined inline using Tailwind's utility classes, allowing for rapid development and easy maintenance.

## Testing

Vitest is used for unit testing. To run tests:

```
npm run test
```

To generate a coverage report:

```
npm run coverage
```

## Deployment

This project is configured for easy deployment to AWS Amplify. The `package.json` and build settings are optimized for Amplify's build process.

Consider the following YAML:

```
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
