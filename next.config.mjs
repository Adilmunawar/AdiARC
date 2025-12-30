/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
    // Add a rule to handle .txt files with 'raw-loader'
    config.module.rules.push({
      test: /\.txt$/,
      use: 'raw-loader',
    });

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
