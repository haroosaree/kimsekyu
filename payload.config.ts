import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";

export default buildConfig({
  admin: {
    user: "users",
    importMap: { baseDir: process.cwd() },
  },
  collections: [
    {
      slug: "users",
      auth: true,
      fields: [{ name: "name", type: "text", required: true }],
    },
  ],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    push: process.env.NODE_ENV === "development",
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: "payload-types.ts" },
});
