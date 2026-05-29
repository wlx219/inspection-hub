import React, { useState } from 'react';
import { Annotation, ANNOTATION_TYPES, getAnnotationColor, getAnnotationName, AnnotationTypeId } from '@/types';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface AnnotationListProps {
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (annotation: Annotation | null) => void;
  onDelete: (id: string) => void;
}

export function AnnotationList({ annotations, selectedId, onSelect, onDelete }: AnnotationListProps) {
  const [groupByType, setGroupByType] = useState(true);

  // 按类型分组
  const grouped = annotations.reduce<Record<number, Annotation[]>>((acc, ann) => {
    const type = ann.annotationType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(ann);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 标题 & 切换 */}
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{annotations.length} 个标注</span>
        <button
          onClick={() => setGroupByType(!groupByType)}
          className={`text-xs px-2 py-0.5 rounded ${groupByType ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
        >
          {groupByType ? '按类型' : '按序号'}
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {groupByType ? (
          Object.entries(grouped).map(([typeId, items]) => {
            const type = ANNOTATION_TYPES.find(t => t.id === Number(typeId));
            if (!type) return null;
            return (
              <div key={typeId}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border-b sticky top-0 z-10">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-xs font-medium text-gray-700">{type.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{items.length}</span>
                </div>
                {items.map(ann => (
                  <AnnotationItem
                    key={ann.id}
                    annotation={ann}
                    isSelected={ann.id === selectedId}
                    onSelect={() => onSelect(ann)}
                    onDelete={() => onDelete(ann.id)}
                  />
                ))}
              </div>
            );
          })
        ) : (
          annotations.map(ann => (
            <AnnotationItem
              key={ann.id}
              annotation={ann}
              isSelected={ann.id === selectedId}
              onSelect={() => onSelect(ann)}
              onDelete={() => onDelete(ann.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AnnotationItem({
  annotation,
  isSelected,
  onSelect,
  onDelete,
}: {
  annotation: Annotation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const type = ANNOTATION_TYPES.find(t => t.id === annotation.annotationType);
  const color = type?.color || '#BFBFBF';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer border-b border-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      {/* 编号气泡 */}
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {annotation.number}
      </span>

      {/* 尺寸值 */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-800 truncate">
          {annotation.dimensionValue || '(未填写)'}
        </div>
        <div className="text-[10px] text-gray-400 truncate">
          {getAnnotationName(annotation.annotationType as AnnotationTypeId)}
          {annotation.upperTolerance || annotation.lowerTolerance ? ` · ${annotation.upperTolerance || ''}/${annotation.lowerTolerance || ''}` : ''}
          {annotation.measuringTool ? ` · ${annotation.measuringTool}` : ''}
        </div>
      </div>

      {/* 删除 */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
