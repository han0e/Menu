const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Login.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Hook useModal
content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { useModal } from '../context/ModalContext';");

const oldState = `  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });`;
const newState = `  const { showAlert: showCustomAlert } = useModal();`;
content = content.replace(oldState, newState);

const oldShowAlert = `  const showAlert = (title, message) => {
    const translatedMessage = getErrorMessage(message);
    setModalConfig({ isOpen: true, title, message: translatedMessage });
  };`;
const newShowAlert = `  const showAlert = (title, message) => {
    const translatedMessage = getErrorMessage(message);
    showCustomAlert(title, translatedMessage);
  };`;
content = content.replace(oldShowAlert, newShowAlert);

// Remove the inline modal for modalConfig
// We need to carefully remove: {modalConfig.isOpen && ( ... )}
const regex = /\{\s*modalConfig\.isOpen\s*&&\s*\([\s\S]*?(?=\}\s*<\/div>\s*\);\s*\})\s*\)/m;
const modalUIStart = "{modalConfig.isOpen && (";
const startIdx = content.indexOf(modalUIStart);
if (startIdx !== -1) {
  // Find the exact closing
  const endMarker = "      )}"; // The end of the modalConfig block before {modalType && (
  const endIdx = content.indexOf("{modalType && (", startIdx);
  if (endIdx !== -1) {
     const blockToRemove = content.substring(startIdx, endIdx);
     content = content.replace(blockToRemove, "");
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Login.jsx refactoring done.');
