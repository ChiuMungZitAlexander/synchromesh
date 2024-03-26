import { expect, test } from "vitest";

import { SyncManager } from "./sync-manager";

test("Sync source should be added when creating an instance", () => {
  const syncManager = new SyncManager({
    name: "test1",
    fetcher: () => null,
    syncIntervalMs: 2000,
  });

  expect(syncManager.syncSource.size).toBe(1);
});

test("Multiple sync sources should be added when creating an instance", () => {
  const syncManager = new SyncManager([
    {
      name: "test1",
      fetcher: () => null,
      syncIntervalMs: 2000,
    },
    {
      name: "test2",
      fetcher: () => null,
      syncIntervalMs: 3000,
    },
  ]);

  expect(syncManager.syncSource.size).toBe(2);
});

test("Sync source should be added by registerSyncSource method", () => {
  const syncManager = new SyncManager();

  expect(syncManager.syncSource.size).toBe(0);

  syncManager.registerSyncSource([
    {
      name: "test1",
      fetcher: () => null,
      syncIntervalMs: 2000,
    },
    {
      name: "test2",
      fetcher: () => null,
      syncIntervalMs: 3000,
    },
  ]);

  expect(syncManager.syncSource.size).toBe(2);
});

test("Sync source should throw error if name is duplicated", () => {
  const syncManager = new SyncManager({
    name: "test1",
    fetcher: () => null,
    syncIntervalMs: 2000,
  });

  expect(syncManager.syncSource.size).toBe(1);

  expect(() =>
    syncManager.registerSyncSource({
      name: "test1",
      fetcher: () => null,
      syncIntervalMs: 2000,
    })
  ).toThrow();
});

test("Sync source should be removed by name", () => {
  const syncManager = new SyncManager([
    {
      name: "test1",
      fetcher: () => null,
      syncIntervalMs: 2000,
    },
    {
      name: "test2",
      fetcher: () => null,
      syncIntervalMs: 3000,
    },
  ]);
  syncManager.unregisterSyncSource("test999");
  syncManager.unregisterSyncSource("test2");

  expect(syncManager.syncSource.size).toBe(1);
});
