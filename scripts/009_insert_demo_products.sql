-- 移除profiles表插入，避免外键约束错误
-- 插入演示商品数据
-- 注意：商品暂时没有seller_id，等用户注册后可以分配

-- 获取分类ID并插入商品
DO $$
DECLARE
    category_secondhand_id uuid;
    category_skills_id uuid;
    category_crafts_id uuid;
BEGIN
    -- 获取分类ID
    SELECT id INTO category_secondhand_id FROM public.categories WHERE name = '二手物品' LIMIT 1;
    SELECT id INTO category_skills_id FROM public.categories WHERE name = '技能服务' LIMIT 1;
    SELECT id INTO category_crafts_id FROM public.categories WHERE name = '手工艺品' LIMIT 1;
    
    -- 插入二手物品，seller_id设为NULL避免外键约束
    INSERT INTO public.products (
        id, title, description, price, condition, status, category_id, seller_id, 
        location, tags, images, is_featured, view_count, sort_order
    ) VALUES 
        (
            gen_random_uuid(),
            'iPhone 13 Pro 256GB',
            '九成新iPhone 13 Pro，256GB存储，深空灰色。无磕碰，功能完好，配原装充电器和数据线。',
            4500.00,
            'like_new',
            'active',
            category_secondhand_id,
            NULL,
            '北京市朝阳区',
            ARRAY['手机', '苹果', 'iPhone'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            true,
            156,
            1
        ),
        (
            gen_random_uuid(),
            'MacBook Air M2 13寸',
            '2022款MacBook Air，M2芯片，8GB内存，256GB SSD。轻度使用，外观完好。',
            7800.00,
            'good',
            'active',
            category_secondhand_id,
            NULL,
            '上海市浦东新区',
            ARRAY['笔记本', '苹果', 'MacBook'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            true,
            89,
            2
        ),
        (
            gen_random_uuid(),
            '小米电视55寸4K',
            '小米电视4A 55寸4K版本，HDR10支持，语音遥控。使用两年，功能正常。',
            1200.00,
            'good',
            'active',
            category_secondhand_id,
            NULL,
            '广州市天河区',
            ARRAY['电视', '小米', '4K'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            67,
            3
        ),
        (
            gen_random_uuid(),
            '戴森V8吸尘器',
            '戴森V8无线吸尘器，续航35分钟，多个吸头配件齐全。九成新，清洁效果很好。',
            1800.00,
            'like_new',
            'active',
            category_secondhand_id,
            NULL,
            '北京市朝阳区',
            ARRAY['家电', '戴森', '吸尘器'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            43,
            4
        ),
        (
            gen_random_uuid(),
            '索尼WH-1000XM4耳机',
            '索尼降噪耳机WH-1000XM4，黑色，降噪效果极佳，音质出色。配原装包装盒。',
            1500.00,
            'good',
            'active',
            category_secondhand_id,
            NULL,
            '上海市浦东新区',
            ARRAY['耳机', '索尼', '降噪'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            78,
            5
        );
    
    -- 插入技能服务，seller_id设为NULL
    INSERT INTO public.products (
        id, title, description, price, condition, status, category_id, seller_id, 
        location, tags, images, is_featured, view_count, sort_order
    ) VALUES 
        (
            gen_random_uuid(),
            'Python编程一对一辅导',
            '资深Python开发工程师，5年经验，提供一对一编程辅导。包括基础语法、数据分析、Web开发等。',
            200.00,
            'new',
            'active',
            category_skills_id,
            NULL,
            '北京市朝阳区',
            ARRAY['编程', 'Python', '辅导'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            true,
            234,
            1
        ),
        (
            gen_random_uuid(),
            '英语口语陪练',
            '英语专业八级，海外留学经验，提供英语口语陪练服务。纯正发音，耐心教学。',
            80.00,
            'new',
            'active',
            category_skills_id,
            NULL,
            '上海市浦东新区',
            ARRAY['英语', '口语', '陪练'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            true,
            167,
            2
        ),
        (
            gen_random_uuid(),
            '摄影技巧培训',
            '专业摄影师，10年拍摄经验，教授人像、风景、商业摄影技巧。理论+实践相结合。',
            300.00,
            'new',
            'active',
            category_skills_id,
            NULL,
            '广州市天河区',
            ARRAY['摄影', '培训', '技巧'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            98,
            3
        ),
        (
            gen_random_uuid(),
            '吉他教学',
            '音乐学院毕业，专业吉他老师，教授民谣吉他、古典吉他。从零基础到进阶都可以。',
            150.00,
            'new',
            'active',
            category_skills_id,
            NULL,
            '北京市朝阳区',
            ARRAY['音乐', '吉他', '教学'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            76,
            4
        );
    
    -- 插入手工艺品，seller_id设为NULL
    INSERT INTO public.products (
        id, title, description, price, condition, status, category_id, seller_id, 
        location, tags, images, is_featured, view_count, sort_order
    ) VALUES 
        (
            gen_random_uuid(),
            '手工编织羊毛围巾',
            '纯手工编织羊毛围巾，100%澳洲美利奴羊毛，柔软保暖。多种颜色可选，可定制。',
            280.00,
            'new',
            'active',
            category_crafts_id,
            NULL,
            '上海市浦东新区',
            ARRAY['手工', '编织', '围巾'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            true,
            145,
            1
        ),
        (
            gen_random_uuid(),
            '陶瓷花瓶套装',
            '手工制作陶瓷花瓶，釉色温润，造型优美。一套三个不同尺寸，适合现代家居装饰。',
            450.00,
            'new',
            'active',
            category_crafts_id,
            NULL,
            '广州市天河区',
            ARRAY['陶瓷', '花瓶', '装饰'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            true,
            89,
            2
        ),
        (
            gen_random_uuid(),
            '木质首饰盒',
            '精选胡桃木手工制作，内部绒布衬里，多层收纳设计。表面抛光处理，质感温润。',
            320.00,
            'new',
            'active',
            category_crafts_id,
            NULL,
            '北京市朝阳区',
            ARRAY['木工', '首饰盒', '收纳'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            67,
            3
        ),
        (
            gen_random_uuid(),
            '刺绣装饰画',
            '传统苏绣工艺，花鸟图案，色彩丰富，针法细腻。配精美画框，可直接悬挂。',
            680.00,
            'new',
            'active',
            category_crafts_id,
            NULL,
            '上海市浦东新区',
            ARRAY['刺绣', '装饰画', '传统工艺'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            54,
            4
        ),
        (
            gen_random_uuid(),
            '手工皮具钱包',
            '意大利进口头层牛皮，手工缝制，做工精细。多卡位设计，实用美观，可刻字定制。',
            380.00,
            'new',
            'active',
            category_crafts_id,
            NULL,
            '广州市天河区',
            ARRAY['皮具', '钱包', '手工'],
            ARRAY['/placeholder.svg?height=300&width=300'],
            false,
            92,
            5
        );
        
END $$;

-- 添加函数来将商品分配给真实用户
CREATE OR REPLACE FUNCTION assign_products_to_user(user_id UUID, product_count INTEGER DEFAULT 5)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.products 
    SET seller_id = user_id
    WHERE seller_id IS NULL 
    AND id IN (
        SELECT id FROM public.products 
        WHERE seller_id IS NULL 
        ORDER BY created_at 
        LIMIT product_count
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;
