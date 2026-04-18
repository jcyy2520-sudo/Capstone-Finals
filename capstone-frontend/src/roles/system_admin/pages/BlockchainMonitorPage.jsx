import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../../services/api';

export default function BlockchainMonitorPage() {
  const [events, setEvents] = useState([]);
  const [chainStatus, setChainStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [eventsRes, chainRes] = await Promise.allSettled([
          api.get('/blockchain/events', { params: { page } }),
          page === 1 ? api.get('/blockchain/verify-chain') : Promise.resolve({ data: chainStatus }),
        ]);
        setEvents(eventsRes.status === 'fulfilled' ? (eventsRes.value.data.data || []) : []);
        setLastPage(eventsRes.status === 'fulfilled' ? (eventsRes.value.data.last_page || 1) : 1);
        if (page === 1 && chainRes.status === 'fulfilled') setChainStatus(chainRes.value.data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  async function reVerify() {
    setVerifying(true);
    try {
      const { data } = await api.get('/blockchain/verify-chain');
      setChainStatus(data);
    } catch { /* silent */ } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Blockchain Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable event ledger, chain integrity verification, and block-level inspection.</p>
        </div>
        <button onClick={reVerify} disabled={verifying}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400">
          <RefreshCw size={14} className={verifying ? 'animate-spin' : ''} /> Re-verify Chain
        </button>
      </div>

      {/* Chain Integrity Banner */}
      {chainStatus && (
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${chainStatus.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {chainStatus.valid ? <CheckCircle className="text-green-600" size={24} /> : <XCircle className="text-red-600" size={24} />}
          <div>
            <p className="font-semibold text-sm">{chainStatus.valid ? 'Chain Integrity Verified — No tampering detected' : 'CHAIN INTEGRITY FAILURE — Investigate immediately'}</p>
            <p className="text-xs text-gray-600 mt-0.5">{chainStatus.blocks_checked ?? 0} blocks verified &bull; {chainStatus.errors ?? 0} error(s)</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Blocks Checked</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{chainStatus?.blocks_checked ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Integrity Errors</p>
          <p className={`text-2xl font-bold mt-2 ${(chainStatus?.errors ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>{chainStatus?.errors ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Events on Page</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{events.length}</p>
        </div>
      </div>

      {/* Event Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Event Ledger</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading blockchain events...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No blockchain events recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Block</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Event</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Entity</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Actor</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Document Hash</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Block Hash</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((evt) => (
                  <tr key={evt.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedEvent?.id === evt.id ? 'bg-violet-50' : ''}`}
                    onClick={() => setSelectedEvent(selectedEvent?.id === evt.id ? null : evt)}>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold">#{evt.block_number}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{(evt.event_type || '').replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{evt.entity_type} #{evt.entity_id}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{evt.actor?.name || `User #${evt.actor_id}`}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400 max-w-[100px] truncate" title={evt.document_hash}>{evt.document_hash?.substring(0, 12) || '—'}...</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400 max-w-[100px] truncate" title={evt.block_hash}>{evt.block_hash?.substring(0, 12)}...</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{new Date(evt.created_at).toLocaleString('en-PH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-sm text-blue-600 disabled:text-gray-300">Previous</button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
              className="text-sm text-blue-600 disabled:text-gray-300">Next</button>
          </div>
        )}
      </div>

      {/* Block Detail Panel */}
      {selectedEvent && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Block #{selectedEvent.block_number} Detail</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Event Type</p>
              <p className="text-gray-900 font-medium">{(selectedEvent.event_type || '').replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Entity</p>
              <p className="text-gray-900 font-medium">{selectedEvent.entity_type} #{selectedEvent.entity_id}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Actor</p>
              <p className="text-gray-900 font-medium">{selectedEvent.actor?.name || `User #${selectedEvent.actor_id}`}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Timestamp</p>
              <p className="text-gray-900 font-medium">{new Date(selectedEvent.created_at).toLocaleString('en-PH')}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-500 text-xs">Block Hash</p>
              <p className="text-gray-900 font-mono text-xs break-all">{selectedEvent.block_hash || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-500 text-xs">Previous Hash</p>
              <p className="text-gray-900 font-mono text-xs break-all">{selectedEvent.previous_hash || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-500 text-xs">Document Hash</p>
              <p className="text-gray-900 font-mono text-xs break-all">{selectedEvent.document_hash || '—'}</p>
            </div>
            {selectedEvent.metadata_hash && (
              <div className="md:col-span-2">
                <p className="text-gray-500 text-xs">Metadata Hash</p>
                <p className="text-gray-900 font-mono text-xs break-all">{selectedEvent.metadata_hash}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
