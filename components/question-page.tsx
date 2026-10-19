'use client'

import { useEffect, useRef, useState } from 'react'
import { Expand, ExternalLink, X } from 'lucide-react'

export function QuestionPage({ src, alt, compact = false, chartOnly = false }: { src: string; alt: string; compact?: boolean; chartOnly?: boolean }) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const preview = chartOnly && /^\/question-bank\/pages\/page-\d{2}\.webp$/.test(src) ? src.replace('/page-', '/chart-') : src
  useEffect(() => {
    setFailed(false)
  }, [src])
  useEffect(() => {
    if (open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [open])
  return <figure className="mt-5">
    <div className="overflow-hidden rounded-lg border border-[#dbe3ef] bg-white">
      {failed ? <p role="alert" className="p-4 text-sm text-red-700">The question image could not load. Please retry before starting this task.</p> : <button type="button" onClick={() => setOpen(true)} aria-label={`Enlarge ${alt}`} className="block w-full cursor-zoom-in bg-white text-left focus-visible:outline-2 focus-visible:outline-[#3267ad]">
        <img src={preview} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`mx-auto h-auto w-full object-contain ${compact ? 'max-h-80' : ''}`} />
      </button>}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf1f6] bg-[#f8fafc] px-3 py-2 text-xs text-[#60708a]">
        <span>Original question · chart labels preserved</span>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 font-semibold text-[#3267ad]"><Expand className="size-3.5" />Enlarge</button>
      </figcaption>
    </div>
    <dialog ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-label={alt} className="fixed inset-0 m-auto h-[94dvh] w-[96vw] max-w-5xl overflow-hidden rounded-xl border border-[#dbe3ef] bg-white p-0 text-[#172b4d] shadow-2xl backdrop:bg-[#102a56]/60">
      {open && <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b p-4"><p className="text-sm font-semibold">{alt}</p><div className="flex items-center gap-4"><a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#3267ad]">Full resolution<ExternalLink className="size-3.5" /></a><button type="button" onClick={() => setOpen(false)} aria-label="Close question preview"><X className="size-5" /></button></div></div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#edf1f6] p-3 md:p-6"><img src={src} alt={alt} className="mx-auto h-auto w-full max-w-[1800px] bg-white shadow-sm" /></div>
      </div>}
    </dialog>
  </figure>
}
