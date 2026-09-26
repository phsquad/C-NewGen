import React from 'react';

export type DockStyleValue = 'None' | 'Top' | 'Bottom' | 'Left' | 'Right' | 'Fill';

interface DockEditorProps {
  dock?: DockStyleValue;
  onChange: (dock: DockStyleValue) => void;
  disabled?: boolean;
}

export const DockEditor: React.FC<DockEditorProps> = ({
  dock = 'None',
  onChange,
  disabled = false,
}) => {
  const isSelected = (val: DockStyleValue) => dock === val;

  return (
    <div className="flex flex-col items-center p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-md">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-[11px] font-medium text-zinc-400">Dock Style</span>
        <span className="text-[10px] font-mono text-cyan-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
          {dock}
        </span>
      </div>

      {/* 6-Button Dock Grid Layout */}
      <div className="w-28 flex flex-col gap-1">
        {/* TOP */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(isSelected('Top') ? 'None' : 'Top')}
          className={`w-full py-1 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center cursor-pointer border ${
            isSelected('Top')
              ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
              : 'bg-zinc-850 hover:bg-zinc-750 border-zinc-700 text-zinc-400'
          }`}
        >
          TOP
        </button>

        {/* MIDDLE ROW (LEFT | FILL | RIGHT) */}
        <div className="flex gap-1 h-9">
          {/* LEFT */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(isSelected('Left') ? 'None' : 'Left')}
            className={`w-7 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center cursor-pointer border ${
              isSelected('Left')
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-zinc-850 hover:bg-zinc-750 border-zinc-700 text-zinc-400'
            }`}
          >
            <span className="[writing-mode:vertical-lr] rotate-180">LFT</span>
          </button>

          {/* FILL */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(isSelected('Fill') ? 'None' : 'Fill')}
            className={`flex-1 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center cursor-pointer border ${
              isSelected('Fill')
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300'
            }`}
          >
            FILL
          </button>

          {/* RIGHT */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(isSelected('Right') ? 'None' : 'Right')}
            className={`w-7 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center cursor-pointer border ${
              isSelected('Right')
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-zinc-850 hover:bg-zinc-750 border-zinc-700 text-zinc-400'
            }`}
          >
            <span className="[writing-mode:vertical-lr]">RGT</span>
          </button>
        </div>

        {/* BOTTOM */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(isSelected('Bottom') ? 'None' : 'Bottom')}
          className={`w-full py-1 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center cursor-pointer border ${
            isSelected('Bottom')
              ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
              : 'bg-zinc-850 hover:bg-zinc-750 border-zinc-700 text-zinc-400'
          }`}
        >
          BOTTOM
        </button>

        {/* NONE BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('None')}
          className={`w-full py-0.5 mt-1 rounded text-[9px] font-mono transition-all flex items-center justify-center cursor-pointer border ${
            isSelected('None')
              ? 'bg-zinc-700 border-zinc-500 text-zinc-100 font-semibold'
              : 'bg-zinc-950/60 hover:bg-zinc-800 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          (None / No Docking)
        </button>
      </div>
    </div>
  );
};
