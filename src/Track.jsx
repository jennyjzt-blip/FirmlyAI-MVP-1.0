import { useState } from 'react';
import { statuses } from './data.js';
import { dateKey, monthDays } from './workflow.js';
import useDialog from './useDialog.js';

const stamp = value => value ? new Date(value).toLocaleString() : 'Time not recorded';

export default function Track({ data, setData }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [editor, setEditor] = useState(null);
  const dialogRef = useDialog(!!editor, () => setEditor(null));
  const [message, setMessage] = useState('');
  const [dragged, setDragged] = useState(null);
  const events = data.calendarEvents || [];
  const today = dateKey(new Date());
  function schedule(applicationId, date = today) {
    setEditor({ applicationId, date, time: '09:00', type: 'Interview', location: '', notes: '' });
  }
  function saveEvent(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const record = { ...fields, id: editor.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    setData(old => ({ ...old, calendarEvents: [record, ...(old.calendarEvents || []).filter(item => item.id !== record.id)], applications: old.applications.map(item => item.id === record.applicationId ? { ...item,
      status: record.type === 'Interview' ? 'Interview' : item.status,
      history: [{ at: record.updatedAt, text: `${editor.id ? 'Updated' : 'Scheduled'} ${record.type.toLowerCase()}: ${record.date} at ${record.time}.` }, ...(item.history || [])],
    } : item) }));
    const [year, monthNumber] = record.date.split('-').map(Number);
    setMonth(new Date(year, monthNumber - 1, 1));
    setEditor(null); setMessage('Calendar event saved.');
  }
  function applyDrop(payload, day) {
    setDragged(null);
    if (!payload) return;
    if (payload.startsWith('event:')) {
      const existing = events.find(item => item.id === payload.slice(6));
      if (existing) setEditor({ ...existing, date: day });
    } else if (data.applications.some(item => item.id === payload)) schedule(payload, day);
  }
  function drop(event, day) {
    event.preventDefault();
    applyDrop(event.dataTransfer.getData('application/x-firmly') || dragged, day);
  }
  function pointerStart(event, value) {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragged(value);
  }
  function pointerEnd(event, value) {
    event.preventDefault(); event.stopPropagation();
    const day = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-calendar-date]')?.dataset.calendarDate;
    if (day) applyDrop(value, day);
    else setDragged(null);
  }
  function startDrag(event, value) {
    event.dataTransfer.setData('application/x-firmly', value); event.dataTransfer.effectAllowed = 'move'; setDragged(value);
  }
  return <><div className="mb-7"><span className="badge mb-3">EVERY APPLICATION. EVERY NEXT STEP.</span><h1>Track</h1><p className="text-slate-500">Follow your application history and make room for what comes next.</p></div>
    {message && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,2fr)]">
      <aside className="min-w-0"><section className="card mb-5"><div className="mb-3 flex items-center justify-between"><h2 className="mb-0">Applications</h2><span className="badge">{data.applications.length}</span></div><p className="muted">Activity is recorded as you work. Drag a position onto a day, or use Schedule to add an interview or follow-up.</p><a className="link mt-3 inline-block text-sm" href="#/discover">Find more positions →</a></section>
        <div className="max-h-[950px] space-y-4 overflow-y-auto pr-1">{!data.applications.length && <div className="card muted">No applications yet. Start with Copilot or Auto in Discover.</div>}{data.applications.map(item => <article draggable onDragStart={event => startDrag(event, item.id)} onDragEnd={() => setDragged(null)} className="card cursor-grab space-y-3 active:cursor-grabbing" key={item.id} aria-label={`Application ${item.firm} ${item.position}`}><div role="button" tabIndex={0} aria-label={`Drag ${item.firm} to calendar, or press Enter to schedule`} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); schedule(item.id); } }} onPointerDown={event => pointerStart(event, item.id)} onPointerUp={event => pointerEnd(event, item.id)} onPointerCancel={() => setDragged(null)} className="select-none rounded-md bg-slate-50 p-2 text-xs uppercase tracking-wider text-slate-500" style={{ touchAction: 'none' }}>⠿ Drag to calendar</div><h3 className="font-bold">{item.firm}</h3><p className="text-sm">{item.position}<span className="muted block">{item.office || 'Office unspecified'}</span></p>{item.sample && <p className="text-xs text-amber-800">Sample position · demo record</p>}<p className="muted">Added: {stamp(item.createdAt)}</p><label>Status<select value={item.status} onChange={event => { const status = event.target.value; const at = new Date().toISOString(); setData(old => ({ ...old, applications: old.applications.map(entry => entry.id === item.id ? { ...entry, status, history: [{ at, text: `Status changed to ${status}.` }, ...(entry.history || [])] } : entry) })); }}>{[...new Set([item.status, ...statuses])].map(status => <option key={status}>{status}</option>)}</select></label><button className="btn secondary w-full" onClick={() => schedule(item.id)}>Schedule interaction</button>{item.notes && <p className="muted whitespace-pre-wrap">{item.notes}</p>}<details><summary className="link cursor-pointer text-sm">Activity history</summary><ol className="mt-3 space-y-3 border-l pl-3">{!(item.history || []).length && <li className="muted">No earlier activity was recorded.</li>}{(item.history || []).map((entry, index) => <li key={index} className="text-xs leading-relaxed"><time className="block text-slate-400">{stamp(entry.at)}</time>{entry.text}</li>)}</ol></details></article>)}</div>
        <details className="card mt-5"><summary className="cursor-pointer font-semibold">Add an existing application</summary><form className="mt-4 space-y-4" onSubmit={event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); const at = new Date().toISOString(); setData(old => ({ ...old, applications: [{ ...values, id: crypto.randomUUID(), createdAt: at, history: [{ at, text: 'Manually added application record.' }] }, ...old.applications] })); event.currentTarget.reset(); }}><label>Firm<input name="firm" required /></label><label>Position<input name="position" required /></label><label>Office<input name="office" /></label><label>Status<select name="status">{statuses.map(status => <option key={status}>{status}</option>)}</select></label><label>Notes<textarea name="notes" /></label><button className="btn">Save application</button></form></details>
      </aside>
      <section className="card min-w-0 p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="mb-1">Your calendar</h2><p className="muted">Interviews, follow-ups, and conversations.</p></div><div className="flex items-center gap-2"><button className="btn secondary px-3" aria-label="Previous month" onClick={() => setMonth(old => new Date(old.getFullYear(), old.getMonth() - 1, 1))}>←</button><button className="btn secondary px-3" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button><button className="btn secondary px-3" aria-label="Next month" onClick={() => setMonth(old => new Date(old.getFullYear(), old.getMonth() + 1, 1))}>→</button></div></div><div className="mb-5 flex flex-wrap justify-between gap-3"><h3 className="text-xl font-semibold">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3><button className="link text-sm" disabled={!data.applications.length} onClick={() => schedule(data.applications[0]?.id)}>+ Add interaction</button></div>
        <div className="overflow-x-auto"><div className="min-w-[560px]"><div className="grid grid-cols-7 bg-slate-50">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div className="p-3 text-center text-xs font-semibold text-slate-500" key={day}>{day}</div>)}</div><div className="grid grid-cols-7 border-l border-t">{monthDays(month).map(date => { const day = dateKey(date); return <div key={day} data-calendar-date={day} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={event => drop(event, day)} className={`min-h-[115px] border-b border-r p-2 transition ${dragged ? 'hover:bg-blue-100' : ''} ${date.getMonth() !== month.getMonth() ? 'bg-slate-50 text-slate-400' : 'bg-white'}`} aria-label={`${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} calendar day`}><button className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs ${day === today ? 'bg-blue-900 font-bold text-white' : 'hover:bg-blue-50'}`} disabled={!data.applications.length} onClick={() => schedule(data.applications[0]?.id, day)} aria-label={`Schedule interaction on ${day}`}>{date.getDate()}</button><div className="space-y-1">{events.filter(item => item.date === day).sort((a, b) => a.time.localeCompare(b.time)).map(item => { const app = data.applications.find(application => application.id === item.applicationId); return <button key={item.id} draggable onDragStart={event => { event.stopPropagation(); startDrag(event, `event:${item.id}`); }} onDragEnd={() => setDragged(null)} onClick={() => setEditor(item)} className={`w-full break-words rounded-md border-l-2 p-1.5 text-left text-[11px] leading-tight ${item.type === 'Interview' ? 'border-blue-700 bg-blue-50 text-blue-950' : 'border-emerald-600 bg-emerald-50 text-emerald-950'}`}><span className="font-semibold">{item.time} · {item.type}</span><span className="mt-1 block">{app?.firm || 'Application'}</span></button>; })}</div></div>; })}</div></div></div><p className="muted mt-4">Drag a saved event to another day to reschedule it. Schedule buttons also work on phones and with a keyboard.</p>
      </section>
    </div>
    {editor && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/60 p-5"><form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="event-title" className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto rounded-2xl bg-white p-6" onSubmit={saveEvent}><div className="flex justify-between"><h2 id="event-title">{editor.id ? 'Edit interaction' : 'Schedule interaction'}</h2><button className="link self-start" type="button" onClick={() => setEditor(null)}>Cancel</button></div><label>Application<select name="applicationId" defaultValue={editor.applicationId} required>{data.applications.map(item => <option key={item.id} value={item.id}>{item.firm} · {item.position}</option>)}</select></label><label>Interaction type<select name="type" defaultValue={editor.type}>{['Interview', 'Follow-up', 'Networking', 'Other'].map(type => <option key={type}>{type}</option>)}</select></label><div className="grid grid-cols-2 gap-4"><label>Date<input autoFocus name="date" type="date" required defaultValue={editor.date} /></label><label>Time (local)<input name="time" type="time" required defaultValue={editor.time} /></label></div><label>Location / meeting link<input name="location" defaultValue={editor.location} /></label><label>Notes<textarea name="notes" defaultValue={editor.notes} /></label><div className="flex flex-wrap gap-3"><button className="btn">Save interaction</button>{editor.id && <button className="btn secondary" type="button" onClick={() => { setData(old => ({ ...old, calendarEvents: (old.calendarEvents || []).filter(item => item.id !== editor.id), applications: old.applications.map(item => item.id === editor.applicationId ? { ...item, history: [{ at: new Date().toISOString(), text: `Removed ${editor.type.toLowerCase()} from the calendar (${editor.date}).` }, ...(item.history || [])] } : item) })); setEditor(null); setMessage('Calendar event removed.'); }}>Remove event</button>}</div></form></div>}
  </>;
}
