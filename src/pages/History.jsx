import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../index.css';

export default function History({ session }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchOrders();
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
        <div className="designer-badge">
          {session?.user?.user_metadata?.display_name || '디자이너'}님
        </div>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-txt">데이터를 불러오는 중입니다...</div>
        ) : orders.length === 0 ? (
          <div className="empty-txt">결제 내역이 없습니다.</div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="order-card"
                onPointerDown={() => startPress(order.id)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="order-header">
                  <span className="order-date">{formatDate(order.created_at)}</span>
                  <span className="order-price">{order.total_price.toLocaleString()}원</span>
                </div>
                
                <div className="order-body">
                  <div className="order-items-list">
                    <h4>시술 내역</h4>
                    <ul>
                      {order.order_items?.map((item, idx) => (
                        <li key={idx}>
                          <span className="item-name">{getMenuName(item)}</span>
                          <span className="item-price">{item.price_at_time.toLocaleString()}원</span>
                        </li>
                      ))}
                    </ul>
                    {order.discount_amount > 0 && (
                      <div className="discount-row">
                        할인 적용: -{order.discount_amount.toLocaleString()}원
                      </div>
                    )}
                  </div>

                  <div className="order-signature">
                    <h4>고객 서명 {order.language ? <span style={{ fontSize: '0.8em', color: 'var(--txt-70)', fontWeight: 'normal' }}>({order.language === 'ko' ? '한국어' : order.language === 'en' ? 'English' : '中文'})</span> : ''}</h4>
                    {order.signature_url && !order.signature_url.startsWith('data:') ? (
                      <img src={order.signature_url} alt="서명" className="sig-img" />
                    ) : (
                      <div className="no-sig">서명 없음/오프라인</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
