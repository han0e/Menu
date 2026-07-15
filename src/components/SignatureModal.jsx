import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignatureModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  designers, 
  currentLang 
}) {
  const sigCanvas = useRef({});
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (ko, en, zh) => {
    if (currentLang === 'ko') return ko;
    if (currentLang === 'zh') return zh;
    return en;
  };

  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setIsSubmitting(false);
      if (sigCanvas.current && sigCanvas.current.clear) {
        sigCanvas.current.clear();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvas.current.clear();
  };

  const handleSubmit = async () => {
    if (!agreed) return alert(t('면책 사항에 동의해주세요.', 'Please agree to the terms.', '请同意免责声明。'));
    if (sigCanvas.current.isEmpty()) return alert(t('서명을 입력해주세요.', 'Please provide a signature.', '请提供签名。'));

    setIsSubmitting(true);
    
    // Convert signature to Blob
    // Convert signature to Blob safely
    let dataUrl = '';
    try {
      const canvas = sigCanvas.current.getCanvas();
      dataUrl = canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Signature extraction error:', err);
      dataUrl = sigCanvas.current.toDataURL('image/png');
    }
    
    await onSubmit({
      signatureDataUrl: dataUrl
    });
    
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          {t('서명', 'Sign', '签名')}
        </h2>
        


        <div className="terms-box">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              {t(
                '본인은 시술 결과에 대한 유의사항을 충분히 안내받았으며, 시술 과정에서 발생할 수 있는 불가피한 손상에 대해 책임을 묻지 않음에 동의합니다.',
                'I have been fully informed about the treatment and agree not to hold the salon liable for any unavoidable damage.',
                '本人已充分了解操作注意事项，并同意不对操作过程中可能发生的不可避免的损伤追究责任。'
              )}
            </span>
          </label>
        </div>

        <div className="signature-area">
          <label>{t('서명 (Signature)', 'Signature', '签名')}</label>
          <div className="canvas-container">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="white"
              canvasProps={{ className: 'sig-canvas' }}
            />
          </div>
          <button className="clear-btn" onClick={handleClear}>
            {t('서명 지우기', 'Clear', '清除签名')}
          </button>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
            {t('취소', 'Cancel', '取消')}
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('처리중...', 'Processing...', '处理中...') : t('완료', 'Confirm', '完成')}
          </button>
        </div>
      </div>
    </div>
  );
}
