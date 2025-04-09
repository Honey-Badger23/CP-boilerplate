import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 8080,
		host: '0.0.0.0',
		proxy: {
			'/api': {
				target: 'http://dev.communitypal.co.za',
				changeOrigin: true,
				secure: false,
				ws: true,
				configure: (proxy, options) => {
					proxy.on('error', (err, req, res) => {
						console.log('proxy error', err);
					});
					proxy.on('proxyReq', (proxyReq, req, res) => {
						console.log('Sending Request to the Target:', req.method, req.url);
						const token = req.headers['authorization'];
						if (token) {
							proxyReq.setHeader('Authorization', token);
						}
					});
					proxy.on('proxyRes', (proxyRes, req, res) => {
						console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
						proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080';
						proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
						proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
					});
				}
			},
			'/api/resource': {
				target: 'http://dev.communitypal.co.za',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path
			},
			'/socket.io': {
				target: 'http://dev.communitypal.co.za',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path
			},
			'/assets': {
				target: 'http://dev.communitypal.co.za',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path
			}
		},
		hmr: { 
			host: 'localhost',
			port: 8080
		},
		allowedHosts: ['localhost'],
		cors: true,
		headers: {
			'Access-Control-Allow-Origin': 'http://localhost:8080',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		}
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	},
	build: {
		outDir: '../cp/public/frontend',
		emptyOutDir: true,
		target: 'es2015',
	},
});
