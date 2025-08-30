-- 创建商品图片存储桶
-- 注意：这个脚本需要在Supabase Dashboard的SQL Editor中执行

-- 1. 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 创建存储策略：允许已认证用户上传图片
CREATE POLICY "users_upload_product_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

-- 3. 创建存储策略：允许用户查看图片
CREATE POLICY "users_view_product_images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-images'
  );

-- 4. 创建存储策略：允许用户删除自己的图片
CREATE POLICY "users_delete_own_product_images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. 验证存储桶创建
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'product-images';

-- 6. 验证存储策略
SELECT 
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;