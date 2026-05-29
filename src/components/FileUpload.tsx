import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, FileText, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File, dataUrl: string, pageCount: number) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,image/jpeg,image/png',
  maxSize = 10 * 1024 * 1024,
  disabled = false,
}: FileUploadProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [pageCount, setPageCount] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<{ file: File; dataUrl: string; pages: number } | null>(null);

  // 加载 PDF 的纯函数
  const loadPdfToImage = async (file: File): Promise<{ dataUrl: string; pageCount: number }> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const firstPage = await pdf.getPage(1);
    const scale = 1.5;
    const viewport = firstPage.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建画布');
    await firstPage.render({ canvasContext: ctx, viewport }).promise;
    return { dataUrl: canvas.toDataURL('image/png'), pageCount: numPages };
  };

  // 加载图片的纯函数
  const loadImageToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const processFile = useCallback(async (file: File) => {
    if (file.size > maxSize) {
      setErrorMsg(`文件超过 ${Math.round(maxSize / 1024 / 1024)}MB 限制`);
      setStatus('error');
      return;
    }
    setErrorMsg(null);
    setFileName(file.name);
    setStatus('processing');
    try {
      let result: { dataUrl: string; pageCount: number };
      if (file.type === 'application/pdf') {
        result = await loadPdfToImage(file);
      } else if (file.type.startsWith('image/')) {
        const dataUrl = await loadImageToDataUrl(file);
        result = { dataUrl, pageCount: 1 };
      } else {
        setErrorMsg('不支持的文件格式，请上传 JPG、PNG 或 PDF');
        setStatus('error');
        return;
      }
      setPreview(result.dataUrl);
      setPageCount(result.pageCount);
      pendingFileRef.current = { file, dataUrl: result.dataUrl, pages: result.pageCount };
      setStatus('done');
    } catch (err: any) {
      console.error('File process error:', err);
      setErrorMsg(`处理失败: ${err?.message || '未知错误'}`);
      setStatus('error');
    }
  }, [maxSize]);

  const handleConfirm = useCallback(() => {
    if (pendingFileRef.current) {
      onFileSelect(pendingFileRef.current.file, pendingFileRef.current.dataUrl, pendingFileRef.current.pages);
    }
  }, [onFileSelect]);

  const handleClear = useCallback(() => {
    setStatus('idle');
    setPreview(null);
    setFileName('');
    setPageCount(1);
    setErrorMsg(null);
    pendingFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // === 渲染状态 ===
  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 空闲状态：拖拽/点击区域 */}
      {status === 'idle' && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-700 font-semibold text-lg mb-2">点击选择文件</p>
          <p className="text-gray-400 text-sm">支持 JPG、PNG、PDF（最大 10MB）</p>
          <p className="text-gray-300 text-xs mt-2">也可直接拖拽文件到此处</p>
        </div>
      )}

      {/* 处理中状态 */}
      {status === 'processing' && (
        <div className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center bg-blue-50">
          <Loader2 size={48} className="mx-auto text-blue-500 animate-spin mb-4" />
          <p className="text-gray-700 font-semibold mb-1">正在处理 {fileName}...</p>
          <p className="text-gray-400 text-sm">请稍候</p>
        </div>
      )}

      {/* 完成状态：预览 + 确认按钮 */}
      {status === 'done' && preview && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
          <div className="flex items-start gap-4">
            <img src={preview} alt="预览" className="max-h-48 rounded-lg shadow-sm flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                <p className="font-medium text-gray-800 truncate">{fileName}</p>
              </div>
              {pageCount > 1 && (
                <p className="text-sm text-blue-600 font-medium">{pageCount} 页 PDF</p>
              )}
              <p className="text-xs text-gray-400 mt-1">预览已生成</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                >
                  开始标注
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
                >
                  重新选择
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {status === 'error' && (
        <div className="border-2 border-dashed border-red-300 rounded-xl p-6 text-center bg-red-50">
          <p className="text-red-600 font-medium mb-3">{errorMsg}</p>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            重新选择文件
          </button>
        </div>
      )}
    </div>
  );
}
