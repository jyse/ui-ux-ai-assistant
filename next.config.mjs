import path from "path";

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Avoid Webpack trying to bundle server-only modules in the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@tensorflow/tfjs-node": false,
        "mock-aws-s3": false,
        "aws-sdk": false,
        nock: false,
        "@mapbox/node-pre-gyp": false
      };
    } else {
      // Server-specific configuration
      config.externals = [
        ...config.externals,
        { "@tensorflow/tfjs-node": "commonjs @tensorflow/tfjs-node" }
      ];
    }

    // Add a rule to ignore HTML files in node_modules
    config.module.rules.push({
      test: /\.html$/,
      include: /node_modules/,
      use: "ignore-loader"
    });

    return config;
  },

  // Experimental feature to allow importing from outside the src directory
  experimental: {
    serverComponentsExternalPackages: ["@tensorflow/tfjs-node"]
  }
};

export default nextConfig;
