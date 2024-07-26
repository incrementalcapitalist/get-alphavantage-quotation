const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(`https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=stocks`, {
      headers: {
        'Authorization': `Bearer ${process.env.NASDAQ_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.get('/api/options/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(`https://api.nasdaq.com/api/quote/${symbol}/option-chain?assetclass=stocks&limit=100`, {
      headers: {
        'Authorization': `Bearer ${process.env.NASDAQ_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching options data:', error);
    res.status(500).json({ error: 'Failed to fetch options data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});