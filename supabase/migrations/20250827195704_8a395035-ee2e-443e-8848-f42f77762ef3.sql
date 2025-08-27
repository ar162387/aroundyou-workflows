-- Enable PostGIS extension for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom types
CREATE TYPE user_type AS ENUM ('consumer', 'merchant', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid', 'refunded');
CREATE TYPE delivery_type AS ENUM ('pickup', 'shop_delivery');
CREATE TYPE shop_status AS ENUM ('open', 'closed', 'holiday');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount', 'buy_x_get_y');

-- Users table with geospatial support
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE,
    password_hash TEXT,
    user_type user_type NOT NULL DEFAULT 'consumer',
    first_name TEXT,
    last_name TEXT,
    profile_picture_url TEXT,
    last_known_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shops table with location and delivery areas
CREATE TABLE public.shops (
    shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    delivery_areas GEOGRAPHY(MULTIPOLYGON, 4326),
    category TEXT NOT NULL,
    opening_hours JSONB,
    status shop_status NOT NULL DEFAULT 'open',
    logo_url TEXT,
    cover_image_url TEXT,
    free_delivery_threshold DECIMAL(10,2) DEFAULT 600.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(merchant_user_id, shop_name)
);

-- Products table
CREATE TABLE public.products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    category TEXT NOT NULL,
    sub_category TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_urls TEXT[],
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table with geospatial delivery location
CREATE TABLE public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    payment_method TEXT,
    delivery_type delivery_type NOT NULL,
    pickup_time TIMESTAMPTZ,
    delivery_address JSONB,
    delivery_location GEOGRAPHY(POINT, 4326),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items table
CREATE TABLE public.order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Reviews and Ratings table
CREATE TABLE public.reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    shop_id UUID REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(product_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (shop_id IS NOT NULL OR product_id IS NOT NULL)
);

-- Promotions and Deals table
CREATE TABLE public.deals (
    deal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    min_order_amount DECIMAL(10,2),
    usage_limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date > start_date)
);

-- Delivery Fee Tiers table
CREATE TABLE public.delivery_fee_tiers (
    tier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_distance_m INTEGER NOT NULL,
    max_distance_m INTEGER,
    delivery_fee DECIMAL(10,2) NOT NULL,
    per_extra_distance_m INTEGER,
    per_extra_fee DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (max_distance_m IS NULL OR max_distance_m > min_distance_m)
);

-- Create GiST indexes for geospatial queries
CREATE INDEX idx_users_last_known_location ON public.users USING GIST (last_known_location);
CREATE INDEX idx_shops_location ON public.shops USING GIST (location);
CREATE INDEX idx_shops_delivery_areas ON public.shops USING GIST (delivery_areas);
CREATE INDEX idx_orders_delivery_location ON public.orders USING GIST (delivery_location);

-- Create B-tree indexes for regular queries
CREATE INDEX idx_shops_merchant_user_id ON public.shops (merchant_user_id);
CREATE INDEX idx_products_shop_id ON public.products (shop_id);
CREATE INDEX idx_orders_consumer_id ON public.orders (consumer_id);
CREATE INDEX idx_orders_shop_id ON public.orders (shop_id);
CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX idx_reviews_consumer_id ON public.reviews (consumer_id);
CREATE INDEX idx_reviews_shop_id ON public.reviews (shop_id);
CREATE INDEX idx_deals_shop_id ON public.deals (shop_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delivery_fee_tiers_updated_at BEFORE UPDATE ON public.delivery_fee_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default delivery fee tiers
INSERT INTO public.delivery_fee_tiers (min_distance_m, max_distance_m, delivery_fee, per_extra_distance_m, per_extra_fee) VALUES
(0, 300, 30.00, NULL, NULL),
(301, 500, 40.00, NULL, NULL),
(501, 700, 50.00, NULL, NULL),
(701, 1000, 60.00, NULL, NULL),
(1001, NULL, 60.00, 200, 10.00);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fee_tiers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create a user profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shops policies
CREATE POLICY "Anyone can view active shops" ON public.shops FOR SELECT USING (true);
CREATE POLICY "Merchants can create their own shops" ON public.shops FOR INSERT WITH CHECK (auth.uid() = merchant_user_id);
CREATE POLICY "Merchants can update their own shops" ON public.shops FOR UPDATE USING (auth.uid() = merchant_user_id);
CREATE POLICY "Merchants can delete their own shops" ON public.shops FOR DELETE USING (auth.uid() = merchant_user_id);

-- Products policies
CREATE POLICY "Anyone can view available products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Merchants can manage products in their shops" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE shops.shop_id = products.shop_id AND shops.merchant_user_id = auth.uid())
);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (
    auth.uid() = consumer_id OR 
    EXISTS (SELECT 1 FROM public.shops WHERE shops.shop_id = orders.shop_id AND shops.merchant_user_id = auth.uid())
);
CREATE POLICY "Consumers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Consumers and merchants can update orders" ON public.orders FOR UPDATE USING (
    auth.uid() = consumer_id OR 
    EXISTS (SELECT 1 FROM public.shops WHERE shops.shop_id = orders.shop_id AND shops.merchant_user_id = auth.uid())
);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.order_id = order_items.order_id 
        AND (orders.consumer_id = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.shops WHERE shops.shop_id = orders.shop_id AND shops.merchant_user_id = auth.uid()))
    )
);
CREATE POLICY "Order items are managed through orders" ON public.order_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.order_id = order_items.order_id 
        AND (orders.consumer_id = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.shops WHERE shops.shop_id = orders.shop_id AND shops.merchant_user_id = auth.uid()))
    )
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Consumers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Consumers can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = consumer_id);
CREATE POLICY "Consumers can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = consumer_id);

-- Deals policies
CREATE POLICY "Anyone can view active deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Merchants can manage deals for their shops" ON public.deals FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE shops.shop_id = deals.shop_id AND shops.merchant_user_id = auth.uid())
);

-- Delivery fee tiers policies (read-only for most users, admin-only for modifications)
CREATE POLICY "Anyone can view delivery fee tiers" ON public.delivery_fee_tiers FOR SELECT USING (true);