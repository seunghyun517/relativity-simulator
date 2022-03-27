const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config.base.js");
const portFinderSync = require("portfinder-sync");

module.exports = merge(baseConfig, {
  mode: "development",
  devServer: {
    host: "0.0.0.0",
    port: portFinderSync.getPort(8080),
  },
});
