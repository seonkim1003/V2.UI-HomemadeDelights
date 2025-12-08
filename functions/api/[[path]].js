// Cloudflare Workers API handler for image gallery
// This handles all /api/* routes

// Helper function to detect R2 binding (handles different naming conventions)
function getR2Binding(env) {
  // Try exact match first
  if (env.GALLERY_R2) return env.GALLERY_R2;
  
  // Try case variations
  if (env.gallery_r2) return env.gallery_r2;
  if (env.Gallery_R2) return env.Gallery_R2;
  if (env.gallery_R2) return env.gallery_R2;
  
  // Search for any R2-related binding
  const allEnvKeys = Object.keys(env);
  const r2Keys = allEnvKeys.filter(key => {
    const lower = key.toLowerCase();
    return (lower.includes('r2') || lower.includes('gallery') || lower.includes('bucket')) &&
           typeof env[key] === 'object' && 
           env[key] !== null &&
           ('put' in env[key] || 'get' in env[key]);
  });
  
  if (r2Keys.length > 0) {
    console.log('Found R2 binding with name:', r2Keys[0]);
    return env[r2Keys[0]];
  }
  
  return null;
}

// Helper function to detect KV binding
function getKVBinding(env) {
  if (env.GALLERY_KV) return env.GALLERY_KV;
  if (env.gallery_kv) return env.gallery_kv;
  if (env.Gallery_KV) return env.Gallery_KV;
  
  const allEnvKeys = Object.keys(env);
  const kvKeys = allEnvKeys.filter(key => {
    const lower = key.toLowerCase();
    return (lower.includes('kv') || lower.includes('gallery')) &&
           typeof env[key] === 'object' && 
           env[key] !== null &&
           ('get' in env[key] || 'put' in env[key]);
  });
  
  if (kvKeys.length > 0) {
    console.log('Found KV binding with name:', kvKeys[0]);
    return env[kvKeys[0]];
  }
  
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get bindings (with flexible detection)
  const GALLERY_R2 = getR2Binding(env);
  const GALLERY_KV = getKVBinding(env);

  // Route handling (pass detected bindings)
  if (path === '/api/images' && request.method === 'GET') {
    return handleGetImages(GALLERY_KV, corsHeaders);
  }

  if (path === '/api/groups' && request.method === 'GET') {
    return handleGetGroups(GALLERY_KV, corsHeaders);
  }

  if (path.startsWith('/api/groups/') && request.method === 'GET') {
    const groupId = path.split('/api/groups/')[1];
    return handleGetGroup(groupId, GALLERY_KV, corsHeaders);
  }

  if (path === '/api/groups' && request.method === 'POST') {
    return handleCreateGroup(request, GALLERY_KV, corsHeaders);
  }

  if (path === '/api/upload' && request.method === 'POST') {
    return handleUpload(request, GALLERY_R2, GALLERY_KV, corsHeaders);
  }

  if (path.startsWith('/api/image/') && request.method === 'GET') {
    let filename = path.split('/api/image/')[1];
    // Handle query parameters if any
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    // URL decode the filename in case it contains encoded characters
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {
      console.warn('Failed to decode filename, using as-is:', filename, e);
    }
    return handleGetImage(filename, GALLERY_R2, corsHeaders);
  }

  if (path.startsWith('/api/images/') && request.method === 'DELETE') {
    const imageId = path.split('/api/images/')[1];
    return handleDeleteImage(imageId, GALLERY_R2, GALLERY_KV, corsHeaders);
  }

  // Test bindings endpoint - actually tests R2/KV operations
  if (path === '/api/test-bindings' && request.method === 'GET') {
    return handleTestBindings(GALLERY_R2, GALLERY_KV, env, corsHeaders);
  }

  // Debug endpoint to check bindings
  if (path === '/api/debug/bindings' && request.method === 'GET') {
    return handleDebugBindings(GALLERY_R2, GALLERY_KV, env, corsHeaders);
  }

  // Test image endpoint - list first image and try to serve it
  if (path === '/api/test-image' && request.method === 'GET') {
    return handleTestImage(GALLERY_R2, corsHeaders);
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}

// Helper functions for KV operations
async function getKVData(kvBinding, key, defaultValue = []) {
  try {
    if (!kvBinding) {
      console.warn(`KV binding not available for key: ${key}`);
      return defaultValue;
    }
    const data = await kvBinding.get(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return defaultValue;
  }
}

async function setKVData(kvBinding, key, data) {
  try {
    if (!kvBinding) {
      throw new Error('KV binding not configured');
    }
    await kvBinding.put(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    throw error;
  }
}

// GET /api/images
async function handleGetImages(kvBinding, corsHeaders) {
  try {
    const images = await getKVData(kvBinding, 'images', []);
    return new Response(JSON.stringify(images), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to retrieve images' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// GET /api/groups
async function handleGetGroups(kvBinding, corsHeaders) {
  try {
    const groups = await getKVData(kvBinding, 'groups', []);
    return new Response(JSON.stringify(groups), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to retrieve groups' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// GET /api/groups/:id
async function handleGetGroup(groupId, kvBinding, corsHeaders) {
  try {
    const groups = await getKVData(kvBinding, 'groups', []);
    const group = groups.find(g => g.id === groupId);
    
    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify(group), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to retrieve group' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/groups
async function handleCreateGroup(request, kvBinding, corsHeaders) {
  try {
    const { title } = await request.json();
    
    if (!title || title.trim() === '') {
      return new Response(JSON.stringify({ error: 'Group title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const groups = await getKVData(kvBinding, 'groups', []);
    const newGroup = {
      id: Date.now() + '-' + Math.round(Math.random() * 1E9),
      title: title.trim(),
      coverImage: null,
      images: [],
      createdAt: new Date().toISOString()
    };
    
    groups.push(newGroup);
    await setKVData(kvBinding, 'groups', groups);
    
    return new Response(JSON.stringify({
      success: true,
      group: newGroup
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create group: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/upload
async function handleUpload(request, r2Binding, kvBinding, corsHeaders) {
  try {
    // Check bindings first
    if (!r2Binding) {
      return new Response(JSON.stringify({ 
        error: 'R2 bucket binding not configured.',
        details: 'Please configure GALLERY_R2 binding in Cloudflare Pages Settings → Functions.',
        troubleshooting: [
          '1. Go to Pages → Settings → Functions → Bindings',
          '2. Add R2 Bucket binding with variable name: GALLERY_R2 (must be exact, all caps)',
          '3. Select bucket: gallery-images',
          '4. Save and REDEPLOY (retry deployment or push new commit)',
          '5. Bindings only work after redeployment!'
        ]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!kvBinding) {
      return new Response(JSON.stringify({ 
        error: 'KV namespace binding not configured.',
        details: 'Please configure GALLERY_KV binding in Cloudflare Pages Settings → Functions.',
        troubleshooting: [
          '1. Go to Pages → Settings → Functions → Bindings',
          '2. Add KV Namespace binding with variable name: GALLERY_KV (must be exact, all caps)',
          '3. Select your KV namespace',
          '4. Save and REDEPLOY (retry deployment or push new commit)',
          '5. Bindings only work after redeployment!'
        ]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const files = formData.getAll('images');
    
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files uploaded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return new Response(JSON.stringify({ error: 'Only image files are allowed (jpeg, jpg, png, gif, webp)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'File size exceeds 10MB limit' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const groupId = formData.get('groupId') || null;
    const groupTitle = formData.get('groupTitle') || null;
    let targetGroup = null;

    // Handle group creation or selection
    const groups = await getKVData(kvBinding, 'groups', []);
    
    if (groupId) {
      targetGroup = groups.find(g => g.id === groupId);
      if (!targetGroup) {
        return new Response(JSON.stringify({ error: 'Group not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (groupTitle && groupTitle.trim() !== '') {
      targetGroup = {
        id: Date.now() + '-' + Math.round(Math.random() * 1E9),
        title: groupTitle.trim(),
        coverImage: null,
        images: [],
        createdAt: new Date().toISOString()
      };
      groups.push(targetGroup);
    } else {
      // Create default group
      targetGroup = groups.find(g => g.title === 'Default');
      if (!targetGroup) {
        targetGroup = {
          id: Date.now() + '-' + Math.round(Math.random() * 1E9),
          title: 'Default',
          coverImage: null,
          images: [],
          createdAt: new Date().toISOString()
        };
        groups.push(targetGroup);
      }
    }

    // Upload files to R2 and create image records
    const images = await getKVData(kvBinding, 'images', []);
    const newImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uniqueSuffix = Date.now() + '-' + i + '-' + Math.round(Math.random() * 1E9);
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `image-${uniqueSuffix}.${ext}`;

      // Upload to R2
      try {
        // Ensure we have a valid content type
        const contentType = file.type || 'image/jpeg';
        console.log('Uploading to R2:', filename, 'Content-Type:', contentType);
        
        await r2Binding.put(filename, file.stream(), {
          httpMetadata: {
            contentType: contentType,
          },
        });
        
        console.log('Successfully uploaded to R2:', filename);
      } catch (r2Error) {
        console.error('R2 upload error:', r2Error);
        return new Response(JSON.stringify({ 
          error: 'Failed to upload to R2: ' + r2Error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const imageId = Date.now() + '-' + i + '-' + Math.round(Math.random() * 1E9);
      const imageRecord = {
        id: imageId,
        filename: filename,
        originalName: file.name,
        path: `/api/image/${filename}`,
        groupId: targetGroup.id,
        uploadedAt: new Date().toISOString()
      };

      newImages.push(imageRecord);
      images.push(imageRecord);
    }

    // Update group
    targetGroup.images.push(...newImages.map(img => img.id));
    if (!targetGroup.coverImage && newImages.length > 0) {
      targetGroup.coverImage = newImages[0].path;
    }

    // Update groups array
    const groupIndex = groups.findIndex(g => g.id === targetGroup.id);
    if (groupIndex !== -1) {
      groups[groupIndex] = targetGroup;
    } else {
      groups.push(targetGroup);
    }

    // Save to KV
    await setKVData(kvBinding, 'images', images);
    await setKVData(kvBinding, 'groups', groups);

    return new Response(JSON.stringify({
      success: true,
      message: `${newImages.length} image(s) uploaded successfully`,
      images: newImages,
      group: targetGroup
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to upload images: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// GET /api/image/:filename - Serve image from R2
async function handleGetImage(filename, r2Binding, corsHeaders) {
  try {
    if (!r2Binding) {
      console.error('R2 binding not available for image:', filename);
      return new Response('R2 binding not configured', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    
    console.log('Fetching image from R2:', filename);
    const object = await r2Binding.get(filename);
    
    if (!object) {
      console.warn('Image not found in R2:', filename);
      return new Response('Image not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Get content type from object metadata or infer from filename
    let contentType = 'image/jpeg'; // default
    if (object.httpMetadata && object.httpMetadata.contentType) {
      contentType = object.httpMetadata.contentType;
    } else {
      // Infer from file extension
      const ext = filename.split('.').pop()?.toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      };
      contentType = mimeTypes[ext] || 'image/jpeg';
    }

    const headers = new Headers(corsHeaders);
    
    // Write HTTP metadata first (this sets Content-Type from R2 metadata if available)
    if (object.httpMetadata) {
      object.writeHttpMetadata(headers);
    }
    
    // Always set Content-Type explicitly (R2 metadata might not have it)
    headers.set('Content-Type', contentType);
    
    // Add cache headers for images
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Set ETag if available
    if (object.httpEtag) {
      headers.set('etag', object.httpEtag);
    }

    console.log('Serving image:', filename, 'Content-Type:', headers.get('Content-Type'), 'Body type:', typeof object.body, 'Body null?', object.body === null);

    // Handle the object body - R2 objects return a ReadableStream
    if (!object.body) {
      console.error('Object body is null for:', filename);
      return new Response('Image data not available', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    
    // Return the response with the stream
    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('Error retrieving image:', filename, error);
    return new Response('Failed to retrieve image: ' + error.message, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
}

// DELETE /api/images/:id
async function handleDeleteImage(imageId, r2Binding, kvBinding, corsHeaders) {
  try {
    const images = await getKVData(kvBinding, 'images', []);
    const imageIndex = images.findIndex(img => img.id === imageId);

    if (imageIndex === -1) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const image = images[imageIndex];

    // Delete from R2
    if (r2Binding) {
      try {
        await r2Binding.delete(image.filename);
      } catch (error) {
        console.error('Error deleting from R2:', error);
      }
    }

    // Remove from images array
    images.splice(imageIndex, 1);
    await setKVData(kvBinding, 'images', images);

    // Update groups to remove image reference
    const groups = await getKVData(kvBinding, 'groups', []);
    for (const group of groups) {
      const imgIndex = group.images.indexOf(imageId);
      if (imgIndex !== -1) {
        group.images.splice(imgIndex, 1);
        // Update cover if it was the deleted image
        if (group.coverImage === image.path) {
          group.coverImage = null;
        }
      }
    }
    await setKVData(kvBinding, 'groups', groups);

    return new Response(JSON.stringify({ success: true, message: 'Image deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete image: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// GET /api/test-bindings - Actually test R2/KV operations
async function handleTestBindings(r2Binding, kvBinding, env, corsHeaders) {
  const allEnvKeys = Object.keys(env);
  const r2Bindings = allEnvKeys.filter(key => 
    key.includes('R2') || key.includes('r2') || key.toLowerCase().includes('gallery')
  );
  const kvBindings = allEnvKeys.filter(key => 
    key.includes('KV') || key.includes('kv') || key.toLowerCase().includes('gallery')
  );

  const results = {
    r2: {
      detected: !!r2Binding,
      tested: false,
      working: false,
      error: null
    },
    kv: {
      detected: !!kvBinding,
      tested: false,
      working: false,
      error: null
    },
    allEnvKeys: allEnvKeys,
    r2Related: r2Bindings,
    kvRelated: kvBindings,
  };

  // Test R2 by trying to list objects (non-destructive)
  if (r2Binding) {
    try {
      results.r2.tested = true;
      // Try a simple operation - list with limit 1
      await r2Binding.list({ limit: 1 });
      results.r2.working = true;
    } catch (error) {
      results.r2.error = error.message;
      results.r2.working = false;
    }
  }

  // Test KV by trying to read a test key (non-destructive)
  if (kvBinding) {
    try {
      results.kv.tested = true;
      await kvBinding.get('__test_binding_check__');
      results.kv.working = true;
    } catch (error) {
      results.kv.error = error.message;
      results.kv.working = false;
    }
  }

  return new Response(JSON.stringify({
    bindings: {
      R2: results.r2.detected 
        ? (results.r2.working ? '✅ Configured and Working' : `⚠️ Detected but error: ${results.r2.error}`)
        : '❌ Not found',
      KV: results.kv.detected 
        ? (results.kv.working ? '✅ Configured and Working' : `⚠️ Detected but error: ${results.kv.error}`)
        : '❌ Not found',
    },
    details: results,
    message: results.r2.working && results.kv.working
      ? 'All bindings are configured and working correctly!' 
      : 'Some bindings are missing or not working. Check the details above.'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// GET /api/debug/bindings - Debug endpoint to check bindings
async function handleDebugBindings(r2Binding, kvBinding, env, corsHeaders) {
  const allEnvKeys = Object.keys(env);
  const r2Bindings = allEnvKeys.filter(key => 
    key.includes('R2') || key.includes('r2') || key.toLowerCase().includes('gallery')
  );
  const kvBindings = allEnvKeys.filter(key => 
    key.includes('KV') || key.includes('kv') || key.toLowerCase().includes('gallery')
  );

  return new Response(JSON.stringify({
    bindings: {
      R2: r2Binding ? '✅ Detected' : '❌ Not found',
      KV: kvBinding ? '✅ Detected' : '❌ Not found',
    },
    allEnvKeys: allEnvKeys,
    r2Related: r2Bindings,
    kvRelated: kvBindings,
    environment: env.ENVIRONMENT || 'production',
    message: r2Binding && kvBinding 
      ? 'All bindings are detected!' 
      : 'Some bindings are missing. Check variable names match exactly: GALLERY_R2 and GALLERY_KV'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// GET /api/test-image - Test endpoint to list and serve first image
async function handleTestImage(r2Binding, corsHeaders) {
  try {
    if (!r2Binding) {
      return new Response(JSON.stringify({ error: 'R2 binding not available' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List objects in R2
    const listResult = await r2Binding.list({ limit: 1 });
    
    if (!listResult || !listResult.objects || listResult.objects.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No images found in R2',
        objects: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstObject = listResult.objects[0];
    
    return new Response(JSON.stringify({
      message: 'Found images in R2',
      totalObjects: listResult.objects.length,
      firstImage: {
        key: firstObject.key,
        size: firstObject.size,
        uploaded: firstObject.uploaded,
        url: `/api/image/${encodeURIComponent(firstObject.key)}`
      },
      allObjects: listResult.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        url: `/api/image/${encodeURIComponent(obj.key)}`
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to test R2: ' + error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
