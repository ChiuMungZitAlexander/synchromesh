import express from "express";
import { cloneDeep, random, round } from "lodash";

import json from "./data.json";

const PORT = process.env.PORT ?? 3050;
const app = express();

type Stock = {
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap: string;
};

let data: Stock[] = cloneDeep(json).stocks;

app.get("/data", (req, res) => {
  res.json(data);
});

app.listen(PORT, () => {
  // simulate the market changes rapidly
  setInterval(() => {
    data = data.map((_stock) => {
      if (random(1) > 0.9) {
        // 90% possibility to update the price
        return _stock;
      }

      const originalPrice = _stock.price - _stock.change;
      // next price will fluctuate by at most 0.1%
      const nextPrice = round(random(0.999, 1.001) * _stock.price, 2);
      const nextChange = round(nextPrice - originalPrice, 2);
      const nextChangePercent = round((nextChange / originalPrice) * 100, 2);

      return {
        ..._stock,
        price: nextPrice,
        change: nextChange,
        change_percent: nextChangePercent,
      };
    });
  }, 500);

  console.log(`🚀 Server is running on port http://localhost:${PORT}/`);
});
