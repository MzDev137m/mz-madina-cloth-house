// ══════════════════════════════════════════════════════════════════
//  MADINA CLOTH HOUSE — Ultra Pro Script
// ══════════════════════════════════════════════════════════════════

// ── STAY AT TOP ON REFRESH (clear any URL hash) ───────────────────
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
window.scrollTo(0, 0);

// ── MOBILE MENU ──────────────────────────────────────────────────
const menuBtn    = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

menuBtn?.addEventListener('click', () => {
  const isOpen = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden');
  menuBtn.innerHTML = isOpen
    ? '<i class="bi bi-list text-xl"></i>'
    : '<i class="bi bi-x text-xl"></i>';
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuBtn.innerHTML = '<i class="bi bi-list text-xl"></i>';
  });
});

// ── SCROLL PROGRESS BAR ──────────────────────────────────────────
const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrollTop    = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (scrollProgress) scrollProgress.style.width = ((scrollTop / scrollHeight) * 100) + '%';

  // nav scrolled state
  document.getElementById('nav')?.classList.toggle('scrolled', scrollTop > 60);
  document.getElementById('toTop')?.classList.toggle('hidden', scrollTop <= 350);

  // active nav link
  let current = '';
  document.querySelectorAll('section[id]').forEach(s => {
    if (scrollTop >= s.offsetTop - 180) current = s.getAttribute('id');
  });
  document.querySelectorAll('.nav-link-anim').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}, { passive: true });

document.getElementById('toTop')?.addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: 'smooth' })
);

// ── PRO SVG CURSOR ────────────────────────────────────────────────
(function() {
  const arrow   = document.getElementById('cur-arrow');
  const blob    = document.getElementById('cur-blob');
  const ripple  = document.getElementById('cur-ripple');
  const ripple2 = document.getElementById('cur-ripple2');
  if (!arrow || !window.matchMedia('(pointer: fine)').matches) return;

  let mx = 0, my = 0;
  let bx = window.innerWidth / 2, by = window.innerHeight / 2;
  let isHovered = false;

  // Arrow follows mouse precisely (no offset — top-left SVG origin)
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    arrow.style.left = mx + 'px';
    arrow.style.top  = my + 'px';
  });

  // Blob lags with lerp
  (function lerpBlob() {
    bx += (mx - bx) * 0.095;
    by += (my - by) * 0.095;
    blob.style.left = bx + 'px';
    blob.style.top  = by + 'px';
    requestAnimationFrame(lerpBlob);
  })();

  // Hover states on interactive elements
  const hoverSel = 'a, button, [onclick], .gallery-item, .product-card, .brand-card-dark, .owner-card, .testimonial-card, .tilt-card, input, textarea, select, label';
  function bindHover() {
    document.querySelectorAll(hoverSel).forEach(el => {
      el.addEventListener('mouseenter', () => {
        isHovered = true;
        arrow.classList.add('hovered');
        blob.classList.add('hovered');
      });
      el.addEventListener('mouseleave', () => {
        isHovered = false;
        arrow.classList.remove('hovered');
        blob.classList.remove('hovered');
      });
    });
  }
  bindHover();

  // Click ripple burst
  document.addEventListener('mousedown', e => {
    // Position ripples
    [ripple, ripple2].forEach(r => {
      r.style.left = e.clientX + 'px';
      r.style.top  = e.clientY + 'px';
      r.classList.remove('burst');
      void r.offsetWidth; // force reflow
      r.classList.add('burst');
    });
    // Arrow & blob shrink on click
    arrow.classList.add('clicking');
    blob.classList.add('clicking');
  });

  document.addEventListener('mouseup', () => {
    arrow.classList.remove('clicking');
    blob.classList.remove('clicking');
  });

  // Hide when leaving window
  document.addEventListener('mouseleave', () => {
    arrow.style.opacity = '0';
    blob.style.opacity  = '0';
  });
  document.addEventListener('mouseenter', () => {
    arrow.style.opacity = '1';
    blob.style.opacity  = '1';
  });
})();

// ── HERO FABRIC CANVAS ───────────────────────────────────────────
(function() {
  const cv = document.getElementById('heroFabricCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = cv.width  = cv.offsetWidth;
    H = cv.height = cv.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw flowing silk fabric lines — horizontal waves
    for (let row = 0; row < 28; row++) {
      const y     = H * (row / 27);
      const amp   = 14 + (row % 5) * 5;
      const freq  = 0.0035 + (row % 4) * 0.0012;
      const phase = row * 0.9 + t * 0.55;
      const alpha = 0.06 + (row % 6) * 0.015;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(212,168,67,${alpha})`;
      ctx.lineWidth   = row % 4 === 0 ? 1.4 : 0.7;

      for (let x = 0; x <= W; x += 3) {
        const yy = y + Math.sin(x * freq + phase) * amp
                     + Math.sin(x * freq * 0.4 + t * 0.3) * amp * 0.35;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // Vertical accent threads
    for (let col = 0; col < 10; col++) {
      const x     = W * (col / 9);
      const amp   = 20 + (col % 3) * 8;
      const freq  = 0.004 + (col % 3) * 0.002;
      const phase = col * 1.4 + t * 0.4;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(212,168,67,${0.025 + col % 4 * 0.008})`;
      ctx.lineWidth   = 0.6;

      for (let y = 0; y <= H; y += 3) {
        const xx = x + Math.sin(y * freq + phase) * amp;
        y === 0 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y);
      }
      ctx.stroke();
    }

    t += 0.01;
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── FLOATING PARTICLES ───────────────────────────────────────────
(function() {
  const container = document.querySelector('#home .particle-container');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px; height: ${size}px;
      animation-duration: ${Math.random() * 12 + 8}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
})();

// ── HERO CONTENT PARALLAX ────────────────────────────────────────
const heroContent = document.querySelector('.hero-content-wrap');
if (heroContent) {
  window.addEventListener('scroll', () => {
    heroContent.style.transform = `translateY(${window.scrollY * 0.28}px)`;
    heroContent.style.opacity   = 1 - window.scrollY / 600;
  }, { passive: true });
}

// ── MAGNETIC BUTTONS ─────────────────────────────────────────────
document.querySelectorAll('.magnetic-btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.28;
    const y = (e.clientY - r.top  - r.height / 2) * 0.28;
    btn.style.transform = `translate(${x}px, ${y}px)`;
  });
  btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0,0)');
});

// ── 3D CARD TILT ─────────────────────────────────────────────────
function initTilt() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left)  / r.width;
      const y  = (e.clientY - r.top)   / r.height;
      const rx = (y - 0.5) * -12;
      const ry = (x - 0.5) *  12;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.025,1.025,1.025)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    });
  });
}
initTilt();

// ── MARQUEE DUPLICATE ────────────────────────────────────────────
(function() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
})();

// ── LIGHTBOX ─────────────────────────────────────────────────────
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
let lightboxIndex  = 0;

window.openLightbox = function(el) {
  lightboxIndex = galleryItems.indexOf(el);
  setLightbox(lightboxIndex);
  const lb = document.getElementById('lightbox');
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
  gsap.fromTo('#lightbox .lightbox-content', { scale: 0.88, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.4)' });
};

window.closeLightbox = function() {
  gsap.to('#lightbox .lightbox-content', { scale: 0.9, autoAlpha: 0, duration: 0.25, ease: 'power2.in', onComplete: () => {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
  }});
};

window.changeLightbox = function(dir) {
  lightboxIndex = (lightboxIndex + dir + galleryItems.length) % galleryItems.length;
  gsap.to('#lightboxImg', { autoAlpha: 0, x: dir * -20, duration: 0.15, onComplete: () => {
    setLightbox(lightboxIndex);
    gsap.fromTo('#lightboxImg', { autoAlpha: 0, x: dir * 20 }, { autoAlpha: 1, x: 0, duration: 0.25, ease: 'power2.out' });
  }});
};

function setLightbox(i) {
  const item = galleryItems[i];
  const img  = item.querySelector('img');
  const cap  = item.querySelector('.gallery-label');
  document.getElementById('lightboxImg').src = img.src;
  document.getElementById('lightboxImg').alt = img.alt;
  document.getElementById('lightboxCaption').textContent = cap?.textContent || '';
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight') changeLightbox(1);
  if (e.key === 'ArrowLeft')  changeLightbox(-1);
});

// ── TESTIMONIALS SLIDER ──────────────────────────────────────────
(function() {
  const track = document.querySelector('.testimonials-track');
  const dots  = document.querySelectorAll('.testimonials-dot');
  if (!track || !dots.length) return;

  const cards     = track.querySelectorAll('.testimonial-card');
  let current     = 0;
  let perView     = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
  let maxIndex    = Math.max(0, cards.length - perView);
  let autoTimer   = null;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIndex));
    const cardW   = cards[0].getBoundingClientRect().width + 24;
    track.style.transform = `translateX(-${current * cardW}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current >= maxIndex ? 0 : current + 1); }

  function startAuto() { autoTimer = setInterval(next, 4000); }
  function stopAuto()  { clearInterval(autoTimer); }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); });
  });

  track.closest('.testimonials-wrap')?.addEventListener('mouseenter', stopAuto);
  track.closest('.testimonials-wrap')?.addEventListener('mouseleave', startAuto);

  window.addEventListener('resize', () => {
    perView  = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    maxIndex = Math.max(0, cards.length - perView);
    goTo(0);
  });

  goTo(0);
  startAuto();
})();

// ── CONTACT FORM → WHATSAPP ──────────────────────────────────────
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const name    = document.getElementById('cName').value.trim();
  const phone   = document.getElementById('cPhone').value.trim();
  const email   = document.getElementById('cEmail').value.trim();
  const message = document.getElementById('cMessage').value.trim();
  if (!name || !phone || !message) {
    Swal.fire({ icon: 'warning', title: 'Please fill all required fields', confirmButtonColor: '#D4A843', customClass: { popup: 'rounded-2xl' } });
    return;
  }
  const text = encodeURIComponent(
    `Assalam o Alaikum!\n\nName: ${name}\nPhone: ${phone}${email ? '\nEmail: ' + email : ''}\n\nMessage:\n${message}\n\n– Sent from Madina Cloth House Website`
  );
  window.open(`https://wa.me/923004260700?text=${text}`, '_blank');
  Swal.fire({
    icon: 'success', title: 'Opening WhatsApp!',
    text: 'Your message is ready — just press Send.',
    confirmButtonColor: '#D4A843',
    customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl px-5 py-2.5' }
  });
  this.reset();
});

// ── GSAP ANIMATIONS ──────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

window.addEventListener('load', () => {
  // On revisit the header + hero are already visible via CSS (.ss rules) — skip animation
  if (document.documentElement.classList.contains('ss')) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  const headerDelay = (window.mchSplashTotal || 4.55) - 0.1;
  tl.to('#mainHeader', { autoAlpha: 1, y: 0, duration: .8, delay: headerDelay });
  tl.from('.blob', { autoAlpha: 0, scale: .75, duration: .9, stagger: .18 }, '-=0.5');
  tl.from('#home .hero-anim-d1', { y: 22, duration: .7, ease: 'power2.out' }, '-=0.5');
  tl.from('#home .hero-anim-d2', { y: 28, duration: .75, ease: 'power2.out' }, '-=0.55');
  tl.from('#home .hero-anim-d3', { y: 20, duration: .7,  ease: 'power2.out' }, '-=0.55');
  tl.from('#home .hero-anim-d4', { y: 18, duration: .65, ease: 'power2.out' }, '-=0.5');
  tl.from('#home .hero-anim-d5', { y: 16, duration: .6,  ease: 'power2.out' }, '-=0.5');
  tl.from('.scroll-indicator', { autoAlpha: 0, y: 10, duration: .5 }, '-=0.3');
});

// Blobs parallax
gsap.to('.blob.one', { yPercent: -35, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: 1.5 } });
gsap.to('.blob.two', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: 1.5 } });
gsap.to('.blob.three',{ yPercent: -28, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: 1.5 } });

// Universal reveal — skip elements that have their own dedicated section animations
gsap.utils.toArray('.reveal-up').forEach((el, i) => {
  if (
    el.matches('.product-card') ||
    el.matches('.owner-card') ||
    el.closest('#about') ||
    el.closest('#contact')
  ) return;
  gsap.from(el, {
    y: 42, autoAlpha: 0, duration: .9, ease: 'power3.out',
    delay: (i % 3) * 0.04,
    scrollTrigger: { trigger: el, start: 'top 91%', once: true }
  });
});

// Stats counter (GSAP)
document.querySelectorAll('[data-count]').forEach(el => {
  const parent = el.closest('.stat-item');
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => {
      const target = parseInt(el.dataset.count);
      gsap.to({ val: 0 }, {
        val: target, duration: 2.2, ease: 'power2.out',
        onUpdate: function() { el.textContent = Math.floor(this.targets()[0].val) + '+'; },
        onComplete: () => {
          el.textContent = target + '+';
          parent?.classList.add('counted');
        }
      });
    }
  });
});

// Brand cards stagger
gsap.from('#brandsGrid .brand-card-dark', {
  y: 48, autoAlpha: 0, duration: .7, stagger: .09, ease: 'power3.out',
  scrollTrigger: { trigger: '#brandsGrid', start: 'top 87%', once: true }
});

// Gallery stagger
gsap.from('#storeGallery .gallery-item', {
  scale: .82, autoAlpha: 0, duration: .55, stagger: .06, ease: 'back.out(1.5)',
  scrollTrigger: { trigger: '#storeGallery', start: 'top 87%', once: true }
});

// Product cards
gsap.from('#shopGrid .product-card', {
  y: 36, autoAlpha: 0, duration: .7, stagger: .1, ease: 'power3.out',
  scrollTrigger: { trigger: '#shopGrid', start: 'top 87%', once: true }
});

// Owners
gsap.from('#owners .owner-card', {
  y: 44, autoAlpha: 0, duration: .75, stagger: .14, ease: 'power3.out',
  scrollTrigger: { trigger: '#owners', start: 'top 85%', once: true }
});

// Testimonials
gsap.from('#testimonials .testimonial-card', {
  y: 32, autoAlpha: 0, duration: .65, stagger: .1, ease: 'power3.out',
  scrollTrigger: { trigger: '#testimonials', start: 'top 87%', once: true }
});

// Contact section
gsap.from('#contact .reveal-up', {
  y: 36, autoAlpha: 0, duration: .75, stagger: .12, ease: 'power3.out',
  scrollTrigger: { trigger: '#contact', start: 'top 87%', once: true }
});

// About section
gsap.from('#about .reveal-up', {
  x: (i) => i % 2 === 0 ? -36 : 36,
  autoAlpha: 0, duration: .8, stagger: .15, ease: 'power3.out',
  scrollTrigger: { trigger: '#about', start: 'top 85%', once: true }
});

// Enhanced card hover
document.querySelectorAll('.product-card').forEach(card => {
  const img = card.querySelector('img');
  card.addEventListener('mouseenter', () => {
    gsap.to(img,  { scale: 1.09, duration: .5, ease: 'power2.out' });
    gsap.to(card, { y: -8, boxShadow: '0 28px 56px rgba(10,35,66,.2)', duration: .35, ease: 'power2.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(img,  { scale: 1,   duration: .5, ease: 'power2.out' });
    gsap.to(card, { y: 0,  boxShadow: '0 4px 6px rgba(10,35,66,.07)', duration: .35, ease: 'power2.out' });
  });
});

// Marquee section entrance
gsap.from('.marquee-section', {
  autoAlpha: 0, duration: .6,
  scrollTrigger: { trigger: '.marquee-section', start: 'top 90%', once: true }
});

// Section headings subtle entrance
gsap.utils.toArray('.title-bar').forEach(el => {
  gsap.from(el, {
    autoAlpha: 0, y: 18, duration: .75, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 92%', once: true }
  });
});
