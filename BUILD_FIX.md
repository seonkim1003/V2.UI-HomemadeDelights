# Fix Cloudflare Pages Build Configuration

The error you're seeing is because Cloudflare Pages is trying to run `npx wrangler deploy` as a build command. For Cloudflare Pages with Functions, you **do NOT need a build command**.

## Fix in Cloudflare Dashboard (RECOMMENDED)

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Builds & deployments**
3. Find the **Build configuration** section
4. **Clear/Remove the build command** - leave it empty
5. Set **Build output directory** to `/` (root) or leave empty
6. Click **Save**

## Alternative Solutions

### Option 1: Use Simple Echo Command

If you can't remove the build command entirely, set it to:
```bash
echo "No build needed for static site with Functions"
```

Or simply:
```bash
true
```

### Option 2: Use Build Scripts (Windows/Linux compatible)

Set build command to:
```bash
bash build.sh
```

Or for Windows:
```batch
build.bat
```

These scripts do nothing and will exit successfully.

## Why This Happens

- **Cloudflare Pages** automatically detects and deploys:
  - Static files (HTML, CSS, JS) from the root directory
  - Functions from the `functions/` directory
  
- **Cloudflare Workers** require `wrangler deploy` to deploy
  
Your project is a **Pages** project, not a Workers project, so no build command is needed.

## After Fixing

After removing/clearing the build command:
1. Trigger a new deployment (push a commit or click "Retry deployment")
2. The build should succeed
3. Your site will be deployed with Functions automatically detected

## Verification

Once deployed, verify:
- Static files are served correctly
- Functions at `/api/*` routes work
- R2 and KV bindings are configured in Settings → Functions

