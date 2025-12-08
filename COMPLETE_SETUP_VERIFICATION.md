# Complete Setup Verification Guide

This guide helps you verify that images are being stored in R2 and displayed on your website.

## ✅ Step 1: Verify R2 and KV Bindings

Visit your website and go to:
```
https://your-site.pages.dev/api/test-bindings
```

**Expected Result:**
```json
{
  "bindings": {
    "R2": "✅ Configured and Working",
    "KV": "✅ Configured and Working"
  }
}
```

**If bindings are not working:**
1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Functions
2. Scroll to "Bindings"
3. Add R2 Bucket binding: Variable name `GALLERY_R2`, select your bucket
4. Add KV Namespace binding: Variable name `GALLERY_KV`, select your namespace
5. **Redeploy** (go to Deployments → Retry deployment)

## ✅ Step 2: Check R2 Bucket Contents

Visit:
```
https://your-site.pages.dev/api/test-image
```

**Expected Result:**
```json
{
  "message": "Found images in R2",
  "totalObjects": 1,
  "firstImage": {
    "key": "image-1234567890-0-123456789.jpg",
    "size": 123456,
    "url": "/api/image/image-1234567890-0-123456789.jpg"
  }
}
```

**If empty:**
- Images haven't been uploaded yet, or
- Upload is failing (check Step 3)

## ✅ Step 3: Upload a Test Image

1. Go to your gallery page
2. Select an image file (JPG, PNG, etc.)
3. Enter a group title
4. Click "Upload"

**What to watch for:**
- Progress bar should reach 100%
- Success message should appear
- Gallery should refresh automatically
- Check browser console (F12) for any errors

**Check Cloudflare Logs:**
1. Go to Cloudflare Dashboard → Workers & Pages → Your Project
2. Click "Logs" or "Real-time Logs"
3. Look for:
   - `Uploading to R2: image-...`
   - `✅ Upload verified - object exists in R2: image-...`
   - `✅ Saved images to KV`
   - `✅ Upload complete`

## ✅ Step 4: Verify Image Storage

### Option A: Via API
Visit:
```
https://your-site.pages.dev/api/test-image
```

You should see your uploaded images listed.

### Option B: Via Cloudflare Dashboard
1. Go to Cloudflare Dashboard → R2
2. Click on your bucket (`gallery-images`)
3. You should see files like `image-1234567890-0-123456789.jpg`

## ✅ Step 5: Verify Image Display

### Check Gallery Page
1. Go to your gallery page
2. You should see:
   - Group cards with cover images
   - Group titles
   - Image counts

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - `Loaded images: X`
   - `Group "Your Group": X images`
   - No error messages

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Img"
4. Look for requests to `/api/image/...`
5. Check:
   - Status: 200 OK
   - Content-Type: `image/jpeg` or `image/png`
   - Size: > 0 bytes

### Test Direct Image URL
1. Get an image URL from `/api/test-image`
2. Open it directly in browser: `https://your-site.pages.dev/api/image/image-1234567890-0-123456789.jpg`
3. Image should display

## ✅ Step 6: Test Slideshow

1. Click on a group card
2. Slideshow should open
3. Images should display
4. Navigation arrows should work
5. Image counter should show (e.g., "1 / 3")

## 🔧 Troubleshooting

### Images Upload But Don't Appear in R2

**Check:**
1. Cloudflare Workers logs for errors
2. `/api/test-bindings` - is R2 binding working?
3. Browser console for upload errors

**Fix:**
- Verify R2 binding is configured correctly
- Check that bucket name matches in Pages settings
- Redeploy after adding bindings

### Images in R2 But Not Displaying

**Check:**
1. Browser Network tab - what status code?
2. `/api/image/[filename]` - does it return the image?
3. Content-Type header - is it set correctly?

**Fix:**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check Cloudflare Workers logs for image serving errors

### Gallery Shows "No Images"

**Check:**
1. `/api/groups` - are groups being returned?
2. `/api/images` - are images being returned?
3. Browser console - any fetch errors?

**Fix:**
- Verify KV binding is configured
- Check that metadata is being saved
- Redeploy if bindings were just added

### Upload Gets Stuck at 100%

**Check:**
1. Cloudflare Workers logs
2. Browser console for errors
3. `/api/test-bindings` - are bindings working?

**Fix:**
- Usually means R2 or KV binding is missing
- Add bindings in Pages Settings → Functions
- Redeploy

## 📊 Complete Flow Verification

The complete flow should be:

1. **Upload** → File sent to `/api/upload`
2. **Store in R2** → `r2Binding.put(filename, fileBody)`
3. **Verify** → `r2Binding.get(filename)` confirms upload
4. **Save Metadata** → `kvBinding.put('images', ...)` and `kvBinding.put('groups', ...)`
5. **Display** → Frontend calls `/api/groups` and `/api/images`
6. **Load Images** → Frontend sets `img.src = /api/image/[filename]`
7. **Serve Images** → `/api/image/[filename]` retrieves from R2 and serves

## 🎯 Success Indicators

You'll know everything is working when:

✅ `/api/test-bindings` shows both R2 and KV working  
✅ `/api/test-image` lists your uploaded images  
✅ R2 bucket in Cloudflare Dashboard shows files  
✅ Gallery page displays group cards with images  
✅ Clicking a group opens slideshow with images  
✅ Direct image URLs work in browser  
✅ No errors in browser console  
✅ No errors in Cloudflare Workers logs  

## 📝 Quick Test Checklist

- [ ] R2 binding configured (`/api/test-bindings`)
- [ ] KV binding configured (`/api/test-bindings`)
- [ ] Upload an image successfully
- [ ] Image appears in R2 bucket (Dashboard or `/api/test-image`)
- [ ] Gallery refreshes after upload
- [ ] Group card shows cover image
- [ ] Clicking group opens slideshow
- [ ] Images display in slideshow
- [ ] Direct image URL works
- [ ] No console errors
- [ ] No Workers log errors

If all checkboxes are checked, your image gallery is fully functional! 🎉

