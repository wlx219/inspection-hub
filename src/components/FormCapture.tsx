import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { performOCR, OCRProgress } from '@/utils/ocr';
import { OCRResult, InspectionData } from '@/types';

interface FormCaptureProps {
  onImageCapture: (imageData: string) => void;
  onOCRComplete: (result: OCRResult, data: InspectionData[]) => void;
}

export function FormCapture({ onImageCapture, onOCRComplete }: FormCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    setError(null);

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onImageCapture(dataUrl);
    };
    reader.readAsDataURL(file);

    // 开始 OCR
    setIsProcessing(true);
    setOcrProgress({ status: '初始化...', progress: 0 });

    try {
      const result = await performOCR(file, (progress) => {
        setOcrProgress(progress);
      });

      // 提取检验数据
      const inspectionData: InspectionData[] = [];
      let rowNumber = 1;

      if (result.success && result.tables.length > 0) {
        const table = result.tables[0];
        // 跳过表头，从数据行开始
        for (let i = table.cells.length > 0 && table.headers.length > 0 ? 1 : 0; i < table.cells.length; i++) {
          const row = table.cells[i];
          if (row && row.length > 0) {
            const itemName = row[0]?.text || '';
            const value = row[1]?.text || '';

            if (itemName.trim()) {
              inspectionData.push({
                id: crypto.randomUUID(),
                formRecordId: '',
                rowNumber: rowNumber++,
                itemName: itemName.trim(),
                nominalValue: value.trim(),
              });
            }
          }
        }
      }

      onOCRComplete(result, inspectionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR处理失败');
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 上传区域 */}
      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
          onClick={handleCapture}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <Camera size={48} className="text-gray-400" />
            <div>
              <p className="text-gray-600 font-medium">
                点击拍照或选择图片
              </p>
              <p className="text-gray-400 text-sm mt-1">
                支持 JPG、PNG 格式
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden shadow-md">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-96 object-contain bg-gray-100"
          />

          {/* 处理状态 */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="text-lg font-medium">{ocrProgress?.status || '处理中...'}</p>
              {ocrProgress && (
                <div className="w-48 h-2 bg-gray-600 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${ocrProgress.progress * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 重新拍摄 */}
          {!isProcessing && (
            <button
              onClick={handleRetake}
              className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <Camera size={20} />
            </button>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 提示信息 */}
      <div className="text-sm text-gray-500 space-y-1">
        <p className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          确保图片清晰，光线充足
        </p>
        <p className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          表格线条完整，无遮挡
        </p>
        <p className="flex items-center gap-2">
          <XCircle size={16} className="text-red-500" />
          避免倾斜、模糊、反光的照片
        </p>
      </div>
    </div>
  );
}
