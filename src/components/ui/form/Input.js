import React from 'react';

/**
 * Reusable Input component with consistent styling and behavior
 */
const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  autoComplete = 'off',
  spellCheck = false,
  className = '',
  startAdornment,
  endAdornment,
  ...props
}) => {
  return (
    <div className={`relative ${className}`}>
      {startAdornment && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {startAdornment}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-150 ease-in-out ${
          startAdornment ? 'pl-10' : 'pl-4'
        } ${endAdornment ? 'pr-10' : 'pr-4'}`}
        {...props}
      />
      {endAdornment && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {endAdornment}
        </div>
      )}
    </div>
  );
};

export default Input;
