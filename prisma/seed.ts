import { PrismaClient, IdeaType, Platform } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_DEFINITIONS } from "../src/lib/ai/roles";

const prisma = new PrismaClient();

const STARTER_IDEAS: { type: IdeaType; title: string; description: string }[] = [
  {
    type: IdeaType.VIDEO,
    title: "Build-in-public: day 1 of a real micro-SaaS",
    description:
      "Screen-recorded first commit through first paying customer, revenue shown honestly including the flops.",
  },
  {
    type: IdeaType.VIDEO,
    title: "Vibe coding a SaaS UI in a weekend with AI",
    description: "Full build walkthrough that funnels into a UI kit sale at the end.",
  },
  {
    type: IdeaType.VIDEO,
    title: "AI automation consultant series: one real SMB workflow",
    description: "Show a concrete before/after automation, builds authority for consulting leads.",
  },
  {
    type: IdeaType.VIDEO,
    title: "Interactive tool embedded in a blog post",
    description: "Build a tiny free AI-powered tool live and embed it — most creators can't do this, it's a real moat.",
  },
  {
    type: IdeaType.VIDEO,
    title: "Cursor vs Windsurf for shipping a real feature",
    description: "Head-to-head comparison with a real task, high commercial search intent.",
  },
  {
    type: IdeaType.MICRO_SAAS,
    title: "Productized business-health dashboard",
    description:
      "Multi-tenant SaaS version of a proven personal dashboard — traffic, CAC, LTV, MRR, retention, all in one console for solo founders.",
  },
  {
    type: IdeaType.MICRO_SAAS,
    title: "Founder digest automation",
    description: "Auto-pulls Stripe/analytics/social into a weekly summary email for solo founders.",
  },
  {
    type: IdeaType.MICRO_SAAS,
    title: "AI competitor-monitoring tool",
    description: "Tracks competitor pricing/changelog pages and digests changes weekly.",
  },
  {
    type: IdeaType.MICRO_SAAS,
    title: "Newsletter-to-everything repurposing tool",
    description: "Auto-turns a long post into threads, shorts scripts, and newsletter blurbs.",
  },
  {
    type: IdeaType.MICRO_SAAS,
    title: "Indie Metrics",
    description: "Lightweight, privacy-friendly MRR/analytics tracker built for solo founders, cheaper and simpler than incumbents.",
  },
  {
    type: IdeaType.GADGET,
    title: "Figma plugin: AI microcopy generator",
    description: "Narrow, high-utility plugin that drafts UI microcopy inline in Figma.",
  },
  {
    type: IdeaType.GADGET,
    title: "Prompt-to-UI mini tool",
    description: "Generate a working component from natural language plus a reference image.",
  },
  {
    type: IdeaType.GADGET,
    title: "AI meeting-notes-to-tasks toy",
    description: "Turns a rough voice memo into a prioritized backlog, built as a weekend gadget first.",
  },
  {
    type: IdeaType.NEWSLETTER_RESEARCH,
    title: "Weekly AI coding tool roundup",
    description: "Track new releases and workflow changes across AI pair-programming tools for the newsletter.",
  },
];

async function main() {
  console.log("Seeding agent roles...");
  for (const role of ROLE_DEFINITIONS) {
    await prisma.agentRole.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        title: role.title,
        description: role.description,
        systemPrompt: role.systemPrompt,
        icon: role.icon,
      },
      create: {
        key: role.key,
        name: role.name,
        title: role.title,
        description: role.description,
        systemPrompt: role.systemPrompt,
        icon: role.icon,
      },
    });
  }

  console.log("Seeding channels...");
  for (const platform of Object.values(Platform)) {
    await prisma.channel.upsert({
      where: { platform },
      update: {},
      create: { platform },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  let admin = null;
  if (adminEmail && adminPassword) {
    console.log(`Seeding admin user ${adminEmail}...`);
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: { email: adminEmail, passwordHash, name: "Founder" },
    });
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user seed.");
  }

  console.log("Seeding starter ideas...");
  for (const idea of STARTER_IDEAS) {
    const existing = await prisma.idea.findFirst({ where: { title: idea.title } });
    if (existing) continue;
    await prisma.idea.create({
      data: {
        type: idea.type,
        title: idea.title,
        description: idea.description,
        createdById: admin?.id,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
