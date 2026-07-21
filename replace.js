const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'MenuAdmin.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Import useModal
content = content.replace("import { supabase } from '../supabaseClient';", "import { supabase } from '../supabaseClient';\nimport { useModal } from '../context/ModalContext';");

// Hook useModal
content = content.replace("const [session, setSession] = useState(null);", "const [session, setSession] = useState(null);\n  const { showAlert, showConfirm } = useModal();");

// Replace specific returns
content = content.replace("return alert('모든 필드를 입력하세요.');", "{ showAlert('알림', '모든 필드를 입력하세요.'); return; }");
content = content.replace("return alert('필수 필드를 입력하세요.');", "{ showAlert('알림', '필수 필드를 입력하세요.'); return; }");
content = content.replace("return alert('카테고리를 먼저 선택하세요.');", "{ showAlert('알림', '카테고리를 먼저 선택하세요.'); return; }");
content = content.replace("return alert('번역할 한글 카테고리명이 없습니다.');", "{ showAlert('알림', '번역할 한글 카테고리명이 없습니다.'); return; }");
content = content.replace("return alert('번역할 한글 내용이 없습니다. 먼저 한글 내용을 입력해주세요.');", "{ showAlert('알림', '번역할 한글 내용이 없습니다. 먼저 한글 내용을 입력해주세요.'); return; }");

// Replace simple alerts inside if statements
content = content.replace(/if \(error\) alert\('([^']+)' \+ error\.message\);/g, "if (error) { showAlert('오류', '$1: ' + error.message); return; }");
content = content.replace(/if \(catError\) {\s*alert\('([^']+)' \+ catError\.message\);/g, "if (catError) {\n        showAlert('오류', '$1: ' + catError.message);");
content = content.replace(/if \(menuError\) {\s*alert\('([^']+)' \+ menuError\.message\);/g, "if (menuError) {\n          showAlert('오류', '$1: ' + menuError.message);");

// Replace standard alerts
content = content.replace("alert('복사할 기본 템플릿 데이터가 없습니다.');", "showAlert('알림', '복사할 기본 템플릿 데이터가 없습니다.');");
content = content.replace("alert('기본 메뉴판 세팅이 완료되었습니다!');", "showAlert('성공', '기본 메뉴판 세팅이 완료되었습니다!');");
content = content.replace("alert('카테고리 자동 번역이 완료되었습니다!');", "showAlert('성공', '카테고리 자동 번역이 완료되었습니다!');");
content = content.replace("alert('자동 번역이 완료되었습니다! EN/中 탭을 확인해보세요.');", "showAlert('성공', '자동 번역이 완료되었습니다! EN/中 탭을 확인해보세요.');");
content = content.replace("alert('번역 중 오류가 발생했습니다.');", "showAlert('오류', '번역 중 오류가 발생했습니다.');");

// Replace deleteCategory
const deleteCat = `  const deleteCategory = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까? 속한 메뉴도 모두 삭제됩니다.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchData();
  };`;
const newDeleteCat = `  const deleteCategory = (id) => {
    showConfirm('삭제 확인', '정말 삭제하시겠습니까? 속한 메뉴도 모두 삭제됩니다.', async () => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) showAlert('오류', '삭제 실패: ' + error.message);
      else fetchData();
    });
  };`;
content = content.replace(deleteCat, newDeleteCat);

// Replace deleteMenu
const deleteMenu = `  const deleteMenu = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까? (이전에 결제된 내역이 있다면 삭제할 수 없습니다. 대신 숨김 처리를 권장합니다)')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchData();
  };`;
const newDeleteMenu = `  const deleteMenu = (id) => {
    showConfirm('삭제 확인', '정말 삭제하시겠습니까? (이전에 결제된 내역이 있다면 삭제할 수 없습니다. 대신 숨김 처리를 권장합니다)', async () => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) showAlert('오류', '삭제 실패: ' + error.message);
      else fetchData();
    });
  };`;
content = content.replace(deleteMenu, newDeleteMenu);

// Replace copyTemplates confirm
const copyTpl = `  const copyTemplates = async () => {
    if (!window.confirm('기본 메뉴판(템플릿)을 내 계정으로 복사하시겠습니까?')) return;
    setLoading(true);`;
const newCopyTpl = `  const copyTemplates = () => {
    showConfirm('템플릿 복사', '기본 메뉴판(템플릿)을 내 계정으로 복사하시겠습니까?', async () => {
      setLoading(true);`;
content = content.replace(copyTpl, newCopyTpl);

// Fix the bracket for copyTemplates async callback
content = content.replace("showAlert('성공', '기본 메뉴판 세팅이 완료되었습니다!');\n    fetchData();\n  };", "showAlert('성공', '기본 메뉴판 세팅이 완료되었습니다!');\n      fetchData();\n    });\n  };");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Node script replacement done.');
