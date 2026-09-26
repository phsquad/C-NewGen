import React from 'react';
import { Bold, Italic } from 'lucide-react';

interface FontEditorProps {
  fontFamily?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  onChangeFamily: (family: string) => void;
  onChangeSize: (size: number) => void;
  onChangeBold: (bold: boolean) => void;
  onChangeItalic?: (italic: boolean) => void;
}

const COMMON_FONTS = [
  'Segoe UI',
  'Tahoma',
  'Arial',
  'Consolas',
  'Inter',
  'Roboto',
  'Courier New',
  'MS Sans Serif',
  'Verdana',
  'Trebuchet MS',
  'Georgia',
  'Times New Roman',
];

export const FontEditor: React.FC<FontEditorProps> = ({
  fontFamily = 'Segoe UI',
  fontSize = 9,
  fontBold = false,
  fontItalic = false,
  onChangeFamily,
  onChangeSize,
  onChangeBold,
  onChangeItalic,
}) => {
  return (
    <div className="space-y-2 p-2 bg-zinc-950/60 border border-zinc-800 rounded-md">
      <div className="flex items-center justify-between">
        <label className="text-zinc-400 text-xs font-medium">Font</label>
        <span className="text-[10px] font-mono text-zinc-500">
          {fontFamily}, {fontSize}pt{fontBold ? ', Bold' : ''}{fontItalic ? ', Italic' : ''}
        </span>
      </div>

      {/* Font Family Select */}
      <div className="flex items-center gap-1.5">
        <select
          value={fontFamily}
          onChange={e => onChangeFamily(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:border-blue-500 focus:outline-hidden"
        >
          {COMMON_FONTS.map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Size and Style Buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500">Size:</span>
          <input
            type="number"
            min="6"
            max="72"
            step="0.5"
            value={fontSize}
            onChange={e => onChangeSize(Math.max(6, parseFloat(e.target.value) || 9))}
            className="w-14 bg-zinc-900 border border-zinc-700/80 rounded px-1.5 py-0.5 text-xs text-zinc-200 font-mono text-center focus:border-blue-500 focus:outline-hidden"
          />
          <span className="text-[10px] text-zinc-500">pt</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Bold Button [B] */}
          <button
            type="button"
            onClick={() => onChangeBold(!fontBold)}
            title="Полужирный (Bold)"
            className={`px-2 py-1 rounded text-xs font-bold transition-all border ${
              fontBold
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bold className="w-3 h-3" />
          </button>

          {/* Italic Button [I] */}
          {onChangeItalic && (
            <button
              type="button"
              onClick={() => onChangeItalic(!fontItalic)}
              title="Курсив (Italic)"
              className={`px-2 py-1 rounded text-xs font-bold transition-all border ${
                fontItalic
                  ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Italic className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Live Font Typography Preview */}
      <div
        className="p-1.5 bg-zinc-900/90 rounded border border-zinc-800 text-zinc-200 text-center truncate text-xs"
        style={{
          fontFamily,
          fontSize: `${Math.min(14, Math.max(9, fontSize))}px`,
          fontWeight: fontBold ? 'bold' : 'normal',
          fontStyle: fontItalic ? 'italic' : 'normal',
        }}
      >
        AaBbCc 123 Пример шрифта
      </div>
    </div>
  );
};
