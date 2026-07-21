const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'LookbookAdmin.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Hook useModal
content = content.replace("const [session, setSession] = useState(null);", "const [session, setSession] = useState(null);\n  const { showAlert, showConfirm } = useModal();");

// Import useModal if not already
if (!content.includes("useModal")) {
  content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { useModal } from '../context/ModalContext';");
}

// Replace alerts
content = content.replace(/alert\('([^']+)' \+ error\.message\);/g, "showAlert('오류', '$1: ' + error.message);");

// Inline confirm refactoring
const deleteStart = `    const handleMultiDeleteClick = () => {
      if (selectedImages.size === 0) return;
      setShowDeleteConfirm(true);
    };`;
const newDeleteStart = `    const handleMultiDeleteClick = () => {
      if (selectedImages.size === 0) return;
      showConfirm('내역 삭제', \`선택한 \${selectedImages.size}개의 사진을 정말 삭제하시겠습니까?\`, executeMultiDelete);
    };`;
content = content.replace(deleteStart, newDeleteStart);

// Remove showDeleteConfirm state
content = content.replace("  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);\n", "");
content = content.replace("        setShowDeleteConfirm(false);\n", "");

// Find and remove the inline modal
//       {/* Custom Delete Confirm Dialog */}
//       {showDeleteConfirm && createPortal( ... )}
const modalRegex = /\{\/\* Custom Delete Confirm Dialog \*\/\}\s*\{showDeleteConfirm && createPortal\([\s\S]*?(?=\}\s*<\/div>\s*\);\s*\})/m;
const modalMatch = content.match(modalRegex);
if (modalMatch) {
  content = content.replace(modalMatch[0], "");
} else {
  // Let's do a more robust string replacement
  const modalUI = `      {/* Custom Delete Confirm Dialog */}
      {showDeleteConfirm && createPortal(
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px', width: '360px' }}>
            <h2 style={{ color: 'var(--gold-bright)', fontSize: '20px', marginBottom: '8px' }}>
              사진 삭제
            </h2>
            <div className="panel-rule" style={{ marginBottom: '20px' }}>
              <span className="pr-line"></span><span className="pr-gem">◆</span><span className="pr-line"></span>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--txt-100)', marginBottom: '30px', lineHeight: '1.5' }}>
              선택한 {selectedImages.size}개의 사진을<br/>정말 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>취소</button>
              <button className="submit-btn" style={{ background: 'transparent', color: '#ff4d4f', border: '1px solid #ff4d4f' }} onClick={executeMultiDelete}>삭제하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}`;
  content = content.replace(modalUI, "");
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('LookbookAdmin.jsx refactoring done.');
