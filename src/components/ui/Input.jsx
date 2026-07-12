import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required = false,
    className = '',
    wrapperClassName = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-wrapper ${wrapperClassName}`}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`input-field ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <span className="input-error-msg" id={`${inputId}-error`} role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="input-hint" id={`${inputId}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
});

export default Input;
