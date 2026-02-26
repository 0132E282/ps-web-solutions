import { useState, useEffect } from 'react';
import Link from 'next/link';

const Header = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 z-50 w-full transition-all duration-300 ${
                scrolled
                ? "bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.08)] backdrop-blur-md py-0"
                : "bg-transparent py-4"
            }`}
        >
            <div className={`mx-auto container px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-[0_8px_20px_-5px_rgba(8,145,178,0.4)] transition-transform group-hover:rotate-6">
                        <span className="material-symbols-outlined text-white text-lg font-black">deployed_code</span>
                    </div>
                    <div className="flex flex-col text-text-main">
                        <span className="text-xl font-black tracking-tight leading-tight uppercase">
                            PS<span className="text-primary">WEB</span>
                        </span>
                        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase leading-none transition-colors ${scrolled ? 'text-text-muted' : 'text-text-muted/70'}`}>Solutions</span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden lg:flex items-center gap-10">
                    {[
                        { name: "Trang chủ", href: "/" },
                        { name: "Dịch vụ", href: "#services" },
                        { name: "Dự án", href: "#projects" },
                        { name: "Về chúng tôi", href: "/about" },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-[13px] font-bold transition-colors uppercase tracking-widest relative group ${
                                scrolled ? 'text-text-main/70 hover:text-primary' : 'text-text-main hover:text-primary'
                            }`}
                        >
                            {item.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                        </Link>
                    ))}
                </nav>

                {/* Search + CTA */}
                <div className="flex items-center gap-4 flex-1 max-w-md ml-10 justify-end">
                    <div className={`hidden md:flex items-center flex-1 transition-all group rounded-2xl px-4 py-2 border ${
                        scrolled
                        ? 'bg-slate-100/50 border-slate-200/50 focus-within:bg-white focus-within:border-primary/30'
                        : 'bg-white border-white/20 shadow-sm focus-within:bg-white focus-within:border-primary/30'
                    }`}>
                        <span className={`material-symbols-outlined text-xl transition-colors ${scrolled ? 'text-slate-400 group-focus-within:text-primary' : 'text-text-main/60 group-focus-within:text-primary'}`}>search</span>
                        <input
                            type="text"
                            placeholder="Tìm dự án..."
                            className={`flex-1 bg-transparent text-sm ml-2 font-medium outline-none transition-colors ${
                                scrolled ? 'text-text-main placeholder:text-slate-400' : 'text-text-main placeholder:text-text-main/40'
                            }`}
                        />
                    </div>

                    <button className="px-6 py-2.5 bg-primary text-white font-bold rounded-[0.9rem] text-xs hover:-translate-y-0.5 transition-all hover:shadow-[0_12px_24px_-4px_rgba(8,145,178,0.35)] shadow-[0_8px_16px_-4px_rgba(8,145,178,0.2)] shrink-0">
                        Bắt đầu ngay
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
