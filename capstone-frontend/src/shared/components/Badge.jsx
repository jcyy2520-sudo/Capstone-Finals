import React from 'react';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  // Add other statuses as needed
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-indigo-100 text-indigo-800',
  'pending_approval': 'bg-yellow-100 text-yellow-800',
  'pending_chairperson_approval': 'bg-yellow-100 text-yellow-800',
  'for_review': 'bg-purple-100 text-purple-800',
  'posted': 'bg-green-100 text-green-800',
  'sent': 'bg-blue-100 text-blue-800',
};

const Badge = ({ status, children }) => {
  const normalizedStatus = String(status ?? '').toLowerCase();
  const colorClass = statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}
    >
      {children}
    </span>
  );
};

export default Badge;
