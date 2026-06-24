// FoodSage Landing Page — JavaScript Interactions

document.addEventListener("DOMContentLoaded", () => {

  // ── Particle Canvas ──
  createParticleCanvas();

  // ── Button ripple effect ──
  const btn = document.getElementById("foodBotBtn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(139, 92, 246, 0.4);
        transform: scale(0);
        animation: rippleAnim 0.6s linear;
        width: 100px; height: 100px;
        left: ${e.offsetX - 50}px;
        top: ${e.offsetY - 50}px;
        pointer-events: none;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  // Inject ripple animation
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes rippleAnim {
      to { transform: scale(4); opacity: 0; }
    }
  `;
  document.head.appendChild(styleSheet);

});

// ── Particle Canvas Background ──
function createParticleCanvas() {
  const container = document.getElementById("bgParticles");
  const canvas = document.createElement("canvas");
  canvas.id = "particleCanvas";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let particles = [];
  let animFrame;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  // Create particles
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy;

      // Wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
      ctx.fill();
    });

    // Draw connecting lines between nearby particles
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach((p2) => {
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });

    animFrame = requestAnimationFrame(animate);
  };

  animate();
}
