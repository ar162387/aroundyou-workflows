import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Clock, Star } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/10 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-md animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main headline */}
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Discover
            <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              AroundYou
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your neighborhood marketplace at your fingertips. Find local shops, order from multiple stores, 
            and get everything delivered with smart geospatial discovery.
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/60" />
            </div>
            <Input 
              type="text" 
              placeholder="Search for shops, products, or categories..."
              className="pl-12 pr-32 h-14 text-lg bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 transition-smooth rounded-xl"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
              <Button variant="glass" size="sm" className="h-10 rounded-lg">
                <MapPin className="h-4 w-4 mr-2" />
                Near Me
              </Button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button variant="hero" size="lg" className="text-lg px-8 py-4 h-auto rounded-xl">
            <Search className="mr-3 h-5 w-5" />
            Explore Shops
          </Button>
          <Button variant="glass" size="lg" className="text-lg px-8 py-4 h-auto rounded-xl">
            <MapPin className="mr-3 h-5 w-5" />
            View Map
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-custom-lg">
            <div className="text-3xl font-bold text-white mb-2">500+</div>
            <div className="text-white/80 font-medium">Local Shops</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-custom-lg">
            <div className="flex items-center justify-center text-3xl font-bold text-white mb-2">
              <Clock className="mr-2 h-8 w-8" />
              15min
            </div>
            <div className="text-white/80 font-medium">Average Delivery</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-custom-lg">
            <div className="flex items-center justify-center text-3xl font-bold text-white mb-2">
              <Star className="mr-2 h-8 w-8 text-yellow-400" />
              4.8
            </div>
            <div className="text-white/80 font-medium">Customer Rating</div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};

export default HeroSection;