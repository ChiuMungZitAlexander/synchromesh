import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  test: {
    include: ["src/**/*.spec.[jt]s"],
  },
});

export default vitestConfig;
