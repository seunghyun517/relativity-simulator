const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.config.base");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = merge(baseConfig, {
  mode: "production",
  plugins: [new CleanWebpackPlugin()],
});
