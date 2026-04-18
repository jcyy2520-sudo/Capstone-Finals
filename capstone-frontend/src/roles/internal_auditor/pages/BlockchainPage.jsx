import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Link2, Clock, Minus } from 'lucide-react';
import api from '../../../services/api';
import DocumentVersionHistory from '../../../shared/components/DocumentVersionHistory';

export default function BlockchainPage() {
  const [events, setEvents] = useState([]);
  const [chainStatus, setChainStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [eventsRes, chainRes] = await Promise.all([
          api.get('/blockchain/events', { params: { page } }),
          page === 1 ? api.get('/blockchain/verify-chain') : Promise.resolve({ data: chainStatus }),
        ]);
        setEvents(eventsRes.data.data || []);
        setLastPage(eventsRes.data.last_page || 1);
        if (page === 1) setChainStatus(chainRes.data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Blockchain Integrity Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Check immutable hashes, block links, and evidence records for anomalies.</p>
      </div>

      {chainStatus && (
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${chainStatus.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {chainStatus.valid ? <CheckCircle className="text-green-600" size={24} /> : <XCircle className="text-red-600" size={24} />}
          <div>
            <p className="font-semibold text-sm">{chainStatus.valid ? 'Chain Integrity Verified — No tampering detected' : 'CHAIN INTEGRITY FAILURE — Investigate immediately'}</p>
            <p className="text-xs text-gray-600 mt-0.5">{chainStatus.blocks_checked ?? 0} blocks verified &bull; {chainStatus.errors ?? 0} error(s)</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Event Ledger</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading blockchain...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No blockchain events.</div>
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
                  <th className="px-3 py-2.5 font-medium text-gray-600">On-Chain</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((evt) => (
                  <tr key={evt.id} className={`hover:bg-gray-50 cursor-pointer ${selectedEvent?.id === evt.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedEvent(selectedEvent?.id === evt.id ? null : evt)}>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold">#{evt.block_number}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded">{(evt.event_type || '').replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{evt.entity_type} #{evt.entity_id}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{evt.actor?.name || `User #${evt.actor_id}`}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400 max-w-[100px] truncate" title={evt.document_hash}>{evt.document_hash?.substring(0, 12) || '—'}...</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400 max-w-[100px] truncate" title={evt.block_hash}>{evt.block_hash?.substring(0, 12)}...</td>
                    <td className="px-3 py-2.5">
                      {evt.eth_tx_hash ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium" title={evt.eth_tx_hash}>
                          <Link2 size={10} /> Confirmed
                        </span>
                      ) : evt.anchor_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                          <Clock size={10} /> Batched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          <Minus size={10} /> Local
                        </span>
                      )}
                    </td>
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

      {/* Document Version History Panel */}
      {selectedEvent && (
        <DocumentVersionHistory entityType={selectedEvent.entity_type} entityId={selectedEvent.entity_id} />
      )}
    </div>
  );
}