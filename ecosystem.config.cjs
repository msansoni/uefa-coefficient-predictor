module.exports = {
  apps: [{
    name: 'uefa-predictor',
    script: 'server.js',
    instances: 'max',       // Use all available CPU cores
    exec_mode: 'cluster',   // Cluster mode for load balancing
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Restart policies
    max_memory_restart: '256M',
    restart_delay: 1000,
    max_restarts: 10,
    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    // Watch (disabled in production)
    watch: false,
  }],
};
