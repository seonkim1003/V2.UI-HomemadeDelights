document.addEventListener('DOMContentLoaded', function() {

    // --- Fade-in on Scroll Animation ---
    const faders = document.querySelectorAll('.fade-in');

    // Options for the Intersection Observer
    const appearOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Start loading a bit before it's fully in view
    };

    // The observer
    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('is-visible');
                appearOnScroll.unobserve(entry.target); // Stop observing once it's visible
            }
        });
    }, appearOptions);

    // Attach the observer to each fader element
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

});