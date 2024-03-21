import type { IncomingMessage, ServerResponse } from "node:http";
import { createSession } from "better-sse";
import pino from "pino";

import { diff } from "./utils";

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

type DataSource = {
  intervalId: NodeJS.Timeout;
  data: unknown;
};

type DataSourceUnwatched = {
  name: string;
  fetcher: () => Promise<unknown>;
  intervalMs: number;
  ctx: Ctx;
};

type Ctx = {
  req: IncomingMessage;
  res: ServerResponse;
};

export class SseSyncManager {
  private registeredDataSource: Map<string, DataSource> = new Map();

  public async registerDataSource({
    name,
    fetcher,
    intervalMs,
    ctx,
  }: DataSourceUnwatched) {
    const session = await createSession(ctx.req, ctx.res);

    const _intervalId = setInterval(async () => {
      const targetDataSource = this.registeredDataSource.get(name);

      if (!targetDataSource) {
        return;
      }

      const nextData = await fetcher();

      const shouldUpdate = !diff(targetDataSource.data, nextData);

      if (shouldUpdate) {
        this.registeredDataSource.set(name, {
          ...targetDataSource,
          data: nextData,
        });

        logger.info(`Successfully updated data source ${name}`);

        session.push(nextData, name);
      }
    }, intervalMs);

    this.registeredDataSource.set(name, {
      data: null,
      intervalId: _intervalId,
    });

    logger.info(`Successfully registered data source ${name}`);
  }

  public unregisterDataSource(name: string) {
    const targetDataSource = this.registeredDataSource.get(name);

    if (!targetDataSource) {
      return;
    }

    clearInterval(targetDataSource.intervalId);
    this.registeredDataSource.delete(name);
  }
}
