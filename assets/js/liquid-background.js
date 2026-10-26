/**
 * LIQUID BLUE GLASS ANIMATED BACKGROUND
 * Procedural Canvas Simulation of Liquid Glass Light Waves on Deep Pitch Black
 * 
 * Features:
 * - Ultra-smooth 60fps multi-layer organic wave deformation
 * - Deep navy (#020817), electric blue (#087DDE), reflection cyan (#57B9FF), and crisp white-cyan highlights (#B8E5FF)
 * - Specular reflection ridges and subsurface light refraction
 * - Auto-pauses on background tabs (document.hidden) to save GPU/battery
 * - Respects prefers-reduced-motion
 * - Auto-scales to devicePixelRatio (capped at 2)
 */

(function () {
  'use strict';

  class LiquidGlassBackground {
    constructor(canvasId = 'liquid-canvas', options = {}) {
      this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d', { alpha: false });
      if (!this.ctx) return;

      this.options = Object.assign({
        speed: 0.0008,        // Smooth cinematic wave motion
        intensity: 1.18,      // Enhanced luminous wave brightness
        darkness: 0.92,       // Deep pitch black contrast
        ribbonCount: 4,       // Number of organic liquid light ribbons
        interactive: true     // Subtle mouse / touch deflection
      }, options);

      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.time = 0;
      this.animId = null;
      this.isRunning = false;

      // Mouse / cursor interaction coordinates (normalized 0..1)
      this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

      // Multi-layer ribbons definition with individual motion phases and color palettes
      this.ribbons = [
        // 1. Deep ambient undercurrent (wide, deep blue #04142d -> #06234A)
        {
          baseY: 0.65,
          amplitude: 110,
          wavelength: 0.0018,
          speed: 1.0,
          phase: 0.0,
          harmonics: [
            { freq: 0.0012, amp: 45, speed: 0.8 },
            { freq: 0.0028, amp: 25, speed: 1.3 }
          ],
          blur: 48,
          lineWidth: 56,
          colors: [
            { stop: 0.0, color: 'rgba(2, 8, 23, 0)' },
            { stop: 0.3, color: 'rgba(4, 20, 52, 0.45)' },
            { stop: 0.6, color: 'rgba(6, 35, 74, 0.75)' },
            { stop: 0.85, color: 'rgba(8, 90, 180, 0.4)' },
            { stop: 1.0, color: 'rgba(2, 8, 23, 0)' }
          ],
          specular: false
        },
        // 2. Primary Electric Liquid Stream (curving diagonally through the screen)
        {
          baseY: 0.48,
          amplitude: 140,
          wavelength: 0.0015,
          speed: 1.25,
          phase: 1.8,
          harmonics: [
            { freq: 0.0022, amp: 60, speed: 1.1 },
            { freq: 0.0035, amp: 30, speed: 1.7 }
          ],
          blur: 28,
          lineWidth: 38,
          colors: [
            { stop: 0.0, color: 'rgba(4, 20, 55, 0)' },
            { stop: 0.25, color: 'rgba(6, 35, 74, 0.65)' },
            { stop: 0.5, color: 'rgba(8, 125, 222, 0.95)' },
            { stop: 0.75, color: 'rgba(87, 185, 255, 0.7)' },
            { stop: 1.0, color: 'rgba(4, 20, 55, 0)' }
          ],
          specular: true
        },
        // 3. Crisp Specular Surface Glass Ridge (sharp light reflection along top edge)
        {
          baseY: 0.46,
          amplitude: 135,
          wavelength: 0.0015,
          speed: 1.25,
          phase: 1.82,
          harmonics: [
            { freq: 0.0022, amp: 58, speed: 1.1 },
            { freq: 0.0035, amp: 28, speed: 1.7 }
          ],
          blur: 6,
          lineWidth: 7,
          colors: [
            { stop: 0.0, color: 'rgba(8, 125, 222, 0)' },
            { stop: 0.4, color: 'rgba(87, 185, 255, 0.9)' },
            { stop: 0.6, color: 'rgba(184, 229, 255, 1.0)' },  // Soft cyan/white-hot specular highlight
            { stop: 0.8, color: 'rgba(255, 255, 255, 0.95)' }, // Pure reflective glass crest
            { stop: 1.0, color: 'rgba(87, 185, 255, 0)' }
          ],
          specular: true,
          blendMode: 'screen'
        },
        // 4. Secondary Upper Liquid Flow (slow flowing reflection in upper quadrant)
        {
          baseY: 0.26,
          amplitude: 85,
          wavelength: 0.0022,
          speed: 0.75,
          phase: 3.4,
          harmonics: [
            { freq: 0.0016, amp: 35, speed: 0.9 },
            { freq: 0.0031, amp: 18, speed: 1.4 }
          ],
          blur: 24,
          lineWidth: 26,
          colors: [
            { stop: 0.0, color: 'rgba(2, 8, 23, 0)' },
            { stop: 0.35, color: 'rgba(6, 35, 74, 0.5)' },
            { stop: 0.6, color: 'rgba(8, 125, 222, 0.75)' },
            { stop: 0.85, color: 'rgba(87, 185, 255, 0.55)' },
            { stop: 1.0, color: 'rgba(2, 8, 23, 0)' }
          ],
          specular: true
        },
        // 5. Ultra-fine Sheen Reflection Line (razor sharp highlight along upper flow)
        {
          baseY: 0.255,
          amplitude: 85,
          wavelength: 0.0022,
          speed: 0.75,
          phase: 3.41,
          harmonics: [
            { freq: 0.0016, amp: 35, speed: 0.9 },
            { freq: 0.0031, amp: 18, speed: 1.4 }
          ],
          blur: 4,
          lineWidth: 3.5,
          colors: [
            { stop: 0.0, color: 'rgba(87, 185, 255, 0)' },
            { stop: 0.5, color: 'rgba(184, 229, 255, 0.95)' },
            { stop: 0.7, color: 'rgba(255, 255, 255, 0.98)' },
            { stop: 1.0, color: 'rgba(87, 185, 255, 0)' }
          ],
          specular: true,
          blendMode: 'screen'
        }
      ];

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });

      // Subtle interaction
      if (this.options.interactive) {
        window.addEventListener('pointermove', (e) => {
          this.mouse.targetX = e.clientX / window.innerWidth;
          this.mouse.targetY = e.clientY / window.innerHeight;
        }, { passive: true });
      }

      // Lifecycle: pause on hidden tabs
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.start();
        }
      });

      // Reduced motion check
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        this.options.speed *= 0.1; // static slow drift
      }

      this.start();
    }

    resize() {
      const parent = this.canvas.parentElement;
      const isFixed = this.canvas.classList.contains('liquid-canvas-fixed') || this.canvas.classList.contains('canvas-fixed') || !parent || parent === document.body;
      const rect = isFixed
        ? { width: window.innerWidth, height: window.innerHeight }
        : parent.getBoundingClientRect();

      this.width = Math.max(rect.width || window.innerWidth, 320);
      this.height = Math.max(rect.height || window.innerHeight, 320);

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      this.ctx.scale(this.dpr, this.dpr);
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      let lastTimestamp = performance.now();

      const loop = (timestamp) => {
        if (!this.isRunning) return;
        const delta = Math.min(timestamp - lastTimestamp, 64);
        lastTimestamp = timestamp;

        this.time += delta * this.options.speed;
        
        // Smooth mouse dampening
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

        this.draw();
        this.animId = requestAnimationFrame(loop);
      };

      this.animId = requestAnimationFrame(loop);
    }

    pause() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    getWaveY(x, ribbon) {
      const t = this.time * ribbon.speed + ribbon.phase;
      const base = ribbon.baseY * this.height;
      
      // Primary wave with mouse deflection
      const mouseInfluence = (this.mouse.y - 0.5) * 35;
      let y = base + Math.sin(x * ribbon.wavelength + t) * ribbon.amplitude + mouseInfluence;

      // Harmonics for organic, liquid curvature
      for (let i = 0; i < ribbon.harmonics.length; i++) {
        const h = ribbon.harmonics[i];
        y += Math.sin(x * h.freq + t * h.speed) * h.amp;
        y += Math.cos(x * (h.freq * 0.6) - t * 0.5) * (h.amp * 0.4);
      }

      return y;
    }

    draw() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      ctx.save();

      // 1. Deep Pitch Black Canvas Base (#000000 with very subtle deep navy vignette)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Subtle atmospheric deep navy gradient at bottom
      const bgGrad = ctx.createRadialGradient(
        w * 0.6, h * 0.5, 50,
        w * 0.5, h * 0.5, Math.max(w, h) * 0.85
      );
      bgGrad.addColorStop(0, 'rgba(4, 18, 42, 0.25)');
      bgGrad.addColorStop(0.6, 'rgba(2, 8, 23, 0.4)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Render each Liquid Ribbon
      const step = Math.max(12, Math.floor(w / 140)); // High precision points

      for (let r = 0; r < this.ribbons.length; r++) {
        const ribbon = this.ribbons[r];

        ctx.save();
        if (ribbon.blendMode) {
          ctx.globalCompositeOperation = ribbon.blendMode;
        } else {
          ctx.globalCompositeOperation = 'screen';
        }

        ctx.filter = `blur(${ribbon.blur}px)`;

        // Calculate wave path
        ctx.beginPath();
        const startY = this.getWaveY(-40, ribbon);
        ctx.moveTo(-40, startY);

        for (let x = 0; x <= w + 40; x += step) {
          const y = this.getWaveY(x, ribbon);
          ctx.lineTo(x, y);
        }

        // Create fluid linear gradient along ribbon path
        const grad = ctx.createLinearGradient(0, 0, w, h * 0.8);
        for (let i = 0; i < ribbon.colors.length; i++) {
          const c = ribbon.colors[i];
          grad.addColorStop(c.stop, c.color);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = ribbon.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.restore();
      }

      // 3. Top Glass Vignette to preserve deep contrast and high readability
      ctx.globalCompositeOperation = 'source-over';
      const edgeVignette = ctx.createRadialGradient(
        w * 0.5, h * 0.5, Math.min(w, h) * 0.35,
        w * 0.5, h * 0.5, Math.max(w, h) * 0.75
      );
      edgeVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      edgeVignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
      edgeVignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = edgeVignette;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();
    }
  }

  // Global Initializer
  window.initLiquidBackground = function (canvasId = 'liquid-canvas', options = {}) {
    return new LiquidGlassBackground(canvasId, options);
  };

  // Auto-init if canvas exists on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const defaultCanvas = document.getElementById('liquid-canvas');
    if (defaultCanvas) {
      window.liquidBgInstance = new LiquidGlassBackground(defaultCanvas);
    }
  });

})();
