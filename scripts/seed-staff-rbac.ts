import { randomBytes } from 'crypto';
import { prisma } from '../src/lib/prisma';

const ROLES = [
  'EDITOR',
  'NEWS_EDITOR',
  'MODERATOR',
  'CONTENT_MANAGER',
  'ADS_MANAGER',
] as const;

async function main() {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const rows: Array<{ role: string; email: string; sessionToken: string }> = [];

  for (const role of ROLES) {
    const email = `qa.${role.toLowerCase()}@yallasport.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { role, name: `QA ${role}` },
      create: {
        email,
        name: `QA ${role}`,
        role,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, role: true },
    });
    const sessionToken = randomBytes(32).toString('hex');
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.session.create({
      data: { sessionToken, userId: user.id, expires },
    });
    rows.push({ role: user.role, email: user.email, sessionToken });
  }

  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true, role: true },
  });
  let superSession: string | null = null;
  if (superAdmin) {
    superSession = randomBytes(32).toString('hex');
    await prisma.session.create({
      data: { sessionToken: superSession, userId: superAdmin.id, expires },
    });
    rows.unshift({
      role: superAdmin.role,
      email: superAdmin.email,
      sessionToken: superSession,
    });
  }

  console.log(JSON.stringify({ ok: true, cookie: 'authjs.session-token', rows }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
