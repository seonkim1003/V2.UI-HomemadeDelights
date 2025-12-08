# Fix Cloudflare Pages "Stuck on Uploading"

If Cloudflare Pages is stuck on "uploading" during deployment, here are common causes and fixes:

## Common Causes

### 1. **Large Files in Repository** (Most Common)

If `node_modules/` or `uploads/` are tracked in git, they can be huge and cause upload timeouts.

**Fix:**
1. Ensure `.gitignore` includes:
   ```
   node_modules/
   uploads/
   ```

2. Remove them from git (if already tracked):
   ```bash
   git rm -r --cached node_modules/
   git rm -r --cached uploads/
   git commit -m "Remove large directories from git"
   git push
   ```

### 2. **Repository Size Too Large**

Cloudflare Pages has limits on repository size.

**Check size:**
- Go to your git repository settings
- Check repository size
- If > 100MB, you may need to remove large files

### 3. **Network/Timeout Issues**

Sometimes Cloudflare's servers have temporary issues.

**Fix:**
- Wait 5-10 minutes
- Try canceling and retrying the deployment
- Check Cloudflare status page

### 4. **Build Command Issues**

If build command is misconfigured, it might hang.

**Fix:**
- Ensure build command is **empty** (or `echo "No build needed"`)
- Remove any `wrangler deploy` commands

## Quick Fix Steps

### Step 1: Check What's in Git

```bash
git ls-files | findstr /i "node_modules uploads"
```

If you see these, they need to be removed.

### Step 2: Update .gitignore

Make sure `.gitignore` contains:
```
node_modules/
uploads/
*.log
.DS_Store
.wrangler/
```

### Step 3: Remove from Git (if needed)

```bash
# Remove from git but keep files locally
git rm -r --cached node_modules/
git rm -r --cached uploads/

# Commit the change
git add .gitignore
git commit -m "Remove large directories from git tracking"
git push
```

### Step 4: Retry Deployment

1. Go to Cloudflare Pages dashboard
2. Cancel current deployment if stuck
3. Trigger new deployment (push a commit or click retry)

## What Should Be in Git

✅ **Include:**
- HTML, CSS, JS files
- `functions/` directory
- `package.json`, `package-lock.json`
- `.gitignore`
- `wrangler.toml` (optional for Pages)

❌ **Exclude:**
- `node_modules/` (installed by npm)
- `uploads/` (files go to R2, not git)
- `.wrangler/` (build cache)
- `.env` files

## Prevention

After fixing, your `.gitignore` should ensure:
- `node_modules/` is never committed
- `uploads/` is never committed (images go to R2)
- Only source code is in repository

## Still Stuck?

1. **Check Cloudflare Dashboard** → Logs tab for error messages
2. **Cancel deployment** and retry
3. **Check repository size** in git provider
4. **Try uploading manually** via Cloudflare dashboard (if available)
5. **Contact Cloudflare support** if issue persists
