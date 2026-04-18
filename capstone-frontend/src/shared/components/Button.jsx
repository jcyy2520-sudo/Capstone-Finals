import React from 'react';

const baseClasses = 'inline-flex items-center justify-center border font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1';

const variantClasses = {
  primary: 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
  secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500',
  danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
  icon: 'border-transparent text-gray-500 hover:text-gray-700 focus:ring-indigo-500 p-0.5',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-[13px]',
  lg: 'px-4 py-2 text-sm',
};

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  color = 'default',
  disabled = false,
  icon: Icon,
  className = '',
  ...rest
}) => {
  const variantClass =
    variant === 'icon' && color === 'danger'
      ? 'border-transparent text-red-500 hover:text-red-700 focus:ring-red-500 p-1'
      : variantClasses[variant] || variantClasses.primary;
  const sizeClass = variant === 'icon' ? '' : sizeClasses[size] || sizeClasses.md;
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
      {...rest}
    >
      {Icon && <Icon className={`h-4 w-4 ${children ? 'mr-1.5' : ''}`} />}
      {children}
    </button>
  );
};

export default Button;
