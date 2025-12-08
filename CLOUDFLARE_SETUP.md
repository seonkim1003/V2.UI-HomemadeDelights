# Cloudflare Pages Setup Guide

This guide will help you set up the Homemade Delights website on Cloudflare Pages.

## Step 1: Create Cloudflare Resources

### Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Click "Create bucket"
3. Name it: `gallery-images`
4. Choose a location (closest to your users)
5. Click "Create bucket"

### Create KV Namespace

1. Go to Cloudflare Dashboard → Workers & Pages → KV
2. Click "Create a namespace"
3. Name it: `GALLERY_KV` (or any name you prefer)
4. Click "Add"
5. **Copy the Namespace ID** - you'll need this later

## Step 2: Connect Repository to Cloudflare Pages

1. Go to Cloudflare Dashboard → Workers & Pages → Pages
2. Click "Create a project"
3. Click "Connect to Git"
4. Select your Git provider (GitHub, GitLab, etc.)
5. Authorize Cloudflare to access your repositories
6. Select the `HomeMadeDelights` repository
7. Click "Begin setup"

## Step 3: Configure Build Settings

**IMPORTANT**: Cloudflare Pages with Functions does NOT need a build command!

In the build configuration:

- **Framework preset**: None (or Static Site)
- **Build command**: ⚠️ **LEAVE EMPTY** or use `echo "No build needed"` (DO NOT use `npx wrangler deploy`)
- **Build output directory**: `/` (root) or leave empty
- **Root directory**: `/` (root)

**Critical**: If you see errors about "Missing entry-point", it means a build command is set incorrectly. Remove any build command that includes `wrangler deploy`.

## Step 4: Configure Functions Bindings

**IMPORTANT**: This is the critical step!

1. After creating the Pages project, go to **Settings** → **Functions**
2. Scroll down to **Bindings**

### Add R2 Bucket Binding

1. Under "R2 Bucket Bindings", click "Add binding"
2. **Variable name**: `GALLERY_R2`
3. **R2 Bucket**: Select `gallery-images`
4. Click "Save"

### Add KV Namespace Binding

1. Under "KV Namespace Bindings", click "Add binding"
2. **Variable name**: `GALLERY_KV`
3. **KV Namespace**: Select your created namespace (or enter the ID)
4. Click "Save"

## Step 5: Deploy

1. Click "Save and Deploy"
2. Cloudflare will build and deploy your site
3. Your site will be available at: `https://your-project.pages.dev`

## Step 6: Custom Domain (Optional)

1. Go to **Custom domains** in your Pages project
2. Click "Set up a custom domain"
3. Follow the instructions to add your domain

## Troubleshooting

### "Failed to fetch repository" Error

This usually means:
- The repository is private and Cloudflare doesn't have access
- The repository name/path is incorrect
- There's a network issue

**Solutions:**
1. Make sure the repository is public, OR
2. Grant Cloudflare access to private repositories in your Git provider settings
3. Double-check the repository URL

### Functions Not Working

If API endpoints return 404:
1. Verify the `functions/api/[[path]].js` file exists
2. Check that bindings are configured correctly in Settings → Functions
3. Check the Functions logs in the Cloudflare dashboard

### Images Not Loading

If images don't load:
1. Verify R2 bucket binding is set up correctly
2. Check that images are being uploaded to R2 (check R2 bucket contents)
3. Verify the image path format in the API response

### KV Data Not Persisting

If data disappears:
1. Verify KV namespace binding is configured
2. Check KV namespace ID is correct
3. Note: Preview deployments use a separate preview namespace

## Local Development

To test locally with Wrangler:

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Update wrangler.toml with your actual IDs
# Then run:
wrangler pages dev
```

## Need Help?

- Check Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- Check Workers docs: https://developers.cloudflare.com/workers/
- Check R2 docs: https://developers.cloudflare.com/r2/
