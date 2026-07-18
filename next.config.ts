import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["app.local.singularitydev.xyz", "http://localhost:3000", "http://localhost:3001"],
};

export default nextConfig;
