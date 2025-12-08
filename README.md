# Homemade Delights Website

A student-led project website with an Instagram-style image gallery system.

## Features

- Multi-language support (English/Korean)
- Image gallery with grouping functionality
- Drag-and-drop image upload
- Interactive slideshow viewer
- Responsive design

## Cloudflare Pages Deployment

This project is configured to deploy on Cloudflare Pages with Workers integration.

### Prerequisites

1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. Cloudflare R2 bucket for image storage
4. Cloudflare KV namespace for metadata storage

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create R2 bucket:**
   ```bash
   npm run r2:create
   ```
   Or manually create a bucket named `gallery-images` in Cloudflare dashboard.

3. **Create KV namespace:**
   ```bash
   npm run kv:create
   ```
   This will output a namespace ID. Update `wrangler.toml` with the actual IDs:
   - Replace `your-kv-namespace-id` with the production namespace ID
   - Replace `your-kv-preview-id` with the preview namespace ID (if created)

4. **Update wrangler.toml:**
   Edit `wrangler.toml` and replace the placeholder KV namespace IDs with your actual IDs.

5. **Local development:**
   ```bash
   npm run dev
   ```

6. **Deploy to Cloudflare Pages:**
   - Connect your GitHub repository to Cloudflare Pages
   - Cloudflare will automatically detect the `functions` directory
   - Make sure to set up the R2 and KV bindings in the Cloudflare dashboard:
     - Go to Pages project → Settings → Functions
     - Add R2 bucket binding: `GALLERY_R2` → `gallery-images`
     - Add KV namespace binding: `GALLERY_KV` → your namespace

### Environment Setup in Cloudflare Dashboard

After connecting your repository:

1. Go to your Pages project in Cloudflare dashboard
2. Navigate to Settings → Functions
3. Add bindings:
   - **R2 Bucket**: Name `GALLERY_R2`, select `gallery-images` bucket
   - **KV Namespace**: Name `GALLERY_KV`, select your created namespace

### File Structure

```
HomeMadeDelights/
├── functions/
│   └── api/
│       └── [[path]].js    # Cloudflare Workers API handler
├── wrangler.toml          # Cloudflare configuration
├── package.json
├── gallery.html
├── gallery.js
└── [other HTML/CSS/JS files]
```

### API Endpoints

- `GET /api/images` - Get all images
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get specific group
- `POST /api/groups` - Create new group
- `POST /api/upload` - Upload images
- `GET /api/image/:filename` - Serve image from R2
- `DELETE /api/images/:id` - Delete image

### Notes

- Images are stored in Cloudflare R2
- Metadata (groups, images list) is stored in Cloudflare KV
- The Workers function handles all API requests
- Static files (HTML, CSS, JS) are served by Cloudflare Pages

## Development

For local development with the old Node.js server (if needed):

```bash
# Install old dependencies (if you have server.js)
npm install express multer cors

# Run local server
node server.js
```

Note: `server.js` is kept for reference but is not used in Cloudflare Pages deployment.