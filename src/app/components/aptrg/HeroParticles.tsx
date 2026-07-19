import { useEffect, useRef } from 'react';

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drones: Drone[] = [];
    let dusts: Dust[] = [];
    let animationFrameId: number;

    class Dust {
      x: number;
      y: number;
      speed: number;
      angle: number;
      size: number;
      alpha: number;
      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.speed = 0.1 + Math.random() * 0.3;
        this.angle = Math.random() * Math.PI * 2;
        this.size = 0.5 + Math.random() * 1.5;
        this.alpha = 0.1 + Math.random() * 0.3;
      }
      update(w: number, h: number) {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
      }
      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(150, 150, 150, ${this.alpha})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class Drone {
      x: number;
      y: number;
      angle: number;
      speed: number;
      history: { x: number, y: number }[];
      maxHistory: number;
      turnSpeed: number;
      targetAngle: number;
      type: 'quad' | 'plane';
      direction: 'left' | 'right' | 'up' | 'down';
      noiseOffset: number;
      size: number;
      variant?: 1 | 2;

      constructor(w: number, h: number, type: 'quad' | 'plane', direction: 'left' | 'right' | 'up' | 'down', variant?: 1 | 2) {
        this.type = type;
        this.direction = direction;
        this.variant = variant || 1;
        this.history = [];
        this.noiseOffset = Math.random() * 1000;

        if (type === 'plane') {
          if (direction === 'left') {
            this.x = w + 50 + Math.random() * 200; // Start off-screen right
            this.y = Math.random() * h;
            this.angle = Math.PI; // Point left
          } else {
            this.x = -50 - Math.random() * 200; // Start off-screen left
            this.y = Math.random() * h;
            this.angle = 0; // Point right
          }
          this.speed = 3.5; // Constant fast speed
          this.maxHistory = 200; // Optimized history length
          this.turnSpeed = 0.02;
          this.size = 30;
        } else {
          if (direction === 'down') {
            this.x = Math.random() * w;
            this.y = -50 - Math.random() * 200; // Start off-screen top
            this.angle = Math.PI / 2; // Point down
          } else {
            this.x = Math.random() * w;
            this.y = h + 50 + Math.random() * 200; // Start off-screen bottom
            this.angle = -Math.PI / 2; // Point up
          }
          this.speed = 1.5; // Constant drone speed
          this.maxHistory = 40; // Optimized history length
          this.turnSpeed = 0.05;
          this.size = 16;
        }
        this.targetAngle = this.angle;
      }

      update(w: number, h: number) {
        this.noiseOffset += 0.02;

        // Flight path logic based on type and direction
        if (this.type === 'plane') {
          if (this.direction === 'left') {
            this.targetAngle = Math.PI + Math.sin(this.noiseOffset) * 0.15;
            if (this.x < -150) {
              this.x = w + 150;
              this.y = Math.random() * h;
              this.history = [];
            }
          } else {
            this.targetAngle = 0 + Math.sin(this.noiseOffset) * 0.15;
            if (this.x > w + 150) {
              this.x = -150;
              this.y = Math.random() * h;
              this.history = [];
            }
          }
        } else {
          if (this.direction === 'down') {
            this.targetAngle = Math.PI / 2 + Math.sin(this.noiseOffset) * 0.3;
            if (this.y > h + 150) {
              this.y = -150;
              this.x = Math.random() * w;
              this.history = [];
            }
          } else {
            this.targetAngle = -Math.PI / 2 + Math.sin(this.noiseOffset) * 0.3;
            if (this.y < -150) {
              this.y = h + 150;
              this.x = Math.random() * w;
              this.history = [];
            }
          }
        }

        // Smoothly interpolate angle to targetAngle
        const diff = this.targetAngle - this.angle;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.angle += normalizedDiff * this.turnSpeed;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // OPTIMIZATION: Only push history if it moved a certain distance
        // This drastically reduces the number of segments to render, minimizing lag
        const lastPos = this.history[this.history.length - 1];
        if (!lastPos || Math.hypot(this.x - lastPos.x, this.y - lastPos.y) > 5) {
          this.history.push({ x: this.x, y: this.y });
          if (this.history.length > this.maxHistory) {
            this.history.shift();
          }
        }
      }

      drawTrail(ctx: CanvasRenderingContext2D) {
        if (this.history.length < 2) return;

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (this.type === 'plane') {
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(239, 68, 68, 1)';
        }

        for (let i = 0; i < this.history.length - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(this.history[i].x, this.history[i].y);
          ctx.lineTo(this.history[i + 1].x, this.history[i + 1].y);
          // Opacity fades out towards the tail
          const progress = i / this.history.length;
          // Ease-in curve for opacity looks better
          const alpha = Math.pow(progress, 2) * (this.type === 'plane' ? 0.7 : 0.4);

          ctx.strokeStyle = this.type === 'plane'
            ? `rgba(239, 68, 68, ${alpha})` // Bright red glow
            : `rgba(55, 65, 81, ${alpha})`; // Gray trail for drones

          ctx.lineWidth = this.type === 'plane' ? 4 : 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      draw(ctx: CanvasRenderingContext2D) {
        this.drawTrail(ctx);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.type === 'plane') {
          if (this.variant === 1) {
            // Fixed-Wing UAV (V-Tail design based on reference)

            // Main Wings (Grey)
            ctx.fillStyle = '#9ca3af';

            // Top/Left Wing
            ctx.beginPath();
            ctx.moveTo(this.size * 0.3, 0);
            ctx.lineTo(this.size * 0.1, -this.size * 1.6); // Shortened span
            ctx.quadraticCurveTo(-this.size * 0.1, -this.size * 1.8, -this.size * 0.3, -this.size * 1.6); // Rounded tip
            ctx.lineTo(-this.size * 0.2, 0);
            ctx.closePath();
            ctx.fill();

            // Bottom/Right Wing
            ctx.beginPath();
            ctx.moveTo(this.size * 0.3, 0);
            ctx.lineTo(this.size * 0.1, this.size * 1.6); // Shortened span
            ctx.quadraticCurveTo(-this.size * 0.1, this.size * 1.8, -this.size * 0.3, this.size * 1.6); // Rounded tip
            ctx.lineTo(-this.size * 0.2, 0);
            ctx.closePath();
            ctx.fill();

            // Red Ailerons (Flaps)
            ctx.fillStyle = '#ef4444'; // Red
            // Top/Left Flap (drawn over trailing edge)
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.25, -this.size * 0.8);
            ctx.lineTo(-this.size * 0.29, -this.size * 1.5);
            ctx.lineTo(-this.size * 0.15, -this.size * 1.5);
            ctx.lineTo(-this.size * 0.11, -this.size * 0.8);
            ctx.closePath();
            ctx.fill();

            // Bottom/Right Flap
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.25, this.size * 0.8);
            ctx.lineTo(-this.size * 0.29, this.size * 1.5);
            ctx.lineTo(-this.size * 0.15, this.size * 1.5);
            ctx.lineTo(-this.size * 0.11, this.size * 0.8);
            ctx.closePath();
            ctx.fill();

            // V-Tail (Beige/brownish grey)
            ctx.fillStyle = '#bcaaa4';

            // Top/Left V-Tail
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.9, 0);
            ctx.lineTo(-this.size * 1.3, -this.size * 0.8);
            ctx.lineTo(-this.size * 1.7, -this.size * 0.8);
            ctx.lineTo(-this.size * 1.3, 0);
            ctx.closePath();
            ctx.fill();

            // Bottom/Right V-Tail
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.9, 0);
            ctx.lineTo(-this.size * 1.3, this.size * 0.8);
            ctx.lineTo(-this.size * 1.7, this.size * 0.8);
            ctx.lineTo(-this.size * 1.3, 0);
            ctx.closePath();
            ctx.fill();

            // Fuselage Main Body (Darker grey)
            ctx.fillStyle = '#6b7280';
            ctx.beginPath();
            ctx.moveTo(this.size * 1.2, -this.size * 0.2);
            ctx.lineTo(this.size * 1.2, this.size * 0.2);
            ctx.lineTo(-this.size * 1.3, this.size * 0.1); // Tapering
            ctx.lineTo(-this.size * 1.3, -this.size * 0.1);
            ctx.closePath();
            ctx.fill();

            // Red Nose Cone (Parabolic/Oval bullet shape)
            ctx.fillStyle = '#991b1b'; // Maroon
            ctx.beginPath();
            ctx.moveTo(this.size * 1.2, -this.size * 0.2);
            ctx.quadraticCurveTo(this.size * 1.8, 0, this.size * 1.2, this.size * 0.2);
            ctx.closePath();
            ctx.fill();

          } else {
            // Plane Variant 2 (Based exactly on 2D schematic, colored like Plane 1 but lighter)

            // Wings (Lighter grey)
            ctx.fillStyle = '#d1d5db';

            // Top/Left Wing
            ctx.beginPath();
            ctx.moveTo(this.size * 0.3, 0); // Root LE
            ctx.lineTo(this.size * 0.1, -this.size * 2.6); // Tip LE (swept back)
            ctx.lineTo(-this.size * 0.5, -this.size * 2.6); // Tip TE (straight TE)
            ctx.lineTo(-this.size * 0.5, 0); // Root TE
            ctx.closePath();
            ctx.fill();

            // Bottom/Right Wing
            ctx.beginPath();
            ctx.moveTo(this.size * 0.3, 0);
            ctx.lineTo(this.size * 0.1, this.size * 2.6);
            ctx.lineTo(-this.size * 0.5, this.size * 2.6);
            ctx.lineTo(-this.size * 0.5, 0);
            ctx.closePath();
            ctx.fill();

            // Red Flaps (Mid-wing trailing edge)
            ctx.fillStyle = '#ef4444'; // Red (same as plane 1)
            // Top/Left Flap
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.5, -this.size * 1.2);
            ctx.lineTo(-this.size * 0.3, -this.size * 1.2);
            ctx.lineTo(-this.size * 0.3, -this.size * 2.2);
            ctx.lineTo(-this.size * 0.5, -this.size * 2.2);
            ctx.closePath();
            ctx.fill();

            // Bottom/Right Flap
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.5, this.size * 1.2);
            ctx.lineTo(-this.size * 0.3, this.size * 1.2);
            ctx.lineTo(-this.size * 0.3, this.size * 2.2);
            ctx.lineTo(-this.size * 0.5, this.size * 2.2);
            ctx.closePath();
            ctx.fill();

            // V-Tail (Beige/brownish grey like plane 1)
            ctx.fillStyle = '#bcaaa4';
            // Top/Left V-Tail
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.9, -this.size * 0.225); // Root LE
            ctx.lineTo(-this.size * 1.6, -this.size * 0.75); // Tip LE
            ctx.lineTo(-this.size * 1.8, -this.size * 0.75); // Tip TE
            ctx.lineTo(-this.size * 1.3, -this.size * 0.15); // Root TE
            ctx.closePath();
            ctx.fill();

            // Bottom/Right V-Tail
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.9, this.size * 0.225);
            ctx.lineTo(-this.size * 1.6, this.size * 0.75);
            ctx.lineTo(-this.size * 1.8, this.size * 0.75);
            ctx.lineTo(-this.size * 1.3, this.size * 0.15);
            ctx.closePath();
            ctx.fill();

            // Fuselage (Light grey, lighter than plane 1's dark grey)
            ctx.fillStyle = '#9ca3af';
            // Fuselage Rear
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.5, -this.size * 0.3);
            ctx.lineTo(-this.size * 1.3, -this.size * 0.15);
            ctx.lineTo(-this.size * 1.3, this.size * 0.15);
            ctx.lineTo(-this.size * 0.5, this.size * 0.3);
            ctx.closePath();
            ctx.fill();

            // Fuselage Middle (Rectangular block over wings)
            ctx.beginPath();
            ctx.moveTo(this.size * 0.5, -this.size * 0.3);
            ctx.lineTo(this.size * 0.5, this.size * 0.3);
            ctx.lineTo(-this.size * 0.5, this.size * 0.3);
            ctx.lineTo(-this.size * 0.5, -this.size * 0.3);
            ctx.closePath();
            ctx.fill();

            // Fuselage Front (Long Taper)
            ctx.beginPath();
            ctx.moveTo(this.size * 0.5, -this.size * 0.3);
            ctx.lineTo(this.size * 2.0, -this.size * 0.1);
            ctx.lineTo(this.size * 2.0, this.size * 0.1);
            ctx.lineTo(this.size * 0.5, this.size * 0.3);
            ctx.closePath();
            ctx.fill();

            // Red Nose Tip
            ctx.fillStyle = '#991b1b'; // Maroon
            ctx.beginPath();
            ctx.moveTo(this.size * 2.0, -this.size * 0.1);
            ctx.lineTo(this.size * 2.4, 0);
            ctx.lineTo(this.size * 2.0, this.size * 0.1);
            ctx.closePath();
            ctx.fill();
          }

        } else {
          // Multirotor Quadcopter
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1.5;
          ctx.fillStyle = '#374151';

          // Arms (X shape)
          ctx.beginPath();
          ctx.moveTo(-this.size, -this.size);
          ctx.lineTo(this.size, this.size);
          ctx.moveTo(-this.size, this.size);
          ctx.lineTo(this.size, -this.size);
          ctx.stroke();

          // Propellers
          const drawProp = (px: number, py: number) => {
            ctx.beginPath();
            // Spinning blur
            ctx.fillStyle = 'rgba(55, 65, 81, 0.2)';
            ctx.arc(px, py, this.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            // Motor hub
            ctx.fillStyle = '#1f2937';
            ctx.beginPath();
            ctx.arc(px, py, this.size * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }
          drawProp(-this.size, -this.size);
          drawProp(this.size, this.size);
          drawProp(-this.size, this.size);
          drawProp(this.size, -this.size);

          // Central Body
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      initScene();
    };

    const initScene = () => {
      drones = [];
      dusts = [];

      // 2 Fixed wing UAVs (one each way)
      drones.push(new Drone(canvas.width, canvas.height, 'plane', 'left', 1));
      drones.push(new Drone(canvas.width, canvas.height, 'plane', 'right', 2));

      // 2 Quadcopters (one each way)
      drones.push(new Drone(canvas.width, canvas.height, 'quad', 'down'));
      drones.push(new Drone(canvas.width, canvas.height, 'quad', 'up'));

      // Fine dust particles
      const numDust = window.innerWidth < 768 ? 40 : 100;
      for (let i = 0; i < numDust; i++) {
        dusts.push(new Dust(canvas.width, canvas.height));
      }
    };

    let isVisible = true;

    const render = () => {
      if (!isVisible) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dust first (background layer)
      dusts.forEach(d => {
        d.update(canvas.width, canvas.height);
        d.draw(ctx);
      });

      // Draw drones and trails
      drones.forEach((d) => {
        d.update(canvas.width, canvas.height);
        d.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          // Restart animation loop if visible
          cancelAnimationFrame(animationFrameId);
          render();
        } else {
          // Pause animation loop if not visible
          cancelAnimationFrame(animationFrameId);
        }
      });
    });

    observer.observe(canvas);
    window.addEventListener('resize', resize);
    resize();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
