const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Existing tables:', tables.map(t => t.table_name));
    
    // Check if Show exists
    const showCount = await prisma.show.count().catch(e => {
        console.log('Show table does not exist or error:', e.message);
        return -1;
    });
    console.log('Show count:', showCount);

  } catch (e) {
    console.error('Check failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
