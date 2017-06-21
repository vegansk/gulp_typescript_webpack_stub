const HtmlWebpackPlugin = require('html-webpack-plugin');

function createConfig(type, inPath) {
  const output = {
    filename: "[name].[hash:8].js"
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
      }
    ]
  };

  const plugins = [
    new HtmlWebpackPlugin()
  ];

  return {
    output,
    resolve,
    module,
    devtool: "source-map",
    plugins
  };
}

module.exports = createConfig;
