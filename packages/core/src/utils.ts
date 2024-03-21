import isEqual from "lodash/isEqual";

export const diff = (currentData: unknown, nextData: unknown) =>
  isEqual(currentData, nextData);
