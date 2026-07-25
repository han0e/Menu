import React, { useState, useEffect, useRef } from "react";
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

  // Toast Notification State (Entrance & Exit Animations)
  const [toastMessage, setToastMessage] = useState("");
  const [isToastExiting, setIsToastExiting] = useState(false);
  const toastTimeoutRef = useRef(null);
  const exitTimeoutRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

    setIsToastExiting(false);
    setToastMessage(msg);

    toastTimeoutRef.current = setTimeout(() => {
      setIsToastExiting(true);
      exitTimeoutRef.current = setTimeout(() => {
        setToastMessage("");
        setIsToastExiting(false);
      }, 350);
    }, 1000);
  };

  // States for Menu Management
  const [editMenuId, setEditMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({
    id: "",
    category_id: "",
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

  // States for Drag & Drop
  const [draggedCatId, setDraggedCatId] = useState(null);
  const [dragOverCatId, setDragOverCatId] = useState(null);
  const [draggedMenuId, setDraggedMenuId] = useState(null);
  const [dragOverMenuId, setDragOverMenuId] = useState(null);

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
    // 모든 카테고리를 접힌 상태로 초기화
    if (catData && catData.length > 0) {
      const allCollapsed = Object.fromEntries(catData.map((c) => [c.id, true]));
      setCollapsedCats(allCollapsed);
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
  const startAddMenu = (catId) => {
    const targetCatId =
      catId || selectedCatId || (categories[0] && categories[0].id) || "";
    const catMenus = menuItems.filter((m) => m.category_id === targetCatId);

    setMenuForm({
      id: "",
      category_id: targetCatId,
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
      category_id: menu.category_id,
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

    const targetCatId =
      menuForm.category_id ||
      selectedCatId ||
      (categories[0] && categories[0].id);
    const menuId = isAddingMenu
      ? `${session.user.id}_${menuForm.id}`
      : menuForm.id;
    const payload = {
      ...menuForm,
      id: menuId,
      category_id: targetCatId,
      price: Number(menuForm.price) || 0,
      estimated_time: menuForm.estimated_time === "" || menuForm.estimated_time === null ? null : Number(menuForm.estimated_time),
      designer_id: session.user.id,
    };

    if (isAddingMenu) {
      const { error } = await supabase.from("menu_items").insert([payload]);
      if (error) {
        showAlert("오류", "추가 실패: " + error.message);
        return;
      }
    } else {
      const { id, ...updatePayload } = payload;
      const { error } = await supabase
        .from("menu_items")
        .update(updatePayload)
        .eq("id", editMenuId);
      if (error) {
        showAlert("오류", "수정 실패: " + error.message);
        return;
      }
    }
    setEditMenuId(null);
    setIsAddingMenu(false);
    fetchData();
  };

  // ================= DRAG & DROP & ORDER LOGIC =================
  // Category DND Handlers
  const [dropPos, setDropPos] = useState("top"); // 'top' | 'bottom'
  const [touchActiveCatId, setTouchActiveCatId] = useState(null);
  const [touchOverCatId, setTouchOverCatId] = useState(null);

  const handleCatTouchStart = (e, cat) => {
    setTouchActiveCatId(cat.id);
  };

  const handleCatTouchMove = (e) => {
    if (!touchActiveCatId) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;

    const itemEl = targetEl.closest(".accordion-section");
    if (itemEl && itemEl.dataset && itemEl.dataset.catid) {
      const overId = itemEl.dataset.catid;
      const rect = itemEl.getBoundingClientRect();
      const isBottom = touch.clientY - rect.top > rect.height / 2;
      setDropPos(isBottom ? "bottom" : "top");
      if (overId !== touchActiveCatId) {
        setTouchOverCatId(overId);
      }
    }
  };

  const handleCatTouchEnd = async () => {
    if (touchActiveCatId && touchOverCatId && touchActiveCatId !== touchOverCatId) {
      const updatedCats = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const fromIdx = updatedCats.findIndex((c) => c.id === touchActiveCatId);
      const toIdx = updatedCats.findIndex((c) => c.id === touchOverCatId);

      if (fromIdx > -1 && toIdx > -1) {
        const [moved] = updatedCats.splice(fromIdx, 1);
        updatedCats.splice(toIdx, 0, moved);

        updatedCats.forEach((c, idx) => {
          c.sort_order = idx + 1;
        });

        setCategories([...updatedCats]);

        for (const c of updatedCats) {
          await supabase
            .from("categories")
            .update({ sort_order: c.sort_order })
            .eq("id", c.id);
        }
        showToast("카테고리 순서가 저장되었습니다");
      }
    }
    setTouchActiveCatId(null);
    setTouchOverCatId(null);
  };

  const handleCatDragStart = (e, cat) => {
    e.stopPropagation();
    setDraggedCatId(cat.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cat.id);
  };

  const handleCatDragOver = (e, catId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isBottom = e.clientY - rect.top > rect.height / 2;
    setDropPos(isBottom ? "bottom" : "top");
    if (draggedCatId && draggedCatId !== catId) {
      setDragOverCatId(catId);
    }
  };

  const handleCatDrop = async (e, targetCat) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCatId(null);

    if (!draggedCatId || draggedCatId === targetCat.id) return;

    const updatedCats = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const fromIdx = updatedCats.findIndex((c) => c.id === draggedCatId);
    const toIdx = updatedCats.findIndex((c) => c.id === targetCat.id);

    if (fromIdx > -1 && toIdx > -1) {
      const [moved] = updatedCats.splice(fromIdx, 1);
      updatedCats.splice(toIdx, 0, moved);

      updatedCats.forEach((c, idx) => {
        c.sort_order = idx + 1;
      });

      setCategories([...updatedCats]);
      setDraggedCatId(null);

      for (const c of updatedCats) {
        await supabase
          .from("categories")
          .update({ sort_order: c.sort_order })
          .eq("id", c.id);
      }
      showToast("카테고리 순서가 저장되었습니다");
    }
  };

  // Menu DND Handlers
  const [touchActiveMenuId, setTouchActiveMenuId] = useState(null);
  const [touchOverMenuId, setTouchOverMenuId] = useState(null);

  const handleTouchStart = (e, menu) => {
    setTouchActiveMenuId(menu.id);
  };

  const handleTouchMove = (e) => {
    if (!touchActiveMenuId) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;

    const itemEl = targetEl.closest(".admin-list-item");
    if (itemEl && itemEl.dataset && itemEl.dataset.menuid) {
      const overId = itemEl.dataset.menuid;
      const rect = itemEl.getBoundingClientRect();
      const isBottom = touch.clientY - rect.top > rect.height / 2;
      setDropPos(isBottom ? "bottom" : "top");
      if (overId !== touchActiveMenuId) {
        setTouchOverMenuId(overId);
      }
    }
  };

  const handleTouchEnd = async (e, currentCatId) => {
    if (touchActiveMenuId && touchOverMenuId) {
      const catMenus = menuItems
        .filter((m) => m.category_id === currentCatId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const fromIdx = catMenus.findIndex((m) => m.id === touchActiveMenuId);
      const toIdx = catMenus.findIndex((m) => m.id === touchOverMenuId);

      if (fromIdx > -1 && toIdx > -1 && fromIdx !== toIdx) {
        let insertIdx = toIdx;
        if (dropPos === "bottom") {
          insertIdx = fromIdx < toIdx ? toIdx : toIdx + 1;
        }
        const [moved] = catMenus.splice(fromIdx, 1);
        catMenus.splice(insertIdx, 0, moved);

        catMenus.forEach((m, idx) => {
          m.sort_order = idx + 1;
        });

        setMenuItems((prev) =>
          prev.map((m) => {
            const found = catMenus.find((cm) => cm.id === m.id);
            return found ? { ...m, sort_order: found.sort_order } : m;
          }),
        );

        for (const m of catMenus) {
          await supabase
            .from("menu_items")
            .update({ sort_order: m.sort_order })
            .eq("id", m.id);
        }
        showToast("메뉴 순서가 저장되었습니다");
      }
    }
    setTouchActiveMenuId(null);
    setTouchOverMenuId(null);
  };

  const moveMenuItem = async (targetMenu, direction) => {
    const catId = targetMenu.category_id;
    const catMenus = menuItems
      .filter((m) => m.category_id === catId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const currentIdx = catMenus.findIndex((m) => m.id === targetMenu.id);
    if (currentIdx === -1) return;

    const targetIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= catMenus.length) return;

    const updatedCatMenus = [...catMenus];
    const temp = updatedCatMenus[currentIdx];
    updatedCatMenus[currentIdx] = updatedCatMenus[targetIdx];
    updatedCatMenus[targetIdx] = temp;

    // sort_order 1부터 차례대로 즉각 재할당 (숫자 즉시 변경!)
    updatedCatMenus.forEach((m, idx) => {
      m.sort_order = idx + 1;
    });

    // 1. Local state 즉시 변경 (UI 0ms 반응)
    setMenuItems((prev) =>
      prev.map((m) => {
        const found = updatedCatMenus.find((cm) => cm.id === m.id);
        return found ? { ...m, sort_order: found.sort_order } : m;
      }),
    );

    // 2. DB 비동기 업데이트
    for (const m of updatedCatMenus) {
      await supabase
        .from("menu_items")
        .update({ sort_order: m.sort_order })
        .eq("id", m.id);
    }
  };

  const handleMenuDragStart = (e, menu) => {
    e.stopPropagation();
    setDraggedMenuId(menu.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", menu.id);
  };

  const handleMenuDragOver = (e, menuId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isBottom = e.clientY - rect.top > rect.height / 2;
    setDropPos(isBottom ? "bottom" : "top");
    if (draggedMenuId && draggedMenuId !== menuId) {
      setDragOverMenuId(menuId);
    }
  };

  const handleMenuDropOnItem = async (e, targetMenu) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverMenuId(null);

    if (!draggedMenuId || draggedMenuId === targetMenu.id) return;

    const draggedMenu = menuItems.find((m) => m.id === draggedMenuId);
    if (!draggedMenu) return;

    const isSameCat = draggedMenu.category_id === targetMenu.category_id;
    const targetCatId = targetMenu.category_id;

    if (isSameCat) {
      const catMenus = menuItems
        .filter((m) => m.category_id === targetCatId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const fromIdx = catMenus.findIndex((m) => m.id === draggedMenuId);
      const toIdx = catMenus.findIndex((m) => m.id === targetMenu.id);

      if (fromIdx > -1 && toIdx > -1) {
        let insertIdx = toIdx;
        if (dropPos === "bottom") {
          insertIdx = fromIdx < toIdx ? toIdx : toIdx + 1;
        }
        const [moved] = catMenus.splice(fromIdx, 1);
        catMenus.splice(insertIdx, 0, moved);

        catMenus.forEach((m, idx) => {
          m.sort_order = idx + 1;
        });

        setMenuItems((prev) =>
          prev.map((m) => {
            const found = catMenus.find((cm) => cm.id === m.id);
            return found ? { ...m, sort_order: found.sort_order } : m;
          }),
        );
        setDraggedMenuId(null);

        for (const m of catMenus) {
          await supabase
            .from("menu_items")
            .update({ sort_order: m.sort_order })
            .eq("id", m.id);
        }
        showToast("메뉴 순서가 저장되었습니다");
      }
    } else {
      const destCatMenus = menuItems
        .filter((m) => m.category_id === targetCatId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const toIdx = destCatMenus.findIndex((m) => m.id === targetMenu.id);

      const movedMenu = { ...draggedMenu, category_id: targetCatId };
      destCatMenus.splice(toIdx, 0, movedMenu);

      destCatMenus.forEach((m, idx) => {
        m.sort_order = idx + 1;
      });

      setMenuItems((prev) =>
        prev.map((m) => {
          if (m.id === draggedMenuId) {
            const updatedSelf = destCatMenus.find((cm) => cm.id === m.id);
            return updatedSelf || { ...m, category_id: targetCatId };
          }
          const updatedOther = destCatMenus.find((cm) => cm.id === m.id);
          return updatedOther || m;
        }),
      );
      setDraggedMenuId(null);

      for (const m of destCatMenus) {
        await supabase
          .from("menu_items")
          .update({ category_id: m.category_id, sort_order: m.sort_order })
          .eq("id", m.id);
      }
    }
  };

  const handleMenuDropOnCatHeader = async (e, targetCatId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverMenuId(null);

    if (!draggedMenuId) return;

    const draggedMenu = menuItems.find((m) => m.id === draggedMenuId);
    if (!draggedMenu) return;

    if (draggedMenu.category_id !== targetCatId) {
      const destCatMenus = menuItems.filter(
        (m) => m.category_id === targetCatId,
      );
      const newSortOrder = destCatMenus.length + 1;

      setMenuItems((prev) =>
        prev.map((m) =>
          m.id === draggedMenuId
            ? { ...m, category_id: targetCatId, sort_order: newSortOrder }
            : m,
        ),
      );
      setDraggedMenuId(null);

      await supabase
        .from("menu_items")
        .update({ category_id: targetCatId, sort_order: newSortOrder })
        .eq("id", draggedMenuId);
    } else {
      setDraggedMenuId(null);
    }
  };

  const handleMenuDragEnd = () => {
    setDraggedMenuId(null);
    setDragOverMenuId(null);
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
          maxWidth: "800px",
          width: "100%",
          margin: "0 auto 24px",
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
                    기본 메뉴판 세팅하기
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

                <div className="actions">
                  <button onClick={saveCategory}>저장</button>
                  <button onClick={() => setIsAddingCat(false)}>취소</button>
                </div>
              </div>
            )}

            {/* Category Accordion Items */}
            {categories.map((cat, catIdx) => {
              const isCollapsed = !!collapsedCats[cat.id];
              const catMenus = menuItems
                .filter((m) => m.category_id === cat.id)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

              const activeOverCatId = dragOverCatId || touchOverCatId;
              const catOverIdx = categories.findIndex((c) => c.id === activeOverCatId);
              const prevCatId = catOverIdx > 0 ? categories[catOverIdx - 1].id : null;
              const isLastCatOver = catOverIdx === categories.length - 1;

              const activeOverMenuId = dragOverMenuId || touchOverMenuId;
              const menuOverIdx = catMenus.findIndex((m) => m.id === activeOverMenuId);
              const prevMenuId = menuOverIdx > 0 ? catMenus[menuOverIdx - 1].id : null;
              const isLastMenuOver = menuOverIdx === catMenus.length - 1;

              const isCatOver = activeOverCatId === cat.id;
              const isCatPrevOver = cat.id === prevCatId;

              let showCatTopHighlight = false;
              let showCatBottomHighlight = false;

              if (activeOverCatId) {
                if (dropPos === "top") {
                  showCatTopHighlight = isCatOver;
                  showCatBottomHighlight = isCatPrevOver;
                } else {
                  showCatBottomHighlight = isCatOver;
                }
              }

              return (
                <div
                  key={cat.id}
                  data-catid={cat.id}
                  className={`accordion-section ${draggedCatId === cat.id || touchActiveCatId === cat.id ? "dragging" : ""} ${showCatTopHighlight ? "drag-over" : ""} ${showCatBottomHighlight ? "drag-over-bottom" : ""}`}
                  onDragOver={(e) => {
                    if (draggedCatId) {
                      handleCatDragOver(e, cat.id);
                    } else if (draggedMenuId) {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => {
                    if (draggedCatId) {
                      handleCatDrop(e, cat);
                    } else if (draggedMenuId) {
                      handleMenuDropOnCatHeader(e, cat.id);
                    }
                  }}
                >
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

                      <div className="actions" style={{ marginTop: "22px" }}>
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
                        {/* 카테고리 햄버거 드래그 핸들 */}
                        <span
                          className="drag-handle touch-handle"
                          draggable
                          onDragStart={(e) => handleCatDragStart(e, cat)}
                          onDragEnd={() => setDraggedCatId(null)}
                          onTouchStart={(e) => handleCatTouchStart(e, cat)}
                          onTouchMove={handleCatTouchMove}
                          onTouchEnd={handleCatTouchEnd}
                          onClick={(e) => e.stopPropagation()}
                          title="드래그하여 카테고리 순서 변경"
                          style={{ marginRight: "6px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                          </svg>
                        </span>
                        <span
                          className="accordion-chevron"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                            marginRight: "6px",
                            color: "var(--gold-main)",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </span>
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
                              <label>소속 카테고리</label>
                              <select
                                className="cat-select-dropdown"
                                value={menuForm.category_id || cat.id}
                                onChange={(e) =>
                                  setMenuForm({
                                    ...menuForm,
                                    category_id: e.target.value,
                                  })
                                }
                              >
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name_ko} (
                                    {c.id.replace(`${session.user.id}_`, "")})
                                  </option>
                                ))}
                              </select>
                            </div>
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
                                value={menuForm.price === "" ? "" : (menuForm.price === 0 ? "" : menuForm.price)}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  setMenuForm({
                                    ...menuForm,
                                    price: e.target.value === "" ? "" : Number(e.target.value),
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
                                onFocus={(e) => e.target.select()}
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
                        {catMenus.map((menu, idx) => {
                          const isMenuOver = activeOverMenuId === menu.id;
                          const isMenuPrevOver = menu.id === prevMenuId;

                          let showMenuTopHighlight = false;
                          let showMenuBottomHighlight = false;

                          if (activeOverMenuId) {
                            if (dropPos === "top") {
                              showMenuTopHighlight = isMenuOver;
                              showMenuBottomHighlight = isMenuPrevOver;
                            } else {
                              showMenuBottomHighlight = isMenuOver;
                            }
                          }

                          return (
                            <li
                              key={menu.id}
                              data-menuid={menu.id}
                              className={`admin-list-item ${editMenuId === menu.id ? "editing" : ""} ${draggedMenuId === menu.id || touchActiveMenuId === menu.id ? "dragging" : ""} ${showMenuTopHighlight ? "drag-over" : ""} ${showMenuBottomHighlight ? "drag-over-bottom" : ""}`}
                            onDragOver={(e) => handleMenuDragOver(e, menu.id)}
                            onDrop={(e) => handleMenuDropOnItem(e, menu)}
                          >
                            {editMenuId === menu.id ? (
                              <div className="edit-form">
                                <div className="form-group">
                                  <label>소속 카테고리</label>
                                  <select
                                    className="cat-select-dropdown"
                                    value={menuForm.category_id || cat.id}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        category_id: e.target.value,
                                      })
                                    }
                                  >
                                    {categories.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name_ko} (
                                        {c.id.replace(
                                          `${session.user.id}_`,
                                          "",
                                        )}
                                        )
                                      </option>
                                    ))}
                                  </select>
                                </div>
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
                                    value={menuForm.price === "" ? "" : (menuForm.price === 0 ? "" : menuForm.price)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) =>
                                      setMenuForm({
                                        ...menuForm,
                                        price: e.target.value === "" ? "" : Number(e.target.value),
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
                                    onFocus={(e) => e.target.select()}
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
                                  <div className="menu-order-control">
                                    <span
                                      className="drag-handle touch-handle"
                                      draggable
                                      onDragStart={(e) =>
                                        handleMenuDragStart(e, menu)
                                      }
                                      onDragEnd={handleMenuDragEnd}
                                      onTouchStart={(e) =>
                                        handleTouchStart(e, menu)
                                      }
                                      onTouchMove={handleTouchMove}
                                      onTouchEnd={(e) =>
                                        handleTouchEnd(e, cat.id)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      title="드래그하여 순서 변경"
                                    >
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                        <line x1="4" y1="6" x2="20" y2="6" />
                                        <line x1="4" y1="12" x2="20" y2="12" />
                                        <line x1="4" y1="18" x2="20" y2="18" />
                                      </svg>
                                    </span>
                                  </div>

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
                                    <button onClick={() => deleteMenu(menu.id)}>
                                      삭제
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {toastMessage && (
          <div className={`toast-notification ${isToastExiting ? "exiting" : ""}`}>
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
