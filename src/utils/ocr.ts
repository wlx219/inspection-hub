import Tesseract from 'tesseract.js';
import { OCRResult, TableData, CellData } from '@/types';

export interface OCRProgress {
  status: string;
  progress: number;
}

// OCR 服务类型
export type OCRProvider = 'tesseract' | 'aliyun' | 'tencent';

interface OCRConfig {
  provider: OCRProvider;
  // 阿里云配置
  aliyunAccessKeyId?: string;
  aliyunAccessKeySecret?: string;
  aliyunRegion?: string;
  // 腾讯云配置
  tencentSecretId?: string;
  tencentSecretKey?: string;
}

const config: OCRConfig = {
  provider: (import.meta.env.VITE_OCR_PROVIDER as OCRProvider) || 'tesseract',
  aliyunAccessKeyId: import.meta.env.VITE_ALIYUN_ACCESS_KEY_ID,
  aliyunAccessKeySecret: import.meta.env.VITE_ALIYUN_ACCESS_KEY_SECRET,
  aliyunRegion: import.meta.env.VITE_ALIYUN_REGION || 'cn-shanghai',
  tencentSecretId: import.meta.env.VITE_TENCENT_SECRET_ID,
  tencentSecretKey: import.meta.env.VITE_TENCENT_SECRET_KEY,
};

/**
 * 获取 OCR 提供者信息
 */
export function getOCRProvider(): { name: string; description: string; available: boolean } {
  switch (config.provider) {
    case 'aliyun':
      return {
        name: '阿里云 OCR',
        description: '高精度表格识别，适合复杂表单',
        available: !!(config.aliyunAccessKeyId && config.aliyunAccessKeySecret),
      };
    case 'tencent':
      return {
        name: '腾讯云 OCR',
        description: '高精度表格识别，适合复杂表单',
        available: !!(config.tencentSecretId && config.tencentSecretKey),
      };
    default:
      return {
        name: 'Tesseract.js (本地)',
        description: '无需配置，但精度较低',
        available: true,
      };
  }
}

/**
 * 执行 OCR 识别
 */
export async function performOCR(
  imageData: string | Blob | File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    switch (config.provider) {
      case 'aliyun':
        return await performAliyunOCR(imageData, onProgress);
      case 'tencent':
        return await performTencentOCR(imageData, onProgress);
      default:
        return await performTesseractOCR(imageData, onProgress, startTime);
    }
  } catch (error) {
    console.error('OCR Error, falling back to Tesseract:', error);
    return await performTesseractOCR(imageData, onProgress, startTime);
  }
}

/**
 * Tesseract.js 本地 OCR
 */
async function performTesseractOCR(
  imageData: string | Blob | File,
  onProgress?: (progress: OCRProgress) => void,
  startTime: number = Date.now()
): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      imageData,
      'eng+chi_sim',
      {
        logger: (m) => {
          if (onProgress && m.status) {
            onProgress({
              status: m.status,
              progress: m.progress || 0,
            });
          }
        },
      }
    );

    const processingTime = Date.now() - startTime;
    const tables = parseTables(result.data);

    return {
      success: true,
      tables,
      rawText: result.data.text,
      confidence: result.data.confidence,
      processingTime,
    };
  } catch (error) {
    return {
      success: false,
      tables: [],
      rawText: '',
      confidence: 0,
      processingTime: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : 'OCR识别失败'],
    };
  }
}

/**
 * 阿里云 OCR
 * 需要配置环境变量: VITE_ALIYUN_ACCESS_KEY_ID, VITE_ALIYUN_ACCESS_KEY_SECRET
 */
async function performAliyunOCR(
  imageData: string | Blob | File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  if (!config.aliyunAccessKeyId || !config.aliyunAccessKeySecret) {
    throw new Error('Aliyun OCR not configured');
  }

  onProgress?.({ status: '正在调用阿里云 OCR API...', progress: 0.3 });

  // 转换为 base64
  const base64 = await toBase64(imageData);

  onProgress?.({ status: '阿里云 OCR 识别中...', progress: 0.6 });

  // 阿里云表格识别 API
  const response = await fetch(
    `https://formrecognizer.cn-${config.aliyunRegion}.aliyuncs.com/api/v1.0/recognize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key-Id': config.aliyunAccessKeyId,
        'X-Access-Key-Secret': config.aliyunAccessKeySecret,
      },
      body: JSON.stringify({
        file: base64,
        scenario: 'form',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Aliyun OCR API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: true,
    tables: parseAliyunResult(data),
    rawText: '',
    confidence: data.confidence || 85,
    processingTime: Date.now() - Date.now(),
  };
}

/**
 * 腾讯云 OCR
 * 需要配置环境变量: VITE_TENCENT_SECRET_ID, VITE_TENCENT_SECRET_KEY
 */
async function performTencentOCR(
  imageData: string | Blob | File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  if (!config.tencentSecretId || !config.tencentSecretKey) {
    throw new Error('Tencent OCR not configured');
  }

  onProgress?.({ status: '正在调用腾讯云 OCR API...', progress: 0.3 });

  const base64 = await toBase64(imageData);

  onProgress?.({ status: '腾讯云 OCR 识别中...', progress: 0.6 });

  // 腾讯云表格识别 API
  const response = await fetch(
    'https://ocr.ap-shanghai.tencentcloudapi.com/api/v1.0/recognize/table',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key-Id': config.tencentSecretId,
        'X-Access-Key-Secret': config.tencentSecretKey,
      },
      body: JSON.stringify({
        file: base64,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Tencent OCR API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: true,
    tables: parseTencentResult(data),
    rawText: '',
    confidence: data.confidence || 85,
    processingTime: Date.now() - Date.now(),
  };
}

/**
 * 解析阿里云 OCR 结果
 */
function parseAliyunResult(data: any): TableData[] {
  const tables: TableData[] = [];

  if (data.forms && data.forms.length > 0) {
    const form = data.forms[0];
    const cells: CellData[][] = [];
    const headers: string[] = [];

    // 解析表格
    if (form.tables && form.tables.length > 0) {
      const table = form.tables[0];

      // 提取表头
      if (table.headers) {
        headers.push(...table.headers.map((h: any) => h.text || h));
      }

      // 提取数据行
      if (table.rows) {
        table.rows.forEach((row: any[], i: number) => {
          cells.push(
            row.map((cell: any, j: number) => ({
              text: cell.text || cell,
              row: i,
              col: j,
              rowSpan: 1,
              colSpan: 1,
              confidence: cell.confidence || 80,
            }))
          );
        });
      }
    }

    tables.push({
      rows: cells.length + (headers.length > 0 ? 1 : 0),
      cols: Math.max(headers.length, ...cells.map(r => r.length)),
      cells,
      headers,
    });
  }

  return tables;
}

/**
 * 解析腾讯云 OCR 结果
 */
function parseTencentResult(data: any): TableData[] {
  const tables: TableData[] = [];

  if (data.TableDetectionInfos && data.TableDetectionInfos.length > 0) {
    const tableInfo = data.TableDetectionInfos[0];
    const cells: CellData[][] = [];
    const headers: string[] = [];

    // 解析表格
    if (tableInfo.Cells) {
      tableInfo.Cells.forEach((row: any[], i: number) => {
        cells.push(
          row.map((cell: any, j: number) => ({
            text: cell.Text || cell,
            row: i,
            col: j,
            rowSpan: cell.RowSpan || 1,
            colSpan: cell.ColSpan || 1,
            confidence: cell.Confidence || 80,
          }))
        );
      });
    }

    tables.push({
      rows: cells.length,
      cols: cells.length > 0 ? cells[0].length : 0,
      cells,
      headers,
    });
  }

  return tables;
}

/**
 * 解析 OCR 结果中的表格（简化版本）
 */
function parseTables(data: Tesseract.Page): TableData[] {
  const tables: TableData[] = [];

  const lines = data.text.split('\n').filter(line => line.trim());

  if (lines.length > 0) {
    const cells: CellData[][] = [];
    const headers: string[] = [];

    if (lines.length > 1) {
      const headerRow = parseLineToCells(lines[0]);
      headers.push(...headerRow);

      for (let i = 1; i < lines.length; i++) {
        const row = parseLineToCells(lines[i]);
        if (row.length > 0) {
          cells.push(row.map((text, col) => ({
            text,
            row: i,
            col,
            rowSpan: 1,
            colSpan: 1,
            confidence: 80,
          })));
        }
      }
    }

    tables.push({
      rows: cells.length + (headers.length > 0 ? 1 : 0),
      cols: Math.max(headers.length, ...cells.map(r => r.length)),
      cells,
      headers,
    });
  }

  return tables;
}

/**
 * 将一行文本解析为单元格
 */
function parseLineToCells(line: string): string[] {
  const parts = line.split(/\s+|\t+/).filter(p => p.trim());

  if (parts.length === 1 && parts[0].length > 10) {
    const matches = parts[0].match(/[^\d.]+|\d+\.?\d*/g);
    return matches?.filter(m => m.trim()) || parts;
  }

  return parts;
}

/**
 * 转换为 Base64
 */
async function toBase64(data: string | Blob | File): Promise<string> {
  if (typeof data === 'string') {
    // 如果是 data URL，提取 base64 部分
    if (data.startsWith('data:')) {
      return data.split(',')[1];
    }
    return data;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(data);
  });
}

/**
 * 从 OCR 结果提取检验数据
 */
export function extractInspectionData(
  ocrResult: OCRResult,
  formRecordId: string
): { itemName: string; nominalValue: string; measuredValue?: string }[] {
  const data: { itemName: string; nominalValue: string; measuredValue?: string }[] = [];

  if (!ocrResult.success || ocrResult.tables.length === 0) {
    return data;
  }

  const table = ocrResult.tables[0];

  for (let i = 0; i < table.cells.length; i++) {
    const row = table.cells[i];
    if (row.length >= 2) {
      const itemName = row[0]?.text || '';
      const value = row[1]?.text || '';

      if (itemName.trim() && value.trim()) {
        data.push({
          itemName: cleanText(itemName),
          nominalValue: cleanText(value),
        });
      }
    }
  }

  return data;
}

function cleanText(text: string): string {
  return text.replace(/[^\w\u4e00-\u9fa5.,:;<>+\-()（）【】\[\]]/g, '').trim();
}
