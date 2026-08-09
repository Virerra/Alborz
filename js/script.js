/* ==========================================================================
   کابینت البرز — site script
   ========================================================================== */

/* ------------------------------------------------------------------------
   SITE CONFIG — edit this block only.
   Per the brief: never publish an unverified phone number or a guessed
   Instagram handle. Fill these in once confirmed with the owner and the
   contact section will update automatically; leave as null to keep
   showing the "coming soon" placeholder.
   ------------------------------------------------------------------------ */
const SITE = {
  phone: '0917 768 4838',
  phoneHref: 'tel:+989177684838',
  instagram: 'alborz.titanium1',
  whatsapp: null      // e.g. "+989123456789" (digits only, with country code)
};

/* ------------------------------------------------------------------------
   SMOOTH SCROLL — self-contained, no external dependency.
   Animates window scroll with an eased curve so nav links and buttons
   glide to their section instead of jumping. Accounts for the floating
   header height so the target section isn't hidden underneath it.

   We disable the browser's native CSS smooth-scroll here because it
   fights with our own rAF-driven scrollTo calls (each call would queue
   its own native smooth animation, and the two fought each other,
   producing a near-frozen scroll). Our JS handles all anchor navigation,
   so native smooth-scroll is unnecessary once this runs.
   ------------------------------------------------------------------------ */
document.documentElement.style.scrollBehavior = 'auto';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

let scrollAnim = null;
function animateScrollTo(targetY, duration = 1000) {
  if (scrollAnim) cancelAnimationFrame(scrollAnim);
  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const clampedTarget = Math.max(0, Math.min(targetY, maxY));
  const diff = clampedTarget - startY;
  if (Math.abs(diff) < 2) return;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo({ top: startY + diff * easeInOutCubic(progress), left: 0, behavior: 'auto' });
    if (progress < 1) {
      scrollAnim = requestAnimationFrame(step);
    } else {
      scrollAnim = null;
    }
  }
  scrollAnim = requestAnimationFrame(step);
}

function scrollToTarget(target) {
  if (!target) return;
  const y = target.getBoundingClientRect().top + window.scrollY - 110;
  animateScrollTo(y, 1000);
}

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- In-page anchor links use the smooth scroller ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
    });
  });

  /* ---------------- Hero parallax ---------------- */
  const heroImg = document.querySelector('.hero-media img');
  const heroSection = document.querySelector('.hero');
  if (heroImg && heroSection) {
    requestAnimationFrame(() => {
      heroImg.style.transform = 'scale(1.08) translateY(0px)';
    });
    setTimeout(() => heroImg.classList.add('settled'), 2000);

    const updateParallax = () => {
      const rect = heroSection.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const shift = Math.max(-60, Math.min(60, rect.top * -0.12));
      heroImg.style.transform = `scale(1.08) translateY(${shift}px)`;
    };
    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
  }

  /* ---------------- Contact config injection ---------------- */
  const phoneField = document.getElementById('phoneField');
  if (SITE.phone) {
    phoneField.innerHTML = `<a href="${SITE.phoneHref || '#'}" dir="ltr">${SITE.phone}</a>`;
  }
  const instaField = document.getElementById('instaField');
  if (SITE.instagram) {
    instaField.innerHTML = `<a href="https://instagram.com/${SITE.instagram}" target="_blank" rel="noopener" dir="ltr">@${SITE.instagram}</a>`;
  }

  /* ---------------- Header on scroll ---------------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- Mobile nav ---------------- */
  const navToggle = document.getElementById('navToggle');
  const mobilePanel = document.getElementById('mobilePanel');
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mobilePanel.classList.toggle('open');
  });
  mobilePanel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navToggle.classList.remove('open');
      mobilePanel.classList.remove('open');
    });
  });

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ---------------- Gallery filter ---------------- */
  const filterTabs = document.getElementById('filterTabs');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  filterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    filterTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    galleryItems.forEach(item => {
      const match = filter === 'all' || item.dataset.category === filter;
      if (match) {
        item.classList.remove('hide-item');
        requestAnimationFrame(() => item.classList.add('show'));
      } else {
        item.classList.remove('show');
        item.classList.add('hide-item');
      }
    });
  });

  /* ---------------- Lightbox ---------------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  let currentIndex = 0;
  const getVisibleItems = () => galleryItems.filter(i => !i.classList.contains('hide-item'));

  function openLightbox(item) {
    const visible = getVisibleItems();
    currentIndex = visible.indexOf(item);
    renderLightbox(visible);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function renderLightbox(visible) {
    const item = visible[currentIndex];
    const img = item.querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = item.dataset.caption || '';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function step(dir) {
    const visible = getVisibleItems();
    currentIndex = (currentIndex + dir + visible.length) % visible.length;
    renderLightbox(visible);
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => openLightbox(item));
  });
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(document.documentElement.dir === 'rtl' ? 1 : -1);
    if (e.key === 'ArrowRight') step(document.documentElement.dir === 'rtl' ? -1 : 1);
  });

  /* ---------------- Footer year ---------------- */
  document.getElementById('year').textContent = new Date().getFullYear();

});
