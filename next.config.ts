import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
    serverExternalPackages: ['drizzle-kit', '@payloadcms/drizzle', 'sharp'],
};

export default withPayload(nextConfig);
