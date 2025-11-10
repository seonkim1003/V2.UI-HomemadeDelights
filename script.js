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

    // --- Carousel & Lightbox Functionality ---
    const carouselTrack = document.querySelector('.carousel-track');
    if (carouselTrack) {
        const slides = Array.from(carouselTrack.children);
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrevBtn = document.getElementById('lightbox-prev');
        const lightboxNextBtn = document.getElementById('lightbox-next');

        let currentIndex = 0;
        let slidesPerPage = 3;

        const updateSlidesPerPage = () => {
            if (window.innerWidth <= 768) {
                slidesPerPage = 1;
            } else if (window.innerWidth <= 992) {
                slidesPerPage = 2;
            } else {
                slidesPerPage = 3;
            }
        };

        const updateCarousel = () => {
            const slideWidth = slides[0].getBoundingClientRect().width;
            carouselTrack.style.transform = 'translateX(-' + slideWidth * currentIndex + 'px)';
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex >= slides.length - slidesPerPage;
        };
        
        nextButton.addEventListener('click', () => {
            if (currentIndex < slides.length - slidesPerPage) {
                currentIndex++;
                updateCarousel();
            }
        });

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
        
        window.addEventListener('resize', () => {
            updateSlidesPerPage();
            if (currentIndex > slides.length - slidesPerPage) {
                 currentIndex = Math.max(0, slides.length - slidesPerPage);
            }
            updateCarousel();
        });

        updateSlidesPerPage();
        updateCarousel();

        // --- Lightbox Logic ---
        const galleryData = slides.map(slide => {
            const img = slide.querySelector('img');
            return {
                src: img.dataset.largeSrc,
                caption: img.dataset.caption
            };
        });
        
        let lightboxIndex = 0;

        function showLightbox(index) {
            const item = galleryData[index];
            lightboxImage.src = item.src;
            lightboxCaption.textContent = item.caption;
            lightboxIndex = index;
            lightbox.classList.add('active');
            document.body.classList.add('body-no-scroll');
        }

        function hideLightbox() {
            lightbox.classList.remove('active');
            document.body.classList.remove('body-no-scroll');
        }
        
        function showNextImage() {
            lightboxIndex = (lightboxIndex + 1) % galleryData.length;
            showLightbox(lightboxIndex);
        }

        function showPrevImage() {
            lightboxIndex = (lightboxIndex - 1 + galleryData.length) % galleryData.length;
            showLightbox(lightboxIndex);
        }

        slides.forEach((slide, index) => {
            const img = slide.querySelector('img');
            img.addEventListener('click', () => {
                showLightbox(index);
            });
        });
        
        if (lightboxClose) lightboxClose.addEventListener('click', hideLightbox);
        if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', showNextImage);
        if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', showPrevImage);
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                hideLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'Escape') hideLightbox();
                if (e.key === 'ArrowRight') showNextImage();
                if (e.key === 'ArrowLeft') showPrevImage();
            }
        });
    }

    // --- Team Card Flip Functionality ---
    const teamMembers = document.querySelectorAll('.team-grid .team-member');
    
    const handleFlip = (member) => {
        member.classList.toggle('is-flipped');
    };

    teamMembers.forEach(member => {
        member.addEventListener('click', () => handleFlip(member));
        member.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent page scroll on spacebar press
                handleFlip(member);
            }
        });
    });

    // --- Language Switcher Functionality ---
    const languageSelect = document.getElementById('language-select');
    const translatableElements = document.querySelectorAll('[data-translate]');

    const updateTranslations = (language) => {
        translatableElements.forEach(element => {
            const key = element.dataset.translate;
            if (translations[language] && translations[language][key]) {
                element.innerHTML = translations[language][key];
            }
        });
    };

    const setLanguage = (language) => {
        document.documentElement.lang = language;
        localStorage.setItem('language', language);
        updateTranslations(language);
    };

    const getInitialLanguage = () => {
        const savedLanguage = localStorage.getItem('language');
        const browserLanguage = navigator.language.split('-')[0];
        return savedLanguage || (translations[browserLanguage] ? browserLanguage : 'en');
    };

    if (languageSelect) {
        const initialLanguage = getInitialLanguage();
        languageSelect.value = initialLanguage;
        setLanguage(initialLanguage);

        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
});

