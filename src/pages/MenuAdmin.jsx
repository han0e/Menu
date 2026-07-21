import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useModal } from "../context/ModalContext";
import { useNavigate } from "react-router-dom";
import UserHeaderMenu from "../components/UserHeaderMenu";
import LookbookAdmin from "../components/LookbookAdmin";
import "../index.css";

export default function MenuAdmin({ session }) {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState("menu"); // 'menu' | 'lookbook'

  // States for Category Management
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [editCatId, setEditCatId] = useState(null);
  const [catForm, setCatForm] = useState({
    id: "",
    name_ko: "",
    name_en: "",
    name_zh: "",
    sort_order: "",
  });
  const [isAddingCat, setIsAddingCat] = useState(false);

  // States for Menu Management
  const [editMenuId, setEditMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({
    id: "",
    name_ko: "",
    name_en: "",
    name_zh: "",
    desc_ko: "",
    desc_en: "",
    desc_zh: "",
    price: "",
    is_active: true,
    sort_order: "",
    warning_ko: "",
    warning_en: "",
    warning_zh: "",
    estimated_time: "",
    length_extra: false,
  });
  const [isAddingMenu, setIsAddingMenu] = useState(false);

  // Language Tab State
  const [langTab, setLangTab] = useState("ko"); // 'ko', 'en', 'zh'
  const [collapsedCats, setCollapsedCats] = useState({}); // { [catId]: boolean }

  const toggleCatCollapse = (catId) => {
    setCollapsedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const dummyId = "dummy-" + Date.now();
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .neq("id", dummyId)
      .eq("designer_id", session.user.id)
      .order("sort_order", { ascending: true });
    const { data: menuData } = await supabase
      .from("menu_items")
      .select("*")
      .neq("id", dummyId)
      .eq("designer_id", session.user.id)
      .order("sort_order", { ascending: true });

    setCategories(catData || []);
    setMenuItems(menuData || []);
    if (catData && catData.length > 0 && !selectedCatId) {
      setSelectedCatId(catData[0].id);
    }
    setLoading(false);
  };

  // ================= CATEGORY LOGIC =================
  const startAddCat = () => {
    setCatForm({
      id: "",
      name_ko: "",
      name_en: "",
      name_zh: "",
      sort_order: categories.length + 1,
    });
    setIsAddingCat(true);
    setEditCatId(null);
  };

  const startEditCat = (cat) => {
    setCatForm({ ...cat });
    setEditCatId(cat.id);
    setIsAddingCat(false);
  };

  const saveCategory = async () => {
    if (!catForm.id || !catForm.name_ko || !catForm.name_en) {
      showAlert("알림", "모든 필드를 입력하세요.");
      return;
    }

    const catId = isAddingCat ? `${session.user.id}_${catForm.id}` : catForm.id;
    const catPayload = {
      ...catForm,
      id: catId,
      designer_id: session.user.id,
    };

    if (isAddingCat) {
      const { error } = await supabase.from("categories").insert([catPayload]);
      if (error) {
        showAlert("오류", "추가 실패: : " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("categories")
        .update({
          name_ko: catForm.name_ko,
          name_en: catForm.name_en,
          name_zh: catForm.name_zh,
          sort_order: catForm.sort_order,
        })
        .eq("id", editCatId);
      if (error) {
        showAlert("오류", "수정 실패: : " + error.message);
        return;
      }
    }
    setEditCatId(null);
    setIsAddingCat(false);
    fetchData();
  };

  const deleteCategory = async (id) => {
    showConfirm(
      "카테고리 삭제",
      "정말 삭제하시겠습니까? 속한 메뉴도 모두 삭제됩니다.",
      async () => {
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", id);
        if (error) {
          showAlert("오류", "삭제 실패: : " + error.message);
          return;
        } else fetchData();
      },
    );
  };

  // ================= MENU LOGIC =================
  const startAddMenu = () => {
    const catMenus = menuItems.filter((m) => m.category_id === selectedCatId);

    setMenuForm({
      id: "",
      name_ko: "",
      name_en: "",
      name_zh: "",
      desc_ko: "",
      desc_en: "",
      desc_zh: "",
      price: 0,
      is_active: true,
      sort_order: catMenus.length + 1,
      warning_ko: "",
      warning_en: "",
      warning_zh: "",
      estimated_time: "",
      length_extra: false,
    });
    setIsAddingMenu(true);
    setEditMenuId(null);
  };

  const startEditMenu = (menu) => {
    setMenuForm({
      ...menu,
      price: menu.price || 0,
      is_active: menu.is_active !== false,
      sort_order: menu.sort_order || 0,
      warning_ko: menu.warning_ko || "",
      warning_en: menu.warning_en || "",
      warning_zh: menu.warning_zh || "",
      estimated_time: menu.estimated_time || "",
      length_extra: menu.length_extra || false,
    });
    setEditMenuId(menu.id);
    setIsAddingMenu(false);
  };

  const saveMenu = async () => {
    if (!menuForm.id || !menuForm.name_ko || !menuForm.name_en) {
      showAlert("알림", "필수 필드를 입력하세요.");
      return;
    }

    const menuId = isAddingMenu
      ? `${session.user.id}_${menuForm.id}`
      : menuForm.id;
    const payload = {
      ...menuForm,
      id: menuId,
      category_id: selectedCatId,
      designer_id: session.user.id,
    };

    if (isAddingMenu) {
      const { error } = await supabase.from("menu_items").insert([payload]);
      if (error) {
        showAlert("오류", "추가 실패: : " + error.message);
        return;
      }
    } else {
      const { id, ...updatePayload } = payload;
      const { error } = await supabase
        .from("menu_items")
        .update(updatePayload)
        .eq("id", editMenuId);
      if (error) {
        showAlert("오류", "수정 실패: : " + error.message);
        return;
      }
    }
    setEditMenuId(null);
    setIsAddingMenu(false);
    fetchData();
  };

  const deleteMenu = async (id) => {
    showConfirm(
      "메뉴 삭제",
      "정말 삭제하시겠습니까? (이전에 결제된 내역이 있다면 삭제할 수 없습니다. 대신 숨김 처리를 권장합니다)",
      async () => {
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", id);
        if (error) {
          showAlert("오류", "삭제 실패: : " + error.message);
          return;
        } else fetchData();
      },
    );
  };

  const copyTemplates = () => {
    showConfirm(
      "템플릿 복사",
      "기본 메뉴판(템플릿)을 내 계정으로 복사하시겠습니까?",
      async () => {
        setLoading(true);

        const { data: catTemplates } = await supabase
          .from("categories")
          .select("*")
          .is("designer_id", null);
        const { data: menuTemplates } = await supabase
          .from("menu_items")
          .select("*")
          .is("designer_id", null);

        if (!catTemplates || catTemplates.length === 0) {
          showAlert("알림", "복사할 기본 템플릿 데이터가 없습니다.");
          setLoading(false);
          return;
        }

        const newCategories = catTemplates.map((c) => {
          const { created_at, ...rest } = c;
          return {
            ...rest,
            id: `${session.user.id}_${c.id}`,
            designer_id: session.user.id,
          };
        });

        const { error: catError } = await supabase
          .from("categories")
          .insert(newCategories);
        if (catError) {
          showAlert("오류", "카테고리 복사 실패: : " + catError.message);
          setLoading(false);
          return;
        }

        const newMenus = menuTemplates.map((m) => {
          const { created_at, ...rest } = m;
          return {
            ...rest,
            id: `${session.user.id}_${m.id}`,
            category_id: `${session.user.id}_${m.category_id}`,
            designer_id: session.user.id,
          };
        });

        if (newMenus.length > 0) {
          const { error: menuError } = await supabase
            .from("menu_items")
            .insert(newMenus);
          if (menuError) {
            showAlert("오류", "메뉴 복사 실패: : " + menuError.message);
          }
        }

        showAlert("성공", "기본 메뉴판 세팅이 완료되었습니다!");
        fetchData();
      },
    );
  };

  const handleAutoTranslateCat = async () => {
    if (!catForm.name_ko) {
      {
        showAlert("알림", "번역할 한글 카테고리명이 없습니다.");
        return;
      }
    }
    try {
      const translate = async (text, target) => {
        if (!text) return "";
        let preProcessed = text;
        if (target === "en") {
          preProcessed = preProcessed
            .replace(/컷/g, "Cut")
            .replace(/펌/g, "Perm")
            .replace(/염색/g, "Color")
            .replace(/클리닉/g, "Clinic");
        } else if (target === "zh-CN") {
          preProcessed = preProcessed
            .replace(/컷/g, "剪发")
            .replace(/펌/g, "烫发")
            .replace(/염색/g, "染发")
            .replace(/클리닉/g, "护发");
        }
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${target}&dt=t&q=${encodeURIComponent(preProcessed)}`,
        );
        const data = await res.json();
        return data[0].map((item) => item[0]).join("");
      };

      let [name_en, name_zh] = await Promise.all([
        translate(catForm.name_ko, "en"),
        translate(catForm.name_ko, "zh-CN"),
      ]);

      const toTitleCase = (str) =>
        str
          ? str.replace(
              /\w\S*/g,
              (txt) =>
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
            )
          : "";
      name_en = toTitleCase(name_en);

      setCatForm((prev) => ({ ...prev, name_en, name_zh }));
      showAlert("성공", "카테고리 자동 번역이 완료되었습니다!");
    } catch (e) {
      showAlert("오류", "번역 중 오류가 발생했습니다.");
      console.error(e);
    }
  };

  const handleAutoTranslate = async () => {
    if (!menuForm.name_ko && !menuForm.desc_ko && !menuForm.warning_ko) {
      {
        showAlert(
          "알림",
          "번역할 한글 내용이 없습니다. 먼저 한글 내용을 입력해주세요.",
        );
        return;
      }
    }

    try {
      // 미용실 전문 용어 사전 (구글 번역기 오역 방지)
      const applyGlossary = (text, target) => {
        if (!text) return text;
        let res = text;
        if (target === "en") {
          res = res
            .replace(/원장님/g, "Director")
            .replace(/원장/g, "Director")
            .replace(/기장추가/g, "Extra length charge")
            .replace(/여성컷/g, "Women's Cut")
            .replace(/남성컷/g, "Men's Cut")
            .replace(/매직/g, "Magic Straight")
            .replace(/셋팅/g, "Setting Perm")
            .replace(/뿌리/g, "Root")
            .replace(/복구/g, "Repair");
        } else if (target === "zh-CN") {
          res = res
            .replace(/원장님/g, "院长")
            .replace(/원장/g, "院长")
            .replace(/여성컷/g, "女士剪发")
            .replace(/남성컷/g, "男士剪发")
            .replace(/매직/g, "魔术直发")
            .replace(/셋팅/g, "热烫")
            .replace(/기장추가/g, "加长收费");
        }
        return res;
      };

      const translate = async (text, target) => {
        if (!text) return "";
        const preProcessed = applyGlossary(text, target);
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${target}&dt=t&q=${encodeURIComponent(preProcessed)}`,
        );
        const data = await res.json();
        return data[0].map((item) => item[0]).join("");
      };

      let [name_en, desc_en, warning_en, name_zh, desc_zh, warning_zh] =
        await Promise.all([
          translate(menuForm.name_ko, "en"),
          translate(menuForm.desc_ko, "en"),
          translate(menuForm.warning_ko, "en"),
          translate(menuForm.name_ko, "zh-CN"),
          translate(menuForm.desc_ko, "zh-CN"),
          translate(menuForm.warning_ko, "zh-CN"),
        ]);

      const toTitleCase = (str) =>
        str
          ? str.replace(
              /\w\S*/g,
              (txt) =>
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
            )
          : "";
      name_en = toTitleCase(name_en);

      setMenuForm((prev) => ({
        ...prev,
        name_en,
        desc_en,
        warning_en,
        name_zh,
        desc_zh,
        warning_zh,
      }));
      showAlert("성공", "자동 번역이 완료되었습니다! EN/中 탭을 확인해보세요.");
    } catch (e) {
      showAlert("오류", "번역 중 오류가 발생했습니다.");
      console.error(e);
    }
  };

  return (
    <div className="admin-page">
      <div className="history-header">
        <button className="back-btn" onClick={() => navigate("/history")}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          돌아가기
        </button>
        <h1 className="history-title">설정</h1>
        <div className="history-header-right">
          <UserHeaderMenu session={session} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "0",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => setAdminTab("menu")}
          style={{
            padding: "8px 24px",
            borderRadius: "24px",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s",
            border:
              adminTab === "menu"
                ? "1px solid var(--gold-main)"
                : "1px solid var(--bdr-lo)",
            background:
              adminTab === "menu" ? "rgba(212,175,106,0.1)" : "transparent",
            color: adminTab === "menu" ? "var(--gold-main)" : "var(--txt-70)",
          }}
        >
          메뉴/카테고리
        </button>
        <button
          onClick={() => setAdminTab("lookbook")}
          style={{
            padding: "8px 24px",
            borderRadius: "24px",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s",
            border:
              adminTab === "lookbook"
                ? "1px solid var(--gold-main)"
                : "1px solid var(--bdr-lo)",
            background:
              adminTab === "lookbook" ? "rgba(212,175,106,0.1)" : "transparent",
            color:
              adminTab === "lookbook" ? "var(--gold-main)" : "var(--txt-70)",
          }}
        >
          룩북갤러리
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-txt">데이터 불러오는 중...</div>
        ) : adminTab === "lookbook" ? (
          <LookbookAdmin session={session} />
        ) : (
          <div className="admin-accordion">
            {/* Top toolbar */}
            <div className="accordion-toolbar">
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                {categories.length === 0 && (
                  <button
                    className="text-btn"
                    onClick={copyTemplates}
                    style={{
                      color: "var(--gold-bright)",
                      background: "rgba(212, 175, 106, 0.15)",
                      padding: "6px 12px",
                      borderRadius: "4px",
                    }}
                  >
                    ✨ 기본 메뉴판 세팅하기
                  </button>
                )}
                <button className="text-btn" onClick={startAddCat}>
                  + 카테고리 추가
                </button>
              </div>
            </div>

            {/* New Category Form */}
            {isAddingCat && (
              <div className="accordion-new-cat">
                <div className="form-group">
                  <label>카테고리 ID (예: cut)</label>
                  <input
                    type="text"
                    placeholder="영문 소문자 권장"
                    value={
                      catForm.id
                        ? catForm.id.replace(`${session.user.id}_`, "")
                        : ""
                    }
                    onChange={(e) =>
                      setCatForm({ ...catForm, id: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    marginTop: "16px",
                    gap: "12px",
                  }}
                >
                  <div
                    className="lang-tabs"
                    style={{ marginBottom: 0, flex: 1, maxWidth: "240px" }}
                  >
                    <button
                      type="button"
                      className={`lang-tab ${langTab === "ko" ? "active" : ""}`}
                      onClick={() => setLangTab("ko")}
                    >
                      한
                    </button>
                    <button
                      type="button"
                      className={`lang-tab ${langTab === "en" ? "active" : ""}`}
                      onClick={() => setLangTab("en")}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      className={`lang-tab ${langTab === "zh" ? "active" : ""}`}
                      onClick={() => setLangTab("zh")}
                    >
                      中
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoTranslateCat}
                    style={{
                      background: "rgba(212, 175, 106, 0.08)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(212, 175, 106, 0.2)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      color: "var(--gold-main)",
                      padding: "0 20px",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      height: "40px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(212, 175, 106, 0.15)";
                      e.target.style.border =
                        "1px solid rgba(212, 175, 106, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(212, 175, 106, 0.08)";
                      e.target.style.border =
                        "1px solid rgba(212, 175, 106, 0.2)";
                    }}
                  >
                    AI 자동 번역
                  </button>
                </div>

                {langTab === "ko" && (
                  <div className="form-group">
                    <label>카테고리 한글명</label>
                    <input
                      type="text"
                      placeholder="예: 커트"
                      value={catForm.name_ko || ""}
                      onChange={(e) =>
                        setCatForm({ ...catForm, name_ko: e.target.value })
                      }
                    />
                  </div>
                )}
                {langTab === "en" && (
                  <div className="form-group">
                    <label>카테고리 영문명</label>
                    <input
                      type="text"
                      placeholder="예: Cut"
                      value={catForm.name_en || ""}
                      onChange={(e) =>
                        setCatForm({ ...catForm, name_en: e.target.value })
                      }
                    />
                  </div>
                )}
                {langTab === "zh" && (
                  <div className="form-group">
                    <label>카테고리 중문명</label>
                    <input
                      type="text"
                      placeholder="예: 剪发"
                      value={catForm.name_zh || ""}
                      onChange={(e) =>
                        setCatForm({ ...catForm, name_zh: e.target.value })
                      }
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>정렬 순서 (낮을수록 먼저 표시됨)</label>
                  <input
                    type="number"
                    placeholder="순서 (숫자)"
                    value={catForm.sort_order}
                    onChange={(e) =>
                      setCatForm({
                        ...catForm,
                        sort_order: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="actions">
                  <button onClick={saveCategory}>저장</button>
                  <button onClick={() => setIsAddingCat(false)}>취소</button>
                </div>
              </div>
            )}

            {/* Category Accordion Items */}
            {categories.map((cat) => {
              const isCollapsed = !!collapsedCats[cat.id];
              const catMenus = menuItems.filter(
                (m) => m.category_id === cat.id,
              );
              return (
                <div key={cat.id} className="accordion-section">
                  {/* Category Header */}
                  {editCatId === cat.id ? (
                    <div className="accordion-cat-edit">
                      <div className="form-group">
                        <label>카테고리 ID (수정불가)</label>
                        <input
                          type="text"
                          disabled
                          value={
                            catForm.id
                              ? catForm.id.replace(`${session.user.id}_`, "")
                              : ""
                          }
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                          marginTop: "16px",
                          gap: "12px",
                        }}
                      >
                        <div
                          className="lang-tabs"
                          style={{
                            marginBottom: 0,
                            flex: 1,
                            maxWidth: "240px",
                          }}
                        >
                          <button
                            type="button"
                            className={`lang-tab ${langTab === "ko" ? "active" : ""}`}
                            onClick={() => setLangTab("ko")}
                          >
                            한
                          </button>
                          <button
                            type="button"
                            className={`lang-tab ${langTab === "en" ? "active" : ""}`}
                            onClick={() => setLangTab("en")}
                          >
                            EN
                          </button>
                          <button
                            type="button"
                            className={`lang-tab ${langTab === "zh" ? "active" : ""}`}
                            onClick={() => setLangTab("zh")}
                          >
                            中
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoTranslateCat}
                          style={{
                            background: "rgba(212, 175, 106, 0.08)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            border: "1px solid rgba(212, 175, 106, 0.2)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            color: "var(--gold-main)",
                            padding: "0 20px",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "500",
                            letterSpacing: "0.5px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            height: "40px",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background =
                              "rgba(212, 175, 106, 0.15)";
                            e.target.style.border =
                              "1px solid rgba(212, 175, 106, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background =
                              "rgba(212, 175, 106, 0.08)";
                            e.target.style.border =
                              "1px solid rgba(212, 175, 106, 0.2)";
                          }}
                        >
                          AI 자동 번역
                        </button>
                      </div>

                      {langTab === "ko" && (
                        <div className="form-group">
                          <label>카테고리 한글명</label>
                          <input
                            type="text"
                            placeholder="한글명"
                            value={catForm.name_ko || ""}
                            onChange={(e) =>
                              setCatForm({
                                ...catForm,
                                name_ko: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      {langTab === "en" && (
                        <div className="form-group">
                          <label>카테고리 영문명</label>
                          <input
                            type="text"
                            placeholder="영문명"
                            value={catForm.name_en || ""}
                            onChange={(e) =>
                              setCatForm({
                                ...catForm,
                                name_en: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      {langTab === "zh" && (
                        <div className="form-group">
                          <label>카테고리 중문명</label>
                          <input
                            type="text"
                            placeholder="중문명"
                            value={catForm.name_zh || ""}
                            onChange={(e) =>
                              setCatForm({
                                ...catForm,
                                name_zh: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      <div className="form-group">
                        <label>정렬 순서</label>
                        <input
                          type="number"
                          placeholder="순서"
                          value={catForm.sort_order}
                          onChange={(e) =>
                            setCatForm({
                              ...catForm,
                              sort_order: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="actions">
                        <button onClick={saveCategory}>저장</button>
                        <button onClick={() => setEditCatId(null)}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="accordion-cat-header"
                      onClick={() => {
                        if (!editCatId) toggleCatCollapse(cat.id);
                      }}
                    >
                      <div className="accordion-cat-header-left">
                        <span
                          className="accordion-chevron"
                          style={{
                            transform: isCollapsed
                              ? "rotate(-90deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          ▾
                        </span>
                        <span className="sort-badge">{cat.sort_order}</span>
                        <span className="accordion-cat-name">
                          {cat.name_ko}
                          <span className="accordion-cat-id">
                            ({cat.id.replace(`${session.user.id}_`, "")})
                          </span>
                        </span>
                        <span className="accordion-menu-count">
                          {catMenus.length}개
                        </span>
                      </div>
                      <div
                        className="actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditCat(cat);
                          }}
                        >
                          수정
                        </button>
                        {!cat.id.endsWith("custom_cat") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCategory(cat.id);
                            }}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Accordion Menu Body */}
                  {!isCollapsed && (
                    <div className="accordion-body">
                      <div className="accordion-menu-header">
                        <button
                          className="text-btn"
                          onClick={() => {
                            setSelectedCatId(cat.id);
                            startAddMenu();
                          }}
                        >
                          + 메뉴 추가
                        </button>
                      </div>
                      <ul className="admin-list">
                        {isAddingMenu && selectedCatId === cat.id && (
                          <li className="admin-list-item editing">
                            <div className="form-group">
                              <label>메뉴 ID (예: cut_01)</label>
                              <input
                                type="text"
                                placeholder="고유 영문 ID"
                                value={
                                  menuForm.id
                                    ? menuForm.id.replace(
                                        `${session.user.id}_`,
                                        "",
                                      )
                                    : ""
                                }
                                onChange={(e) =>
                                  setMenuForm({
                                    ...menuForm,
                                    id: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "12px",
                                marginTop: "16px",
                                gap: "12px",
                              }}
                            >
                              <div
                                className="lang-tabs"
                                style={{
                                  marginBottom: 0,
                                  flex: 1,
                                  maxWidth: "240px",
                                }}
                              >
                                <button
                                  type="button"
                                  className={`lang-tab ${langTab === "ko" ? "active" : ""}`}
                                  onClick={() => setLangTab("ko")}
                                >
                                  한
                                </button>
                                <button
                                  type="button"
                                  className={`lang-tab ${langTab === "en" ? "active" : ""}`}
                                  onClick={() => setLangTab("en")}
                                >
                                  EN
                                </button>
                                <button
                                  type="button"
                                  className={`lang-tab ${langTab === "zh" ? "active" : ""}`}
                                  onClick={() => setLangTab("zh")}
                                >
                                  中
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={handleAutoTranslate}
                                style={{
                                  background: "rgba(212, 175, 106, 0.08)",
                                  border: "1px solid rgba(212, 175, 106, 0.2)",
                                  color: "var(--gold-main)",
                                  padding: "0 20px",
                                  borderRadius: "20px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: "500",
                                  display: "flex",
                                  alignItems: "center",
                                  height: "40px",
                                  flexShrink: 0,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "rgba(212, 175, 106, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "rgba(212, 175, 106, 0.08)";
                                }}
                              >
                                AI 자동 번역
                              </button>
                            </div>
                            {langTab === "ko" && (
                              <>
                                <div className="form-group">
                                  <label>메뉴명 (한글)</label>
                                  <input
                                    type="text"
                                    value={menuForm.name_ko}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        name_ko: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="form-group">
                                  <label>메뉴 설명 (한글, 선택)</label>
                                  <textarea
                                    value={menuForm.desc_ko}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        desc_ko: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="form-group">
                                  <label>시술 주의사항 (한글, 선택)</label>
                                  <textarea
                                    placeholder="예: 탈색 시 모발 손상이 있을 수 있습니다."
                                    value={menuForm.warning_ko || ""}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        warning_ko: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </>
                            )}
                            {langTab === "en" && (
                              <>
                                <div className="form-group">
                                  <label>메뉴명 (영문)</label>
                                  <input
                                    type="text"
                                    value={menuForm.name_en}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        name_en: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="form-group">
                                  <label>메뉴 설명 (영문, 선택)</label>
                                  <textarea
                                    value={menuForm.desc_en}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        desc_en: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="form-group">
                                  <label>시술 주의사항 (영문, 선택)</label>
                                  <textarea
                                    placeholder="e.g. Hair damage may occur..."
                                    value={menuForm.warning_en || ""}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        warning_en: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </>
                            )}
                            {langTab === "zh" && (
                              <>
                                <div className="form-group">
                                  <label>메뉴명 (중문)</label>
                                  <input
                                    type="text"
                                    value={menuForm.name_zh}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        name_zh: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="form-group">
                                  <label>메뉴 설명 (중문, 선택)</label>
                                  <textarea
                                    value={menuForm.desc_zh}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        desc_zh: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="form-group">
                                  <label>시술 주의사항 (중문, 선택)</label>
                                  <textarea
                                    placeholder="e.g. 可能会出现头发受损..."
                                    value={menuForm.warning_zh || ""}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        warning_zh: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </>
                            )}
                            <div className="form-group">
                              <label>가격 (원)</label>
                              <input
                                type="number"
                                placeholder="숫자만 입력"
                                value={menuForm.price}
                                onChange={(e) =>
                                  setMenuForm({
                                    ...menuForm,
                                    price: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>예상 소요 시간 (분 단위)</label>
                              <input
                                type="number"
                                placeholder="예: 90 (1시간 30분)"
                                value={menuForm.estimated_time || ""}
                                onChange={(e) =>
                                  setMenuForm({
                                    ...menuForm,
                                    estimated_time:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>정렬 순서</label>
                              <input
                                type="number"
                                placeholder="순서"
                                value={menuForm.sort_order}
                                onChange={(e) =>
                                  setMenuForm({
                                    ...menuForm,
                                    sort_order: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>옵션 설정</label>
                              <label
                                style={{
                                  fontSize: "14px",
                                  marginTop: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={menuForm.length_extra}
                                  onChange={(e) =>
                                    setMenuForm({
                                      ...menuForm,
                                      length_extra: e.target.checked,
                                    })
                                  }
                                />{" "}
                                기장 추가 비용 별도
                              </label>
                              <label
                                style={{
                                  fontSize: "14px",
                                  marginTop: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={menuForm.is_active}
                                  onChange={(e) =>
                                    setMenuForm({
                                      ...menuForm,
                                      is_active: e.target.checked,
                                    })
                                  }
                                />{" "}
                                메뉴판에 노출 (활성화)
                              </label>
                            </div>
                            <div className="actions">
                              <button onClick={saveMenu}>저장</button>
                              <button onClick={() => setIsAddingMenu(false)}>
                                취소
                              </button>
                            </div>
                          </li>
                        )}
                        {menuItems
                          .filter((m) => m.category_id === cat.id)
                          .map((menu) => (
                            <li
                              key={menu.id}
                              className={`admin-list-item ${editMenuId === menu.id ? "editing" : ""}`}
                            >
                              {editMenuId === menu.id ? (
                                <div className="edit-form">
                                  <div className="form-group">
                                    <label>메뉴 ID (수정불가)</label>
                                    <input
                                      type="text"
                                      disabled
                                      value={
                                        menuForm.id
                                          ? menuForm.id.replace(
                                              `${session.user.id}_`,
                                              "",
                                            )
                                          : ""
                                      }
                                    />
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "12px",
                                      gap: "12px",
                                    }}
                                  >
                                    <div
                                      className="lang-tabs"
                                      style={{
                                        marginBottom: 0,
                                        flex: 1,
                                        maxWidth: "240px",
                                      }}
                                    >
                                      <button
                                        type="button"
                                        className={`lang-tab ${langTab === "ko" ? "active" : ""}`}
                                        onClick={() => setLangTab("ko")}
                                      >
                                        한
                                      </button>
                                      <button
                                        type="button"
                                        className={`lang-tab ${langTab === "en" ? "active" : ""}`}
                                        onClick={() => setLangTab("en")}
                                      >
                                        EN
                                      </button>
                                      <button
                                        type="button"
                                        className={`lang-tab ${langTab === "zh" ? "active" : ""}`}
                                        onClick={() => setLangTab("zh")}
                                      >
                                        中
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleAutoTranslate}
                                      style={{
                                        background: "rgba(212, 175, 106, 0.08)",
                                        backdropFilter: "blur(8px)",
                                        WebkitBackdropFilter: "blur(8px)",
                                        border:
                                          "1px solid rgba(212, 175, 106, 0.2)",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        color: "var(--gold-main)",
                                        padding: "0 20px",
                                        borderRadius: "20px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: "500",
                                        letterSpacing: "0.5px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        height: "40px",
                                        transition: "all 0.2s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background =
                                          "rgba(212, 175, 106, 0.15)";
                                        e.target.style.border =
                                          "1px solid rgba(212, 175, 106, 0.3)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background =
                                          "rgba(212, 175, 106, 0.08)";
                                        e.target.style.border =
                                          "1px solid rgba(212, 175, 106, 0.2)";
                                      }}
                                    >
                                      AI 자동 번역
                                    </button>
                                  </div>

                                  {langTab === "ko" && (
                                    <>
                                      <div className="form-group">
                                        <label>메뉴 한글명</label>
                                        <input
                                          type="text"
                                          placeholder="한글명"
                                          value={menuForm.name_ko || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              name_ko: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>메뉴 설명 (한글)</label>
                                        <textarea
                                          placeholder="설명"
                                          value={menuForm.desc_ko || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              desc_ko: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>
                                          시술 주의사항 (한글, 선택)
                                        </label>
                                        <textarea
                                          placeholder="예: 탈색 시 모발 손상이 있을 수 있습니다."
                                          value={menuForm.warning_ko || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              warning_ko: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                    </>
                                  )}
                                  {langTab === "en" && (
                                    <>
                                      <div className="form-group">
                                        <label>메뉴 영문명</label>
                                        <input
                                          type="text"
                                          placeholder="영문명"
                                          value={menuForm.name_en || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              name_en: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>메뉴 설명 (영문)</label>
                                        <textarea
                                          placeholder="Description"
                                          value={menuForm.desc_en || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              desc_en: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>
                                          시술 주의사항 (영문, 선택)
                                        </label>
                                        <textarea
                                          placeholder="e.g. Hair damage may occur..."
                                          value={menuForm.warning_en || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              warning_en: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                    </>
                                  )}
                                  {langTab === "zh" && (
                                    <>
                                      <div className="form-group">
                                        <label>메뉴 중문명</label>
                                        <input
                                          type="text"
                                          placeholder="중문명"
                                          value={menuForm.name_zh || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              name_zh: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>메뉴 설명 (중문)</label>
                                        <textarea
                                          placeholder="说明"
                                          value={menuForm.desc_zh || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              desc_zh: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>
                                          시술 주의사항 (중문, 선택)
                                        </label>
                                        <textarea
                                          placeholder="e.g. 可能会出现头发受损..."
                                          value={menuForm.warning_zh || ""}
                                          onChange={(e) =>
                                            setMenuForm({
                                              ...menuForm,
                                              warning_zh: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                    </>
                                  )}
                                  <div className="form-group">
                                    <label>가격 (원)</label>
                                    <input
                                      type="number"
                                      placeholder="숫자만 입력"
                                      value={menuForm.price}
                                      onChange={(e) =>
                                        setMenuForm({
                                          ...menuForm,
                                          price: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>예상 소요 시간 (분 단위)</label>
                                    <input
                                      type="number"
                                      placeholder="예: 90 (1시간 30분)"
                                      value={menuForm.estimated_time || ""}
                                      onChange={(e) =>
                                        setMenuForm({
                                          ...menuForm,
                                          estimated_time:
                                            e.target.value === ""
                                              ? ""
                                              : Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>정렬 순서</label>
                                    <input
                                      type="number"
                                      placeholder="순서"
                                      value={menuForm.sort_order}
                                      onChange={(e) =>
                                        setMenuForm({
                                          ...menuForm,
                                          sort_order: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>옵션 설정</label>
                                    <label
                                      style={{
                                        fontSize: "14px",
                                        marginTop: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={menuForm.length_extra}
                                        onChange={(e) =>
                                          setMenuForm({
                                            ...menuForm,
                                            length_extra: e.target.checked,
                                          })
                                        }
                                      />{" "}
                                      기장 추가 비용 별도
                                    </label>
                                    <label
                                      style={{
                                        fontSize: "14px",
                                        marginTop: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={menuForm.is_active}
                                        onChange={(e) =>
                                          setMenuForm({
                                            ...menuForm,
                                            is_active: e.target.checked,
                                          })
                                        }
                                      />{" "}
                                      메뉴판에 노출 (활성화)
                                    </label>
                                  </div>
                                  <div className="actions">
                                    <button onClick={saveMenu}>저장</button>
                                    <button onClick={() => setEditMenuId(null)}>
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="view-row">
                                  <div className="info">
                                    <span className="sort-badge">
                                      {menu.sort_order}
                                    </span>
                                    <div
                                      className={`title-group ${menu.is_active ? "" : "inactive-item"}`}
                                    >
                                      <span className="title-text">
                                        {menu.name_ko}
                                      </span>
                                      <span className="price-text">
                                        ({menu.price.toLocaleString()}원)
                                      </span>
                                      <span className="visibility-text">
                                        {menu.is_active ? "표시" : "미표시"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="actions">
                                    <button onClick={() => startEditMenu(menu)}>
                                      수정
                                    </button>
                                    {!menu.id.endsWith("custom") && (
                                      <button
                                        onClick={() => deleteMenu(menu.id)}
                                      >
                                        삭제
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
