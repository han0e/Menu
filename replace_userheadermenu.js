const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'UserHeaderMenu.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Hook useModal
content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { useModal } from '../context/ModalContext';");

// Replace modal state and showCustomAlert / showCustomConfirm
const oldModalState = `  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert", // 'alert' | 'confirm'
    onConfirm: null,
  });

  const displayName = session?.user?.user_metadata?.display_name || "디자이너";

  const showCustomAlert = (title, message, onConfirm = null) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
      onConfirm,
    });
  };

  const showCustomConfirm = (title, message, onConfirm) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm,
    });
  };`;

const newModalState = `  const { showAlert: showCustomAlert, showConfirm: showCustomConfirm } = useModal();

  const displayName = session?.user?.user_metadata?.display_name || "디자이너";`;

content = content.replace(oldModalState, newModalState);

// Remove the inline modal UI from the render block
const modalUIStart = "{modalConfig.isOpen && (";
const startIdx = content.indexOf(modalUIStart);
if (startIdx !== -1) {
    // Find the end of the modal by counting brackets or just a simple split since it's at the end
    // The file ends with:
    //       )}
    //     </div>
    //   );
    // }
    // export default UserHeaderMenu;
    const endStr = `</div>
  );
}

export default UserHeaderMenu;`;
    const lastDivIdx = content.lastIndexOf("</div>\n  );\n}");
    
    // Actually, I can just replace from {modalConfig.isOpen && ( to the last </div> before the end.
    // Let's use regex to replace it accurately.
    const regex = /\{\s*modalConfig\.isOpen\s*&&\s*\([\s\S]*?(?=\}\s*<\/div>\s*\);\s*\})/m;
    content = content.replace(regex, "");
}

// Replace raw alerts
content = content.replace(/alert\("([^"]+)"\);/g, "showCustomAlert('알림', '$1');");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('UserHeaderMenu.jsx refactoring done.');
