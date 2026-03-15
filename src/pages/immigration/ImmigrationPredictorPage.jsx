import { useState } from 'react';
import { immigrationApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { TrendingUp, Shield, AlertTriangle,
         CheckCircle, XCircle, Lightbulb, Scale } from 'lucide-react';

const VISA_TYPES = ['SkilledWorker','StudentVisa','FamilyReunification',
                    'InvestorVisa','HumanitarianVisa'];
const COUNTRIES  = ['Australia','Canada','UK','NewZealand','Germany'];
const EDU_LEVELS = ['HighSchool','Diploma','Bachelor','Master','PhD'];
const LANG_TESTS = ['None','IELTS','TOEFL','PTE','OET'];

const initialForm = {
  visaType:'SkilledWorker', destinationCountry:'Australia',
  educationLevel:'Bachelor', yearsOfWorkExperience:3,
  jobTitle:'', hasJobOffer:false, languageTest:'IELTS',
  languageScore:6.5, annualIncome:50000, savingsAmount:20000,
  maritalStatus:'Single', hasFamilyInDestination:false,
  age:28, hasPriorVisaRefusal:false, hasCriminalRecord:false
};

const scoreColor = (pct) =>
  pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400';
const scoreBarColor = (pct) =>
  pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

export default function ImmigrationPredictorPage() {
  const [form, setForm]     = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked
              : e.target.type === 'number'   ? parseFloat(e.target.value)||0
              : e.target.value;
    setForm(prev => ({ ...prev, [f]: val }));
  };

  const handleAnalyze = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await immigrationApi.analyze(form);
      setResult(res.data.data);
      toast.success('Profile analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed.');
    } finally { setLoading(false); }
  };

  const overallPct = result ? result.overallScore : 0;

  return (
    <div className='space-y-6 max-w-5xl mx-auto'>
      {/* Header */}
      <div>
        <h1 className='section-title flex items-center gap-3'>
          <Scale className='text-gold-400' size={28}/>
          Immigration Case Predictor
        </h1>
        <p className='section-subtitle'>
          Analyse your profile strength based on published immigration criteria.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className='bg-yellow-900/20 border border-yellow-700 rounded-xl p-4
                      flex items-start gap-3'>
        <AlertTriangle size={20} className='text-yellow-400 shrink-0 mt-0.5'/>
        <p className='text-yellow-300 text-sm'>
          <strong>Important Disclaimer:</strong> This tool provides estimated analysis
          based on publicly available immigration criteria only. Results are NOT
          guaranteed and do NOT constitute legal advice. Always consult a licensed
          immigration lawyer before submitting any application.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Form */}
        <div className='card space-y-4'>
          <h2 className='text-lg font-display font-bold text-white'>
            Your Profile
          </h2>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='label'>Visa Type</label>
              <select className='input' value={form.visaType} onChange={set('visaType')}>
                {VISA_TYPES.map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className='label'>Destination</label>
              <select className='input' value={form.destinationCountry}
                onChange={set('destinationCountry')}>
                {COUNTRIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='label'>Education Level</label>
              <select className='input' value={form.educationLevel}
                onChange={set('educationLevel')}>
                {EDU_LEVELS.map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className='label'>Age</label>
              <input type='number' className='input'
                value={form.age} onChange={set('age')}/>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='label'>Years Experience</label>
              <input type='number' className='input'
                value={form.yearsOfWorkExperience}
                onChange={set('yearsOfWorkExperience')}/>
            </div>
            <div>
              <label className='label'>Language Test</label>
              <select className='input' value={form.languageTest}
                onChange={set('languageTest')}>
                {LANG_TESTS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {form.languageTest !== 'None' && (
            <div>
              <label className='label'>Language Score</label>
              <input type='number' step='0.5' className='input'
                value={form.languageScore} onChange={set('languageScore')}/>
            </div>
          )}

          <div>
            <label className='label'>Savings Amount (USD)</label>
            <input type='number' className='input'
              value={form.savingsAmount} onChange={set('savingsAmount')}/>
          </div>

          {/* Checkboxes */}
          <div className='space-y-2'>
            {[
              ['hasJobOffer',            'I have a job offer in the destination country'],
              ['hasFamilyInDestination', 'I have family members in the destination country'],
              ['hasPriorVisaRefusal',    'I have had a prior visa refusal'],
              ['hasCriminalRecord',      'I have a criminal record'],
            ].map(([field, label]) => (
              <label key={field}
                className='flex items-center gap-3 text-sm text-gray-300 cursor-pointer'>
                <input type='checkbox' checked={form[field]}
                  onChange={set(field)}
                  className='w-4 h-4 accent-yellow-500'/>
                {label}
              </label>
            ))}
          </div>

          <button onClick={handleAnalyze} disabled={loading}
            className='btn-primary w-full flex items-center justify-center gap-2'>
            {loading
              ? <><div className='w-5 h-5 border-2 border-navy-950
                       border-t-transparent rounded-full animate-spin'/>
                  Analysing...</>
              : <><TrendingUp size={18}/> Analyse My Profile</>}
          </button>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div className='card h-full flex flex-col items-center
                           justify-center text-center py-20'>
              <TrendingUp size={48} className='text-gray-600 mb-4'/>
              <p className='text-gray-400'>Fill in your profile and click</p>
              <p className='text-gray-400'>Analyse to see your results.</p>
            </div>
          )}

          {result && (
            <div className='space-y-4 animate-slide-up'>
              {/* Overall Score */}
              <div className='card text-center'>
                <p className='text-gray-400 text-sm mb-2'>Overall Profile Score</p>
                <p className={`text-6xl font-display font-bold
                               ${scoreColor(overallPct)}`}>
                  {result.overallScore}
                  <span className='text-2xl text-gray-500'>/100</span>
                </p>
                <p className='text-lg font-semibold text-white mt-2'>
                  {result.strengthLevel}
                </p>
                <p className='text-xs text-gray-500 mt-2'>
                  {result.publishedApprovalRate}
                </p>
              </div>

              {/* Category Bars */}
              <div className='card space-y-3'>
                <h3 className='font-semibold text-white'>Category Breakdown</h3>
                {result.categories.map(cat => {
                  const pct = Math.round(cat.score * 100 / cat.maxScore);
                  return (
                    <div key={cat.category}>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='text-gray-300'>{cat.category}</span>
                        <span className={scoreColor(pct)}>
                          {cat.score}/{cat.maxScore}
                        </span>
                      </div>
                      <div className='w-full bg-navy-700 rounded-full h-2'>
                        <div
                          className={`h-2 rounded-full ${scoreBarColor(pct)}
                                     transition-all duration-700`}
                          style={{width:`${pct}%`}}/>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>{cat.note}</p>
                    </div>
                  );
                })}
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className='card border-green-800/40 bg-green-900/10'>
                  <h3 className='font-semibold text-green-400 flex items-center
                                gap-2 mb-3'>
                    <CheckCircle size={16}/> Strengths
                  </h3>
                  <ul className='space-y-1'>
                    {result.strengths.map((s,i) => (
                      <li key={i} className='text-sm text-gray-300'>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className='card border-gold-500/20 bg-gold-500/5'>
                  <h3 className='font-semibold text-gold-400 flex items-center
                                gap-2 mb-3'>
                    <Lightbulb size={16}/> Suggestions to Strengthen
                  </h3>
                  <ul className='space-y-1'>
                    {result.suggestions.map((s,i) => (
                      <li key={i} className='text-sm text-gray-300'>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className='card bg-navy-900/50 border-navy-700'>
                <p className='text-xs text-gray-500 leading-relaxed'>
                  ⚖️ {result.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
