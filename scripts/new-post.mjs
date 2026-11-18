// Creates a new draft post.
// Usage: npm run new-post "My Post Title"
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = path.join(ROOT, "posts");

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error('Usage: npm run new-post "My Post Title"');
  process.exit(1);
}

const slug = title
  .normalize("NFKD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug) {
  console.error(`✖ Could not build a slug from "${title}". Use letters or numbers in the title.`);
  process.exit(1);
}

// Local date, not UTC, so the date matches the author's calendar day.
const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
].join("-");

const file = path.join(POSTS_DIR, `${slug}.md`);
const content = `---
title: ${JSON.stringify(title)}
slug: ${slug}
date: ${today}
description: ""
tags: []
cover: ""
draft: true
---

Write your post here.
`;

await mkdir(POSTS_DIR, { recursive: true });
try {
  // "wx" fails if the file already exists, so nothing is ever overwritten.
  await writeFile(file, content, { flag: "wx" });
} catch (err) {
  if (err.code === "EEXIST") {
    console.error(`✖ posts/${slug}.md already exists. Pick a different title or edit that file.`);
    process.exit(1);
  }
  throw err;
}
console.log(`✔ Created posts/${slug}.md (draft: true)`);
