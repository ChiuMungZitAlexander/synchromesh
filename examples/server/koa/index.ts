import Koa from "koa";
import { PassThrough } from "node:stream";

import { SyncManager } from "../../../packages/server/src/index";

const PORT = process.env.PORT ?? 3042;
const app = new Koa();

const syncManager = new SyncManager({
  name: "koa",
  fetcher: () =>
    new Promise((res) => {
      setTimeout(() => {
        res(Math.random() > 0.5 ? 1 : 0);
      }, 200);
    }),
  syncIntervalMs: 2000,
});

app.use(async (ctx, next) => {
  if (ctx.path === "/sse") {
    // Prevent Koa sending a response and closing the connection
    ctx.respond = false;

    syncManager.registerSession(ctx.req, ctx.res, "koa");
  }
});

syncManager.watch();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port http://localhost:${PORT}/`);
});
