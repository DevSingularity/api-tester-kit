import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["app.local.singularitydev.xyz", "http://localhost:3000", "http://localhost:3001"],
};

export default nextConfig;
