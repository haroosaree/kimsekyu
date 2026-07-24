import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

// const nextConfig: NextConfig = {};
const nextConfig: NextConfig = {
  serverExternalPackages: ['drizzle-kit'],
  // ...your existing config (withPayload wrapper, etc.)
}

export default withPayload(nextConfig);
