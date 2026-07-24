import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";

const publicAssetBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

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
    {
      slug: "media",
      upload: {
        mimeTypes: ["image/*", "application/pdf"],
      },
      hooks: {
        afterRead: [({ doc }) => {
          if (!publicAssetBaseUrl || !doc.filename) return doc;
          const prefix = doc.prefix ? `${doc.prefix.replace(/^\/+|\/+$/g, "")}/` : "";
          return {
            ...doc,
            url: `${publicAssetBaseUrl}/site/general/${prefix}${encodeURIComponent(doc.filename)}`,
          };
        }],
      },
      fields: [
        { name: "alt", type: "text", required: true },
        { name: "legacySourceUrl", type: "text", index: true },
        { name: "legacyObjectKey", type: "text", index: true },
      ],
    },
    {
      slug: "pages",
      admin: { useAsTitle: "title" },
      fields: [
        { name: "title", type: "text", required: true, localized: true },
        { name: "slug", type: "text", required: true, unique: true, index: true },
        { name: "legacyUrl", type: "text", unique: true, index: true },
        { name: "contentHTML", type: "code", admin: { language: "html" }, localized: true },
        { name: "seoDescription", type: "textarea", localized: true },
        { name: "publishedAt", type: "date" },
      ],
    },
    {
      slug: "news",
      admin: { useAsTitle: "title", defaultColumns: ["title", "category", "publishedAt"] },
      fields: [
        { name: "title", type: "text", required: true, localized: true },
        { name: "slug", type: "text", required: true, unique: true, index: true },
        { name: "category", type: "text", required: true, index: true },
        { name: "legacyId", type: "text", required: true, unique: true, index: true },
        { name: "legacyBoardId", type: "text", index: true },
        { name: "legacyUrl", type: "text", unique: true, index: true },
        { name: "contentHTML", type: "code", admin: { language: "html" }, localized: true },
        { name: "publishedAt", type: "date", required: true, index: true },
        { name: "legacyAuthor", type: "text" },
      ],
    },
  ],
  globals: [
    {
      slug: "navigation",
      fields: [
        {
          name: "items",
          type: "array",
          fields: [
            { name: "label", type: "text", required: true, localized: true },
            { name: "href", type: "text", required: true },
            { name: "legacyUrl", type: "text" },
            { name: "openInNewTab", type: "checkbox", defaultValue: false },
          ],
        },
      ],
    },
  ],
  localization: {
    locales: [
      { code: "ko", label: "한국어" },
      { code: "en", label: "English" },
    ],
    defaultLocale: "ko",
    fallback: true,
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    push: process.env.NODE_ENV === "development",
  }),
  plugins: [
    s3Storage({
      bucket: process.env.R2_BUCKET || "",
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
        endpoint: process.env.R2_ENDPOINT,
        region: "auto",
      },
      collections: {
        media: { prefix: "site/general" },
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "https://kimsekyu.com",
  typescript: { outputFile: "payload-types.ts" },
});
