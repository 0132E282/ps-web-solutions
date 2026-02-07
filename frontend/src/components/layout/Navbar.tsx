import { Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => (
  <nav className="h-20 border-b border-gray-100 flex items-center bg-white sticky top-0 z-50">
    <div className="container mx-auto px-5 flex items-center justify-between w-full">
      <div className="flex items-center gap-2.5 text-2xl font-extrabold text-[#1b2a4e] cursor-pointer">
        <span className="bg-[#1b2a4e] text-white w-8 h-8 flex items-center justify-center rounded-md text-xl">M</span>
        <span>My<span className="text-[#62c3d0]">Website</span></span>
      </div>

      <div className="hidden lg:flex items-center bg-[#f1f3f5] rounded-full px-4 h-11 w-80">
        <Search size={18} className="text-muted-foreground mr-2" />
        <input
            type="text"
            placeholder="Search themes..."
            className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground flex-1 h-full"
        />
      </div>

      <div className="flex items-center gap-6 text-sm font-semibold">
        <a href="#" className="hidden lg:block hover:text-[#f5a623] transition-colors">Browse Themes</a>
        <a href="#" className="hidden lg:flex items-center gap-1.5 hover:text-[#f5a623] transition-colors">
            <Zap size={14} fill="#f5a623" color="#f5a623" /> Premium
        </a>
        <a href="#" className="hidden lg:block hover:text-[#f5a623] transition-colors">Freebies</a>
        <a href="#" className="hover:text-[#f5a623] transition-colors">Sign in</a>
        <a href="#" className="text-muted-foreground hover:text-[#f5a623] transition-colors">Sign up</a>
        <Button className="bg-brand-primary hover:bg-[#e0961d] text-white rounded-full px-6 font-semibold shadow-[0_4px_15px_rgba(245,166,35,0.3)]">
            Hire us
        </Button>
      </div>
    </div>
  </nav>
);
