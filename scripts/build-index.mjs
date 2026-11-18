// Builds index.json from the front matter of every post in posts/.
// Usage: npm run build:index
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = path.join(ROOT, "posts");
const OUTPUT = path.join(ROOT, "index.json");

const REQUIRED = ["title", "slug", "date"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WORDS_PER_MINUTE = 200;

// gray-matter runs eval() on front matter that opens with "---js" or "---javascript".
// Only YAML is allowed, so a post can never execute code during the build.
const rejectEngine = (lang) => ({
  parse() {
    throw new Error(`"${lang}" front matter is not allowed; use YAML (start the file with ---)`);
  },
});
const UNSAFE_ENGINES_DISABLED = {
  js: rejectEngine("js"),
  javascript: rejectEngine("javascript"),
  coffee: rejectEngine("coffee"),
  coffeescript: rejectEngine("coffeescript"),
  cson: rejectEngine("cson"),
};

// gray-matter turns unquoted YAML dates into Date objects; normalise to YYYY-MM-DD.
function normaliseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return typeof value === "string" ? value.trim() : value;
}

function readingTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

async function main() {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md")).sort();
  const errors = [];
  const seenSlugs = new Map();
  const posts = [];

  for (const file of files) {
    const relPath = `posts/${file}`;
    const raw = await readFile(path.join(POSTS_DIR, file), "utf8");

    let parsed;
    try {
      parsed = matter(raw, { engines: UNSAFE_ENGINES_DISABLED });
    } catch (err) {
      errors.push(`${relPath}: invalid front matter (${err.message})`);
      continue;
    }
    const { data, content } = parsed;
    const fileErrors = [];

    for (const field of REQUIRED) {
      const v = data[field];
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
        fileErrors.push(`missing required field "${field}"`);
      }
    }

    const date = normaliseDate(data.date);
    if (date && !DATE_RE.test(String(date))) {
      fileErrors.push(`"date" must be YYYY-MM-DD (got "${data.date}")`);
    }

    const slug = typeof data.slug === "string" ? data.slug.trim() : data.slug;
    if (slug) {
      if (!SLUG_RE.test(String(slug))) {
        fileErrors.push(`slug "${slug}" must be lowercase letters, numbers and hyphens`);
      }
      const expected = path.basename(file, ".md");
      if (slug !== expected) {
        fileErrors.push(`slug "${slug}" does not match file name (expected "${expected}")`);
      }
      if (seenSlugs.has(slug)) {
        fileErrors.push(`duplicate slug "${slug}" (also used in ${seenSlugs.get(slug)})`);
      } else {
        seenSlugs.set(slug, relPath);
      }
    }

    if (data.tags !== undefined && !Array.isArray(data.tags)) {
      fileErrors.push(`"tags" must be an array`);
    }
    if (data.draft !== undefined && typeof data.draft !== "boolean") {
      fileErrors.push(`"draft" must be true or false`);
    }

    if (fileErrors.length) {
      errors.push(...fileErrors.map((e) => `${relPath}: ${e}`));
      continue;
    }
    if (data.draft === true) continue;

    posts.push({
      title: String(data.title).trim(),
      slug,
      date,
      description: data.description ?? "",
      tags: data.tags ?? [],
      cover: data.cover ?? "",
      file: relPath,
      readingTime: readingTime(content),
    });
  }

  if (errors.length) {
    console.error(`\n✖ build:index failed with ${errors.length} error(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("");
    process.exit(1);
  }

  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  await writeFile(OUTPUT, JSON.stringify(posts, null, 2) + "\n");
  console.log(`✔ Wrote index.json with ${posts.length} published post(s) (${files.length - posts.length} draft(s) skipped).`);
}

main().catch((err) => {
  console.error(`✖ build:index crashed: ${err.message}`);
  process.exit(1);
});
