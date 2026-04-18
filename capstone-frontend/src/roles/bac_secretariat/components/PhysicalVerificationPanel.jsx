import React, { useState } from 'react';
import toast from '../../../utils/toast';
import api from '../../../services/api';
import { 
  CheckCircle, XCircle, AlertTriangle, Info, 
  ShieldCheck, Calendar, Save, Trash2, X 
} from 'lucide-react';

const REQUIRED_DOCS = [
  'DTI / SEC / CDA Registration Certificate',
  'Mayor\'s / Business Permit (current year)',
  'Tax Clearance (BIR-issued, valid)',
  'PhilGEPS Registration Certificate (Gold or Platinum)',
  'Audited Financial Statements (latest year)',
  'Statement of Ongoing Contracts (notarized)',
  'Statement of Single Largest Completed Contract (SLCC)',
  'PCAB License (for infrastructure projects)',
  'NFCC Computation or Committed Line of Credit',
];

export default function PhysicalVerificationPanel({ vendor, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(
    REQUIRED_DOCS.map(doc => ({
      item: doc,
      status: 'not_presented',
      remarks: '',
      expiry_date: '',
    }))
  );

  const handleStatusChange = (index, status) => {
    const updated = [...results];
    updated[index].status = status;
    setResults(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...results];
    updated[index][field] = value;
    setResults(updated);
  };

  const handleSubmit = async () => {
    const passedCount = results.filter(r => r.status === 'passed').length;
    if (passedCount === 0) {
      toast.error('At least one document must be marked as Passed.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/bidders/${vendor.id}/physical-verification`, {
        checklist_results: results
      });
      toast.success(`Verification recorded for ${vendor.business_name}.`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold flex items-center">
            <ShieldCheck className="mr-2" /> Physical Document Verification
          </h2>
          <p className="text-emerald-100 text-sm opacity-80">Vendor: {vendor.business_name} • PhilGEPS: {vendor.philgeps_number}</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Info Bar */}
      <div className="bg-emerald-50 p-4 border-b flex items-start">
         <Info className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
         <p className="text-xs text-emerald-800 leading-relaxed font-medium lowercase">
            SECRETARIAT: PHYSICALLY INSPECT ORIGINAL DOCUMENTS AGAINST PHOTOCOPIES. ENSURE ALL PASSED ITEMS ARE VALID AND NOT EXPIRED. THIS ACTION IS LOGGED PERMANENTLY ON THE BLOCKCHAIN AUDIT TRAIL.
         </p>
      </div>

      {/* Checklist Table */}
      <div className="flex-1 overflow-y-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10 border-b">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest pl-8">Document Type</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest w-64">Status / Verification</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Remarks</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest w-40">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50/50 transition-colors">
                <td className="p-4 pl-8">
                  <span className="font-semibold text-gray-800 text-sm">{res.item}</span>
                  {res.item.includes('PCAB') && (
                    <span className="block text-[10px] text-orange-600 font-bold uppercase mt-1">Infrastructure Only</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusChange(idx, 'passed')}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-bold flex items-center justify-center transition-all ${res.status === 'passed' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-300'}`}
                    >
                      <CheckCircle className={`w-3 h-3 mr-1 ${res.status === 'passed' ? 'text-white' : 'text-gray-300'}`} /> PASSED
                    </button>
                    <button 
                      onClick={() => handleStatusChange(idx, 'not_presented')}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-bold flex items-center justify-center transition-all ${res.status === 'not_presented' ? 'bg-gray-600 border-gray-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> MISSING
                    </button>
                    <button 
                      onClick={() => handleStatusChange(idx, 'expired')}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-bold flex items-center justify-center transition-all ${res.status === 'expired' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-red-300'}`}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> EXPIRED
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <input 
                    type="text"
                    placeholder="Physical condition, page count, etc..."
                    className="w-full bg-transparent border-b border-gray-200 focus:border-emerald-500 outline-none p-1 text-sm"
                    value={res.remarks}
                    onChange={(e) => handleFieldChange(idx, 'remarks', e.target.value)}
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <input 
                      type="date"
                      className="bg-transparent border-b border-gray-200 focus:border-emerald-500 outline-none p-1 text-sm w-full"
                      value={res.expiry_date}
                      onChange={(e) => handleFieldChange(idx, 'expiry_date', e.target.value)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50 flex justify-end items-center gap-4">
        <div className="mr-auto flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 mr-2" /> Blockchain Verified Mode
        </div>
        <button 
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Submitting Record...' : 'Complete Physical Verification'}
          {!loading && <Save className="ml-2 w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
