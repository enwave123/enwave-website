// ========================================
// 株式会社ENWAVE 公式ホームページ
// JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // Mobile Navigation Toggle
    // ========================================
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
    
    // ========================================
    // Smooth Scroll for Navigation Links
    // ========================================
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ========================================
    // Header Background on Scroll
    // ========================================
    const header = document.querySelector('.header');
    
    function updateHeaderBackground() {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        }
    }
    
    window.addEventListener('scroll', updateHeaderBackground);
    updateHeaderBackground();
    
    // ========================================
    // Intersection Observer for Animations
    // ========================================
    const animateElements = document.querySelectorAll('.service-card, .about-table-wrapper, .philosophy-text, .philosophy-vision, .philosophy-image, .contact-item, .contact-message');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    animateElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(element);
    });
    
    // ========================================
    // Active Navigation Link on Scroll
    // ========================================
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-menu a');
    
    function updateActiveNavLink() {
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${sectionId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink();
    
    // ========================================
    // Parallax Effect for Hero Section
    // ========================================
    const heroSection = document.querySelector('.hero');
    const waveAnimation = document.querySelector('.wave-animation');
    
    if (heroSection && waveAnimation) {
        window.addEventListener('scroll', function() {
            const scrolled = window.scrollY;
            const heroHeight = heroSection.offsetHeight;
            
            if (scrolled < heroHeight) {
                const parallaxValue = scrolled * 0.3;
                waveAnimation.style.transform = `translateY(${parallaxValue}px)`;
            }
        });
    }
    
    // ========================================
    // Service Cards Hover Effect Enhancement
    // ========================================
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // ========================================
    // Console Welcome Message
    // ========================================
    console.log('%c株式会社ENWAVE', 'font-size: 24px; font-weight: bold; color: #4AADE8;');
    console.log('%c縁を育て、地域と自然に良い波を起こす', 'font-size: 14px; color: #9ACD32;');
});
