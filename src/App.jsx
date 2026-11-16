import { useEffect, useState } from 'react';
import { emptyData, firms } from './data.js';
import Workshop from './Workshop.jsx';
import Discover from './Discover.jsx';
import Track from './Track.jsx';
import AccountSetup from './AccountSetup.jsx';
import Profile from './Profile.jsx';

const storageKey = 'firmly-ai-v1';
const navigation = [['/', 'Dashboard'], ['/discover', 'Discover'], ['/workshop', 'Workshop'], ['/track', 'Track'], ['/profile', 'My Profile']];
const legacyRoutes = { '/apply': '/track', '/prepare': '/workshop', '/prepare/upload': '/workshop', '/discover/monitor': '/' };
const uid = () => crypto.randomUUID();
export default function App() {
  const [route, setRoute] = useState(legacyRoutes[location.hash.slice(1)] || location.hash.slice(1) || '/');
  const [storageError, setStorageError] = useState('');
  const [message, setMessage] = useState('');
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
  const saveProfile = profile => {
    setData(old => ({ ...old, profile }));
    setMessage('Profile and materials saved in this browser.');
  };
  const completeAccount = profile => {
    setData(old => ({ ...old, profile, account: { id: uid(), createdAt: new Date().toISOString(), onboardingComplete: true } }));
    location.hash = '/';
  };
  return <>
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6">
        <a href="#/" className="shrink-0 text-2xl font-bold tracking-tight" aria-label="Firmly AI dashboard">⚖ Firmly<span className="text-blue-300">AI</span></a>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-1">{navigation.map(([path, label]) => <a key={path} href={`#${path}`} aria-current={route === path ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm transition ${route === path ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{label}</a>)}{!data.account?.onboardingComplete && <a className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-50" href="#/signup" aria-current={route === '/signup' ? 'page' : undefined}>Create account</a>}</nav>
      </div>
    </header>
    <main className="mx-auto min-h-[75vh] max-w-7xl px-5 py-9 sm:py-12">
      {storageError && <p role="alert" className="notice mb-5">{storageError}</p>}
      {message && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">{message}</p>}
      {route === '/' ? <Dashboard data={data} />
        : route === '/profile' ? <Profile profile={data.profile} account={data.account} save={saveProfile} />
        : route === '/signup' ? data.account?.onboardingComplete ? <div className="card"><h1>You’re all set</h1><p className="mb-5 text-slate-500">Your mock account is ready. Update your documents any time in My Profile.</p><a className="btn" href="#/profile">Go to My Profile →</a></div> : <AccountSetup profile={data.profile} onComplete={completeAccount} />
        : route === '/discover' ? <Discover data={data} setData={setData} />
        : route === '/workshop' ? <Workshop data={data} setData={setData} />
        : route === '/track' ? <Track data={data} setData={setData} />
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
      ['WORKSHOP', 'Make it personal', 'Save your resume, transcript, and master letter. Tailor each application around your experience and connections.', '/workshop', 'Open Workshop'],
      ['TRACK', `${data.applications.length} tracked`, 'Follow your application activity and schedule interviews and conversations on your calendar.', '/track', 'Open Track'],
    ].map(([label, title, text, href, action]) => <article className="card flex flex-col items-start" key={label}><span className="badge mb-5">{label}</span><h2>{title}</h2><p className="muted mb-6 flex-1">{text}</p><a href={`#${href}`} className="link text-sm">{action} →</a></article>)}</div>
    <div className="notice">This browser-based prototype stores your entries on this device. No live recruiting feed, automatic submissions, or AI service is connected. Existing local Flask records are separate.</div>
  </>;
}
