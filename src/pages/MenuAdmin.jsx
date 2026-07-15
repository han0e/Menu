import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import UserHeaderMenu from '../components/UserHeaderMenu';
import '../index.css';

export default function MenuAdmin({ session }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for Category Management
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [editCatId, setEditCatId] = useState(null);
  const [catForm, setCatForm] = useState({ id: '', name_ko: '', name_en: '', name_zh: '', sort_order: '' });
  const [isAddingCat, setIsAddingCat] = useState(false);

  // States for Menu Management
  const [editMenuId, setEditMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({ id: '', name_ko: '', name_en: '', name_zh: '', desc_ko: '', desc_en: '', desc_zh: '', price: '', is_active: true, sort_order: '' });
  const [isAddingMenu, setIsAddingMenu] = useState(false);

  // Language Tab State
  const [langTab, setLangTab] = useState('ko'); // 'ko', 'en', 'zh'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    const { data: menuData } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
    
    setCategories(catData || []);
    setMenuItems(menuData || []);
    if (catData && catData.length > 0 && !selectedCatId) {
      setSelectedCatId(catData[0].id);
    }
    setLoading(false);
  };

  // ================= CATEGORY LOGIC =================
  const startAddCat = () => {
    setCatForm({ id: '', name_ko: '', name_en: '', name_zh: '', sort_order: categories.length + 1 });
    setIsAddingCat(true);
    setEditCatId(null);
  };

  const startEditCat = (cat) => {
    setCatForm({ ...cat });
    setEditCatId(cat.id);
    setIsAddingCat(false);
  };

  const saveCategory = async () => {
    if (!catForm.id || !catForm.name_ko || !catForm.name_en) return alert('모든 필드를 입력하세요.');
    
    if (isAddingCat) {
      const { error } = await supabase.from('categories').insert([catForm]);
      if (error) alert('추가 실패: ' + error.message);
    } else {
      const { error } = await supabase.from('categories').update({
        name_ko: catForm.name_ko,
        name_en: catForm.name_en,
        name_zh: catForm.name_zh,
        sort_order: catForm.sort_order
      }).eq('id', editCatId);
      if (error) alert('수정 실패: ' + error.message);
    }
    setEditCatId(null);
    setIsAddingCat(false);
    fetchData();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까? 속한 메뉴도 모두 삭제됩니다.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchData();
  };

  // ================= MENU LOGIC =================
  const startAddMenu = () => {
    if (!selectedCatId) return alert('카테고리를 먼저 선택하세요.');
    const catMenus = menuItems.filter(m => m.category_id === selectedCatId);
    setMenuForm({ id: '', name_ko: '', name_en: '', name_zh: '', desc_ko: '', desc_en: '', desc_zh: '', price: 0, is_active: true, sort_order: catMenus.length + 1 });
    setIsAddingMenu(true);
    setEditMenuId(null);
  };

  const startEditMenu = (menu) => {
    setMenuForm({ ...menu });
    setEditMenuId(menu.id);
    setIsAddingMenu(false);
  };

  const saveMenu = async () => {
    if (!menuForm.id || !menuForm.name_ko || !menuForm.name_en) return alert('필수 필드를 입력하세요.');
    
    const payload = {
      ...menuForm,
      category_id: selectedCatId,
    };

    if (isAddingMenu) {
      const { error } = await supabase.from('menu_items').insert([payload]);
      if (error) alert('추가 실패: ' + error.message);
    } else {
      const { id, ...updatePayload } = payload;
      const { error } = await supabase.from('menu_items').update(updatePayload).eq('id', editMenuId);
      if (error) alert('수정 실패: ' + error.message);
    }
    setEditMenuId(null);
    setIsAddingMenu(false);
    fetchData();
  };

  const deleteMenu = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까? (이전에 결제된 내역이 있다면 삭제할 수 없습니다. 대신 숨김 처리를 권장합니다)')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchData();
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate('/history')}>← 결제 내역으로</button>
        <h1 className="admin-title">메뉴 및 카테고리 관리</h1>
        <div className="history-header-right">
          <UserHeaderMenu session={session} />
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-txt">데이터 불러오는 중...</div>
        ) : (
          <div className="admin-split">
            {/* Categories Panel */}
            <div className="admin-panel categories-panel">
              <div className="panel-header">
                <h2>카테고리 관리</h2>
                <button className="text-btn" onClick={startAddCat}>+ 카테고리 추가</button>
              </div>
              <ul className="admin-list">
                {isAddingCat && (
                  <li className="admin-list-item editing">
                    <div className="form-group"><label>카테고리 ID (예: cut)</label><input type="text" placeholder="영문 소문자 권장" value={catForm.id} onChange={e => setCatForm({...catForm, id: e.target.value})} /></div>
                    
                    <div className="lang-tabs">
                      <button type="button" className={`lang-tab ${langTab === 'ko' ? 'active' : ''}`} onClick={() => setLangTab('ko')}>한</button>
                      <button type="button" className={`lang-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>EN</button>
                      <button type="button" className={`lang-tab ${langTab === 'zh' ? 'active' : ''}`} onClick={() => setLangTab('zh')}>中</button>
                    </div>

                    {langTab === 'ko' && <div className="form-group"><label>카테고리 한글명</label><input type="text" placeholder="예: 커트" value={catForm.name_ko || ''} onChange={e => setCatForm({...catForm, name_ko: e.target.value})} /></div>}
                    {langTab === 'en' && <div className="form-group"><label>카테고리 영문명</label><input type="text" placeholder="예: Cut" value={catForm.name_en || ''} onChange={e => setCatForm({...catForm, name_en: e.target.value})} /></div>}
                    {langTab === 'zh' && <div className="form-group"><label>카테고리 중문명</label><input type="text" placeholder="예: 剪发" value={catForm.name_zh || ''} onChange={e => setCatForm({...catForm, name_zh: e.target.value})} /></div>}
                    <div className="form-group"><label>정렬 순서 (낮을수록 먼저 표시됨)</label><input type="number" placeholder="순서 (숫자)" value={catForm.sort_order} onChange={e => setCatForm({...catForm, sort_order: Number(e.target.value)})} /></div>
                    <div className="actions">
                      <button onClick={saveCategory}>저장</button>
                      <button onClick={() => setIsAddingCat(false)}>취소</button>
                    </div>
                  </li>
                )}
                {categories.map(cat => (
                  <li key={cat.id} className={`admin-list-item ${selectedCatId === cat.id && editCatId !== cat.id ? 'selected' : ''} ${editCatId === cat.id ? 'editing' : ''}`} onClick={() => !editCatId && setSelectedCatId(cat.id)}>
                    {editCatId === cat.id ? (
                      <div className="edit-form">
                        <div className="form-group"><label>카테고리 ID (수정불가)</label><input type="text" disabled value={catForm.id} /></div>

                        <div className="lang-tabs">
                          <button type="button" className={`lang-tab ${langTab === 'ko' ? 'active' : ''}`} onClick={() => setLangTab('ko')}>한</button>
                          <button type="button" className={`lang-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>EN</button>
                          <button type="button" className={`lang-tab ${langTab === 'zh' ? 'active' : ''}`} onClick={() => setLangTab('zh')}>中</button>
                        </div>

                        {langTab === 'ko' && <div className="form-group"><label>카테고리 한글명</label><input type="text" placeholder="한글명" value={catForm.name_ko || ''} onChange={e => setCatForm({...catForm, name_ko: e.target.value})} /></div>}
                        {langTab === 'en' && <div className="form-group"><label>카테고리 영문명</label><input type="text" placeholder="영문명" value={catForm.name_en || ''} onChange={e => setCatForm({...catForm, name_en: e.target.value})} /></div>}
                        {langTab === 'zh' && <div className="form-group"><label>카테고리 중문명</label><input type="text" placeholder="중문명" value={catForm.name_zh || ''} onChange={e => setCatForm({...catForm, name_zh: e.target.value})} /></div>}
                        <div className="form-group"><label>정렬 순서</label><input type="number" placeholder="순서" value={catForm.sort_order} onChange={e => setCatForm({...catForm, sort_order: Number(e.target.value)})} /></div>
                        <div className="actions">
                          <button onClick={saveCategory}>저장</button>
                          <button onClick={() => setEditCatId(null)}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="view-row">
                        <span className="sort-badge">{cat.sort_order}</span>
                        <span className="title">{cat.name_ko} ({cat.id})</span>
                        <div className="actions">
                          <button onClick={(e) => { e.stopPropagation(); startEditCat(cat); }}>수정</button>
                          {cat.id !== 'custom_cat' && <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}>삭제</button>}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Menus Panel */}
            <div className="admin-panel menus-panel">
              <div className="panel-header">
                <h2>{categories.find(c => c.id === selectedCatId)?.name_ko || '선택된 카테고리 없음'} 메뉴 관리</h2>
                <button className="text-btn" onClick={startAddMenu} disabled={!selectedCatId}>+ 메뉴 추가</button>
              </div>
              <ul className="admin-list">
                {isAddingMenu && (
                  <li className="admin-list-item editing">
                    <div className="form-group"><label>메뉴 ID (예: cut_01)</label><input type="text" placeholder="고유 영문 ID" value={menuForm.id} onChange={e => setMenuForm({...menuForm, id: e.target.value})} /></div>
                    
                    <div className="lang-tabs">
                      <button type="button" className={`lang-tab ${langTab === 'ko' ? 'active' : ''}`} onClick={() => setLangTab('ko')}>한</button>
                      <button type="button" className={`lang-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>EN</button>
                      <button type="button" className={`lang-tab ${langTab === 'zh' ? 'active' : ''}`} onClick={() => setLangTab('zh')}>中</button>
                    </div>

                    {langTab === 'ko' && (
                      <>
                        <div className="form-group"><label>메뉴 한글명</label><input type="text" placeholder="예: 남성 컷" value={menuForm.name_ko || ''} onChange={e => setMenuForm({...menuForm, name_ko: e.target.value})} /></div>
                        <div className="form-group"><label>메뉴 설명 (한글)</label><textarea placeholder="메뉴에 대한 상세 설명" value={menuForm.desc_ko || ''} onChange={e => setMenuForm({...menuForm, desc_ko: e.target.value})} /></div>
                      </>
                    )}
                    {langTab === 'en' && (
                      <>
                        <div className="form-group"><label>메뉴 영문명</label><input type="text" placeholder="예: Men's Cut" value={menuForm.name_en || ''} onChange={e => setMenuForm({...menuForm, name_en: e.target.value})} /></div>
                        <div className="form-group"><label>메뉴 설명 (영문)</label><textarea placeholder="Description" value={menuForm.desc_en || ''} onChange={e => setMenuForm({...menuForm, desc_en: e.target.value})} /></div>
                      </>
                    )}
                    {langTab === 'zh' && (
                      <>
                        <div className="form-group"><label>메뉴 중문명</label><input type="text" placeholder="예: 男士修剪" value={menuForm.name_zh || ''} onChange={e => setMenuForm({...menuForm, name_zh: e.target.value})} /></div>
                        <div className="form-group"><label>메뉴 설명 (중문)</label><textarea placeholder="说明" value={menuForm.desc_zh || ''} onChange={e => setMenuForm({...menuForm, desc_zh: e.target.value})} /></div>
                      </>
                    )}
                    <div className="form-group"><label>가격 (원)</label><input type="number" placeholder="숫자만 입력" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: Number(e.target.value)})} /></div>
                    <div className="form-group"><label>정렬 순서</label><input type="number" placeholder="순서" value={menuForm.sort_order} onChange={e => setMenuForm({...menuForm, sort_order: Number(e.target.value)})} /></div>
                    <div className="form-group"><label>운영 상태</label><label style={{ fontSize: '14px', marginTop: '4px' }}><input type="checkbox" checked={menuForm.is_active} onChange={e => setMenuForm({...menuForm, is_active: e.target.checked})} /> 메뉴판에 노출 (활성화)</label></div>
                    <div className="actions">
                      <button onClick={saveMenu}>저장</button>
                      <button onClick={() => setIsAddingMenu(false)}>취소</button>
                    </div>
                  </li>
                )}
                {menuItems.filter(m => m.category_id === selectedCatId).map(menu => (
                  <li key={menu.id} className={`admin-list-item ${editMenuId === menu.id ? 'editing' : ''}`}>
                    {editMenuId === menu.id ? (
                      <div className="edit-form">
                        <div className="form-group"><label>메뉴 ID (수정불가)</label><input type="text" disabled value={menuForm.id} /></div>

                        <div className="lang-tabs">
                          <button type="button" className={`lang-tab ${langTab === 'ko' ? 'active' : ''}`} onClick={() => setLangTab('ko')}>한</button>
                          <button type="button" className={`lang-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>EN</button>
                          <button type="button" className={`lang-tab ${langTab === 'zh' ? 'active' : ''}`} onClick={() => setLangTab('zh')}>中</button>
                        </div>

                        {langTab === 'ko' && (
                          <>
                            <div className="form-group"><label>메뉴 한글명</label><input type="text" placeholder="한글명" value={menuForm.name_ko || ''} onChange={e => setMenuForm({...menuForm, name_ko: e.target.value})} /></div>
                            <div className="form-group"><label>메뉴 설명 (한글)</label><textarea placeholder="설명" value={menuForm.desc_ko || ''} onChange={e => setMenuForm({...menuForm, desc_ko: e.target.value})} /></div>
                          </>
                        )}
                        {langTab === 'en' && (
                          <>
                            <div className="form-group"><label>메뉴 영문명</label><input type="text" placeholder="영문명" value={menuForm.name_en || ''} onChange={e => setMenuForm({...menuForm, name_en: e.target.value})} /></div>
                            <div className="form-group"><label>메뉴 설명 (영문)</label><textarea placeholder="Description" value={menuForm.desc_en || ''} onChange={e => setMenuForm({...menuForm, desc_en: e.target.value})} /></div>
                          </>
                        )}
                        {langTab === 'zh' && (
                          <>
                            <div className="form-group"><label>메뉴 중문명</label><input type="text" placeholder="중문명" value={menuForm.name_zh || ''} onChange={e => setMenuForm({...menuForm, name_zh: e.target.value})} /></div>
                            <div className="form-group"><label>메뉴 설명 (중문)</label><textarea placeholder="说明" value={menuForm.desc_zh || ''} onChange={e => setMenuForm({...menuForm, desc_zh: e.target.value})} /></div>
                          </>
                        )}
                        <div className="form-group"><label>가격 (원)</label><input type="number" placeholder="숫자만 입력" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: Number(e.target.value)})} /></div>
                        <div className="form-group"><label>정렬 순서</label><input type="number" placeholder="순서" value={menuForm.sort_order} onChange={e => setMenuForm({...menuForm, sort_order: Number(e.target.value)})} /></div>
                        <div className="form-group">
                          <label>운영 상태</label>
                          <label style={{ fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="checkbox" checked={menuForm.is_active} onChange={e => setMenuForm({...menuForm, is_active: e.target.checked})} /> 메뉴판에 노출 (활성)
                          </label>
                        </div>
                        <div className="actions">
                          <button onClick={saveMenu}>저장</button>
                          <button onClick={() => setEditMenuId(null)}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="view-row">
                        <div className="info">
                          <span className="sort-badge">{menu.sort_order}</span>
                          <div className={`title-group ${menu.is_active ? '' : 'inactive-item'}`}>
                            <span className="title-text">{menu.name_ko}</span>
                            <span className="price-text">({menu.price.toLocaleString()}원)</span>
                            <span className="visibility-text">{menu.is_active ? '표시' : '미표시'}</span>
                          </div>
                        </div>
                        <div className="actions">
                          <button onClick={() => startEditMenu(menu)}>수정</button>
                          {menu.id !== 'custom' && <button onClick={() => deleteMenu(menu.id)}>삭제</button>}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
