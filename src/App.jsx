import { useEffect, useState } from 'react';
import { emptyData, firms, safeUrl, statuses } from './data.js';
import AccountSetup from './AccountSetup.jsx';
import Profile from './Profile.jsx';

const storageKey = 'firmly-ai-v1';
const navigation = [['/', 'Dashboard'], ['/discover', 'Discover'], ['/apply', 'Apply'], ['/profile', 'My Profile']];
const legacyRoutes = { '/prepare': '/profile', '/prepare/upload': '/profile', '/discover/monitor': '/' };
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
  const [route, setRoute] = useState(legacyRoutes[location.hash.slice(1)] || location.hash.slice(1) || '/');
  const [storageError, setStorageError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved) return emptyData;
      if (!saved.profile || typeof saved.profile !== 'object' || !['opportunities', 'applications', 'letters', 'sources'].every(key => Array.isArray(saved[key]))) return emptyData;
      return { ...emptyData, ...saved };
    } catch { return emptyData; }
  });
  useEffect(() => {
    const change = () => {
      const requested = location.hash.slice(1) || '/';
      const next = legacyRoutes[requested] || requested;
      if (next !== requested) history.replaceState(null, '', `#${next}`);
      setRoute(next); setMessage(''); window.scrollTo(0, 0);
    };
    if (legacyRoutes[location.hash.slice(1)]) change();
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); setStorageError(''); }
    catch { setStorageError('Browser storage is unavailable or full. Changes will last only for this session.'); }
  }, [data]);
  const add = (key, record) => { setData(old => ({ ...old, [key]: [{ ...record, id: uid() }, ...old[key]] })); setMessage('Saved in this browser.'); };
  const saveProfile = profile => {
    setData(old => ({ ...old, profile }));
    setMessage('Profile and materials saved in this browser.');
  };
  const completeAccount = profile => {
    setData(old => ({ ...old, profile, account: { id: uid(), createdAt: new Date().toISOString(), onboardingComplete: true } }));
    location.hash = '/';
  };
  const track = opportunity => { setSelected(opportunity); location.hash = '/apply'; };
  return <>
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6">
        <a href="#/" className="shrink-0 text-2xl font-bold tracking-tight" aria-label="Firmly AI dashboard">⚖ Firmly<span className="text-blue-300">AI</span></a>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-1">{navigation.map(([path, label]) => <a key={path} href={`#${path}`} aria-current={route === path ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm transition ${route === path ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{label}</a>)}{!data.account?.onboardingComplete && <a className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-50" href="#/signup" aria-current={route === '/signup' ? 'page' : undefined}>Create account</a>}</nav>
      </div>
    </header>
    <main className="mx-auto min-h-[75vh] max-w-6xl px-5 py-9 sm:py-12">
      {storageError && <p role="alert" className="notice mb-5">{storageError}</p>}
      {message && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">{message}</p>}
      {route === '/' ? <Dashboard data={data} />
        : route === '/profile' ? <Profile profile={data.profile} account={data.account} save={saveProfile} />
        : route === '/signup' ? data.account?.onboardingComplete ? <div className="card"><h1>You’re all set</h1><p className="mb-5 text-slate-500">Your mock account is ready. Update your documents any time in My Profile.</p><a className="btn" href="#/profile">Go to My Profile →</a></div> : <AccountSetup profile={data.profile} onComplete={completeAccount} />
        : route === '/discover' ? <Discover data={data} add={add} track={track} />
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
      <a className="btn bg-white text-blue-950 hover:bg-blue-50" href={data.account?.onboardingComplete ? '#/discover' : '#/signup'}>{data.account?.onboardingComplete ? 'Explore opportunities →' : 'Create your account →'}</a>{!data.account?.onboardingComplete && <a className="ml-5 inline-block py-3 text-sm text-blue-100 underline-offset-4 hover:underline" href="#/discover">Explore firms first →</a>}
    </section>
    <div className="mb-7 grid gap-5 md:grid-cols-3">{[
      ['DISCOVER', `${firms.length} firms`, `${data.opportunities.length} opportunity records. Verify dates with each firm.`, '/discover', 'Explore firms'],
      ['MY PROFILE', data.account?.onboardingComplete ? 'Ready when you are' : 'Set up once', 'Your resume and master cover letter, together in one place. Update them whenever you need.', data.account?.onboardingComplete ? '/profile' : '/signup', data.account?.onboardingComplete ? 'View my materials' : 'Set up my account'],
      ['APPLY', `${data.applications.length} tracked`, 'Keep your applications, progress, and next steps together.', '/apply', 'Track applications'],
    ].map(([label, title, text, href, action]) => <article className="card flex flex-col items-start" key={label}><span className="badge mb-5">{label}</span><h2>{title}</h2><p className="muted mb-6 flex-1">{text}</p><a href={`#${href}`} className="link text-sm">{action} →</a></article>)}</div>
    <div className="notice">This browser-based prototype stores your entries on this device. No live recruiting feed, automatic submissions, or AI service is connected. Existing local Flask records are separate.</div>
  </>;
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
