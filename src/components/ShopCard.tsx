import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, ShoppingBag } from 'lucide-react';

interface ShopCardProps {
  name: string;
  category: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  image?: string;
  tags?: string[];
  isOpen?: boolean;
  freeDelivery?: boolean;
}

const ShopCard: React.FC<ShopCardProps> = ({
  name,
  category,
  rating,
  deliveryTime,
  distance,
  image,
  tags = [],
  isOpen = true,
  freeDelivery = false,
}) => {
  return (
    <div className="group bg-card rounded-2xl shadow-custom-md hover:shadow-custom-xl transition-smooth overflow-hidden border border-border/50 hover:border-primary/20">
      {/* Image section */}
      <div className="relative h-48 bg-gradient-card overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          />
        ) : (
          <div className="w-full h-full bg-gradient-card flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-primary/40" />
          </div>
        )}
        
        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {!isOpen && (
            <Badge variant="destructive" className="text-xs font-medium">
              Closed
            </Badge>
          )}
          {freeDelivery && (
            <Badge className="bg-accent text-accent-foreground text-xs font-medium">
              Free Delivery
            </Badge>
          )}
        </div>

        {/* Rating badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-custom-sm">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs font-medium text-foreground">{rating}</span>
          </div>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Content section */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-card-foreground mb-1 group-hover:text-primary transition-smooth">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-2 py-0.5 bg-secondary/60 hover:bg-secondary/80 transition-smooth"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{deliveryTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{distance}</span>
          </div>
        </div>

        {/* Action button */}
        <Button 
          className="w-full" 
          variant={isOpen ? "default" : "secondary"}
          disabled={!isOpen}
        >
          {isOpen ? 'Browse Shop' : 'Currently Closed'}
        </Button>
      </div>
    </div>
  );
};

export default ShopCard;