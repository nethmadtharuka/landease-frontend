import { useState } from 'react';
import { immigrationApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { TrendingUp, Shield, AlertTriangle, CheckCircle,
         XCircle, Lightbulb, Scale, Upload, FileCheck,
         Users, Gavel, FileWarning } from 'lucide-react';

const VISA_TYPES  = ['SkilledWorker','StudentVisa','FamilyReunification',
                     'InvestorVisa','HumanitarianVisa'];
const COUNTRIES   = ['Australia','Canada','UK','NewZealand','Germany'];
const EDU_LEVELS  = ['HighSchool','Diploma','Bachelor','Master','PhD'];
const LANG_TESTS  = ['None','IELTS','TOEFL','PTE','OET'];
const DOC_TYPES   = ['Passport','EmploymentLetter','BankStatement',
                     'LanguageCertificate','EducationCertificate','PreviousVisa'];

const initialForm = {
  visaType:'SkilledWorker', destinationCountry:'Australia',
  educationLevel:'Bachelor', yearsOfWorkExperience:3,
  jobTitle:'', hasJobOffer:false, languageTest:'IELTS',
  languageScore:6.5, annualIncome:50000, savingsAmount:20000,
  maritalStatus:'Single', hasFamilyInDestination:false,
  age:28, hasPriorVisaRefusal:false, hasCriminalRecord:false
};

const scoreColor    = (pct) => pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400';
const scoreBarColor = (pct) => pct >= 80 ? 'bg-green-500'  : pct >= 50 ? 'bg-yellow-500'  : 'bg-red-500';

const verdictStyle = (v) => ({
  APPROVE:    { text: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-700/40' },
  BORDERLINE: { text: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700/40' },
  REJECT:     { text: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-700/40' },
}[v] || { text: 'text-gray-400', bg: 'bg-gray-900/20', border: 'border-gray-700/40' });

// ── Document Upload Section ──────────────────────────────────────────────────
function DocumentUploadSection({ onFilesChange }) {
  const [files, setFiles] = useState([]);

  const handleFileChange = (docType, file) => {
    if (!file) return;
    const updated = [
      ...files.filter(f => f.docType !== docType),
      { docType, file }
    ];
    setFiles(updated);
    onFilesChange(updated);
  };

  return (
    <div className='card space-y-3'>
      <h3 className='font-semibold text-white flex items-center gap-2'>
        <Upload size={16} className='text-gold-400'/>
        Upload Documents
        <span className='text-xs text-gray-500 font-normal ml-1'>(optional)</span>
      </h3>
      <p className='text-xs text-gray-500'>
        Uploading documents enables AI verification and cross-checking
        against your profile. Each file should be a PDF.
      </p>
      <div className='space-y-2'>
        {DOC_TYPES.map(docType => {
          const uploaded = files.find(f => f.docType === docType);
          return (
            <div key={docType}
              className='flex items-center gap-3 p-2 rounded-lg
                         bg-navy-800/50 border border-navy-700'>
              <span className='text-sm text-gray-300 w-40 shrink-0'>
                {docType}
              </span>
              <label className='flex-1 cursor-pointer'>
                <input
                  type='file'
                  accept='.pdf'
                  className='hidden'
                  onChange={e => handleFileChange(docType, e.target.files[0])}
                />
                <span className='text-xs text-gray-500 hover:text-gold-400
                                 transition-colors'>
                  {uploaded ? uploaded.file.name : 'Choose PDF...'}
                </span>
              </label>
              {uploaded
                ? <FileCheck size={16} className='text-green-400 shrink-0'/>
                : <Upload size={14} className='text-gray-600 shrink-0'/>
              }
            </div>
          );
        })}
      </div>
      {files.length > 0 && (
        <p className='text-xs text-green-400'>
          {files.length} document{files.length > 1 ? 's' : ''} ready to upload
        </p>
      )}
    </div>
  );
}

// ── Document Results Section ─────────────────────────────────────────────────
function DocumentResults({ docResults, docFlags }) {
  if (!docResults || docResults.length === 0) return null;

  return (
    <div className='card space-y-3'>
      <h3 className='font-semibold text-white flex items-center gap-2'>
        <Shield size={16} className='text-blue-400'/>
        Document Verification
      </h3>

      {docFlags && docFlags.length > 0 && (
        <div className='bg-red-900/20 border border-red-700/40 rounded-lg p-3
                        space-y-1'>
          <p className='text-xs font-semibold text-red-400 flex items-center gap-1'>
            <FileWarning size={13}/> Issues Found
          </p>
          {docFlags.map((flag, i) => (
            <p key={i} className='text-xs text-red-300'>• {flag}</p>
          ))}
        </div>
      )}

      <div className='space-y-2'>
        {docResults.map((doc, i) => (
          <div key={i}
            className='p-3 rounded-lg bg-navy-800/50 border border-navy-700
                       space-y-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-white'>
                {doc.documentType}
              </span>
              <div className='flex items-center gap-2'>
                {doc.isExpired && (
                  <span className='text-xs text-red-400 bg-red-900/30
                                   px-2 py-0.5 rounded-full'>
                    Expired
                  </span>
                )}
                {doc.isComplete
                  ? <CheckCircle size={14} className='text-green-400'/>
                  : <XCircle    size={14} className='text-red-400'/>
                }
              </div>
            </div>
            {doc.expiryDate && (
              <p className='text-xs text-gray-500'>Expiry: {doc.expiryDate}</p>
            )}
            {doc.inconsistencies?.length > 0 && (
              <div className='mt-1 space-y-0.5'>
                {doc.inconsistencies.map((issue, j) => (
                  <p key={j} className='text-xs text-yellow-400'>⚠ {issue}</p>
                ))}
              </div>
            )}
            {doc.missingFields?.length > 0 && (
              <div className='mt-1 space-y-0.5'>
                {doc.missingFields.map((field, j) => (
                  <p key={j} className='text-xs text-red-400'>✗ Missing: {field}</p>
                ))}
              </div>
            )}
            <p className='text-xs text-gray-600'>
              Method: {doc.extractionMethod}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Debate Transcript Section ────────────────────────────────────────────────
function DebateTranscript({ debate }) {
  const [expanded, setExpanded] = useState(null);
  if (!debate) return null;

  const style = verdictStyle(debate.consensusVerdict);

  return (
    <div className='card space-y-4'>
      <h3 className='font-semibold text-white flex items-center gap-2'>
        <Users size={16} className='text-purple-400'/>
        Multi-Agent Debate
      </h3>

      {/* Consensus Banner */}
      <div className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xs text-gray-400 mb-1'>Consensus Verdict</p>
            <p className={`text-2xl font-display font-bold ${style.text}`}>
              {debate.consensusVerdict}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-xs text-gray-400 mb-1'>Confidence</p>
            <p className={`text-2xl font-bold ${style.text}`}>
              {debate.consensusConfidence}%
            </p>
          </div>
        </div>
        <div className='flex gap-4 mt-3 pt-3 border-t border-white/10'>
          <div className='text-center'>
            <p className='text-xs text-gray-500'>Judge score</p>
            <p className={`text-sm font-semibold ${
              debate.judgeQualityScore >= 70 ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {debate.judgeQualityScore}/100
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-500'>Debate rounds</p>
            <p className='text-sm font-semibold text-white'>
              {debate.debateRoundsUsed}
              {debate.debateRoundsUsed === 3 &&
                <span className='text-xs text-yellow-400 ml-1'>(Reflexion)</span>
              }
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-500'>Round 1 split</p>
            <p className='text-sm font-semibold text-white'>
              {debate.round1Verdicts?.map(v => v.verdict[0]).join(' / ')}
            </p>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className='space-y-2'>
        <p className='text-xs text-gray-500 uppercase tracking-wide'>
          Final round agent verdicts
        </p>
        {debate.round2Verdicts?.map((agent, i) => {
          const s = verdictStyle(agent.verdict);
          const isOpen = expanded === i;
          return (
            <div key={i}
              className={`rounded-xl border ${s.bg} ${s.border} overflow-hidden`}>
              <button
                className='w-full p-3 flex items-center justify-between
                           text-left'
                onClick={() => setExpanded(isOpen ? null : i)}>
                <div className='flex items-center gap-3'>
                  <Gavel size={14} className={s.text}/>
                  <div>
                    <p className='text-sm font-medium text-white'>
                      {agent.agentName}
                    </p>
                    <p className={`text-xs ${s.text}`}>
                      {agent.verdict} — {agent.confidence}% confident
                    </p>
                  </div>
                </div>
                <span className='text-gray-500 text-xs'>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {isOpen && (
                <div className='px-4 pb-4 space-y-3 border-t border-white/10
                                pt-3'>
                  <div>
                    <p className='text-xs text-gray-400 mb-1'>Reasoning</p>
                    <p className='text-sm text-gray-300'>{agent.reasoning}</p>
                  </div>

                  {agent.criticalWeaknesses?.length > 0 && (
                    <div>
                      <p className='text-xs text-gray-400 mb-1'>
                        Critical weaknesses
                      </p>
                      <ul className='space-y-0.5'>
                        {agent.criticalWeaknesses.map((w, j) => (
                          <li key={j} className='text-xs text-red-300'>
                            • {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {agent.questionsForDebate?.length > 0 && (
                    <div>
                      <p className='text-xs text-gray-400 mb-1'>
                        Questions raised
                      </p>
                      <ul className='space-y-0.5'>
                        {agent.questionsForDebate.map((q, j) => (
                          <li key={j} className='text-xs text-purple-300'>
                            ? {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Round 1 vs Round 2 comparison */}
      {debate.round1Verdicts && (
        <div className='bg-navy-800/50 rounded-lg p-3 border border-navy-700'>
          <p className='text-xs text-gray-500 mb-2'>
            How verdicts changed round 1 → round 2
          </p>
          <div className='space-y-1'>
            {debate.round1Verdicts.map((r1, i) => {
              const r2 = debate.round2Verdicts?.[i];
              const changed = r2 && r1.verdict !== r2.verdict;
              return (
                <div key={i}
                  className='flex items-center gap-2 text-xs'>
                  <span className='text-gray-400 w-36 truncate'>
                    {r1.agentName}
                  </span>
                  <span className={verdictStyle(r1.verdict).text}>
                    {r1.verdict}
                  </span>
                  <span className='text-gray-600'>→</span>
                  <span className={verdictStyle(r2?.verdict).text}>
                    {r2?.verdict}
                  </span>
                  {changed && (
                    <span className='text-yellow-400 ml-1'>changed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ImmigrationPredictorPage() {
  const [form, setForm]       = useState(initialForm);
  const [files, setFiles]     = useState([]);
  const [result, setResult]   = useState(null);
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
      const res = await immigrationApi.analyze(form, files);
      setResult(res.data.data);
      toast.success('Profile analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed.');
    } finally { setLoading(false); }
  };

  const overallPct = result ? result.overallScore : 0;

  return (
    <div className='space-y-6 max-w-6xl mx-auto'>
      {/* Header */}
      <div>
        <h1 className='section-title flex items-center gap-3'>
          <Scale className='text-gold-400' size={28}/>
          Immigration Case Predictor
        </h1>
        <p className='section-subtitle'>
          Analyse your profile strength based on published immigration criteria.
          Upload documents for AI-powered verification.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className='bg-yellow-900/20 border border-yellow-700 rounded-xl p-4
                      flex items-start gap-3'>
        <AlertTriangle size={20} className='text-yellow-400 shrink-0 mt-0.5'/>
        <p className='text-yellow-300 text-sm'>
          <strong>Important Disclaimer:</strong> This tool provides estimated
          analysis based on publicly available immigration criteria only. Results
          are NOT guaranteed and do NOT constitute legal advice. Always consult
          a licensed immigration lawyer before submitting any application.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left column: form + document upload */}
        <div className='space-y-4'>
          <div className='card space-y-4'>
            <h2 className='text-lg font-display font-bold text-white'>
              Your Profile
            </h2>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='label'>Visa Type</label>
                <select className='input' value={form.visaType}
                  onChange={set('visaType')}>
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

            <div className='space-y-2'>
              {[
                ['hasJobOffer',            'I have a job offer in the destination country'],
                ['hasFamilyInDestination', 'I have family members in the destination country'],
                ['hasPriorVisaRefusal',    'I have had a prior visa refusal'],
                ['hasCriminalRecord',      'I have a criminal record'],
              ].map(([field, label]) => (
                <label key={field}
                  className='flex items-center gap-3 text-sm text-gray-300
                             cursor-pointer'>
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
                    Analysing with AI debate...</>
                : <><TrendingUp size={18}/> Analyse My Profile</>}
            </button>
          </div>

          {/* Document Upload */}
          <DocumentUploadSection onFilesChange={setFiles}/>
        </div>

        {/* Right column: results */}
        <div>
          {!result && !loading && (
            <div className='card h-full flex flex-col items-center
                           justify-center text-center py-20'>
              <TrendingUp size={48} className='text-gray-600 mb-4'/>
              <p className='text-gray-400'>Fill in your profile and click</p>
              <p className='text-gray-400'>Analyse to see your results.</p>
            </div>
          )}

          {loading && (
            <div className='card h-full flex flex-col items-center
                           justify-center text-center py-20 space-y-3'>
              <div className='w-10 h-10 border-2 border-purple-500
                             border-t-transparent rounded-full animate-spin'/>
              <p className='text-gray-400 text-sm'>Running multi-agent debate...</p>
              <p className='text-gray-600 text-xs'>
                3 AI agents are assessing your profile
              </p>
            </div>
          )}

          {result && (
            <div className='space-y-4 animate-slide-up'>
              {/* Overall Score */}
              <div className='card text-center'>
                <p className='text-gray-400 text-sm mb-2'>
                  Overall Profile Score
                </p>
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
                <h3 className='font-semibold text-white'>
                  Category Breakdown
                </h3>
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

              {/* Document Verification — new */}
              {result.documentsVerified && (
                <DocumentResults
                  docResults={result.documentResults}
                  docFlags={result.documentFlags}
                />
              )}

              {/* Debate Transcript — new */}
              {result.debateSummary && (
                <DebateTranscript debate={result.debateSummary}/>
              )}

              {/* Strengths */}
              {result.strengths?.length > 0 && (
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
              {result.suggestions?.length > 0 && (
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