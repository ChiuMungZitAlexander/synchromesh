import { createSession, createChannel, type Channel } from "better-sse";
import pino from "pino";
import isEqual from "lodash/isEqual";
import get from "lodash/get";
import type { IncomingMessage, ServerResponse } from "http";

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

const DEFAULT_SYNC_INTERVAL_MS = 1000;

type SyncSource = Omit<SyncSourceRegistry, "name"> & {
  /**
   * The channel will broadcast if the data from sync source is updated.
   * All sessions in the channel share the same sync function.
   */
  channel: Channel;

  /**
   * After starting the watch, the id of setInterval will stored.
   * It will be undefined unless the sync source is being watched.
   */
  syncIntervalId?: NodeJS.Timeout;

  /**
   * The current data of the sync source.
   * It will be undefined unless the sync source is being watched and returns the latest data.
   */
  data?: unknown;
};

type SyncSourceRegistry<T = unknown> = {
  /**
   * The name of the sync source to be registered. Must be unique.
   */
  name: string;

  /**
   * The function to be called periodically by syncIntervalMs to fetch the data from data source.
   *
   * @returns Data to diff
   */
  fetcher: () => T | Promise<T>;

  /**
   * The diff key or diff function. Can also be optional.
   *
   * If it is not provided, the diff logic will be deep equal comparison between current data and next data.
   * If diff is string, the comparison will be only between the target properties of current data and next data. The string can be multiple property accessors.
   * @example
   * { diff: "data.property" }
   *
   * All the comparisons above are deep equal comparison.
   * @see {@link https://lodash.com/docs/4.17.15#isEqual}
   *
   * You may also provide your own diff function which returns a boolean to let sync manager know if it should do the sync.
   *
   */
  diff?: string | ((currentData: T, nextData: T) => boolean);

  /**
   * The interval to fetch the latest data from data source. Default is 1000.
   */
  syncIntervalMs?: number;
};

export class SyncManager {
  constructor(syncSource?: SyncSourceRegistry | SyncSourceRegistry[]) {
    if (syncSource) {
      this.registerSyncSource(syncSource);
    }
  }

  /**
   * The map of registered sync sources. Registered sync sources never have duplicate names.
   */
  private _syncSource: Map<string, SyncSource> = new Map();

  /**
   * List the raw map of registered sync sources.
   */
  get syncSource() {
    return this._syncSource;
  }

  /**
   * Register a new sync source.
   * If the sync source with the same name has already been registered, it will throw an error to avoid missing any sync sources.
   * It accepts single sync source registry or an array of them.
   *
   * @param syncSource sync source options
   */
  public registerSyncSource(
    syncSource: SyncSourceRegistry | SyncSourceRegistry[]
  ) {
    const syncSources = Array.isArray(syncSource) ? syncSource : [syncSource];

    syncSources.forEach(
      ({ name, fetcher, diff, syncIntervalMs = DEFAULT_SYNC_INTERVAL_MS }) => {
        if (this._syncSource.get(name)) {
          throw new Error(`Sync source ${name} has already been registered.`);
        }

        const channel = createChannel();

        this._syncSource.set(name, {
          fetcher,
          channel,
          diff,
          syncIntervalMs,
          syncIntervalId: undefined,
          data: undefined,
        });

        logger.info(`Successfully registered sync source {${name}}`);
      }
    );
  }

  /**
   * Unregister a sync source.
   * If the sync source is not found, ignore it.
   * Otherwise, the sync source will be removed and its sync function will be cleared.
   */
  public unregisterSyncSource(name: string) {
    const targetSyncSource = this._syncSource.get(name);

    if (!targetSyncSource) {
      return;
    }

    clearInterval(targetSyncSource.syncIntervalId);
    this._syncSource.delete(name);

    logger.info(`Successfully unregistered sync source {${name}}`);
  }

  /**
   * Register http session to channel for broadcasting.
   * Should be called in http handlers.
   */
  public async registerSession(
    req: IncomingMessage,
    res: ServerResponse,
    name: string
  ) {
    const targetSyncSource = this._syncSource.get(name);

    if (!targetSyncSource) {
      throw new Error(`Sync source {${name}} is not registered.`);
    }

    const session = await createSession(req, res);
    targetSyncSource.channel.register(session);
  }

  /**
   * Start to watch all sync sources.
   * If the sync source has already been watched, stop the previous watch and start a new one.
   */
  public watch() {
    Array.from(this._syncSource.entries()).forEach(([name, _syncSource]) => {
      clearInterval(_syncSource.syncIntervalId);

      _syncSource.syncIntervalId = setInterval(async () => {
        try {
          const nextData = await _syncSource.fetcher();

          const shouldUpdateFlag = shouldUpdate(_syncSource, nextData);

          if (shouldUpdateFlag) {
            _syncSource.data = nextData;
            _syncSource.channel.broadcast(nextData);
          }
        } catch (error) {
          logger.error(
            `Failed to fetch sync source {${name}}. Details - ${error?.message}`
          );
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

const shouldUpdate = ({ data, diff }: SyncSource, nextData: unknown) => {
  if (!diff) {
    return !isEqual(data, nextData);
  }

  if (typeof diff === "string") {
    return !isEqual(get(data, diff), get(nextData, diff));
  }

  return diff(data, nextData);
};
