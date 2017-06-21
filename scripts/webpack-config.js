const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

function createConfig(type, inPath) {
  const output = {
    filename: type === "debug" ? "[name].js" : "[name].[hash:8].js"
  };

  const resolve = {
    modules: [inPath, "node_modules"]
  };

  const module = {
    rules: [
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.map$/,
        use: ["ignore-loader"]
      }
    ]
  };

  const entry = [
    `index.js`
  ];

  const plugins = [
    new HtmlWebpackPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(type === "debug" ? "development" : "production")
    })
  ].concat(
    type !== "debug"
      ? [ new UglifyJSPlugin() ]
      : []
  );

  return {
    entry,
    output,
    resolve,
    module,
    devtool: "source-map",
    plugins
  };
}

module.exports = createConfig;
