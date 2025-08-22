import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ShopCard from './ShopCard';
import MapboxMap from './MapboxMap';
import { Search, Filter, Grid, Map, SlidersHorizontal } from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Shops', count: 47 },
  { id: 'restaurant', name: 'Restaurants', count: 18 },
  { id: 'grocery', name: 'Groceries', count: 12 },
  { id: 'electronics', name: 'Electronics', count: 8 },
  { id: 'pharmacy', name: 'Pharmacy', count: 6 },
  { id: 'fashion', name: 'Fashion', count: 3 },
];

const sampleShops = [
  {
    name: "Fresh Valley Groceries",
    category: "Grocery Store",
    rating: 4.6,
    deliveryTime: "15-25 min",
    distance: "0.8 km",
    tags: ["Fresh Produce", "Organic", "24/7"],
    freeDelivery: true,
    isOpen: true
  },
  {
    name: "Spice Garden Restaurant",
    category: "Pakistani Cuisine",
    rating: 4.4,
    deliveryTime: "20-35 min", 
    distance: "1.2 km",
    tags: ["Halal", "Spicy", "Family"],
    freeDelivery: false,
    isOpen: true
  },
  {
    name: "Tech Hub Electronics",
    category: "Electronics",
    rating: 4.8,
    deliveryTime: "30-45 min",
    distance: "2.1 km", 
    tags: ["Gadgets", "Repair", "Warranty"],
    freeDelivery: true,
    isOpen: true
  },
  {
    name: "Midnight Pharmacy",
    category: "Healthcare",
    rating: 4.2,
    deliveryTime: "10-20 min",
    distance: "0.5 km",
    tags: ["24/7", "Prescription", "Emergency"],
    freeDelivery: false,
    isOpen: false
  },
  {
    name: "Fashion Forward",
    category: "Clothing",
    rating: 4.7,
    deliveryTime: "25-40 min",
    distance: "1.8 km",
    tags: ["Trendy", "Affordable", "Local"],
    freeDelivery: true,
    isOpen: true
  },
  {
    name: "Coffee Corner Café",
    category: "Beverages",
    rating: 4.5,
    deliveryTime: "10-15 min",
    distance: "0.3 km",
    tags: ["Coffee", "Pastries", "Cozy"],
    freeDelivery: false,
    isOpen: true
  }
];

const ShopDiscovery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShops = sampleShops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shop.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Discover Local Shops
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find everything you need from trusted local businesses in your neighborhood
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input 
              type="text" 
              placeholder="Search shops, products, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-base rounded-xl shadow-custom-sm focus:shadow-custom-md transition-smooth"
            />
          </div>

          {/* Category filters and view toggle */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Categories */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full"
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* View toggle and filters */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <div className="flex items-center bg-muted rounded-full p-1">
                <Button
                  variant={viewMode === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-full h-8 px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-full h-8 px-3"
                >
                  <Map className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'map' ? (
          <div className="mb-8">
            <MapboxMap />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredShops.map((shop, index) => (
              <ShopCard
                key={index}
                name={shop.name}
                category={shop.category}
                rating={shop.rating}
                deliveryTime={shop.deliveryTime}
                distance={shop.distance}
                tags={shop.tags}
                freeDelivery={shop.freeDelivery}
                isOpen={shop.isOpen}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {viewMode === 'grid' && (
          <div className="text-center">
            <Button variant="outline" size="lg" className="rounded-full px-8">
              Load More Shops
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopDiscovery;