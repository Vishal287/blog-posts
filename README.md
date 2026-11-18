# blog-posts

The Markdown source for my blog. This repo holds no website, only content and automation. My React portfolio fetches the generated post list from:

```
https://raw.githubusercontent.com/<your-username>/blog-posts/main/index.json
```

and each post's Markdown from:

```
https://raw.githubusercontent.com/<your-username>/blog-posts/main/<file>
```

where `<file>` is the post's `file` value from `index.json` (for example `posts/hello-world.md`).

## Layout

| Path | Contents |
| --- | --- |
| `posts/` | One `.md` file per post. The file name is the slug plus `.md`. |
| `images/` | Images used in posts. |
| `scripts/build-index.mjs` | Checks every post and writes `index.json`. |
| `scripts/new-post.mjs` | Creates a new draft post. |
| `.github/workflows/build-index.yml` | Rebuilds `index.json` on every push to `main` that changes `posts/`. |
| `index.json` | Generated list of published posts. Don't edit it by hand. |

## Setup

Requires Node 20 or newer.

```bash
npm install
```

## Working with posts

### Create a post

```bash
npm run new-post "My Post Title"
```

This creates `posts/my-post-title.md` with today's date and `draft: true`. It refuses to overwrite a file that already exists.

### Preview

Open the `.md` file in your editor's Markdown preview (in VS Code, press `Cmd+Shift+V`). To check the front matter and see what the portfolio will receive, run:

```bash
npm run build:index
```

Drafts are skipped, so a new post won't appear in `index.json` yet. If a post has a problem, the build stops and names the file and the field.

### Publish

1. Set `draft: false` in the post's front matter.
2. Commit and push to `main`:

   ```bash
   git add posts/my-post-title.md
   git commit -m "post: My Post Title"
   git push
   ```

The GitHub Action rebuilds `index.json` and commits it as `chore: update blog index`. The portfolio picks up the change on its next fetch. raw.githubusercontent.com caches files for up to about 5 minutes.

### Edit

Change the file and push. Keep the `slug` the same as the file name. If you change a slug, rename the file to match, and expect any old links to that slug to stop working.

### Delete

Remove the file and push:

```bash
git rm posts/my-post-title.md
git commit -m "post: remove My Post Title"
git push
```

To hide a post without deleting it, set `draft: true` instead. Delete any images in `images/` that only that post used.

### Images

Put images in `images/` and reference them by their full raw URL so they also load inside the portfolio:

```markdown
![Alt text](https://raw.githubusercontent.com/<your-username>/blog-posts/main/images/photo.png)
```

## Front matter reference

Every post starts with a YAML block like this:

```yaml
---
title: "My Post Title"
slug: my-post-title
date: 2026-11-18
description: "One or two sentences shown in the post list."
tags: [react, javascript]
cover: "https://raw.githubusercontent.com/<your-username>/blog-posts/main/images/cover.png"
draft: false
---
```

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `title` | Yes | string | Shown as the post title. |
| `slug` | Yes | string | Lowercase letters, numbers and hyphens. Must match the file name without `.md`, and be unique. |
| `date` | Yes | `YYYY-MM-DD` | Publication date. Posts are sorted newest first. |
| `description` | No | string | Short summary for the post list. |
| `tags` | No | array of strings | For example `[react, css]`. |
| `cover` | No | string (URL) | Cover image URL. |
| `draft` | No | boolean | `true` keeps the post out of `index.json`. Leaving it out means published. |

## index.json format

An array of published posts, newest first:

```json
[
  {
    "title": "Hello World",
    "slug": "hello-world",
    "date": "2026-11-18",
    "description": "…",
    "tags": ["meta", "introduction"],
    "cover": "",
    "file": "posts/hello-world.md",
    "readingTime": 1
  }
]
```

`readingTime` is in minutes, at about 200 words per minute, with a minimum of 1.
