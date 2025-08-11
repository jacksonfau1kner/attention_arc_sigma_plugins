import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ["@sigmacomputing/plugin"],
  },
  plugins: [react(), svgr()],
  base: 'https://jacksonfau1kner.github.io/dma_map_box_backup/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', '@sigmacomputing/plugin'],
          'mapbox': ['mapbox-gl', 'react-map-gl'],
          'deck': ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/react']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|ico)$/.test(assetInfo.name)) {
            return `assets/images/[name].[hash].[ext]`;
          }
          return `assets/[name].[hash].${ext}`;
        },
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  server: {
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://*.sigmacomputing.com",
      'X-Frame-Options': 'ALLOW-FROM https://*.sigmacomputing.com'
    },
    host: true,
    port: 5173,
    allowedHosts: [
      "509dde64331c.ngrok-free.app",
      "*.sigmacomputing.com"
    ]
  },
});