import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, X, Sparkles, Search } from 'lucide-react';
import { placeApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';
import { IMG } from '../../lib/media';
import { dateTime } from '../../lib/format';

const MAX_BYTES = 5 * 1024 * 1024; // PlaceRecognitionService.MaxImageBytes
const MAX_EDGE = 2048;

// Downscale large photos in the browser (keeps uploads small and under the 5 MB limit); returns a JPEG/PNG data URL.
async function toDataUrl(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const mime = blob.type === 'image/png' && scale === 1 ? 'image/png' : 'image/jpeg';
    return { dataUrl: canvas.toDataURL(mime, 0.88), mime };
  } finally { URL.revokeObjectURL(url); }
}

export default function PlaceRecognitionPage() {
  const input = useRef(null);
  const [photo, setPhoto] = useState(null); // { dataUrl, mime, name }
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  const accept = async (blob, name) => {
    setError(''); setResult(null);
    if (!blob) return;
    if (!['image/jpeg', 'image/png'].includes(blob.type)) { setError('Use a JPG or PNG photo.'); return; }
    if (blob.size > MAX_BYTES * 4) { setError('That photo is too large. Use one under 20 MB.'); return; }
    try { setPhoto({ ...(await toDataUrl(blob)), name }); } catch { setError('That image could not be read.'); }
  };
  const sample = async () => {
    const res = await fetch(IMG.tokyoTower);
    accept(await res.blob(), 'Sample: Tokyo Tower');
  };
  const identify = async () => {
    setLoading(true); setError('');
    try {
      const res = await placeApi.recognize({ imageBase64: photo.dataUrl, mimeType: photo.mime });
      setResult(res.data.data);
    } catch (err) {
      const code = err.response?.data?.errorCode;
      setError(code === 'ai_blocked' ? 'We can’t analyse this image.' : apiErrorMessage(err, 'We couldn’t identify this photo. Please try again.'));
    } finally { setLoading(false); }
  };
  const unknown = result && (!result.placeName || result.placeName === 'Place Detected') && !result.city && !result.country;

  return (
    <div>
      <h1 className="page-title">Explore with a photo</h1>
      <p className="page-sub text-[17px]">Upload or take a photo of a landmark to learn what it is.</p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-5 mt-6 items-start">
        <div className="card p-5">
          {photo ? (
            <div className="relative rounded-[18px] overflow-hidden bg-canvas">
              <img src={photo.dataUrl} alt={photo.name} className="w-full max-h-[380px] object-contain" />
              <button type="button" onClick={() => { setPhoto(null); setResult(null); }} aria-label="Remove photo" className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-pill inline-flex items-center justify-center"><X size={17} /></button>
            </div>
          ) : (
            <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files[0], e.dataTransfer.files[0]?.name); }}
              className={`rounded-[18px] border border-dashed min-h-[320px] flex flex-col items-center justify-center text-center p-6 ${drag ? 'border-electric bg-[#F8F9FF]' : 'border-[#B8C2D0] bg-[#F5F8FC]'}`}>
              <span className="w-14 h-14 rounded-full bg-electric-50 text-electric inline-flex items-center justify-center"><Camera size={22} /></span>
              <p className="font-semibold text-[18px] mt-4">Drop a photo or choose one</p>
              <p className="text-muted text-[14.5px] mt-1">JPG or PNG, up to 5 MB. On a phone this opens your camera.</p>
              <button type="button" onClick={() => input.current?.click()} className="btn-ink btn-sm mt-4 h-10">Choose photo</button>
              <input ref={input} type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" aria-label="Choose a photo"
                onChange={e => { accept(e.target.files[0], e.target.files[0]?.name); e.target.value = ''; }} />
            </div>
          )}
          {photo ? <button type="button" onClick={identify} disabled={loading} className="btn-ink w-full h-12 mt-4">{loading && <span className="spinner w-4 h-4" />}{loading ? 'Identifying…' : 'Identify place'}</button>
            : <button type="button" onClick={sample} className="btn-ghost w-full h-12 mt-4">Try with a sample photo</button>}
          {error && <p role="alert" className="field-error text-[14.5px]">{error}</p>}
          <p className="text-[14px] text-muted mt-3">Your photo is sent to Google Gemini and isn&apos;t stored by LandEase.</p>
        </div>

        <div className="card p-6" aria-live="polite">
          {loading ? (
            <div className="space-y-3" aria-busy="true"><div className="skeleton h-8 w-1/2" /><div className="skeleton h-4 w-1/3" /><div className="skeleton h-20" /><div className="skeleton h-20" /></div>
          ) : result ? (
            <div>
              <p className="text-[14px] font-semibold text-electric">{unknown ? 'Place described' : 'Identified'}</p>
              <h2 className="display text-[32px] mt-1">{unknown ? 'We couldn’t identify a specific landmark' : result.placeName}</h2>
              {(result.city || result.country) && <p className="text-muted">{[result.city, result.country].filter(Boolean).join(' · ')}</p>}
              <p className="text-[16.5px] mt-4">{result.description}</p>
              {[['History', result.history], ['Famous for', result.famousFor], ['Travel tips', result.travelTips]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="rounded-[16px] bg-[#F5F8FC] px-4 py-3 mt-3"><h3 className="font-sans font-semibold text-[15px] tracking-normal">{k}</h3><p className="text-muted mt-1">{v}</p></div>
              ))}
              <p className="text-[13.5px] text-muted mt-4">AI-generated · {dateTime(result.recognizedAt)}</p>
              <div className="flex flex-wrap gap-2 mt-5">
                {!unknown && <Link to={`/dashboard/ai-chat?q=${encodeURIComponent(`Tell me more about ${result.placeName}${result.city ? ` in ${result.city}` : ''}.`)}`} className="btn-ink btn-sm h-10"><Sparkles size={15} />Ask the assistant</Link>}
                {result.country && <Link to={`/dashboard/services?destinationCountry=${encodeURIComponent(result.country)}`} className="btn-ghost btn-sm h-10"><Search size={15} />Services in {result.country}</Link>}
                <button type="button" onClick={() => { setPhoto(null); setResult(null); }} className="btn-ghost btn-sm h-10">Try another photo</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4"><h2 className="text-[26px]">Results appear here</h2><p className="text-muted text-[17px] mt-1">Works best with well-known landmarks, buildings and monuments.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
