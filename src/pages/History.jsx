import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function History({ session }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [allMenus, setAllMenus] = useState([]);
  
  // Inline Edit States
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editMemo, setEditMemo] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editItems, setEditItems] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchMenus();
  }, [session]);

  const fetchOrders = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
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
        .eq('designer_id', session?.user?.id)
        .order('created_at', { ascending: false });

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
        setAllMenus(data);
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
    setEditingOrderId(order.id);
    setEditMemo(order.memo || '');
    setEditPrice(order.total_price || 0);
    // Deep copy order_items for editing
    setEditItems(order.order_items ? JSON.parse(JSON.stringify(order.order_items)) : []);
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

  return (
    <div className="history-page">
      <div className="history-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 돌아가기
        </button>
        <h1 className="history-title">결제 내역 조회</h1>
        <div className="history-header-right">
          <div className="designer-badge">
            {session?.user?.user_metadata?.display_name || '디자이너'}님
          </div>
          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-txt">데이터를 불러오는 중입니다...</div>
        ) : orders.length === 0 ? (
          <div className="empty-txt">결제 내역이 없습니다.</div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => {
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
                    <div className="order-header-right">
                      <span className="order-price">{order.total_price.toLocaleString()}원</span>
                      <button className="edit-btn" onClick={(e) => openEdit(order, e)}>
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
                        <select className="add-item-select" onChange={addEditItem} defaultValue="">
                          <option value="" disabled>+ 시술 추가하기</option>
                          {allMenus.map(m => (
                            <option key={m.id} value={m.id}>{m.name_ko} (+{m.price.toLocaleString()}원)</option>
                          ))}
                        </select>
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
