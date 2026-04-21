# SimplyDone Shelf Analyzer

A premium, mobile-first web application for FMCG shelf analysis. Built for **SimplyDone Africa**.

## 🎯 Overview

**SimplyDone Shelf Analyzer** enables field merchandisers to capture shelf photos, leverage AI analysis via n8n, and provides brand managers with real-time insights through an executive dashboard.

| Feature | Details |
|---------|---------|
| **Target Brand** | Melvins Tea (configurable per visit) |
| **Mobile-First** | Optimized for phones, works on tablets/desktop |
| **Real-Time Updates** | Supabase Realtime for live notifications & photo status |
| **Excel Export** | Single & bulk export of audit reports |
| **Demo Mode** | Works without n8n (mock AI analysis for testing) |

---

## 🚀 Complete Deployment Guide

### Prerequisites
- Node.js 18+ and npm
- Supabase project (create at [supabase.com](https://supabase.com))
- Optional: n8n instance for real AI Analysis
- Vercel account (for frontend hosting)

### Step 1: Setup Supabase Backend

#### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Keep your **Service Role Key** secure (for Edge Functions)

#### 1.2 Run SQL Setup
1. Go to **SQL Editor** in Supabase Dashboard
2. Run each SQL file in this order:
   ```sql
   -- 1. Run supabase/schema.sql (creates tables & RLS policies)
   -- 2. Run supabase/storage.sql (creates shelf-photos bucket)
   -- 3. Run supabase/seed.sql (inserts outlets & products)
   ```
3. Copy-paste entire contents of each file and execute

#### 1.3 Create Test Users
1. Go to **Authentication** → **Users** → **Create User**
2. Create 2 test accounts:

   **Merchandiser Account:**
   - Email: `merch@simplydone.local`
   - Password: `MerchPassword123!`

   **Manager Account:**
   - Email: `manager@simplydone.local`
   - Password: `ManagerPassword123!`

#### 1.4 Link Auth Users to Database
1. Go to **SQL Editor** and run:
```sql
-- Get the UUID of each user and link them to the users table
INSERT INTO public.users (id, email, name, role, phone)
VALUES
  ('MERCH_UUID_HERE', 'merch@simplydone.local', 'John Merchandiser', 'merchandiser', '+254700000001'),
  ('MANAGER_UUID_HERE', 'manager@simplydone.local', 'Jane Manager', 'manager', '+254700000002');
```
Replace UUIDs with actual user IDs from the auth.users table in SQL Editor.

#### 1.5 Deploy Edge Functions
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Deploy functions:
   ```bash
   supabase functions deploy analyze-photo
   supabase functions deploy export-excel
   supabase functions deploy send-notification
   ```
5. Set Edge Function Secrets in Supabase Dashboard → Edge Functions → Settings:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
   - `N8N_WEBHOOK_URL`: (Optional) Your n8n webhook URL for real AI analysis

---

### Step 2: Configure Frontend

#### 2.1 Clone & Setup
```bash
# Clone repository
git clone <your-repo-url>
cd merchandising-tool

# Install dependencies
npm install
```

#### 2.2 Environment Variables
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
2. Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/analyze  # Optional
```

#### 2.3 Test Locally
```bash
npm run dev
```
Open http://localhost:5173 and login with test credentials

---

### Step 3: Deploy to Production

#### 3.1 Deploy to Vercel
If using Vercel:

```bash
npm install -g vercel
vercel login
vercel
```

Follow prompts and set environment variables in Vercel Dashboard.

Or directly connect GitHub repo to Vercel for auto-deploy.

#### 3.2 Alternative: Deploy to Firebase Hosting
```bash
npm run build
npx firebase deploy
```

---

## 📱 User Flows

### Merchandiser Flow (Field User)
1. **Login** with merchandiser credentials
2. Tap **📸 Capture Shelf** button
3. **Select Outlet** from dropdown (auto-search enabled)
4. **Take Photo** using device camera or upload from gallery
   - Frontend quality checks: file size ≤ 10MB, image dimensions
5. Photo uploads to Supabase Storage
6. **Wait for Analysis** (5 seconds demo | real AI via n8n webhook)
7. **View Results**:
   - Status badge (Good ✓ / Needs Work ⚠️ / Urgent ❌)
   - Quick metrics: facings, shelf %, stock, price
   - Competitor list
   - Action items (e.g., "Add 5 boxes to middle shelf")
   - Issues flagged
8. **Options**: View full report or export to Excel

### Manager Flow (Office User)
1. **Login** with manager credentials
2. **Dashboard Overview**:
   - KPI Summary cards (outlets visited, avg shelf share, stock-outs, top issue)
   - Shelf share trend line chart (30-day history)
   - Competitor pie chart (market share breakdown)
   - Outlet performance table (sortable, filterable)
3. **Drill Into Details**:
   - Click photo → view detailed manager report
   - See shelf facings breakdown (top/middle/bottom)
   - Review confidence score
   - See original photo
4. **Request Re-upload**: If photo quality is poor
   - Sends notification to merchandiser
5. **Bulk Export**:
   - Set filters (date range, outlet, merchandiser)
   - Click "Export Selected"
   - Downloads Excel file with summary sheet

---

## 🎨 UI Components

### Pages (Role-Gated)
- **Merchandiser**:
  - `HomePage` - Capture CTA + recent uploads list
  - `CapturePage` - Photo upload flow
  - `AnalysisPage` - Results display with action items
  - `HistoryPage` - Past photos & analysis
  - `ProfilePage` - User settings

- **Manager**:
  - `DashboardPage` - KPI cards, charts, table
  - `PhotoDetailPage` - Detailed report view
  - `BulkExportPage` - Export filters & download

### Reusable Components
- `NotificationBell` - Real-time notifications with dropdown
- `StatusBadge` - Status indicator (Good/Needs Work/Urgent)
- `StatCard` - KPI metric card with trend indicator
- `LoadingSpinner` - Async operation indicator
- Charts: `ShelfShareTrend`, `CompetitorPie`, `OutletTable`
- Reports: `MerchandiserReport`, `ManagerReport`

---

## 🔌 API Endpoints

### Edge Functions

**Analyze Photo**
```bash
POST /functions/v1/analyze-photo
{
  "photo_id": "uuid",
  "photo_url": "https://...",
  "target_brand": "Melvins Tea"
}
```

**Export Excel**
```bash
POST /functions/v1/export-excel
{
  "type": "single",  // or "bulk"
  "visit_id": "uuid",  // For single export
  "filters": { "start_date": "2026-04-01", "outlet_id": "uuid" }  // For bulk
}
```

**Send Notification**
```bash
POST /functions/v1/send-notification
{
  "user_id": "uuid",
  "message": "Analysis complete for [Outlet]",
  "type": "info"  // or "warning", "urgent"
}
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Tailwind CSS v4 |
| **Routing** | React Router v7 |
| **Charts** | Recharts |
| **Auth** | Supabase Auth |
| **Database** | PostgreSQL (Supabase) |
| **Storage** | Supabase Storage (shelf-photos bucket) |
| **Real-Time** | Supabase Realtime subscriptions |
| **Edge Functions** | Deno (Supabase) |
| **Excel Export** | ExcelJS v4 |
| **UI Icons** | Lucide React |
| **Notifications** | React Hot Toast |
| **Hosting** | Vercel (frontend) + Supabase (backend) |

---

## 📊 Database Schema

```
users
├── id (uuid, FK: auth.users)
├── email
├── name
├── role (merchandiser|manager)
└── phone

outlets
├── id (uuid, PK)
├── outlet_id (text, unique)
├── name
├── location
├── region
└── status (active|inactive)

visits
├── id (uuid, PK)
├── outlet_id (FK: outlets)
├── user_id (FK: users)
├── visit_date
└── visit_time

photos
├── id (uuid, PK)
├── visit_id (FK: visits)
├── photo_url
├── analysis_status (pending|analyzing|complete|failed)
├── analysis_result (jsonb)
├── confidence_score
├── uploaded_at
└── analyzed_at

notifications
├── id (uuid, PK)
├── user_id (FK: users)
├── message
├── type (info|warning|urgent)
├── read
└── created_at
```

---

## 🔐 Security & RLS Policies

All tables have Row Level Security (RLS) enabled:

| Table | Policy | Effect |
|-------|--------|--------|
| **users** | Users see only own record | Prevents data leakage |
| **outlets** | All authenticated users can view | Shared reference data |
| **visits** | Merchandisers see own; Managers see all | Role-based access |
| **photos** | Merchandisers see own; Managers see all | Secure photo access |
| **notifications** | Users see only own | Private notifications |

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Merchandiser login works
- [ ] Can capture & upload photo
- [ ] Analysis completes (demo 5s → mock result)
- [ ] StatusBadge displays correctly
- [ ] Action items show on result  
- [ ] Manager login works
- [ ] Dashboard loads with charts
- [ ] Single Excel export works
- [ ] Bulk Excel export works
- [ ] Notifications appear in real-time
- [ ] Mobile responsive (test on 375px viewport)

### Credentials for Testing
```
Merchandiser:
  Email: merch@simplydone.local
  Password: MerchPassword123!

Manager:
  Email: manager@simplydone.local
  Password: ManagerPassword123!
```

---

## 🌐 Demo Mode vs Production

### Demo Mode (No n8n)
- Photo analysis completes after 5s delay
- Mock analysis result with randomized values
- Perfect for testing UI without external dependency

### Production Mode (With n8n)
1. Set `N8N_WEBHOOK_URL` in Supabase Edge Function secrets
2. n8n receives: `{ photo_url, target_brand }`
3. n8n returns AI analysis JSON
4. Edge Function saves result to database

---

## 📝 Notes

- **Target Brand Hardcoded**: Currently sends `"target_brand": "Melvins Tea"` to n8n. To make brand configurable, add a brand selector in CapturePage.
- **Excel Export Workbook**: Single exports have 1 sheet; bulk exports have data sheet + summary sheet
- **Realtime Updates**: Photos table subscriptions update analysis status in real-time
- **Performance**: Dashboard data cached for 5 minutes; photos lazy-loaded in grids
- **File Limits**: Max 10MB per photo; auto-compress before upload

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Photos show 404 | Check storage bucket policy (should allow public read) |
| Analysis stuck "Analyzing" | Check Edge Function logs for n8n webhook errors |
| No notifications | Verify realtime subscription in browser DevTools |
| RLS errors | Ensure users linked in public.users table after auth signup |
| Export blank file | Check filters (may have no matching records) |

---

## 📧 Support

For issues or questions:
1. Check [Supabase Docs](https://supabase.com/docs)
2. Review Edge Function logs in Supabase Dashboard
3. Check browser console for client errors
4. Verify all environment variables are set

---

**Built by SimplyDone Africa** • [Website](#) • [Contact](#)

