import { useState } from 'react';
import { statuses } from './data.js';
import { dateKey, monthDays, previewInterview } from './workflow.js';
import useDialog from './useDialog.js';

const stamp = value => value ? new Date(value).toLocaleString() : 'Time not recorded';

export default function Track({ data, setData }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [editor, setEditor] = useState(null);
  const dialogRef = useDialog(!!editor, () => setEditor(null));
  const [message, setMessage] = useState('');
  const [dragged, setDragged] = useState(null);
  const savedEvents = data.calendarEvents || [];
  const preview = previewInterview(month, savedEvents);
  const events = preview ? [...savedEvents, preview] : savedEvents;
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
  return <><div className="mb-7"><span className="badge mb-3">EVERY APPLICATION. EVERY NEXT STEP.</span><h1>Track</h1><p className="text-stone-500">Follow your application history and make room for what comes next.</p></div>
    {message && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,2fr)]">
      <aside className="min-w-0"><section className="mb-4 rounded-xl border bg-white p-4"><div className="mb-3 flex items-center justify-between"><h2 className="mb-0">Applications</h2><span className="badge">{data.applications.length}</span></div><p className="muted">Drag the grip onto a day to schedule an interview or follow-up.</p><a className="link mt-3 inline-block text-sm" href="#/discover">Find more positions →</a></section>
        <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">{!data.applications.length && <div className="rounded-xl border bg-white p-4 text-sm text-stone-500">No applications yet. Start with Copilot or Auto in Discover.</div>}{data.applications.map(item => <article draggable onDragStart={event => startDrag(event, item.id)} onDragEnd={() => setDragged(null)} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm" key={item.id} aria-label={`Application ${item.firm} ${item.position}`}>
          <div className="flex items-start gap-2"><div role="button" tabIndex={0} aria-label={`Drag ${item.firm} to calendar, or press Enter to schedule`} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); schedule(item.id); } }} onPointerDown={event => pointerStart(event, item.id)} onPointerUp={event => pointerEnd(event, item.id)} onPointerCancel={() => setDragged(null)} className="cursor-grab select-none rounded-md bg-orange-50 px-2 py-3 text-lg text-orange-700 active:cursor-grabbing" style={{ touchAction: 'none' }}>⠿</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold" title={item.firm}>{item.firm}</h3><p className="truncate text-xs text-stone-600" title={item.position}>{item.position}</p><p className="mt-1 truncate text-[11px] text-stone-400">{item.office || 'Office unspecified'}</p></div><button className="rounded-md px-2 py-1 text-xs font-semibold text-orange-800 hover:bg-orange-50" onClick={() => schedule(item.id)}>Schedule</button></div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-950" title={item.status}>{item.status.startsWith('Auto queued') ? 'Auto queue · demo' : item.status.startsWith('Copilot') ? 'Copilot · preparing' : item.status}</span>{item.sample && <span className="text-[10px] text-stone-400">Sample role</span>}</div>
          <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-stone-500">Details & activity</summary><div className="mt-3 space-y-3 border-t pt-3"><p className="muted">Added: {stamp(item.createdAt)}</p><label className="text-xs">Status<select value={item.status} onChange={event => { const status = event.target.value; const at = new Date().toISOString(); setData(old => ({ ...old, applications: old.applications.map(entry => entry.id === item.id ? { ...entry, status, history: [{ at, text: `Status changed to ${status}.` }, ...(entry.history || [])] } : entry) })); }}>{[...new Set([item.status, ...statuses])].map(status => <option key={status}>{status}</option>)}</select></label>{item.notes && <p className="muted whitespace-pre-wrap">{item.notes}</p>}<ol className="space-y-3 border-l pl-3">{!(item.history || []).length && <li className="muted">No earlier activity was recorded.</li>}{(item.history || []).map((entry, index) => <li key={index} className="text-xs leading-relaxed"><time className="block text-stone-400">{stamp(entry.at)}</time>{entry.text}</li>)}</ol></div></details>
        </article>)}</div>
        <details className="card mt-5"><summary className="cursor-pointer font-semibold">Add an existing application</summary><form className="mt-4 space-y-4" onSubmit={event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); const at = new Date().toISOString(); setData(old => ({ ...old, applications: [{ ...values, id: crypto.randomUUID(), createdAt: at, history: [{ at, text: 'Manually added application record.' }] }, ...old.applications] })); event.currentTarget.reset(); }}><label>Firm<input name="firm" required /></label><label>Position<input name="position" required /></label><label>Office<input name="office" /></label><label>Status<select name="status">{statuses.map(status => <option key={status}>{status}</option>)}</select></label><label>Notes<textarea name="notes" /></label><button className="btn">Save application</button></form></details>
      </aside>
      <section className="card min-w-0 p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="mb-1">Your calendar</h2><p className="muted">Interviews, follow-ups, and conversations.</p></div><div className="flex items-center gap-2"><button className="btn secondary px-3" aria-label="Previous month" onClick={() => setMonth(old => new Date(old.getFullYear(), old.getMonth() - 1, 1))}>←</button><button className="btn secondary px-3" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button><button className="btn secondary px-3" aria-label="Next month" onClick={() => setMonth(old => new Date(old.getFullYear(), old.getMonth() + 1, 1))}>→</button></div></div><div className="mb-5 flex flex-wrap justify-between gap-3"><h3 className="text-2xl font-medium tracking-tight">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3><button className="link text-sm" disabled={!data.applications.length} onClick={() => schedule(data.applications[0]?.id)}>+ Add interaction</button></div>
        <div className="overflow-x-auto"><div className="min-w-[560px]"><div className="grid grid-cols-7 bg-white">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div className="p-3 text-center text-xs font-semibold text-stone-500" key={day}>{day}</div>)}</div><div className="grid grid-cols-7 border-l border-t">{monthDays(month).map(date => { const day = dateKey(date); return <div key={day} data-calendar-date={day} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={event => drop(event, day)} className={`min-h-[110px] border-b border-r p-2 transition ${dragged ? 'hover:bg-orange-100' : ''} ${date.getMonth() !== month.getMonth() ? 'bg-stone-50 text-stone-400' : 'bg-white'}`} aria-label={`${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} calendar day`}><button className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs ${day === today ? 'bg-orange-900 font-bold text-white' : 'hover:bg-orange-50'}`} disabled={!data.applications.length} onClick={() => schedule(data.applications[0]?.id, day)} aria-label={`Schedule interaction on ${day}`}>{date.getDate()}</button><div className="space-y-1">{events.filter(item => item.date === day).sort((a, b) => a.time.localeCompare(b.time)).map(item => { const app = data.applications.find(application => application.id === item.applicationId); return <button key={item.id} draggable={!item.sample} onDragStart={event => { event.stopPropagation(); startDrag(event, `event:${item.id}`); }} onDragEnd={() => setDragged(null)} onClick={() => item.sample ? setMessage('This is a sample interview preview. Drag an application onto a day to create your own event.') : setEditor(item)} className={`w-full break-words rounded-md border-l-[3px] px-2 py-1.5 text-left text-[11px] leading-snug shadow-sm ${item.type === 'Interview' ? 'border-orange-600 bg-orange-100 text-orange-950' : 'border-emerald-600 bg-emerald-50 text-emerald-950'}`}><span className="font-semibold">{item.time} · {item.type}{item.sample ? ' (sample)' : ''}</span><span className="mt-1 block">{app?.firm || item.firm || 'Application'}</span></button>; })}</div></div>; })}</div></div></div><p className="muted mt-4">{preview ? 'A sample interview is shown for preview. ' : ''}Drag an event to reschedule, or use Schedule with a keyboard or phone.</p>
      </section>
    </div>
    {editor && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brandInk/60 p-5"><form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="event-title" className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto rounded-2xl bg-white p-6" onSubmit={saveEvent}><div className="flex justify-between"><h2 id="event-title">{editor.id ? 'Edit interaction' : 'Schedule interaction'}</h2><button className="link self-start" type="button" onClick={() => setEditor(null)}>Cancel</button></div><label>Application<select name="applicationId" defaultValue={editor.applicationId} required>{data.applications.map(item => <option key={item.id} value={item.id}>{item.firm} · {item.position}</option>)}</select></label><label>Interaction type<select name="type" defaultValue={editor.type}>{['Interview', 'Follow-up', 'Networking', 'Other'].map(type => <option key={type}>{type}</option>)}</select></label><div className="grid grid-cols-2 gap-4"><label>Date<input autoFocus name="date" type="date" required defaultValue={editor.date} /></label><label>Time (local)<input name="time" type="time" required defaultValue={editor.time} /></label></div><label>Location / meeting link<input name="location" defaultValue={editor.location} /></label><label>Notes<textarea name="notes" defaultValue={editor.notes} /></label><div className="flex flex-wrap gap-3"><button className="btn">Save interaction</button>{editor.id && <button className="btn secondary" type="button" onClick={() => { setData(old => ({ ...old, calendarEvents: (old.calendarEvents || []).filter(item => item.id !== editor.id), applications: old.applications.map(item => item.id === editor.applicationId ? { ...item, history: [{ at: new Date().toISOString(), text: `Removed ${editor.type.toLowerCase()} from the calendar (${editor.date}).` }, ...(item.history || [])] } : item) })); setEditor(null); setMessage('Calendar event removed.'); }}>Remove event</button>}</div></form></div>}
  </>;
}
