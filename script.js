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

// --- Gallery Carousel ---
const track = document.querySelector('.carousel-track');
const slides = Array.from(track.children);
const nextButton = document.querySelector('.carousel-button.next');
const prevButton = document.querySelector('.carousel-button.prev');

if (track) {
    const slideWidth = slides[0].getBoundingClientRect().width;

    // Arrange the slides next to one another
    const setSlidePosition = (slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    };
    slides.forEach(setSlidePosition);

    const moveToSlide = (track, currentSlide, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
        currentSlide.classList.remove('current-slide');
        targetSlide.classList.add('current-slide');
    }

    // When I click left, move slides to the left
    prevButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];

        moveToSlide(track, currentSlide, prevSlide);
    });

    // When I click right, move slides to the right
    nextButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        const nextSlide = currentSlide.nextElementSibling || slides[0];

        moveToSlide(track, currentSlide, nextSlide);
    });
}
