/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A zero-dependency, high-performance, canvas-based confetti burst animation.
 * Spawns colorful falling particles that scatter and rotate down the viewport,
 * automatically resizing and cleaning itself up after completion.
 */
export function triggerConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', handleResize);

  // Vibrant, harmonious palette
  const colors = [
    '#6366f1', // Indigo
    '#818cf8', // Indigo Light
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444'  // Red
  ];

  const particles: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    color: string;
    tiltAngle: number;
    tiltAngleIncremental: number;
  }> = [];

  // Spawn 120 confetti pieces starting from random top coordinates
  for (let i = 0; i < 140; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * -height - 20,
      w: Math.random() * 8 + 4,
      h: Math.random() * 12 + 6,
      vx: Math.random() * 4 - 2, // slight horizontal drift
      vy: Math.random() * 4 + 3, // downward speed
      color: colors[Math.floor(Math.random() * colors.length)],
      tiltAngle: Math.random() * Math.PI * 2,
      tiltAngleIncremental: Math.random() * 0.05 + 0.02
    });
  }

  let animationFrameId: number;
  const startTime = Date.now();
  const maxDuration = 4500; // Animation runs for 4.5 seconds max

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    let anyActive = false;
    const elapsed = Date.now() - startTime;

    particles.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.vy;
      p.x += p.vx;

      // Wrap horizontal position slightly if they drift off-screen
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;

      // Keep animation running as long as particles are on screen and within time limit
      if (p.y < height && elapsed < maxDuration) {
        anyActive = true;
      }

      ctx.save();
      ctx.beginPath();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tiltAngle);
      ctx.fillStyle = p.color;
      // Draw rectangular confetti piece
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (anyActive && elapsed < maxDuration) {
      animationFrameId = requestAnimationFrame(draw);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
    if (document.body.contains(canvas)) {
      document.body.removeChild(canvas);
    }
  }

  draw();
}
