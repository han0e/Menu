const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Main.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('useModal')) {
  content = content.replace("import { supabase } from \"../supabaseClient\";", "import { supabase } from \"../supabaseClient\";\nimport { useModal } from \"../context/ModalContext\";");
}

content = content.replace("const [cartItems, setCartItems] = useState([]);", "const [cartItems, setCartItems] = useState([]);\n  const { showAlert, showConfirm } = useModal();");

content = content.replace(/alert\("카테고리 불러오기 실패: " \+ catError\.message\);/g, "showAlert('오류', '카테고리 불러오기 실패: ' + catError.message);");
content = content.replace(/alert\("메뉴 불러오기 실패: " \+ menuError\.message\);/g, "showAlert('오류', '메뉴 불러오기 실패: ' + menuError.message);");
content = content.replace(/alert\("카테고리 데이터가 0개입니다\. DB에 데이터가 없습니다!"\);/g, "showAlert('알림', '카테고리 데이터가 0개입니다. DB에 데이터가 없습니다!');");
content = content.replace(/alert\("처리 중 오류가 발생했습니다: " \+ error\.message\);/g, "showAlert('오류', '처리 중 오류가 발생했습니다: ' + error.message);");
content = content.replace(/alert\("处理订单时出错: " \+ error\.message\);/g, "showAlert('오류', '处理订单时出错: ' + error.message);");
content = content.replace(/alert\("Error processing order: " \+ error\.message\);/g, "showAlert('오류', 'Error processing order: ' + error.message);");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Main.jsx refactoring done.');
