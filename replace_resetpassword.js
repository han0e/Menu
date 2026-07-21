const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ResetPassword.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Hook useModal
content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { useModal } from '../context/ModalContext';");

const oldState = `  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });`;
const newState = `  const { showAlert: showCustomAlert } = useModal();`;
content = content.replace(oldState, newState);

const oldShowAlert = `  const showAlert = (title, message, onConfirm = null) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };`;
const newShowAlert = `  const showAlert = (title, message, onConfirm = null) => {
    showCustomAlert(title, message, onConfirm);
  };`;
content = content.replace(oldShowAlert, newShowAlert);

// Remove inline modal for modalConfig
// {modalConfig.isOpen && ( ... )} -> we just regex replace it till the end of the file or the end of the block.
// It is at the end of the component.
const regex = /\{\s*modalConfig\.isOpen\s*&&\s*\([\s\S]*?(?=\}\s*<\/div>\s*\);\s*\})/m;
content = content.replace(regex, "");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('ResetPassword.jsx refactoring done.');
