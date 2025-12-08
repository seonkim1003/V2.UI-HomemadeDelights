# Switch from Workers to Pages

You've deployed this as a **Cloudflare Worker** (which is why you see `*.workers.dev`), but you need **Cloudflare Pages** for a static website with Functions.

## What's Happening

- ❌ **Current**: Cloudflare Worker (`homemadedelightsclone.workers.dev`)
  - Only runs a single serverless function
  - Can't serve your HTML/CSS/JS files directly
  - That's why you see "Hello world"

- ✅ **Needed**: Cloudflare Pages (`your-project.pages.dev`)
  - Serves static files (HTML, CSS, JS, images)
  - Auto-detects Functions from `functions/` directory
  - Perfect for your website

## Solution: Create a Pages Project

### Step 1: Create New Pages Project

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Pages**
2. Click **"Create a project"**
3. Click **"Connect to Git"**
4. Select your Git provider and repository (`HomeMadeDelights`)
5. Click **"Begin setup"**

### Step 2: Configure Build Settings

**Build configuration:**
- **Framework preset**: None (or Static Site)
- **Build command**: ⚠️ **LEAVE EMPTY** (or `echo "No build needed"`)
- **Build output directory**: `/` (root)
- **Root directory**: `/` (root)

**Important**: Do NOT use `npx wrangler deploy` - that's for Workers!

### Step 3: Configure Functions Bindings

After the project is created:

1. Go to **Settings** → **Functions**
2. Add **R2 Bucket Binding**:
   - Variable name: `GALLERY_R2`
   - Bucket: `gallery-images`
3. Add **KV Namespace Binding**:
   - Variable name: `GALLERY_KV`
   - Namespace: Your created KV namespace

### Step 4: Deploy

1. Click **"Save and Deploy"**
2. Your site will be available at `your-project.pages.dev`
3. Your HTML files will be served correctly!

## Alternative: Keep Worker but Serve Static Assets

If you want to keep using Workers, you'd need to:
- Serve static files from R2 or inline them
- More complex setup
- **Not recommended** for your use case

**Recommendation**: Use Cloudflare Pages - it's designed exactly for what you need!

## Your Pages URL Will Be

After deploying to Pages, your URL will be:
```
https://your-project-name.pages.dev
```

NOT `*.workers.dev`
