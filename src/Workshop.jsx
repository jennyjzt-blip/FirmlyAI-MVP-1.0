import { useState } from 'react';
import { extractDocument } from './documents.js';
import { download, loadFile, storeFile } from './fileStore.js';
import { reviewDocument, tailorLetter } from './workflow.js';

const documentTypes = [
  { key: 'resume', label: 'Resume', text: 'resumeText', name: 'resumeName', file: 'resumeFileId', hint: 'Your experience and accomplishments.' },
  { key: 'transcript', label: 'Transcript', text: 'transcriptText', name: 'transcriptName', file: 'transcriptFileId', hint: 'Your academic record, kept with your materials.' },
  { key: 'letter', label: 'Master cover letter', text: 'coverLetter', name: 'coverLetterName', file: 'coverLetterFileId', hint: 'A foundation for every tailored letter.' },
];

export default function Workshop({ data, setData }) {
  const [tab, setTab] = useState('documents');
  return <><div className="mb-7"><span className="badge mb-3">YOUR APPLICATION TOOLKIT</span><h1>Workshop</h1><p className="text-slate-500">Keep your documents together. Make every application personal.</p></div>
    <div className="mb-6 flex gap-2 border-b pb-4" role="tablist" aria-label="Workshop sections">{[['documents', 'Document library'], ['studio', 'Cover letter studio']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={`btn ${tab === key ? '' : 'secondary'}`} onClick={() => setTab(key)}>{label}</button>)}</div>
    <p className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-950">Documents and drafts are saved on this device. AI tools are demo previews with local suggestions and templates; no live AI service is connected.</p>
    {tab === 'documents' ? <div role="tabpanel" aria-label="Document library"><div className="grid items-start gap-5 lg:grid-cols-3">{documentTypes.map(type => <DocumentCard key={`${type.key}-${data.profile.materialsUpdatedAt || ''}`} type={type} profile={data.profile} save={patch => setData(old => ({ ...old, profile: { ...old.profile, ...patch } }))} />)}</div></div>
      : <div role="tabpanel" aria-label="Cover letter studio"><LetterStudio data={data} setData={setData} /></div>}
  </>;
}

function DocumentCard({ type, profile, save }) {
  const [text, setText] = useState(profile[type.text] || '');
  const [name, setName] = useState(profile[type.name] || '');
  const [fileId, setFileId] = useState(profile[type.file] || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [saved, setSaved] = useState(false);
  async function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const extracted = await extractDocument(file);
      const id = await storeFile(file);
      setText(extracted); setName(file.name); setFileId(id); setSuggestions(null);
      save({ [type.text]: extracted, [type.name]: file.name, [type.file]: id, ...(type.key === 'letter' ? { coverMode: 'upload' } : {}) });
      setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); event.target.value = ''; }
  }
  async function original() {
    try {
      const file = await loadFile(fileId);
      if (!file) throw new Error('Original file is unavailable. You can still download the saved text.');
      download(file, name);
    } catch (err) { setError(err.message); }
  }
  return <section className="card min-w-0 space-y-4"><div className="flex items-center justify-between gap-2"><h2 className="mb-0">{type.label}</h2><span className="badge">{profile[type.text] ? 'SAVED' : 'ADD FILE'}</span></div><p className="muted">{type.hint}</p>
    <label>Upload {type.label.toLowerCase()}<input type="file" accept=".pdf,.docx" disabled={busy} onChange={upload} /></label><p className="muted break-words">{name || 'PDF or DOCX · Up to 5 MB'}</p>
    <label>{type.label} text<textarea className="min-h-56" maxLength={16000} value={text} onChange={event => { setText(event.target.value); setSaved(false); }} placeholder="Upload a file or paste its text here." /></label>
    <div className="flex flex-wrap gap-2"><button className="btn" disabled={busy || !text.trim()} onClick={() => { save({ [type.text]: text, [type.name]: name || `${type.label}.txt`, [type.file]: fileId, ...(type.key === 'letter' ? { coverMode: 'upload' } : {}) }); setSaved(true); }}>Save text</button><button className="btn secondary" disabled={busy || !text.trim()} onClick={() => setSuggestions(reviewDocument(text, type.key))}>{type.key === 'transcript' ? 'AI readability review' : 'AI improve'} <span className="ml-1 text-xs">(demo)</span></button></div>
    {(text || fileId) && <div className="flex flex-wrap gap-4 text-sm">{fileId && <button className="link" onClick={original}>Download original</button>}{text && <button className="link" onClick={() => download(new Blob([text], { type: 'text/plain' }), `${type.key}.txt`)}>Download text</button>}</div>}
    {busy && <p role="status" className="muted">Reading and saving document…</p>}{saved && <p role="status" className="text-sm text-emerald-800">Saved on this device.</p>}{error && <p role="alert" className="notice">{error}</p>}
    {suggestions && <div className="rounded-xl bg-slate-50 p-4"><h3 className="mb-3 font-semibold">{type.key === 'transcript' ? 'Readability checks' : 'Suggested improvements'}</h3><ul className="list-disc space-y-2 pl-4 text-sm text-slate-600">{suggestions.map(item => <li key={item}>{item}</li>)}</ul><p className="muted mt-3">Local demo review. Edit the text above and save when ready.</p></div>}
  </section>;
}

function LetterStudio({ data, setData }) {
  const [context, setContext] = useState({ firm: '', position: 'Legal Intern', office: '', event: '', contacts: '', notes: '' });
  const [letter, setLetter] = useState('');
  const [draftId, setDraftId] = useState(null);
  const [message, setMessage] = useState('');
  const field = (name, label, multiline = false) => <label>{label}{multiline ? <textarea value={context[name]} onChange={event => setContext(old => ({ ...old, [name]: event.target.value }))} /> : <input required={name === 'firm' || name === 'position'} value={context[name]} onChange={event => setContext(old => ({ ...old, [name]: event.target.value }))} />}</label>;
  function save() {
    const id = draftId || crypto.randomUUID();
    const draft = { id, ...context, letter, updatedAt: new Date().toISOString() };
    setData(old => ({ ...old, letters: [draft, ...old.letters.filter(item => item.id !== id)] }));
    setDraftId(id); setMessage('Tailored draft saved.');
  }
  return <><div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><form className="card space-y-4" onSubmit={event => { event.preventDefault(); setLetter(tailorLetter(data.profile, context)); setDraftId(null); setMessage('Demo draft generated from your saved materials and supplied connections.'); }}><h2>Make your connection count</h2>{field('firm', 'Target firm')}{field('position', 'Position')}{field('office', 'Office')}{field('event', 'Networking event / date')}{field('contacts', 'People you know at the firm / their roles')}{field('notes', 'What you discussed and why it matters to you', true)}<button className="btn">Generate tailored cover letter <span className="ml-1 text-xs">(demo)</span></button><p className="muted">Uses your master letter or resume. Include only events and conversations that happened.</p></form>
    <section className="card space-y-4"><h2>Your tailored letter</h2><label>Edit cover letter<textarea className="min-h-[28rem]" value={letter} onChange={event => { setLetter(event.target.value); setMessage(''); }} placeholder="Generate a letter or open a saved draft below." /></label><div className="flex flex-wrap gap-3"><button className="btn" disabled={!letter.trim()} onClick={save}>Save draft</button><button className="btn secondary" disabled={!letter.trim()} onClick={() => download(new Blob([letter], { type: 'text/plain' }), `${context.firm || 'firm'}-cover-letter.txt`)}>Download letter</button></div>{message && <p role="status" className="text-sm text-emerald-800">{message}</p>}</section></div>
    <section className="card mt-6"><h2>Saved firm-specific letters</h2>{!data.letters.length ? <p className="muted">Your tailored drafts will appear here.</p> : <div className="grid gap-3 sm:grid-cols-2">{data.letters.map(item => <button className="rounded-xl border p-4 text-left hover:border-blue-500" key={item.id} onClick={() => { setContext({ firm: item.firm || '', position: item.position || '', office: item.office || '', event: item.event || '', contacts: item.contacts || '', notes: item.notes || '' }); setLetter(item.letter); setDraftId(item.id); setMessage('Saved draft opened for editing.'); window.scrollTo(0, 0); }}><strong>{item.firm}</strong><span className="muted mt-1 block">{item.position || 'Cover letter'} {item.office && `· ${item.office}`}</span></button>)}</div>}</section></>;
}
