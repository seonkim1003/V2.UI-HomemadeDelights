// API base URL - use current origin for Cloudflare Pages deployment
// Falls back to localhost for local development
const API_BASE_URL = window.location.origin || 'http://localhost:8788';

// Upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 10; // Maximum number of files per upload

// Global state
let selectedFiles = [];
let allGroups = [];
let currentGroupImages = [];
let currentSlideshowIndex = 0;

// DOM elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const previewGrid = document.getElementById('preview-grid');
const clearPreviewBtn = document.getElementById('clear-preview');
const uploadBtn = document.getElementById('upload-btn');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const uploadSuccess = document.getElementById('upload-success');
const successMessage = document.getElementById('success-message');
const galleryGrid = document.getElementById('gallery-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyGallery = document.getElementById('empty-gallery');
const slideshowModal = document.getElementById('slideshow-modal');
const slideshowImage = document.getElementById('slideshow-image');
const slideshowCounter = document.getElementById('slideshow-counter');
const slideshowClose = document.getElementById('slideshow-close');
const slideshowPrev = document.getElementById('slideshow-prev');
const slideshowNext = document.getElementById('slideshow-next');
const newGroupRadio = document.getElementById('new-group-radio');
const existingGroupRadio = document.getElementById('existing-group-radio');
const groupTitleInput = document.getElementById('group-title-input');
const existingGroupSelect = document.getElementById('existing-group-select');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupUploadArea();
    setupGroupSelection();
    loadGalleryGroups();
});

// ==================== Upload Functionality ====================

function setupUploadArea() {
    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFileSelection(e.dataTransfer.files);
    });

    // Clear preview
    clearPreviewBtn.addEventListener('click', () => {
        clearPreview();
    });

    // Upload button
    uploadBtn.addEventListener('click', () => {
        uploadImages();
    });
}

function setupGroupSelection() {
    // Set initial placeholder text
    updateGroupPlaceholder();
    
    // Toggle between new and existing group options
    newGroupRadio.addEventListener('change', () => {
        if (newGroupRadio.checked) {
            groupTitleInput.style.display = 'block';
            existingGroupSelect.style.display = 'none';
            groupTitleInput.required = true;
            updateGroupPlaceholder();
        }
    });

    existingGroupRadio.addEventListener('change', () => {
        if (existingGroupRadio.checked) {
            groupTitleInput.style.display = 'none';
            existingGroupSelect.style.display = 'block';
            groupTitleInput.required = false;
            loadExistingGroups();
        }
    });
}

function updateGroupPlaceholder() {
    // Try to get translated text, fallback to default
    const lang = document.documentElement.lang || 'en';
    const defaultText = lang === 'ko' ? '그룹 제목 입력...' : 'Enter group title...';
    
    // Check if translations are loaded
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['Enter group title...']) {
        groupTitleInput.placeholder = translations[lang]['Enter group title...'];
    } else {
        groupTitleInput.placeholder = defaultText;
    }
}

async function loadExistingGroups() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/groups`);
        if (!response.ok) throw new Error('Failed to load groups');
        
        const groups = await response.json();
        const selectText = document.querySelector('[data-translate="Select a group..."]')?.textContent || 'Select a group...';
        existingGroupSelect.innerHTML = `<option value="">${selectText}</option>`;
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            const imageText = group.images.length === 1 ? 
                (document.querySelector('[data-translate="image"]')?.textContent || 'image') :
                (document.querySelector('[data-translate="images"]')?.textContent || 'images');
            option.textContent = `${group.title} (${group.images.length} ${imageText})`;
            existingGroupSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function handleFileSelection(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('Please select image files only.');
        return;
    }

    // Validate file sizes
    const oversizedFiles = imageFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
        alert(`Some files exceed the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit:\n${oversizedFiles.map(f => f.name).join('\n')}\n\nPlease compress or resize these images.`);
        imageFiles.splice(imageFiles.indexOf(oversizedFiles[0]), oversizedFiles.length);
    }

    // Check total file count
    if (selectedFiles.length + imageFiles.length > MAX_FILES) {
        const allowed = MAX_FILES - selectedFiles.length;
        alert(`You can only upload ${MAX_FILES} files at once. Only the first ${allowed} files will be selected.`);
        imageFiles.splice(allowed);
    }

    if (imageFiles.length > 0) {
        selectedFiles = [...selectedFiles, ...imageFiles];
        updatePreview();
    }
}

function updatePreview() {
    if (selectedFiles.length === 0) {
        previewContainer.style.display = 'none';
        return;
    }

    previewContainer.style.display = 'block';
    previewGrid.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-remove';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedFiles.splice(index, 1);
            updatePreview();
        });

        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewGrid.appendChild(previewItem);
    });
}

function clearPreview() {
    selectedFiles = [];
    fileInput.value = '';
    groupTitleInput.value = '';
    newGroupRadio.checked = true;
    groupTitleInput.style.display = 'block';
    existingGroupSelect.style.display = 'none';
    updatePreview();
}

async function uploadImages() {
    if (selectedFiles.length === 0) {
        alert('Please select at least one image to upload.');
        return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });

    // Add group information
    if (newGroupRadio.checked) {
        const groupTitle = groupTitleInput.value.trim();
        if (groupTitle === '') {
            alert('Please enter a group title.');
            return;
        }
        formData.append('groupTitle', groupTitle);
    } else if (existingGroupRadio.checked) {
        const groupId = existingGroupSelect.value;
        if (groupId === '') {
            alert('Please select an existing group.');
            return;
        }
        formData.append('groupId', groupId);
    }

    // Show progress
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    // Set upload timeout (5 minutes for large files)
    const UPLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    let uploadTimeout;
    let isUploadComplete = false;

    try {
        const xhr = new XMLHttpRequest();

        // Set timeout
        uploadTimeout = setTimeout(() => {
            if (!isUploadComplete) {
                xhr.abort();
                uploadProgress.style.display = 'none';
                uploadBtn.disabled = false;
                progressFill.style.width = '0%';
                alert('Upload timeout. The files may be too large or there was a network issue. Please try again with smaller files.');
            }
        }, UPLOAD_TIMEOUT);

        // Upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && e.total > 0) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = `Uploading... ${percentComplete}%`;
            } else {
                // If size is not computable, show indeterminate progress
                progressText.textContent = 'Uploading...';
            }
        });

        xhr.addEventListener('load', () => {
            isUploadComplete = true;
            clearTimeout(uploadTimeout);
            
            // Accept both 200 and 201 as success
            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('Upload successful:', response);
                    
                    progressFill.style.width = '100%';
                    progressText.textContent = 'Upload complete!';
                    
                    // Show success message
                    uploadSuccess.style.display = 'block';
                    successMessage.textContent = `✓ Upload successful! ${response.images?.length || 0} image(s) uploaded. Refreshing gallery...`;
                    
                    // Clear preview immediately
                    clearPreview();
                    
                    // Refresh gallery immediately
                    loadGalleryGroups().then(() => {
                        console.log('Gallery refreshed after upload');
                        // Hide success message after gallery loads
                        setTimeout(() => {
                            uploadSuccess.style.display = 'none';
                        }, 3000);
                    }).catch(err => {
                        console.error('Error refreshing gallery:', err);
                        successMessage.textContent = '✓ Upload successful, but failed to refresh gallery. Please refresh the page manually.';
                        setTimeout(() => {
                            uploadSuccess.style.display = 'none';
                        }, 5000);
                    });
                    
                    // Hide progress after showing success
                    setTimeout(() => {
                        uploadProgress.style.display = 'none';
                        uploadBtn.disabled = false;
                        progressFill.style.width = '0%';
                        progressText.textContent = 'Uploading...';
                        // Reset group selection
                        newGroupRadio.checked = true;
                        groupTitleInput.value = '';
                        groupTitleInput.style.display = 'block';
                        existingGroupSelect.style.display = 'none';
                    }, 1500);
                } catch (parseError) {
                    console.error('Error parsing response:', parseError, xhr.responseText);
                    uploadProgress.style.display = 'none';
                    uploadSuccess.style.display = 'block';
                    successMessage.textContent = '⚠ Upload may have succeeded, but received invalid response. Refreshing gallery...';
                    uploadBtn.disabled = false;
                    progressFill.style.width = '0%';
                    progressText.textContent = 'Uploading...';
                    // Try to refresh gallery anyway
                    loadGalleryGroups().then(() => {
                        setTimeout(() => {
                            uploadSuccess.style.display = 'none';
                        }, 3000);
                    });
                }
            } else {
                let errorMessage = `Upload failed (Status: ${xhr.status})`;
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    errorMessage = errorResponse.error || errorMessage;
                    
                    // Check for binding configuration errors
                    if (errorMessage.includes('binding not configured') || 
                        errorMessage.includes('R2') || 
                        errorMessage.includes('KV')) {
                        errorMessage += '\n\nPlease configure R2 and KV bindings in Cloudflare Pages:\nSettings → Functions → Bindings';
                    }
                } catch (e) {
                    errorMessage += '\n\nResponse: ' + xhr.responseText.substring(0, 200);
                }
                uploadProgress.style.display = 'none';
                uploadSuccess.style.display = 'none';
                uploadBtn.disabled = false;
                progressFill.style.width = '0%';
                progressText.textContent = 'Uploading...';
                alert(errorMessage);
            }
        });

        xhr.addEventListener('error', () => {
            isUploadComplete = true;
            clearTimeout(uploadTimeout);
            uploadProgress.style.display = 'none';
            uploadBtn.disabled = false;
            progressFill.style.width = '0%';
            progressText.textContent = 'Uploading...';
            alert('Network error. Please check your connection and try again.');
        });

        xhr.addEventListener('abort', () => {
            isUploadComplete = true;
            clearTimeout(uploadTimeout);
            uploadProgress.style.display = 'none';
            uploadBtn.disabled = false;
            progressFill.style.width = '0%';
            progressText.textContent = 'Uploading...';
        });

        xhr.addEventListener('loadend', () => {
            // Cleanup timeout if request completes
            clearTimeout(uploadTimeout);
        });

        xhr.open('POST', `${API_BASE_URL}/api/upload`);
        xhr.send(formData);
    } catch (error) {
        clearTimeout(uploadTimeout);
        uploadProgress.style.display = 'none';
        uploadSuccess.style.display = 'none';
        uploadBtn.disabled = false;
        progressFill.style.width = '0%';
        progressText.textContent = 'Uploading...';
        alert(`Failed to upload images: ${error.message || 'Unknown error'}. Please try again.`);
    }
}

// ==================== Gallery Display ====================

async function loadGalleryGroups() {
    loadingSpinner.style.display = 'flex';
    emptyGallery.style.display = 'none';
    galleryGrid.innerHTML = ''; // Clear existing content

    try {
        const response = await fetch(`${API_BASE_URL}/api/groups`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load groups: ${response.status} ${errorText}`);
        }
        
        const groups = await response.json();
        console.log('Loaded groups:', groups);
        allGroups = groups || [];
        await displayGallery();
    } catch (error) {
        console.error('Error loading groups:', error);
        galleryGrid.innerHTML = `<p style="color: red; padding: 20px; text-align: center;">Failed to load groups: ${error.message}<br>Please check the browser console for details.</p>`;
        emptyGallery.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

async function displayGallery() {
    if (allGroups.length === 0) {
        emptyGallery.style.display = 'block';
        galleryGrid.innerHTML = '';
        console.log('No groups found');
        return;
    }

    emptyGallery.style.display = 'none';
    galleryGrid.innerHTML = '';

    // Get all images first
    let allImages = [];
    try {
        const imagesResponse = await fetch(`${API_BASE_URL}/api/images`);
        if (imagesResponse.ok) {
            allImages = await imagesResponse.json();
            console.log('Loaded images:', allImages.length);
        } else {
            console.warn('Failed to load images:', imagesResponse.status);
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }

    // Create group cards
    for (const group of allGroups) {
        const groupImages = allImages.filter(img => img.groupId === group.id);
        console.log(`Group "${group.title}": ${groupImages.length} images`);
        
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';
        groupCard.dataset.groupId = group.id;

        // Cover image
        const coverImg = document.createElement('img');
        coverImg.className = 'group-cover';
        if (group.coverImage && groupImages.length > 0) {
            coverImg.src = `${API_BASE_URL}${group.coverImage}`;
        } else if (groupImages.length > 0) {
            // Use first image as cover if no cover set
            coverImg.src = `${API_BASE_URL}${groupImages[0].path}`;
        } else {
            // Placeholder if no images
            coverImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Images%3C/text%3E%3C/svg%3E';
        }
        coverImg.alt = group.title;
        coverImg.loading = 'lazy';
        coverImg.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage Error%3C/text%3E%3C/svg%3E';
        };

        // Group info overlay
        const groupInfo = document.createElement('div');
        groupInfo.className = 'group-info';
        
        const groupTitle = document.createElement('h4');
        groupTitle.className = 'group-title';
        groupTitle.textContent = group.title;
        
        const groupCount = document.createElement('p');
        groupCount.className = 'group-count';
        const imageText = groupImages.length === 1 ? 
            (document.querySelector('[data-translate="image"]')?.textContent || 'image') :
            (document.querySelector('[data-translate="images"]')?.textContent || 'images');
        groupCount.textContent = `${groupImages.length} ${imageText}`;

        groupInfo.appendChild(groupTitle);
        groupInfo.appendChild(groupCount);
        
        groupCard.appendChild(coverImg);
        groupCard.appendChild(groupInfo);

        groupCard.addEventListener('click', () => {
            openGroupSlideshow(group.id, groupImages);
        });

        galleryGrid.appendChild(groupCard);
    }
    
    console.log(`Displayed ${allGroups.length} groups in gallery`);
}

// ==================== Slideshow Functionality ====================

function openGroupSlideshow(groupId, images) {
    currentGroupImages = images;
    currentSlideshowIndex = 0;
    updateSlideshowImage();
    slideshowModal.classList.add('active');
    document.body.classList.add('body-no-scroll');
}

function closeSlideshow() {
    slideshowModal.classList.remove('active');
    document.body.classList.remove('body-no-scroll');
    currentGroupImages = [];
}

function updateSlideshowImage() {
    if (currentGroupImages.length === 0) return;

    const image = currentGroupImages[currentSlideshowIndex];
    slideshowImage.src = `${API_BASE_URL}${image.path}`;
    slideshowImage.alt = image.originalName || 'Gallery image';
    slideshowCounter.textContent = `${currentSlideshowIndex + 1} / ${currentGroupImages.length}`;
}

function showNextImage() {
    if (currentGroupImages.length === 0) return;
    currentSlideshowIndex = (currentSlideshowIndex + 1) % currentGroupImages.length;
    updateSlideshowImage();
}

function showPrevImage() {
    if (currentGroupImages.length === 0) return;
    currentSlideshowIndex = (currentSlideshowIndex - 1 + currentGroupImages.length) % currentGroupImages.length;
    updateSlideshowImage();
}

// Slideshow event listeners
slideshowClose.addEventListener('click', closeSlideshow);
slideshowNext.addEventListener('click', showNextImage);
slideshowPrev.addEventListener('click', showPrevImage);

// Close on backdrop click
slideshowModal.addEventListener('click', (e) => {
    if (e.target === slideshowModal) {
        closeSlideshow();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!slideshowModal.classList.contains('active')) return;

    switch (e.key) {
        case 'Escape':
            closeSlideshow();
            break;
        case 'ArrowRight':
            showNextImage();
            break;
        case 'ArrowLeft':
            showPrevImage();
            break;
    }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

slideshowModal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

slideshowModal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next image
            showNextImage();
        } else {
            // Swipe right - previous image
            showPrevImage();
        }
    }
}
