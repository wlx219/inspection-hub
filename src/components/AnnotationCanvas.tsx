import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Annotation, getAnnotationColor, ANNOTATION_TYPES, AnnotationTypeId, getAnnotationShortName } from '@/types';
import { ZoomIn, ZoomOut, Trash2, ChevronLeft, ChevronRight, Plus, MousePointer2 } from 'lucide-react';

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onAnnotationAdd: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationSelect: (annotation: Annotation | null) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationDelete?: (id: string) => void;
}

type InteractionMode = 'select' | 'add';

export function AnnotationCanvas({
  imageUrl,
  annotations,
  selectedAnnotationId,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onAnnotationAdd,
  onAnnotationSelect,
  onAnnotationUpdate,
  onAnnotationDelete,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({
    dimensionValue: '',
    annotationType: 1 as AnnotationTypeId,
    upperTolerance: '',
    lowerTolerance: '',
    note: '',
  });

  console.log('[AnnotationCanvas] Props:', { imageUrl: imageUrl?.substring(0, 50), annotationsCount: annotations.length });

  // 加载图片
  useEffect(() => {
    console.log('[AnnotationCanvas] Loading image:', imageUrl?.substring(0, 50));
    if (!imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('[AnnotationCanvas] Image loaded successfully');
      imageRef.current = img;
      setImageLoaded(true);
      setLoadError(null);
    };
    img.onerror = (e) => {
      console.error('[AnnotationCanvas] Image load error:', e);
      setLoadError('图片加载失败');
      setImageLoaded(false);
    };
    img.src = imageUrl;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // 渲染画布
  useEffect(() => {
    console.log('[AnnotationCanvas] Render effect:', { imageLoaded, hasCanvas: !!canvasRef.current, hasImage: !!imageRef.current });
    if (!imageLoaded || !canvasRef.current || !imageRef.current) {
      console.log('[AnnotationCanvas] Skipping render - conditions not met');
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[AnnotationCanvas] Failed to get 2d context');
        setRenderError('无法创建画布上下文');
        return;
      }
      
      const img = imageRef.current;
      console.log('[AnnotationCanvas] Drawing image:', { width: img.width, height: img.height });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // 绘制标注
      annotations.forEach(ann => {
        try {
          const color = getAnnotationColor(ann.annotationType);
          const shortName = getAnnotationShortName(ann.annotationType);
          const isSelected = ann.id === selectedAnnotationId;
          
          // 画圆圈
          ctx.beginPath();
          ctx.arc(ann.positionX, ann.positionY, 22, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          
          if (isSelected) {
            ctx.strokeStyle = '#FF6B00';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          
          // 画编号
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(shortName, ann.positionX, ann.positionY);
          
          // 画标注线
          ctx.beginPath();
          ctx.moveTo(ann.positionX, ann.positionY + 22);
          ctx.lineTo(ann.positionX, ann.positionY + 50);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // 显示尺寸值
          ctx.fillStyle = '#333';
          ctx.font = '12px sans-serif';
          ctx.fillText(ann.dimensionValue || '?', ann.positionX, ann.positionY + 60);
        } catch (e) {
          console.error('[AnnotationCanvas] Error drawing annotation:', e);
        }
      });
      
      setRenderError(null);
      console.log('[AnnotationCanvas] Render complete');
    } catch (e) {
      console.error('[AnnotationCanvas] Render error:', e);
      setRenderError(String(e));
    }
  }, [imageLoaded, annotations, selectedAnnotationId, zoom]);

  // 点击画布
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    // 检查是否点中某个标注
    const hit = annotations.find(ann => {
      const dx = ann.positionX - x;
      const dy = ann.positionY - y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });
    if (hit) {
      setSelectedId(hit.id);
      onAnnotationSelect(hit);
    } else if (interactionMode === 'add') {
      // 新建标注
      setIsAdding(true);
      setNewForm({ dimensionValue: '', annotationType: 1, upperTolerance: '', lowerTolerance: '', note: '' });
      // 临时保存位置，稍后填表
      const tempId = '__temp__';
      onAnnotationAdd({
        drawingId: '',
        number: annotations.length + 1,
        positionX: x,
        positionY: y,
        dimensionValue: '',
        annotationType: 1,
        visible: true,
      });
    }
  }, [annotations, interactionMode, onAnnotationSelect, onAnnotationAdd]);

  const handleConfirmAdd = () => {
    setIsAdding(false);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const handleDeleteSelected = () => {
    if (selectedAnnotationId && onAnnotationDelete) {
      onAnnotationDelete(selectedAnnotationId);
      setSelectedId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b shadow-sm">
        <button
          onClick={() => setInteractionMode('add')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            interactionMode === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plus size={16} /> 添加标注
        </button>
        <button
          onClick={() => setInteractionMode('select')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            interactionMode === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <MousePointer2 size={16} /> 选择
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 rounded hover:bg-gray-100">
          <ZoomOut size={18} className="text-gray-600" />
        </button>
        <span className="text-sm text-gray-600 w-14 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 rounded hover:bg-gray-100">
          <ZoomIn size={18} className="text-gray-600" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        {selectedAnnotationId && (
          <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <Trash2 size={16} /> 删除
          </button>
        )}
        <div className="flex-1" />
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange?.(currentPage - 1)} disabled={currentPage <= 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm">{currentPage} / {totalPages}</span>
            <button onClick={() => onPageChange?.(currentPage + 1)} disabled={currentPage >= totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 画布区域 */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {loadError && (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg">
            <p>图片加载错误: {loadError}</p>
            <p className="text-xs mt-2">imageUrl: {imageUrl?.substring(0, 100)}</p>
          </div>
        )}
        {renderError && (
          <div className="text-orange-500 p-4 bg-orange-50 rounded-lg">
            <p>渲染错误: {renderError}</p>
          </div>
        )}
        {imageLoaded ? (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full shadow-lg cursor-crosshair"
              style={{ maxHeight: '70vh' }}
              onClick={handleCanvasClick}
            />
          </div>
        ) : !loadError && (
          <div className="text-gray-400">图片加载中... {imageUrl ? 'loading' : 'no url'}</div>
        )}
      </div>

      {/* 新建标注表单 */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
            <h3 className="font-bold text-lg mb-4">新建标注</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">尺寸值</label>
                <input
                  type="text"
                  value={newForm.dimensionValue}
                  onChange={e => setNewForm(f => ({ ...f, dimensionValue: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="如: 50、Ø25"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标注类型</label>
                <select
                  value={newForm.annotationType}
                  onChange={e => setNewForm(f => ({ ...f, annotationType: Number(e.target.value) as AnnotationTypeId }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {ANNOTATION_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上限公差</label>
                  <input
                    type="text"
                    value={newForm.upperTolerance}
                    onChange={e => setNewForm(f => ({ ...f, upperTolerance: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+0.05"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">下限公差</label>
                  <input
                    type="text"
                    value={newForm.lowerTolerance}
                    onChange={e => setNewForm(f => ({ ...f, lowerTolerance: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="-0.05"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={newForm.note}
                  onChange={e => setNewForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="可选备注"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCancelAdd} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleConfirmAdd} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
