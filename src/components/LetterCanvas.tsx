import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { motion, useAnimation } from 'motion/react';

export type HelpLevel = 'full' | 'medium' | 'minimal';

interface LetterCanvasProps {
  letter: string;
  color: string;
  helpLevel?: HelpLevel;
  onSuccess?: () => void;
  onFailure?: () => void;
  onProgress?: (progress: number) => void;
  isTarget?: boolean;
  forceReveal?: boolean;
}

export interface LetterCanvasHandle {
  clear: () => void;
}

export const LetterCanvas = forwardRef<LetterCanvasHandle, LetterCanvasProps>(({ 
  letter, 
  color, 
  helpLevel = 'full', 
  onSuccess, 
  onFailure,
  onProgress,
  isTarget = true,
  forceReveal = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const controls = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [totalTargetPixels, setTotalTargetPixels] = useState(0);
  const particlesRef = useRef<{x: number, y: number, size: number, life: number, color: string}[]>([]);
  const requestRef = useRef<number>();

  // Particle animation loop
  const animateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We don't clear the whole canvas, just update particles
    // Actually, we need to redraw the background and the drawing to show particles on top
    // But that's expensive. Instead, let's just draw particles and let them fade.
    // To make them fade, we'd need to redraw everything.
    // Let's keep it simpler: just draw the particles on top of the current canvas state.
    
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
      p.life -= 0.05;
    });

    requestRef.current = requestAnimationFrame(animateParticles);
  }, [color]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animateParticles]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(ctx, canvas.width, canvas.height);
        setHasDrawn(false);
        setIsSuccess(false);
        onProgress?.(0);
        particlesRef.current = [];
      }
    }
  }));

  const [isRevealed, setIsRevealed] = useState(true);
  const lastXRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const lastMidXRef = useRef<number | null>(null);
  const lastMidYRef = useRef<number | null>(null);

  // Update revealed state when props change
  useEffect(() => {
    if (helpLevel !== 'minimal' || forceReveal) {
      setIsRevealed(true);
    }
  }, [helpLevel, forceReveal]);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw a subtle paper texture
    ctx.fillStyle = '#FDFCF0';
    ctx.fillRect(0, 0, width, height);
    
    // Subtle grid/dots for a "notebook" feel
    ctx.fillStyle = '#E5E7EB';
    const dotSpacing = 30;
    for (let x = dotSpacing/2; x < width; x += dotSpacing) {
      for (let y = dotSpacing/2; y < height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Background for mystery card
    if (helpLevel === 'minimal' && !isRevealed) {
      ctx.fillStyle = 'rgba(249, 250, 251, 0.8)'; 
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 2;
      for (let i = -width; i < width + height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }
    }
    
    // Base letter guide
    const fontSize = Math.floor(height * 0.8);
    ctx.font = `600 ${fontSize}px "Fredoka", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = width / 2;
    const centerY = height / 2 + (height * 0.05);
    
    // Always show the letter in a clean style for selection
    ctx.fillStyle = '#4B5563'; // Dark gray for visibility
    ctx.fillText(letter, centerX, centerY);

    if (helpLevel === 'full') {
      // Elegant dashed guide for tracing
      ctx.strokeStyle = '#D1D5DB';
      ctx.setLineDash([20, 15]);
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.strokeText(letter, centerX, centerY);
      
      ctx.strokeStyle = '#9CA3AF';
      ctx.setLineDash([2, 30]);
      ctx.lineWidth = 6;
      ctx.strokeText(letter, centerX, centerY);
      ctx.setLineDash([]);
    }

    // Create mask for completion check (keep it simple/solid for math)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const mctx = maskCanvas.getContext('2d');
    if (mctx) {
      mctx.font = `600 ${fontSize}px "Fredoka", sans-serif`;
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillStyle = 'black';
      mctx.fillText(letter, width / 2, height / 2 + (height * 0.05));
      
      const imageData = mctx.getImageData(0, 0, width, height);
      let count = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) count++;
      }
      setTotalTargetPixels(count);
      maskCanvasRef.current = maskCanvas;
    }
  }, [letter, helpLevel, isRevealed]);

  const checkCompletion = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || totalTargetPixels === 0) return 0;

    const ctx = canvas.getContext('2d');
    const mctx = maskCanvas.getContext('2d');
    if (!ctx || !mctx) return 0;

    const drawingData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = mctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    
    let covered = 0;
    // Sample every 4th pixel for performance
    for (let i = 3; i < maskData.data.length; i += 16) {
      if (maskData.data[i] > 128 && drawingData.data[i] > 128) {
        covered++;
      }
    }
    
    const progress = (covered / (totalTargetPixels / 4)) * 100;
    onProgress?.(progress);
    return progress;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw background whenever letter, helpLevel, or isRevealed changes
    // Also wait for fonts to be ready to ensure correct rendering
    const handleDraw = () => {
      drawBackground(ctx, canvas.width, canvas.height);
    };

    handleDraw();
    
    if ('fonts' in document) {
      (document as any).fonts.ready.then(handleDraw);
    }
  }, [drawBackground]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const width = entry.target.clientWidth;
        const height = entry.target.clientHeight;
        
        if (width > 0 && height > 0) {
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            drawBackground(ctx, width, height);
          }
        }
      }
    };

    const observer = new ResizeObserver(resize);
    const parent = canvas.parentElement;
    if (parent) {
      observer.observe(parent);
      
      // Initial size check
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        drawBackground(ctx, width, height);
      }
    }

    // Force a redraw after a short delay to ensure fonts and layout are settled
    const timer = setTimeout(() => {
      if (canvas.width > 0 && canvas.height > 0) {
        drawBackground(ctx, canvas.width, canvas.height);
      }
    }, 100);

    // Entrance animation
    controls.start({
      scale: [0.9, 1.02, 1],
      opacity: [0, 1],
      transition: { duration: 0.4, ease: "easeOut" }
    });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [drawBackground, controls]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSuccess) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    // If we are in "Find" mode (onSuccess is present)
    if (onSuccess) {
      if (isTarget) {
        setIsSuccess(true);
        controls.start({
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0],
          transition: { duration: 0.5, ease: "easeInOut" }
        });
        onSuccess();
      } else {
        // Visual feedback for wrong choice
        controls.start({
          x: [-10, 10, -10, 10, 0],
          transition: { duration: 0.4 }
        });
        onFailure?.();
      }
      return;
    }

    setIsDrawing(true);
    setHasDrawn(true);
    
    lastXRef.current = x;
    lastYRef.current = y;
    lastMidXRef.current = x;
    lastMidYRef.current = y;

    // Small bounce on start
    controls.start({
      scale: 1.02,
      transition: { duration: 0.1 }
    });

    // Add initial particle
    particlesRef.current.push({
      x, y, 
      size: Math.random() * 15 + 10, 
      life: 1, 
      color: '#FFFFFF'
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isSuccess) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    // Smoothing with midpoints
    const midX = (lastXRef.current + x) / 2;
    const midY = (lastYRef.current + y) / 2;

    if (lastMidXRef.current !== null && lastMidYRef.current !== null) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Layer 1: Depth Shadow
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lastMidXRef.current, lastMidYRef.current);
      ctx.quadraticCurveTo(lastXRef.current, lastYRef.current, midX, midY);
      ctx.lineWidth = 32;
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowOffsetY = 4;
      ctx.stroke();
      ctx.restore();

      // Layer 2: Main Vibrant Body
      ctx.beginPath();
      ctx.moveTo(lastMidXRef.current, lastMidYRef.current);
      ctx.quadraticCurveTo(lastXRef.current, lastYRef.current, midX, midY);
      ctx.lineWidth = 32;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Layer 3: Glossy Highlight
      ctx.beginPath();
      ctx.moveTo(lastMidXRef.current, lastMidYRef.current);
      ctx.quadraticCurveTo(lastXRef.current, lastYRef.current, midX, midY);
      ctx.lineWidth = 12;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();
    }

    lastMidXRef.current = midX;
    lastMidYRef.current = midY;
    lastXRef.current = x;
    lastYRef.current = y;

    // Add sparkle particles
    if (Math.random() > 0.6) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        size: Math.random() * 10 + 5,
        life: 1,
        color: '#FFFFFF'
      });
    }
    
    if (Math.random() > 0.9) {
      checkCompletion();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    controls.start({
      scale: 1,
      transition: { duration: 0.2 }
    });

    const progress = checkCompletion();

    if (!isTarget) {
      onFailure?.();
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawBackground(ctx, canvas.width, canvas.height);
        }
      }
    } else {
      // In trace mode, we don't lock the canvas on stopDrawing.
      // We let the user keep drawing until they click "Listo" in the parent.
      // We only trigger onSuccess if it's provided (which is for 'find' mode)
      if (onSuccess && progress > 50) {
        setIsSuccess(true);
        controls.start({
          scale: [1, 1.1, 1],
          rotate: [0, 3, -3, 0],
          transition: { duration: 0.5, ease: "easeInOut" }
        });
        onSuccess();
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 1, scale: 1 }}
      animate={controls}
      whileHover={{ scale: 1.01 }}
      className="w-full h-full relative bg-white rounded-[40px] shadow-inner overflow-hidden border-4 border-kids-yellow/30 z-10"
      style={{
        backgroundImage: 'radial-gradient(#f1f1f1 2px, transparent 2px)',
        backgroundSize: '30px 30px'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />
      {isDrawing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none border-4 border-kids-blue/30 rounded-3xl"
        />
      )}
      {isSuccess && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-6xl">✨</div>
        </motion.div>
      )}
    </motion.div>
  );
});
