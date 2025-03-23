import { defineConfig } from "vite";

export default defineConfig({
  root: "src", // Ubah root ke /src
  build: {
    outDir: "../dist", // Output build tetap di luar src
  },
});
