import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, CheckCircle, AlertTriangle, Download, Shield } from 'lucide-react';

export default function DocumentVersionHistory({ entityType, entityId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    if (entityType && entityId) fetchVersions();
  }, [entityType, entityId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents', { params: { entity_type: entityType, entity_id: entityId } });
      setVersions(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleVerify = async (versionId) => {
    try {
      const res = await api.get(`/documents/${versionId}/verify`);
      setVerifyResult({ id: versionId, ...res.data });
    } catch (err) {
      setVerifyResult({ id: versionId, valid: false, reason: 'Verification failed.' });
    }
  };

  if (loading) return <div className="text-xs text-gray-400">Loading document history...</div>;
  if (versions.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Document Version History</h4>
      </div>
      <div className="space-y-2">
        {versions.map(v => (
          <div key={v.id} className="flex items-center justify-between bg-white rounded-lg border px-3 py-2">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${v.is_current ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                v{v.version} {v.is_current && '(Current)'}
              </span>
              <div>
                <p className="text-xs font-medium text-gray-700">{v.document_type}</p>
                <p className="text-[10px] text-gray-400 font-mono">{v.file_hash?.slice(0, 16)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleDateString()}</span>
              <button onClick={() => handleVerify(v.id)} className="p-1 text-gray-400 hover:text-blue-600 transition" title="Verify integrity">
                <Shield className="w-3.5 h-3.5" />
              </button>
              {verifyResult?.id === v.id && (
                verifyResult.valid
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
