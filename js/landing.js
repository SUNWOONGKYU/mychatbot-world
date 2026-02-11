/**
 * @task S2F1
 * Landing Page JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    renderTemplates();
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

// Render template cards
function renderTemplates() {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;
    const templates = MCW.templates;
    grid.innerHTML = Object.values(templates).map(t => `
    <div class="template-card" onclick="location.href='/create?template=${t.id}'">
      <div class="template-icon">${t.icon}</div>
      <h4>${t.name}</h4>
      <p>${t.description}</p>
      <div class="template-categories">
        ${t.categories.map(c => `<span class="template-tag">${c}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// Render skills preview (show 8)
function renderSkills() {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;
    const skills = MCW.skills.slice(0, 8);
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

    document.querySelectorAll('.step-card, .template-card, .skill-card, .pricing-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}
