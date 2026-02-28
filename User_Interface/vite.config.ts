//import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react'

     // https://vite.dev/config/
//export default defineConfig({
//  plugins: [react()],
//})

//added by me
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/Portfolio_Metrics_Analyzer",
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
// refer VITE_API_BASE_URL=https://your-backend-name.onrender.com
