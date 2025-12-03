/**
 * Setup PostgreSQL Trigram Extension for Autocomplete
 *
 * This script enables the pg_trgm extension and creates trigram indexes
 * for fuzzy autocomplete functionality.
 *
 * Run with: bunx tsx scripts/setup-trigram.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTrigram() {
  console.log('Setting up PostgreSQL trigram extension...\n');

  try {
    // 1. Enable pg_trgm extension
    console.log('1. Enabling pg_trgm extension...');
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);
    console.log('   pg_trgm extension enabled');

    // 2. Create trigram index on prompts.title
    console.log('2. Creating trigram index on prompts.title...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS prompts_title_trgm_idx
      ON prompts USING GIN (title gin_trgm_ops);
    `);
    console.log('   Index prompts_title_trgm_idx created');

    // 3. Create trigram index on prompts.content
    console.log('3. Creating trigram index on prompts.content...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS prompts_content_trgm_idx
      ON prompts USING GIN (content gin_trgm_ops);
    `);
    console.log('   Index prompts_content_trgm_idx created');

    // 4. Create a combined index on title for faster prefix matching
    console.log('4. Creating btree index for prefix matching...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS prompts_title_lower_idx
      ON prompts (LOWER(title) varchar_pattern_ops);
    `);
    console.log('   Index prompts_title_lower_idx created');

    // 5. Verify indexes exist
    console.log('\n5. Verifying trigram indexes...');
    const indexes = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'prompts'
        AND (indexname LIKE '%trgm%' OR indexname = 'prompts_title_lower_idx');
    `;

    console.log('   Found indexes:');
    for (const idx of indexes) {
      console.log(`   - ${idx.indexname}`);
    }

    // 6. Test trigram similarity
    console.log('\n6. Testing trigram similarity function...');
    const testResult = await prisma.$queryRaw<Array<{ similarity: number }>>`
      SELECT similarity('prompt', 'promt') as similarity;
    `;
    console.log(`   Similarity test: similarity('prompt', 'promt') = ${testResult[0]?.similarity}`);

    console.log('\n✅ Trigram extension setup complete!');
  } catch (error) {
    console.error('Error setting up trigram:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTrigram().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
