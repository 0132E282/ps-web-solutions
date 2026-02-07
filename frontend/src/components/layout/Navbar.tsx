import { Search, Zap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => (
  <nav className="h-20 border-b border-slate-200/60 flex items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="container mx-auto px-5 flex items-center justify-between gap-8 h-full">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 group cursor-pointer shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-brand-dark to-slate-700 text-white flex items-center justify-center rounded-xl text-xl font-black transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-slate-200">
           M
        </div>
        <div className="flex flex-col">
            <span className="text-xl font-bold text-brand-dark leading-tight tracking-tight">My<span className="bg-gradient-to-r from-brand-primary to-orange-400 bg-clip-text text-transparent">Website</span></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] transform transition-all group-hover:translate-x-1">Creative Studio</span>
        </div>
      </div>

      {/* Global Search Interface */}
      <div className="hidden lg:flex flex-1 max-w-md items-center bg-slate-100/80 rounded-2xl px-4 h-11 border border-transparent focus-within:border-brand-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-primary/5 transition-all duration-300 group/search">
        <Search size={18} className="text-slate-400 mr-2 shrink-0 group-focus-within/search:text-brand-primary transition-colors" />
        <input
            type="text"
            placeholder="Search premium themes, components, UI kits..."
            className="bg-transparent border-none outline-none text-sm placeholder:text-slate-400 flex-1 h-full font-medium text-brand-dark"
        />
        <div className="hidden xl:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 shadow-sm text-[10px] font-bold text-slate-400">
            <span>⌘</span><span>K</span>
        </div>
      </div>

      {/* Primary Navigation & Call-to-Actions */}
      <div className="flex items-center gap-3 lg:gap-8">
        <div className="hidden xl:flex items-center gap-7 text-sm font-bold text-slate-600">
          <a href="#" className="hover:text-brand-primary transition-all relative group py-2">
            Browse
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full"></span>
          </a>
          <a href="#" className="hover:text-brand-primary transition-all relative group py-2">
            Services
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full"></span>
          </a>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>
        <div className="flex items-center gap-3">
             <Button className="bg-brand-primary hover:bg-[#e0961d] text-white rounded-xl px-7 h-11 font-bold shadow-lg shadow-orange-100/50 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm">
                Hire us
            </Button>
        </div>
      </div>
    </div>
  </nav>
);
