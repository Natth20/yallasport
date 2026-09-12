const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  await prisma.user.upsert({
    where: { email: 'system@yallasport.com' },
    update: {},
    create: {
      email: 'system@yallasport.com',
      name: 'Yalla Sport Bot',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ System user ready. No mock matches, news, or VOD were created.');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
