'use client';

import { useEffect, useRef } from 'react';

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  vx1: number;
  vy1: number;
  vx2: number;
  vy2: number;
  opacity: number;
  color: string;
  lineWidth: number;
}

const SpinningTriangles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const linesRef = useRef<Line[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      'rgba(8, 145, 178,',
      'rgba(99, 102, 241,',
      'rgba(14, 165, 233,',
      'rgba(6, 182, 212,',
    ];

    const dpr = () => window.devicePixelRatio || 1;
    const logicalW = () => canvas.width / dpr();
    const logicalH = () => canvas.height / dpr();

    const resize = () => {
      const d = dpr();
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth * d;
      canvas.height = parent.offsetHeight * d;
      canvas.style.width = `${parent.offsetWidth}px`;
      canvas.style.height = `${parent.offsetHeight}px`;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };

    const createLine = (): Line => {
      const w = logicalW() || 1200;
      const h = logicalH() || 800;
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const len = 30 + Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;
      return {
        x1: cx + Math.cos(angle) * len / 2,
        y1: cy + Math.sin(angle) * len / 2,
        x2: cx - Math.cos(angle) * len / 2,
        y2: cy - Math.sin(angle) * len / 2,
        vx1: (Math.random() - 0.5) * 0.4,
        vy1: (Math.random() - 0.5) * 0.4,
        vx2: (Math.random() - 0.5) * 0.4,
        vy2: (Math.random() - 0.5) * 0.4,
        opacity: 0.08 + Math.random() * 0.14,
        color: colors[Math.floor(Math.random() * colors.length)],
        lineWidth: 0.5 + Math.random() * 1,
      };
    };

    const init = () => {
      resize();
      const w = logicalW();
      const h = logicalH();
      const count = Math.max(30, Math.floor((w * h) / 25000));
      linesRef.current = Array.from({ length: count }, createLine);
    };

    const wrapCoord = (val: number, max: number) => {
      if (val < -60) return max + 60;
      if (val > max + 60) return -60;
      return val;
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, logicalW(), logicalH());

      const lines = linesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const w = logicalW();
      const h = logicalH();

      // Draw lines
      for (const l of lines) {
        // Mouse repulsion on both endpoints
        for (const end of [{ x: 'x1', y: 'y1', vx: 'vx1', vy: 'vy1' }, { x: 'x2', y: 'y2', vx: 'vx2', vy: 'vy2' }] as const) {
          const dx = (l[end.x] as number) - mx;
          const dy = (l[end.y] as number) - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 0) {
            const force = (180 - dist) / 180 * 0.3;
            (l[end.vx] as number) += (dx / dist) * force;
            (l[end.vy] as number) += (dy / dist) * force;
          }
        }

        // Damping
        l.vx1 *= 0.995;
        l.vy1 *= 0.995;
        l.vx2 *= 0.995;
        l.vy2 *= 0.995;

        // Move endpoints
        l.x1 += l.vx1;
        l.y1 += l.vy1;
        l.x2 += l.vx2;
        l.y2 += l.vy2;

        // Wrap
        l.x1 = wrapCoord(l.x1, w);
        l.y1 = wrapCoord(l.y1, h);
        l.x2 = wrapCoord(l.x2, w);
        l.y2 = wrapCoord(l.y2, h);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.strokeStyle = `${l.color} ${l.opacity})`;
        ctx.lineWidth = l.lineWidth;
        ctx.stroke();

        // Endpoint dots
        for (const [ex, ey] of [[l.x1, l.y1], [l.x2, l.y2]]) {
          ctx.beginPath();
          ctx.arc(ex, ey, 2, 0, Math.PI * 2);
          ctx.fillStyle = `${l.color} ${l.opacity * 2})`;
          ctx.fill();
        }
      }

      // Connect nearby endpoints across different lines
      const maxDist = 180;
      for (let i = 0; i < lines.length; i++) {
        const pts_i = [[lines[i].x1, lines[i].y1], [lines[i].x2, lines[i].y2]];
        for (let j = i + 1; j < lines.length; j++) {
          const pts_j = [[lines[j].x1, lines[j].y1], [lines[j].x2, lines[j].y2]];
          for (const [ax, ay] of pts_i) {
            for (const [bx, by] of pts_j) {
              const dx = ax - bx;
              const dy = ay - by;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.06;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(bx, by);
                ctx.strokeStyle = `rgba(8, 145, 178, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    init();
    animate();

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default SpinningTriangles;
