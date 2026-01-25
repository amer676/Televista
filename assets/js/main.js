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

  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      
      // Check if the link matches the current page
      if (currentPath.endsWith(linkPath) || 
          (currentPath === '/' && linkPath === 'index.html') ||
          (currentPath.endsWith('/') && linkPath === 'index.html')) {
        link.classList.add('active');
      } else if (!link.classList.contains('active')) {
        // Don't remove active class if it was set in HTML
      }
    });
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
  // Console Easter Egg
  // ============================================

  console.log(
    '%c� Televista',
    'font-size: 24px; font-weight: bold; color: #722f37;'
  );
  console.log(
    '%cCold Calling & Lead Generation That Actually Works',
    'font-size: 14px; color: #ff8c61;'
  );
  console.log(
    '%cInterested in working with us? Visit: https://televistaleadgeneration.com/contact.html',
    'font-size: 12px; color: #888;'
  );

})();
