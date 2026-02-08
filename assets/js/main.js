/**
 * Televista - Main JavaScript
 * Handles animations, navigation, and interactive components
 */

(function() {
  'use strict';

  // ============================================
  // Navigation
  // ============================================
  
  const navbar = document.getElementById('navbar');
  const navbarToggle = document.getElementById('navbar-toggle');
  const navbarNav = document.getElementById('navbar-nav');

  // Scroll handler for navbar background
  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Mobile menu toggle
  function toggleMobileMenu() {
    navbarToggle.classList.toggle('active');
    navbarNav.classList.toggle('active');
    document.body.style.overflow = navbarNav.classList.contains('active') ? 'hidden' : '';
  }

  // Close mobile menu when clicking a link
  function handleNavLinkClick(e) {
    if (navbarNav.classList.contains('active')) {
      toggleMobileMenu();
    }
  }

  // Initialize navigation
  if (navbar) {
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll(); // Check initial state
  }

  if (navbarToggle) {
    navbarToggle.addEventListener('click', toggleMobileMenu);
  }

  if (navbarNav) {
    navbarNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', handleNavLinkClick);
    });
  }

  // ============================================
  // Intersection Observer for Animations
  // ============================================

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    // Animation observer
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optionally unobserve after animation
          // animationObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    });

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll(
      '.fade-in, .fade-in-up, .slide-in-left, .slide-in-right, .scale-in, .stagger'
    );

    animatedElements.forEach(el => {
      animationObserver.observe(el);
    });
  } else {
    // If reduced motion, show all elements immediately
    document.querySelectorAll(
      '.fade-in, .fade-in-up, .slide-in-left, .slide-in-right, .scale-in, .stagger'
    ).forEach(el => {
      el.classList.add('visible');
    });
  }

  // ============================================
  // FAQ Accordion
  // ============================================

  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    if (question) {
      question.addEventListener('click', () => {
        // Check if this item is already active
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        
        // Toggle current item
        item.classList.toggle('active', !isActive);
      });
    }
  });

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Skip if it's just "#"
      if (href === '#') return;
      
      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    });
  });

  // ============================================
  // Active Navigation Link
  // ============================================

  function normalizePath(rawPath) {
    if (!rawPath) return '';
    let path = rawPath.split('?')[0].split('#')[0];

    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        path = new URL(path).pathname;
      } catch (e) {
        // ignore invalid URLs
      }
    }

    if (path === '') return '/';
    if (!path.startsWith('/')) path = `/${path}`;

    if (path === '/index.html') return '/';
    if (path.endsWith('/index.html')) {
      path = path.slice(0, -'/index.html'.length) || '/';
    }

    if (path.endsWith('.html')) {
      path = path.slice(0, -5);
    }

    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    return path;
  }

  function setActiveNavLink() {
    const currentPath = normalizePath(window.location.pathname);
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    let matchedLink = null;

    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) return;

      const linkPath = normalizePath(href);
      if (linkPath && currentPath === linkPath) {
        matchedLink = link;
      }
    });

    if (matchedLink) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link === matchedLink);
      });
    }
  }

  setActiveNavLink();

  // ============================================
  // Counter Animation
  // ============================================

  function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    const range = end - start;
    
    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (range * easeOut));
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = end.toLocaleString();
      }
    }
    
    requestAnimationFrame(updateCounter);
  }

  // Observe stat numbers for counter animation
  if (!prefersReducedMotion) {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          
          const text = entry.target.textContent;
          const number = parseInt(text.replace(/[^0-9]/g, ''), 10);
          
          if (!isNaN(number) && number > 0) {
            // Store original text with suffix/prefix
            const prefix = text.match(/^[^0-9]*/)[0];
            const suffix = text.match(/[^0-9]*$/)[0];
            
            const updateText = (value) => {
              entry.target.textContent = prefix + value.toLocaleString() + suffix;
            };
            
            // Animate from 0 to the number
            const startTime = performance.now();
            const duration = 2000;
            
            function animate(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const current = Math.round(number * easeOut);
              
              updateText(current);
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            }
            
            requestAnimationFrame(animate);
          }
        }
      });
    }, {
      threshold: 0.5
    });
    
    statNumbers.forEach(stat => {
      counterObserver.observe(stat);
    });
  }

  // ============================================
  // Logo Carousel Pause on Hover
  // ============================================

  const logoCarousel = document.querySelector('.logo-carousel-track');
  
  if (logoCarousel) {
    logoCarousel.addEventListener('mouseenter', () => {
      logoCarousel.style.animationPlayState = 'paused';
    });
    
    logoCarousel.addEventListener('mouseleave', () => {
      logoCarousel.style.animationPlayState = 'running';
    });
  }

  // ============================================
  // Button Ripple Effect
  // ============================================

  document.querySelectorAll('.btn-primary').forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      
      ripple.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${e.clientX - rect.left}px;
        top: ${e.clientY - rect.top}px;
        width: 0;
        height: 0;
      `;
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      // Calculate ripple size
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // Add ripple animation to stylesheet
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // ============================================
  // Parallax Effect for Hero Glow
  // ============================================

  if (!prefersReducedMotion) {
    const heroGlows = document.querySelectorAll('.hero-glow');
    
    if (heroGlows.length > 0) {
      let ticking = false;
      
      window.addEventListener('mousemove', (e) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            
            heroGlows.forEach((glow, index) => {
              const factor = index === 0 ? 1 : -0.5;
              glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });
            
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // ============================================
  // Form Validation (if forms are added)
  // ============================================

  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const requiredFields = this.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
      });
      
      if (!isValid) {
        e.preventDefault();
      }
    });
  });

  // ============================================
  // Lazy Loading Images
  // ============================================

  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  } else {
    // Fallback for browsers without native lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          lazyImageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      lazyImageObserver.observe(img);
    });
  }

  // ============================================
  // Keyboard Navigation Enhancements
  // ============================================

  // Add focus styles for keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  // Add keyboard navigation styles
  const keyboardStyles = document.createElement('style');
  keyboardStyles.textContent = `
    .keyboard-navigation *:focus {
      outline: 2px solid var(--color-accent-primary) !important;
      outline-offset: 2px;
    }
    
    body:not(.keyboard-navigation) *:focus {
      outline: none;
    }
  `;
  document.head.appendChild(keyboardStyles);

  // ============================================
  // Audio Player for Call Recording
  // ============================================

  const callerAudio = document.getElementById('callerAudio');
  const audioPlayBtn = document.getElementById('audioPlayBtn');
  const audioVisualizer = document.getElementById('audioVisualizer');
  const audioProgress = document.getElementById('audioProgress');
  const audioCurrentTime = document.getElementById('audioCurrentTime');
  const audioDuration = document.getElementById('audioDuration');
  const audioProgressContainer = document.querySelector('.audio-progress-container');

  if (callerAudio && audioPlayBtn) {
    // Format time in MM:SS
    function formatTime(seconds) {
      if (isNaN(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Update duration when metadata loads
    callerAudio.addEventListener('loadedmetadata', () => {
      audioDuration.textContent = formatTime(callerAudio.duration);
    });

    // Toggle play/pause
    audioPlayBtn.addEventListener('click', () => {
      if (callerAudio.paused) {
        callerAudio.play();
      } else {
        callerAudio.pause();
      }
    });

    // Update UI on play
    callerAudio.addEventListener('play', () => {
      audioPlayBtn.querySelector('.play-icon').style.display = 'none';
      audioPlayBtn.querySelector('.pause-icon').style.display = 'block';
      audioVisualizer.classList.add('playing');
    });

    // Update UI on pause
    callerAudio.addEventListener('pause', () => {
      audioPlayBtn.querySelector('.play-icon').style.display = 'block';
      audioPlayBtn.querySelector('.pause-icon').style.display = 'none';
      audioVisualizer.classList.remove('playing');
    });

    // Update progress bar
    callerAudio.addEventListener('timeupdate', () => {
      const progress = (callerAudio.currentTime / callerAudio.duration) * 100;
      audioProgress.style.width = `${progress}%`;
      audioCurrentTime.textContent = formatTime(callerAudio.currentTime);
    });

    // Reset on end
    callerAudio.addEventListener('ended', () => {
      audioPlayBtn.querySelector('.play-icon').style.display = 'block';
      audioPlayBtn.querySelector('.pause-icon').style.display = 'none';
      audioVisualizer.classList.remove('playing');
      audioProgress.style.width = '0%';
      audioCurrentTime.textContent = '0:00';
    });

    // Seek on progress bar click
    if (audioProgressContainer) {
      audioProgressContainer.addEventListener('click', (e) => {
        const rect = audioProgressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const seekTime = (clickX / width) * callerAudio.duration;
        callerAudio.currentTime = seekTime;
      });
    }

    // Keyboard controls
    audioPlayBtn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        audioPlayBtn.click();
      }
    });
  }

  // ============================================
  // Testimonials Carousel
  // ============================================

  const testimonialsTrack = document.getElementById('testimonialsTrack');
  const testimonialPrev = document.getElementById('testimonialPrev');
  const testimonialNext = document.getElementById('testimonialNext');
  const testimonialsDots = document.getElementById('testimonialsDots');

  if (testimonialsTrack) {
    const slides = testimonialsTrack.querySelectorAll('.testimonial-slide');
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;

    // Create dots
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('dot');
      dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(index));
      testimonialsDots.appendChild(dot);
    });

    const dots = testimonialsDots.querySelectorAll('.dot');

    function goToSlide(index) {
      currentSlide = index;
      testimonialsTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % totalSlides;
      goToSlide(currentSlide);
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      goToSlide(currentSlide);
    }

    testimonialNext.addEventListener('click', () => {
      nextSlide();
      resetAutoSlide();
    });

    testimonialPrev.addEventListener('click', () => {
      prevSlide();
      resetAutoSlide();
    });

    function startAutoSlide() {
      autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoSlide() {
      clearInterval(autoSlideInterval);
      startAutoSlide();
    }

    startAutoSlide();

    // Pause on hover
    testimonialsTrack.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    testimonialsTrack.addEventListener('mouseleave', startAutoSlide);
  }

  // ============================================
  // ROI Calculator
  // ============================================

  const calcIndustry = document.getElementById('calcIndustry');
  const calcCallers = document.getElementById('calcCallers');
  const calcLeadsPerCaller = document.getElementById('calcLeadsPerCaller');
  const calcCloseRate = document.getElementById('calcCloseRate');
  const calcDealValue = document.getElementById('calcDealValue');
  const industryHint = document.getElementById('industryHint');

  if (calcCallers && calcLeadsPerCaller && calcCloseRate && calcDealValue) {
    const calcCallersValue = document.getElementById('calcCallersValue');
    const calcLeadsValue = document.getElementById('calcLeadsValue');
    const calcCloseRateValue = document.getElementById('calcCloseRateValue');
    const calcInvestment = document.getElementById('calcInvestment');
    const calcTotalLeads = document.getElementById('calcTotalLeads');
    const calcClosings = document.getElementById('calcClosings');
    const calcRevenue = document.getElementById('calcRevenue');
    const calcROI = document.getElementById('calcROI');

    // Industry presets
    const industryPresets = {
      'real-estate': {
        leads: 40,
        closeRate: 5,
        dealValue: 7000,
        hintLeads: '~40 leads/caller/month',
        hintClose: '3-10% close rate typical'
      },
      'roofing': {
        leads: 22,
        closeRate: 12,
        dealValue: 3500,
        hintLeads: '~22 appointments/month',
        hintClose: '10-15% close rate typical'
      },
      'home-renovation': {
        leads: 18,
        closeRate: 14,
        dealValue: 2500,
        hintLeads: '~18 appointments/month',
        hintClose: '12-18% close rate typical'
      },
      'custom': {
        leads: 25,
        closeRate: 5,
        dealValue: 5000,
        hintLeads: 'Adjust to your business',
        hintClose: 'Set your own close rate'
      }
    };

    // Apply industry preset
    function applyIndustryPreset(industry) {
      const preset = industryPresets[industry];
      if (!preset) return;

      // Update sliders
      calcLeadsPerCaller.value = preset.leads;
      calcCloseRate.value = preset.closeRate;
      calcDealValue.value = preset.dealValue;

      // Update hint text
      if (industryHint) {
        const hintLeadsEl = industryHint.querySelector('.hint-leads');
        const hintCloseEl = industryHint.querySelector('.hint-close');
        if (hintLeadsEl) hintLeadsEl.textContent = preset.hintLeads;
        if (hintCloseEl) hintCloseEl.textContent = preset.hintClose;
      }

      // Recalculate
      updateCalculator();
    }

    // Pricing tiers
    function getMonthlyInvestment(callers) {
      if (callers === 1) return 900;
      if (callers === 2) return 1700;
      if (callers === 3) return 2500;
      // For 4+ callers, use a linear model
      return 2500 + (callers - 3) * 800;
    }

    function updateCalculator() {
      const callers = parseInt(calcCallers.value);
      const leadsPerCaller = parseInt(calcLeadsPerCaller.value);
      const closeRate = parseInt(calcCloseRate.value) / 100;
      const dealValue = parseFloat(calcDealValue.value) || 0;

      // Update display values
      calcCallersValue.textContent = callers;
      calcLeadsValue.textContent = leadsPerCaller;
      calcCloseRateValue.textContent = calcCloseRate.value;

      // Calculate results
      const investment = getMonthlyInvestment(callers);
      const totalLeads = callers * leadsPerCaller;
      const closings = totalLeads * closeRate;
      const revenue = closings * dealValue;
      const netProfit = revenue - investment;
      const roi = investment > 0 ? ((revenue - investment) / investment) * 100 : 0;

      // Update results
      calcInvestment.textContent = `$${investment.toLocaleString()}`;
      calcTotalLeads.textContent = totalLeads;
      calcClosings.textContent = closings.toFixed(1);
      calcRevenue.textContent = `$${revenue.toLocaleString()}`;
      
      // Update net profit display
      const calcNetProfit = document.getElementById('calcNetProfit');
      if (calcNetProfit) {
        calcNetProfit.textContent = `$${netProfit.toLocaleString()}`;
      }
      
      calcROI.textContent = `${Math.round(roi)}%`;
    }

    // Event listeners
    if (calcIndustry) {
      calcIndustry.addEventListener('change', function() {
        applyIndustryPreset(this.value);
      });
    }
    calcCallers.addEventListener('input', updateCalculator);
    calcLeadsPerCaller.addEventListener('input', updateCalculator);
    calcCloseRate.addEventListener('input', updateCalculator);
    calcDealValue.addEventListener('input', updateCalculator);

    // Initialize
    if (calcIndustry) {
      applyIndustryPreset(calcIndustry.value);
    } else {
      updateCalculator();
    }
  }

  // ============================================
  // Console Easter Egg
  // ============================================

  console.log(
    '%c📞 Televista',
    'font-size: 24px; font-weight: bold; color: #004643;'
  );
  console.log(
    '%cCold Calling & Lead Generation That Actually Works',
    'font-size: 14px; color: #006663;'
  );
  console.log(
    '%cInterested in working with us? Visit: https://televistaleadgeneration.com/contact.html',
    'font-size: 12px; color: #888;'
  );

})();
