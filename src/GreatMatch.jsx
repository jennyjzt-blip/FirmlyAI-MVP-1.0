import { greatMatches, localOpportunities, sampleOpportunities } from './workflow.js';

export default function GreatMatch({ data }) {
  const matches = greatMatches(data.profile, [...data.opportunities, ...localOpportunities, ...sampleOpportunities], data.applications);
  return <section className="mb-8" aria-labelledby="great-match-title">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><span className="badge mb-3">CURATED AROUND YOU</span><h2 id="great-match-title" className="mb-2 text-2xl">Great match</h2><p className="muted">Opportunities appear here automatically as your saved preferences and resume change.</p></div><a className="link text-sm" href="#/profile">Edit matching preferences →</a></div>
    <div className="grid gap-4 md:grid-cols-3">{matches.map(item => <article key={item.id} className="card flex flex-col items-start border-orange-200"><span className="mb-4 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-900">{item.score ? '✦ Great match' : 'Suggested to explore'}</span><h3 className="text-lg font-bold">{item.title}</h3><p className="mb-1 font-medium">{item.firm}</p><p className="muted mb-4">{item.office}</p><ul className="mb-5 flex-1 space-y-2 text-sm text-stone-600">{item.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul><p className="muted mb-4">{item.sample ? 'Sample role · not a verified opening' : 'Firm-listed program · confirm current availability'}</p><a className="btn secondary" href={`#/discover?q=${encodeURIComponent(item.firm)}`}>Review opportunity →</a></article>)}</div>
    {!matches.length && <p className="card muted">You’ve already added every available opportunity to Track. Add more in Discover to see new matches.</p>}
    <p className="muted mt-3">Matches reflect interests and location, not an eligibility assessment. Nothing is applied to automatically.</p>
  </section>;
}
