-- 1. 기타 카테고리가 없다면 생성
INSERT INTO public.categories (id, name_ko, name_en, sort_order) 
VALUES ('custom_cat', '기타', 'Other', 99) 
ON CONFLICT (id) DO NOTHING;

-- 2. 기타 메뉴(직접 입력) 생성
INSERT INTO public.menu_items (id, category_id, name_ko, name_en, price, sort_order) 
VALUES ('custom', 'custom_cat', '기타 시술 (직접 입력)', 'Custom Item', 0, 999) 
ON CONFLICT (id) DO NOTHING;
