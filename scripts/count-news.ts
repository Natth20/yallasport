import { prisma } from "@/lib/prisma"; async function main() { const r = await prisma.news.groupBy({ by: ["status"], _count: true }); console.log(JSON.stringify(r)); process.exit(0); } main();
