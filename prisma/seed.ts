import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const defaultPassword = await bcrypt.hash("password123", 12);

  // Create an admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@blog.com" },
    update: { emailVerified: new Date() },
    create: {
      email: "admin@blog.com",
      name: "Admin",
      role: "ADMIN",
      password: defaultPassword,
      bio: "Blog administrator and content creator.",
      emailVerified: new Date(),
    },
  });

  // Create an author user
  await prisma.user.upsert({
    where: { email: "author@blog.com" },
    update: { emailVerified: new Date() },
    create: {
      email: "author@blog.com",
      name: "Author",
      role: "AUTHOR",
      password: defaultPassword,
      bio: "Content author.",
      emailVerified: new Date(),
    },
  });

  // Create a regular reader user
  await prisma.user.upsert({
    where: { email: "reader@blog.com" },
    update: { emailVerified: new Date() },
    create: {
      email: "reader@blog.com",
      name: "Reader",
      role: "USER",
      password: defaultPassword,
      bio: "Blog reader and community member.",
      emailVerified: new Date(),
    },
  });

  // Create categories
  const techCategory = await prisma.category.upsert({
    where: { slug: "technology" },
    update: {},
    create: { name: "Technology", slug: "technology" },
  });

  const devCategory = await prisma.category.upsert({
    where: { slug: "development" },
    update: {},
    create: { name: "Development", slug: "development" },
  });

  // Create tags
  const nextjsTag = await prisma.tag.upsert({
    where: { slug: "nextjs" },
    update: {},
    create: { name: "Next.js", slug: "nextjs" },
  });

  const typescriptTag = await prisma.tag.upsert({
    where: { slug: "typescript" },
    update: {},
    create: { name: "TypeScript", slug: "typescript" },
  });

  const reactTag = await prisma.tag.upsert({
    where: { slug: "react" },
    update: {},
    create: { name: "React", slug: "react" },
  });

  // Create sample posts
  await prisma.post.upsert({
    where: { slug: "getting-started-with-nextjs" },
    update: {},
    create: {
      title: "Getting Started with Next.js",
      slug: "getting-started-with-nextjs",
      excerpt:
        "Learn how to build modern web applications with Next.js, the React framework for production.",
      content: `# Getting Started with Next.js

Next.js is a powerful React framework that makes building web applications a breeze.

## Why Next.js?

- **Server-Side Rendering (SSR)** — Better SEO and faster initial loads
- **Static Site Generation (SSG)** — Pre-render pages at build time
- **API Routes** — Build your API alongside your frontend
- **File-based Routing** — No need for complex routing configurations
- **TypeScript Support** — First-class TypeScript support out of the box

## Getting Started

\`\`\`bash
npx create-next-app@latest my-app --typescript
cd my-app
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
└── lib/
\`\`\`

## Conclusion

Next.js provides everything you need to build production-ready React applications. Start building today!
`,
      published: true,
      authorId: admin.id,
      categories: { connect: [{ id: techCategory.id }, { id: devCategory.id }] },
      tags: { connect: [{ id: nextjsTag.id }, { id: reactTag.id }, { id: typescriptTag.id }] },
    },
  });

  await prisma.post.upsert({
    where: { slug: "mastering-typescript" },
    update: {},
    create: {
      title: "Mastering TypeScript",
      slug: "mastering-typescript",
      excerpt: "A deep dive into TypeScript features that will help you write better, safer code.",
      content: `# Mastering TypeScript

TypeScript adds static typing to JavaScript, helping you catch errors early and write more maintainable code.

## Key Features

### Type Inference
TypeScript can automatically infer types:

\`\`\`typescript
const message = "Hello, World!"; // string
const count = 42; // number
\`\`\`

### Interfaces
Define the shape of objects:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}
\`\`\`

### Generics
Write reusable, type-safe functions:

\`\`\`typescript
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
}
\`\`\`

## Conclusion

TypeScript is an essential tool for modern web development. Start using it today!
`,
      published: true,
      authorId: admin.id,
      categories: { connect: [{ id: devCategory.id }] },
      tags: { connect: [{ id: typescriptTag.id }] },
    },
  });

  // Create sample podcast
  await prisma.podcast.upsert({
    where: { slug: "web-dev-weekly-ep1" },
    update: {},
    create: {
      title: "Web Dev Weekly - Episode 1: The Future of React",
      slug: "web-dev-weekly-ep1",
      description:
        "In our first episode, we discuss the future of React, Server Components, and what it means for web developers.",
      audioUrl: "",
      duration: 2400,
      published: true,
      authorId: admin.id,
      categories: { connect: [{ id: techCategory.id }] },
      tags: { connect: [{ id: reactTag.id }, { id: nextjsTag.id }] },
    },
  });

  console.log("✅ Seeding complete!");
  console.log(`   - Admin user: ${admin.email}`);
  console.log(`   - Categories: ${techCategory.name}, ${devCategory.name}`);
  console.log(`   - Tags: ${nextjsTag.name}, ${typescriptTag.name}, ${reactTag.name}`);
  console.log("   - 2 blog posts created");
  console.log("   - 1 podcast episode created");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
