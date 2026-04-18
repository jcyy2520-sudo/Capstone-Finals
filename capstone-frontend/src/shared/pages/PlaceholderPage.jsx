
export default function PlaceholderPage({ title }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3">
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-800 mb-1">{title}</h2>
      <p className="text-sm text-gray-400">This module block is assigned to this role but will be implemented in future sprints.</p>
    </div>
  );
}
