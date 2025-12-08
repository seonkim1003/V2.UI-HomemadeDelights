# Convert Worker to Pages Project

This guide shows you how to convert your existing Cloudflare Worker into a Cloudflare Pages project (which supports both static files AND Workers/Functions).

## Option 1: Create New Pages Project (Recommended)

### Step 1: Create Pages Project

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Pages**
2. Click **"Create a project"**
3. Click **"Connect to Git"**
4. Select your Git provider
5. **Select your `HomeMadeDelights` repository**
6. Click **"Begin setup"**

### Step 2: Configure Build Settings

- **Project name**: `homemade-delights` (or your preferred name)
- **Production branch**: `main` (or `master`)
- **Framework preset**: None (or Static Site)
- **Build command**: ⚠️ **LEAVE EMPTY** (or `echo "No build needed"`)
- **Build output directory**: `/` (root)
- **Root directory**: `/` (root)

### Step 3: Configure Functions Bindings

After the first deployment:

1. Go to **Settings** → **Functions**
2. Add **R2 Bucket Binding**:
   - Variable name: `GALLERY_R2`
   - Bucket: `gallery-images` (create this first if needed)
3. Add **KV Namespace Binding**:
   - Variable name: `GALLERY_KV`
   - Namespace: Your KV namespace (create this first if needed)

### Step 4: Deploy

1. Click **"Save and Deploy"**
2. Wait for deployment to complete
3. Your site will be at: `your-project-name.pages.dev`

### Step 5: Delete Old Worker (Optional)

Once Pages is working:

1. Go to **Workers & Pages** → **Workers**
2. Find your old Worker (`homemadedelightsclone` or similar)
3. Click on it → **Settings** → **Delete Worker**

## Option 2: Keep Worker, Add Static Assets

If you want to keep your Worker but add static file serving, you'd need to modify the Worker code to serve files from R2 or inline them. This is more complex and **not recommended** for your use case.

## What Happens

✅ **Pages Project** will:
- Serve all your static files (HTML, CSS, JS) automatically
- Auto-detect Functions from `functions/` directory
- Handle routing between static files and API endpoints
- Give you a `*.pages.dev` URL

❌ **Worker** currently:
- Only runs serverless function code
- Can't serve static HTML files easily
- Shows "Hello world" by default

## Migration Checklist

- [ ] Create R2 bucket: `gallery-images`
- [ ] Create KV namespace: `GALLERY_KV`
- [ ] Create Pages project connected to git
- [ ] Configure build settings (empty build command)
- [ ] Add R2 and KV bindings in Pages Settings → Functions
- [ ] Deploy and verify site works
- [ ] (Optional) Delete old Worker

## After Migration

Your Pages project will have:
- ✅ Static website served from git repository
- ✅ Functions at `/api/*` routes
- ✅ Both working together seamlessly
