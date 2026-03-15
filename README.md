# HeyCoach 🏒

**The ultimate youth hockey drill platform for coaches — Rail Dawgs Edition.**

Built for the Worcester Junior Railers coaching staff to create, share, and manage hockey drills and practice plans with AI assistance.

## Features

- **Drill Library** — Create, categorize, and share drills by age group, position, skill, and practice phase
- **Practice Plan Builder** — Select drills, set durations, add coaching notes, and save/share complete practice plans
- **AI Coach Chat** — Chat with Claude (AI) to get drill suggestions, review plans, and get coaching advice
- **Team Collaboration** — Share drills and plans publicly with other coaches
- **Rail Dawgs Themed** — Designed with Worcester Junior Railers colors and spirit

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
Copy `.env.local` and fill in your values:
```bash
cp .env.local.example .env.local
```

Required env vars:
```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="your-anthropic-api-key"  # Get from console.anthropic.com
```

### 3. Set up database
```bash
npm run db:push
```

### 4. Seed with sample data (optional)
```bash
npm run db:seed
```
Demo login: `coach@juniorrailers.com` / `heycoach123`

### 5. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 14** (App Router) — Full-stack React framework
- **TypeScript** — Type safety throughout
- **Tailwind CSS** — Utility-first styling with Rail Dawgs theme
- **Prisma + SQLite** — Database ORM (easy to switch to PostgreSQL for production)
- **NextAuth.js** — Authentication with credentials provider
- **Anthropic Claude API** — AI coaching chat powered by `claude-sonnet-4-6`

## Drill Categories

**Age Groups:** 8U (Mites), 10U (Squirts), 12U (Peewees), 14U (Bantams), 16U/18U (Midgets), Adult

**Positions:** All, Forwards, Defensemen, Goalies, Centers, Wingers

**Skills:** Skating, Passing, Shooting, Puck Handling, Defense, Goaltending, Conditioning, Team Systems, Face-offs, Power Play, Penalty Kill

**Phases:** Warm-up, Skill Development, Scrimmage, Cool-down

## Deployment

For production, consider:
- Switch `DATABASE_URL` to PostgreSQL (update `prisma/schema.prisma` provider)
- Set `NEXTAUTH_URL` to your domain
- Deploy to Vercel, Railway, or any Node.js host

---

*Go Rail Dawgs! 🐾*
