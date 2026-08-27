import { defineConfig } from "vite";
import vituum from "vituum";
import handlebars from "@vituum/vite-plugin-handlebars";
import tailwindcss from "@tailwindcss/vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import Handlebars from "handlebars";

function registerGlobalPartials() {
 const partialsDir = path.resolve(process.cwd(), "src/partials");
 if (fs.existsSync(partialsDir)) {
  const files = fs.readdirSync(partialsDir);
  files.forEach((file) => {
   if (file.endsWith(".hbs")) {
    const name = path.basename(file, ".hbs");
    const content = fs.readFileSync(path.join(partialsDir, file), "utf-8");
    Handlebars.registerPartial(name, content);
   }
  });
 }
}

registerGlobalPartials();

export default defineConfig({
 plugins: [
  {
   name: "build-markdown-and-watch-hbs",
   buildStart() {
    execSync("node scripts/build-posts.js");
   },
   handleHotUpdate({ file, server }) {
    if (file.endsWith(".md")) {
     execSync("node scripts/build-posts.js");
     server.ws.send({ type: "full-reload" });
    }

    if (file.endsWith(".hbs")) {
     execSync("node scripts/build-posts.js");
     execSync("node pages/index.hbs");
     server.ws.send({ type: "full-reload" });
    }
   },
  },
  vituum(),
  handlebars({
   root: "./src",

   helpers: {
    // Register custom helper to read posts.json into Handlebars
    getPosts: () => {
     const jsonPath = path.resolve(process.cwd(), "src/data/posts.json");
     if (fs.existsSync(jsonPath)) {
      return fs.readJsonSync(jsonPath);
     }
     return [];
    },
   },
  }),
  tailwindcss(),
  ViteImageOptimizer({
   webp: { quality: 80 },
  }),
 ],
 server: {
  // Open browser automatically on start
  open: true,
 },
});
