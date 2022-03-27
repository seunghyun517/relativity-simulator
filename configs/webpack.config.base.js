const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = {
  entry: {
    main: [
      path.resolve(__dirname, "../src/html/main.html"),
      path.resolve(__dirname, "../src/js/main/index.js"),
    ],
    about: [
      path.resolve(__dirname, "../src/html/about.html"),
      path.resolve(__dirname, "../src/js/about/index.js"),
    ],
    index: [
      path.resolve(__dirname, "../src/html/index.html"),
      path.resolve(__dirname, "../src/js/index/index.js"),
    ],
  },
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "../dist"),
    chunkFilename: "[id].[chunkhash].js",
  },
  devtool: "source-map",
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../src/html/about.html"),
      filename: "about.html",
      minify: true,
      chunks: ["about"],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../src/html/main.html"),
      filename: "main.html",
      minify: true,
      chunks: ["main"],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../src/html/index.html"),
      filename: "index.html",
      minify: true,
      chunks: ["index"],
    }),
    new MiniCSSExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
  ],
  module: {
    rules: [
      // HTML
      {
        test: /\.(html)$/,
        use: ["html-loader"],
      },

      // JS
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        ],
      },

      // CSS
      {
        test: /\.css$/i,
        use: [MiniCSSExtractPlugin.loader, "css-loader"],
      },

      // Images
      // {
      //   test: /\.(jpg|png|gif|svg)$/,
      //   type: "asset/resource",
      //   use: [
      //     {
      //       loader: "file-loader",

      //       options: {
      //         name: "[name].[ext]",
      //         outputPath: "images/",
      //       },
      //     },
      //   ],
      // },

      // Fonts
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
    ],
  },
};
