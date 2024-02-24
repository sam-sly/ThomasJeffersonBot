module.exports = {
  apps : [{
    name: 'TJ',
    cwd: '..',
    script: 'index.js',
    log_file: 'pm2/production.log',
    node_args: '--env-file .env',
    time: true,
  }],
};
