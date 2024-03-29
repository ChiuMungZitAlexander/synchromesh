import express from "express";

import { SyncManager } from "../../../packages/server/src/index";

const PORT = process.env.PORT ?? 3041;
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

const syncManager = new SyncManager({
  name: "STOCKS",
  fetcher: async () => {
    const res = await fetch("http://localhost:3050/data");
    const data: Stock[] = await res.json();
    return data;
  },
  // always update latest data
  diff: (currentData, nextData) => true,
  syncIntervalMs: 1000,
});

app.get("/sse", (req, res) => {
  syncManager.registerSession(req, res, "STOCKS");
});

syncManager.watch();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port http://localhost:${PORT}/`);
});
