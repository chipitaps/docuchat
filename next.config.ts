import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root: a stray package-lock.json higher up (e.g. in the
  // home directory) would otherwise make Turbopack guess the wrong one.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
