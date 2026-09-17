<script lang="ts">
  import { onMount } from 'svelte';

  interface Star {
    x: number;
    y: number;
    size: number;
    baseAlpha: number;
    alpha: number;
    twinkleSpeed: number;
    twinklePhase: number;
    speedY: number;
    speedX: number;
    color: string;
    layer: number;
  }

  interface ShootingStar {
    x: number;
    y: number;
    length: number;
    speed: number;
    angle: number;
    opacity: number;
    thickness: number;
  }

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);
  let targetParallaxX = 0;
  let targetParallaxY = 0;
  let currentParallaxX = 0;
  let currentParallaxY = 0;

  onMount(() => {
    if (!canvasEl) return;
    const canvas = canvasEl;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      targetParallaxX = (e.clientX - width / 2) * 0.02;
      targetParallaxY = (e.clientY - height / 2) * 0.02;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Color palettes for stars
    const colors = [
      '#FFFFFF',
      '#FFFFFF',
      '#EDE7FF',
      '#D8CCFF',
      '#FFEAA7',
      '#74B9FF'
    ];

    // Generate stars
    const starCount = Math.floor(Math.min(150, Math.max(80, (width * height) / 12000)));
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      const layer = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
      const size = layer === 1 ? Math.random() * 1.2 + 0.6 : layer === 2 ? Math.random() * 1.4 + 1.2 : Math.random() * 1.8 + 2.0;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        baseAlpha: layer === 1 ? Math.random() * 0.35 + 0.2 : layer === 2 ? Math.random() * 0.4 + 0.45 : Math.random() * 0.3 + 0.7,
        alpha: 0.5,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        twinklePhase: Math.random() * Math.PI * 2,
        speedY: -(layer * 0.12 + Math.random() * 0.1),
        speedX: (Math.random() - 0.5) * 0.06,
        color: colors[Math.floor(Math.random() * colors.length)],
        layer
      });
    }

    // Shooting stars
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = Date.now() + 2500;

    const spawnShootingStar = () => {
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3; // ~45 deg downward
      shootingStars.push({
        x: Math.random() * width * 0.85,
        y: Math.random() * (height * 0.45),
        length: Math.random() * 80 + 70,
        speed: Math.random() * 12 + 10,
        angle,
        opacity: 1,
        thickness: Math.random() * 1.5 + 1.2
      });
      nextShootingStarTime = Date.now() + Math.random() * 5000 + 3500;
    };

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Parallax smooth interpolation
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Check shooting star spawn
      if (Date.now() > nextShootingStarTime) {
        spawnShootingStar();
      }

      // Draw and update stars
      for (const star of stars) {
        // Move star
        star.y += star.speedY;
        star.x += star.speedX;

        // Wrap around edges
        if (star.y < -10) star.y = height + 10;
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;

        // Twinkle
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase) * 0.35;
        star.alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle));

        // Parallax position
        const px = star.x - currentParallaxX * star.layer;
        const py = star.y - currentParallaxY * star.layer;

        // Glow for larger stars
        if (star.layer === 3) {
          ctx.save();
          ctx.shadowBlur = 7;
          ctx.shadowColor = star.color;
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.alpha;
          ctx.beginPath();
          ctx.arc(px, py, star.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.alpha;
          ctx.beginPath();
          ctx.arc(px, py, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw and update shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.018;

        if (s.opacity <= 0 || s.x > width + 100 || s.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.7, 'rgba(215, 195, 255, 0.4)');
        grad.addColorStop(1, `rgba(255, 255, 255, ${s.opacity})`);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#C8ABFF';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Bright head dot
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.thickness * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  });
</script>

<div class="starfield-container" aria-hidden="true">
  <div class="space-gradient"></div>
  <div class="nebula-blob nebula-1"></div>
  <div class="nebula-blob nebula-2"></div>
  <div class="nebula-blob nebula-3"></div>
  <canvas bind:this={canvasEl} class="star-canvas"></canvas>
  <div class="cosmic-vignette"></div>
</div>

<style>
  .starfield-container {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }

  /* Rich GeoGuessr deep purple space background */
  .space-gradient {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 35%, #251246 0%, #15092b 45%, #0d051c 78%, #070210 100%);
  }

  /* Glowing nebula clouds */
  .nebula-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.35;
    pointer-events: none;
    will-change: transform;
    animation: nebulaPulse 12s ease-in-out infinite alternate;
  }

  .nebula-1 {
    top: 15%;
    left: 45%;
    width: 650px;
    height: 550px;
    background: radial-gradient(circle, rgba(126, 45, 237, 0.45) 0%, rgba(68, 20, 140, 0.15) 60%, transparent 80%);
  }

  .nebula-2 {
    bottom: 10%;
    right: 15%;
    width: 500px;
    height: 450px;
    background: radial-gradient(circle, rgba(235, 60, 150, 0.25) 0%, rgba(110, 25, 120, 0.08) 60%, transparent 80%);
    animation-duration: 16s;
    animation-delay: -4s;
  }

  .nebula-3 {
    top: 40%;
    left: 10%;
    width: 450px;
    height: 400px;
    background: radial-gradient(circle, rgba(46, 140, 255, 0.2) 0%, rgba(20, 45, 110, 0.05) 60%, transparent 80%);
    animation-duration: 14s;
    animation-delay: -8s;
  }

  @keyframes nebulaPulse {
    0% {
      transform: scale(0.95) translate(0, 0);
      opacity: 0.28;
    }
    100% {
      transform: scale(1.08) translate(15px, -10px);
      opacity: 0.42;
    }
  }

  .star-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Subtle dark vignette at edges */
  .cosmic-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(5, 2, 12, 0.6) 100%);
    pointer-events: none;
  }
</style>
