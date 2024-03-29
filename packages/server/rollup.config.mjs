import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";

const rollupConfig = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/bundle.mjs",
        format: "esm",
        plugins: [terser()],
        sourcemap: false,
      },
      {
        file: "dist/bundle.js",
        format: "cjs",
        plugins: [terser()],
        sourcemap: false,
      },
    ],
    plugins: [typescript()],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/dts/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];

export default rollupConfig;
