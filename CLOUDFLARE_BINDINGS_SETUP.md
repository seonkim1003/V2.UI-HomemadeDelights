# Configure Cloudflare R2 and KV Bindings

## Why Upload Gets Stuck at 100%

The upload reaches 100% because the file is uploaded to Cloudflare, but then the function tries to:
1. Store the image in **R2** (Cloudflare's object storage)
2. Save metadata in **KV** (key-value database)

If these bindings aren't configured, the function fails silently or hangs.

## Where Files Are Stored

### Images → Cloudflare R2
- Images are stored in an **R2 bucket** named `gallery-images`
- Access via: `/api/image/{filename}` endpoint

### Metadata → Cloudflare KV
- Groups list
- Images list
- Image metadata (filename, group ID, etc.)

## Required Setup Steps

### Step 1: Create R2 Bucket

1. Go to **Cloudflare Dashboard** → **R2**
2. Click **"Create bucket"**
3. Name: `gallery-images`
4. Choose location (closest to your users)
5. Click **"Create bucket"**

### Step 2: Create KV Namespace

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **KV**
2. Click **"Create a namespace"**
3. Name: `GALLERY_KV` (or any name you prefer)
4. Click **"Add"**
5. **Copy the Namespace ID** - you'll need this

### Step 3: Configure Bindings in Pages

**CRITICAL**: This is the step that's probably missing!

1. Go to your **Cloudflare Pages** project
2. Click **Settings** → **Functions**
3. Scroll down to **"Bindings"** section

#### Add R2 Bucket Binding:

1. Under **"R2 Bucket Bindings"**, click **"Add binding"**
2. **Variable name**: `GALLERY_R2` (must match exactly!)
3. **R2 Bucket**: Select `gallery-images` (the bucket you created)
4. Click **"Save"**

#### Add KV Namespace Binding:

1. Under **"KV Namespace Bindings"**, click **"Add binding"**
2. **Variable name**: `GALLERY_KV` (must match exactly!)
3. **KV Namespace**: Select your created namespace (or enter the ID)
4. Click **"Save"**

### Step 4: Redeploy

After adding bindings:
1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the latest deployment
   OR
3. Push a new commit to trigger redeployment

## Verification

After setup, when you upload:
- ✅ Upload progress goes to 100%
- ✅ Image is stored in R2 bucket (`gallery-images`)
- ✅ Metadata is saved in KV
- ✅ Image appears in gallery

## Troubleshooting

### Upload Stuck at 100%

**Symptom**: Progress shows 100% but never completes

**Cause**: Bindings not configured

**Fix**: Complete Step 3 above

### "R2 bucket binding not configured" Error

**Cause**: `GALLERY_R2` binding missing or wrong name

**Fix**: 
- Check variable name is exactly `GALLERY_R2`
- Verify bucket exists and is selected
- Redeploy after adding binding

### "KV namespace binding not configured" Error

**Cause**: `GALLERY_KV` binding missing or wrong name

**Fix**:
- Check variable name is exactly `GALLERY_KV`
- Verify namespace exists and is selected
- Redeploy after adding binding

### Images Don't Appear After Upload

**Possible causes**:
1. Bindings not configured (most common)
2. Function error - check deployment logs
3. R2 bucket doesn't exist
4. KV namespace doesn't exist

**Fix**:
1. Check Functions logs in Cloudflare dashboard
2. Verify all bindings are configured correctly
3. Try uploading again after fixing bindings

## Check if Bindings Are Configured

1. Go to Pages project → **Settings** → **Functions**
2. Scroll to **Bindings** section
3. You should see:
   - ✅ R2 Bucket: `GALLERY_R2` → `gallery-images`
   - ✅ KV Namespace: `GALLERY_KV` → `your-namespace-id`

If either is missing, that's your problem!

## Important Notes

- **Variable names are case-sensitive**: `GALLERY_R2` not `gallery_r2`
- **Must redeploy** after adding bindings for them to take effect
- **Both bindings are required** - R2 for images, KV for metadata
- **Free tier limits**: R2 has 10GB free, KV has 100MB free (should be plenty for galleries)
