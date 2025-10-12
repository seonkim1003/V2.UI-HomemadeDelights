document.addEventListener('DOMContentLoaded', function() {
    
    // --- Banner Functionality (Restored) ---
    const banner = document.getElementById('promo-banner');
    const closeBannerBtn = document.getElementById('close-banner');
    
    if (banner && closeBannerBtn) {
        closeBannerBtn.addEventListener('click', function() {
            banner.style.display = 'none';
        });
    }

    // --- Mobile Navigation Toggle (Restored) ---
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Add transition class after a short delay to prevent animation on page load
    setTimeout(() => {
        if (navLinks) {
            navLinks.classList.add('transition-ready');
        }
    }, 100);

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('nav-open');
            navToggle.classList.toggle('is-active');
            document.body.classList.toggle('body-no-scroll');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('nav-open')) {
                    navLinks.classList.remove('nav-open');
                    navToggle.classList.remove('is-active');
                    document.body.classList.remove('body-no-scroll');
                }
            });
        });
    }

    // --- Fade-in on Scroll Animation (Restored) ---
    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('is-visible');
                appearOnScroll.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // --- NEW & IMPROVED: Gallery Lightbox Functionality ---
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    if (galleryItems.length > 0 && lightbox) {
        // Create an array of objects with image sources and captions
        const galleryData = Array.from(galleryItems).map(item => {
            return {
                src: item.href,
                caption: item.dataset.caption || '' // Use data-caption attribute
            };
        });

        let currentIndex = 0;

        function showLightbox(index) {
            const item = galleryData[index];
            lightboxImage.src = item.src;
            lightboxCaption.textContent = item.caption;
            currentIndex = index;
            lightbox.classList.add('active');
            document.body.classList.add('body-no-scroll');
        }

        function hideLightbox() {
            lightbox.classList.remove('active');
            document.body.classList.remove('body-no-scroll');
        }

        function showNextImage() {
            const newIndex = (currentIndex + 1) % galleryData.length;
            showLightbox(newIndex);
        }

        function showPrevImage() {
            const newIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
            showLightbox(newIndex);
        }

        // Add click listener to each gallery item
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // This is crucial to stop the link from navigating
                showLightbox(index);
            });
        });

        // Add listeners for lightbox controls
        lightboxClose.addEventListener('click', hideLightbox);
        lightboxNext.addEventListener('click', showNextImage);
        lightboxPrev.addEventListener('click', showPrevImage);
        
        // Close lightbox by clicking on the background
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                hideLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'Escape') hideLightbox();
                if (e.key === 'ArrowRight') showNextImage();
                if (e.key === 'ArrowLeft') showPrevImage();
            }
        });
    }
});
