import { CheckCircle, XCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import publicApi from '../../services/publicApi';

export default function BlockchainVerifier() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    try {
      const res = await publicApi.get('/blockchain/verify');
      setResult(res.data);
    } catch {
      setResult({ valid: false, errors: -1, blocks_checked: 0 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50">
            <ShieldCheck size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Blockchain Integrity</h3>
            <p className="text-[11px] text-slate-400">Verify the audit chain has not been tampered with</p>
          </div>
        </div>
        <button
          onClick={verify}
          disabled={loading}
          className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : null}
          {loading ? 'Verifying...' : 'Verify Chain'}
        </button>
      </div>

      {result && (
        <div className={`mt-4 rounded-lg border p-3.5 flex items-center gap-3 ${result.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          {result.valid
            ? <CheckCircle className="text-emerald-600 shrink-0" size={18} />
            : <XCircle className="text-red-600 shrink-0" size={18} />
          }
          <div>
            <p className={`text-sm font-semibold ${result.valid ? 'text-emerald-800' : 'text-red-800'}`}>
              {result.valid ? 'Chain Integrity Verified' : 'Chain Integrity Failed'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {result.blocks_checked} blocks checked — {result.errors} error(s) detected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
