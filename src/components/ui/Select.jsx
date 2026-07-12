import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required = false,
    options = [],
    placeholder = 'Select...',
    className = '',
    wrapperClassName = '',
    id,
    ...props
  },
  ref
) {
  const selectId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-wrapper ${wrapperClassName}`}>
      {label && (
        <label className="input-label" htmlFor={selectId}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`select-field ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const label = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {error && (
        <span className="input-error-msg" role="alert">
          {error}
        </span>
      )}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

export default Select;
