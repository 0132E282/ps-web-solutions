/* eslint-disable @next/next/no-img-element */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

import Link from 'next/link';

export interface TemplateCardProps {
    id: string | number;
    title: string;
    image: string;
    price: number;
    originalPrice?: number;
    isFree?: boolean;
    slug?: string;
    isHot?: boolean;
}

export const TemplateCard = ({ image, title, price, originalPrice, isFree, slug, isHot }: TemplateCardProps) => {
    const themeSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const hasDiscount = originalPrice && originalPrice > price;

    return (
    <Card className="h-full flex flex-col border-none shadow-[0_4px_25px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden group hover:-translate-y-2 transition-all duration-500 bg-white">
      <div className="relative h-[240px] overflow-hidden">
        <Link href={`/templates/${themeSlug}`} className="block h-full">
            <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
        </Link>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isHot && (
                <div className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/40">
                    HOT
                </div>
            )}
            {hasDiscount && (
                <div className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/40">
                    SALE
                </div>
            )}
            {isFree && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/40">
                    FREE
                </div>
            )}
        </div>
      </div>

      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
            <Link href={`/templates/${themeSlug}`} className="block group/title">
                <h4 className="text-[17px] font-bold leading-snug line-clamp-2 min-h-[50px] text-brand-dark group-hover/title:text-brand-primary transition-colors">
                    {title}
                </h4>
            </Link>
        </div>

        <div className="flex-1"></div>

        <div className="flex justify-between items-end border-t border-slate-50 pt-4">
          <div className="flex flex-col">
            {hasDiscount && (
                <span className="text-slate-400 text-xs line-through font-bold mb-0.5">${originalPrice}</span>
            )}
            <span className={`text-xl font-black ${isFree ? 'text-emerald-500' : 'text-brand-dark'}`}>
                {isFree ? 'Freebie' : `$${price}`}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#f5a623" color="#f5a623" />
                ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">1.2k+ Sales</span>
          </div>
        </div>
      </CardContent>
    </Card>
    );
};
