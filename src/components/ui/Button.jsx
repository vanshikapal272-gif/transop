import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconOnly = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    iconOnly && 'btn-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="spinner" />
      ) : (
        <>
          {icon && <span style={{ display: 'flex' }}>{icon}</span>}
          {!iconOnly && children}
        </>
      )}
    </button>
  );
});

export default Button;
