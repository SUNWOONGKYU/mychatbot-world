/**
 * @task S2F1
 * Landing Page JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderSkills();
  initScrollAnimations();
});

// Navbar scroll effect
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// Render skills preview (show 3)
function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;
  const skills = MCW.skills.slice(0, 3);
  grid.innerHTML = skills.map(s => `
    <div class="skill-card">
      <div class="skill-header">
        <span class="skill-icon">${s.icon}</span>
        <span class="skill-name">${s.name}</span>
        ${s.isFree
      ? '<span class="skill-badge-free">무료</span>'
      : `<span class="skill-badge-paid">₩${(s.price / 1000).toFixed(0)}K</span>`}
      </div>
      <p class="skill-desc">${s.description}</p>
      <div class="skill-meta">
        <span>⭐ ${s.rating}</span>
        <span>📥 ${s.installs.toLocaleString()}</span>
        <span>${s.category}</span>
      </div>
    </div>
  `).join('');
}

// Scroll-triggered animations (Intersection Observer)
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.step-card, .template-card, .skill-card, .pricing-card, .school-card, .community-card, .criteria-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}
