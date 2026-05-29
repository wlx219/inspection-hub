import React from 'react';
import { InspectionData } from '@/types';
import { CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

interface InspectionDataTableProps {
  data: InspectionData[];
  onUpdate: (id: string, updates: Partial<InspectionData>) => void;
  onDelete: (id: string) => void;
}

export function InspectionDataTable({
  data,
  onUpdate,
  onDelete,
}: InspectionDataTableProps) {
  // 计算统计数据
  const total = data.length;
  const qualified = data.filter(d => d.isQualified === true).length;
  const unqualified = data.filter(d => d.isQualified === false).length;
  const pending = data.filter(d => d.isQualified === undefined).length;
  const qualificationRate = total > 0 ? ((qualified / total) * 100).toFixed(1) : '0.0';

  // 判定结果
  const checkQualified = (item: InspectionData): boolean | undefined => {
    if (!item.measuredValue || !item.nominalValue) return undefined;

    const measured = parseFloat(item.measuredValue);
    const nominal = parseFloat(item.nominalValue);
    if (isNaN(measured) || isNaN(nominal)) return undefined;

    const upper = item.upperTolerance ? parseFloat(item.upperTolerance) : Infinity;
    const lower = item.lowerTolerance ? parseFloat(item.lowerTolerance) : -Infinity;

    if (isNaN(upper) || isNaN(lower)) return undefined;

    return measured >= nominal + lower && measured <= nominal + upper;
  };

  // 批量判定
  const handleBatchCheck = () => {
    data.forEach(item => {
      if (item.measuredValue) {
        const result = checkQualified(item);
        if (result !== undefined) {
          onUpdate(item.id, {
            isQualified: result,
            isOverTolerance: !result,
          });
        }
      }
    });
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>暂无检验数据</p>
        <p className="text-sm mt-1">上传表单图片进行OCR识别</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500">总计</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{qualified}</p>
          <p className="text-xs text-gray-500">合格</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{unqualified}</p>
          <p className="text-xs text-gray-500">不合格</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{qualificationRate}%</p>
          <p className="text-xs text-gray-500">合格率</p>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="px-4 py-2 border-b flex justify-between items-center">
        <span className="text-sm text-gray-600">
          共 {data.length} 项
        </span>
        <button
          onClick={handleBatchCheck}
          className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
        >
          批量判定
        </button>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 w-12">序号</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">项目名称</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">要求值</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">上偏差</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">下偏差</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">实测值</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">判定</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 w-16">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr
                key={item.id}
                className={`
                  hover:bg-gray-50
                  ${item.isQualified === false ? 'bg-red-50' : ''}
                  ${item.isQualified === true ? 'bg-green-50' : ''}
                `}
              >
                <td className="px-3 py-2 text-gray-500">{item.rowNumber}</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) => onUpdate(item.id, { itemName: e.target.value })}
                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.nominalValue}
                    onChange={(e) => onUpdate(item.id, { nominalValue: e.target.value })}
                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.upperTolerance || ''}
                    onChange={(e) => onUpdate(item.id, { upperTolerance: e.target.value })}
                    placeholder="-"
                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.lowerTolerance || ''}
                    onChange={(e) => onUpdate(item.id, { lowerTolerance: e.target.value })}
                    placeholder="-"
                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.measuredValue || ''}
                    onChange={(e) => onUpdate(item.id, { measuredValue: e.target.value })}
                    placeholder="请输入"
                    className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  {item.isQualified === true && (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-xs">合格</span>
                    </span>
                  )}
                  {item.isQualified === false && (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <XCircle size={16} />
                      <span className="text-xs">不合格</span>
                    </span>
                  )}
                  {item.isQualified === undefined && (
                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <AlertCircle size={16} />
                      <span className="text-xs">待定</span>
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
