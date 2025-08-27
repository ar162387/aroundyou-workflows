import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star, ShoppingCart, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  user_type: 'consumer' | 'merchant' | 'admin';
}

interface Shop {
  shop_id: string;
  shop_name: string;
  description: string | null;
  category: string;
  status: 'open' | 'closed' | 'holiday';
  address: string;
  phone_number: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  opening_hours: any;
  free_delivery_threshold: number;
}

interface Product {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  sub_category: string | null;
  image_urls: string[] | null;
  stock_quantity: number;
  is_available: boolean;
  shop_id: string;
  shop?: Shop;
}

interface Order {
  order_id: string;
  order_date: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  total_amount: number;
  final_amount: number;
  delivery_fee: number;
  delivery_type: 'pickup' | 'shop_delivery';
  shop?: Shop;
  order_items?: {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: Product;
  }[];
}

const ConsumerDashboard = ({ userProfile }: { userProfile: UserProfile }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('status', 'open');

      if (error) throw error;
      setShops(data || []);
    } catch (error: any) {
      console.error('Error fetching shops:', error);
      toast.error('Error loading shops');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          shop:shops(*)
        `)
        .eq('is_available', true)
        .gt('stock_quantity', 0);

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shop:shops(*),
          order_items(
            *,
            product:products(*)
          )
        `)
        .eq('consumer_id', userProfile.user_id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Error loading orders');
    }
  };

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
    toast.success('Added to cart');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shop?.shop_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48">
                <CardContent className="p-4">
                  <div className="h-4 w-full bg-muted rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome, {userProfile.first_name}!</h1>
        {cartItemsCount > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <ShoppingCart className="h-4 w-4 mr-1" />
            {cartItemsCount} items
          </Badge>
        )}
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Shops</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Card key={shop.shop_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {shop.cover_image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={shop.cover_image_url}
                      alt={shop.shop_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{shop.shop_name}</CardTitle>
                      <CardDescription>{shop.category}</CardDescription>
                    </div>
                    <Badge variant={shop.status === 'open' ? 'default' : 'secondary'}>
                      {shop.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {shop.address}
                    </div>
                    {shop.phone_number && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {shop.phone_number}
                      </div>
                    )}
                  </div>
                  {shop.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {shop.description}
                    </p>
                  )}
                  <div className="mt-4 text-sm">
                    <span className="text-green-600">
                      Free delivery over Rs. {shop.free_delivery_threshold}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.product_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_urls && product.image_urls[0] && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={product.image_urls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-primary">
                      {product.currency} {product.price}
                    </span>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    <span>From: {product.shop?.shop_name}</span>
                    <br />
                    <span>Stock: {product.stock_quantity}</span>
                  </div>
                  <Button 
                    onClick={() => addToCart(product.product_id)}
                    className="w-full"
                    disabled={!product.is_available || product.stock_quantity === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart {cart[product.product_id] && `(${cart[product.product_id]})`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <h2 className="text-2xl font-semibold">Order History</h2>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No orders yet. Start shopping!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.order_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.order_id.slice(-8)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(order.order_date).toLocaleDateString()} from {order.shop?.shop_name}
                        </CardDescription>
                      </div>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Order Details:</p>
                        <div className="space-y-1 text-sm">
                          <div>Items: Rs. {order.total_amount}</div>
                          <div>Delivery: Rs. {order.delivery_fee}</div>
                          <div className="font-semibold">Total: Rs. {order.final_amount}</div>
                          <div>Type: {order.delivery_type}</div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Items:</p>
                        <div className="space-y-1">
                          {order.order_items?.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.product?.name} × {item.quantity} - Rs. {item.total_price}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsumerDashboard;