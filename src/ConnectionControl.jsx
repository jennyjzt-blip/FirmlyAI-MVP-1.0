import { useState } from 'react';
import useDialog from './useDialog.js';

export default function ConnectionControl({ kind, data, setData }) {
  const [open, setOpen] = useState(false);
  const ref = useDialog(open, () => setOpen(false));
  const connection = data.integrations?.[kind];
  const email = kind === 'email';
  const label = email ? 'Connect to email' : 'Connect your calendar';
  return <><div className="flex flex-wrap items-center gap-2"><button className="btn secondary px-3 py-2 text-xs" onClick={() => setOpen(true)}>{connection ? `${connection.provider} · demo connected` : label}</button>{connection && <button className="link text-xs" onClick={() => setData(old => ({ ...old, integrations: { ...old.integrations, [kind]: null } }))}>Disconnect</button>}</div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-brandInk/60 p-5"><form ref={ref} role="dialog" aria-modal="true" aria-labelledby={`connect-${kind}-title`} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6" onSubmit={event => { event.preventDefault(); const provider = new FormData(event.currentTarget).get('provider'); setData(old => ({ ...old, integrations: { ...old.integrations, [kind]: { provider, mode: 'demo', connectedAt: new Date().toISOString() } } })); setOpen(false); }}><div className="flex justify-between gap-3"><h2 id={`connect-${kind}-title`}>{label}</h2><button className="link self-start" type="button" onClick={() => setOpen(false)}>Cancel</button></div><p className="muted">{email ? 'Preview how interview emails could update your application timeline.' : 'Preview how your interviews and follow-ups could sync with your personal calendar.'}</p><label>Provider<select name="provider" defaultValue={connection?.provider}>{(email ? ['Gmail', 'Outlook'] : ['Google Calendar', 'Outlook Calendar', 'Apple Calendar']).map(provider => <option key={provider}>{provider}</option>)}</select></label><p className="notice">Mock connection only. No account is authorized, no email is read, and no calendar events are synced.</p><button className="btn">Connect demo</button></form></div>}
  </>;
}
