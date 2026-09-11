import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            { name: "three", test: /node_modules\/three\//, maxSize: 450_000 },
            { name: "scene-tools", test: /node_modules\/(?:@react-three|three-stdlib)\// },
          ],
        },
      },
    },
  },
});
