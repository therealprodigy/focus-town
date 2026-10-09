import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { roomsPlugin } from "./server/dev-plugin.ts";
export default defineConfig({
  plugins: [react(), tailwindcss(), roomsPlugin()],
});
