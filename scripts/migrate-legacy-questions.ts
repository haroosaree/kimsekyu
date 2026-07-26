import { getPayload } from "payload";
import config from "../payload.config";

const legacyBoardID = "13";

function decodeEntity(entity: string) {
  const value = entity.startsWith("#x") || entity.startsWith("#X")
    ? Number.parseInt(entity.slice(2), 16)
    : entity.startsWith("#")
      ? Number.parseInt(entity.slice(1), 10)
      : undefined;

  if (value === undefined || !Number.isFinite(value)) return `&${entity};`;
  try {
    return String.fromCodePoint(value);
  } catch {
    return `&${entity};`;
  }
}

function plainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+);/gi, (_, entity: string) => decodeEntity(entity))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function main() {
  const payload = await getPayload({ config });
  const legacyQuestions = await payload.find({
    collection: "news",
    where: { legacyBoardId: { equals: legacyBoardID } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });

  let migrated = 0;
  let removed = 0;
  let normalized = 0;

  for (const legacyQuestion of legacyQuestions.docs) {
    const existing = await payload.find({
      collection: "questions",
      where: { legacyId: { equals: legacyQuestion.legacyId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.totalDocs === 0) {
      const contentHTML = String(legacyQuestion.contentHTML || "");
      await payload.create({
        collection: "questions",
        data: {
          subject: legacyQuestion.title as string,
          message: plainText(contentHTML) || "(Legacy question content)",
          name: (legacyQuestion.legacyAuthor as string) || "Legacy visitor",
          email: `legacy-${legacyQuestion.legacyId}@kimsekyu.com`,
          publishedAt: legacyQuestion.publishedAt,
          viewCount: legacyQuestion.viewCount || legacyQuestion.legacyViewCount || 0,
          legacyId: legacyQuestion.legacyId,
          legacyUrl: legacyQuestion.legacyUrl,
          legacyContentHTML: contentHTML,
          legacyAuthor: legacyQuestion.legacyAuthor as string,
          status: "resolved",
        },
        overrideAccess: true,
      });
      migrated += 1;
    }

    await payload.delete({ collection: "news", id: legacyQuestion.id, overrideAccess: true });
    removed += 1;
  }

  const currentQuestions = await payload.find({ collection: "questions", limit: 500, depth: 0, overrideAccess: true });
  for (const question of currentQuestions.docs) {
    const data: Record<string, string> = {};
    if (!question.publishedAt) data.publishedAt = question.createdAt;
    if (question.legacyContentHTML) {
      const message = plainText(String(question.legacyContentHTML));
      if (message && message !== question.message) {
        data.message = message;
        normalized += 1;
      }
    }
    if (Object.keys(data).length > 0) {
      await payload.update({ collection: "questions", id: question.id, data, overrideAccess: true });
    }
  }

  console.log(`Migrated ${migrated} legacy Q&A records, removed ${removed} board-13 News records, and normalized ${normalized} legacy messages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
