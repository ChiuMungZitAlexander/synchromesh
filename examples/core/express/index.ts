import express from "express";

import { SyncManager } from "../../../packages/core/src/index";

const PORT = process.env.PORT ?? 3041;
const app = express();

const syncManager = new SyncManager({
  name: "express",
  fetcher: () =>
    new Promise((res, rej) => {
      setTimeout(() => {
        Math.random() > 0.9
          ? rej(new Error())
          : res(Math.random() > 0.5 ? 1 : 0);
      }, 200);
    }),
  syncIntervalMs: 2000,
});

app.get("/sse", (req, res) => {
  syncManager.registerSession(req, res, "express");
});

syncManager.watch();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port http://localhost:${PORT}/`);
});
