"use client";
import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dotColor = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;
    const lineColor = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;

    const particleCount = () =>
      Math.max(
        70,
        Math.floor((window.innerWidth * window.innerHeight) / 18000),
      );

    let particles: Particle[] = [];

    const createParticles = () => {
      particles = Array.from({ length: particleCount() }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2.4, // was 0.8
        vy: (Math.random() - 0.5) * 2.4, // was 0.8
        size: Math.random() * 2.5 + 1,
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    const handleClick = () => {
      for (let i = 0; i < 3; i += 1) {
        particles.push({
          x: mouseRef.current.x + (Math.random() - 0.5) * 20,
          y: mouseRef.current.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2.0, // was 0.6
          vy: (Math.random() - 0.5) * 2.0, // was 0.6
          size: Math.random() * 1.8 + 0.8,
        });
      }
      if (particles.length > 130) {
        particles = particles.slice(particles.length - 130);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
        if (p.y < -5) p.y = canvas.height + 5;
        if (p.y > canvas.height + 5) p.y = -5;

        const dxMouse = p.x - mouseRef.current.x;
        const dyMouse = p.y - mouseRef.current.y;
        const mouseDist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (mouseDist < 200) {
          const force = (200 - mouseDist) / 200;
          p.vx += (dxMouse / (mouseDist || 1)) * force * 0.18; // was 0.08
          p.vy += (dyMouse / (mouseDist || 1)) * force * 0.18; // was 0.08
        }

        // Clamp max speed so mouse repulsion doesn't send them flying
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 4) {
          p.vx = (p.vx / speed) * 4;
          p.vy = (p.vy / speed) * 4;
        }

        p.vx *= 0.998; // was 0.995 — less friction = stays fast longer
        p.vy *= 0.998;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = dotColor(0.7);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = ((150 - dist) / 150) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineColor(alpha);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1]"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
};

export default ParticlesBackground;
