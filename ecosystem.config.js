/**
 * PM2 Ecosystem Configuration for zorbit-app-sample
 *
 * Deployment:
 *   1. Build locally: npm run build
 *   2. rsync dist/ + package.json + package-lock.json to server
 *   3. npm ci --omit=dev on server
 *   4. pm2 start ecosystem.config.js
 *
 * Server port convention: default port + 100 offset
 *   Development: 3040
 *   Server:      3140
 */
module.exports = {
  apps: [
    {
      name: 'zorbit-app-sample',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3140,
      },
    },
  ],
};
