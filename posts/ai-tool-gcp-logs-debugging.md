---
title: "I Built an AI Tool That Reads My GCP Logs and Fixes the Bug for Me"
slug: ai-tool-gcp-logs-debugging
date: 2026-11-22
description: "How I combined the GCP CLI, Claude Code and my local codebase to cut log debugging from 30-45 minutes to about 15, without handing an AI full access to production logs."
tags: ["GCP", "Logging", "Claude Code", "Debugging", "AI"]
cover: "https://raw.githubusercontent.com/Vishal287/blog-posts/main/images/ai-tool-gcp-logs-debugging-cover.png"
draft: false 
---

Something breaks in production. You open GCP Logging, scroll through hundreds of entries, and copy the useful bits into your AI coding assistant. Then you explain the codebase again, and the issue again, and hope it understands enough to help.

I was doing that almost every day. So I built a small tool that does most of it for me. It pulls the logs, strips out sensitive data, hands the right context to Claude Code, and gives me a root cause analysis (RCA) and a fix I can review. In this post I'll walk you through why I built it, how it works, and what it changed for me.

## AI made us ship faster, but debugging stayed slow

I'm a software developer with 3+ years of experience. Like most teams right now, my company has been adopting AI quickly. I've been using Claude Code for the last few months and the difference is huge: features that used to take a full sprint now take five or six days, tests included.

So delivery got faster. But monitoring and observability didn't. We have automated alerts and thresholds, but when one fires, someone still has to open the logs and debug.

That part was painful for me. When I got stuck on an issue, I had to collect the context by hand and paste it into my Claude Code session. And for security reasons, giving Claude Code direct access to our logs wasn't an option. Even if it were, I'd still end up doing the investigation myself and explaining everything.

I looked for an existing tool or workflow that solved this the way I wanted. I couldn't find one, so I combined a couple of approaches and built my own.

## The idea: logs + Claude Code + the codebase

The tool connects three things:

1. **The GCP CLI**, to fetch logs
2. **Claude Code**, to analyze them and suggest fixes
3. **The local codebase**, so Claude Code can see the code that actually produced the error

Quick confession: I vibe coded the whole app. But the idea and the design are mine. I explained to the coding agent exactly how it should work, and I understand what's happening inside it.

## How I built it

### 1. Frontend first

I started with the frontend. I wanted to figure out what I needed to see and what would be easy to read before writing any backend logic. Once that was clear, I moved to the backend, which uses Express and plain JavaScript.

### 2. A restricted GCP account

I created a new GCP account with limited permissions. It can fetch logs and nothing else. I set it up on my local machine so the tool runs locally.

### 3. A script to fetch logs

The first backend script fetches logs from GCP for a given time window and stores them on my machine. No exporting or uploading logs from somewhere else, which keeps things fast.

### 4. A script to run Claude Code

The second script runs Claude Code with strict restrictions, specific skills it's allowed to use, and a prepared prompt. On top of these two scripts I built APIs that send structured data to the frontend.

### 5. Project configuration

I made a JSON config file that holds the details of each GCP project: region, service name, service type and so on. In the UI there's a form to add a project, and it saves straight into that file. Now I can work with multiple projects without typing the configuration every time.

The form also asks for the local path of the cloned repo. That's how the tool knows where the code for each project lives.

## What the workflow looks like now

Here's what happens when I use it:

1. **I pick a time window.** The backend starts a child process that fetches the logs from GCP and saves them in a local folder.
2. **The dashboard shows the errors.** I can see a list of errors with some analytics: when errors spiked, and how many times each error happened in that window.
3. **I click "Generate report".** The tool sends Claude Code the relevant information, not the full raw logs. GCP already groups the logs, so I only pass what's needed. Before anything goes out, IPs, headers and other sensitive data are masked.
4. **Claude Code writes the RCA.** It has the error context and the path to the local repo, so it can trace the error back to the code and explain the root cause.
5. **I click "Fix".** Claude Code fixes the issue in my local code. Since it already has the full context, this is quick.
6. **I review, test and open a PR.** This step stays with me. I check the changes, run the tests and create the pull request.

I don't paste anything by hand anymore.

## The results

- **Less time per issue.** Checking logs used to take me 30-45 minutes. Now it's about 15 minutes, and that includes a proper fix.
- **Hidden issues got solved.** Some bugs were hard to debug because they happened behind the scenes. With this tool, issues like that got fixed in a day.
- **One-click reports.** If I need to share an error report with my team, I click once and it's ready.
- **I can multitask.** While Claude Code is debugging and fixing, I work on something else.

## Questions you might have

**"Why not just check the logs in the GCP console?"**
You can, but it's manual. And to actually fix the problem, I'd still have to dig deeper and pass all the context to Claude Code myself.

**"Why not give Claude Code direct access to the GCP CLI?"**
I work in the service sector, so security comes first. Logs contain a lot of sensitive information, and they need to be filtered before any AI sees them. A restricted account plus masking gives me that control.

**"Couldn't you use the Claude browser extension instead?"**
That helps you read logs, but debugging still needs access to the code. And if I gave it repo access that way, I'd still have to verify and test every change. My setup keeps the code local and the review step in my hands.

## What's next

This is still a basic version. Whenever I run into a new need, I'll add it.

If your team is shipping faster with AI but still debugging by hand, try connecting your logs, your codebase and your coding agent in a similar way. Even a simple version can save you a lot of time.

Have questions or ideas on how to improve it? reach out to me. I'd love to hear how you're handling debugging on your team.
