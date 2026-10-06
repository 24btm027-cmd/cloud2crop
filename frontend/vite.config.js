import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// /api calls are forwarded to the Node/Express backend
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:5001' } } });
