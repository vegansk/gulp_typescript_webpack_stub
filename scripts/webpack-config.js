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

  return {
    output,
    resolve,
    module,
    devtool: "source-map"
  };
}

module.exports = createConfig;
