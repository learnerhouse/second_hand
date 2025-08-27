-- 插入测试分类数据
-- 添加商品分类测试数据
INSERT INTO public.categories (id, name, description, icon, is_active, sort_order) VALUES
  (gen_random_uuid(), '电子产品', '手机、电脑、数码设备等', '📱', true, 1),
  (gen_random_uuid(), '家居用品', '家具、装饰、生活用品等', '🏠', true, 2),
  (gen_random_uuid(), '服装配饰', '衣服、鞋子、包包等', '👕', true, 3),
  (gen_random_uuid(), '图书音像', '书籍、CD、DVD等', '📚', true, 4),
  (gen_random_uuid(), '运动户外', '运动器材、户外用品等', '⚽', true, 5),
  (gen_random_uuid(), '技能服务', '设计、编程、咨询等服务', '💼', true, 6),
  (gen_random_uuid(), '手工艺品', '手工制作的艺术品和工艺品', '🎨', true, 7)
ON CONFLICT (name) DO NOTHING;

-- 创建测试用户配置（需要先有认证用户）
-- 注意：这些UUID需要对应实际的auth.users记录
-- 在实际使用中，用户注册时会自动创建profiles记录

-- 插入测试商品数据
DO $$
DECLARE
    category_electronics UUID;
    category_home UUID;
    category_clothing UUID;
    category_books UUID;
    category_sports UUID;
    category_services UUID;
    category_crafts UUID;
    test_seller_id UUID := gen_random_uuid();
BEGIN
    -- 获取分类ID
    SELECT id INTO category_electronics FROM public.categories WHERE name = '电子产品' LIMIT 1;
    SELECT id INTO category_home FROM public.categories WHERE name = '家居用品' LIMIT 1;
    SELECT id INTO category_clothing FROM public.categories WHERE name = '服装配饰' LIMIT 1;
    SELECT id INTO category_books FROM public.categories WHERE name = '图书音像' LIMIT 1;
    SELECT id INTO category_sports FROM public.categories WHERE name = '运动户外' LIMIT 1;
    SELECT id INTO category_services FROM public.categories WHERE name = '技能服务' LIMIT 1;
    SELECT id INTO category_crafts FROM public.categories WHERE name = '手工艺品' LIMIT 1;

    -- 插入测试商品
    INSERT INTO public.products (
        id, seller_id, category_id, title, description, price, condition, 
        location, status, images, tags, is_featured, view_count, sort_order
    ) VALUES
        (gen_random_uuid(), test_seller_id, category_electronics, 'iPhone 13 Pro', '几乎全新的iPhone 13 Pro，128GB存储空间，深空灰色。包装盒和配件齐全。', 4500.00, 'like_new', '北京市朝阳区', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['苹果', '手机', '电子产品'], true, 156, 1),
        (gen_random_uuid(), test_seller_id, category_electronics, 'MacBook Air M2', '2022款MacBook Air，M2芯片，8GB内存，256GB存储。轻度使用，外观完好。', 7800.00, 'good', '上海市浦东新区', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['苹果', '笔记本', '电脑'], true, 89, 2),
        (gen_random_uuid(), test_seller_id, category_home, '北欧风餐桌', '实木制作的北欧风格餐桌，可坐4-6人。桌面有轻微使用痕迹，但结构稳固。', 1200.00, 'good', '广州市天河区', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['家具', '餐桌', '北欧风'], false, 45, 3),
        (gen_random_uuid(), test_seller_id, category_clothing, 'Uniqlo羽绒服', 'Uniqlo男士轻薄羽绒服，黑色，L码。去年冬天购买，穿过几次，九成新。', 280.00, 'like_new', '深圳市南山区', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['优衣库', '羽绒服', '男装'], false, 23, 4),
        (gen_random_uuid(), test_seller_id, category_books, '《设计心理学》', '唐纳德·诺曼经典设计书籍，中文版。书页干净，无划线和笔记。', 35.00, 'good', '杭州市西湖区', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['设计', '心理学', '书籍'], false, 12, 5),
        (gen_random_uuid(), test_seller_id, category_sports, '瑜伽垫套装', '包含瑜伽垫、瑜伽砖、拉力带等。适合初学者使用，使用次数不多。', 150.00, 'good', '成都市锦江区', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['瑜伽', '运动', '健身'], false, 34, 6),
        (gen_random_uuid(), test_seller_id, category_services, 'Logo设计服务', '专业平面设计师，提供Logo设计服务。包含3个初稿方案，无限次修改直到满意。', 500.00, 'new', '线上服务', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['设计', '服务', 'Logo'], true, 67, 7),
        (gen_random_uuid(), test_seller_id, category_crafts, '手工陶瓷花瓶', '纯手工制作的陶瓷花瓶，独特的釉色和纹理。高度约25cm，适合插花装饰。', 180.00, 'new', '景德镇市', 'active', ARRAY['/placeholder.svg?height=300&width=300'], ARRAY['陶瓷', '手工', '花瓶', '装饰'], false, 28, 8);
END $$;
