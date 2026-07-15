-- 1. 카테고리 테이블
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name_ko text NOT NULL,
  name_en text NOT NULL,
  sort_order int NOT NULL
);

-- 2. 메뉴 데이터 테이블
CREATE TABLE public.menu_items (
  id text PRIMARY KEY,
  category_id text REFERENCES public.categories(id) ON DELETE CASCADE,
  name_ko text NOT NULL,
  name_en text NOT NULL,
  price int NOT NULL,
  time_ko text,
  time_en text,
  desc_ko text,
  desc_en text,
  badge text,
  membership_eligible boolean DEFAULT false,
  membership_rate int DEFAULT 0,
  length_extra boolean DEFAULT false,
  sub_items_ko jsonb,
  sub_items_en jsonb,
  is_active boolean DEFAULT true,
  sort_order int NOT NULL
);

-- 3. 주문(서명) 기록 테이블
CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  total_price int NOT NULL,
  discount_amount int DEFAULT 0,
  membership_applied boolean DEFAULT false,
  signature_url text NOT NULL,
  terms_agreed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 주문 상세(시술 내역) 테이블
CREATE TABLE public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id text REFERENCES public.menu_items(id),
  price_at_time int NOT NULL
);

-- ==========================================
-- Storage 버킷 생성 (서명 이미지 저장용)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- 버킷 접근 권한(정책) 설정
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');
