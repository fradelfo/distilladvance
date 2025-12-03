/**
 * Test script for Advanced Search features
 *
 * Run with: bunx tsx scripts/test-search.ts
 *
 * Tests:
 * 1. Full-Text Search (tsvector)
 * 2. Trigram Autocomplete (pg_trgm)
 * 3. Search vector column
 * 4. Embeddings table
 * 5. Saved searches table
 * 6. Search history table
 * 7. Database indexes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSearch() {
  console.log('=== Advanced Search Test Suite ===\n');

  // 1. Test FTS is working
  console.log('1. Testing Full-Text Search...');
  try {
    const ftsTest = await prisma.$queryRaw<Array<{ id: string; title: string; rank: number }>>`
      SELECT id, title,
             ts_rank(search_vector, plainto_tsquery('english', 'api')) as rank
      FROM prompts
      WHERE search_vector @@ plainto_tsquery('english', 'api')
      ORDER BY rank DESC
      LIMIT 5;
    `;
    if (ftsTest.length > 0) {
      console.log('   FTS Results: PASS');
      ftsTest.forEach((r) => console.log(`   - ${r.title} (rank: ${r.rank.toFixed(4)})`));
    } else {
      console.log('   FTS Results: NO MATCHES (try different search term)');
    }
  } catch (e) {
    console.log('   FTS Results: FAIL -', (e as Error).message);
  }

  // 2. Test trigram similarity
  console.log('\n2. Testing Trigram Autocomplete...');
  try {
    const trigramTest = await prisma.$queryRaw<Array<{ title: string; sim: number }>>`
      SELECT title, similarity(LOWER(title), 'cod') as sim
      FROM prompts
      WHERE similarity(LOWER(title), 'cod') > 0.1
      ORDER BY sim DESC
      LIMIT 5;
    `;
    if (trigramTest.length > 0) {
      console.log('   Trigram Results: PASS');
      trigramTest.forEach((r) => console.log(`   - ${r.title} (similarity: ${r.sim.toFixed(4)})`));
    } else {
      console.log('   Trigram Results: NO MATCHES (try different search term)');
    }
  } catch (e) {
    console.log('   Trigram Results: FAIL -', (e as Error).message);
    console.log('   Run: bunx tsx scripts/setup-trigram.ts');
  }

  // 3. Test search_vector column exists
  console.log('\n3. Testing search_vector column...');
  try {
    const vectorTest = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM prompts WHERE search_vector IS NOT NULL;
    `;
    const count = Number(vectorTest[0].count);
    console.log(`   Indexed prompts: ${count}`);
    if (count === 0) {
      console.log('   Run: bunx tsx scripts/setup-fts.ts');
    }
  } catch (e) {
    console.log('   search_vector: FAIL -', (e as Error).message);
    console.log('   Run: bunx tsx scripts/setup-fts.ts');
  }

  // 4. Test embeddings exist
  console.log('\n4. Testing embeddings...');
  try {
    const embeddingTest = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM prompt_embeddings;
    `;
    console.log(`   Embedded prompts: ${Number(embeddingTest[0].count)}`);
  } catch (e) {
    console.log('   Embeddings: FAIL -', (e as Error).message);
  }

  // 5. Test saved searches table
  console.log('\n5. Testing saved_searches table...');
  try {
    const savedTest = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM saved_searches;
    `;
    console.log(`   Saved searches: ${Number(savedTest[0].count)}`);
  } catch (e) {
    console.log('   saved_searches: FAIL -', (e as Error).message);
    console.log('   Run: bunx prisma migrate dev');
  }

  // 6. Test search history table
  console.log('\n6. Testing search_history table...');
  try {
    const historyTest = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM search_history;
    `;
    console.log(`   History entries: ${Number(historyTest[0].count)}`);
  } catch (e) {
    console.log('   search_history: FAIL -', (e as Error).message);
    console.log('   Run: bunx prisma migrate dev');
  }

  // 7. Test indexes exist
  console.log('\n7. Testing indexes...');
  try {
    const indexTest = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'prompts'
      AND (indexname LIKE '%search%' OR indexname LIKE '%trgm%' OR indexname LIKE '%lower%');
    `;
    if (indexTest.length > 0) {
      console.log('   Found indexes:');
      indexTest.forEach((i) => console.log(`   - ${i.indexname}`));
    } else {
      console.log('   No search indexes found');
      console.log('   Run: bunx tsx scripts/setup-fts.ts');
      console.log('   Run: bunx tsx scripts/setup-trigram.ts');
    }
  } catch (e) {
    console.log('   Indexes: FAIL -', (e as Error).message);
  }

  // 8. Test pg_trgm extension
  console.log('\n8. Testing pg_trgm extension...');
  try {
    const extTest = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
    `;
    if (extTest.length > 0) {
      console.log('   pg_trgm: INSTALLED');
    } else {
      console.log('   pg_trgm: NOT INSTALLED');
      console.log('   Run: bunx tsx scripts/setup-trigram.ts');
    }
  } catch (e) {
    console.log('   pg_trgm: FAIL -', (e as Error).message);
  }

  // 9. Test total prompts
  console.log('\n9. Prompt statistics...');
  try {
    const stats = await prisma.$queryRaw<
      Array<{
        total: bigint;
        with_vector: bigint;
        public_count: bigint;
      }>
    >`
      SELECT
        COUNT(*) as total,
        COUNT(search_vector) as with_vector,
        COUNT(*) FILTER (WHERE "isPublic" = true) as public_count
      FROM prompts;
    `;
    console.log(`   Total prompts: ${Number(stats[0].total)}`);
    console.log(`   With search vector: ${Number(stats[0].with_vector)}`);
    console.log(`   Public prompts: ${Number(stats[0].public_count)}`);
  } catch (e) {
    console.log('   Stats: FAIL -', (e as Error).message);
  }

  console.log('\n=== Test Complete ===');
}

testSearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
