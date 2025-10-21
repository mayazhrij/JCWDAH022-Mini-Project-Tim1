import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  experimental: {

  },
  compiler: {
    
  },
  webpack: (config, { isServer }) => {
    config.resolve.symlinks = false; 
    return config;
  },
};

module.exports = nextConfig;

export default withFlowbiteReact(nextConfig);