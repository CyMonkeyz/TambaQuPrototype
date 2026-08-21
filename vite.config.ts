import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sites } from "@openai/sites-vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

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
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.5.0-demo"),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: [
        "favicon.ico",
        "tambaqu-logo.svg",
        "apple-touch-icon-180x180.png",
      ],
      manifest: {
        id: "/",
        name: "TambaQu",
        short_name: "TambaQu",
        description:
          "Platform monitoring dan dukungan keputusan budidaya udang vaname.",
        start_url: "/app/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "any",
        theme_color: "#087f74",
        background_color: "#f4f8f8",
        lang: "id",
        categories: ["business", "productivity", "utilities"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/server\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "tambaqu-images-v1",
              expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
    sites(),
    sitesWorkerEntry(),
  ],
});
