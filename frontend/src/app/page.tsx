'use client';

import AppLayout from "@/components/layout/app-layout";
import FeaturedProjects from "@/components/templates/featured-projects";
import FeaturedThemes from "@/components/templates/featured-themes";
import HeroGraphic from "@/components/common/hero-graphic";
import SpinningTriangles from "@/components/common/spinning-triangles";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScrollReveal, useScrollRevealGroup } from '@/hooks/use-scroll-reveal';
import Link from 'next/link';

const heroSlides = [
  {
    tag: 'Web Development',
    title: <>Xây dựng <span className="text-primary">Vị Thế</span><br />Số Khác Biệt.</>,
    desc: 'Đồng hành cùng doanh nghiệp kiến tạo nền tảng số chuyên nghiệp, tối ưu trải nghiệm và thúc đẩy tăng trưởng.',
  },
  {
    tag: 'UI/UX Design',
    title: <>Thiết kế <span className="text-primary">Trải Nghiệm</span><br />Người Dùng.</>,
    desc: 'Nghiên cứu hành vi và tạo ra giao diện trực quan, giúp khách hàng yêu thích sản phẩm của bạn ngay lần đầu.',
  },
  {
    tag: 'Brand Identity',
    title: <>Định hình <span className="text-primary">Thương Hiệu</span><br />Chuyên Nghiệp.</>,
    desc: 'Xây dựng bản sắc thương hiệu số với ngôn ngữ hình ảnh đồng bộ, ghi dấu ấn mạnh mẽ trên mọi nền tảng.',
  },
];

type Phase = 'visible' | 'leaving' | 'entering';

const Home = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>('visible');
  const nextRef = useRef(0);

  const goTo = useCallback((idx: number) => {
    if (phase !== 'visible') return;
    nextRef.current = idx;
    setPhase('leaving');
  }, [phase]);

  // Phase machine: leaving -> swap content -> entering -> visible
  useEffect(() => {
    if (phase === 'leaving') {
      const t = setTimeout(() => {
        setCurrent(nextRef.current);
        setPhase('entering');
      }, 400);
      return () => clearTimeout(t);
    }
    if (phase === 'entering') {
      const raf = requestAnimationFrame(() => {
        const t = setTimeout(() => setPhase('visible'), 20);
        return () => clearTimeout(t);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [phase]);

  // Auto-advance
  useEffect(() => {
    if (phase !== 'visible') return;
    const t = setTimeout(() => {
      goTo(current === heroSlides.length - 1 ? 0 : current + 1);
    }, 10000);
    return () => clearTimeout(t);
  }, [current, phase, goTo]);

  const philosophyRef = useScrollReveal<HTMLDivElement>();
  const servicesHeaderRef = useScrollReveal<HTMLDivElement>();
  const servicesGridRef = useScrollRevealGroup();
  const approachHeaderRef = useScrollReveal<HTMLDivElement>();
  const approachGridRef = useScrollRevealGroup();

  const slide = heroSlides[current];

  const itemBase = 'transition-all ease-out';
  const stagger = (delay: number) => {
    if (phase === 'leaving') return `${itemBase} duration-300 opacity-0 -translate-x-6`;
    if (phase === 'entering') return `${itemBase} duration-300 opacity-0 translate-x-8`;
    return `${itemBase} duration-500 opacity-100 translate-x-0 delay-[${delay}ms]`;
  };

  return (
    <AppLayout>
      {/* Immersive Hero Section */}
      <section
        ref={sectionRef}
        className="relative min-h-screen flex items-center pt-32 pb-24 overflow-hidden bg-linear-to-br from-white via-slate-50 to-blue-50/30 premium-leather"
      >
        {/* Decorative dynamic elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-15%] right-[-5%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
          <SpinningTriangles />
        </div>

        <div className="mx-auto container px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content - Slider */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-8">
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50 backdrop-blur-sm shadow-sm ${stagger(0)}`}>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <div className="w-full h-full bg-linear-to-br from-primary/40 to-primary/80"></div>
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">{slide.tag}</span>
                </div>

                <h1 className={`text-4xl md:text-5xl lg:text-7xl font-black leading-[0.95] text-text-main tracking-tighter ${stagger(100)}`}>
                  {slide.title}
                </h1>

                <p className={`text-xl text-text-muted leading-relaxed max-w-2xl font-medium ${stagger(200)}`}>
                  {slide.desc}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 pt-4">
                <button className="px-10 py-5 bg-primary text-white text-lg font-black rounded-3xl transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/40 inline-flex items-center justify-center gap-3 group">
                  <span>Khởi tạo dự án</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </div>
                </button>
                <button className="px-10 py-5 text-lg font-black text-text-main rounded-3xl border-2 border-slate-100 bg-white/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-white flex items-center justify-center gap-3 group">
                  <span>Xem báo giá</span>
                  <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-primary transition-colors">receipt_long</span>
                </button>
              </div>
            </div>

            {/* Right Graphic - Enhanced Display */}
            <div className="lg:col-span-5 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="relative z-10 scale-110 lg:scale-125">
                 <HeroGraphic />
              </div>

              {/* Floating Status Cards */}
              <div className="absolute top-10 right-0 glass-card p-4 rounded-3xl border border-white/50 shadow-2xl animate-float z-20 hidden lg:block">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                       <span className="material-symbols-outlined">bolt</span>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiệu năng</p>
                       <p className="text-sm font-black text-text-main tracking-tight">Tối ưu 99+</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Marquee */}
      <section className="py-24 bg-white border-y border-slate-50 overflow-hidden">
        <div className="container mx-auto px-6 mb-12">
           <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Kiến tạo niềm tin toàn cầu</h3>
        </div>
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-24 mx-12">
              {['GlobalTech', 'VinGroup', 'FPT Software', 'Momo', 'ZaloPay', 'Samsung', 'Toyota', 'Nike'].map((partner, i) => (
                <span key={i} className="text-3xl md:text-5xl font-black text-slate-100 hover:text-primary transition-all duration-500 cursor-default tracking-tighter">
                  {partner}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Services Redesigned - Artistic Bento */}
      <section className="py-40 bg-white relative overflow-hidden" id="services">
        <div className="container mx-auto px-6 relative z-10">
          <div ref={servicesHeaderRef} className="reveal-up mb-24 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
               <span className="w-8 h-[2px] bg-primary"></span>
               <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Expertise</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-text-main leading-[1.1] tracking-tighter mb-8">
               Giải pháp số hóa <br />
               <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-600 to-indigo-700">Vượt xa kỳ vọng.</span>
            </h2>
            <p className="text-text-muted text-lg lg:text-xl font-medium max-w-2xl leading-relaxed">
               Từ những ý tưởng sơ khai đến hệ thống số hóa quy mô lớn, chúng tôi đồng hành cùng bạn trên mọi hành trình kiến tạo giá trị.
            </p>
          </div>

          <div ref={servicesGridRef} className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            {/* UI/UX Design - Featured Card */}
            <div className="reveal-item md:col-span-8 group relative overflow-hidden rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 p-10 lg:p-16 flex flex-col justify-between transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-blue-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

               <div className="relative z-10 space-y-10">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                     <span className="material-symbols-outlined text-3xl">brush</span>
                  </div>
                  <div className="space-y-4 max-w-xl">
                     <h3 className="text-3xl lg:text-5xl font-black text-text-main">UI/UX Design</h3>
                     <p className="text-text-muted text-base lg:text-lg leading-relaxed font-medium transition-colors group-hover:text-text-main">Nghiên cứu hành vi người dùng sâu sắc để tạo ra giao diện không chỉ đẹp mà còn tối ưu tỷ lệ chuyển đổi và trải nghiệm cảm xúc.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {['User Research', 'Wireframing', 'Prototyping', 'Motion Design'].map(t => (
                        <span key={t} className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-100">{t}</span>
                     ))}
                  </div>
               </div>

               <div className="mt-12 flex items-center gap-4 text-primary font-bold text-sm tracking-tight group-hover:translate-x-3 transition-transform">
                  <span>Khám phá quy trình thiết kế</span>
                  <span className="material-symbols-outlined text-lg">east</span>
               </div>
            </div>

            {/* Stats Card */}
            <div className="reveal-item md:col-span-4 rounded-[2.5rem] bg-slate-900 p-12 flex flex-col items-center justify-center text-center space-y-4 premium-leather border-2 border-white/5 shadow-2xl overflow-hidden relative group">
               <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl"></div>
               <div className="relative z-10">
                  <div className="text-7xl font-black text-white tracking-tighter mb-2">98%</div>
                  <div className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-6">Success Rate</div>
                  <p className="text-slate-400 font-medium">Phản hồi tích cực từ khách hàng chiến lược toàn cầu.</p>
               </div>
            </div>

            {/* Service Package 1 - Landing Page */}
            <div className="reveal-item md:col-span-4 rounded-[2.5rem] bg-white border-2 border-slate-100 p-10 group transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_30px_60px_-15px_rgba(8,145,178,0.15)] relative overflow-hidden flex flex-col justify-between">
               <div className="space-y-8 relative z-10">
                  <div className="flex justify-between items-start">
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                     </div>
                     <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider">-20% Today</span>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-2xl font-black text-text-main group-hover:text-primary transition-colors">Thiết kế Landing Page</h3>
                     <div className="space-y-3">
                        {[
                           "Giao diện UX/UI hiện đại",
                           "Tối ưu tốc độ tải trang < 2s",
                           "Chuẩn SEO Google 100/100",
                           "Tương thích mọi thiết bị",
                           "Tích hợp Form chuyển đổi",
                           "Bảo mật SSL miễn phí"
                        ].map((feat, i) => (
                           <div key={i} className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-lg font-black">check</span>
                              <span className="text-text-muted text-sm font-medium">{feat}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="mt-10 pt-8 border-t border-slate-50">
                  <div className="flex items-baseline gap-3">
                     <span className="text-2xl font-black text-text-main tracking-tighter">3.900.000đ</span>
                     <span className="text-slate-400 text-xs line-through font-bold">5.000.000đ</span>
                  </div>
               </div>
            </div>

            {/* Service Package 2 - Business Website */}
            <div className="reveal-item md:col-span-4 rounded-[2.5rem] bg-slate-900 p-10 group transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] relative overflow-hidden flex flex-col justify-between text-white premium-leather border-2 border-white/5">
               <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               <div className="space-y-8 relative z-10">
                  <div className="flex justify-between items-start">
                     <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                     </div>
                     <span className="px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider">Most Popular</span>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-2xl font-black group-hover:text-primary transition-colors">Website Doanh Nghiệp</h3>
                     <div className="space-y-3">
                        {[
                           "Hệ thống CMS chuyên nghiệp",
                           "Không giới hạn bài viết/SP",
                           "Bảo mật đa lớp (Firewall)",
                           "Tích hợp đa ngôn ngữ",
                           "Backup dữ liệu tự động",
                           "Hỗ trợ kỹ thuật 24/7",
                           "Module Marketing tích hợp"
                        ].map((feat, i) => (
                           <div key={i} className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-lg font-black">check</span>
                              <span className="text-slate-400 text-sm font-medium">{feat}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
                  <div className="flex items-baseline gap-3">
                     <span className="text-2xl font-black text-white tracking-tighter">8.500.000đ</span>
                     <span className="text-white/30 text-xs line-through font-bold">12.000.000đ</span>
                  </div>
               </div>
            </div>

            {/* Service Package 3 - E-Commerce */}
            <div className="reveal-item md:col-span-4 rounded-[2.5rem] bg-white border-2 border-slate-100 p-10 group transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_30px_60px_-15px_rgba(8,145,178,0.15)] relative overflow-hidden flex flex-col justify-between">
               <div className="space-y-8 relative z-10">
                  <div className="flex justify-between items-start">
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                     </div>
                     <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">Premium</span>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-2xl font-black text-text-main group-hover:text-primary transition-colors">E-Commerce System</h3>
                     <div className="space-y-3">
                        {[
                           "Quản lý kho hàng thông minh",
                           "Tích hợp thanh toán online",
                           "Đồng bộ đơn vận tự động",
                           "Báo cáo doanh thu chi tiết",
                           "Hệ thống Coupon/Discount",
                           "Tối ưu giỏ hàng & thanh toán",
                           "API kết nối bên thứ 3"
                        ].map((feat, i) => (
                           <div key={i} className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-lg font-black">check</span>
                              <span className="text-text-muted text-sm font-medium">{feat}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="mt-10 pt-8 border-t border-slate-50">
                  <div className="flex items-baseline gap-3">
                     <span className="text-2xl font-black text-text-main tracking-tighter">19.900.000đ</span>
                     <span className="text-slate-400 text-xs line-through font-bold">25.000.000đ</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-40 bg-slate-50 premium-leather relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">

            <div className="lg:col-span-5 relative">
               <div className="relative z-10 rounded-[4rem] overflow-hidden aspect-4/5 shadow-2xl border-8 border-white group">
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent z-10"></div>
                  <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1542626991-cbc4e32524cc?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"></div>

                  <div className="absolute bottom-10 left-10 z-20 space-y-2">
                     <div className="text-5xl font-black text-white tracking-tighter">08+</div>
                     <p className="text-xs font-black text-primary uppercase tracking-[0.4em]">Năm kiến tạo</p>
                  </div>
               </div>

               <div className="absolute top-10 -right-12 glass-card p-6 rounded-3xl animate-float hidden lg:block z-20 border border-white/50 shadow-2xl">
                  <span className="material-symbols-outlined text-primary text-4xl">verified</span>
               </div>
               <div className="absolute bottom-20 -left-12 glass-dark p-6 rounded-3xl animate-float [animation-duration:8s] [animation-delay:1s] hidden lg:block z-0 border border-white/10 shadow-2xl">
                  <div className="w-12 h-1 bg-primary rounded-full mb-2"></div>
                  <div className="w-8 h-1 bg-white/10 rounded-full"></div>
               </div>
            </div>

            <div ref={philosophyRef} className="lg:col-span-7 reveal-up space-y-12">
               <div className="space-y-6">
                  <span className="text-primary text-xs font-black uppercase tracking-[0.5em]">The Core Value</span>
                  <h2 className="text-4xl lg:text-5xl font-black text-text-main tracking-tighter leading-[1.1] uppercase">
                     Thiết kế <br />
                     <span className="text-transparent bg-clip-text bg-linear-to-br from-primary via-blue-600 to-indigo-800">Bằng sự thấu cảm.</span>
                  </h2>
                  <p className="text-lg text-text-muted leading-relaxed font-medium max-w-2xl">
                     Chúng tôi thấu hiểu rằng đằng sau mỗi cú click chuột là một con người với bản sắc riêng. Tại PS Web, công nghệ là công cụ, còn trải nghiệm con người là đích đến cuối cùng.
                  </p>
               </div>

               <div className="grid sm:grid-cols-2 gap-6">
                  {[
                     "Nghiên cứu hành vi chuyên sâu",
                     "Công nghệ tiên phong & Bảo mật",
                     "Đồng hành trọn đời & Phát triển",
                     "Tối ưu hóa chuyển đổi thực tế"
                  ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 group cursor-default">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                           <span className="material-symbols-outlined text-lg">check</span>
                        </div>
                        <span className="font-bold text-text-main group-hover:translate-x-1 transition-transform">{item}</span>
                     </div>
                  ))}
               </div>

               <div className="pt-8">
                  <Link href="/about" className="inline-flex items-center gap-4 px-10 py-4 bg-white border border-slate-200 text-text-main font-black rounded-2xl hover:bg-slate-50 transition-all hover:shadow-xl group">
                     <span>Về chúng tôi</span>
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">east</span>
                     </div>
                  </Link>
               </div>
            </div>

          </div>
        </div>
      </section>

      <FeaturedProjects />

      {/* Approach - High Tech Visual Flow */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        {/* Background Atmosphere */}
        <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow"></div>
          <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div ref={approachHeaderRef} className="reveal-up mb-32 max-w-4xl text-left">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-px w-12 bg-primary"></div>
               <span className="text-primary text-xs font-black uppercase tracking-[0.4em]">The Engineering Flow</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-8">
               Quy trình <br />
               <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-400 to-indigo-400 italic">Tinh gọn & Tối ưu.</span>
            </h2>
            <p className="text-slate-400 text-lg lg:text-xl leading-relaxed max-w-xl font-medium">
               Tối ưu hóa năng lực sản xuất bằng sự kết hợp giữa trí tuệ con người và công nghệ tự động tại mỗi điểm chạm.
            </p>
          </div>

          <div ref={approachGridRef} className="relative">
            {/* Desktop Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent hidden lg:block -translate-y-1/2 overflow-hidden">
               <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/50 to-transparent w-40 animate-marquee"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: 'Khám phá',
                  icon: 'search_insights',
                  desc: 'Thấu hiểu DNA của doanh nghiệp và bối cảnh thị trường để xác lập mục tiêu chiến lược.',
                  tags: ['Audit', 'C-Level Sync', 'Strategy']
                },
                {
                  step: '02',
                  title: 'Kiến tác',
                  icon: 'architecture',
                  desc: 'Thiết kế blueprint và trải nghiệm thị giác đột phá, cá nhân hóa từng tương tác của người dùng.',
                  tags: ['UI/UX', 'HCI', 'Visual Kit']
                },
                {
                  step: '03',
                  icon: 'terminal',
                  title: 'Vận hành',
                  desc: 'Hiện thực hóa ý tưởng bằng mã nguồn tối ưu nhất, đảm bảo tính mở rộng và bảo mật tuyệt đối.',
                  tags: ['Fullstack', 'DevOps', 'QA']
                },
                {
                  step: '04',
                  icon: 'trending_up',
                  title: 'Tăng trưởng',
                  desc: 'Đồng hành tối ưu hóa hiệu năng sau khi ra mắt, sử dụng Data-Driven để thúc đẩy chuyển đổi.',
                  tags: ['Data', 'Scaling', 'Support']
                }
              ].map((item, i) => (
                <div key={i} className="reveal-item group relative">
                   {/* Step Number Backdrop */}
                   <div className="absolute -top-8 -left-2 text-[7rem] font-black text-white/5 pointer-events-none select-none group-hover:text-primary/10 transition-colors duration-700">
                      {item.step}
                   </div>

                   <div className="relative glass-dark p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/30 transition-all duration-700 hover:-translate-y-3 group overflow-hidden">
                      {/* Scanline Effect */}
                      <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent h-1/2 w-full pointer-events-none opacity-0 group-hover:opacity-100" style={{ animation: 'scanline 3s linear infinite' }}></div>

                      <div className="relative z-10 space-y-8">
                         <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-700">
                            <span className="material-symbols-outlined text-3xl text-primary group-hover:text-white">{item.icon}</span>
                         </div>

                         <div className="space-y-4">
                            <h3 className="text-3xl font-black group-hover:text-primary transition-colors tracking-tight">{item.title}</h3>
                            <p className="text-slate-400 leading-relaxed font-medium transition-colors group-hover:text-slate-200">{item.desc}</p>
                         </div>

                         <div className="flex flex-wrap gap-2 pt-4">
                            {item.tags.map(tag => (
                               <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary/70 transition-colors">
                                  {tag}
                               </span>
                            ))}
                         </div>
                      </div>

                      {/* Corner Accent */}
                      <div className="absolute bottom-0 right-0 w-16 h-16 bg-primary/20 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FeaturedThemes />

      {/* Ultra CTA Section */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-6">
          <div className="relative rounded-[5rem] bg-slate-900 p-12 lg:p-32 overflow-hidden group premium-leather shadow-[0_100px_100px_-50px_rgba(37,99,235,0.2)]">
             {/* Decorative background anims */}
             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,#2563eb10_0%,transparent_50%)]"></div>
             <div className="absolute w-[800px] h-[800px] bg-primary/20 rounded-full blur-[180px] -bottom-1/2 -left-1/4 animate-pulse-slow"></div>

             <div className="relative z-10 flex flex-col items-center text-center space-y-12">
                <div className="space-y-6">
                   <div className="w-20 h-20 bg-primary rounded-4xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/40 animate-bounce cursor-default">
                      <span className="material-symbols-outlined text-white text-4xl">rocket_launch</span>
                   </div>
                   <h2 className="text-4xl lg:text-6xl font-black text-white leading-none max-w-5xl tracking-tighter">
                     Biến ý tưởng của bạn thành <br /> <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-300">Tuyệt phẩm số.</span>
                   </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <button className="px-16 py-6 bg-primary text-white text-xl font-black rounded-[2.5rem] hover:scale-105 transition-all shadow-2xl shadow-primary/50 uppercase tracking-tight group flex items-center gap-4">
                    <span>Liên hệ ngay</span>
                    <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">east</span>
                  </button>
                  <button className="px-16 py-6 border-2 border-white/20 text-white text-xl font-black rounded-[2.5rem] hover:bg-white hover:text-slate-900 transition-all uppercase tracking-tight">
                    Khám phá dự án
                  </button>
                </div>

                <div className="pt-12 flex flex-wrap justify-center gap-12 grayscale opacity-40">
                   {['GlobalTech', 'VinGroup', 'FPT', 'MoMo'].map(p => <span key={p} className="text-sm font-black text-white/50">{p}</span>)}
                </div>
             </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
};


export default Home;
