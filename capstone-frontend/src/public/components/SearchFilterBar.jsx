import { Search } from 'lucide-react';

export default function SearchFilterBar({ search, onSearchChange, status, onStatusChange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by reference or project title..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors shrink-0"
        >
          <option value="">All Projects</option>
          <option value="preparation">In Preparation</option>
          <option value="pending">Pending</option>
          <option value="finished">Finished</option>
          <option value="returned">Returned</option>
        </select>
      </div>
    </div>
  );
}
