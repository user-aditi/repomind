import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // This allows the AI library to run in the backend without bundling errors.
  serverExternalPackages: ["@xenova/transformers"],
};

export default nextConfig;