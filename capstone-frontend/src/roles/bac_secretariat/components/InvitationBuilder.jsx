import React, { useState, useEffect } from 'react';
import toast from '../../../utils/toast';
import api from '../../../services/api';
import { 
  FileText, Calendar, Info, Lock, Unlock, 
  ChevronRight, AlertCircle, CheckCircle, Save, X 
} from 'lucide-react';

const PROCUREMENT_MODES = [
  { id: 'competitive_bidding', name: 'Competitive Bidding', type: 'itb' },
  { id: 'limited_source_bidding', name: 'Limited Source Bidding', type: 'limited_source' },
  { id: 'direct_contracting', name: 'Direct Contracting', type: 'direct' },
  { id: 'repeat_order', name: 'Repeat Order', type: 'direct' },
  { id: 'shopping_52_1a', name: 'Shopping (Sec. 52.1a)', type: 'rfq' },
  { id: 'shopping_52_1b', name: 'Shopping (Sec. 52.1b)', type: 'rfq' },
  { id: 'negotiated_procurement', name: 'Negotiated Procurement', type: 'direct' },
  { id: 'small_value_procurement', name: 'Small Value Procurement (SVP)', type: 'rfq' },
  { id: 'direct_acquisition', name: 'Direct Acquisition', type: 'direct' },
  { id: 'direct_sales', name: 'Direct Sales', type: 'direct' },
  { id: 'sti_procurement', name: 'Direct Procurement for STI', type: 'direct' },
];

export default function InvitationBuilder({ pr, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [data, setData] = useState({
    purchase_requisition_id: pr.id,
    project_title: pr.app_entry?.project_title || pr.pr_reference,
    abc: pr.total_value,
    fund_source: pr.fund_source || pr.app_entry?.fund_source || '',
    procuring_entity: 'City Government of ProcureSeal',
    procurement_mode: pr.procurement_mode || pr.app_entry?.mode || '',
    payment_terms: '30_days',
    submission_deadline: '',
    opening_date: '',
    opening_venue: 'BAC Conference Room, 2nd Floor, City Hall',
    bid_document_cost: 0,
    pre_bid_conference_date: '',
    alternative_mode_justification: '',
    selected_supplier_name: '',
    selected_supplier_details: '',
    mode_specific_data: {},
  });

  const [overrides, setOverrides] = useState({});
  const [customizing, setCustomizing] = useState({});

  // IRR Constraints
  const [constraints, setConstraints] = useState({
    minDays: 7,
    requiresPreBid: false,
  });

  useEffect(() => {
    const abc = parseFloat(data.abc);
    const mode = data.procurement_mode;
    
    let minDays = 7;
    let requiresPreBid = false;

    if (mode === 'competitive_bidding') {
      minDays = 7; // Minimum 7 calendar days posting
      if (abc >= 1000000) {
        requiresPreBid = true;
        minDays = 12; // Adjusted for pre-bid
      }
    } else if (mode === 'small_value_procurement' || mode.startsWith('shopping')) {
      minDays = 3;
    }

    setConstraints({ minDays, requiresPreBid });
  }, [data.abc, data.procurement_mode]);

  const toggleCustomize = (field) => {
    setCustomizing(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFieldChange = (field, value) => {
    if (customizing[field]) {
      const original = pr[field] || pr.app_entry?.[field] || data[field];
      setOverrides(prev => ({
        ...prev,
        [field]: { original, new: value, reason: prev[field]?.reason || '' }
      }));
    }
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleOverrideReason = (field, reason) => {
    setOverrides(prev => ({
      ...prev,
      [field]: { ...prev[field], reason }
    }));
  };

  const updateModeData = (key, value) => {
    setData(prev => ({
      ...prev,
      mode_specific_data: { ...prev.mode_specific_data, [key]: value }
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (activeStep === 1) {
        const isAlternative = [
            'direct_contracting', 'direct_acquisition', 'negotiated_procurement', 
            'repeat_order', 'direct_sales', 'sti_procurement'
        ].includes(data.procurement_mode);

        if (isAlternative && data.alternative_mode_justification.length < 50) {
            toast.error('Justification must be at least 50 characters for alternative modes.');
            return;
        }

        // Mode-specific frontend validation
        if (data.procurement_mode === 'direct_acquisition' && parseFloat(data.abc) > 200000) {
            toast.error('Direct Acquisition is only for ABC ≤ ₱200,000.');
            return;
        }
        if (data.procurement_mode === 'direct_contracting' && !data.mode_specific_data?.exclusivity_basis) {
            toast.error('Select the basis of exclusivity for Direct Contracting.');
            return;
        }
        if (data.procurement_mode === 'negotiated_procurement' && !data.mode_specific_data?.negotiation_ground) {
            toast.error('Select the ground for Negotiated Procurement.');
            return;
        }
        if (data.procurement_mode === 'repeat_order' && !data.mode_specific_data?.original_contract_id) {
            toast.error('Reference to original contract is required for Repeat Order.');
            return;
        }
        setActiveStep(2);
        return;
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        overrides: Object.keys(overrides).map(field => ({
          field,
          override_stage: 'invitation_drafting',
          original: overrides[field].original,
          new: overrides[field].new,
          reason: overrides[field].reason
        }))
      };

      await api.post('/invitations', payload);
      toast.success('Invitation Draft Created & Routed.');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create invitation.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + constraints.minDays);
    return d.toISOString().split('T')[0];
  };

  const renderField = (label, name, type = 'text', options = null) => {
    const isLocked = !customizing[name] && ['abc', 'fund_source', 'procurement_mode'].includes(name);
    const isHardLocked = name === 'procurement_mode'; // RA 12009: Mode must stay consistent with PR Acceptance
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            {label}
            {(isLocked || isHardLocked) && <Lock className={`w-3 h-3 ml-2 ${isHardLocked ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />}
            {!isLocked && !isHardLocked && customizing[name] && <Unlock className="w-3 h-3 ml-2 text-blue-500" />}
          </label>
          {(!isHardLocked && ['abc', 'fund_source', 'project_title'].includes(name)) && (
            <button 
              type="button"
              onClick={() => toggleCustomize(name)}
              className={`text-xs ${customizing[name] ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {customizing[name] ? 'Using Custom' : 'Customize'}
            </button>
          )}
          {isHardLocked && (
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded border border-blue-100 italic">
               {PROCUREMENT_MODES.find(m => m.id === data.procurement_mode)?.name || data.procurement_mode} — Locked from Accepted PR
            </span>
          )}
        </div>
        
        {type === 'select' ? (
          <select 
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            value={data[name]}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            disabled={isLocked}
          >
            {options.map(opt => <option key={opt.id || opt} value={opt.id || opt}>{opt.name || opt}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            rows={3}
            value={data[name]}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            disabled={isLocked}
          />
        ) : (
          <input 
            type={type}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            value={data[name]}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            disabled={isLocked}
          />
        )}

        {customizing[name] && overrides[name] && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
             <div className="text-[10px] text-blue-600 font-bold uppercase mb-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Audit Change Log Pending
             </div>
             <input 
                type="text"
                placeholder="Mandatory reason for override..."
                className="w-full p-1 text-xs border rounded bg-white"
                value={overrides[name].reason}
                onChange={(e) => handleOverrideReason(name, e.target.value)}
             />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold flex items-center">
            <FileText className="mr-2" /> Invitation Builder (RA 12009)
          </h2>
          <p className="text-blue-100 text-sm opacity-80">Linked to {pr.pr_reference} • ABC: ₱{parseFloat(pr.total_value).toLocaleString()}</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Stepper */}
      <div className="flex border-b">
        <button 
          className={`flex-1 p-4 text-center font-medium border-b-2 transition-all ${activeStep === 1 ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-400'}`}
          onClick={() => setActiveStep(1)}
        >
          1. Template & Mode Content
        </button>
        <button 
          className={`flex-1 p-4 text-center font-medium border-b-2 transition-all ${activeStep === 2 ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-400'}`}
          disabled={activeStep < 2}
        >
          2. Legal Timelines & Ad
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeStep === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">Standard Data</h3>
              {renderField('Procurement Mode', 'procurement_mode', 'select', PROCUREMENT_MODES)}
              {renderField('Project Title', 'project_title')}
              <div className="grid grid-cols-2 gap-4">
                {renderField('Approved Budget (ABC)', 'abc', 'number')}
                {renderField('Fund Source', 'fund_source')}
              </div>
              {renderField('Procuring Entity', 'procuring_entity')}
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">Mode-Specific Logic</h3>
              
              {/* Direct Acquisition — ≤₱200K, supplier quotation */}
              {data.procurement_mode === 'direct_acquisition' && (
                <div className="animate-in slide-in-from-right duration-300 space-y-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> RA 9184 Sec 52.1(b)</p>
                    <p className="text-[11px] text-orange-700">ABC must be ≤ ₱200,000. Requires HOPE approval. No splitting of contracts.</p>
                  </div>
                  {renderField('Techno-Legal Justification', 'alternative_mode_justification', 'textarea')}
                  {renderField('Supplier Name', 'selected_supplier_name')}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Supplier Quotation Date</label>
                    <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={data.mode_specific_data?.supplier_quotation_date || ''} onChange={e => updateModeData('supplier_quotation_date', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Direct Contracting — exclusivity proof */}
              {data.procurement_mode === 'direct_contracting' && (
                <div className="animate-in slide-in-from-right duration-300 space-y-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> RA 9184 Sec 50</p>
                    <p className="text-[11px] text-orange-700">Exclusive dealer/distributor/manufacturer with no sub-dealers. HOPE approval required.</p>
                  </div>
                  {renderField('Techno-Legal Justification', 'alternative_mode_justification', 'textarea')}
                  {renderField('Exclusive Supplier Name', 'selected_supplier_name')}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Basis of Exclusivity</label>
                    <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={data.mode_specific_data?.exclusivity_basis || ''} onChange={e => updateModeData('exclusivity_basis', e.target.value)}>
                      <option value="">Select basis...</option>
                      <option value="sole_distributor">Sole Distributor / Dealer</option>
                      <option value="patent_holder">Patent / Copyright Holder</option>
                      <option value="proprietary">Proprietary Nature</option>
                      <option value="critical_component">Critical Component Compatibility</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Exclusivity Proof Description</label>
                    <textarea className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} value={data.mode_specific_data?.exclusivity_proof_description || ''} onChange={e => updateModeData('exclusivity_proof_description', e.target.value)} placeholder="Describe the proof document (e.g., Certificate of Exclusive Distributorship)" />
                  </div>
                </div>
              )}

              {/* Repeat Order — link to original contract */}
              {data.procurement_mode === 'repeat_order' && (
                <div className="animate-in slide-in-from-right duration-300 space-y-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> RA 9184 Sec 51</p>
                    <p className="text-[11px] text-orange-700">Must reference prior contract. Same items, same/lower price, within 6 months of original.</p>
                  </div>
                  {renderField('Techno-Legal Justification', 'alternative_mode_justification', 'textarea')}
                  {renderField('Original Supplier', 'selected_supplier_name')}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Original Contract ID</label>
                    <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={data.mode_specific_data?.original_contract_id || ''} onChange={e => updateModeData('original_contract_id', parseInt(e.target.value) || '')} placeholder="Contract ID from system" />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!data.mode_specific_data?.same_items_confirmation} onChange={e => updateModeData('same_items_confirmation', e.target.checked)} className="rounded" />
                      Same items as original
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!data.mode_specific_data?.price_compliance} onChange={e => updateModeData('price_compliance', e.target.checked)} className="rounded" />
                      Same or lower price
                    </label>
                  </div>
                </div>
              )}

              {/* Negotiated Procurement — ground selection */}
              {data.procurement_mode === 'negotiated_procurement' && (
                <div className="animate-in slide-in-from-right duration-300 space-y-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> RA 9184 Sec 53</p>
                    <p className="text-[11px] text-orange-700">Requires specific ground for negotiation. Two-failed-biddings ground must reference prior failed ITBs.</p>
                  </div>
                  {renderField('Techno-Legal Justification', 'alternative_mode_justification', 'textarea')}
                  {renderField('Target Supplier', 'selected_supplier_name')}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Negotiation Ground</label>
                    <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={data.mode_specific_data?.negotiation_ground || ''} onChange={e => updateModeData('negotiation_ground', e.target.value)}>
                      <option value="">Select ground...</option>
                      <option value="two_failed_biddings">Two Failed Biddings</option>
                      <option value="emergency">Emergency Cases</option>
                      <option value="take_over">Take-Over of Contracts</option>
                      <option value="adjacent_adjoining">Adjacent / Adjoining Lots</option>
                      <option value="agency_to_agency">Agency-to-Agency</option>
                      <option value="scientific_scholarly">Scientific / Scholarly / Artistic</option>
                      <option value="highly_technical">Highly Technical Consultants</option>
                      <option value="gocc_defense">GOCC / Defense Cooperation</option>
                      <option value="small_value">Small Value (Sec 53.9)</option>
                    </select>
                  </div>
                  {data.mode_specific_data?.negotiation_ground === 'two_failed_biddings' && (
                    <div className="mb-4 space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">Failed Bidding References (min 2)</label>
                      <input type="text" className="w-full p-2 border rounded-md text-[13px]" placeholder="1st failed bidding reference (e.g. ITB-2026-001)" value={data.mode_specific_data?.failed_bidding_references?.[0] || ''} onChange={e => updateModeData('failed_bidding_references', [e.target.value, data.mode_specific_data?.failed_bidding_references?.[1] || ''])} />
                      <input type="text" className="w-full p-2 border rounded-md text-[13px]" placeholder="2nd failed bidding reference" value={data.mode_specific_data?.failed_bidding_references?.[1] || ''} onChange={e => updateModeData('failed_bidding_references', [data.mode_specific_data?.failed_bidding_references?.[0] || '', e.target.value])} />
                    </div>
                  )}
                  {data.mode_specific_data?.negotiation_ground === 'emergency' && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Emergency Declaration Reference</label>
                      <input type="text" className="w-full p-2 border rounded-md text-[13px]" placeholder="e.g. Executive Order No. XX" value={data.mode_specific_data?.emergency_declaration_reference || ''} onChange={e => updateModeData('emergency_declaration_reference', e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              {/* Limited Source Bidding — shortlist */}
              {data.procurement_mode === 'limited_source_bidding' && (
                <div className="animate-in slide-in-from-right duration-300 space-y-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> RA 9184 Sec 49</p>
                    <p className="text-[11px] text-orange-700">Limited to pre-selected list of known suppliers. HOPE approval required before sending invitations.</p>
                  </div>
                  {renderField('Techno-Legal Justification', 'alternative_mode_justification', 'textarea')}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Shortlist Justification</label>
                    <textarea className="w-full p-2 border rounded-md text-[13px]" rows={2} value={data.mode_specific_data?.shortlist_justification || ''} onChange={e => updateModeData('shortlist_justification', e.target.value)} placeholder="Why is the bidder pool limited?" />
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Shortlisted Suppliers (comma-separated)</label>
                    <input type="text" className="w-full p-2 border rounded-md text-[13px]" value={(data.mode_specific_data?.shortlisted_suppliers || []).join(', ')} onChange={e => updateModeData('shortlisted_suppliers', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Supplier A, Supplier B, Supplier C" />
                  </div>
                </div>
              )}

              {/* Direct Sales — agency reference */}
              {data.procurement_mode === 'direct_sales' && (
                <div className="animate-in slide-in-from-right duration-300 space-y-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> Direct Sales</p>
                    <p className="text-[11px] text-orange-700">Purchase from government agency or GOCC selling surplus/disposed items. Requires price comparison.</p>
                  </div>
                  {renderField('Techno-Legal Justification', 'alternative_mode_justification', 'textarea')}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Selling Agency</label>
                    <input type="text" className="w-full p-2 border rounded-md text-[13px]" value={data.mode_specific_data?.selling_agency || ''} onChange={e => updateModeData('selling_agency', e.target.value)} placeholder="e.g., DPWH, NFA, PhilRice" />
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Price Comparison Basis</label>
                    <textarea className="w-full p-2 border rounded-md text-[13px]" rows={2} value={data.mode_specific_data?.price_comparison_basis || ''} onChange={e => updateModeData('price_comparison_basis', e.target.value)} placeholder="Describe how the price was compared to market rates" />
                  </div>
                </div>
              )}

              {/* STI Procurement */}
              {data.procurement_mode === 'sti_procurement' && (
                <div className="animate-in slide-in-from-right duration-300 space-y-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> STI Procurement</p>
                    <p className="text-[11px] text-orange-700">Science, Technology & Innovation procurement. Requires STI classification and technical endorsement.</p>
                  </div>
                  {renderField('Techno-Legal Justification', 'alternative_mode_justification', 'textarea')}
                  {renderField('Supplier / Manufacturer', 'selected_supplier_name')}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">STI Classification</label>
                    <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={data.mode_specific_data?.sti_classification || ''} onChange={e => updateModeData('sti_classification', e.target.value)}>
                      <option value="">Select classification...</option>
                      <option value="research_equipment">Research Equipment</option>
                      <option value="laboratory_supplies">Laboratory Supplies</option>
                      <option value="ict_infrastructure">ICT Infrastructure</option>
                      <option value="scientific_instruments">Scientific Instruments</option>
                      <option value="technical_software">Technical Software</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Technical Endorsement By</label>
                    <input type="text" className="w-full p-2 border rounded-md text-[13px]" value={data.mode_specific_data?.technical_endorsement_by || ''} onChange={e => updateModeData('technical_endorsement_by', e.target.value)} placeholder="e.g., DOST, DICT, University Research Dept" />
                  </div>
                </div>
              )}

              {/* Shopping / SVP Info */}
              {data.procurement_mode === 'small_value_procurement' && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 animate-in slide-in-from-right duration-300">
                    <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                    <p className="text-sm font-bold text-green-800">SVP Mode Active</p>
                    <p className="text-xs text-green-600 leading-relaxed">System will auto-populate RFQ with line items from PR. You will select at least 3 vendors in the next step.</p>
                </div>
              )}

              {/* Competitive Bidding Info */}
              {data.procurement_mode === 'competitive_bidding' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 animate-in slide-in-from-right duration-300">
                    <p className="text-sm font-bold text-blue-800">PhilGEPS Compliance</p>
                    <p className="text-xs text-blue-600 leading-relaxed">This ITB will be posted on the ProcureSeal Portal, Bulletin Board, and PhilGEPS (Global Mock).</p>
                    {renderField('Bid Docs Cost (₱)', 'bid_document_cost', 'number')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start">
                <Calendar className="w-6 h-6 text-indigo-600 mt-1 mr-4" />
                <div>
                    <h3 className="font-bold text-indigo-900">IRR Timeline Enforcement</h3>
                    <p className="text-sm text-indigo-700">Based on RA 12009, this project requires at least <strong>{constraints.minDays} calendar days</strong> of advertisement/posting.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {constraints.requiresPreBid && renderField('Pre-Bid Conference Date', 'pre_bid_conference_date', 'date')}
                 {renderField('Submission Deadline', 'submission_deadline', 'date')}
                 {renderField('Opening of Bids', 'opening_date', 'date')}
                 {renderField('Opening Venue', 'opening_venue')}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border text-center">
                 <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Approval Routing</p>
                 <p className="text-sm text-gray-700 font-medium">
                    This invitation will be routed to: <br/> 
                    <span className="text-blue-600 font-bold">
                        {['competitive_bidding', 'small_value_procurement', 'shopping_52_1a', 'shopping_52_1b'].includes(data.procurement_mode) ? 'BAC Chairperson' : 'HOPE (Head of Procuring Entity)'}
                    </span>
                 </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50 flex justify-end items-center gap-4">
        {activeStep === 2 && (
            <button 
                onClick={() => setActiveStep(1)}
                className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                disabled={loading}
            >
                Back to Content
            </button>
        )}
        <button 
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Processing...' : activeStep === 1 ? 'Next: Timelines' : 'Finalize & Route Invitation'}
          {!loading && <ChevronRight className="ml-2 w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
