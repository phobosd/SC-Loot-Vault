module.exports = {
  apps: [
    {
      name: "sc-loot-vault",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 8081
      }
    },
    {
      name: "discord-bot",
      script: "./node_modules/.bin/ts-node",
      args: "scripts/run-bot.ts",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
