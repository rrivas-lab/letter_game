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

  const [isRevealed, setIsRevealed] = useState(helpLevel !== 'minimal' || forceReveal);

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
    
    // Background for mystery card
    if (helpLevel === 'minimal' && !isRevealed) {
      ctx.fillStyle = '#F9FAFB'; 
      ctx.fillRect(0, 0, width, height);
      
      // Add some subtle pattern
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
    const fontSize = Math.floor(height * 0.75);
    ctx.font = `bold ${fontSize}px "Fredoka", "Arial", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = width / 2;
    const centerY = height / 2 + (height * 0.02);
    
    if (helpLevel === 'full') {
      // Background letter
      ctx.fillStyle = '#F3F4F6'; // gray-100
      ctx.fillText(letter, centerX, centerY);
      
      // Dashed guide
      ctx.strokeStyle = '#4B5563'; // gray-600 (darker)
      ctx.setLineDash([15, 15]);
      ctx.lineWidth = 12; // Thicker
      ctx.strokeText(letter, centerX, centerY);
      ctx.setLineDash([]);
    } else if (helpLevel === 'medium') {
      ctx.fillStyle = '#F3F4F6'; // gray-100
      ctx.fillText(letter, centerX, centerY);
      ctx.strokeStyle = '#9CA3AF'; // gray-400
      ctx.lineWidth = 3;
      ctx.strokeText(letter, centerX, centerY);
    } else {
      if (isRevealed) {
        ctx.fillStyle = '#F3F4F6'; // gray-100
        ctx.fillText(letter, centerX, centerY);
        ctx.strokeStyle = '#D1D5DB'; // gray-300
        ctx.lineWidth = 1;
        ctx.strokeText(letter, centerX, centerY);
      } else {
        // Mystery card state
        ctx.fillStyle = '#9CA3AF'; // gray-400
        ctx.font = `bold ${Math.floor(height * 0.5)}px "Fredoka", "Arial", sans-serif`;
        ctx.fillText('?', centerX, centerY);
      }
    }

    // Create mask for completion check
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const mctx = maskCanvas.getContext('2d');
    if (mctx) {
      mctx.font = `bold ${fontSize}px "Fredoka", "Arial", sans-serif`;
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillStyle = 'black';
      mctx.fillText(letter, width / 2, height / 2 + (height * 0.02));
      
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
    
    if (!isRevealed) {
      setIsRevealed(true);
      // We need to redraw the background immediately to show the letter
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawBackground(ctx, canvas.width, canvas.height);
      }
    }

    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 30; // Thicker for easier tracing
    ctx.strokeStyle = color;

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
      color: '#FFFFFF' // Sparkle color
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

    ctx.lineTo(x, y);
    ctx.stroke();

    // Add sparkle particles
    if (Math.random() > 0.7) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        size: Math.random() * 8 + 4,
        life: 1,
        color: '#FFFFFF'
      });
    }
    
    // Check progress periodically while drawing
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
      {isRevealed && isSuccess && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-6xl">✨</div>
        </motion.div>
      )}
      {!isRevealed && (
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">¡Toca para descubrir!</span>
        </div>
      )}
    </motion.div>
  );
});
