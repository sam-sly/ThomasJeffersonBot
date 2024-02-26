module.exports = {
  apps : [{
    name: 'TJ',
    cwd: '..',
    script: 'index.js',
    log_file: 'pm2/production.log',
    node_args: '--env-file .env',
    time: true,
  }],

  // Deployment Configuration
  deploy : {
    production : {
      "user" : "sam",
      "host" : "10.0.0.198",
      "ref"  : "origin/main",
      "repo" : "git@github.com:sam-sly/fs-discord-bot.git",
      "path" : "/home/sam/fs-discord-bot/",
      "post-deploy" : "npm install && pm2 startOrRestart pm2/pm2.config.js"
    }
  }
};
