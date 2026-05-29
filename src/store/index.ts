import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Annotation, Drawing, FormRecord, InspectionData, AppMode,
  WorkflowStep, MeasuringTool, AnnotationFilter, HistoryEntry, AnnotationTypeId
} from '@/types';

interface AppState {
  // 模式
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // 工作流步骤
  workflowStep: WorkflowStep;
  setWorkflowStep: (step: WorkflowStep) => void;

  // 模式A：图纸
  currentDrawing: Drawing | null;
  selectedAnnotation: Annotation | null;
  setCurrentDrawing: (drawing: Drawing | null) => void;
  setSelectedAnnotation: (annotation: Annotation | null) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  reorderAnnotations: () => void;
  batchSetMeasuringTool: (toolId: string, typeIds?: AnnotationTypeId[]) => void;
  setAnnotationVisibility: (id: string, visible: boolean) => void;
  batchSetVisibility: (typeIds: AnnotationTypeId[], visible: boolean) => void;

  // 筛选
  annotationFilter: AnnotationFilter;
  setAnnotationFilter: (filter: Partial<AnnotationFilter>) => void;

  // 量检具库
  measuringTools: MeasuringTool[];
  addMeasuringTool: (tool: MeasuringTool) => void;
  updateMeasuringTool: (id: string, updates: Partial<MeasuringTool>) => void;
  deleteMeasuringTool: (id: string) => void;

  // 历史图纸库
  historyEntries: HistoryEntry[];
  addHistoryEntry: (entry: HistoryEntry) => void;
  deleteHistoryEntry: (id: string) => void;
  loadFromHistory: (id: string) => void;

  // 模式B：表单
  currentFormRecord: FormRecord | null;
  setCurrentFormRecord: (record: FormRecord | null) => void;
  addInspectionData: (data: InspectionData) => void;
  updateInspectionData: (id: string, updates: Partial<InspectionData>) => void;

  // 导出状态
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 模式
      mode: 'drawing',
      setMode: (mode) => set({ mode, workflowStep: 'upload', currentDrawing: null, currentFormRecord: null }),

      // 工作流
      workflowStep: 'upload',
      setWorkflowStep: (step) => set({ workflowStep: step }),

      // 图纸
      currentDrawing: null,
      selectedAnnotation: null,
      setCurrentDrawing: (drawing) => set({ currentDrawing: drawing, selectedAnnotation: null }),
      setSelectedAnnotation: (annotation) => set({ selectedAnnotation: annotation }),

      addAnnotation: (annotation) => {
        const { currentDrawing } = get();
        if (currentDrawing) {
          set({
            currentDrawing: {
              ...currentDrawing,
              annotations: [...currentDrawing.annotations, annotation],
            },
          });
        }
      },

      updateAnnotation: (id, updates) => {
        const { currentDrawing, selectedAnnotation } = get();
        if (currentDrawing) {
          const annotations = currentDrawing.annotations.map(a =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
          );
          set({
            currentDrawing: { ...currentDrawing, annotations },
            selectedAnnotation: selectedAnnotation?.id === id
              ? { ...selectedAnnotation, ...updates } as Annotation
              : selectedAnnotation,
          });
        }
      },

      deleteAnnotation: (id) => {
        const { currentDrawing, selectedAnnotation } = get();
        if (currentDrawing) {
          const annotations = currentDrawing.annotations.filter(a => a.id !== id);
          set({
            currentDrawing: { ...currentDrawing, annotations },
            selectedAnnotation: selectedAnnotation?.id === id ? null : selectedAnnotation,
          });
        }
      },

      // 重新编号（按添加顺序）
      reorderAnnotations: () => {
        const { currentDrawing } = get();
        if (currentDrawing) {
          const annotations = currentDrawing.annotations.map((a, i) => ({
            ...a,
            number: i + 1,
          }));
          set({ currentDrawing: { ...currentDrawing, annotations } });
        }
      },

      // 批量设置量检具
      batchSetMeasuringTool: (toolId, typeIds) => {
        const { currentDrawing } = get();
        if (currentDrawing) {
          const annotations = currentDrawing.annotations.map(a => {
            if (!typeIds || typeIds.length === 0 || typeIds.includes(a.annotationType)) {
              return { ...a, measuringTool: toolId };
            }
            return a;
          });
          set({ currentDrawing: { ...currentDrawing, annotations } });
        }
      },

      // 设置标注可见性
      setAnnotationVisibility: (id, visible) => {
        const { currentDrawing } = get();
        if (currentDrawing) {
          const annotations = currentDrawing.annotations.map(a =>
            a.id === id ? { ...a, visible } : a
          );
          set({ currentDrawing: { ...currentDrawing, annotations } });
        }
      },

      batchSetVisibility: (typeIds, visible) => {
        const { currentDrawing } = get();
        if (currentDrawing) {
          const annotations = currentDrawing.annotations.map(a =>
            typeIds.includes(a.annotationType) ? { ...a, visible } : a
          );
          set({ currentDrawing: { ...currentDrawing, annotations } });
        }
      },

      // 筛选
      annotationFilter: { types: [], measuringTools: [], showAll: true },
      setAnnotationFilter: (filter) => {
        const current = get().annotationFilter;
        set({ annotationFilter: { ...current, ...filter } });
      },

      // 量检具库
      measuringTools: [
        { id: 'tool-1', name: '游标卡尺', type: '长度', range: '0-150mm', precision: '0.02mm', color: '#378ADD' },
        { id: 'tool-2', name: '千分尺', type: '长度', range: '0-25mm', precision: '0.01mm', color: '#7F77DD' },
        { id: 'tool-3', name: '高度尺', type: '长度', range: '0-300mm', precision: '0.02mm', color: '#1D9E75' },
        { id: 'tool-4', name: '角度尺', type: '角度', range: '0-360°', precision: '2\'', color: '#639922' },
        { id: 'tool-5', name: '螺纹规', type: '螺纹', range: 'M3-M24', precision: '6g/6H', color: '#BA7517' },
        { id: 'tool-6', name: '粗糙度仪', type: '表面', range: 'Ra0.1-Ra25', precision: 'Ra', color: '#5B9BD5' },
      ],
      addMeasuringTool: (tool) => {
        const { measuringTools } = get();
        set({ measuringTools: [...measuringTools, tool] });
      },
      updateMeasuringTool: (id, updates) => {
        const { measuringTools } = get();
        set({ measuringTools: measuringTools.map(t => t.id === id ? { ...t, ...updates } : t) });
      },
      deleteMeasuringTool: (id) => {
        const { measuringTools } = get();
        set({ measuringTools: measuringTools.filter(t => t.id !== id) });
      },

      // 历史图纸库
      historyEntries: [],
      addHistoryEntry: (entry) => {
        const { historyEntries } = get();
        // 最多保存50条
        const updated = [entry, ...historyEntries.filter(e => e.id !== entry.id)].slice(0, 50);
        set({ historyEntries: updated });
      },
      deleteHistoryEntry: (id) => {
        const { historyEntries } = get();
        set({ historyEntries: historyEntries.filter(e => e.id !== id) });
      },
      loadFromHistory: (id) => {
        const { historyEntries } = get();
        const entry = historyEntries.find(e => e.id === id);
        if (entry) {
          set({
            currentDrawing: entry.data,
            selectedAnnotation: null,
            workflowStep: 'annotate',
          });
        }
      },

      // 模式B
      currentFormRecord: null,
      setCurrentFormRecord: (record) => set({ currentFormRecord: record }),
      addInspectionData: (data) => {
        const { currentFormRecord } = get();
        if (currentFormRecord) {
          set({
            currentFormRecord: {
              ...currentFormRecord,
              inspectionData: [...currentFormRecord.inspectionData, data],
            },
          });
        }
      },
      updateInspectionData: (id, updates) => {
        const { currentFormRecord } = get();
        if (currentFormRecord) {
          const inspectionData = currentFormRecord.inspectionData.map(d =>
            d.id === id ? { ...d, ...updates } : d
          );
          set({ currentFormRecord: { ...currentFormRecord, inspectionData } });
        }
      },

      // 导出
      isExporting: false,
      setIsExporting: (value) => set({ isExporting: value }),
    }),
    {
      name: 'inspection-hub-storage',
      partialize: (state) => ({
        // 只持久化这些字段，避免状态不一致
        mode: state.mode,
        measuringTools: state.measuringTools,
        historyEntries: state.historyEntries,
        // 不持久化 workflowStep 和 currentDrawing，避免刷新后状态混乱
      }),
    }
  )
);
