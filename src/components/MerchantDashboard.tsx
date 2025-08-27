import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Store, Package, ShoppingBag, MapPin, Clock, Edit, Trash2 } from 'lucide-react';
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
}

interface Order {
  order_id: string;
  order_date: string;
  status: 'pending' | 'confirmed' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  total_amount: number;
  final_amount: number;
  delivery_fee: number;
  delivery_type: 'pickup' | 'shop_delivery';
  consumer_id: string;
  shop_id: string;
  order_items?: {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: Product;
  }[];
}

const MerchantDashboard = ({ userProfile }: { userProfile: UserProfile }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewShopDialog, setShowNewShopDialog] = useState(false);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);

  // Shop form state
  const [shopForm, setShopForm] = useState({
    shop_name: '',
    description: '',
    category: '',
    address: '',
    phone_number: '',
    email: '',
    free_delivery_threshold: 600
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sub_category: '',
    stock_quantity: '',
    currency: 'PKR'
  });

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchProducts(selectedShop.shop_id);
      fetchOrders(selectedShop.shop_id);
    }
  }, [selectedShop]);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('merchant_user_id', userProfile.user_id);

      if (error) throw error;
      setShops(data || []);
      if (data && data.length > 0 && !selectedShop) {
        setSelectedShop(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching shops:', error);
      toast.error('Error loading shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId);

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    }
  };

  const fetchOrders = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          )
        `)
        .eq('shop_id', shopId)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Error loading orders');
    }
  };

  const handleCreateShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .insert({
          ...shopForm,
          merchant_user_id: userProfile.user_id,
          status: 'open',
          location: `POINT(74.3587 31.5204)`, // Default Lahore coordinates
        })
        .select()
        .single();

      if (error) throw error;

      setShops(prev => [...prev, data]);
      setSelectedShop(data);
      setShowNewShopDialog(false);
      setShopForm({
        shop_name: '',
        description: '',
        category: '',
        address: '',
        phone_number: '',
        email: '',
        free_delivery_threshold: 600
      });
      toast.success('Shop created successfully!');
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast.error('Error creating shop');
    }
  };

  const handleCreateProduct = async () => {
    if (!selectedShop) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productForm,
          price: parseFloat(productForm.price),
          stock_quantity: parseInt(productForm.stock_quantity),
          shop_id: selectedShop.shop_id,
          is_available: true
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [...prev, data]);
      setShowNewProductDialog(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        sub_category: '',
        stock_quantity: '',
        currency: 'PKR'
      });
      toast.success('Product added successfully!');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error('Error creating product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('order_id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.order_id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success('Order status updated successfully!');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-32">
                <CardContent className="p-4">
                  <div className="h-4 w-full bg-muted rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No shops yet</h3>
            <p className="text-muted-foreground mb-6">Create your first shop to start selling!</p>
            <Dialog open={showNewShopDialog} onOpenChange={setShowNewShopDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shop
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Shop</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new shop
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shop_name">Shop Name</Label>
                    <Input
                      id="shop_name"
                      value={shopForm.shop_name}
                      onChange={(e) => setShopForm(prev => ({ ...prev, shop_name: e.target.value }))}
                      placeholder="Enter shop name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={shopForm.category} onValueChange={(value) => setShopForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                        <SelectItem value="Grocery">Grocery</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={shopForm.address}
                      onChange={(e) => setShopForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter shop address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={shopForm.description}
                      onChange={(e) => setShopForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your shop"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={shopForm.phone_number}
                      onChange={(e) => setShopForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="Shop phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="threshold">Free Delivery Threshold (Rs.)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={shopForm.free_delivery_threshold}
                      onChange={(e) => setShopForm(prev => ({ ...prev, free_delivery_threshold: parseInt(e.target.value) || 600 }))}
                      placeholder="600"
                    />
                  </div>
                  <Button onClick={handleCreateShop} className="w-full">
                    Create Shop
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Select
            value={selectedShop?.shop_id || ''}
            onValueChange={(shopId) => {
              const shop = shops.find(s => s.shop_id === shopId);
              setSelectedShop(shop || null);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select shop" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.shop_id} value={shop.shop_id}>
                  {shop.shop_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showNewShopDialog} onOpenChange={setShowNewShopDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Shop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Shop</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="shop_name">Shop Name</Label>
                  <Input
                    id="shop_name"
                    value={shopForm.shop_name}
                    onChange={(e) => setShopForm(prev => ({ ...prev, shop_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={shopForm.category} onValueChange={(value) => setShopForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                      <SelectItem value="Grocery">Grocery</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={shopForm.address}
                    onChange={(e) => setShopForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <Button onClick={handleCreateShop} className="w-full">Create Shop</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedShop && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  {selectedShop.shop_name}
                </CardTitle>
                <CardDescription>{selectedShop.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{products.length}</div>
                    <div className="text-sm text-muted-foreground">Products</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{orders.length}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {orders.filter(o => o.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Orders</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">Rs. {selectedShop.free_delivery_threshold}</div>
                    <div className="text-sm text-muted-foreground">Free Delivery</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Products</h2>
              <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product_name">Product Name</Label>
                      <Input
                        id="product_name"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product_description">Description</Label>
                      <Textarea
                        id="product_description"
                        value={productForm.description}
                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={productForm.stock_quantity}
                          onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="product_category">Category</Label>
                      <Input
                        id="product_category"
                        value={productForm.category}
                        onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleCreateProduct} className="w-full">Add Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.product_id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{product.currency} {product.price}</span>
                        <Badge variant={product.is_available ? 'default' : 'secondary'}>
                          {product.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {product.stock_quantity} | Category: {product.category}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-semibold">Orders</h2>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
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
                            {new Date(order.order_date).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleUpdateOrderStatus(order.order_id, value as Order['status'])}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shop Settings</CardTitle>
                <CardDescription>Manage your shop configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Shop Name</Label>
                      <Input value={selectedShop.shop_name} readOnly />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={selectedShop.category} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea value={selectedShop.address} readOnly />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={selectedShop.phone_number || ''} readOnly />
                    </div>
                    <div>
                      <Label>Free Delivery Threshold</Label>
                      <Input value={`Rs. ${selectedShop.free_delivery_threshold}`} readOnly />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shop settings editing will be available in future updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MerchantDashboard;