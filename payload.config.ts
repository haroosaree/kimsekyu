import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";

const mediaCollectionPrefix = "site/general";
const publicAssetBaseUrl = process.env.R2_PUBLIC_BASE_URL
  ?.replace(/\/$/, "")
  .replace(new RegExp(`/${mediaCollectionPrefix}(?:/${mediaCollectionPrefix})*$`), "");
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://kimsekyu.com");
const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

export default buildConfig({
  admin: {
    user: "users",
    theme: "light",
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
          const prefix = doc.prefix
            ? doc.prefix
              .replace(/^\/+|\/+$/g, "")
              .replace(new RegExp(`^(?:${mediaCollectionPrefix}/?)+`), "")
            : "";
          return {
            ...doc,
            url: `${publicAssetBaseUrl}/${[mediaCollectionPrefix, prefix, encodeURIComponent(doc.filename)].filter(Boolean).join("/")}`,
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
        { name: "legacyViewCount", type: "number", required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
        { name: "viewCount", type: "number", required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
        { name: "readCount", type: "number", required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
        { name: "legacyAuthor", type: "text" },
      ],
    },
    {
      slug: "questions",
      admin: { useAsTitle: "subject", defaultColumns: ["subject", "status", "name", "createdAt"] },
      access: {
        create: () => true,
        read: isAdmin,
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [
        { name: "subject", type: "text", required: true },
        { name: "message", type: "textarea", required: true },
        { name: "name", type: "text", required: true },
        { name: "email", type: "email", required: true },
        { name: "phone", type: "text" },
        { name: "publishedAt", type: "date", index: true },
        { name: "viewCount", type: "number", required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
        { name: "legacyId", type: "text", unique: true, index: true, admin: { readOnly: true } },
        { name: "legacyUrl", type: "text", unique: true, index: true, admin: { readOnly: true } },
        { name: "legacyContentHTML", type: "code", admin: { language: "html", readOnly: true, hidden: true } },
        { name: "legacyAuthor", type: "text", admin: { readOnly: true } },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "new",
          options: [
            { label: "New", value: "new" },
            { label: "In progress", value: "in-progress" },
            { label: "Resolved", value: "resolved" },
          ],
        },
        {
          name: "answer",
          type: "textarea",
          access: { read: isAdmin, create: isAdmin, update: isAdmin },
        },
        { name: "answeredAt", type: "date", access: { read: isAdmin, create: isAdmin, update: isAdmin } },
      ],
    },
  ],
  globals: [
    {
      slug: "site-settings",
      label: "Site settings",
      access: {
        read: () => true,
        update: isAdmin,
      },
      fields: [
        {
          name: "heroImage",
          type: "upload",
          relationTo: "media",
          admin: { description: "Homepage hero background. The site gradient overlay remains applied automatically." },
        },
        {
          name: "menuHeroImage",
          type: "upload",
          relationTo: "media",
          admin: { description: "Shared legacy-style banner shown above menu landing pages." },
        },
      ],
    },
    {
      slug: "navigation",
      label: "Navigation menu",
      access: {
        read: () => true,
        update: isAdmin,
      },
      fields: [
        {
          name: "bannerImage",
          type: "upload",
          relationTo: "media",
          admin: { description: "Legacy-style banner displayed on menu landing pages. The gradient overlay remains applied automatically." },
        },
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
    {
      slug: "homepage",
      label: "Landing page",
      access: {
        read: () => true,
        update: isAdmin,
      },
      fields: [
        {
          type: "group",
          name: "hero",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "heading", type: "textarea", localized: true, admin: { description: "Use a new line where the heading should break." } },
            { name: "emphasis", type: "text", localized: true },
            { name: "description", type: "textarea", localized: true },
            { name: "primaryLabel", type: "text", localized: true },
            { name: "primaryHref", type: "text" },
            { name: "secondaryLabel", type: "text", localized: true },
            { name: "secondaryHref", type: "text" },
            { name: "sideNote", type: "textarea", localized: true },
          ],
        },
        {
          type: "group",
          name: "introduction",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "heading", type: "textarea", localized: true, admin: { description: "Use a new line where the heading should break." } },
            { name: "emphasis", type: "text", localized: true },
            { name: "description", type: "textarea", localized: true },
            { name: "linkLabel", type: "text", localized: true },
            { name: "linkHref", type: "text" },
            {
              name: "stats",
              type: "array",
              fields: [{ name: "value", type: "text", required: true }, { name: "label", type: "text", required: true, localized: true }],
            },
          ],
        },
        {
          type: "group",
          name: "services",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            {
              name: "cards",
              type: "array",
              fields: [
                { name: "title", type: "text", required: true, localized: true },
                { name: "description", type: "textarea", localized: true },
                { name: "linkLabel", type: "text", localized: true },
                { name: "linkHref", type: "text" },
              ],
            },
          ],
        },
        {
          type: "group",
          name: "newsSection",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "heading", type: "text", localized: true },
            { name: "allLinkLabel", type: "text", localized: true },
            { name: "allLinkHref", type: "text" },
            { name: "readLabel", type: "text", localized: true },
            { name: "articleLinkLabel", type: "text", localized: true },
            { name: "emptyStateLabel", type: "text", localized: true },
            { name: "emptyCardTitles", type: "array", fields: [{ name: "title", type: "text", required: true, localized: true }] },
          ],
        },
        {
          type: "group",
          name: "contact",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "heading", type: "textarea", localized: true, admin: { description: "Use a new line where the heading should break." } },
            { name: "emphasis", type: "text", localized: true },
            { name: "introduction", type: "textarea", localized: true },
            { name: "phone", type: "text" },
            { name: "email", type: "email" },
            { name: "profileImage", type: "upload", relationTo: "media" },
            { name: "profileName", type: "text", localized: true },
            { name: "profileCaption", type: "textarea", localized: true },
          ],
        },
        {
          type: "group",
          name: "footer",
          fields: [
            { name: "kicker", type: "text", localized: true },
            { name: "brand", type: "text", localized: true },
            { name: "company", type: "textarea", localized: true },
            { name: "copyright", type: "text", localized: true, admin: { description: "Use {year} for the current year." } },
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
    push: process.env.PAYLOAD_PUSH_SCHEMA === "true",
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
        media: { prefix: mediaCollectionPrefix },
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL,
  typescript: { outputFile: "payload-types.ts" },
});
