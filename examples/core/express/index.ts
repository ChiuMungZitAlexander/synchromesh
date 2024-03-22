import express from "express";

import { SyncManager } from "../../../packages/core/src/index";

const PORT = process.env.PORT ?? 3041;
const app = express();

app.get("/sse", async (req, res) => {
  const syncManager = new SyncManager();

  syncManager.registerDataSource({
    name: "source1",
    fetcher: () =>
      new Promise((res) => {
        setTimeout(() => {
          res(Math.random() > 0.5 ? 1 : 0);
        }, 200);
      }),
    syncIntervalMs: 2000,
    req,
    res,
  });
});

app.listen(PORT, () => {
  console.log(
    `Server listening. Open http://localhost:${PORT} in your browser.`
  );
});
