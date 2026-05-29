// 13种标注类型（对标BaboApp）
export const ANNOTATION_TYPES = [
  { id: 1, name: '线性尺寸', color: '#378ADD', example: '50、100', shortName: '线' },
  { id: 2, name: '直径', color: '#7F77DD', example: 'Ø25、Ø50H7', shortName: '径' },
  { id: 3, name: '半径', color: '#1D9E75', example: 'R10、R20', shortName: '半' },
  { id: 4, name: '角度', color: '#639922', example: '45°、90°', shortName: '角' },
  { id: 5, name: '螺纹', color: '#BA7517', example: 'M8、M10×1.5', shortName: '螺' },
  { id: 6, name: '几何公差', color: '#E24B4A', example: '⏥0.05、⊥0.1', shortName: '公' },
  { id: 7, name: '倒角', color: '#D4537E', example: 'C2、1×45°', shortName: '倒' },
  { id: 8, name: '厚度', color: '#D85A30', example: 't5、t10', shortName: '厚' },
  { id: 9, name: '弧长', color: '#888780', example: '⌒50', shortName: '弧' },
  { id: 10, name: '表面粗糙度', color: '#5B9BD5', example: 'Ra1.6、Ra3.2', shortName: '粗' },
  { id: 11, name: '锥度', color: '#9DC3E6', example: '1:10、1:20', shortName: '锥' },
  { id: 12, name: '参考尺寸', color: '#A9D18E', example: '(50)、(100)', shortName: '参' },
  { id: 13, name: '其他', color: '#BFBFBF', example: '文字说明', shortName: '他' },
] as const;

// 标注类型定义
export type AnnotationTypeId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

// 标注数据
export interface Annotation {
  id: string;
  drawingId: string;
  number: number;
  positionX: number;
  positionY: number;
  dimensionValue: string;
  upperTolerance?: string;
  lowerTolerance?: string;
  annotationType: AnnotationTypeId;
  measuringTool?: string;
  note?: string;
  color?: string;
  visible?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 图纸
export interface Drawing {
  id: string;
  name: string;
  filePath: string;
  fileType: 'jpg' | 'png' | 'pdf' | 'gif' | 'bmp' | 'webp';
  pageCount: number;
  width: number;
  height: number;
  annotations: Annotation[];
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 量检具
export interface MeasuringTool {
  id: string;
  name: string;
  type: string;
  range: string;
  precision: string;
  color?: string;
}

// 模式B：检验数据
export interface InspectionData {
  id: string;
  formRecordId: string;
  rowNumber: number;
  itemName: string;
  nominalValue: string;
  upperTolerance?: string;
  lowerTolerance?: string;
  measuredValue?: string;
  isQualified?: boolean;
  isOverTolerance?: boolean;
  note?: string;
}

// OCR结果
export interface OCRResult {
  success: boolean;
  tables: TableData[];
  rawText: string;
  confidence: number;
  processingTime: number;
  errors?: string[];
}

export interface TableData {
  rows: number;
  cols: number;
  cells: CellData[][];
  headers: string[];
}

export interface CellData {
  text: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  confidence: number;
}

// 表单记录
export interface FormRecord {
  id: string;
  name: string;
  thumbnailUrl?: string;
  ocrResult?: OCRResult;
  inspectionData: InspectionData[];
  status: 'pending' | 'processing' | 'processed' | 'error';
  inspectionDate?: Date;
  productBatch?: string;
  inspector?: string;
  createdAt: Date;
}

// 工作流步骤
export type WorkflowStep = 'upload' | 'extract' | 'annotate' | 'review' | 'export';

// 应用模式
export type AppMode = 'drawing' | 'form';

// 筛选器
export interface AnnotationFilter {
  types: AnnotationTypeId[];
  measuringTools: string[];
  showAll: boolean;
}

// 历史记录（简化）
export interface HistoryEntry {
  id: string;
  name: string;
  thumbnailUrl?: string;
  annotationCount: number;
  fileType: string;
  updatedAt: Date;
  data: Drawing;
}

// 工具函数
export function getAnnotationColor(typeId: AnnotationTypeId): string {
  const type = ANNOTATION_TYPES.find(t => t.id === typeId);
  return type?.color || '#BFBFBF';
}

export function getAnnotationName(typeId: AnnotationTypeId): string {
  const type = ANNOTATION_TYPES.find(t => t.id === typeId);
  return type?.name || '其他';
}

export function getAnnotationShortName(typeId: AnnotationTypeId): string {
  const type = ANNOTATION_TYPES.find(t => t.id === typeId);
  return type?.shortName || '他';
}
