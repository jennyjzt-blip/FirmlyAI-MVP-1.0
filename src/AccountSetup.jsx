import { useState } from 'react';
import MaterialsEditor from './MaterialsEditor.jsx';

export default function AccountSetup({ profile, onComplete }) {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState(profile);
  return <div className="mx-auto max-w-3xl">
    <div className="mb-8"><span className="badge mb-4">WELCOME TO FIRMLY AI</span><h1>Create your account</h1><p className="text-slate-500">A little setup now. A clearer path to your next opportunity.</p><p className="mt-4 text-sm text-slate-500">Mock signup · Saved on this device · No password needed</p></div>
    <ol aria-label="Account setup progress" className="mb-8 grid grid-cols-2 gap-3 text-sm font-semibold"><li aria-current={step === 1 ? 'step' : undefined} className={`rounded-lg p-3 ${step === 1 ? 'bg-blue-900 text-white' : 'bg-blue-50 text-blue-900'}`}>1. About you</li><li aria-current={step === 2 ? 'step' : undefined} className={`rounded-lg p-3 ${step === 2 ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-500'}`}>2. Application materials</li></ol>
    {step === 1 ? <form className="card space-y-5" onSubmit={event => { event.preventDefault(); const entered = Object.fromEntries(new FormData(event.currentTarget)); setDetails(old => ({ ...old, ...entered })); setStep(2); window.scrollTo(0, 0); }}>
      <h2>Let’s get to know you</h2><label>Full name<input name="name" autoComplete="name" required pattern=".*\S.*" defaultValue={details.name || ''} /></label><label>Email address<input name="email" type="email" autoComplete="email" required defaultValue={details.email || ''} /></label><label>Law school (optional)<input name="school" autoComplete="organization" defaultValue={details.school || ''} /></label><button className="btn">Continue to materials →</button>
    </form> : <MaterialsEditor profile={details} onboarding onBack={() => setStep(1)} onSave={onComplete} />}
  </div>;
}
