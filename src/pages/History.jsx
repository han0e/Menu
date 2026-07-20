import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import UserHeaderMenu from '../components/UserHeaderMenu';
import '../index.css';

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle', marginBottom: '2px' }}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export default function History({ session }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Helper to get today string
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Filter States
  const [filterType, setFilterType] = useState('date'); // 'date' | 'month'
  const [filterValue, setFilterValue] = useState(getTodayStr());
  
  const [allMenus, setAllMenus] = useState([]);
  
  // Inline Edit States
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editMemo, setEditMemo] = useState('');
  const [customMenuMode, setCustomMenuMode] = useState(false);
  const [customMenuPrice, setCustomMenuPrice] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editItems, setEditItems] = useState([]);

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchOrders();
    }
  }, [session?.user?.id, filterValue, filterType]);

  const fetchOrders = async () => {
    if (!supabase || !session?.user?.id) return;
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            menu_item_id,
            price_at_time,
            menu_items (
              name_ko,
              name_en
            )
          )
        `)
        .eq('designer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (filterValue) {
        if (filterType === 'date') {
          const start = new Date(`${filterValue}T00:00:00+09:00`).toISOString();
          const end = new Date(`${filterValue}T23:59:59.999+09:00`).toISOString();
          query = query.gte('created_at', start).lte('created_at', end);
        } else if (filterType === 'month') {
          const [y, m] = filterValue.split('-');
          const lastDay = new Date(y, m, 0).getDate();
          const start = new Date(`${filterValue}-01T00:00:00+09:00`).toISOString();
          const end = new Date(`${filterValue}-${String(lastDay).padStart(2,'0')}T23:59:59.999+09:00`).toISOString();
          query = query.gte('created_at', start).lte('created_at', end);
        }
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (!error && data) {
        setAllMenus(data.filter(m => !m.id.endsWith('custom')));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const longPressTimer = useRef(null);

  const startPress = (orderId) => {
    longPressTimer.current = setTimeout(() => {
      setDeleteConfirmId(orderId);
    }, 800); // 800ms for long press
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder && targetOrder.signature_url && !targetOrder.signature_url.startsWith('data:')) {
        const url = targetOrder.signature_url;
        const parts = url.split('/signatures/');
        if (parts.length > 1) {
          const fileName = parts[1];
          const { error: storageError } = await supabase.storage
            .from('signatures')
            .remove([fileName]);
          if (storageError) {
            console.error('서명 이미지 삭제 실패:', storageError);
          }
        }
      }

      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const openEdit = (order, e) => {
    e.stopPropagation();
    e.preventDefault();
    setEditPrice(order.total_price);
    setEditMemo(order.memo || '');
    setCustomMenuMode(false);
    setCustomMenuPrice('');
    setEditPrice(order.total_price || 0);
    // Deep copy order_items for editing
    setEditItems(order.order_items ? JSON.parse(JSON.stringify(order.order_items)) : []);
    setEditingOrderId(order.id);
  };

  const cancelEdit = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingOrderId(null);
  };

  const addEditItem = (e) => {
    const menuId = e.target.value;
    if (!menuId) return;

    if (menuId === 'custom' || menuId.endsWith('_custom')) {
      setCustomMenuMode(true);
      e.target.value = '';
      return;
    }

    const menuObj = allMenus.find(m => m.id === menuId);
    if (!menuObj) return;

    const newItem = {
      menu_item_id: menuId,
      price_at_time: menuObj.price,
      menu_items: { name_ko: menuObj.name_ko, name_en: menuObj.name_en }
    };

    setEditItems(prev => [...prev, newItem]);
    // Automatically update price sum
    setEditPrice(prev => Number(prev) + Number(menuObj.price));
    e.target.value = ''; // reset select
  };

  const removeEditItem = (idx) => {
    const itemToRemove = editItems[idx];
    setEditItems(prev => prev.filter((_, i) => i !== idx));
    setEditPrice(prev => Math.max(0, Number(prev) - Number(itemToRemove.price_at_time)));
  };

  const handleAddCustomMenu = () => {
    if (!customMenuPrice) return;
    const price = Number(customMenuPrice.replace(/[^0-9]/g, ''));
    
    const newItem = {
      menu_item_id: session?.user?.id ? `${session.user.id}_custom` : 'custom',
      price_at_time: price,
      menu_items: { name_ko: '기타 시술 (직접 입력)', name_en: 'Custom Item' }
    };

    setEditItems(prev => [...prev, newItem]);
    setEditPrice(prev => Number(prev) + price);
    setCustomMenuMode(false);
    setCustomMenuPrice('');
  };

  const saveEdit = async (orderId) => {
    try {
      const updatedPrice = Number(editPrice);
      
      // 1. Update orders table
      const { error: updateError } = await supabase
        .from('orders')
        .update({ memo: editMemo, total_price: updatedPrice })
        .eq('id', orderId);
      if (updateError) throw updateError;

      // 2. Delete existing order_items
      const { error: delError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      if (delError) throw delError;

      // 3. Insert new order_items
      if (editItems.length > 0) {
        const newItems = editItems.map(item => ({
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          price_at_time: item.price_at_time
        }));
        const { error: insError } = await supabase.from('order_items').insert(newItems);
        if (insError) throw insError;
      }

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, memo: editMemo, total_price: updatedPrice, order_items: editItems } 
          : o
      ));
      setEditingOrderId(null);
    } catch (err) {
      alert('수정 중 오류가 발생했습니다: ' + err.message);
    }
  };

  // Menu name is now joined directly from the DB!
  const getMenuName = (item) => {
    return item.menu_items?.name_ko || '알 수 없는 메뉴';
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocalDateStr = (dateStr, type) => {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    if (type === 'month') return `${yyyy}-${mm}`;
    return `${yyyy}-${mm}-${dd}`;
  };

  const filteredOrders = orders.filter(order => {
    if (!filterValue) return true;
    return getLocalDateStr(order.created_at, filterType) === filterValue;
  });

  return (
    <div className="history-page">
      <div className="history-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 돌아가기
        </button>
        <h1 className="history-title">결제 내역 조회</h1>
        <div className="history-header-right">
          <UserHeaderMenu session={session} />
        </div>
      </div>

      <div className="history-filter-bar" style={{ padding: '4px 16px 20px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
        <select 
          value={filterType} 
          onChange={(e) => { 
            const newType = e.target.value;
            setFilterType(newType); 
            const d = new Date();
            if (newType === 'month') {
              setFilterValue(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            } else {
              setFilterValue(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            }
          }}
          style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--txt-100)', border: '1px solid var(--bdr-lo)', outline: 'none' }}
        >
          <option value="date">일별 조회</option>
          <option value="month">월별 조회</option>
        </select>
        <input 
          type={filterType} 
          value={filterValue} 
          onChange={(e) => setFilterValue(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--txt-100)', border: '1px solid var(--bdr-lo)', outline: 'none', colorScheme: 'dark' }}
        />
        {filterValue && (
          <button 
            onClick={() => setFilterValue('')}
            style={{ background: 'var(--surface-3)', border: '1px solid var(--bdr-md)', color: 'var(--txt-70)', borderRadius: '8px', cursor: 'pointer', padding: '8px 12px', fontSize: '13px' }}
          >
            초기화
          </button>
        )}
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-txt">데이터를 불러오는 중입니다...</div>
        ) : (
          <>
            {filterValue && filteredOrders.length > 0 && (
              <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '15px', color: 'var(--gold-main)', fontWeight: 'bold', background: 'rgba(212, 175, 106, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 106, 0.2)' }}>
                결제 {filteredOrders.length}건 | 총 매출: {filteredOrders.reduce((sum, o) => sum + Number(o.total_price), 0).toLocaleString()}원
              </div>
            )}
            {filteredOrders.length === 0 ? (
              <div className="empty-txt">해당 기간의 결제 내역이 없습니다.</div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map((order) => {
              const isEditing = editingOrderId === order.id;

              return (
              <div 
                key={order.id} 
                className={`order-card ${isEditing ? 'editing' : ''}`}
                onPointerDown={!isEditing ? () => startPress(order.id) : undefined}
                onPointerUp={!isEditing ? cancelPress : undefined}
                onPointerLeave={!isEditing ? cancelPress : undefined}
                onPointerCancel={!isEditing ? cancelPress : undefined}
                onContextMenu={(e) => { if (!isEditing) e.preventDefault(); }}
              >
                <div className="order-header">
                  <span className="order-date">{formatDate(order.created_at)}</span>
                  {!isEditing && (
                    <div className="order-header-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="order-price">{order.total_price.toLocaleString()}원</span>
                      <button className="edit-btn" onClick={(e) => openEdit(order, e)} style={{ display: 'flex', alignItems: 'center', padding: 0, background: 'none', border: 'none', color: 'inherit', transform: 'translateY(1px)' }}>
                        <EditIcon />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="order-body">
                  <div className="order-items-list">
                    <h4>시술 내역</h4>
                    {isEditing ? (
                      <div className="edit-items-container">
                        <ul>
                          {editItems.map((item, idx) => (
                            <li key={idx} className="edit-item-row">
                              <span className="item-name">{getMenuName(item)}</span>
                              <div className="item-price-actions">
                                <span className="item-price">{item.price_at_time.toLocaleString()}원</span>
                                <button className="remove-item-btn" onClick={() => removeEditItem(idx)}>
                                  <TrashIcon />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        {customMenuMode ? (
                          <div className="custom-menu-input-row" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input 
                              type="text" 
                              placeholder="가격 (숫자만 입력)" 
                              value={customMenuPrice ? Number(customMenuPrice).toLocaleString() : ''}
                              onChange={(e) => setCustomMenuPrice(e.target.value.replace(/[^0-9]/g, ''))}
                              className="edit-input"
                              style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
                            />
                            <button className="submit-btn" style={{ padding: '8px 12px', fontSize: '14px', flex: 'none', width: 'auto', borderRadius: '8px' }} onClick={handleAddCustomMenu}>추가</button>
                            <button className="cancel-btn" style={{ padding: '8px 12px', fontSize: '14px', flex: 'none', width: 'auto', borderRadius: '8px' }} onClick={() => setCustomMenuMode(false)}>취소</button>
                          </div>
                        ) : (
                          <select className="add-item-select" onChange={addEditItem} defaultValue="">
                            <option value="" disabled>+ 시술 추가하기</option>
                            <option value="custom" style={{ color: 'var(--gold-bright)' }}>+ 직접 입력 (기타 메뉴)</option>
                            {allMenus.map(m => (
                              <option key={m.id} value={m.id}>{m.name_ko} (+{m.price.toLocaleString()}원)</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <ul>
                        {order.order_items?.map((item, idx) => (
                          <li key={idx}>
                            <span className="item-name">{getMenuName(item)}</span>
                            <span className="item-price">{item.price_at_time.toLocaleString()}원</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {!isEditing && order.discount_amount > 0 && (
                      <div className="discount-row">
                        할인 적용: -{order.discount_amount.toLocaleString()}원
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="order-signature">
                      <h4>고객 서명 {order.language ? <span style={{ fontSize: '0.8em', color: 'var(--txt-70)', fontWeight: 'normal' }}>({order.language === 'ko' ? '한국어' : order.language === 'en' ? 'English' : '中文'})</span> : ''}</h4>
                      {order.signature_url && !order.signature_url.startsWith('data:') ? (
                        <img src={order.signature_url} alt="서명" className="sig-img" />
                      ) : (
                        <div className="no-sig">서명 없음/오프라인</div>
                      )}
                    </div>
                  )}
                  
                  {isEditing ? (
                    <div className="inline-edit-fields">
                      <div className="edit-form-group">
                        <label>총 결제 금액 (원)</label>
                        <input 
                          type="text" 
                          className="edit-input"
                          value={editPrice ? Number(editPrice).toLocaleString() : ''} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setEditPrice(val);
                          }} 
                        />
                      </div>
                      <div className="edit-form-group">
                        <label>메모 (Memo)</label>
                        <textarea 
                          className="edit-textarea"
                          value={editMemo} 
                          onChange={(e) => setEditMemo(e.target.value)} 
                          placeholder="메뉴 변경사항이나 특이사항을 기록하세요."
                        />
                      </div>
                      <div className="inline-edit-actions">
                        <button className="cancel-btn" onClick={cancelEdit}>취소</button>
                        <button className="submit-btn" onClick={() => saveEdit(order.id)}>저장하기</button>
                      </div>
                    </div>
                  ) : (
                    order.memo && (
                      <div className="order-memo">
                        <h4>메모</h4>
                        <p>{order.memo}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )})}
          </div>
            )}
          </>
        )}
      </div>

      {deleteConfirmId && (
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
      )}
    </div>
  );
}
