import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: false,
  // Use webpack explicitly to avoid Turbopack conflict
  webpack: (config, { isServer, dev }) => {
    // Suppress source map warnings for both server and client
    if (dev) {
      // In development, disable source maps to avoid warnings
      config.devtool = false;
    } else {
      // In production, ensure no source maps
      if (!isServer) {
        config.devtool = false;
      }
    }
    
    // Suppress source map warnings
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { file: /.*/ },
    ];
    
    return config;
  },
  // Suppress warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
