'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, FileText, LockKeyhole, Save, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { QuestionPage } from '@/components/question-page'
import { readSourcePage } from '@/lib/question-bank'

type Exam = { exam_id: string; access_code_id: string; exam_title: string; task1_prompt: string; task2_prompt: string; task1_image_url: string | null; duration_minutes: number }

type Stage = 'access' | 'exam' | 'submitted'

function countWords(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0 }
function formatTime(seconds: number) { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}` }

export default function Page() {
  const [stage, setStage] = useState<Stage>('access')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [exam, setExam] = useState<Exam | null>(null)
  const [activeTask, setActiveTask] = useState<1 | 2>(1)
  const [task1, setTask1] = useState('')
  const [task2, setTask2] = useState('')
  const [seconds, setSeconds] = useState(3600)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submittedId, setSubmittedId] = useState('')

  const submit = async () => {
    if (!exam || saving) return
    setSaving(true); setError('')
    const { data, error: submitError } = await createClient().rpc('submit_exam', { input_access_code_id: exam.access_code_id, input_student_name: name.trim(), input_task1: task1, input_task2: task2 })
    if (submitError) setError(submitError.message.includes('Invalid') ? 'This access code has already been submitted or is no longer active.' : 'We could not submit your answers. Please try again.')
    else { setSubmittedId(data); setStage('submitted') }
    setSaving(false)
  }

  useEffect(() => {
    if (stage !== 'exam') return
    if (seconds <= 0) { void submit(); return }
    const timer = window.setInterval(() => setSeconds((current) => current - 1), 1000)
    return () => window.clearInterval(timer)
  }, [stage, seconds])

  const start = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!name.trim() || !code.trim()) { setError('Enter your full name and access code to continue.'); return }
    const { data, error: startError } = await createClient().rpc('start_exam', { input_code: code.trim(), input_name: name.trim() })
    if (startError || !data?.[0]) { setError('We could not find an active exam for that access code. Check it and try again.'); return }
    const nextExam = data[0] as Exam
    setExam(nextExam); setSeconds(nextExam.duration_minutes * 60); setStage('exam')
  }

  const activePrompt = activeTask === 1 ? exam?.task1_prompt : exam?.task2_prompt
  const sourceQuestion = readSourcePage(activePrompt || '')
  const questionImage = sourceQuestion.image || (activeTask === 1 ? exam?.task1_image_url : null)
  const activeAnswer = activeTask === 1 ? task1 : task2
  const setActiveAnswer = activeTask === 1 ? setTask1 : setTask2
  const progress = useMemo(() => Math.max(0, Math.min(100, ((exam ? exam.duration_minutes * 60 - seconds : 0) / (exam?.duration_minutes ? exam.duration_minutes * 60 : 3600)) * 100)), [exam, seconds])

  if (stage === 'access') return <main className="min-h-screen bg-[#f5f7fb] text-[#172b4d]"><header className="border-b border-[#dbe3ef] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[#102a56] text-white"><FileText className="size-5" /></div><div><p className="text-lg font-bold tracking-tight">IELTS Writing Assessment</p><p className="text-xs text-[#60708a]">Secure examination environment</p></div></div><a href="/admin" className="text-sm font-medium text-[#60708a] hover:text-[#102a56]">Teacher sign in</a></div></header><section className="mx-auto flex min-h-[calc(100vh-91px)] max-w-6xl items-center justify-center px-5 py-12"><div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[#dbe3ef] bg-white shadow-[0_20px_60px_rgba(23,43,77,0.08)] md:grid-cols-[1.05fr_.95fr]"><div className="bg-[#102a56] p-8 text-white md:p-12"><div className="mb-16 flex size-12 items-center justify-center rounded-xl bg-white/10"><ShieldCheck className="size-6" /></div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#a9c5eb]">Candidate portal</p><h1 className="max-w-sm text-3xl font-semibold leading-tight md:text-4xl">Your writing assessment starts here.</h1><p className="mt-5 max-w-sm leading-7 text-[#c5d3e7]">Enter the details provided by your teacher. Your responses are saved securely and submitted automatically when time expires.</p><div className="mt-10 flex items-center gap-3 text-sm text-[#c5d3e7]"><LockKeyhole className="size-4" /> Private, secure and timed</div></div><form onSubmit={start} className="flex flex-col justify-center gap-6 p-8 md:p-12"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#60708a]">Begin assessment</p><h2 className="mt-2 text-2xl font-bold text-[#172b4d]">Candidate access</h2><p className="mt-2 text-sm leading-6 text-[#60708a]">Use the exact name you want your teacher to see.</p></div><label className="grid gap-2 text-sm font-semibold">Full name<input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-lg border border-[#c9d5e5] px-4 font-normal outline-none transition focus:border-[#3267ad] focus:ring-4 focus:ring-[#3267ad]/10" placeholder="e.g. Alex Morgan" /></label><label className="grid gap-2 text-sm font-semibold">Access code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="h-12 rounded-lg border border-[#c9d5e5] px-4 font-mono font-normal tracking-widest outline-none transition focus:border-[#3267ad] focus:ring-4 focus:ring-[#3267ad]/10" placeholder="Enter code" /></label>{error && <p className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}<button className="h-12 rounded-lg bg-[#102a56] font-semibold text-white transition hover:bg-[#1e427a]">Start assessment</button><p className="text-center text-xs text-[#8a98ab]">Your teacher can help if you do not have an access code.</p></form></div></section></main>

  if (stage === 'submitted') return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5"><div className="w-full max-w-lg rounded-2xl border border-[#dbe3ef] bg-white p-8 text-center shadow-lg md:p-12"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-8" /></div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#60708a]">Assessment submitted</p><h1 className="mt-3 text-3xl font-bold text-[#172b4d]">Thank you, {name.split(' ')[0]}.</h1><p className="mt-4 leading-7 text-[#60708a]">Your IELTS writing responses have been securely submitted to your teacher. You may now close this window.</p><div className="mt-8 rounded-lg bg-[#f5f7fb] p-4 text-left text-sm"><div className="flex justify-between"><span className="text-[#60708a]">Submission reference</span><strong className="font-mono text-[#172b4d]">{submittedId.slice(0, 8).toUpperCase()}</strong></div><div className="mt-2 flex justify-between"><span className="text-[#60708a]">Candidate</span><strong className="text-[#172b4d]">{name}</strong></div></div></div></main>

  return <main className="min-h-screen bg-[#f5f7fb] text-[#172b4d]"><header className="sticky top-0 z-10 border-b border-[#dbe3ef] bg-white"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 md:px-8"><div className="flex min-w-0 items-center gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#102a56] text-white"><FileText className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold md:text-base">{exam?.exam_title}</p><p className="text-xs text-[#60708a]">Candidate: {name}</p></div></div><div className={`flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-base font-bold ${seconds < 300 ? 'bg-red-50 text-red-700' : 'bg-[#edf3fb] text-[#102a56]'}`}><Clock3 className="size-4" />{formatTime(seconds)}</div></div><div className="h-1 bg-[#e6edf6]"><div className="h-full bg-[#3267ad] transition-all" style={{ width: `${progress}%` }} /></div></header><div className="mx-auto max-w-[1500px] px-4 py-5 md:px-8"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-lg border border-[#c9d5e5] bg-white p-1"><button onClick={() => setActiveTask(1)} className={`rounded-md px-5 py-2 text-sm font-semibold ${activeTask === 1 ? 'bg-[#102a56] text-white' : 'text-[#60708a]'}`}>Task 1 <span className="ml-2 text-xs opacity-70">{countWords(task1)} words</span></button><button onClick={() => setActiveTask(2)} className={`rounded-md px-5 py-2 text-sm font-semibold ${activeTask === 2 ? 'bg-[#102a56] text-white' : 'text-[#60708a]'}`}>Task 2 <span className="ml-2 text-xs opacity-70">{countWords(task2)} words</span></button></div><div className="flex items-center gap-2 text-xs text-[#60708a]"><Save className="size-4 text-emerald-600" /> Answers saved automatically</div></div><div className="grid min-h-[calc(100vh-155px)] gap-4 lg:grid-cols-[minmax(300px,.8fr)_minmax(500px,1.2fr)]"><section className="rounded-xl border border-[#dbe3ef] bg-white p-5 md:p-7"><div className="mb-5 flex items-center justify-between"><span className="rounded-full bg-[#edf3fb] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#3267ad]">Question {activeTask}</span><span className="text-xs text-[#60708a]">Read carefully</span></div><p className="whitespace-pre-wrap text-[15px] leading-7 text-[#243b5e]">{sourceQuestion.text}</p>{questionImage ? activeTask === 1 ? <QuestionPage src={questionImage} alt="Task 1 original question" chartOnly /> : <details key={questionImage} className="mt-5 rounded-lg border border-[#dbe3ef] bg-[#f8fafc] p-3"><summary className="cursor-pointer text-sm font-semibold text-[#3267ad]">View original question page</summary><QuestionPage src={questionImage} alt="Task 2 original question" /></details> : activeTask === 1 ? <div className="mt-6 flex h-44 items-center justify-center rounded-lg border border-dashed border-[#c9d5e5] bg-[#f8fafc] text-center text-sm text-[#8a98ab]"><div><FileText className="mx-auto mb-2 size-6" /><p>Task 1 chart or image</p><p className="text-xs">Your teacher has not attached an image.</p></div></div> : null}<div className="mt-8 rounded-lg bg-[#f8fafc] p-4 text-sm leading-6 text-[#60708a]"><strong className="text-[#243b5e]">Suggested minimum:</strong> {activeTask === 1 ? '150 words' : '250 words'}</div></section><section className="flex min-h-[520px] flex-col rounded-xl border border-[#dbe3ef] bg-white"><div className="flex items-center justify-between border-b border-[#edf1f6] px-5 py-4"><div><h2 className="font-semibold">Your response</h2><p className="text-xs text-[#60708a]">Write your answer in the space below.</p></div><span className="text-sm font-medium text-[#60708a]">{countWords(activeAnswer)} words</span></div><textarea value={activeAnswer} onChange={(e) => setActiveAnswer(e.target.value)} spellCheck className="min-h-[430px] flex-1 resize-none p-5 text-[16px] leading-8 text-[#243b5e] outline-none md:p-7" placeholder="Begin writing here..." aria-label={`Task ${activeTask} response`} /><div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1f6] px-5 py-3"><p className="text-xs text-[#8a98ab]">Use the tabs above to switch between tasks.</p><button onClick={() => void submit()} disabled={saving} className="rounded-lg bg-[#102a56] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e427a] disabled:opacity-50">{saving ? 'Submitting...' : 'Submit assessment'}</button></div></section></div>{error && <p className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="size-4" />{error}</p>}</div></main>
}
