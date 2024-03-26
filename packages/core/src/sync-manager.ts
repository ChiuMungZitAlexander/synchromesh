import { createSession, createChannel, type Channel } from "better-sse";
import pino from "pino";
import isEqual from "lodash/isEqual";
import type { IncomingMessage, ServerResponse } from "http";

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

const DEFAULT_SYNC_INTERVAL_MS = 1000;

type SyncSource = {
  fetcher: () => unknown | Promise<unknown>;
  channel: Channel;
  syncIntervalMs?: number;
  syncIntervalId?: NodeJS.Timeout;
  data?: unknown;
};

type SyncSourceRegistry = {
  name: string;
  fetcher: () => unknown | Promise<unknown>;
  syncIntervalMs?: number;
};

export class SyncManager {
  constructor(syncSource?: SyncSourceRegistry | SyncSourceRegistry[]) {
    if (syncSource) {
      this.registerSyncSource(syncSource);
    }
  }

  private _syncSource: Map<string, SyncSource> = new Map();

  get syncSource() {
    return this._syncSource;
  }

  public registerSyncSource(
    syncSource: SyncSourceRegistry | SyncSourceRegistry[]
  ) {
    const syncSources = Array.isArray(syncSource) ? syncSource : [syncSource];

    syncSources.forEach(
      ({ name, fetcher, syncIntervalMs = DEFAULT_SYNC_INTERVAL_MS }) => {
        if (this._syncSource.get(name)) {
          throw new Error(`Sync source ${name} has already been registered.`);
        }

        const channel = createChannel();

        this._syncSource.set(name, {
          fetcher,
          channel,
          syncIntervalMs,
          syncIntervalId: undefined,
          data: undefined,
        });

        logger.info(`Successfully registered sync source ${name}`);
      }
    );
  }

  public unregisterSyncSource(name: string) {
    const targetSyncSource = this._syncSource.get(name);

    if (!targetSyncSource) {
      return;
    }

    clearInterval(targetSyncSource.syncIntervalId);
    this._syncSource.delete(name);
  }

  /**
   * Register http session to channel for broadcasting.
   */
  public async registerSession(
    req: IncomingMessage,
    res: ServerResponse,
    name: string
  ) {
    const targetSyncSource = this._syncSource.get(name);

    if (!targetSyncSource) {
      throw new Error(`Sync source ${name} is not registered.`);
    }

    const session = await createSession(req, res);
    targetSyncSource.channel.register(session);
  }

  /**
   * Start to watch all sync sources.
   * If the sync source has already been watched, stop the previous watch and start a new one.
   */
  public watch() {
    Array.from(this._syncSource.values()).forEach((_syncSource) => {
      clearInterval(_syncSource.syncIntervalId);

      _syncSource.syncIntervalId = setInterval(async () => {
        const nextData = await _syncSource.fetcher();

        const shouldUpdate = !isEqual(_syncSource.data, nextData);

        if (shouldUpdate) {
          _syncSource.data = nextData;
          _syncSource.channel.broadcast(nextData);
        }
      }, _syncSource.syncIntervalMs ?? DEFAULT_SYNC_INTERVAL_MS);
    });
  }

  /**
   * Stop watching all sync sources.
   */
  public unwatch() {
    Array.from(this._syncSource.values()).forEach((_syncSource) => {
      clearInterval(_syncSource.syncIntervalId);
      _syncSource.syncIntervalId = undefined;
    });
  }
}
