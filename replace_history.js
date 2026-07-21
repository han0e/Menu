const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'History.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Import useModal
content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { useModal } from '../context/ModalContext';");

// Hook useModal
content = content.replace("const [session, setSession] = useState(null);", "const [session, setSession] = useState(null);\n  const { showAlert, showConfirm } = useModal();");

// Replace alerts
content = content.replace(/alert\('([^']+)' \+ err\.message\);/g, "showAlert('오류', '$1: ' + err.message);");

// Handle delete confirm inline modal
// Instead of setting state `deleteConfirmId`, we will call `showConfirm` directly.
// First, find the `startPress` function:
const startPressCode = `    const startPress = (orderId) => {
      longPressTimer.current = setTimeout(() => {
        setDeleteConfirmId(orderId);
      }, 800); // 800ms for long press
    };`;
const newStartPressCode = `    const startPress = (orderId) => {
      longPressTimer.current = setTimeout(() => {
        showConfirm('내역 삭제', '이 결제 내역을 영구적으로 삭제하시겠습니까?', () => deleteOrder(orderId));
      }, 800); // 800ms for long press
    };`;
content = content.replace(startPressCode, newStartPressCode);

// Remove the `deleteConfirmId` state
content = content.replace("  const [deleteConfirmId, setDeleteConfirmId] = useState(null);\n", "");

// Remove the inline modal UI from the render block
// The modal code starts from `{deleteConfirmId && (` and ends at `)}` before `</div>\n  );`
const modalUIRegex = /\{\s*deleteConfirmId\s*&&\s*\([\s\S]*?(?=\}\s*<\/div>\s*\);\s*\})/m;
// Wait, the regex might be tricky. Let's just use string replacement for the exact chunk we saw.
const modalCode = `      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px' }}>
            <h2 style={{ color: 'var(--gold-bright)', fontSize: '24px', marginBottom: '8px' }}>
              내역 삭제
            </h2>
            <div className="panel-rule" style={{ marginBottom: '20px' }}>
              <span className="pr-line"></span><span className="pr-gem">◆</span><span className="pr-line"></span>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--txt-100)', marginBottom: '30px' }}>
              이 결제 내역을 영구적으로 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteConfirmId(null)}>취소</button>
              <button className="submit-btn" onClick={() => {
                deleteOrder(deleteConfirmId);
                setDeleteConfirmId(null);
              }}>삭제하기</button>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(modalCode, "");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('History.jsx refactoring done.');
