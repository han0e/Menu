const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'SignatureModal.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Add import if needed
if (!content.includes('useModal')) {
  content = content.replace("import SignatureCanvas from 'react-signature-canvas';", "import SignatureCanvas from 'react-signature-canvas';\nimport { useModal } from '../context/ModalContext';");
}

// Hook useModal
if (!content.includes('const { showAlert } = useModal();')) {
  content = content.replace("const [isSubmitting, setIsSubmitting] = useState(false);", "const [isSubmitting, setIsSubmitting] = useState(false);\n  const { showAlert } = useModal();");
}

// Replace alert
content = content.replace("if (!agreed) return alert(t('면책 사항에 동의해주세요.', 'Please agree to the terms.', '请同意免责声明。'));", "if (!agreed) { showAlert('알림', t('면책 사항에 동의해주세요.', 'Please agree to the terms.', '请同意免责声明。')); return; }");
content = content.replace("if (sigCanvas.current.isEmpty()) return alert(t('서명을 입력해주세요.', 'Please provide a signature.', '请提供签名。'));", "if (sigCanvas.current.isEmpty()) { showAlert('알림', t('서명을 입력해주세요.', 'Please provide a signature.', '请提供签名。')); return; }");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('SignatureModal.jsx refactoring done.');
