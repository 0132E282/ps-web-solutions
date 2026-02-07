'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

export const SidebarFilter = () => (
    <div className="w-full lg:w-[280px] shrink-0 space-y-8">
        {/* Search */}
        <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <Input placeholder="Search..." className="pl-9 bg-white border-gray-200" />
        </div>

        {/* Categories */}
        <div>
            <h4 className="font-bold text-brand-dark mb-4">Categories</h4>
            <div className="space-y-2.5">
                {['Admin & Dashboard', 'Landing Pages', 'Business & Corporate', 'Portfolio', 'E-commerce', 'Educational', 'Blog'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <Checkbox id={`cat-${i}`} />
                        <label
                            htmlFor={`cat-${i}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground hover:text-brand-dark cursor-pointer"
                        >
                            {item}
                        </label>
                    </div>
                ))}
            </div>
        </div>

        {/* Price */}
        <div>
            <h4 className="font-bold text-brand-dark mb-4">Price</h4>
             <div className="space-y-2.5">
                {['Free', 'Premium'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <Checkbox id={`price-${i}`} />
                         <label
                            htmlFor={`price-${i}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground hover:text-brand-dark cursor-pointer"
                        >
                            {item}
                        </label>
                    </div>
                ))}
            </div>
        </div>

         {/* Framework */}
        <div>
            <h4 className="font-bold text-brand-dark mb-4">Framework</h4>
             <div className="space-y-2.5">
                {['Bootstrap 5', 'Bootstrap 4', 'Tailwind CSS', 'React', 'Vue', 'Angular'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <Checkbox id={`fw-${i}`} />
                         <label
                            htmlFor={`fw-${i}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground hover:text-brand-dark cursor-pointer"
                        >
                            {item}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
