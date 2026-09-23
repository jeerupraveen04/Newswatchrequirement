/**
 * Idempotent seed (REQ-SYS-521) using Drizzle.
 * Seeds: roles + permissions, sample region tree, categories, static pages,
 * and one user of each role (super_admin, admin, reporter, user).
 *
 * Run: pnpm --filter @newswatch/api db:seed
 */
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db, closeDb } from "../src/db/client";
import {
  adminRegionScopes,
  appSettings,
  categories,
  permissions,
  regionType,
  reporterProfiles,
  reporterRegionScopes,
  regions,
  rolePermissions,
  roles,
  users,
} from "../src/db/schema";

const DEV_PASSWORD = "Password123!";

async function seedRolesAndPermissions() {
  const perms = [
    "article.create", "article.submit", "article.approve", "article.reject",
    "article.publish", "article.hard_delete", "category.manage", "user.manage",
    "user.suspend", "user.soft_delete", "user.restore", "user.purge",
    "reporter.approve", "region.manage", "app_settings.write", "analytics.view", "audit.view",
  ];
  for (const name of perms) {
    await db.insert(permissions).values({ name }).onConflictDoNothing({ target: permissions.name });
  }

  const roleMap: Record<string, string[]> = {
    user: [],
    reporter: ["article.create", "article.submit"],
    admin: [
      "article.approve", "article.reject", "article.publish", "category.manage",
      "user.manage", "user.suspend", "reporter.approve", "analytics.view",
    ],
    super_admin: perms,
  };

  for (const [roleName, permNames] of Object.entries(roleMap)) {
    await db.insert(roles).values({ name: roleName, description: `${roleName} role` }).onConflictDoNothing({ target: roles.name });
    const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    for (const pn of permNames) {
      const [perm] = await db.select().from(permissions).where(eq(permissions.name, pn)).limit(1);
      if (!perm || !role) continue;
      await db.insert(rolePermissions).values({ roleId: role.id, permissionId: perm.id }).onConflictDoNothing();
    }
  }
}

interface RegionSeed {
  name: string;
  type: (typeof regionType.enumValues)[number];
  slug: string;
  children?: RegionSeed[];
}

async function seedRegions() {
  const tree: RegionSeed[] = [
    {
      name: "Telangana", type: "state", slug: "telangana",
      children: [
        {
          name: "Hyderabad", type: "district", slug: "hyderabad",
          children: [
            {
              name: "Secunderabad", type: "constituency", slug: "secunderabad",
              children: [
                { name: "Bowenpally", type: "mandal", slug: "bowenpally" },
                { name: "Tirumalgiri", type: "mandal", slug: "tirumalgiri" },
              ],
            },
            {
              name: "Khairatabad", type: "constituency", slug: "khairatabad",
              children: [{ name: "Banjara Hills", type: "mandal", slug: "banjara-hills" }],
            },
          ],
        },
        { name: "Warangal", type: "district", slug: "warangal", children: [] },
      ],
    },
  ];

  const bySlug: Record<string, string> = {};
  async function walk(nodes: RegionSeed[], parentId: string | null, order: number) {
    let i = order;
    for (const node of nodes) {
      const [existing] = await db.select().from(regions).where(eq(regions.slug, node.slug)).limit(1);
      let id: string;
      if (existing) {
        await db.update(regions).set({ name: node.name, type: node.type, parentId }).where(eq(regions.id, existing.id));
        id = existing.id;
      } else {
        const [created] = await db
          .insert(regions)
          .values({ name: node.name, type: node.type, slug: node.slug, parentId, sortOrder: i })
          .returning();
        id = created!.id;
      }
      bySlug[node.slug] = id;
      if (node.children?.length) await walk(node.children, id, 0);
      i += 1;
    }
  }
  await walk(tree, null, 0);
  return bySlug;
}

async function seedCategories() {
  const cats = [
    { name: "India", slug: "india", sort: 1 },
    { name: "World", slug: "world", sort: 2 },
    { name: "Sports", slug: "sports", sort: 3 },
    { name: "Business", slug: "business", sort: 4 },
    { name: "Technology", slug: "technology", sort: 5 },
    { name: "Entertainment", slug: "entertainment", sort: 6 },
    { name: "Health", slug: "health", sort: 7 },
  ];
  for (const c of cats) {
    await db
      .insert(categories)
      .values({ name: c.name, slug: c.slug, sortOrder: c.sort })
      .onConflictDoUpdate({ target: categories.slug, set: { name: c.name, sortOrder: c.sort } });
  }
}

async function seedStaticPages() {
  const pages = [
    { key: "static.about", value: { title: "About NewsWatch", body: "Independent, mobile-first journalism." } },
    { key: "static.privacy", value: { title: "Privacy Policy", body: "We minimise PII and never sell data." } },
    { key: "static.terms", value: { title: "Terms of Service", body: "Use of NewsWatch is subject to these terms." } },
  ];
  for (const p of pages) {
    await db
      .insert(appSettings)
      .values({ key: p.key, value: p.value, isPublic: true })
      .onConflictDoNothing({ target: appSettings.key });
  }
}

async function seedUsers(regionSlug: Record<string, string>) {
  const passwordHash = await argon2.hash(DEV_PASSWORD);
  const seedUsersList = [
    { email: "super@newswatch.app", username: "superadmin", displayName: "Sana Khan", role: "super_admin" as const },
    { email: "admin@newswatch.app", username: "vikram", displayName: "Vikram Rao", role: "admin" as const },
    { email: "reporter@newswatch.app", username: "rahul", displayName: "Rahul Verma", role: "reporter" as const },
    { email: "user@newswatch.app", username: "aarav", displayName: "Aarav Sharma", role: "user" as const },
  ];

  const created: Record<string, string> = {};
  for (const u of seedUsersList) {
    const [existing] = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (existing) {
      await db
        .update(users)
        .set({ displayName: u.displayName, role: u.role, isDeleted: false, deletedAt: null })
        .where(eq(users.id, existing.id));
      created[u.role] = existing.id;
    } else {
      const [row] = await db
        .insert(users)
        .values({
          email: u.email,
          username: u.username,
          displayName: u.displayName,
          passwordHash,
          role: u.role,
          status: "active",
          emailVerified: true,
        })
        .returning();
      created[u.role] = row!.id;
    }
  }

  const hyderabad = regionSlug["hyderabad"];
  if (hyderabad && created.admin) {
    await db
      .insert(adminRegionScopes)
      .values({ userId: created.admin, regionId: hyderabad })
      .onConflictDoNothing();
  }

  const telangana = regionSlug["telangana"];
  if (created.reporter) {
    const [existing] = await db.select().from(reporterProfiles).where(eq(reporterProfiles.userId, created.reporter)).limit(1);
    if (existing) {
      await db.update(reporterProfiles).set({ status: "approved" }).where(eq(reporterProfiles.userId, created.reporter));
    } else {
      await db.insert(reporterProfiles).values({
        userId: created.reporter,
        status: "approved",
        fullName: "Rahul Verma",
        bio: "Freelance journalist covering state politics.",
        beats: ["politics", "business"],
        phone: "+919000012345",
      });
    }
    if (telangana) {
      await db
        .insert(reporterRegionScopes)
        .values({ userId: created.reporter, regionId: telangana })
        .onConflictDoNothing();
    }
  }
}

async function main() {
  console.log("Seeding NewsWatch (Drizzle)...");
  await seedRolesAndPermissions();
  const regionSlug = await seedRegions();
  await seedCategories();
  await seedStaticPages();
  await seedUsers(regionSlug);
  console.log("Seed complete.");
  console.log(`Dev password for all seeded users: ${DEV_PASSWORD}`);
  console.log("  super@newswatch.app | admin@newswatch.app | reporter@newswatch.app | user@newswatch.app");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });

