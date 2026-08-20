import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sites } from "@openai/sites-vite-plugin";

function sitesWorkerEntry(): Plugin {
  return {
    name: "tambaqu-sites-worker",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "server/index.js",
        source: `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const acceptsHtml = request.headers.get('accept')?.includes('text/html')
    if (response.status === 404 && request.method === 'GET' && acceptsHtml) {
      const url = new URL(request.url)
      url.pathname = '/index.html'
      return env.ASSETS.fetch(new Request(url, request))
    }
    return response
  },
}\n`,
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sites(), sitesWorkerEntry()],
});
