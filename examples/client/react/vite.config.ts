import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/sse": {
        target: "http://localhost:3041",
      },
    },
  },
  plugins: [react()],
});
