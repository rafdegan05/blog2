# Blog & Podcast Platform

A full-featured blog and podcast platform built with **Next.js 16**, **DaisyUI 5**, **Prisma 7**, **PostgreSQL**, and **NextAuth 4**.

## Features

- **Blog** — Create, edit, and publish Markdown-based blog posts with categories, tags, and cover images
- **Podcast** — Publish podcast episodes with audio player, duration, and metadata
- **Authentication** — NextAuth 4 with credential-based login, GitHub and Google OAuth support
- **Comments** — Threaded comment system with reply support
- **Search & Pagination** — Full-text search and paginated listings for posts and podcasts
- **Dashboard** — Author dashboard with statistics and content management
- **SEO** — Sitemap, robots.txt, Open Graph and Twitter Card metadata
- **Themes** — 30+ DaisyUI themes with client-side switcher and persistence
- **Markdown** — Full Markdown rendering with GFM, raw HTML support, and sanitization
- **Docker** — Multi-stage Dockerfile and Docker Compose for production deployment
- **CI/CD** — GitHub Actions workflow with linting, testing, and build verification

## Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) |
| UI         | Tailwind CSS 4, DaisyUI 5          |
| Database   | PostgreSQL 16, Prisma 7            |
| Auth       | NextAuth 4 (JWT strategy)          |
| Language   | TypeScript 5                       |
| Testing    | Vitest, React Testing Library      |
| Linting    | ESLint 9, Prettier 3               |
| Git Hooks  | Husky 9, lint-staged, commitlint   |
| Versioning | standard-version, semantic-release |
| CI/CD      | GitHub Actions                     |
| Deployment | Docker, Docker Compose             |

## Prerequisites

- **Node.js** >= 20
- **PostgreSQL** >= 14 (or use Docker)
- **npm** >= 10

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url> bl-fs
cd bl-fs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Required variables in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/blogpodcast?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: OAuth providers
GITHUB_ID=""
GITHUB_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 4. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or use migrations (production)
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker

### Using Docker Compose (recommended)

Start the full stack (PostgreSQL + App + Prisma Studio):

```bash
docker compose up -d
```

Services:

| Service  | Port | Description         |
| -------- | ---- | ------------------- |
| `app`    | 3000 | Next.js application |
| `db`     | 5432 | PostgreSQL 16       |
| `studio` | 5555 | Prisma Studio (dev) |

Start Prisma Studio (dev profile only):

```bash
docker compose --profile dev up studio -d
```

### Using Dockerfile directly

```bash
# Build the image
docker build -t blogpodcast .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  blogpodcast
```

## Scripts

| Script                  | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Start development server with Turbopack    |
| `npm run build`         | Generate Prisma client + production build  |
| `npm start`             | Start production server                    |
| `npm run lint`          | Run ESLint with auto-fix                   |
| `npm run format`        | Format code with Prettier                  |
| `npm test`              | Run tests with Vitest                      |
| `npm run test:watch`    | Run tests in watch mode                    |
| `npm run test:coverage` | Run tests with coverage report             |
| `npm run db:generate`   | Generate Prisma client                     |
| `npm run db:migrate`    | Run Prisma migrations                      |
| `npm run db:push`       | Push schema to database                    |
| `npm run db:studio`     | Open Prisma Studio                         |
| `npm run db:seed`       | Seed database with sample data             |
| `npm run release`       | Create a new version with standard-version |

## Project Structure

```
bl-fs/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed data
│   └── migrations/             # Database migrations
├── src/
│   ├── __tests__/              # Test files
│   │   ├── setup.ts            # Test setup
│   │   └── components/         # Component tests
│   ├── app/
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth handler
│   │   │   ├── posts/          # Blog post CRUD
│   │   │   ├── podcasts/       # Podcast episode CRUD
│   │   │   └── comments/       # Comment CRUD
│   │   ├── auth/signin/        # Sign-in page
│   │   ├── blog/               # Blog pages
│   │   ├── dashboard/          # Author dashboard
│   │   ├── podcasts/           # Podcast pages
│   │   ├── globals.css         # Global styles + DaisyUI
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   ├── sitemap.ts          # SEO sitemap
│   │   └── robots.ts           # SEO robots.txt
│   ├── components/
│   │   ├── Comments.tsx        # Threaded comments
│   │   ├── Footer.tsx          # Site footer
│   │   ├── MarkdownRenderer.tsx # Markdown rendering
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── Pagination.tsx      # Pagination controls
│   │   ├── PodcastCard.tsx     # Podcast card
│   │   ├── PostCard.tsx        # Blog post card
│   │   ├── Providers.tsx       # Session provider
│   │   ├── SearchBar.tsx       # Search input
│   │   └── ThemeSwitcher.tsx   # Theme selector
│   ├── generated/prisma/       # Generated Prisma client
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config
│   │   └── prisma.ts           # Prisma client singleton
│   └── types/
│       └── next-auth.d.ts      # NextAuth type extensions
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Dev Docker (Prisma Studio)
├── docker-compose.yml          # Docker Compose config
├── vitest.config.ts            # Vitest configuration
├── next.config.ts              # Next.js configuration
├── prisma.config.ts            # Prisma configuration
├── commitlint.config.js        # Commitlint config
├── .lintstagedrc               # lint-staged config
├── .prettierrc                 # Prettier config
└── package.json
```

## Database Models

- **User** — Users with roles (USER, AUTHOR, ADMIN)
- **Post** — Blog posts with title, slug, content (Markdown), excerpt, cover image
- **Podcast** — Podcast episodes with audio URL, duration, description
- **Category** — Content categories (many-to-many with posts and podcasts)
- **Tag** — Content tags (many-to-many with posts and podcasts)
- **Comment** — Threaded comments with parent-child relationships
- **Account / Session / VerificationToken** — NextAuth models

## API Endpoints

### Posts

- `GET /api/posts` — List posts (supports `?search=`, `?page=`, `?category=`, `?tag=`)
- `POST /api/posts` — Create a post (authenticated)
- `GET /api/posts/[slug]` — Get post by slug
- `PUT /api/posts/[slug]` — Update post (owner or admin)
- `DELETE /api/posts/[slug]` — Delete post (owner or admin)

### Podcasts

- `GET /api/podcasts` — List podcasts (supports `?search=`, `?page=`)
- `POST /api/podcasts` — Create a podcast (authenticated)
- `GET /api/podcasts/[slug]` — Get podcast by slug
- `PUT /api/podcasts/[slug]` — Update podcast (owner or admin)
- `DELETE /api/podcasts/[slug]` — Delete podcast (owner or admin)

### Comments

- `GET /api/comments?postId=` — List threaded comments for a post
- `POST /api/comments` — Create a comment (authenticated)
- `PUT /api/comments/[id]` — Update comment (owner or admin)
- `DELETE /api/comments/[id]` — Delete comment (owner or admin)

## Git Workflow

This project uses conventional commits enforced by commitlint and Husky:

```bash
# Examples of valid commit messages
git commit -m "feat: add podcast search functionality"
git commit -m "fix: correct pagination offset calculation"
git commit -m "docs: update README installation steps"
git commit -m "chore: update dependencies"
```

### Creating a release

```bash
npm run release          # Auto-bump version based on commits
npm run release -- --release-as minor  # Force minor bump
npm run release -- --release-as major  # Force major bump
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and commit using conventional commits
4. Push to your fork: `git push origin feat/my-feature`
5. Open a Pull Request

## License

MIT
