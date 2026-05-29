import React from 'react';
import { useAppStore } from '@/store';
import { AppMode } from '@/types';
import { FileImage, Camera } from 'lucide-react';

interface ModeSwitcherProps {
  className?: string;
}

export function ModeSwitcher({ className = '' }: ModeSwitcherProps) {
  const { mode, setMode } = useAppStore();

  const modes: { id: AppMode; label: string; icon: React.ReactNode }[] = [
    { id: 'drawing', label: '图纸标注', icon: <FileImage size={16} /> },
    { id: 'form', label: '表单识别', icon: <Camera size={16} /> },
  ];

  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {modes.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === id
              ? 'bg-white text-primary-500 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
