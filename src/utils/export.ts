import * as XLSX from 'xlsx';
import { Annotation, InspectionData, ANNOTATION_TYPES, getAnnotationName, AnnotationTypeId } from '@/types';

/**
 * 导出模式A：图纸标注数据为Excel FAI检测表
 */
export function exportAnnotationsToExcel(
  annotations: Annotation[],
  drawingName: string,
  filename?: string
): void {
  const wb = XLSX.utils.book_new();

  // === Sheet1: FAI检测表 ===
  const headerRow = ['序号', '气泡编号', '标注类型', '尺寸值', '上偏差', '下偏差', '量检具', '备注'];
  const dataRows = annotations.map((a, i) => [
    i + 1,
    a.number,
    getAnnotationName(a.annotationType as AnnotationTypeId),
    a.dimensionValue,
    a.upperTolerance || '',
    a.lowerTolerance || '',
    a.measuringTool || '',
    a.note || '',
  ]);

  // 标题行
  const titleRow = [`${drawingName} - FAI全尺寸检测表`];
  // 信息行
  const infoRow = ['检测日期', new Date().toLocaleDateString(), '', '检测员', '', '', '图号', ''];
  // 空行
  const emptyRow: string[] = [];

  const sheetData = [
    titleRow,
    emptyRow,
    infoRow,
    emptyRow,
    headerRow,
    ...dataRows,
    emptyRow,
    ['合计', '', annotations.length, '', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 合并标题行
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },  // 标题
  ];

  // 列宽
  ws['!cols'] = [
    { wch: 6 },   // 序号
    { wch: 10 },  // 编号
    { wch: 10 },  // 类型
    { wch: 15 },  // 尺寸值
    { wch: 10 },  // 上偏差
    { wch: 10 },  // 下偏差
    { wch: 15 },  // 量检具
    { wch: 20 },  // 备注
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'FAI检测表');

  // === Sheet2: 按类型汇总 ===
  const typeSummaryHeader = ['标注类型', '数量', '占比', '尺寸值列表'];
  const typeGroups: Record<string, Annotation[]> = {};
  annotations.forEach(a => {
    const name = getAnnotationName(a.annotationType as AnnotationTypeId);
    if (!typeGroups[name]) typeGroups[name] = [];
    typeGroups[name].push(a);
  });

  const typeSummaryRows = Object.entries(typeGroups).map(([name, items]) => [
    name,
    items.length,
    ((items.length / annotations.length) * 100).toFixed(1) + '%',
    items.map(i => i.dimensionValue || '?').join(', '),
  ]);

  const summaryData = [
    ['标注类型汇总'],
    [],
    typeSummaryHeader,
    ...typeSummaryRows,
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  ws2['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, '类型汇总');

  const fileName = filename || `${drawingName}_FAI检测表_${formatDate(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 导出模式B：检验数据为Excel
 */
export function exportInspectionDataToExcel(
  inspectionData: InspectionData[],
  formName: string,
  metadata?: {
    inspectionDate?: string;
    productBatch?: string;
    inspector?: string;
  },
  filename?: string
): void {
  const wb = XLSX.utils.book_new();

  const metaData = [
    ['检验记录表'],
    [],
    ['检验单名称', formName],
    ['检验日期', metadata?.inspectionDate || new Date().toLocaleDateString()],
    ['产品批次', metadata?.productBatch || ''],
    ['检验员', metadata?.inspector || ''],
    [],
  ];

  const header = ['序号', '项目名称', '要求值', '上偏差', '下偏差', '实测值', '判定', '备注'];
  const dataRows = inspectionData.map(d => [
    d.rowNumber,
    d.itemName,
    d.nominalValue,
    d.upperTolerance || '',
    d.lowerTolerance || '',
    d.measuredValue || '',
    d.isQualified === false ? '不合格 ✗' : d.isQualified === true ? '合格 ✓' : '',
    d.note || '',
  ]);

  const qualified = inspectionData.filter(d => d.isQualified === true).length;
  const unqualified = inspectionData.filter(d => d.isQualified === false).length;
  const total = inspectionData.length;
  const stats = [
    [],
    ['统计', '', '', '', '', '', `${qualified}/${total}`, `合格率 ${total > 0 ? ((qualified / total) * 100).toFixed(1) : 0}%`],
    ['', '', '', '', '', '', `不合格 ${unqualified}`, ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    ...metaData,
    header,
    ...dataRows,
    ...stats,
  ]);

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
  ws['!cols'] = [
    { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
    { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, '检验记录');
  const fileName = filename || `${formName}_检验记录_${formatDate(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 导出为PNG
 */
export function exportCanvasToPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}
