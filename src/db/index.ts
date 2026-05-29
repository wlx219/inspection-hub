import Dexie, { Table } from 'dexie';

// 数据库类型定义
export interface DBDrawing {
  id?: number;
  name: string;
  fileData: Blob;
  fileType: 'jpg' | 'png' | 'pdf';
  pageCount: number;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBAnnotation {
  id?: number;
  drawingId: number;
  number: number;
  positionX: number;
  positionY: number;
  dimensionValue: string;
  upperTolerance?: string;
  lowerTolerance?: string;
  annotationType: number;
  measuringTool?: string;
  note?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBFormRecord {
  id?: number;
  name: string;
  imageData: Blob;
  thumbnailData?: Blob;
  ocrText?: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
  inspectionDate?: Date;
  productBatch?: string;
  inspector?: string;
  createdAt: Date;
}

export interface DBInspectionData {
  id?: number;
  formRecordId: number;
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

class InspectionDB extends Dexie {
  drawings!: Table<DBDrawing>;
  annotations!: Table<DBAnnotation>;
  formRecords!: Table<DBFormRecord>;
  inspectionData!: Table<DBInspectionData>;

  constructor() {
    super('InspectionHubDB');
    this.version(1).stores({
      drawings: '++id, name, createdAt',
      annotations: '++id, drawingId, number',
      formRecords: '++id, name, status, createdAt',
      inspectionData: '++id, formRecordId, rowNumber',
    });
  }
}

export const db = new InspectionDB();

// 辅助函数：将 Blob 转换为 URL
export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

// 辅助函数：生成 UUID
export function generateId(): string {
  return crypto.randomUUID();
}
