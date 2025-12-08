# Image Display Debugging Guide

If images are uploading successfully but not displaying, follow these steps:

## 1. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for errors when images try to load
- **Network tab**: Check the image requests:
  - Status code (should be 200)
  - Content-Type header (should be `image/jpeg`, `image/png`, etc.)
  - Response size (should be > 0)

## 2. Test Image Endpoint Directly

Visit these URLs in your browser to test:

### Check if images exist in R2:
```
https://your-site.pages.dev/api/test-image
```

This will show:
- List of all images in R2
- URLs to test each image
- Image metadata (size, upload date)

### Test a specific image:
```
https://your-site.pages.dev/api/image/image-1234567890-0-123456789.jpg
```
(Replace with an actual filename from `/api/test-image`)

## 3. Check Cloudflare Workers Logs

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your Pages project
3. Go to **Logs** or **Real-time Logs**
4. Look for:
   - `Fetching image from R2: [filename]`
   - `Serving image: [filename] Content-Type: [type]`
   - Any error messages

## 4. Verify R2 Binding

Visit:
```
https://your-site.pages.dev/api/test-bindings
```

This will:
- Test if R2 binding is working
- Test if KV binding is working
- Show any errors

## 5. Common Issues and Fixes

### Issue: Images return 404
**Cause**: Filename mismatch between stored path and R2 key
**Fix**: Check that `image.path` matches the actual R2 key

### Issue: Images return 500
**Cause**: R2 binding not configured or error accessing R2
**Fix**: 
1. Check `/api/test-bindings` endpoint
2. Verify R2 binding in Pages Settings → Functions → Bindings
3. Redeploy after adding bindings

### Issue: Images load but show blank/error
**Cause**: Content-Type header not set correctly
**Fix**: The code now explicitly sets Content-Type - redeploy

### Issue: CORS errors
**Cause**: CORS headers not set correctly
**Fix**: Already handled in code - check Network tab for CORS headers

## 6. Manual Testing Steps

1. **Upload a new image** and note the filename from the response
2. **Check R2 bucket** in Cloudflare Dashboard:
   - Go to R2 → Your bucket
   - Verify the image exists with the correct filename
3. **Test direct access**:
   - Copy the image URL from the upload response
   - Open in a new browser tab
   - Check if it loads

## 7. Debug Information to Collect

If images still don't work, collect:

1. **Browser Console errors** (screenshot)
2. **Network tab** for a failed image request (screenshot)
3. **Response from `/api/test-image`** (copy JSON)
4. **Response from `/api/test-bindings`** (copy JSON)
5. **Cloudflare Workers logs** (copy relevant lines)

## 8. Quick Fixes to Try

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** the page (Ctrl+F5)
3. **Try incognito/private mode**
4. **Check if images work in a different browser**
5. **Redeploy** the Pages project (even without changes)

## 9. Verify Image Path Format

Images should be stored with paths like:
```
/api/image/image-1234567890-0-123456789.jpg
```

Make sure:
- Path starts with `/api/image/`
- Filename matches what's stored in R2
- No extra query parameters or fragments

## 10. Check Image Metadata

When uploading, verify:
- `file.type` is set (e.g., `image/jpeg`)
- `file.size` is > 0
- `file.name` has a valid extension

The code now:
- ✅ Sets Content-Type explicitly
- ✅ Handles URL encoding/decoding
- ✅ Provides detailed error logging
- ✅ Tests R2 operations
- ✅ Handles missing metadata gracefully

If issues persist after these checks, the problem might be:
- R2 bucket permissions
- Cloudflare Pages deployment issue
- Browser-specific issue

