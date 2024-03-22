import { createSession } from "better-sse";
import isEuqal from "lodash/isEqual";
import pino from "pino";

import { IncomingMessage, ServerResponse } from "http";

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

type DataSource = {
  syncIntervalId: NodeJS.Timeout;
  data: unknown;
};

type DataSourceUnwatched = {
  name: string;
  fetcher: () => Promise<unknown>;
  syncIntervalMs?: number;
  req: IncomingMessage;
  res: ServerResponse;
};

export class SyncManager {
  private registeredDataSource: Map<string, DataSource> = new Map();

  /**
   *
   * @param path path
   */
  public async registerDataSource({
    name,
    fetcher,
    syncIntervalMs,
    req,
    res,
  }: DataSourceUnwatched) {
    const session = await createSession(req, res);

    const _intervalId = setInterval(async () => {
      const targetDataSource = this.registeredDataSource.get(name);

      if (!targetDataSource) {
        return;
      }

      const nextData = await fetcher();

      const shouldUpdate = !isEuqal(targetDataSource.data, nextData);

      if (shouldUpdate) {
        this.registeredDataSource.set(name, {
          ...targetDataSource,
          data: nextData,
        });

        logger.info(`Successfully updated data source ${name}`);

        session.push(nextData, name);
      }
    }, syncIntervalMs);

    this.registeredDataSource.set(name, {
      data: null,
      syncIntervalId: _intervalId,
    });

    logger.info(`Successfully registered data source ${name}`);
  }

  public unregisterDataSource(name: string) {
    const targetDataSource = this.registeredDataSource.get(name);

    if (!targetDataSource) {
      return;
    }

    clearInterval(targetDataSource.syncIntervalId);
    this.registeredDataSource.delete(name);
  }
}
