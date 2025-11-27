---
name: database-migrate
description: Intelligent database migration workflow with data safety and rollback capabilities
---

Use the platform-agent to coordinate database migrations with comprehensive safety measures:

**Pre-Migration Safety Checks:**
1. **Data Integrity Validation:**
   - Full database backup creation
   - Data consistency validation
   - Foreign key constraint verification
   - Index integrity checking
   - Transaction log analysis

2. **Migration Risk Assessment:**
   - Schema change impact analysis
   - Data loss risk evaluation
   - Performance impact estimation
   - Downtime requirement calculation
   - Rollback complexity assessment

**Database Migration Execution:**

**Phase 1: Environment Preparation**
1. **Backup Strategy:**
   - Create full database backup
   - Export schema definition
   - Generate data export scripts
   - Store backup metadata
   - Verify backup integrity

2. **Migration Validation:**
   - Dry-run migration on copy
   - Schema validation testing
   - Data transformation verification
   - Performance impact testing
   - Rollback procedure testing

**Phase 2: Migration Coordination**
1. **Multi-Environment Strategy:**
   - Development environment migration
   - Staging environment validation
   - User acceptance testing
   - Production migration planning
   - Post-migration monitoring

2. **Data Safety Protocols:**
   - Transaction isolation implementation
   - Incremental migration batching
   - Real-time progress monitoring
   - Error detection and handling
   - Automatic rollback triggers

**AI/Vector Database Migrations:**
1. **Vector Data Migration:**
   - Embedding dimension validation
   - Vector index rebuilding
   - Similarity search testing
   - Performance benchmarking
   - Index optimization

2. **AI Model Data Migration:**
   - Training data migration
   - Model metadata preservation
   - Performance metric migration
   - A/B testing data preservation
   - Feature flag state migration

**Technology-Specific Migrations:**

**Prisma Migrations (TypeScript):**
```typescript
// Enhanced migration with safety checks
async function safePrismaMigration() {
  // Pre-migration backup
  await backupDatabase()

  try {
    // Generate migration
    await prisma.$executeRaw`-- Migration SQL`

    // Validate migration
    await validateMigration()

    // Deploy migration
    await prisma.$migrate.deploy()

  } catch (error) {
    await rollbackMigration()
    throw error
  }
}
```

**PostgreSQL Direct Migrations:**
```sql
-- Enhanced migration with safety checks
BEGIN;

-- Create migration tracking
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(50),
  rollback_sql TEXT
);

-- Record migration start
INSERT INTO migration_log (migration_name, status)
VALUES ('add_ai_conversation_tables', 'started');

-- Migration logic with rollback preparation
DO $$
DECLARE
  rollback_sql TEXT;
BEGIN
  -- Store rollback information
  rollback_sql := 'DROP TABLE IF EXISTS ai_conversations;';

  -- Execute migration
  CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    conversation_data JSONB,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Update migration status
  UPDATE migration_log
  SET completed_at = NOW(), status = 'completed', rollback_sql = rollback_sql
  WHERE migration_name = 'add_ai_conversation_tables' AND status = 'started';

EXCEPTION WHEN OTHERS THEN
  -- Mark as failed
  UPDATE migration_log
  SET completed_at = NOW(), status = 'failed'
  WHERE migration_name = 'add_ai_conversation_tables' AND status = 'started';

  RAISE;
END $$;

COMMIT;
```

**MongoDB Migrations (Browser Extension Data):**
```javascript
// Safe MongoDB migration for user preferences
async function migrateUserPreferences() {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      // Backup existing data
      await backupCollection('user_preferences')

      // Transform data
      await UserPreference.updateMany(
        {},
        [
          {
            $set: {
              ai_settings: {
                model_preference: "$model_preference",
                privacy_mode: "$privacy_mode",
                auto_distill: { $ifNull: ["$auto_distill", false] }
              }
            }
          },
          {
            $unset: ["model_preference", "privacy_mode"]
          }
        ]
      )

      // Validate migration
      await validateUserPreferences()
    })
  } finally {
    await session.endSession()
  }
}
```

**Data Validation and Testing:**
1. **Post-Migration Validation:**
   - Row count verification
   - Data type validation
   - Foreign key integrity check
   - Index performance testing
   - Application compatibility testing

2. **Performance Validation:**
   - Query performance benchmarking
   - Index utilization analysis
   - Connection pool testing
   - Memory usage monitoring
   - Response time validation

**Rollback Strategy:**
1. **Automatic Rollback Triggers:**
   - Data corruption detection
   - Performance degradation alerts
   - Application error rate spikes
   - User experience impact monitoring
   - Manual rollback procedures

2. **Rollback Execution:**
   - Stop application traffic
   - Restore from backup
   - Validate data integrity
   - Resume normal operations
   - Post-rollback monitoring

**Browser Extension Specific Migrations:**
1. **Chrome Storage Migrations:**
   - Extension storage schema updates
   - User preference migrations
   - Settings format changes
   - Data structure transformations
   - Cross-browser compatibility

2. **User Data Migrations:**
   - Conversation history migrations
   - Saved distillations transfers
   - User customization preservation
   - Privacy setting migrations
   - Export/import functionality

**Monitoring and Alerting:**
1. **Real-time Monitoring:**
   - Migration progress tracking
   - Error rate monitoring
   - Performance impact alerts
   - Data integrity warnings
   - User experience monitoring

2. **Post-Migration Monitoring:**
   - Application health checks
   - Database performance monitoring
   - User experience metrics
   - Error rate analysis
   - Success metrics tracking

**Migration Documentation:**
1. **Migration Records:**
   - Change log documentation
   - Schema diff generation
   - Data transformation records
   - Performance impact reports
   - Rollback procedure documentation

2. **Team Communication:**
   - Migration status updates
   - Impact assessment reports
   - Success/failure notifications
   - Learning and improvement notes
   - Future migration planning

**Quality Gates:**
- Zero data loss during migration
- Performance degradation < 10%
- Rollback procedure tested and validated
- All stakeholders notified of changes
- Post-migration monitoring operational
- Documentation updated and accessible

**Emergency Procedures:**
- Immediate rollback capability available
- 24/7 monitoring during critical migrations
- Emergency contact procedures established
- Data recovery procedures documented
- Incident response plan activated

Please specify the migration type and scope for coordinated execution with comprehensive safety measures.