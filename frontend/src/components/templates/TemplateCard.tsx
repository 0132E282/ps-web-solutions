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
    isFree?: boolean;
    slug?: string;
}

export const TemplateCard = ({ image, title, price, isFree, slug }: TemplateCardProps) => {
    const themeSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return (
    <Card className="border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className="relative h-[220px]">
        <Link href={`/templates/${themeSlug}`}>
            <img src={image} alt={title} className="w-full h-full object-cover" />
        </Link>
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <Button className="bg-brand-secondary hover:bg-[#218838] text-white rounded-full font-bold px-6 pointer-events-auto">Live Demo</Button>
        </div>
      </div>
      <CardContent className="p-5">
        <Link href={`/templates/${themeSlug}`} className="hover:text-brand-primary transition-colors">
            <h4 className="text-base font-bold mb-4 line-clamp-2 min-h-[48px] text-brand-dark">{title}</h4>
        </Link>
        <div className="flex justify-between items-center">
          <span className={`text-lg font-bold ${isFree ? 'text-brand-secondary' : 'text-brand-dark'}`}>{isFree ? 'Free' : `$${price}`}</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
               <Star key={i} size={12} fill="#f5a623" color="#f5a623" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
    );
};
