import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const rollupConfig = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bundle.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/bundle.esm.min.js",
      format: "esm",
      plugins: [terser()],
      sourcemap: true,
    },
    {
      file: "dist/bundle.umd.js",
      format: "umd",
      name: "vanilux",
      sourcemap: true,
    },
    {
      file: "dist/bundle.umd.min.js",
      format: "umd",
      name: "vanilux",
      plugins: [terser()],
      sourcemap: true,
    },
  ],
  plugins: [typescript()],
};

export default rollupConfig;
