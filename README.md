++ A:\Programming\Project\LifeOS\README.md
# 🚀 LifeOS

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-blue?logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-blue?logo=tailwindcss&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-enabled-0ea5a4)
![License](https://img.shields.io/badge/license-MIT-yellow)

<p align="center">🚀</p>

Your life, quantified. Your assistant, empowered.

## Features

- 🧭 **Dashboard** — Overview of your life metrics and quick actions
- 💰 **Money** — Accounts, transactions, budgets and net worth
- ✅ **Habits** — Track streaks, completions and heatmaps
- ❤️ **Health** — Log health metrics, moods and charts
- 📝 **Journal** — Daily entries, inline edit and on-this-day history
- 🤖 **AI Assistant** — Context-aware assistant with LifeOS snapshot

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Add environment variables in `.env.local` (do NOT commit this file)

Required keys (at least one AI key):

- `GROQ_API_KEY`  (Groq / OpenAI-compatible)
- `OPENAI_API_KEY` (optional fallback)
- `COHERE_API_KEY` (optional)
- `DATABASE_URL` (e.g., `file:./dev.db`)

3. Push Prisma schema to the database

```bash
npx prisma db push
```

4. Run the dev server

```bash
npm run dev
```

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3.0-blue?logo=tailwindcss&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2.0-blue?logo=prisma) ![SQLite](https://img.shields.io/badge/SQLite-3.0-lightgrey) ![Groq](https://img.shields.io/badge/Groq-enabled-0ea5a4) ![Recharts](https://img.shields.io/badge/Recharts-2.0-red) ![Lucide](https://img.shields.io/badge/Lucide-icons-222)

## Screenshots

| Dashboard | Money |
|---|---|
| ![](https://via.placeholder.com/600x300?text=Dashboard+Coming+Soon) | ![](https://via.placeholder.com/600x300?text=Money+Module+Coming+Soon) |

| Habits | Health |
|---|---|
| ![](https://via.placeholder.com/600x300?text=Habits+Heatmap+Coming+Soon) | ![](https://via.placeholder.com/600x300?text=Health+Charts+Coming+Soon) |

## Architecture

Simple overview:

```
LifeOS (Next.js App)
├─ app/
│  ├─ dashboard (server)
│  ├─ money/ (accounts, transactions)
│  ├─ habits/ (tracking, heatmap)
│  ├─ health/ (metrics, charts)
│  ├─ journal/ (entries, on-this-day)
│  └─ assistant/ (AI chat + snapshot)
├─ lib/ (helpers + prisma client)
├─ prisma/ (schema.prisma)
└─ dev.db (local sqlite)

Flow: UI → Server Actions / API → Prisma → SQLite
AI Assistant: receives snapshot from Prisma → calls Groq/OpenAI → streams response to client
```

## Roadmap

- Mobile apps (React Native / Expo)
- Push notifications and reminders
- OAuth authentication and multi-user support
- Offline-first sync for mobile
- More AI-driven templates and workflows

## Contributing

Contributions are welcome — please open issues and PRs. Before contributing:

- Fork the repo and create a feature branch
- Keep `.env.local` and `dev.db` out of commits
- Run `npm install` and `npx prisma db push` to sync the schema
- Follow code style and add small, focused PRs

## License

This project is licensed under the MIT License — see `LICENSE` for details.

---

Made with ❤️ for building a better daily system.
# LifeOS (Next.js + TypeScript + Tailwind + Prisma)

This is a starter Next.js 14 project using the App Router, TypeScript, Tailwind CSS, and Prisma with SQLite.

Getting started:

1. Install dependencies: `npm install` or `pnpm install`
2. Run dev server: `npm run dev`
3. Initialize Prisma client: `npx prisma generate`
