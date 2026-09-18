# Phase 5: Deployment & Production Setup Guide

Complete guide to deploy AI Studio and Visual Generation for Double L Heat & Air website.

---

## 📋 Pre-Deployment Checklist

### ✅ Environment Variables Required

Set these in your production environment (Vercel, Netlify, or your hosting platform):

```bash
# Required for AI Studio
EVOLINK_API_KEY=YOUR_EVOLINK_API_KEY
EVOLINK_BASE_URL=https://api.evolink.ai/v1

# Required for database (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Required for authentication (should already be set)
NEXT_PUBLIC_SITE_URL=https://www.double-le-hvac.com
```

**Where to set:**
- **Vercel:** Project Settings → Environment Variables
- **Netlify:** Site Settings → Environment Variables
- **Docker:** `.env.production` file
- **Manual:** Environment file or server configuration

---

## 🗄️ Database Setup

### Step 1: Run Migration

Apply the Supabase migration to create the `ai_generations` table:

```bash
# Using Supabase CLI (if available)
supabase db push

# Or apply manually via Supabase Dashboard:
# 1. Go to Supabase Project → SQL Editor
# 2. Open the migration file: supabase/migrations/20260423000000_ai_generations_table.sql
# 3. Execute the SQL
# 4. Verify table created in Database → Tables
```

### Step 2: Verify Table Structure

Run this query in Supabase SQL Editor to verify:

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ai_generations'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id` (uuid, primary key)
- `type` (text)
- `model` (text)
- `prompt` (text)
- `parameters` (jsonb)
- `result_url` (text)
- `result_data` (jsonb)
- `duration_seconds` (integer)
- `status` (text)
- `task_id` (text)
- `media_library_id` (uuid, nullable)
- `used_in_post_id` (uuid, nullable)
- `created_at` (timestamptz)
- `created_by` (text)
- `version` (integer)
- `started_at` (timestamptz)
- `completed_at` (timestamptz)

### Step 3: Check RLS Policies

Ensure Row Level Security is properly configured:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'ai_generations';

-- Check policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'ai_generations';
```

Expected:
- `rls` should be `ENABLED`
- 4 policies: admins_view_generations, admins_create_generations, admins_update_generations, admins_delete_generations

---

## 🚀 Deployment Steps

### Option 1: Vercel

#### Step 1: Configure Environment Variables

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Environment Variables"
3. Add all variables from Pre-Deployment Checklist
4. Select "Production", "Preview", and "Development" environments

#### Step 2: Deploy

```bash
# Connect Vercel (if not already)
vercel login

# Deploy to production
vercel --prod

# Or push directly from GitHub:
# Vercel will auto-deploy on push to main branch
git push origin main
```

#### Step 3: Verify Deployment

1. Access: `https://www.double-le-hvac.com/admin/(protected)/ai-studio`
2. Verify API connection works (green "Evolink API: Connected" badge)
3. Test image generation
4. Check database for new record

---

### Option 2: Netlify

#### Step 1: Configure Environment Variables

1. Go to Netlify Dashboard → Your Site
2. Click "Site settings" → "Environment variables"
3. Add all variables from Pre-Deployment Checklist
4. Deploy automatically or manually trigger

#### Step 2: Deploy

```bash
# Connect Netlify (if not already)
netlify login

# Deploy
netlify deploy --prod

# Or push to GitHub:
# Netlify will auto-deploy on push to main branch
git push origin main
```

---

### Option 3: Docker (Self-hosted)

#### Step 1: Build Docker Image

```dockerfile
# Dockerfile (if not already created)
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Step 2: Run Container

```bash
# Build
docker build -t double-le-hvac .

# Run with environment variables
docker run -d \
  --name double-le-hvac \
  -p 3000:3000 \
  -e EVOLINK_API_KEY=sk-key \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  double-le-hvac
```

---

## 🔍 Production Testing

### Test 1: API Connection

```bash
# Test that API key is configured
curl -H "Authorization: Bearer $EVOLINK_API_KEY" \
  https://api.evolink.ai/v1/models
```

Expected: JSON array of available models.

### Test 2: Image Generation

1. Go to `/admin/(protected)/ai-studio/generate-image`
2. Select template: "Technician Hero"
3. Click "Generate"
4. Wait ~45-60 seconds
5. Verify image displays

Expected: Professional HVAC technician image.

### Test 3: History Tracking

1. After generating an image
2. Go to `/admin/(protected)/ai-studio/history`
3. Filter by "Images"
4. Verify generation appears

Expected: New entry with type="image", status="completed".

### Test 4: Save to Library

```bash
# Test save to media library endpoint
curl -X POST /api/ai/save-to-library \
  -H "Content-Type: application/json" \
  -d '{
    "id": "generation-id",
    "type": "image",
    "url": "https://...",
    "taskId": "img-123"
  }'
```

Expected: Success response with media library entry.

---

## 🔐 Security Checklist

### ✅ API Key Security

- [ ] Environment variables set in production
- [ ] API key NOT committed to git
- [ ] API key stored securely (Vercel/Netlify env vars)
- [ ] No hardcoded keys in source code

### ✅ Database Security

- [ ] RLS enabled on `ai_generations` table
- [ ] Admin-only policies configured
- [ ] Service role key protected
- [ ] No public access to sensitive data

### ✅ Storage Security

- [ ] Media bucket RLS configured
- [ ] Public URLs signed properly
- [ ] Storage paths organized (ai-generated/)

---

## 📊 Monitoring & Analytics

### Track Usage

Create a dashboard to monitor:

1. **Generation volume** (daily/weekly/monthly)
2. **Model usage** (which models used most)
3. **Success rate** (completed vs failed)
4. **Average duration** by type
5. **Storage usage** (media library)

### Example Supabase Query

```sql
-- Statistics by model
SELECT
  model,
  COUNT(*) as total,
  AVG(CASE WHEN duration_seconds THEN duration_seconds END) as avg_duration,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM ai_generations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY model
ORDER BY total DESC;
```

### Evolink API Monitoring

Check your Evolink dashboard for:
- API usage quota
- Monthly expenses
- Error rates
- Response times

---

## 🚨 Troubleshooting

### Issue: "Evolink API not configured"

**Cause:** Environment variable not set

**Fix:**
1. Verify `EVOLINK_API_KEY` is set in production environment
2. Restart application after setting variable
3. Check logs for environment variable loading errors

### Issue: "Generation failed" errors

**Cause:** API key invalid, network issue, or Evolink service outage

**Fix:**
1. Verify API key is valid:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" https://api.evolink.ai/v1/models
   ```
2. Check Evolink status page for outages
3. Check Supabase logs for detailed error messages
4. Verify task_id uniqueness (should be formatted as `type-timestamp-random`)

### Issue: "No history after generation"

**Cause:** Database connection issue or migration not applied

**Fix:**
1. Verify Supabase connection:
   ```sql
   SELECT 1;
   ```
2. Check if `ai_generations` table exists:
   ```sql
   SELECT * FROM ai_generations LIMIT 1;
   ```
3. Apply migration if missing
4. Check RLS policies allow writes

### Issue: "Save to library failed"

**Cause:** Storage bucket not configured or permissions issue

**Fix:**
1. Verify Supabase storage exists and is accessible
2. Check RLS on storage bucket
3. Verify `media` bucket exists:
   ```bash
   # From Supabase CLI
   supabase storage buckets list
   ```
4. Create bucket if missing:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('media', 'media', true);
   ```

---

## 📈 Cost Optimization

### Estimated Costs

**Evolink API:**
- Image: ~1-2 credits per image
- Video: ~10-50 credits per video (depends on duration)
- Music: ~2-5 credits per audio
- Typical usage: 10 images/day = ~10-20 credits/day
- 1 credit ≈ $0.01 (varies by plan)

**Supabase:**
- Database storage: Included in free tier (500MB)
- Storage: Included in free tier (1GB)
- Bandwidth: Included in free tier (2GB/month)

**Recommendations:**
1. Monitor usage first 2 weeks
2. Cache generated content
3. Reuse images in multiple posts
4. Set daily/monthly limits in admin

---

## 🎯 Post-Deployment Tasks

### Week 1: Testing & Monitoring

1. Generate 5-10 test images to verify workflow
2. Test video and music generation
3. Verify history tracking works
4. Test marketing composer integration
5. Monitor error rates in logs

### Week 2: User Training

1. Document AI Studio usage for team
2. Create guide: "How to Generate Content"
3. Train marketing team on composer
4. Establish quality guidelines

### Month 1: Optimization

1. Review generated content quality
2. Fine-tune prompt templates
3. Add custom prompts for your brand
4. Establish content calendar integration

---

## 📞 Support Resources

### Documentation

- OpenClaw AI Studio: `/docs/ai-studio-implementation.md`
- Evolink API Docs: https://docs.evolink.ai/en/api-manual
- Supabase Docs: https://supabase.com/docs

### Getting Help

If you encounter issues:

1. Check this deployment guide
2. Check Supabase logs → Database → Logs
3. Check hosting platform logs (Vercel/Netlify)
4. Contact: OpenClaw support via your workspace

---

## ✅ Deployment Verification Checklist

After deploying, verify:

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] API connection works (green badge in AI Studio)
- [ ] Image generation successful
- [ ] Video generation successful
- [ ] Music generation successful
- [ ] History page shows generations
- [ ] Save to library works
- [ ] Marketing composer integration works
- [ ] RLS policies active
- [ ] Storage bucket accessible
- [ ] Error monitoring working

---

**Generated:** 2026-04-23
**Phase:** 5/5 Complete
**Status:** Ready for deployment