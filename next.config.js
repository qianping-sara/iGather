/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出独立的应用，便于部署
  output: 'standalone',
  // 启用webpack配置
  webpack: (config, { isServer }) => {
    // 当在服务器端时，避免打包Phaser
    if (isServer) {
      config.externals = [...config.externals, 'phaser'];
    }
    
    return config;
  },
};

export default nextConfig;
