# Backend Implementation Guide: R2 Upload & Image Display

This guide explains how the backend handles image uploads to Cloudflare R2 and serves images from R2 using Cloudflare Pages Functions.

## Architecture Overview

- **Storage**: Cloudflare R2 (object storage for images)
- **Metadata**: Cloudflare KV (key-value store for image metadata and groups)
- **API**: Cloudflare Pages Functions (`functions/api/[[path]].js`)

---

## 1. Binding Detection

The backend automatically detects R2 and KV bindings with flexible naming:

```javascript
// Detects R2 binding from environment
function getR2Binding(env) {
  // Tries: GALLERY_R2, gallery_r2, gallery-images, etc.
  // Checks for object with put/get/list methods
}

// Detects KV binding from environment  
function getKVBinding(env) {
  // Tries: GALLERY_KV, gallery_kv, etc.
  // Checks for object with get/put methods
}
```

**Why?** Cloudflare Pages allows different binding names, so this makes it flexible.

---

## 2. Image Upload Flow (`POST /api/upload`)

### Step-by-Step Process:

#### Step 1: Receive FormData
```javascript
const formData = await request.formData();
const files = formData.getAll('images'); // Get all uploaded files
```

#### Step 2: Validate Files
```javascript
// Check file types (jpeg, jpg, png, gif, webp)
// Check file size (10MB limit per file)
```

#### Step 3: Process Each File

For each file, the backend:

**a) Generate unique filename:**
```javascript
const uniqueSuffix = Date.now() + '-' + i + '-' + Math.round(Math.random() * 1E9);
const ext = file.name.split('.').pop() || 'jpg';
const imageName = `image-${uniqueSuffix}.${ext}`;
const r2Key = `gallery-images/gallery-image/${imageName}`; // R2 storage path
```

**b) Convert File to ArrayBuffer:**
```javascript
// FormData files are File objects (extend Blob)
let fileBody = await file.arrayBuffer(); // Convert to ArrayBuffer for R2
```

**c) Upload to R2:**
```javascript
await r2Binding.put(r2Key, fileBody, {
  httpMetadata: {
    contentType: file.type || 'image/jpeg', // Preserve MIME type
  },
});
```

**d) Verify Upload:**
```javascript
// Wait 200ms for consistency, then verify
await new Promise(resolve => setTimeout(resolve, 200));
const verify = await r2Binding.get(r2Key);
if (!verify || verify.size === 0) {
  throw new Error('Upload verification failed');
}
```

**e) Create Image Metadata Record:**
```javascript
const imageRecord = {
  id: imageId,
  filename: r2Key, // Full R2 key: "gallery-images/gallery-image/image-123.jpg"
  originalName: file.name,
  path: `/api/image/${r2Key}`, // API endpoint path
  groupId: targetGroup.id,
  uploadedAt: new Date().toISOString()
};
```

#### Step 4: Save Metadata to KV

```javascript
// Save image records
await setKVData(kvBinding, 'images', images);

// Save/update group
await setKVData(kvBinding, 'groups', groups);
```

**KV Structure:**
- Key: `'images'` → Value: `[{id, filename, path, groupId, ...}, ...]`
- Key: `'groups'` → Value: `[{id, title, images: [imageIds], ...}, ...]`

---

## 3. Image Display Flow (`GET /api/image/:filename`)

### Step-by-Step Process:

#### Step 1: Parse Filename
```javascript
let filename = path.split('/api/image/')[1];
filename = decodeURIComponent(filename); // Handle URL encoding
```

#### Step 2: Construct R2 Key
```javascript
// Primary path: gallery-images/gallery-image/filename
let r2Key = filename;

// Backward compatibility: try different paths if not found
if (!filename.startsWith('gallery-images/gallery-image/')) {
  // Try: gallery-images/, gallery-image/, or root
}
```

#### Step 3: Retrieve from R2
```javascript
const object = await r2Binding.get(r2Key);

if (!object) {
  // Try fallback paths (backward compatibility)
  // Return 404 if still not found
}
```

#### Step 4: Determine Content-Type
```javascript
let contentType = 'image/jpeg'; // default

// Try from R2 metadata first
if (object.httpMetadata?.contentType) {
  contentType = object.httpMetadata.contentType;
} else {
  // Infer from file extension
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  contentType = mimeTypes[ext] || 'image/jpeg';
}
```

#### Step 5: Set Response Headers
```javascript
const headers = new Headers(corsHeaders);

// Write R2 HTTP metadata (if available)
if (object.httpMetadata) {
  object.writeHttpMetadata(headers);
}

// Always set Content-Type explicitly
headers.set('Content-Type', contentType);

// Cache headers (1 hour, but allow revalidation)
headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');

// Content-Length for better browser handling
if (object.size) {
  headers.set('Content-Length', object.size.toString());
}

// ETag for cache validation
if (object.httpEtag) {
  headers.set('etag', object.httpEtag);
}
```

#### Step 6: Stream Image Data
```javascript
// R2 object.body is a ReadableStream
let bodyStream = object.body;

// Handle different stream types
if (!(bodyStream instanceof ReadableStream)) {
  if (bodyStream?.stream) {
    bodyStream = bodyStream.stream();
  }
}

// Return Response with stream
return new Response(bodyStream, {
  headers,
  status: 200,
});
```

**Why streams?** R2 returns ReadableStream for efficient memory usage with large files.

---

## 4. Key Helper Functions

### KV Operations

```javascript
// Read from KV
async function getKVData(kvBinding, key, defaultValue = []) {
  if (!kvBinding) return defaultValue;
  const data = await kvBinding.get(key);
  return data ? JSON.parse(data) : defaultValue;
}

// Write to KV
async function setKVData(kvBinding, key, data) {
  if (!kvBinding) throw new Error('KV binding not configured');
  await kvBinding.put(key, JSON.stringify(data));
}
```

### R2 Operations

```javascript
// Upload: r2Binding.put(key, body, options)
await r2Binding.put(r2Key, arrayBuffer, {
  httpMetadata: { contentType: 'image/jpeg' }
});

// Retrieve: r2Binding.get(key)
const object = await r2Binding.get(r2Key);

// Delete: r2Binding.delete(key)
await r2Binding.delete(r2Key);

// List: r2Binding.list({ prefix, limit })
const list = await r2Binding.list({ 
  prefix: 'gallery-images/gallery-image/',
  limit: 10 
});
```

---

## 5. Data Flow Diagram

```
┌─────────────┐
│   Frontend  │
│  (gallery.js)│
└──────┬──────┘
       │ POST /api/upload (FormData with images)
       ▼
┌─────────────────────────────────────┐
│  Cloudflare Pages Function           │
│  functions/api/[[path]].js          │
└──────┬───────────────────────────────┘
       │
       ├─► Validate files (type, size)
       │
       ├─► For each file:
       │   ├─► Convert File → ArrayBuffer
       │   ├─► Upload to R2: r2Binding.put(key, buffer)
       │   ├─► Verify upload exists
       │   └─► Create metadata record
       │
       ├─► Save metadata to KV:
       │   ├─► kvBinding.put('images', JSON.stringify([...]))
       │   └─► kvBinding.put('groups', JSON.stringify([...]))
       │
       └─► Return success response
```

```
┌─────────────┐
│   Frontend  │
│  (gallery.js)│
└──────┬──────┘
       │ GET /api/image/gallery-images/gallery-image/image-123.jpg
       ▼
┌─────────────────────────────────────┐
│  Cloudflare Pages Function           │
│  functions/api/[[path]].js           │
└──────┬───────────────────────────────┘
       │
       ├─► Parse filename from URL
       │
       ├─► Get from R2: r2Binding.get(r2Key)
       │
       ├─► Set headers (Content-Type, Cache-Control, etc.)
       │
       └─► Return Response with ReadableStream
```

---

## 6. Important Implementation Details

### File Conversion (Upload)

**Problem:** FormData files in Cloudflare Workers are `File` objects, but R2 needs `ArrayBuffer`, `ReadableStream`, or `Blob`.

**Solution:**
```javascript
// File objects have arrayBuffer() method
if (file && typeof file.arrayBuffer === 'function') {
  fileBody = await file.arrayBuffer();
} else if (file instanceof Blob) {
  fileBody = await file.arrayBuffer();
} else if (file?.stream) {
  fileBody = file.stream(); // Use stream directly
}
```

### Stream Handling (Display)

**Problem:** R2 returns `ReadableStream`, but we need to handle edge cases.

**Solution:**
```javascript
let bodyStream = object.body;

// Check if it's a ReadableStream
if (!(bodyStream instanceof ReadableStream)) {
  // Try to convert if it has stream() method
  if (bodyStream?.stream) {
    bodyStream = bodyStream.stream();
  }
}

// Pass directly to Response constructor
return new Response(bodyStream, { headers });
```

### Backward Compatibility

The code handles multiple R2 key formats:
- `gallery-images/gallery-image/filename.jpg` (current)
- `gallery-images/filename.jpg` (fallback)
- `gallery-image/filename.jpg` (old format)
- `filename.jpg` (root level)

---

## 7. Error Handling

### Upload Errors
- Missing bindings → Detailed error with troubleshooting steps
- File conversion errors → Clear error message
- R2 upload failures → Error with filename and details
- KV save failures → Error with context

### Display Errors
- Missing R2 binding → 500 error
- Image not found → 404 error (after trying fallback paths)
- Stream errors → 500 error with details

---

## 8. Testing Endpoints

The backend includes debug endpoints:

- `GET /api/debug/bindings` - Check if bindings are detected
- `GET /api/test-bindings` - Actually test R2/KV operations
- `GET /api/test-image` - List images in R2
- `POST /api/test-upload` - Test R2 upload with a small test file

---

## 9. Configuration Requirements

### Cloudflare Pages Settings

1. **R2 Bucket Binding:**
   - Variable name: `GALLERY_R2` (or `gallery-images`)
   - Bucket: Your R2 bucket name

2. **KV Namespace Binding:**
   - Variable name: `GALLERY_KV`
   - Namespace: Your KV namespace

3. **Important:** After adding bindings, you MUST redeploy!

---

## 10. Key Takeaways

1. **R2 stores the actual image files** (binary data)
2. **KV stores metadata** (JSON: image records, groups)
3. **Files are converted to ArrayBuffer** before R2 upload
4. **Images are streamed** from R2 for efficient serving
5. **Backward compatibility** handles different R2 key formats
6. **Flexible binding detection** works with various naming conventions
7. **Verification steps** ensure uploads succeed before saving metadata

---

## Example API Calls

### Upload Image
```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
formData.append('groupTitle', 'My Gallery');

fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

### Get Image
```javascript
// Image URL: /api/image/gallery-images/gallery-image/image-123.jpg
<img src="/api/image/gallery-images/gallery-image/image-123.jpg" />
```

### Get All Images (Metadata)
```javascript
const response = await fetch('/api/images');
const images = await response.json();
// Returns: [{id, filename, path, groupId, ...}, ...]
```

### Get Groups
```javascript
const response = await fetch('/api/groups');
const groups = await response.json();
// Returns: [{id, title, images: [imageIds], coverImage, ...}, ...]
```

---

This implementation provides a robust, scalable image upload and display system using Cloudflare's serverless infrastructure.


