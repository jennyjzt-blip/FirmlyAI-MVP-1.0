import { useEffect, useState } from 'react';
import { emptyData, firms, safeUrl, statuses } from './data.js';

const storageKey = 'firmly-ai-v1';
const navigation = [['/', 'Dashboard'], ['/discover', 'Discover'], ['/discover/monitor', 'Monitor'], ['/prepare', 'Prepare'], ['/prepare/upload', 'Upload Resume'], ['/apply', 'Apply'], ['/profile', 'My Profile']];
const uid = () => crypto.randomUUID();
const values = event => Object.fromEntries(new FormData(event.currentTarget));

function Field({ label, name, type = 'text', ...props }) {
  return <label>{label}{type === 'textarea' ? <textarea name={name} {...props} /> : <input name={name} type={type} {...props} />}</label>;
}
function External({ url, children }) {
  return safeUrl(url) ? <a className="link" href={safeUrl(url)} target="_blank" rel="noopener noreferrer">{children} ↗</a> : null;
}
function Heading({ title, children }) {
  return <div className="mb-7"><h1>{title}</h1><p className="text-slate-500">{children}</p></div>;
}
function Empty({ children }) { return <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">{children}</p>; }

export default function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  const [storageError, setStorageError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved) return emptyData;
      if (!saved.profile || typeof saved.profile !== 'object' || !['opportunities', 'applications', 'letters', 'sources'].every(key => Array.isArray(saved[key]))) return emptyData;
      return saved;
    } catch { return emptyData; }
  });
  useEffect(() => {
    const change = () => { setRoute(location.hash.slice(1) || '/'); setMessage(''); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); setStorageError(''); }
    catch { setStorageError('Browser storage is unavailable or full. Changes will last only for this session.'); }
  }, [data]);
  const add = (key, record) => { setData(old => ({ ...old, [key]: [{ ...record, id: uid() }, ...old[key]] })); setMessage('Saved in this browser.'); };
  const track = opportunity => { setSelected(opportunity); location.hash = '/apply'; };
  return <>
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6">
        <a href="#/" className="shrink-0 text-2xl font-bold tracking-tight" aria-label="Firmly AI dashboard">⚖ Firmly<span className="text-blue-300">AI</span></a>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-1">{navigation.map(([path, label]) => <a key={path} href={`#${path}`} aria-current={route === path ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm transition ${route === path ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{label}</a>)}</nav>
      </div>
    </header>
    <main className="mx-auto min-h-[75vh] max-w-6xl px-5 py-9 sm:py-12">
      {storageError && <p role="alert" className="notice mb-5">{storageError}</p>}
      {message && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">{message}</p>}
      {route === '/' ? <Dashboard data={data} />
        : route === '/profile' ? <Profile profile={data.profile} save={profile => { setData(old => ({ ...old, profile })); setMessage('Profile saved in this browser.'); }} />
        : route === '/discover' ? <Discover data={data} add={add} track={track} />
        : route === '/discover/monitor' ? <Monitor sources={data.sources} add={add} setData={setData} />
        : route === '/prepare' ? <Prepare data={data} add={add} />
        : route === '/prepare/upload' ? <Upload />
        : route === '/apply' ? <Apply data={data} add={add} selected={selected} setData={setData} />
        : <div className="card"><h1>Page not found</h1><a className="link" href="#/">Return to dashboard</a></div>}
    </main>
    <footer className="border-t border-slate-200 bg-white px-5 py-6"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 text-xs text-slate-500"><span>Firmly AI · Your legal career, thoughtfully organized.</span><span>React 18 · Tailwind CSS 3 · Vite 5</span></div></footer>
  </>;
}

function Dashboard({ data }) {
  return <>
    <section className="mb-7 rounded-2xl bg-gradient-to-br from-navy to-blue-800 px-7 py-12 text-white sm:px-12 sm:py-16">
      <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Your next chapter in law</span>
      <h1 className="max-w-2xl text-4xl sm:text-5xl sm:leading-tight">Applications,<br />with confidence.</h1>
      <p className="mb-7 mt-4 max-w-xl text-blue-100">Discover BigLaw opportunities, prepare tailored materials, and manage every application in one place.</p>
      <a className="btn bg-white text-blue-950 hover:bg-blue-50" href="#/discover">Explore opportunities →</a>
    </section>
    <div className="mb-7 grid gap-5 md:grid-cols-3">{[
      ['DISCOVER', `${firms.length} firms`, `${data.opportunities.length} opportunity records. Verify dates with each firm.`, '/discover', 'Explore firms'],
      ['PREPARE', 'Make it personal', 'Build your profile, review your resume, and create a cover letter outline.', '/prepare', 'Create materials'],
      ['APPLY', `${data.applications.length} tracked`, 'Keep your applications, progress, and next steps together.', '/apply', 'Track applications'],
    ].map(([label, title, text, href, action]) => <article className="card flex flex-col items-start" key={label}><span className="badge mb-5">{label}</span><h2>{title}</h2><p className="muted mb-6 flex-1">{text}</p><a href={`#${href}`} className="link text-sm">{action} →</a></article>)}</div>
    <div className="notice">This browser-based prototype stores your entries on this device. No live recruiting feed, automatic submissions, or AI service is connected. Existing local Flask records are separate.</div>
  </>;
}

function Profile({ profile, save }) {
  return <><Heading title="Student profile">Enter once, reuse as you prepare. Saved only in this browser.</Heading><form className="card space-y-5" onSubmit={event => { event.preventDefault(); save(values(event)); }}><div className="grid gap-5 sm:grid-cols-2">{[['name', 'Full name'], ['school', 'Law school'], ['grad', 'Graduation year'], ['gpa', 'GPA (optional)'], ['practice', 'Preferred practice areas'], ['location', 'Preferred offices']].map(([name, label]) => <Field key={name} name={name} label={label} defaultValue={profile[name] || ''} />)}</div><Field name="experience" label="Experience and accomplishments (verified facts only)" type="textarea" defaultValue={profile.experience || ''} /><button className="btn">Save profile</button></form></>;
}

function Discover({ data, add, track }) {
  const [query, setQuery] = useState('');
  const filtered = data.opportunities.filter(item => `${item.firm} ${item.title} ${item.office}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  return <><Heading title="Discover opportunities">Explore firms and keep a record of the openings you find.</Heading>
    <section className="card mb-6"><Field label="Search opportunities" name="search" placeholder="Firm, office, or position" value={query} onChange={event => setQuery(event.target.value)} /><h2 className="mt-6">Opportunity tracker</h2>{!filtered.length ? <Empty>{query ? 'No opportunities match your search.' : 'No opportunities yet. Add your first recruiting listing below.'}</Empty> : <div className="space-y-3">{filtered.map(item => <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4" key={item.id}><div><h3 className="font-semibold">{item.firm} · {item.title}</h3><p className="muted">{item.office || 'Office unspecified'} · Opens: {item.open_date || 'Not announced'} · Deadline: {item.deadline || 'Not announced'}</p><p className="mt-2 text-sm"><External url={item.source_url}>Official source</External>{!item.source_url && 'Source not entered'} · Dates require verification</p>{item.notes && <p className="muted mt-2">{item.notes}</p>}</div><button className="btn secondary" onClick={() => track(item)}>Track →</button></article>)}</div>}</section>
    <div className="grid items-start gap-6 lg:grid-cols-2"><section className="card"><h2>Firm directory</h2><div className="divide-y">{firms.map(firm => <article key={firm.name} className="py-4 first:pt-0"><h3 className="font-semibold">{firm.name}</h3><p className="muted mb-1">{firm.practice}</p><span className="text-sm"><External url={firm.website}>Official website</External></span></article>)}</div><p className="muted">Practice summaries are general starting points. Check official recruiting pages for current opportunities.</p></section>
      <form className="card space-y-4" onSubmit={event => { event.preventDefault(); add('opportunities', values(event)); event.currentTarget.reset(); }}><h2>Add opportunity</h2><label>Firm<select name="firm">{firms.map(firm => <option key={firm.name}>{firm.name}</option>)}</select></label><Field label="Position" name="title" placeholder="2L Summer Associate" required /><Field label="Office" name="office" placeholder="New York" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Confirmed opening date" name="open_date" type="date" /><Field label="Confirmed deadline" name="deadline" type="date" /></div><Field label="Official application URL" name="apply_url" type="url" placeholder="https://…" pattern="https?://.*" /><Field label="Source URL" name="source_url" type="url" placeholder="https://…" pattern="https?://.*" /><Field label="Eligibility / source notes" name="notes" type="textarea" /><button className="btn">Add opportunity</button></form></div>
  </>;
}

function Apply({ data, add, selected, setData }) {
  return <><Heading title="Apply & track">Organize your progress, then submit through each firm's official portal.</Heading><form key={selected?.id || 'manual'} className="card mb-6 space-y-4" onSubmit={event => { event.preventDefault(); add('applications', { ...values(event), status: statuses[0] }); event.currentTarget.reset(); }}><h2>Track an application</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Firm" name="firm" defaultValue={selected?.firm || ''} required /><Field label="Position" name="position" defaultValue={selected?.title || ''} required /></div><Field label="Office" name="office" defaultValue={selected?.office || ''} /><Field label="Notes / checklist" name="notes" type="textarea" placeholder="Resume reviewed, cover letter ready, portal login…" />{selected?.apply_url && <p><External url={selected.apply_url}>Open official application</External></p>}<button className="btn">Create tracking record</button><p className="muted">Creating or updating a record does not submit an application.</p></form>
    <section className="card"><h2>My applications</h2>{!data.applications.length ? <Empty>No tracked applications yet.</Empty> : <div className="space-y-4">{data.applications.map(item => <article className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[1fr_250px]" key={item.id}><div><h3 className="font-semibold">{item.firm}</h3><p>{item.position} {item.office && `· ${item.office}`}</p>{item.notes && <p className="muted mt-2 whitespace-pre-wrap">{item.notes}</p>}</div><label>Application status<select value={item.status} onChange={event => setData(old => ({ ...old, applications: old.applications.map(entry => entry.id === item.id ? { ...entry, status: event.target.value } : entry) }))}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></article>)}</div>}</section></>;
}

function Prepare({ data, add }) {
  const [review, setReview] = useState('');
  return <><Heading title="Prepare materials">Make your experience and your reasons for applying clear.</Heading><p className="notice mb-6">The hosted version provides a writing outline and a manual resume checklist. AI drafting requires a separate backend and is not connected here.</p><div className="grid items-start gap-6 lg:grid-cols-2"><form className="card space-y-4" onSubmit={event => { event.preventDefault(); setReview('Manual review checklist:\n• Confirm graduation year and eligibility for the position.\n• Check employment and education dates for consistency.\n• Verify every GPA, credential, and accomplishment.\n• Confirm office preferences match your application.\n• Check that your contact details are up to date.\n\nThis checklist does not analyze the pasted text.'); }}><h2>Resume assistant</h2><Field label="Paste resume text" name="resume" type="textarea" className="min-h-56" required /><button className="btn">Show review checklist</button><a className="link ml-4 inline-block text-sm" href="#/prepare/upload">Upload PDF / DOCX →</a>{review && <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm leading-7">{review}</pre>}</form>
      <form className="card space-y-4" onSubmit={event => { event.preventDefault(); const { firm, office, motivation } = values(event); const p = data.profile; const letter = `Dear Recruiting Committee,\n\nI am a law student at ${p.school || '[law school]'}, graduating in ${p.grad || '[graduation year]'}. I am writing to apply for [position] at ${firm}${office ? ` in ${office}` : ''}.\n\n${motivation}\n\n${p.experience || '[Add relevant, verified experience and explain how it prepares you for this role.]'}\n\nThank you for considering my application. I would welcome the opportunity to discuss my interest in your firm.\n\nSincerely,\n${p.name || '[Your name]'}`; add('letters', { firm, office, letter }); }}><h2>Cover letter studio</h2><Field label="Target firm" name="firm" required /><Field label="Office" name="office" /><Field label="Your genuine connection or motivation" name="motivation" type="textarea" required placeholder="A conversation, an event, or your own reasons for applying…" /><button className="btn">Create writing outline</button><p className="muted">Uses your profile and supplied facts. Review and personalize before use.</p></form></div><section className="card mt-6"><h2>Saved cover letter outlines</h2>{!data.letters.length ? <Empty>No outlines yet.</Empty> : data.letters.map(item => <details key={item.id} className="border-b py-4 last:border-0" open={data.letters[0].id === item.id}><summary className="cursor-pointer font-semibold">{item.firm} {item.office && `— ${item.office}`}</summary><pre className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-5 font-sans text-sm leading-7">{item.letter}</pre></details>)}</section></>;
}

function Upload() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function extract(event) {
    event.preventDefault();
    const file = event.currentTarget.elements.resume.files[0];
    setError(''); setText('');
    if (!file || !/\.(pdf|docx)$/i.test(file.name)) { setError('Choose a PDF or DOCX resume.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File must be 5 MB or smaller.'); return; }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      let content;
      if (/\.docx$/i.test(file.name)) {
        const mammoth = await import('mammoth/mammoth.browser');
        content = (await (mammoth.default || mammoth).extractRawText({ arrayBuffer: buffer })).value;
      } else {
        const pdfjs = await import('pdfjs-dist');
        const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const document = await pdfjs.getDocument({ data: buffer, isEvalSupported: false }).promise;
        try {
          const pages = [];
          for (let i = 1; i <= document.numPages; i++) {
            const page = await document.getPage(i);
            pages.push((await page.getTextContent()).items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
          }
          content = pages.join('\n\n');
        } finally { await document.destroy(); }
      }
      if (!content.trim()) throw new Error('No selectable text found. Scanned PDFs need OCR first.');
      setText(content.slice(0, 16000));
    } catch (err) { setError(`Could not read resume: ${err.message}`); }
    finally { setBusy(false); }
  }
  return <><Heading title="Resume upload & review">Extract PDF or DOCX text on your device.</Heading><p className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-950">Files are processed in this browser and are not uploaded. Extracted text is not saved. For review, copy the text into Prepare materials.</p><form className="card space-y-5" onSubmit={extract}><Field label="PDF or DOCX resume (maximum 5 MB)" type="file" name="resume" accept=".pdf,.docx" required /><button className="btn" disabled={busy}>{busy ? 'Reading resume…' : 'Extract resume text'}</button></form>{error && <p role="alert" className="notice mt-5">{error}</p>}{text && <section className="card mt-6"><h2>Extracted resume text</h2><textarea aria-label="Extracted resume text" className="min-h-80" value={text} onChange={event => setText(event.target.value)} /><p className="muted mt-3">Check the extracted text for missing or reordered content before use.</p><a className="link mt-4 inline-block" href="#/prepare">Go to Prepare →</a></section>}</>;
}

function Monitor({ sources, add, setData }) {
  return <><Heading title="Recruiting monitor">Keep official recruiting pages together for manual checks.</Heading><p className="notice mb-6">GitHub Pages cannot run scheduled recruiting checks. Open each source to verify current opportunities and dates, then record when you checked it.</p><form className="card mb-6 space-y-4" onSubmit={event => { event.preventDefault(); add('sources', values(event)); event.currentTarget.reset(); }}><h2>Add an official recruiting page</h2><label>Firm<select name="firm">{firms.map(firm => <option key={firm.name}>{firm.name}</option>)}</select></label><Field label="Official HTTPS recruiting URL" name="url" type="url" pattern="https://.*" placeholder="https://…" required /><button className="btn">Add source</button></form><section className="card"><h2>Saved recruiting pages</h2>{!sources.length ? <Empty>Add your first recruiting page above.</Empty> : <div className="space-y-4">{sources.map(item => <article className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4" key={item.id}><div><h3 className="font-semibold">{item.firm}</h3><p className="text-sm"><External url={item.url}>Open source</External></p><p className="muted mt-2">Last manually checked: {item.checked ? new Date(item.checked).toLocaleString() : 'Never'}</p></div><button className="btn secondary" onClick={() => setData(old => ({ ...old, sources: old.sources.map(source => source.id === item.id ? { ...source, checked: new Date().toISOString() } : source) }))}>Mark as checked</button></article>)}</div>}<a className="link mt-5 inline-block text-sm" href="#/discover">Add a verified opportunity →</a></section></>;
}
