import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
    serverExternalPackages: ['drizzle-kit', '@payloadcms/drizzle', 'sharp'],
    outputFileTracingIncludes: {
        '/*': [
            './node_modules/@img/sharp-linux-x64/**/*',
            './node_modules/@img/sharp-libvips-linux-x64/**/*',
            './node_modules/.pnpm/@img+sharp-linux-x64*/node_modules/@img/sharp-linux-x64/**/*',
            './node_modules/.pnpm/@img+sharp-libvips-linux-x64*/node_modules/@img/sharp-libvips-linux-x64/**/*',
        ],
    },
};

export default withPayload(nextConfig);
