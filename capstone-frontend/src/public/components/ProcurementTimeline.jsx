import { CheckCircle2, Clock, Hash } from 'lucide-react';

const eventLabels = {
  APP_APPROVED: 'APP Approved',
  PR_ACCEPTED: 'PR Accepted',
  BUDGET_CERTIFIED: 'Budget Certified',
  ITB_POSTED: 'ITB Posted',
  RFQ_SENT: 'RFQ Sent',
  BID_SUBMITTED: 'Bid Submitted',
  BID_OPENING_STARTED: 'Bid Opening Started',
  BID_OPENING_COMPLETED: 'Bid Opening Completed',
  EVALUATION_COMPLETED: 'Evaluation Completed',
  POST_QUAL_COMPLETED: 'Post-Qualification Completed',
  HOPE_APPROVED_RESOLUTION: 'Resolution Approved',
  NOA_ISSUED: 'NOA Issued',
  NOA_ACKNOWLEDGED: 'NOA Acknowledged',
  NTP_ISSUED: 'NTP Issued',
  CONTRACT_SIGNED: 'Contract Signed',
  PAYMENT_RECORDED: 'Payment Recorded',
  DOCUMENT_REGISTERED: 'Document Registered',
  PRESCREENING_COMPLETED: 'Prescreening Completed',
};

export default function ProcurementTimeline({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No blockchain events recorded yet.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${event.eth_tx_hash ? 'bg-green-500' : 'bg-blue-500'}`} />
            {index < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
          </div>

          {/* Content */}
          <div className="pb-5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">
                {eventLabels[event.event_type] || event.event_type.replace(/_/g, ' ')}
              </span>
              {event.eth_tx_hash && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                  <CheckCircle2 size={10} /> On-chain
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(event.recorded_at).toLocaleString('en-PH')}
              </span>
              <span>{event.actor_name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                <Hash size={10} />
                {event.block_hash?.substring(0, 16)}...
              </span>
              {event.eth_tx_hash && (
                <span className="text-[10px] text-green-600 font-mono">
                  tx: {event.eth_tx_hash.substring(0, 14)}...
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
