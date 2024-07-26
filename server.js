const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Enable CORS for all routes
app.use(cors());

app.get('/quote/:ticker', async (req, res) => {
  try {
    const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${req.params.ticker}&apikey=${API_KEY}`);

    if (response.data['Global Quote']) {
      res.json(response.data['Global Quote']);
    } else {
      res.status(404).json({ error: 'Ticker not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
