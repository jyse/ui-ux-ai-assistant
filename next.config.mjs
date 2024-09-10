export default {
  reactStrictMode: true
  // experimental: {
  //   appDir: false // disable the experimental app directory
  // }

  // Comment out Webpack config temporarily to check if it resolves the issue
  // webpack: async (config, { isServer }) => {
  //   if (!isServer) {
  //     // Dynamically import webpack for ES6 module compatibility
  //     const webpack = (await import("webpack")).default;

  //     // Exclude problematic modules from client-side builds
  //     config.externals = {
  //       ...config.externals,
  //       "@tensorflow/tfjs-node": "commonjs @tensorflow/tfjs-node",
  //       "@mapbox/node-pre-gyp": "commonjs @mapbox/node-pre-gyp"
  //     };

  //     // Use IgnorePlugin for node-pre-gyp
  //     config.plugins.push(
  //       new webpack.IgnorePlugin({
  //         resourceRegExp: /node-pre-gyp\/lib\/util\/nw-pre-gyp\/index.html/
  //       })
  //     );
  //   }

  //   return config;
  // }
};
