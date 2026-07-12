import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, title, children, footer, size = 'md', className = '' }) {
  const contentRef = useRef(null);

  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleEscape]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const maxWidths = { sm: '400px', md: '520px', lg: '680px', xl: '860px' };

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        ref={contentRef}
        className={`modal-content ${className}`}
        style={{ maxWidth: maxWidths[size] || maxWidths.md }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">
            {title}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
