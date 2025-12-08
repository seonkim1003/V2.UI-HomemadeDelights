const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize images.json if it doesn't exist
const imagesJsonPath = path.join(uploadsDir, 'images.json');
if (!fs.existsSync(imagesJsonPath)) {
    fs.writeFileSync(imagesJsonPath, JSON.stringify([], null, 2));
}

// Initialize groups.json if it doesn't exist
const groupsJsonPath = path.join(uploadsDir, 'groups.json');
if (!fs.existsSync(groupsJsonPath)) {
    fs.writeFileSync(groupsJsonPath, JSON.stringify([], null, 2));
}

// Add body parser for JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'image-' + uniqueSuffix + ext);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Helper function to read images.json
function readImagesData() {
    try {
        const data = fs.readFileSync(imagesJsonPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write images.json
function writeImagesData(data) {
    fs.writeFileSync(imagesJsonPath, JSON.stringify(data, null, 2));
}

// Helper function to read groups.json
function readGroupsData() {
    try {
        const data = fs.readFileSync(groupsJsonPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write groups.json
function writeGroupsData(data) {
    fs.writeFileSync(groupsJsonPath, JSON.stringify(data, null, 2));
}

// GET /api/images - Retrieve all images (for backwards compatibility)
app.get('/api/images', (req, res) => {
    try {
        const images = readImagesData();
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve images' });
    }
});

// GET /api/groups - Retrieve all groups
app.get('/api/groups', (req, res) => {
    try {
        const groups = readGroupsData();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve groups' });
    }
});

// GET /api/groups/:id - Retrieve images in a specific group
app.get('/api/groups/:id', (req, res) => {
    try {
        const groups = readGroupsData();
        const group = groups.find(g => g.id === req.params.id);
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve group' });
    }
});

// POST /api/groups - Create a new group
app.post('/api/groups', (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Group title is required' });
        }
        
        const groups = readGroupsData();
        const newGroup = {
            id: Date.now() + '-' + Math.round(Math.random() * 1E9),
            title: title.trim(),
            coverImage: null,
            images: [],
            createdAt: new Date().toISOString()
        };
        
        groups.push(newGroup);
        writeGroupsData(groups);
        
        res.json({
            success: true,
            group: newGroup
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group: ' + error.message });
    }
});

// POST /api/upload - Handle multiple image uploads with optional group assignment
app.post('/api/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const groupId = req.body.groupId || null;
        const groupTitle = req.body.groupTitle || null;
        let targetGroup = null;

        // Handle group creation or selection
        if (groupId) {
            // Add to existing group
            const groups = readGroupsData();
            targetGroup = groups.find(g => g.id === groupId);
            if (!targetGroup) {
                return res.status(404).json({ error: 'Group not found' });
            }
        } else if (groupTitle && groupTitle.trim() !== '') {
            // Create new group
            const groups = readGroupsData();
            targetGroup = {
                id: Date.now() + '-' + Math.round(Math.random() * 1E9),
                title: groupTitle.trim(),
                coverImage: null,
                images: [],
                createdAt: new Date().toISOString()
            };
            groups.push(targetGroup);
            writeGroupsData(groups);
        } else {
            // No group specified - create default group or add to default
            const groups = readGroupsData();
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
            writeGroupsData(groups);
        }

        // Create image records
        const images = readImagesData();
        const newImages = req.files.map((file, index) => {
            const imageId = Date.now() + '-' + index + '-' + Math.round(Math.random() * 1E9);
            return {
                id: imageId,
                filename: file.filename,
                originalName: file.originalname,
                path: `/uploads/${file.filename}`,
                groupId: targetGroup.id,
                uploadedAt: new Date().toISOString()
            };
        });

        images.push(...newImages);
        writeImagesData(images);

        // Add images to group and set first image as cover if no cover exists
        targetGroup.images.push(...newImages.map(img => img.id));
        if (!targetGroup.coverImage && newImages.length > 0) {
            targetGroup.coverImage = newImages[0].path;
        }

        // Update group in groups array
        const groups = readGroupsData();
        const groupIndex = groups.findIndex(g => g.id === targetGroup.id);
        if (groupIndex !== -1) {
            groups[groupIndex] = targetGroup;
            writeGroupsData(groups);
        }

        res.json({
            success: true,
            message: `${newImages.length} image(s) uploaded successfully`,
            images: newImages,
            group: targetGroup
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload images: ' + error.message });
    }
});

// DELETE /api/images/:id - Delete an image
app.delete('/api/images/:id', (req, res) => {
    try {
        const images = readImagesData();
        const imageIndex = images.findIndex(img => img.id === req.params.id);

        if (imageIndex === -1) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const image = images[imageIndex];
        const imagePath = path.join(uploadsDir, image.filename);

        // Delete file from filesystem
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Remove from images array
        images.splice(imageIndex, 1);
        writeImagesData(images);

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete image: ' + error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});
