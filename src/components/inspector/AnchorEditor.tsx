import React from 'react';

interface AnchorEditorProps {
  anchor?: ('Top' | 'Bottom' | 'Left' | 'Right')[];
  onChange: (anchors: ('Top' | 'Bottom' | 'Left' | 'Right')[]) => void;
  disabled?: boolean;
}

export const AnchorEditor: React.FC<AnchorEditorProps> = ({
  anchor = ['Top', 'Left'],
  onChange,
  disabled = false,
}) => {
  const current = anchor || ['Top', 'Left'];

  const toggle = (side: 'Top' | 'Bottom' | 'Left' | 'Right') => {
    if (disabled) return;
    let updated: ('Top' | 'Bottom' | 'Left' | 'Right')[];
    if (current.includes(side)) {
      updated = current.filter(s => s !== side);
    } else {
      updated = [...current, side];
    }
    onChange(updated);
  };

  const isTop = current.includes('Top');
  const isBottom = current.includes('Bottom');
  const isLeft = current.includes('Left');
  const isRight = current.includes('Right');

  return (
    <div className="flex flex-col items-center p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-md">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-[11px] font-medium text-zinc-400">Anchor Styles</span>
        <span className="text-[10px] font-mono text-cyan-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
          {current.length > 0 ? current.join(', ') : 'None'}
        </span>
      </div>

      {/* Visual 4-way Cross Widget */}
      <div className="relative w-28 h-28 border-2 border-dashed border-zinc-700/80 rounded-md bg-zinc-900/90 flex items-center justify-center p-2 shadow-inner">
        {/* TOP BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggle('Top')}
          title={`Top: ${isTop ? 'ВКЛ' : 'ВЫКЛ'}`}
          className={`absolute top-1 left-1/2 -translate-x-1/2 w-10 h-3.5 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center shadow-xs cursor-pointer ${
            isTop
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500 border border-zinc-700'
          }`}
        >
          TOP
        </button>

        {/* BOTTOM BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggle('Bottom')}
          title={`Bottom: ${isBottom ? 'ВКЛ' : 'ВЫКЛ'}`}
          className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-3.5 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center shadow-xs cursor-pointer ${
            isBottom
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500 border border-zinc-700'
          }`}
        >
          BTM
        </button>

        {/* LEFT BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggle('Left')}
          title={`Left: ${isLeft ? 'ВКЛ' : 'ВЫКЛ'}`}
          className={`absolute left-1 top-1/2 -translate-y-1/2 h-10 w-4 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center shadow-xs cursor-pointer ${
            isLeft
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500 border border-zinc-700'
          }`}
        >
          <span className="[writing-mode:vertical-lr] rotate-180">LFT</span>
        </button>

        {/* RIGHT BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggle('Right')}
          title={`Right: ${isRight ? 'ВКЛ' : 'ВЫКЛ'}`}
          className={`absolute right-1 top-1/2 -translate-y-1/2 h-10 w-4 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center shadow-xs cursor-pointer ${
            isRight
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500 border border-zinc-700'
          }`}
        >
          <span className="[writing-mode:vertical-lr]">RGT</span>
        </button>

        {/* Center Control Box */}
        <div className="w-10 h-10 border border-zinc-600 bg-zinc-800 rounded flex flex-col items-center justify-center text-[9px] font-mono text-zinc-300 pointer-events-none shadow-sm">
          <span className="text-zinc-400 font-bold">✛</span>
          <span className="text-[8px] text-zinc-400 leading-none">CTRL</span>
        </div>
      </div>
    </div>
  );
};
