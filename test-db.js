const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Connection OK:', result);
  } catch (e) {
    console.error('Connection Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
