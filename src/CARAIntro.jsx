import { useEffect, useRef } from "react";
import "./CARAIntro.css";

function CARAIntro({ onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let animationFrame;

    const particles = [];

    const colors = [
      "#ff3cac",
      "#784ba0",
      "#2b86c5",
      "#ff9a00",
      "#ffffff",
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    for (let i = 0; i < 220; i += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.2 + 0.5,
        speed: Math.random() * 0.8 + 0.25,
        angle: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;

      ctx.fillStyle = "rgba(2, 3, 10, 0.24)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particles.forEach((particle) => {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;

        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const pull = 0.25 + Math.min(1.2, 180 / distance);

        particle.x += (dx / distance) * particle.speed * pull;
        particle.y += (dy / distance) * particle.speed * pull;

        if (distance < 15) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.max(canvas.width, canvas.height) * 0.45;

          particle.x = centerX + Math.cos(angle) * radius;
          particle.y = centerY + Math.sin(angle) * radius;
        }

        ctx.beginPath();

        ctx.arc(
          particle.x,
          particle.y,
          particle.size,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = particle.color;
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      if (elapsed < 5000) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrame);

        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 350);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [onComplete]);

  return (
    <div className="cara-intro">
      <canvas ref={canvasRef} />

      <div className="cara-intro-content">
        <h1 className="cara-intro-title">CARA</h1>

        <p className="cara-intro-subtitle">
          Career Intelligence • AI • Readiness
        </p>
      </div>
    </div>
  );
}

export default CARAIntro;