document.addEventListener('DOMContentLoaded', function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Page curtain (internal navigations) ---
    const curtain = document.querySelector('.page-curtain');
    function playCurtainExit() {
        if (!curtain || reduceMotion) return;
        curtain.classList.remove('page-curtain--enter', 'page-curtain--exit');
        void curtain.offsetWidth;
        curtain.classList.add('page-curtain--enter');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                curtain.classList.add('page-curtain--exit');
                curtain.classList.remove('page-curtain--enter');
            });
        });
    }

    if (curtain && !reduceMotion) {
        playCurtainExit();
        document.querySelectorAll('a[href]').forEach((anchor) => {
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
            const url = anchor.href;
            let loc;
            try {
                loc = new URL(url);
            } catch {
                return;
            }
            if (loc.origin !== window.location.origin) return;
            const isHtml = /\.html($|\?)/i.test(loc.pathname) || loc.pathname.endsWith('/') || loc.pathname === '';
            if (!isHtml) return;

            anchor.addEventListener('click', function (e) {
                if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                curtain.classList.remove('page-curtain--enter', 'page-curtain--exit');
                void curtain.offsetWidth;
                curtain.style.transformOrigin = 'bottom';
                curtain.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 1, 1)';
                curtain.style.transform = 'scaleY(1)';
                setTimeout(() => {
                    window.location.href = url;
                }, 300);
            });
        });
    }

    // --- Banner ---
    const banner = document.getElementById('promo-banner');
    const closeBannerBtn = document.getElementById('close-banner');
    if (banner && closeBannerBtn) {
        closeBannerBtn.addEventListener('click', function () {
            banner.style.display = 'none';
        });
    }

    // --- Nav scroll (solid background) ---
    const nav = document.querySelector('nav');
    const navStartedDark = nav && nav.classList.contains('nav--dark');
    const darkHero = document.querySelector('.page-hero-dark, .join-page-header');
    const onNavScroll = () => {
        if (!nav) return;
        nav.classList.toggle('scrolled', window.scrollY > 80);
        if (navStartedDark && darkHero) {
            const pastDark = window.scrollY > darkHero.offsetHeight - 80;
            nav.classList.toggle('nav--dark', !pastDark);
        }
    };
    if (nav) {
        const path = window.location.pathname.split('/').pop() || '';
        if (['menu.html', 'gallery.html', 'contact.html', 'join.html'].includes(path)) {
            nav.classList.add('scrolled');
        }
        onNavScroll();
        window.addEventListener('scroll', onNavScroll, { passive: true });
    }

    // --- Scroll progress bar ---
    const progressBar = document.getElementById('scrollProgress');
    if (progressBar) {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = pct + '%';
        };
        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
    }

    // --- Mobile nav ---
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    setTimeout(() => {
        if (navLinks) navLinks.classList.add('transition-ready');
    }, 100);

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const open = navLinks.classList.toggle('nav-open');
            navToggle.classList.toggle('is-active', open);
            document.body.classList.toggle('body-no-scroll', open);
            if (nav) nav.classList.toggle('mobile-menu-open', open);
        });
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                if (!navLinks.classList.contains('nav-open')) return;
                navLinks.classList.remove('nav-open');
                navToggle.classList.remove('is-active');
                document.body.classList.remove('body-no-scroll');
                if (nav) nav.classList.remove('mobile-menu-open');
            });
        });
    }

    // --- Reveal on scroll ---
    const revealOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
        });
    }, revealOptions);

    document.querySelectorAll('.reveal-ready').forEach((el) => revealObserver.observe(el));
    document.querySelectorAll('.text-reveal').forEach((el) => revealObserver.observe(el));

    // --- Legacy .fade-in ---
    const faders = document.querySelectorAll('.fade-in');
    const fadeObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
        });
    }, revealOptions);
    faders.forEach((f) => fadeObserver.observe(f));

    // --- Stats count-up (home) ---
    const statNums = document.querySelectorAll('[data-count-to]');
    const animateCount = (el, target, suffix = '') => {
        const duration = 1200;
        const start = performance.now();
        const from = 0;
        const step = (t) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - (1 - p) * (1 - p);
            const val = Math.round(from + (target - from) * eased);
            el.textContent = val + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    if (statNums.length) {
        const statsObs = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    const n = parseInt(el.getAttribute('data-count-to'), 10);
                    const suf = el.getAttribute('data-count-suffix') || '';
                    if (!Number.isNaN(n)) animateCount(el, n, suf);
                    obs.unobserve(el);
                });
            },
            { threshold: 0.25 }
        );
        statNums.forEach((el) => statsObs.observe(el));
    }

    // --- Hero scroll indicator ---
    const scrollInd = document.querySelector('.scroll-indicator');
    if (scrollInd) {
        const hideInd = () => {
            if (window.scrollY > 200) scrollInd.classList.add('is-hidden');
            else scrollInd.classList.remove('is-hidden');
        };
        hideInd();
        window.addEventListener('scroll', hideInd, { passive: true });
    }

    // --- Carousel & Lightbox (about page) ---
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
            if (window.innerWidth <= 768) slidesPerPage = 1;
            else if (window.innerWidth <= 992) slidesPerPage = 2;
            else slidesPerPage = 3;
        };

        const updateCarousel = () => {
            if (!slides.length) return;
            const slideWidth = slides[0].getBoundingClientRect().width;
            carouselTrack.style.transform = 'translateX(-' + slideWidth * currentIndex + 'px)';
            if (prevButton) prevButton.disabled = currentIndex === 0;
            if (nextButton) nextButton.disabled = currentIndex >= slides.length - slidesPerPage;
        };

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (currentIndex < slides.length - slidesPerPage) {
                    currentIndex++;
                    updateCarousel();
                }
            });
        }
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateCarousel();
                }
            });
        }

        window.addEventListener('resize', () => {
            updateSlidesPerPage();
            if (currentIndex > slides.length - slidesPerPage) {
                currentIndex = Math.max(0, slides.length - slidesPerPage);
            }
            updateCarousel();
        });

        updateSlidesPerPage();
        updateCarousel();

        const galleryData = slides.map((slide) => {
            const img = slide.querySelector('img');
            return {
                src: img.dataset.largeSrc,
                caption: img.dataset.caption
            };
        });

        let lightboxIndex = 0;

        function showLightbox(index) {
            const item = galleryData[index];
            if (!lightbox || !lightboxImage) return;
            lightboxImage.src = item.src;
            if (lightboxCaption) lightboxCaption.textContent = item.caption;
            lightboxIndex = index;
            lightbox.classList.add('active');
            document.body.classList.add('body-no-scroll');
        }

        function hideLightbox() {
            if (lightbox) lightbox.classList.remove('active');
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
            img.addEventListener('click', () => showLightbox(index));
        });

        if (lightboxClose) lightboxClose.addEventListener('click', hideLightbox);
        if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', showNextImage);
        if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', showPrevImage);

        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) hideLightbox();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (!lightbox || !lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') hideLightbox();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
        });
    }

    // --- Team flip ---
    const teamMembers = document.querySelectorAll('.team-grid .team-member');
    const handleFlip = (member) => {
        member.classList.toggle('is-flipped');
    };
    teamMembers.forEach((member) => {
        member.addEventListener('click', () => handleFlip(member));
        member.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFlip(member);
            }
        });
    });

    // --- Language: pill UI + translations ---
    const languageSelect = document.getElementById('language-select');
    const translatableElements = document.querySelectorAll('[data-translate]');
    const langFadeWrap = document.getElementById('lang-fade-wrap');

    const updateTranslations = (language) => {
        translatableElements.forEach((element) => {
            const key = element.dataset.translate;
            if (translations[language] && translations[language][key]) {
                element.innerHTML = translations[language][key];
            }
        });
    };

    const setLanguage = (language) => {
        const finish = () => {
            document.documentElement.lang = language;
            localStorage.setItem('language', language);
            updateTranslations(language);
            document.querySelectorAll('.lang-pill-btn').forEach((btn) => {
                btn.classList.toggle('is-active', btn.dataset.lang === language);
            });
            if (languageSelect) languageSelect.value = language;
            if (langFadeWrap) {
                langFadeWrap.classList.remove('lang-fade--out');
            }
        };

        if (langFadeWrap) {
            langFadeWrap.classList.add('lang-fade--out');
            setTimeout(finish, 150);
        } else {
            finish();
        }
    };

    const getInitialLanguage = () => {
        const savedLanguage = localStorage.getItem('language');
        const browserLanguage = navigator.language.split('-')[0];
        return savedLanguage || (translations[browserLanguage] ? browserLanguage : 'en');
    };

    document.querySelectorAll('.lang-pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => setLanguage(e.target.value));
    }

    const initialLanguage = getInitialLanguage();
    document.documentElement.lang = initialLanguage;
    localStorage.setItem('language', initialLanguage);
    updateTranslations(initialLanguage);
    document.querySelectorAll('.lang-pill-btn').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.lang === initialLanguage);
    });
    if (languageSelect) languageSelect.value = initialLanguage;

    // --- Auto-update footer year ---
    const year = new Date().getFullYear();
    document.querySelectorAll('footer p').forEach((el) => {
        el.textContent = el.textContent.replace(/© \d{4}/, '© ' + year);
    });
});
