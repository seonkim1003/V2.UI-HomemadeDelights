document.addEventListener('DOMContentLoaded', function() {
    // --- Banner Functionality ---
    const banner = document.getElementById('promo-banner');
    const closeBannerBtn = document.getElementById('close-banner');
    
    if (banner && closeBannerBtn) {
        closeBannerBtn.addEventListener('click', function() {
            banner.style.display = 'none';
        });
    }

    // --- Mobile Navigation Toggle ---
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
                navLinks.classList.remove('nav-open');
                navToggle.classList.remove('is-active');
                document.body.classList.remove('body-no-scroll');
            });
        });
    }

    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    if (galleryItems.length > 0 && lightbox) {
        let currentIndex = 0;
        const images = Array.from(galleryItems).map(item => item.href);

        function showLightbox(index) {
            lightboxImage.src = images[index];
            currentIndex = index;
            lightbox.classList.add('active');
            document.body.classList.add('body-no-scroll');
        }

        function hideLightbox() {
            lightbox.classList.remove('active');
            document.body.classList.remove('body-no-scroll');
        }

        function showNextImage() {
            const newIndex = (currentIndex + 1) % images.length;
            showLightbox(newIndex);
        }

        function showPrevImage() {
            const newIndex = (currentIndex - 1 + images.length) % images.length;
            showLightbox(newIndex);
        }

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                showLightbox(index);
            });
        });

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
                if (e.key === 'Escape') {
                    hideLightbox();
                } else if (e.key === 'ArrowRight') {
                    showNextImage();
                } else if (e.key === 'ArrowLeft') {
                    showPrevImage();
                }
            }
        });
    }


    // --- Fade-in on Scroll Animation ---
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

});
