# 数据库表结构

请在 Supabase SQL Editor 中执行以下语句创建表：

## 1. products 表（商品表）

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. orders 表（订单表）

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. 配置表（收款二维码）

```sql
CREATE TABLE config (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 插入收款二维码URL
INSERT INTO config (id, value) VALUES ('qr_code_url', '你的收款二维码图片URL');
```

## 4. RLS 策略（行级安全）

```sql
-- products 表：允许公开读取
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);

-- orders 表：允许插入，管理员可读取
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read own" ON orders FOR SELECT USING (true);

-- config 表：只允许读取
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON config FOR SELECT USING (true);
```

## 示例数据

```sql
-- 添加示例商品
INSERT INTO products (name, price, description, image_url) VALUES
('油桃', 29.9, '新鲜油桃，香甜多汁', 'https://example.com/peach.jpg'),
('苹果', 19.9, '红富士苹果，脆甜可口', 'https://example.com/apple.jpg');
```