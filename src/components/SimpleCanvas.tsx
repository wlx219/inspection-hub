import React, { useEffect, useRef, useState } from 'react';

interface SimpleCanvasProps {
  imageUrl: string;
}

export function SimpleCanvas({ imageUrl }: SimpleCanvasProps) {
  const [status, setStatus] = useState<string>('initial');
  const [imgSize, setImgSize] = useState<{w: number, h: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  console.log('[SimpleCanvas] Render, imageUrl:', imageUrl?.substring(0, 80));

  useEffect(() => {
    console.log('[SimpleCanvas] useEffect fired, imageUrl:', imageUrl?.substring(0, 80));
    setStatus('loading');
    
    if (!imageUrl) {
      setStatus('no-url');
      return;
    }

    const img = new Image();
    img.onload = () => {
      console.log('[SimpleCanvas] Image loaded:', img.width, img.height);
      imgRef.current = img;
      setImgSize({ w: img.width, h: img.height });
      setStatus('loaded');
      
      // 绘制到 canvas
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          console.log('[SimpleCanvas] Canvas drawn');
        }
      }
    };
    
    img.onerror = (e) => {
      console.error('[SimpleCanvas] Image error:', e);
      setStatus('error');
    };
    
    img.src = imageUrl;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return (
    <div style={{ padding: 20 }}>
      <h2>标注画布 (调试版)</h2>
      <p>状态: {status}</p>
      {imgSize && <p>图片尺寸: {imgSize.w} x {imgSize.h}</p>}
      <p>imageUrl: {imageUrl?.substring(0, 100)}...</p>
      
      {status === 'loaded' && (
        <div style={{ marginTop: 10 }}>
          <canvas 
            ref={canvasRef}
            style={{ border: '2px solid #333', maxWidth: '100%' }}
          />
        </div>
      )}
      
      {status === 'error' && (
        <div style={{ color: 'red', padding: 20, background: '#fee' }}>
          图片加载失败
        </div>
      )}
    </div>
  );
}
