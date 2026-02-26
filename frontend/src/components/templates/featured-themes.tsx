'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useScrollReveal, useScrollRevealGroup } from '@/hooks/use-scroll-reveal';

const themes = [
    {
        title: 'flavor Admin',
        category: 'Admin Dashboard',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
        price: '1.200.000đ',
        tech: ['React', 'Tailwind', 'TypeScript'],
        rating: 4.9,
        sales: 342,
    },
    {
        title: 'flavor Shop',
        category: 'E-Commerce',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
        price: '890.000đ',
        tech: ['Next.js', 'Stripe'],
        rating: 4.8,
        sales: 518,
    },
    {
        title: 'flavor Portfolio',
        category: 'Portfolio',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
        price: '590.000đ',
        tech: ['React', 'Framer Motion'],
        rating: 4.7,
        sales: 276,
    },
    {
        title: 'flavor Landing',
        category: 'Landing Page',
        image: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=800&auto=format&fit=crop',
        price: '690.000đ',
        tech: ['Next.js', 'Tailwind'],
        rating: 4.9,
        sales: 421,
    },
];

const FeaturedThemes = () => {
    const headerRef = useScrollReveal<HTMLDivElement>();
    const gridRef = useScrollRevealGroup();

    return (
        <section className="py-40 bg-slate-50/50 relative overflow-hidden" id="themes">
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

            <div className="mx-auto container px-6">
                {/* Header */}
                <div ref={headerRef} className="reveal-up flex flex-col md:flex-row items-end justify-between mb-10 gap-12">
                    <div className="max-w-2xl">
                        <h2 className="text-xl lg:text-4xl font-black text-text-main leading-[1.05] tracking-tight">
                            Mẫu Giao Diện <span className="text-primary italic">Bán Chạy.</span>
                        </h2>
                    </div>
                    <Link
                        href="/themes"
                        className="group  border-none flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-text-main border border-slate-200 rounded-xl transition-all hover:border-primary hover:text-primary"
                    >
                        <span>Xem tất cả</span>
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">east</span>
                    </Link>
                </div>

                {/* Grid */}
                <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {themes.map((theme, idx) => (
                        <div
                            key={idx}
                            className="reveal-item group bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:border-primary/20"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                <Image
                                    src={theme.image}
                                    alt={theme.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-text-main/0 group-hover:bg-text-main/40 transition-colors duration-500 flex items-center justify-center">
                                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                        <button className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-lg">
                                            <span className="material-symbols-outlined text-xl">visibility</span>
                                        </button>
                                        <button className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-lg">
                                            <span className="material-symbols-outlined text-xl">shopping_cart</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Category badge */}
                                <span className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-text-main rounded-xl">
                                    {theme.category}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-text-main group-hover:text-primary transition-colors leading-tight">
                                        {theme.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {theme.tech.map((t) => (
                                            <span key={t} className="text-[10px] font-bold text-text-muted/60 bg-slate-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-lg font-black text-primary">{theme.price}</span>
                                    <div className="flex items-center gap-1.5 text-text-muted">
                                        <span className="material-symbols-outlined text-amber-400 text-[16px]">star</span>
                                        <span className="text-xs font-bold">{theme.rating}</span>
                                        <span className="text-[10px] text-text-muted/50">({theme.sales})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedThemes;
