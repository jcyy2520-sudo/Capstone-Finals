import React from 'react';

const PageHeader = ({ title, actions }) => {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold leading-6 text-gray-900 sm:truncate sm:tracking-tight">
          {title}
        </h2>
      </div>
      {actions && <div className="mt-3 flex md:mt-0 md:ml-4">{actions}</div>}
    </div>
  );
};

export default PageHeader;
