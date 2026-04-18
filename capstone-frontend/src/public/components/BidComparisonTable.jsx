import { Trophy, Hash } from 'lucide-react';

export default function BidComparisonTable({ bids }) {
  if (!bids || bids.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No bid information available yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Vendor</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Bid Amount</th>
            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 font-medium text-gray-600">Document Hash</th>
            <th className="px-4 py-3 font-medium text-gray-600">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bids.map((bid, idx) => (
            <tr key={idx} className={bid.is_winner ? 'bg-green-50' : 'hover:bg-gray-50'}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {bid.is_winner && <Trophy size={14} className="text-green-600" />}
                  <span className={`font-medium ${bid.is_winner ? 'text-green-700' : 'text-gray-900'}`}>
                    {bid.vendor_name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-900">
                {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(bid.bid_amount)}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  bid.is_winner ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {bid.is_winner ? 'Winner' : bid.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-[10px] text-gray-400 max-w-[120px] truncate" title={bid.document_hash}>
                <Hash size={10} className="inline mr-1" />
                {bid.document_hash?.substring(0, 16)}...
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {bid.submitted_at ? new Date(bid.submitted_at).toLocaleDateString('en-PH') : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
