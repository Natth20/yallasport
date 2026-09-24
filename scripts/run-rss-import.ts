import { importFromRSS } from "@/lib/news/rss-service";
import { TRUSTED_RSS_FEEDS } from "@/lib/news/trusted-sources";

async function main() {
  let total = 0;
  for (const feed of TRUSTED_RSS_FEEDS) {
    console.log(`\n📡 Importing from: ${feed.name}`);
    try {
      const result = await importFromRSS(feed.url);
      console.log(`  ✅ Imported: ${result.imported}`);
      total += result.imported;
    } catch (err) {
      console.error(`  ❌ Error:`, (err instanceof Error ? err.message : err));
    }
  }
  console.log(`\n🎉 Total imported: ${total}`);
  process.exit(0);
}

main();
