module.exports = {
  apps: [
    {
      name: "aarhus-3d-print",
      script: ".next/standalone/server.js",
      cwd: "/home/ubuntu/3dprint",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: process.env.PORT || process.env.APP_PORT || "3000"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.PORT || process.env.APP_PORT || "3000"
      },
      time: true
    }
  ]
};
