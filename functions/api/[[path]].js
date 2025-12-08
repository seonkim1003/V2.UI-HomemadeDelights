// Cloudflare Workers API handler for image gallery
// This handles all /api/* routes

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

  // Route handling
  if (path === '/api/images' && request.method === 'GET') {
    return handleGetImages(env, corsHeaders);
  }

  if (path === '/api/groups' && request.method === 'GET') {
    return handleGetGroups(env, corsHeaders);
  }

  if (path.startsWith('/api/groups/') && request.method === 'GET') {
    const groupId = path.split('/api/groups/')[1];
    return handleGetGroup(groupId, env, corsHeaders);
  }

  if (path === '/api/groups' && request.method === 'POST') {
    return handleCreateGroup(request, env, corsHeaders);
  }

  if (path === '/api/upload' && request.method === 'POST') {
    return handleUpload(request, env, corsHeaders);
  }

  if (path.startsWith('/api/image/') && request.method === 'GET') {
    const filename = path.split('/api/image/')[1];
    return handleGetImage(filename, env, corsHeaders);
  }

  if (path.startsWith('/api/images/') && request.method === 'DELETE') {
    const imageId = path.split('/api/images/')[1];
    return handleDeleteImage(imageId, env, corsHeaders);
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}

// Helper functions for KV operations
async function getKVData(env, key, defaultValue = []) {
  try {
    const data = await env.GALLERY_KV.get(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return defaultValue;
  }
}

async function setKVData(env, key, data) {
  try {
    await env.GALLERY_KV.put(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    return false;
  }
}

// GET /api/images
async function handleGetImages(env, corsHeaders) {
  try {
    const images = await getKVData(env, 'images', []);
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
async function handleGetGroups(env, corsHeaders) {
  try {
    const groups = await getKVData(env, 'groups', []);
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
async function handleGetGroup(groupId, env, corsHeaders) {
  try {
    const groups = await getKVData(env, 'groups', []);
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
async function handleCreateGroup(request, env, corsHeaders) {
  try {
    const { title } = await request.json();
    
    if (!title || title.trim() === '') {
      return new Response(JSON.stringify({ error: 'Group title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const groups = await getKVData(env, 'groups', []);
    const newGroup = {
      id: Date.now() + '-' + Math.round(Math.random() * 1E9),
      title: title.trim(),
      coverImage: null,
      images: [],
      createdAt: new Date().toISOString()
    };
    
    groups.push(newGroup);
    await setKVData(env, 'groups', groups);
    
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
async function handleUpload(request, env, corsHeaders) {
  try {
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
    const groups = await getKVData(env, 'groups', []);
    
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
    const images = await getKVData(env, 'images', []);
    const newImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uniqueSuffix = Date.now() + '-' + i + '-' + Math.round(Math.random() * 1E9);
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `image-${uniqueSuffix}.${ext}`;

      // Upload to R2
      await env.GALLERY_R2.put(filename, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
      });

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
    await setKVData(env, 'images', images);
    await setKVData(env, 'groups', groups);

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
async function handleGetImage(filename, env, corsHeaders) {
  try {
    const object = await env.GALLERY_R2.get(filename);
    
    if (!object) {
      return new Response('Image not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    const headers = new Headers(corsHeaders);
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    return new Response('Failed to retrieve image', {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// DELETE /api/images/:id
async function handleDeleteImage(imageId, env, corsHeaders) {
  try {
    const images = await getKVData(env, 'images', []);
    const imageIndex = images.findIndex(img => img.id === imageId);

    if (imageIndex === -1) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const image = images[imageIndex];

    // Delete from R2
    try {
      await env.GALLERY_R2.delete(image.filename);
    } catch (error) {
      console.error('Error deleting from R2:', error);
    }

    // Remove from images array
    images.splice(imageIndex, 1);
    await setKVData(env, 'images', images);

    // Update groups to remove image reference
    const groups = await getKVData(env, 'groups', []);
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
    await setKVData(env, 'groups', groups);

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
