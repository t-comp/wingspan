import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    handlebars({
      // This tells Vite exactly where your chopped-up HTML files will be
      partialDirectory: resolve(__dirname, "src/partials"),
    }),
  ],
});
