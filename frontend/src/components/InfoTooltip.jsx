import React, { useEffect, useRef, useState } from 'react';

export default function InfoTooltip({ label = 'More information', children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
      >
        i
      </button>
      {open && (
        <div role="tooltip" className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 text-left text-sm font-normal leading-relaxed text-gray-700 shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200">
          <div className="flex items-start gap-3">
            <p className="flex-1">{children}</p>
            <button type="button" aria-label="Close information" onClick={() => setOpen(false)} className="shrink-0 text-lg leading-none text-gray-400 hover:text-gray-700 dark:hover:text-gray-100">×</button>
          </div>
        </div>
      )}
    </span>
  );
}
