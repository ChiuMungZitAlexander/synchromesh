import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const rollupConfig = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bundle.esm.js",
      format: "esm",
      plugins: [terser()],
      sourcemap: false,
    },
    {
      file: "dist/bundle.umd.js",
      format: "umd",
      plugins: [terser()],
      sourcemap: false,
    },
  ],
  plugins: [typescript()],
};

export default rollupConfig;
