import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

const mediaCollectionPrefix = "site/general";
const publicAssetBaseUrl = process.env.R2_PUBLIC_BASE_URL
  ?.replace(/\/$/, "")
  .replace(new RegExp(`/${mediaCollectionPrefix}(?:/${mediaCollectionPrefix})*$`), "");
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://kimsekyu.com");
const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

// Normalize every uploaded image for fast delivery. PDFs pass through unchanged.
const resizeUploadedImage = async ({ operation, req }: { operation: string; req: any }) => {
  const file = req?.file;
  if (operation !== "create" || !file?.data || !file.mimetype?.startsWith("image/")) return;
  try {
    const data = await sharp(file.data)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    file.data = data;
    file.size = data.length;
    file.mimetype = "image/webp";
    file.name = `${String(file.name || "image").replace(/\.[^.]+$/, "")}.webp`;
  } catch {
    // Let Payload handle unsupported/corrupt uploads with its normal error.
  }
};

const newsCategoryOptions = [
  "미국 부동산 소식 / 시장 정보", "주택 매도 가이드", "주택 구매 / 생활 정보", "융자 · 모기지 · 크레딧",
  "어스틴 부동산", "어스틴 지역 · 동네 정보", "어스틴 경제 · 순위 · 고용", "어스틴 경제 · 비즈니스 뉴스",
  "어스틴 한인 비즈니스 · 기관", "여행 · 레저", "교육 · 학군 · 대학", "부동산 질문 · 답변",
  "어스틴 한인 커뮤니티", "어스틴 생활 · 명소", "블로그",
].map((value) => ({ label: value, value }));

const legacyBoardOptions = [
  ["legacy-board-1", "미국 부동산 소식 / 시장 정보"], ["legacy-board-2", "집을 팔때"],
  ["legacy-board-3", "집을 살때"], ["legacy-board-4", "융자 · 모기지 · 크레딧"],
  ["legacy-board-5", "어스틴 부동산"], ["legacy-board-6", "어스틴 지역 · 동네 정보"],
  ["legacy-board-7", "어스틴 경제 · 순위 · 고용"], ["legacy-board-8", "어스틴 경제 · 비즈니스 뉴스"],
  ["legacy-board-9", "어스틴 한인 비즈니스 · 기관"], ["legacy-board-10", "여행 · 레저"], ["legacy-board-11", "어스틴 사진 · 풍경"],
  ["legacy-board-12", "교육 · 학군 · 대학"], ["legacy-board-13", "부동산 질문 · 답변"],
  ["legacy-board-14", "어스틴 한인 커뮤니티"], ["legacy-board-15", "어스틴 생활 · 명소"],
].flatMap(([value, label]) => [{ value, label }, { value: value.replace("legacy-board-", ""), label }]);

function slugFromTitle(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export default buildConfig({
  sharp,
  admin: {
    user: "users",
    theme: "light",
    importMap: { baseDir: process.cwd() },
  },
  collections: [
    {
      slug: "users",
      // auth: true,
      auth: {
        useAPIKey: true,
      },
      fields: [{ name: "name", type: "text", required: true }],
    },
    {
      slug: "media",
      upload: {
        mimeTypes: ["image/*", "application/pdf"],
        imageSizes: [
          { name: "hero", width: 1920, height: 1080, fit: "cover" },
        ],
      },
      hooks: {
        beforeOperation: [resizeUploadedImage],
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
      slug: "categories",
      admin: { useAsTitle: "title", defaultColumns: ["title", "slug"] },
      fields: [
        { name: "title", type: "text", required: true, unique: true },
        { name: "slug", type: "text", required: true, unique: true, index: true },
      ],
    },
    {
      // Retained because the database already contains this collection and
      // Payload's locked-document relations reference it.
      slug: "rich-content",
      admin: { useAsTitle: "id", hidden: true },
      fields: [
        { name: "content", type: "json" },
      ],
    },
    {
      slug: "news-feed",
      // Payload 3.86's Postgres adapter can return an undefined row while
      // upserting admin document locks against this manually migrated table.
      // Disable only the collaborative lock workflow; editing and saving are
      // otherwise unchanged.
      lockDocuments: false,
      defaultSort: "-publishedAt",
      admin: { useAsTitle: "title", defaultColumns: ["title", "category", "publishedAt"] },
      hooks: {
        beforeValidate: [async ({ data, req, originalDoc }: { data?: Record<string, unknown>; req: any; originalDoc?: Record<string, unknown> }) => {
          const next = { ...data };
          const generatedPreviousSlug = originalDoc?.title ? slugFromTitle(originalDoc.title) : "";
          if (!next.slug || (originalDoc && next.slug === generatedPreviousSlug)) next.slug = slugFromTitle(next.title) || `news-${Date.now()}`;
          if (next.categoryRef && !next.category) {
            const category = await req.payload.findByID({ collection: "categories", id: next.categoryRef, depth: 0 });
            if (category?.title) next.category = category.title;
          }
          return next;
        }],
      },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true, index: true },
        {
          name: "category", type: "select", required: true, index: true, options: [
            { label: "부동산 정보", value: "property-info" },
            { label: "어스틴 소식", value: "austin-news" },
            { label: "자료실 · 교육/학군", value: "resources/school" },
            { label: "자료실 · 한인업소록", value: "resources/koreanbusiness" },
            { label: "자료실 · 관광명소", value: "resources/tours" },
            { label: "자료실 · 사진/풍경", value: "resources/gallery" },
          ]
        },
        { name: "legacy_category", type: "text", index: true, admin: { hidden: true } },
        { name: "legacyId", type: "text", unique: true, index: true, admin: { hidden: true } },
        { name: "legacyBoardId", label: "Legacy menu", type: "select", options: legacyBoardOptions, index: true, admin: { description: "Assign the legacy menu/board for restored navigation and filtering." } },
        { name: "legacyUrl", type: "text", unique: true, index: true, admin: { hidden: true } },
        { name: "legacyContent", label: "Legacy Content HTML", type: "code", admin: { language: "html", description: "Migrated legacy HTML content.", condition: (_data, _siblingData, { operation }) => operation !== "create" } },
        { name: "rawContent", label: "Raw HTML", type: "textarea", admin: { description: "Optional raw HTML source for new posts." } },
        {
          name: "richContent",
          label: "Rich Content",
          type: "richText",
          editor: lexicalEditor(),
          admin: { description: "Compose the article with formatting and R2-backed media uploads." },
        },
        { name: "publishedAt", type: "date", required: true, index: true, defaultValue: () => new Date().toISOString() },
        { name: "legacyViewCount", type: "number", required: true, defaultValue: 0, min: 0, admin: { hidden: true } },
        { name: "viewCount", type: "number", required: true, defaultValue: 0, min: 0, admin: { hidden: true } },
        { name: "readCount", type: "number", required: true, defaultValue: 0, min: 0, admin: { hidden: true } },
        { name: "legacyAuthor", type: "text", admin: { hidden: true } },
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
          name: "heroImages",
          label: "Homepage hero images",
          type: "upload",
          relationTo: "media",
          hasMany: true,
          admin: { description: "Upload multiple homepage hero images. One is selected randomly per visit; the gradient overlay remains applied." },
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
            {
              name: "bannerImages",
              label: "Menu banner images",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              admin: { description: "Upload one or more banners for this menu. The first image is used by default." },
            },
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
