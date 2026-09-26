import React, { useState } from 'react';
import { Pipette, Palette } from 'lucide-react';

interface ColorPickerEditorProps {
  label: string;
  value?: string;
  onChange: (hex: string) => void;
  defaultColor?: string;
}

const SYSTEM_COLORS: { name: string; hex: string; desc: string }[] = [
  { name: 'Control', hex: '#F3F4F6', desc: 'SystemColors.Control' },
  { name: 'ControlDark', hex: '#9CA3AF', desc: 'SystemColors.ControlDark' },
  { name: 'Window', hex: '#FFFFFF', desc: 'SystemColors.Window' },
  { name: 'WindowText', hex: '#111827', desc: 'SystemColors.WindowText' },
  { name: 'Highlight', hex: '#2563EB', desc: 'SystemColors.Highlight' },
  { name: 'HighlightText', hex: '#FFFFFF', desc: 'SystemColors.HighlightText' },
  { name: 'Info', hex: '#FEF08A', desc: 'SystemColors.Info' },
  { name: 'ButtonFace', hex: '#E5E7EB', desc: 'SystemColors.ButtonFace' },
  { name: 'ActiveCaption', hex: '#3B82F6', desc: 'SystemColors.ActiveCaption' },
  { name: 'HotTrack', hex: '#1D4ED8', desc: 'SystemColors.HotTrack' },
  { name: 'GrayText', hex: '#6B7280', desc: 'SystemColors.GrayText' },
  { name: 'Transparent', hex: 'transparent', desc: 'Color.Transparent' },
];

const PALETTE_SWATCHES: string[] = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#1E293B', '#334155', '#475569', '#64748B',
  '#2563EB', '#1D4ED8', '#1E40AF', '#0D9488', '#059669',
];

export const ColorPickerEditor: React.FC<ColorPickerEditorProps> = ({
  label,
  value = '#FFFFFF',
  onChange,
  defaultColor = '#FFFFFF',
}) => {
  const [showPalette, setShowPalette] = useState(false);
  const currentColor = value || defaultColor;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-zinc-400 text-xs font-medium w-24 shrink-0">{label}</label>
        
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {/* Native Color Square */}
          <div className="relative flex items-center">
            <input
              type="color"
              value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#2563EB'}
              onChange={e => onChange(e.target.value)}
              className="w-6 h-6 rounded border border-zinc-700 cursor-pointer bg-transparent p-0 overflow-hidden"
              title="Открыть палитру"
            />
          </div>

          {/* Hex Text Input */}
          <input
            type="text"
            value={currentColor}
            placeholder="#HEX"
            onChange={e => onChange(e.target.value)}
            className="w-24 bg-zinc-900 border border-zinc-700/80 rounded px-1.5 py-1 text-xs text-zinc-200 font-mono focus:border-blue-500 focus:outline-hidden"
          />

          {/* System Colors Palette Toggle */}
          <button
            type="button"
            onClick={() => setShowPalette(!showPalette)}
            title="Системные цвета WinForms"
            className={`p-1 rounded border transition-colors ${
              showPalette
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded SystemColors & Swatch Palette */}
      {showPalette && (
        <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-md shadow-lg space-y-2 text-[10px]">
          <div>
            <span className="text-zinc-400 font-semibold mb-1 block">SystemColors (WinForms):</span>
            <div className="grid grid-cols-3 gap-1">
              {SYSTEM_COLORS.map(sys => (
                <button
                  key={sys.name}
                  type="button"
                  onClick={() => {
                    onChange(sys.hex);
                    setShowPalette(false);
                  }}
                  title={sys.desc}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 truncate text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-2xs border border-zinc-700 shrink-0"
                    style={{ backgroundColor: sys.hex }}
                  />
                  <span className="truncate">{sys.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold mb-1 block">Палитра:</span>
            <div className="flex flex-wrap gap-1">
              {PALETTE_SWATCHES.map(hex => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    onChange(hex);
                    setShowPalette(false);
                  }}
                  title={hex}
                  className="w-4 h-4 rounded-2xs border border-zinc-700 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
