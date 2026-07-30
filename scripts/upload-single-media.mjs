import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const source = "http://kimsekyu.com/wp-content/uploads/kboard_attached/bbs/tours/81/image_5655590.jpg";
const key = "legacy/wordpress/uploads/kboard_attached/bbs/tours/81/image_5655590.jpg";
const response = await fetch(source);
if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
const client = new S3Client({ endpoint: process.env.R2_ENDPOINT, region: "auto", credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: Buffer.from(await response.arrayBuffer()), ContentType: response.headers.get("content-type") || "image/jpeg" }));
console.log(`Uploaded ${key}`);
