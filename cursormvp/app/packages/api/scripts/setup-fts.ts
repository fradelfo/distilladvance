/**
 * Setup Full-Text Search Script
 *
 * This script adds the tsvector column and GIN index to the prompts table
 * for PostgreSQL full-text search capabilities.
 *
 * Uses a trigger-based approach since to_tsvector is not immutable
 * and cannot be used in generated columns.
 *
 * Run with: bunx tsx app/packages/api/scripts/setup-fts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up full-text search...');

  try {
    // Check if search_vector column already exists
    const columnCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompts' AND column_name = 'search_vector'
      ) as exists
    `;

    if (columnCheck[0]?.exists) {
      console.log('✅ search_vector column already exists');

      // Check if trigger exists
      const triggerCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'prompts_search_vector_update'
        ) as exists
      `;

      if (triggerCheck[0]?.exists) {
        console.log('✅ Trigger already exists');
        return;
      }
    } else {
      console.log('Adding search_vector column...');

      // Add the tsvector column (not generated, will be maintained by trigger)
      await prisma.$executeRaw`
        ALTER TABLE prompts
        ADD COLUMN search_vector tsvector
      `;
    }

    console.log('Creating trigger function...');

    // Create the trigger function
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION prompts_search_vector_trigger()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
          setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `;

    console.log('Creating trigger...');

    // Create the trigger (drop first if exists to avoid error)
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS prompts_search_vector_update ON prompts
    `;

    await prisma.$executeRaw`
      CREATE TRIGGER prompts_search_vector_update
      BEFORE INSERT OR UPDATE ON prompts
      FOR EACH ROW
      EXECUTE FUNCTION prompts_search_vector_trigger()
    `;

    console.log('Creating GIN index...');

    // Create GIN index for fast full-text search
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS prompts_search_vector_idx
      ON prompts USING GIN(search_vector)
    `;

    console.log('Updating existing rows...');

    // Update existing rows to populate search_vector
    await prisma.$executeRaw`
      UPDATE prompts SET
        search_vector = setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
                        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
      WHERE search_vector IS NULL
    `;

    console.log('✅ Full-text search setup complete!');

    // Verify the setup
    const verifyColumn = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompts' AND column_name = 'search_vector'
      ) as exists
    `;

    const verifyIndex = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'prompts' AND indexname = 'prompts_search_vector_idx'
      ) as exists
    `;

    const verifyTrigger = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'prompts_search_vector_update'
      ) as exists
    `;

    const rowCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM prompts WHERE search_vector IS NOT NULL
    `;

    console.log('\nVerification:');
    console.log(`  - search_vector column: ${verifyColumn[0]?.exists ? '✅' : '❌'}`);
    console.log(`  - GIN index: ${verifyIndex[0]?.exists ? '✅' : '❌'}`);
    console.log(`  - Update trigger: ${verifyTrigger[0]?.exists ? '✅' : '❌'}`);
    console.log(`  - Indexed rows: ${rowCount[0]?.count ?? 0}`);
  } catch (error) {
    console.error('❌ Failed to setup full-text search:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
