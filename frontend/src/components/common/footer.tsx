import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="pt-32 pb-16 bg-white text-text-main relative overflow-hidden border-t border-slate-100">
            {/* Subtle Gradient Glow */}
            <div className="absolute bottom-0 left-0 w-full h-[500px] bg-linear-to-t from-primary/5 to-transparent pointer-events-none"></div>

            <div className="mx-auto container px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                    <div className="space-y-8">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform hover:scale-110">
                                <span className="material-symbols-outlined text-white text-2xl font-black">deployed_code</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tight text-text-main leading-tight uppercase">
                                    PS<span className="text-primary">WEB</span>
                                </span>
                                <span className="text-[10px] font-bold text-text-muted tracking-[0.2em] uppercase leading-none">Solutions</span>
                            </div>
                        </Link>
                        <p className="text-text-muted text-base leading-relaxed font-medium">
                            Kiến tạo tương lai số với các giải pháp website chuyên nghiệp, tối ưu trải nghiệm và thúc đẩy tăng trưởng vượt bậc.
                        </p>
                        <div className="space-y-4 pt-4">
                            <a href="mailto:contact@psweb.vn" className="group flex items-center gap-3 text-text-muted hover:text-primary transition-all text-sm font-bold">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <span className="material-symbols-outlined text-lg text-primary">mail</span>
                                </div>
                                <span>contact@psweb.vn</span>
                            </a>
                            <a href="tel:+84123456789" className="group flex items-center gap-3 text-text-muted hover:text-primary transition-all text-sm font-bold">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <span className="material-symbols-outlined text-lg text-primary">call</span>
                                </div>
                                <span>+84 123 456 789</span>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-xl font-black mb-10 text-text-main">Dịch Vụ</h4>
                        <ul className="space-y-5 text-text-muted text-sm font-bold">
                            {['Thiết kế Website', 'Phát triển App', 'UI/UX Design', 'Branding', 'SEO & Marketing'].map(item => (
                                <li key={item} className="flex items-center gap-2 hover:text-primary transition-all cursor-pointer group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:w-4 group-hover:bg-primary transition-all"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-xl font-black mb-10 text-text-main">Công Ty</h4>
                        <ul className="space-y-5 text-text-muted text-sm font-bold">
                            {['Về chúng tôi', 'Dự án', 'Quy trình', 'Tin tức', 'Liên hệ'].map(item => (
                                <li key={item} className="flex items-center gap-2 hover:text-primary transition-all cursor-pointer group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:w-4 group-hover:bg-primary transition-all"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social links */}
                    <div className="space-y-8">
                        <h4 className="text-xl font-black text-text-main">Kết Nối</h4>
                        <p className="text-text-muted text-sm font-bold leading-relaxed">
                            Đăng ký nhận bản tin để không bỏ lỡ những cập nhật mới nhất về công nghệ.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { name: 'facebook', icon: 'facebook' },
                                { name: 'linkedin', icon: 'diversity_3' },
                                { name: 'instagram', icon: 'camera' }
                            ].map(platform => (
                                <a key={platform.name} href="#" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-primary transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 group">
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-white text-xl">{platform.icon}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-slate-400 text-sm font-bold">
                        © 2026 <span className="text-text-main">PS Web Solutions</span>. All rights reserved.
                    </p>
                    <div className="flex gap-10 text-sm font-bold text-slate-400">
                        <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
