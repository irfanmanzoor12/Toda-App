# Database Migrations for Phase III

This directory contains migration scripts for setting up and migrating the Todo Chatbot database.

## Scripts

### 1. `init_db.py` - Initialize Database
Creates all required tables in your database.

**Usage:**
```bash
# Make sure DATABASE_URL is set in .env
python migrations/init_db.py
```

**Tables Created:**
- `todos` - Task items from Phase II
- `conversations` - Chat sessions for Phase III
- `messages` - Chat message history for Phase III

### 2. `migrate_sqlite_to_postgres.py` - Migrate from SQLite to PostgreSQL
Migrates existing data from SQLite to PostgreSQL (Neon).

**Usage:**
```bash
# Set your Neon PostgreSQL connection string
export DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Run migration
python migrations/migrate_sqlite_to_postgres.py
```

**What it does:**
1. Reads all todos from SQLite database
2. Connects to PostgreSQL
3. Migrates all data preserving IDs and timestamps
4. Confirms success

## Migration Workflow

### Option A: Fresh Start (No existing data)
```bash
# 1. Set up Neon PostgreSQL connection in .env
echo 'DATABASE_URL=postgresql://...' > backend/.env

# 2. Initialize database
cd backend
python migrations/init_db.py
```

### Option B: Migrate from SQLite (Preserve existing data)
```bash
# 1. Set up Neon PostgreSQL connection
export DATABASE_URL="postgresql://..."

# 2. Run migration script
cd backend
python migrations/migrate_sqlite_to_postgres.py

# 3. Update .env file to use PostgreSQL
echo 'DATABASE_URL=postgresql://...' > .env

# 4. Restart backend server
```

## Neon PostgreSQL Setup

1. **Create Neon Account:**
   - Go to https://neon.tech
   - Sign up (free tier available)

2. **Create Project:**
   - Click "Create Project"
   - Choose a name (e.g., "todoapp")

3. **Get Connection String:**
   - Neon provides a connection string like:
     ```
     postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
     ```

4. **Update Backend Configuration:**
   - Add to `backend/.env`:
     ```
     DATABASE_URL=postgresql://[your-connection-string]
     ```

## Verifying Migration

After migration, verify data:

```bash
# Connect to your database
psql "postgresql://..."

# Check tables
\dt

# Count records
SELECT COUNT(*) FROM todos;
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM messages;
```

## Rollback

To rollback (if needed):
1. Keep your SQLite database file as backup
2. Change DATABASE_URL back to SQLite in .env
3. Restart backend

## Troubleshooting

### Error: "DATABASE_URL not set"
- Make sure you've added DATABASE_URL to your .env file
- Or export it in your terminal session

### Error: "Connection refused"
- Check your Neon connection string is correct
- Verify your IP is allowed (Neon allows all by default)
- Check if sslmode=require is in connection string

### Error: "Table already exists"
- Drop existing tables first:
  ```sql
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS conversations CASCADE;
  DROP TABLE IF EXISTS todos CASCADE;
  ```
- Then run init_db.py again
