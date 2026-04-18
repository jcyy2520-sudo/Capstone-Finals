import { useEffect, useState } from 'react';
import toast from '../../../utils/toast';
import api from '../../../services/api';
import PhysicalVerificationPanel from '../components/PhysicalVerificationPanel';
import { ShieldCheck, UserPlus, RefreshCw, CheckCircle, Info, Search, Filter, X } from 'lucide-react';

const PROCUREMENT_CATEGORIES = [
  { id: 'goods', label: 'Goods' },
  { id: 'services', label: 'Services' },
  { id: 'works', label: 'Works (Infrastructure)' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'it', label: 'IT Equipment/Software' },
  { id: 'medical', label: 'Medical Supplies' },
  { id: 'construction', label: 'Construction Materials' },
  { id: 'office_supplies', label: 'Office Supplies' },
  { id: 'janitorial', label: 'Janitorial Services' },
  { id: 'security', label: 'Security Services' }
];

const EMPTY_FORM = {
  business_name: '',
  business_type: 'sole_proprietorship',
  dti_sec_cda_number: '',
  philgeps_number: '',
  tin: '',
  address: '',
  contact_person: '',
  contact_email: '',
  contact_mobile: '',
  procurement_categories: [],
  username: '',
};

const BUSINESS_TYPE_LABELS = {
  sole_proprietorship: 'Sole Proprietorship',
  partnership: 'Partnership',
  corporation: 'Corporation',
  joint_venture: 'Joint Venture',
  foreign_company: 'Foreign Company',
};

const statusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-700 border border-green-200';
        case 'pending_verification': return 'bg-amber-100 text-amber-700 border border-amber-200';
        case 'suspended': return 'bg-red-100 text-red-700 border border-red-200';
        default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
};

const formatTin = (rawValue) => {
  const digits = rawValue.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 9));
  if (digits.length > 9) parts.push(digits.slice(9, 12));
  return parts.join('-');
};

const formatMobile = (rawValue) => {
  const digits = rawValue.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
};

const validateField = (name, value, formData) => {
  switch (name) {
    case 'business_name':
      return value.trim() ? '' : 'Business name is required.';
    case 'dti_sec_cda_number':
      return value.trim() ? '' : 'DTI / SEC / CDA number is required.';
    case 'philgeps_number':
      if (!value) return 'PhilGEPS number is required.';
      return /^\d{7}$/.test(value) ? '' : 'PhilGEPS must be exactly 7 digits.';
    case 'tin':
      if (!value) return 'TIN is required.';
      return /^\d{3}-\d{3}-\d{3}-\d{3}$/.test(value) ? '' : 'TIN must be in format: 000-000-000-000';
    case 'address':
      return value.trim() ? '' : 'Registered address is required.';
    case 'contact_person':
      return value.trim() ? '' : 'Contact person is required.';
    case 'contact_email':
      if (!value) return 'Contact email is required.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address.';
    case 'contact_mobile':
      if (!value) return 'Mobile number is required.';
      return /^09\d{2}-\d{3}-\d{4}$/.test(value) ? '' : 'Mobile must be in format: 09XX-XXX-XXXX';
    case 'username':
      if (!value) return 'Username is required.';
      if (!/^[a-zA-Z0-9._-]{6,30}$/.test(value)) {
        return 'Username must be 6-30 chars using letters, numbers, dot, underscore, or dash.';
      }
      return '';
    case 'procurement_categories':
      return formData.procurement_categories.length > 0 ? '' : 'Select at least one category.';
    default:
      return '';
  }
};

export default function BiddersPage() {
  const [bidders, setBidders] = useState([]);
  const [biddersLoading, setBiddersLoading] = useState(true);
  const [biddersError, setBiddersError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [successData, setSuccessData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const fetchBidders = async (page = 1) => {
    setBiddersLoading(true);
    setBiddersError(null);
    try {
      const res = await api.get(`/bidders?page=${page}`);
      setBidders(res.data.data);
      setPagination({
        currentPage: res.data.current_page,
        lastPage: res.data.last_page,
        total: res.data.total
      });
    } catch (err) {
      setBiddersError('Failed to load bidders.');
      console.error(err);
    } finally {
      setBiddersLoading(false);
    }
  };

  useEffect(() => {
    fetchBidders();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const updated = checked 
        ? [...formData.procurement_categories, value]
        : formData.procurement_categories.filter(c => c !== value);
      
      setFormData(prev => ({ ...prev, procurement_categories: updated }));
      if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, updated, formData) }));
      return;
    }

    let finalValue = value;
    if (name === 'tin') finalValue = formatTin(value);
    if (name === 'contact_mobile') finalValue = formatMobile(value);

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, finalValue, formData) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value, formData) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    Object.keys(EMPTY_FORM).forEach(field => {
      const err = validateField(field, formData[field], formData);
      if (err) newErrors[field] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(EMPTY_FORM).reduce((acc, f) => ({ ...acc, [f]: true }), {}));
      toast.error('Please correct the errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/bidders', formData);
      setSuccessData(res.data.credentials);
      setFormData(EMPTY_FORM);
      setErrors({});
      setTouched({});
      setShowCreateModal(false);
      fetchBidders(1);
      toast.success('Bidder registered successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(EMPTY_FORM);
    setErrors({});
    setTouched({});
  };

  const inputClass = (name) => `
    w-full px-4 py-2 text-sm border rounded-xl outline-none transition-all
    ${touched[name] && errors[name] 
      ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' 
      : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}
  `;

  const shouldShowError = (name) => touched[name] && errors[name];

  const openVerification = (vendor) => {
    setSelectedVendor(vendor);
    setShowVerificationModal(true);
  };

  const closeVerification = () => {
    setShowVerificationModal(false);
    setSelectedVendor(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bidder Database</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center italic">
            <Info className="w-4 h-4 mr-2 text-blue-500" /> Physical verification must be conducted before final contract award.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add New Bidder
        </button>
      </div>

      {successData && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-2xl shadow-sm animate-in slide-in-from-top duration-500 mb-6">
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-green-800">Bidder Account Successfully Created</h3>
              <p className="text-xs text-green-700 mt-1">Temporary credentials generated for first login security protocols.</p>
              <div className="bg-white/80 backdrop-blur p-4 mt-4 rounded-xl border border-green-100 flex gap-8">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Username</label>
                    <p className="font-mono text-sm text-gray-900 select-all">{successData.username}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Email</label>
                    <p className="font-mono text-sm text-gray-900 select-all">{successData.email}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Temp Password</label>
                    <p className="font-mono text-sm text-gray-900 select-all">{successData.temporary_password}</p>
                  </div>
              </div>
            </div>
            <button onClick={() => setSuccessData(null)}><X className="w-5 h-5 text-green-400" /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="px-8 py-5 border-b flex items-center justify-between bg-gray-50/50">
          <h2 className="text-base font-semibold text-gray-900">Registered Bidders List</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total: {pagination.total}</span>
            <button
              type="button"
              onClick={() => fetchBidders(pagination.currentPage)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {biddersError && <div className="px-8 py-3 text-xs font-bold text-red-600 bg-red-50 border-b border-red-100 uppercase tracking-widest">{biddersError}</div>}

        {biddersLoading ? (
          <div className="p-20 text-center">
             <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
             <p className="text-gray-500 font-medium">Loading Records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Business Detail</th>
                    <th className="px-8 py-4">PhilGEPS / TIN</th>
                    <th className="px-8 py-4">Contact</th>
                    <th className="px-8 py-4">Categories</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bidders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-8 py-20 text-center text-gray-400 italic">No registered bidders found.</td>
                    </tr>
                  ) : bidders.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="px-8 py-4">
                        <p className="font-bold text-gray-900">{vendor.business_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{BUSINESS_TYPE_LABELS[vendor.business_type] || vendor.business_type}</p>
                      </td>
                      <td className="px-8 py-4 font-mono text-xs text-gray-600">
                        <div className="font-bold text-gray-900">PG: {vendor.philgeps_number}</div>
                        <div className="mt-1">TN: {vendor.tin}</div>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-sm font-medium text-gray-800">{vendor.contact_person}</p>
                        <p className="text-xs text-gray-500">{vendor.contact_mobile}</p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-wrap gap-1">
                            {(vendor.procurement_categories || []).slice(0, 2).map(c => (
                                <span key={c} className="text-[9px] font-bold uppercase bg-gray-100 px-1.5 rounded text-gray-600">{PROCUREMENT_CATEGORIES.find(cat => cat.id === c)?.label || c}</span>
                            ))}
                            {(vendor.procurement_categories || []).length > 2 && <span className="text-[9px] text-gray-400">+{vendor.procurement_categories.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(vendor.status)}`}>
                          {vendor.status?.replace('_', ' ') || 'unknown'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex justify-center">
                            <button 
                                onClick={() => openVerification(vendor)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-2 group"
                                title="Physical Document Check"
                            >
                                <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span className="hidden sm:block text-[10px] font-bold uppercase tracking-tighter transition-all">Verify Docs</span>
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-5 border-t bg-gray-50/30 flex items-center justify-between font-medium">
                <span className="text-xs text-gray-400 uppercase tracking-widest">Page {pagination.currentPage} of {pagination.lastPage}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={pagination.currentPage <= 1}
                        onClick={() => fetchBidders(pagination.currentPage - 1)}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        disabled={pagination.currentPage >= pagination.lastPage}
                        onClick={() => fetchBidders(pagination.currentPage + 1)}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg border border-blue-600 bg-blue-600 text-white disabled:opacity-30 hover:bg-blue-700 transition-all shadow-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
          </>
        )}
      </div>

      {showVerificationModal && selectedVendor && (
        <div className="fixed inset-0 z-[100] p-4 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm sm:p-6 lg:p-12">
            <PhysicalVerificationPanel 
                vendor={selectedVendor}
                onCancel={closeVerification}
                onSuccess={() => { closeVerification(); fetchBidders(pagination.currentPage); }}
            />
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[70] bg-gray-900/60 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-base font-semibold text-gray-900 tracking-tight">Register New Bidder</h2>
                <p className="text-xs text-gray-500 mt-1">RA 12009 Compliance: All bidders must provide valid PhilGEPS and TIN.</p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto" noValidate>
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center mb-4">
                    <span className="w-8 h-[2px] bg-blue-600 mr-2 rounded-full"></span> Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business Name</label>
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Legal Entity Name"
                        className={inputClass('business_name')}
                      />
                      {shouldShowError('business_name') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.business_name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business Type</label>
                      <select
                        name="business_type"
                        value={formData.business_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="sole_proprietorship">Sole Proprietorship</option>
                        <option value="partnership">Partnership</option>
                        <option value="corporation">Corporation</option>
                        <option value="joint_venture">Joint Venture</option>
                        <option value="foreign_company">Foreign Company</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Registration No. (DTI/SEC/CDA)</label>
                      <input
                        type="text"
                        name="dti_sec_cda_number"
                        value={formData.dti_sec_cda_number}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={inputClass('dti_sec_cda_number')}
                      />
                      {shouldShowError('dti_sec_cda_number') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.dti_sec_cda_number}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PhilGEPS Registration No.</label>
                      <input
                        type="text"
                        name="philgeps_number"
                        value={formData.philgeps_number}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength="10"
                        placeholder="7-10 Digits"
                        className={inputClass('philgeps_number')}
                      />
                      {shouldShowError('philgeps_number') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.philgeps_number}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">TIN (000-000-000-000)</label>
                      <input
                        type="text"
                        name="tin"
                        value={formData.tin}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="000-000-000-000"
                        className={inputClass('tin')}
                      />
                      {shouldShowError('tin') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.tin}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Registered Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={inputClass('address')}
                      />
                      {shouldShowError('address') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.address}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center mb-4">
                    <span className="w-8 h-[2px] bg-blue-600 mr-2 rounded-full"></span> Contact & Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Person</label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={inputClass('contact_person')}
                      />
                      {shouldShowError('contact_person') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.contact_person}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                      <input
                        type="text"
                        name="contact_mobile"
                        value={formData.contact_mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="09XX-XXX-XXXX"
                        className={inputClass('contact_mobile')}
                      />
                      {shouldShowError('contact_mobile') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.contact_mobile}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Email</label>
                      <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={inputClass('contact_email')}
                      />
                      {shouldShowError('contact_email') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.contact_email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">System Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={inputClass('username')}
                      />
                      {shouldShowError('username') && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-tighter">{errors.username}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center mb-4">
                    <span className="w-8 h-[2px] bg-blue-600 mr-2 rounded-full"></span> Procurement Categories
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {PROCUREMENT_CATEGORIES.map((cat) => (
                      <label key={cat.id} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="procurement_categories"
                          value={cat.id}
                          onChange={handleChange}
                          checked={formData.procurement_categories.includes(cat.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                        />
                        <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                  {shouldShowError('procurement_categories') && <p className="text-[10px] font-bold text-red-600 mt-2 uppercase tracking-tighter">{errors.procurement_categories}</p>}
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 transition-all"
                >
                  {loading ? 'Processing...' : 'Verify & Register Bidder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
