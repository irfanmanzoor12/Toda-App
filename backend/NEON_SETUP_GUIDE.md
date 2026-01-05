# Neon PostgreSQL Setup Guide - Phase III

This guide will help you migrate from SQLite to Neon PostgreSQL for Phase III requirements.

## What We've Prepared

✅ **New Database Models:**
- `Conversation` model - Tracks chat sessions
- `Message` model - Stores chat history

✅ **Migration Scripts:**
- `migrations/init_db.py` - Creates all tables
- `migrations/migrate_sqlite_to_postgres.py` - Migrates existing data

✅ **Updated Configuration:**
- `src/database.py` - Now supports both SQLite and PostgreSQL
- Automatic fallback to SQLite if DATABASE_URL not set

## Step-by-Step Migration Process

### Step 1: Create Neon PostgreSQL Database

#### 1.1: Sign Up for Neon (if you don't have an account)
1. Go to https://neon.tech
2. Click "Sign Up" (Free tier includes 0.5 GB storage)
3. Sign up with GitHub, Google, or email

#### 1.2: Create a New Project
1. Once logged in, click "Create Project"
2. **Project Name:** `todoapp` (or your preferred name)
3. **Database Name:** `neondb` (default, or customize)
4. **Region:** Choose closest to you (e.g., US East, EU West, etc.)
5. Click "Create Project"

#### 1.3: Get Your Connection String
After project creation, Neon will show you a connection string. It looks like:

```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Important:** Copy this entire string - you'll need it for the next steps!

### Step 2: Configure Backend

#### 2.1: Update .env File
Add your Neon connection string to `backend/.env`:

```bash
cd backend
echo 'DATABASE_URL=postgresql://[YOUR_NEON_CONNECTION_STRING]' >> .env
```

**Example:**
```env
# backend/.env
DATABASE_URL=postgresql://alex:AbC123xyz@ep-cool-cell-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-here
```

### Step 3: Initialize Database (Create Tables)

Run the initialization script to create all required tables:

```bash
cd backend

# Activate virtual environment (if you have one)
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows

# Run initialization
python migrations/init_db.py
```

**Expected Output:**
```
✅ Using database: postgresql://alex:...
🚀 Initializing database...
✅ Database tables created successfully!
   - todos
   - conversations
   - messages
```

### Step 4: Migrate Existing Data (Optional)

**Only do this if you have existing todos in SQLite that you want to keep!**

```bash
cd backend

# Make sure DATABASE_URL is set (it should be in .env already)
python migrations/migrate_sqlite_to_postgres.py
```

**Expected Output:**
```
📂 SQLite database: todoapp.db
🔗 PostgreSQL URL: postgresql://...
⚠️  This will migrate all data. Continue? (yes/no): yes
🔄 Starting migration from SQLite to PostgreSQL...
📖 Reading data from SQLite...
   Found X todos to migrate
✍️  Writing data to PostgreSQL...
✅ Migrated X todos successfully!
🎉 Migration completed successfully!
```

### Step 5: Verify Database Connection

Test that your backend can connect to Neon:

```bash
cd backend

# Quick Python test
python -c "from src.database import engine; print('✅ Connection successful!' if engine else '❌ Failed')"
```

Or verify directly in Neon Console:
1. Go to https://console.neon.tech
2. Select your project
3. Go to "SQL Editor"
4. Run:
   ```sql
   SELECT * FROM todos;
   SELECT * FROM conversations;
   SELECT * FROM messages;
   ```

### Step 6: Restart Backend Server

```bash
cd backend
uvicorn src.api.main:app --reload --port 8000
```

You should see:
```
✅ Using database: postgresql://...
```

Instead of:
```
⚠️  DATABASE_URL not set, using SQLite: ...
```

## Verification Checklist

After migration, verify:

- [ ] Backend starts without errors
- [ ] Can create new todos via API
- [ ] Can list todos via API
- [ ] Old todos (if migrated) are visible
- [ ] Chat interface can connect to backend
- [ ] No "SQLite" warnings in backend logs

## Troubleshooting

### Error: "could not connect to server"

**Cause:** Connection string might be incorrect or network issue

**Solution:**
1. Verify your connection string in .env
2. Check if `sslmode=require` is at the end
3. Try connecting via `psql` command:
   ```bash
   psql "postgresql://your-connection-string"
   ```

### Error: "password authentication failed"

**Cause:** Password in connection string is incorrect

**Solution:**
1. Go to Neon Console → Your Project → Settings
2. Reset the password
3. Update .env with new connection string

### Error: "relation does not exist"

**Cause:** Tables haven't been created yet

**Solution:**
```bash
python migrations/init_db.py
```

### Error: "ImportError: No module named 'dotenv'"

**Cause:** python-dotenv not installed

**Solution:**
```bash
pip install python-dotenv
# or
uv pip install python-dotenv
```

### Backend still using SQLite

**Cause:** .env file not being read or DATABASE_URL not set

**Solution:**
1. Check `.env` file exists in `backend/` directory
2. Check DATABASE_URL is spelled correctly
3. Try setting it in terminal:
   ```bash
   export DATABASE_URL="postgresql://..."
   uvicorn src.api.main:app --reload
   ```

## Next Steps

Once Neon PostgreSQL is working:

1. ✅ **Stage 1 Complete!** Database foundation is ready
2. 🔜 **Stage 2:** Update chat endpoint to use conversation models
3. 🔜 **Stage 3:** Verify MCP server integration
4. 🔜 **Stage 4:** Implement OpenAI ChatKit frontend
5. 🔜 **Stage 5:** Integration testing
6. 🔜 **Stage 6:** Documentation

## Useful Neon Commands

### Via SQL Editor in Neon Console:

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('neondb'));

-- Count records
SELECT COUNT(*) FROM todos;
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM messages;

-- View recent todos
SELECT * FROM todos ORDER BY created_at DESC LIMIT 10;

-- View conversations
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 10;

-- View messages for a conversation
SELECT * FROM messages WHERE conversation_id = 1 ORDER BY created_at;

-- Delete all data (if needed for fresh start)
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE todos CASCADE;
```

## Support

- **Neon Documentation:** https://neon.tech/docs
- **Neon Discord:** https://discord.gg/neon
- **Neon Status:** https://neonstatus.com

---

**Ready to proceed?**

Once you've completed Steps 1-6 and verified everything works, let me know and we'll move to **Stage 2: Backend Chat Endpoint Enhancement**!
