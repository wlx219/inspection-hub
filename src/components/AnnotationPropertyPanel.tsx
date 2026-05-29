import React from 'react';
import { Annotation, ANNOTATION_TYPES, getAnnotationColor, getAnnotationName, AnnotationTypeId } from '@/types';
import { useAppStore } from '@/store';
import { X, Save } from 'lucide-react';

interface AnnotationPropertyPanelProps {
  annotation: Annotation | null;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
  onClose: () => void;
  isNew: boolean;
}

export function AnnotationPropertyPanel({ annotation, onUpdate, onClose, isNew }: AnnotationPropertyPanelProps) {
  const { measuringTools } = useAppStore();

  if (!annotation) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-400 mt-20">
          <div className="text-4xl mb-3">📌</div>
          <p className="text-sm">点击气泡查看属性</p>
          <p className="text-xs mt-1 text-gray-300">双击气泡编辑</p>
        </div>
      </div>
    );
  }

  const currentType = ANNOTATION_TYPES.find(t => t.id === annotation.annotationType);

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: getAnnotationColor(annotation.annotationType as AnnotationTypeId) }}
          >
            {annotation.number}
          </span>
          <span className="font-medium text-sm text-gray-800">标注 #{annotation.number}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded"><X size={16} /></button>
      </div>

      {/* 编辑表单 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 标注类型 */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">标注类型</label>
          <div className="grid grid-cols-3 gap-1">
            {ANNOTATION_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => onUpdate(annotation.id, { annotationType: type.id })}
                className={`px-1.5 py-1.5 rounded text-xs flex items-center gap-1 transition-all ${
                  annotation.annotationType === type.id
                    ? 'shadow-sm font-medium'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                style={annotation.annotationType === type.id ? { backgroundColor: type.color + '15', border: `1.5px solid ${type.color}`, color: type.color } : { border: '1.5px solid transparent' }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: type.color }} />
                <span className="truncate">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 尺寸值 */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">尺寸值</label>
          <input
            value={annotation.dimensionValue}
            onChange={e => onUpdate(annotation.id, { dimensionValue: e.target.value })}
            placeholder="如 50、Ø25H7、R10"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>

        {/* 公差 */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">公差</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                value={annotation.upperTolerance || ''}
                onChange={e => onUpdate(annotation.id, { upperTolerance: e.target.value })}
                placeholder="上偏差 +0.1"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <input
                value={annotation.lowerTolerance || ''}
                onChange={e => onUpdate(annotation.id, { lowerTolerance: e.target.value })}
                placeholder="下偏差 -0.05"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          {annotation.dimensionValue && (annotation.upperTolerance || annotation.lowerTolerance) && (
            <div className="mt-1.5 px-3 py-2 bg-blue-50 rounded-lg text-sm">
              <span className="text-gray-600">完整尺寸: </span>
              <span className="font-medium text-blue-700">
                {annotation.dimensionValue}
                {annotation.upperTolerance && <sup className="text-xs ml-0.5">{annotation.upperTolerance}</sup>}
                {annotation.lowerTolerance && <sub className="text-xs ml-0.5">{annotation.lowerTolerance}</sub>}
              </span>
            </div>
          )}
        </div>

        {/* 编号 */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">编号</label>
          <input
            type="number"
            value={annotation.number}
            onChange={e => onUpdate(annotation.id, { number: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 量检具 */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">量检具</label>
          <select
            value={annotation.measuringTool || ''}
            onChange={e => onUpdate(annotation.id, { measuringTool: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="">未指定</option>
            {measuringTools.map(tool => (
              <option key={tool.id} value={tool.name}>{tool.name} ({tool.range})</option>
            ))}
          </select>
        </div>

        {/* 备注 */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">备注</label>
          <textarea
            value={annotation.note || ''}
            onChange={e => onUpdate(annotation.id, { note: e.target.value })}
            placeholder="添加备注..."
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-200 resize-none"
          />
        </div>

        {/* 位置信息 */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>位置: ({(annotation.positionX * 100).toFixed(1)}%, {(annotation.positionY * 100).toFixed(1)}%)</span>
            <span>类型: {getAnnotationName(annotation.annotationType as AnnotationTypeId)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
