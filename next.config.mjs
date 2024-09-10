/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Attempt to resolve these modules to false if they're not found
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@mapbox/node-pre-gyp": false,
        "@tensorflow/tfjs-node": false,
        "mock-aws-s3": false,
        "aws-sdk": false
      };
    }

    // Add a rule to handle HTML files
    config.module.rules.push({
      test: /\.html$/,
      use: "raw-loader"
    });

    return config;
  }
};

export default nextConfig;
