import { useState, useEffect } from "react";
import LeftPanel from "../components/LeftPanel";
import RightPanel from "../components/RightPanel";
import SignatureModal from "../components/SignatureModal";
import { T } from "../data/menuData"; // MENU_DATA is no longer imported
import { supabase } from "../supabaseClient";
import { useModal } from "../context/ModalContext";
import InspirationGallery from "../components/InspirationGallery";

export default function Main({ session }) {
  const [currentLang, setCurrentLang] = useState("ko");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [membershipOn, setMembershipOn] = useState(false);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [currentCat, setCurrentCat] = useState("cut");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  // Data states
  const [categories, setCategories] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDbData();
  }, []);

  const fetchDbData = async () => {
    if (!session || !session.user) {
      setLoading(false);
      return;
    }
    try {
      const dummyId = "dummy-" + Date.now();
      // 1. Fetch categories (캐시 방지용 dummy 조건 추가)
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .neq("id", dummyId)
        .eq("designer_id", session.user.id)
        .order("sort_order", { ascending: true });
      if (catError) {
        showAlert('오류', '카테고리 불러오기 실패: ' + catError.message);
        throw catError;
      }

      // 2. Fetch menu items (캐시 방지용 dummy 조건 추가)
      const { data: menuItemsData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_active", true)
        .neq("id", dummyId)
        .eq("designer_id", session.user.id)
        .order("sort_order", { ascending: true });
      if (menuError) {
        showAlert('오류', '메뉴 불러오기 실패: ' + menuError.message);
        throw menuError;
      }

      if (!catData || catData.length === 0) {
        showAlert('알림', '카테고리 데이터가 0개입니다. DB에 데이터가 없습니다!');
      }

      // Transform to match old static structure
      const formattedMenus = menuItemsData.map((dbItem) => ({
        id: dbItem.id,
        category: dbItem.category_id,
        name: { ko: dbItem.name_ko, en: dbItem.name_en, zh: dbItem.name_zh },
        badge: dbItem.badge,
        time: dbItem.time_ko
          ? { ko: dbItem.time_ko, en: dbItem.time_en, zh: dbItem.time_zh }
          : undefined,
        price: dbItem.price,
        desc: dbItem.desc_ko
          ? { ko: dbItem.desc_ko, en: dbItem.desc_en, zh: dbItem.desc_zh }
          : undefined,
        subItems: dbItem.sub_items_ko
          ? {
              ko: dbItem.sub_items_ko,
              en: dbItem.sub_items_en,
              zh: dbItem.sub_items_zh,
            }
          : undefined,
        membershipEligible: dbItem.membership_eligible,
        membershipRate: dbItem.membership_rate,
        lengthExtra: dbItem.length_extra,
        image_url: dbItem.image_url,
        warning: dbItem.warning_ko
          ? {
              ko: dbItem.warning_ko,
              en: dbItem.warning_en,
              zh: dbItem.warning_zh,
            }
          : undefined,
        estimated_time: dbItem.estimated_time,
      }));

      setCategories(
        catData ? catData.filter((c) => !c.id.endsWith("custom_cat")) : [],
      );
      setMenuData(formattedMenus);
      if (catData && catData.length > 0) {
        const validCats = catData.filter((c) => !c.id.endsWith("custom_cat"));
        if (validCats.length > 0) {
          setCurrentCat(validCats[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching DB data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id) => {
    const targetItem = menuData.find((item) => item.id === id);
    if (!targetItem) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.forEach((selectedId) => {
          const item = menuData.find((i) => i.id === selectedId);
          if (item && item.category === targetItem.category) {
            next.delete(selectedId);
          }
        });
        next.add(id);
      }
      return next;
    });
  };

  const resetAll = () => {
    setSelectedIds(new Set());
    setMembershipOn(false);
    setCustomDiscount(0);
  };

  const setLang = (lang) => {
    setCurrentLang(lang);
  };

  const dataUrlToBlob = (dataUrl) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleSignatureSubmit = async (formData) => {
    try {
      // 1. Calculate totals
      const list = menuData.filter((i) => selectedIds.has(i.id));
      let subtotal = 0,
        memDisc = 0,
        customDisc = 0;

      list.forEach((item) => {
        subtotal += item.price;
        const mRate =
          !membershipOn || !item.membershipEligible
            ? 0
            : item.membershipRate || 0;
        const afterMem = Math.round(item.price * (1 - mRate / 100));
        memDisc += item.price - afterMem;
        customDisc += Math.round((afterMem * customDiscount) / 100);
      });
      const totalDisc = memDisc + customDisc;
      const finalTotal = subtotal - totalDisc;

      // 2. Upload Signature to Supabase Storage
      let signatureUrl = "";
      if (formData.signatureDataUrl) {
        // Only try to upload if we have a real supabase URL configured
        if (import.meta.env.VITE_SUPABASE_URL) {
          const blob = dataUrlToBlob(formData.signatureDataUrl);
          const fileName = `sig_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("signatures")
              .upload(fileName, blob, { contentType: "image/png" });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from("signatures")
            .getPublicUrl(fileName);

          signatureUrl = publicUrlData.publicUrl;
        } else {
          // If no Supabase configured, just store the base64 temporarily (or fake it)
          signatureUrl = "data:image/png;base64,...";
        }
      }

      // 3. Insert Order
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            designer_id: session?.user?.id || null,
            customer_name: null,
            customer_phone: null,
            total_price: finalTotal,
            discount_amount: totalDisc,
            membership_applied: membershipOn,
            signature_url: signatureUrl,
            language: currentLang,
            terms_agreed: true,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 4. Insert Order Items
        const orderItems = list.map((item) => ({
          order_id: orderData.id,
          menu_item_id: item.id,
          price_at_time: item.price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);
        if (itemsError) throw itemsError;
      }

      setIsSuccessDialogOpen(true);
      setIsModalOpen(false);
      resetAll();

      if (window.innerWidth <= 1024) {
        setIsCartOpen(false);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      if (currentLang === "ko") {
        showAlert('오류', '처리 중 오류가 발생했습니다: ' + error.message);
      } else if (currentLang === "zh") {
        showAlert('오류', '处理订单时出错: ' + error.message);
      } else {
        showAlert('오류', 'Error processing order: ' + error.message);
      }
    }
  };

  if (!session || !session.user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "20px",
          background: "var(--bg-dark)",
        }}
      >
        <h2 style={{ color: "var(--gold-bright)" }}>로그인이 필요합니다</h2>
        <p style={{ color: "var(--txt-100)" }}>
          담당 디자이너 계정으로 로그인 후 메뉴판을 이용해주세요.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="submit-btn"
          style={{ maxWidth: "200px" }}
        >
          로그인 페이지로
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div key="loading-screen" className="loading-txt">
        메뉴 불러오는 중...
      </div>
    );
  }

  // Calculate current totals for mobile floating bar
  const selectedItems = menuData.filter((i) => selectedIds.has(i.id));
  let calculatedSubtotal = 0,
    calculatedMemDisc = 0,
    calculatedCustomDisc = 0;

  selectedItems.forEach((item) => {
    calculatedSubtotal += item.price;
    const mRate =
      !membershipOn || !item.membershipEligible ? 0 : item.membershipRate || 0;
    const afterMem = Math.round(item.price * (1 - mRate / 100));
    calculatedMemDisc += item.price - afterMem;
    calculatedCustomDisc += Math.round((afterMem * customDiscount) / 100);
  });
  const calculatedTotal =
    calculatedSubtotal - (calculatedMemDisc + calculatedCustomDisc);

  return (
    <>
      <div key="lang-toggle" className="lang-toggle">
        <span
          className={`lang-opt ${currentLang === "ko" ? "active" : ""}`}
          onClick={() => setLang("ko")}
        >
          한
        </span>
        <span className="lang-sep">|</span>
        <span
          className={`lang-opt ${currentLang === "en" ? "active" : ""}`}
          onClick={() => setLang("en")}
        >
          EN
        </span>
        <span className="lang-sep">|</span>
        <span
          className={`lang-opt ${currentLang === "zh" ? "active" : ""}`}
          onClick={() => setLang("zh")}
        >
          中
        </span>
      </div>

      <LeftPanel
        currentLang={currentLang}
        currentCat={currentCat}
        setCurrentCat={setCurrentCat}
        selectedIds={selectedIds}
        toggleItem={toggleItem}
        T={T}
        MENU_DATA={menuData}
        CATEGORIES={categories}
      />

      <RightPanel
        currentLang={currentLang}
        selectedIds={selectedIds}
        toggleItem={toggleItem}
        membershipOn={membershipOn}
        setMembershipOn={setMembershipOn}
        customDiscount={customDiscount}
        setCustomDiscount={setCustomDiscount}
        resetAll={resetAll}
        T={T}
        MENU_DATA={menuData}
        onProceed={() => setIsModalOpen(true)}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
      />

      <InspirationGallery 
        isOpen={isInspirationOpen}
        onClose={() => setIsInspirationOpen(false)}
        currentLang={currentLang}
      />

      <button
        onClick={() => setIsInspirationOpen(true)}
        className={`fab-glass ${selectedIds.size > 0 ? 'lifted' : ''}`}
      >
        {currentLang === 'ko' ? '룩북' : (currentLang === 'zh' ? '画册' : 'Lookbook')}
      </button>

      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSignatureSubmit}
        currentLang={currentLang}
        selectedItems={menuData.filter((i) => selectedIds.has(i.id))}
      />

      {isSuccessDialogOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content success-dialog"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <h2
              style={{
                color: "var(--gold-bright)",
                fontSize: "24px",
                marginBottom: "8px",
              }}
            >
              {currentLang === "ko"
                ? "서명 완료"
                : currentLang === "zh"
                  ? "签名完成"
                  : "Signature Complete"}
            </h2>
            <div className="panel-rule" style={{ marginBottom: "10px" }}>
              <span className="pr-line"></span>
              <span className="pr-gem">◆</span>
              <span className="pr-line"></span>
            </div>
            <p
              style={{
                fontSize: "17px",
                lineHeight: "1.6",
                color: "var(--txt-100)",
                whiteSpace: "pre-line",
              }}
            >
              {currentLang === "ko"
                ? "서명이 완료되었습니다.\n감사합니다.\n최고의 서비스를 제공하겠습니다."
                : currentLang === "zh"
                  ? "签名已完成。\n谢谢您。\n我们将为您提供最优质的服务。"
                  : "Signature completed.\nThank you.\nWe will provide you with the best service."}
            </p>
            <div
              className="modal-actions"
              style={{ marginTop: "20px", justifyContent: "center" }}
            >
              <button
                className="submit-btn"
                style={{ maxWidth: "200px" }}
                onClick={() => setIsSuccessDialogOpen(false)}
              >
                {currentLang === "ko"
                  ? "확인"
                  : currentLang === "zh"
                    ? "确认"
                    : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 모바일 플로팅 장바구니 바 */}
      <div
        className={`mobile-floating-bar ${selectedIds.size > 0 ? "visible" : ""}`}
        onClick={() => setIsCartOpen(true)}
      >
        <div className="floating-bar-left">
          <span className="floating-count-badge">{selectedIds.size}</span>
          <span className="floating-total-price">
            {calculatedTotal.toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="floating-bar-right">
          <span>
            {currentLang === "ko"
              ? "선택 내역 확인"
              : currentLang === "zh"
                ? "查看选择"
                : "View Selected"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: "4px" }}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </>
  );
}
