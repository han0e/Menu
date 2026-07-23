import React from 'react';

const CustomModal = ({ title, message, type, onConfirm, onCancel, onClose }) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 20000 }}>
      <div
        className="modal-content"
        style={{
          textAlign: "center",
          padding: "30px",
          maxWidth: "420px",
          width: "90%",
        }}
      >
        <h2
          style={{
            color: "var(--gold-bright)",
            fontSize: "20px",
            marginBottom: "8px",
          }}
        >
          {title}
        </h2>
        <div className="panel-rule" style={{ marginBottom: "20px" }}>
          <span className="pr-line"></span>
          <span className="pr-gem">◆</span>
          <span className="pr-line"></span>
        </div>
        <p
          style={{
            fontSize: "14px",
            color: "var(--txt-100)",
            marginBottom: "30px",
            whiteSpace: "pre-line",
            lineHeight: "1.6",
            textAlign: "center",
          }}
        >
          {message}
        </p>
        <div
          className="modal-actions"
          style={{ display: "flex", gap: "10px", justifyContent: "center" }}
        >
          {type === "confirm" ? (
            <>
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--gold-bright)",
                  border: "1.5px solid var(--gold-main)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  letterSpacing: "0.03em",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => { e.target.style.background = 'rgba(212,175,106,0.12)'; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; }}
                onClick={handleConfirm}
              >
                확인
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--surface-3)",
                  color: "var(--txt-100)",
                  border: "1.5px solid var(--bdr-lo)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => { e.target.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={e => { e.target.style.background = 'var(--surface-3)'; }}
                onClick={handleCancel}
              >
                취소
              </button>
            </>
          ) : (
            <button
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                background: "transparent",
                color: "var(--gold-bright)",
                border: "1.5px solid var(--gold-main)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "0.03em",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(212,175,106,0.12)'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; }}
              onClick={handleConfirm}
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
