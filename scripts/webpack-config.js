function createConfig(type, inPath) {
  const output = {
    filename: "[name].[hash:8].js"
  };

  const resolve = {
    modules: [inPath, "node_modules"]
  };

  return {
    output,
    resolve
  };
}

module.exports = createConfig;
