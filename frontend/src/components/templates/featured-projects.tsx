'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useScrollReveal, useScrollRevealGroup } from '@/hooks/use-scroll-reveal';

const projects = [
  {
    title: "E-Commerce Luxury",
    category: "Web Development",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
    tags: ["Next.js", "Tailwind"],
  },
  {
    title: "Real Estate Portal",
    category: "UI/UX Design",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop",
    tags: ["React", "Framer"],
  },
  {
    title: "Corporate Identity",
    category: "Branding",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop",
    tags: ["Core", "Brand"],
  },
  {
    title: "Digital Banking",
    category: "Fintech",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop",
    tags: ["Banking", "Secure"],
  },
  {
    title: "Education Platform",
    category: "EdTech",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
    tags: ["LMS", "Next.js"],
  }
];

const FeaturedProjects = () => {
  const headerRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useScrollRevealGroup();

  return (
    <section className="py-20 bg-white relative overflow-hidden" id="projects">
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

        {/* Grid - 5 columns, compact */}
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {projects.map((project, index) => (
            <div
              key={index}
              className="reveal-item group relative overflow-hidden rounded-xl aspect-3/4 cursor-pointer"
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/5 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <span className="text-primary text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5">
                  {project.category}
                </span>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {project.title}
                </h3>
              </div>

              {/* Hover arrow */}
              <div className="absolute top-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                <span className="material-symbols-outlined text-white text-sm">arrow_outward</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
