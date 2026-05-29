import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { Annotation, OCRResult, InspectionData, ANNOTATION_TYPES, MeasuringTool } from '@/types';
import { generateId } from '@/db';
import { FileDown, FileImage, Settings2, History, Eye, EyeOff, ArrowRight, Upload, Camera, ChevronRight, ChevronLeft, Trash2, Plus, RotateCcw, ZoomIn, ZoomOut, X, Check, Filter, Wrench, BookOpen, Image } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { SimpleCanvas } from '@/components/SimpleCanvas';
import { FormCapture } from '@/components/FormCapture';
import { InspectionDataTable } from '@/components/InspectionDataTable';
import { exportAnnotationsToExcel, exportInspectionDataToExcel } from '@/utils/export';

// 工作流步骤指示器
function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            i < current ? 'bg-green-100 text-green-700' :
            i === current ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-400'
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              i < current ? 'bg-green-500 text-white' :
              i === current ? 'bg-blue-500 text-white' :
              'bg-gray-300 text-white'
            }`}>
              {i < current ? '✓' : i + 1}
            </span>
            {step}
          </div>
          {i < steps.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// 示例图纸
const DEMO_DRAWING_SVG = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="white"/>
  <rect x="100" y="50" width="600" height="500" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="400" cy="300" r="120" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="400" cy="300" r="60" fill="none" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <rect x="250" y="200" width="300" height="200" fill="none" stroke="#333" stroke-width="1.5"/>
  <line x1="100" y1="600" x2="100" y2="630" stroke="#333" stroke-width="1"/>
  <line x1="700" y1="600" x2="700" y2="630" stroke="#333" stroke-width="1"/>
  <line x1="100" y1="620" x2="700" y2="620" stroke="#333" stroke-width="1"/>
  <text x="400" y="640" text-anchor="middle" font-size="14" fill="#333">600</text>
  <text x="60" y="310" text-anchor="middle" font-size="12" fill="#333">D240</text>
  <text x="400" y="305" text-anchor="middle" font-size="12" fill="#666">D120 REF</text>
  <text x="820" y="310" text-anchor="middle" font-size="12" fill="#333">500</text>
</svg>`;
const DEMO_DRAWING_URL = "data:image/svg+xml;base64," + btoa(DEMO_DRAWING_SVG);

// 欢迎上传页
function WelcomePage({ onFileSelect }: { onFileSelect: (file: File, dataUrl: string, pageCount: number) => void }) {
  const { setMode, setWorkflowStep, setCurrentDrawing } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const loadDemo = useCallback(() => {
    const drawingId = crypto.randomUUID();
    setCurrentDrawing({
      id: drawingId,
      name: '示例图纸-法兰盘',
      filePath: DEMO_DRAWING_URL,
      fileType: 'png',
      pageCount: 1,
      width: 800,
      height: 600,
      annotations: [],
      thumbnailUrl: DEMO_DRAWING_URL,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setWorkflowStep('annotate');
  }, [setCurrentDrawing, setWorkflowStep]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      onFileSelect(file, '', 1);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-2xl w-full mx-4">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            🔒 本地处理，数据不上传服务器
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">InspectionHub</h1>
          <p className="text-gray-500">工程图纸气泡标注与质检报告生成工具</p>
        </div>

        {/* 模式选择 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setMode('drawing')}
            className="p-6 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all group"
          >
            <FileImage size={36} className="text-blue-500 mb-3 mx-auto" />
            <h3 className="font-bold text-gray-900 mb-1">图纸气泡标注</h3>
            <p className="text-sm text-gray-500">上传图纸 → 添加气泡 → 导出报告</p>
          </button>
          <button
            onClick={() => setMode('form')}
            className="p-6 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all group"
          >
            <Camera size={36} className="text-purple-500 mb-3 mx-auto" />
            <h3 className="font-bold text-gray-900 mb-1">表单拍照识别</h3>
            <p className="text-sm text-gray-500">拍照表单 → OCR识别 → 数据分析</p>
          </button>
        </div>

        {/* 上传区域（图纸模式显示） */}
        <div className={`${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'} border-2 border-dashed rounded-xl p-8 text-center transition-all`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileUpload onFileSelect={onFileSelect} disabled={false} />
          <button
            onClick={loadDemo}
            className="mt-4 px-6 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
          >
            📄 或试试示例图纸
          </button>
        </div>

        {/* 历史记录入口 */}
        <HistoryDrawer />
      </div>
    </div>
  );
}

// 历史图纸库
function HistoryDrawer() {
  const { historyEntries, deleteHistoryEntry, loadFromHistory } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  if (historyEntries.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <History size={16} />
          历史图纸库 ({historyEntries.length})
        </span>
        <ChevronRight size={16} className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-2 bg-white rounded-lg border max-h-60 overflow-y-auto">
          {historyEntries.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 border-b last:border-b-0">
              {entry.thumbnailUrl ? (
                <img src={entry.thumbnailUrl} alt="" className="w-10 h-10 object-cover rounded border" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <Image size={16} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{entry.name}</div>
                <div className="text-xs text-gray-400">{entry.annotationCount} 个标注 · {entry.fileType.toUpperCase()}</div>
              </div>
              <button
                onClick={() => loadFromHistory(entry.id)}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                打开
              </button>
              <button
                onClick={() => deleteHistoryEntry(entry.id)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 筛选面板
function FilterPanel() {
  const { currentDrawing, annotationFilter, setAnnotationFilter, batchSetVisibility } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentDrawing) return null;

  const usedTypes = [...new Set(currentDrawing.annotations.map(a => a.annotationType))];
  const usedTools = [...new Set(currentDrawing.annotations.map(a => a.measuringTool).filter(Boolean))];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          !annotationFilter.showAll ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Filter size={14} />
        筛选
        {!annotationFilter.showAll && (
          <span className="w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {annotationFilter.types.length || annotationFilter.measuringTools.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border z-50 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">按类型筛选</span>
            <button
              onClick={() => {
                setAnnotationFilter({ types: [], measuringTools: [], showAll: true });
                batchSetVisibility(usedTypes, true);
              }}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              全部显示
            </button>
          </div>
          <div className="space-y-1 mb-4">
            {usedTypes.map(typeId => {
              const type = ANNOTATION_TYPES.find(t => t.id === typeId);
              if (!type) return null;
              const count = currentDrawing.annotations.filter(a => a.annotationType === typeId).length;
              const isActive = annotationFilter.showAll || annotationFilter.types.includes(typeId);
              return (
                <button
                  key={typeId}
                  onClick={() => {
                    const newTypes = isActive && !annotationFilter.showAll
                      ? annotationFilter.types.filter(t => t !== typeId)
                      : [...new Set([...annotationFilter.types, typeId])];
                    setAnnotationFilter({ types: newTypes, showAll: false });
                    batchSetVisibility([typeId], !isActive);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    isActive ? 'bg-gray-50' : 'opacity-40'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="flex-1 text-left">{type.name}</span>
                  <span className="text-gray-400 text-xs">{count}</span>
                </button>
              );
            })}
          </div>
          {usedTools.length > 0 && (
            <>
              <div className="border-t pt-3 mb-2">
                <span className="text-sm font-medium text-gray-700">按量检具筛选</span>
              </div>
              <div className="space-y-1">
                {usedTools.map(toolId => {
                  const count = currentDrawing.annotations.filter(a => a.measuringTool === toolId).length;
                  const isActive = annotationFilter.showAll || annotationFilter.measuringTools.includes(toolId as string);
                  return (
                    <button
                      key={toolId}
                      onClick={() => {
                        const newTools = isActive && !annotationFilter.showAll
                          ? annotationFilter.measuringTools.filter(t => t !== toolId)
                          : [...new Set([...annotationFilter.measuringTools, toolId as string])];
                        setAnnotationFilter({ measuringTools: newTools, showAll: false });
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        isActive ? 'bg-gray-50' : 'opacity-40'
                      }`}
                    >
                      <Wrench size={12} className="text-gray-400" />
                      <span className="flex-1 text-left text-xs">{toolId}</span>
                      <span className="text-gray-400 text-xs">{count}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 量检具管理弹窗
function MeasuringToolDialog({ onClose }: { onClose: () => void }) {
  const { measuringTools, addMeasuringTool, updateMeasuringTool, deleteMeasuringTool, currentDrawing, batchSetMeasuringTool } = useAppStore();
  const [newTool, setNewTool] = useState({ name: '', type: '', range: '', precision: '' });
  const [batchTool, setBatchTool] = useState('');
  const [batchTypes, setBatchTypes] = useState<number[]>([]);
  const [tab, setTab] = useState<'manage' | 'batch'>('manage');

  const handleAddTool = () => {
    if (!newTool.name) return;
    addMeasuringTool({
      id: `tool-${Date.now()}`,
      name: newTool.name,
      type: newTool.type,
      range: newTool.range,
      precision: newTool.precision,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    });
    setNewTool({ name: '', type: '', range: '', precision: '' });
  };

  const handleBatchApply = () => {
    if (!batchTool) return;
    batchSetMeasuringTool(batchTool, batchTypes.length > 0 ? batchTypes as any : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900">量检具管理</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          <button
            onClick={() => setTab('manage')}
            className={`flex-1 py-2.5 text-sm font-medium ${tab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            量检具库
          </button>
          <button
            onClick={() => setTab('batch')}
            className={`flex-1 py-2.5 text-sm font-medium ${tab === 'batch' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            批量关联
          </button>
        </div>

        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {tab === 'manage' ? (
            <>
              {/* 已有量检具 */}
              <div className="space-y-2 mb-4">
                {measuringTools.map(tool => (
                  <div key={tool.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tool.color }} />
                    <span className="text-sm font-medium flex-1">{tool.name}</span>
                    <span className="text-xs text-gray-400">{tool.type} · {tool.range}</span>
                    <button onClick={() => deleteMeasuringTool(tool.id)} className="p-1 text-gray-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {/* 添加新量检具 */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">添加量检具</div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={newTool.name} onChange={e => setNewTool({ ...newTool, name: e.target.value })} placeholder="名称" className="px-3 py-1.5 border rounded-lg text-sm" />
                  <input value={newTool.type} onChange={e => setNewTool({ ...newTool, type: e.target.value })} placeholder="类型（长度/角度/...）" className="px-3 py-1.5 border rounded-lg text-sm" />
                  <input value={newTool.range} onChange={e => setNewTool({ ...newTool, range: e.target.value })} placeholder="量程" className="px-3 py-1.5 border rounded-lg text-sm" />
                  <input value={newTool.precision} onChange={e => setNewTool({ ...newTool, precision: e.target.value })} placeholder="精度" className="px-3 py-1.5 border rounded-lg text-sm" />
                </div>
                <button onClick={handleAddTool} className="mt-2 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                  添加
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">选择量检具</div>
                <select value={batchTool} onChange={e => setBatchTool(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">请选择</option>
                  {measuringTools.map(t => <option key={t.id} value={t.name}>{t.name} ({t.type})</option>)}
                </select>
              </div>
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">应用到标注类型（不选则应用到全部）</div>
                <div className="flex flex-wrap gap-2">
                  {ANNOTATION_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setBatchTypes(prev =>
                        prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                      )}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                        batchTypes.includes(type.id) ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleBatchApply} disabled={!batchTool} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50">
                批量应用
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 主页面
export function HomePage() {
  const {
    mode, setMode,
    workflowStep, setWorkflowStep,
    currentDrawing,
    selectedAnnotation,
    setCurrentDrawing,
    setSelectedAnnotation,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    reorderAnnotations,
    currentFormRecord,
    setCurrentFormRecord,
    addInspectionData,
    updateInspectionData,
    isExporting,
    setIsExporting,
    addHistoryEntry,
  } = useAppStore();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showToolDialog, setShowToolDialog] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 处理文件选择
  const handleFileSelect = useCallback((file: File, dataUrl: string, pageCount: number) => {
    const drawingId = crypto.randomUUID();
    setCurrentDrawing({
      id: drawingId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      filePath: dataUrl,
      fileType: file.type.includes('pdf') ? 'pdf' : (file.type.includes('png') ? 'png' : 'jpg'),
      pageCount,
      width: 0,
      height: 0,
      annotations: [],
      thumbnailUrl: dataUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setWorkflowStep('annotate');
  }, [setCurrentDrawing, setWorkflowStep]);

  // 未上传图纸时显示欢迎页
  if (workflowStep === 'upload' && !currentDrawing) {
    return <WelcomePage onFileSelect={handleFileSelect} />;
  }

  // 添加标注
  const handleAnnotationAdd = useCallback((annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: generateId(),
      drawingId: currentDrawing?.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addAnnotation(newAnnotation);
    setSelectedAnnotation(newAnnotation);
  }, [currentDrawing, addAnnotation, setSelectedAnnotation]);

  // 更新标注
  const handleAnnotationUpdate = useCallback((id: string, updates: Partial<Annotation>) => {
    updateAnnotation(id, updates);
  }, [updateAnnotation]);

  // 删除标注
  const handleAnnotationDelete = useCallback((id: string) => {
    deleteAnnotation(id);
    if (selectedAnnotation?.id === id) {
      setSelectedAnnotation(null);
    }
  }, [deleteAnnotation, selectedAnnotation, setSelectedAnnotation]);

  // 导出Excel
  const handleExportDrawingExcel = useCallback(() => {
    if (!currentDrawing || currentDrawing.annotations.length === 0) return;
    setIsExporting(true);
    try { exportAnnotationsToExcel(currentDrawing.annotations, currentDrawing.name); }
    finally { setIsExporting(false); }
    // 保存到历史
    addHistoryEntry({
      id: currentDrawing.id,
      name: currentDrawing.name,
      thumbnailUrl: currentDrawing.thumbnailUrl,
      annotationCount: currentDrawing.annotations.length,
      fileType: currentDrawing.fileType,
      updatedAt: new Date(),
      data: currentDrawing,
    });
  }, [currentDrawing, setIsExporting, addHistoryEntry]);

  // 导出PNG
  const handleExportPNG = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${currentDrawing?.name || '标注图'}_${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, [currentDrawing]);

  // 模式B
  const handleImageCapture = useCallback((imageData: string) => { setImageUrl(imageData); }, []);
  const handleOCRComplete = useCallback((result: OCRResult, data: InspectionData[]) => {
    setCurrentFormRecord({
      id: generateId(),
      name: '检验单',
      thumbnailUrl: imageUrl || undefined,
      ocrResult: result,
      inspectionData: data,
      status: 'processed',
      createdAt: new Date(),
    });
    data.forEach(item => addInspectionData({ ...item, id: generateId(), formRecordId: '' }));
  }, [imageUrl, setCurrentFormRecord, addInspectionData]);

  const handleInspectionDataUpdate = useCallback((id: string, updates: Partial<InspectionData>) => { updateInspectionData(id, updates); }, [updateInspectionData]);
  const handleInspectionDataDelete = useCallback((id: string) => {}, []);

  const handleExportFormExcel = useCallback(() => {
    if (!currentFormRecord || currentFormRecord.inspectionData.length === 0) return;
    setIsExporting(true);
    try {
      exportInspectionDataToExcel(
        currentFormRecord.inspectionData,
        currentFormRecord.name,
        { inspectionDate: currentFormRecord.inspectionDate?.toLocaleDateString() }
      );
    } finally { setIsExporting(false); }
  }, [currentFormRecord, setIsExporting]);

  // 新建图纸
  const handleNewDrawing = useCallback(() => {
    setCurrentDrawing(null);
    setSelectedAnnotation(null);
    setImageUrl(null);
    setWorkflowStep('upload');
  }, [setCurrentDrawing, setSelectedAnnotation, setWorkflowStep]);

  const steps = mode === 'drawing'
    ? ['上传图纸', '提取尺寸', '生成气泡', '核对修改', '导出报告']
    : ['拍照上传', 'AI识别', '数据校验', '分析导出'];

  const currentStep = mode === 'drawing'
    ? (workflowStep === 'upload' ? 0 : workflowStep === 'extract' ? 1 : workflowStep === 'annotate' ? 2 : workflowStep === 'review' ? 3 : 4)
    : (currentFormRecord ? 3 : 0);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <header className="h-12 bg-white border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={handleNewDrawing} className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors">
            <RotateCcw size={16} />
            <span className="font-bold text-sm">InspectionHub</span>
          </button>
          <StepIndicator current={currentStep} steps={steps} />
        </div>
        <div className="flex items-center gap-2">
          {mode === 'drawing' && currentDrawing && (
            <>
              <FilterPanel />
              <button
                onClick={() => setShowToolDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Wrench size={14} />
                量检具
              </button>
              <button
                onClick={() => reorderAnnotations()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="按顺序重新编号"
              >
                重新编号
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting || currentDrawing.annotations.length === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <FileDown size={14} />
                  导出
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border z-50 py-1">
                    <button onClick={() => { handleExportDrawingExcel(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Excel 检测表</button>
                    <button onClick={() => { handleExportPNG(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">PNG 标注图</button>
                  </div>
                )}
              </div>
            </>
          )}
          {mode === 'form' && currentFormRecord && (
            <button
              onClick={handleExportFormExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <FileDown size={14} />
              导出Excel
            </button>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 flex overflow-hidden">
        {mode === 'drawing' ? (
          <>
            {/* 左侧面板 */}
            <aside className="w-64 bg-white border-r flex flex-col">
              {currentDrawing ? (
                <>
                  <div className="p-3 border-b">
                    <div className="text-sm font-medium text-gray-800 truncate">{currentDrawing.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{currentDrawing.annotations.length} 个标注 · {currentDrawing.fileType.toUpperCase()}</div>
                  </div>
                  {/* 标注列表暂时隐藏
                  <AnnotationList
                    annotations={currentDrawing.annotations}
                    selectedId={selectedAnnotation?.id || null}
                    onSelect={setSelectedAnnotation}
                    onDelete={handleAnnotationDelete}
                  />
                  */}
                </>
              ) : (
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 mb-3">上传图纸</h3>
                  <FileUpload onFileSelect={handleFileSelect} disabled={false} />
                </div>
              )}
            </aside>

            {/* 中央画布 */}
            <div className="flex-1 flex flex-col">
              {currentDrawing?.filePath ? (
                <SimpleCanvas
                  imageUrl={currentDrawing.filePath}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Plus size={48} className="mx-auto mb-4 opacity-50" />
                    <p>请在左侧上传图纸</p>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧属性面板 */}
            <aside className="w-80 bg-white border-l overflow-y-auto">
              {/* 属性面板暂时隐藏
              <AnnotationPropertyPanel
                annotation={selectedAnnotation}
                onUpdate={handleAnnotationUpdate}
                onClose={() => setSelectedAnnotation(null)}
                isNew={false}
              />
              */}
              <div className="p-4 text-gray-400">
                <p>右侧属性面板已隐藏</p>
              </div>
            </aside>
          </>
        ) : (
          <>
            {/* 模式B */}
            <aside className="w-96 bg-white border-r flex flex-col">
              <div className="p-4 border-b"><h3 className="font-medium text-gray-800">表单采集</h3></div>
              <div className="flex-1 overflow-auto p-4">
                <FormCapture onImageCapture={handleImageCapture} onOCRComplete={handleOCRComplete} />
              </div>
            </aside>
            <div className="flex-1 flex flex-col">
              <div className="p-3 bg-white border-b flex items-center justify-between">
                <h3 className="font-medium text-gray-800 text-sm">检验数据</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                {currentFormRecord ? (
                  <InspectionDataTable data={currentFormRecord.inspectionData} onUpdate={handleInspectionDataUpdate} onDelete={handleInspectionDataDelete} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center"><p>上传表单图片进行OCR识别</p></div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* 量检具弹窗 */}
      {showToolDialog && <MeasuringToolDialog onClose={() => setShowToolDialog(false)} />}
    </div>
  );
}
