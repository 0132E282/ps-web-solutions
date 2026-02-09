/* eslint-disable @next/next/no-img-element */
'use client';

import { ArrowRight, Clock, Play, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { SubNavbar } from '@/components/layout/SubNavbar';
import { Footer } from '@/components/layout/Footer';
import { TemplateCard, type TemplateCardProps } from '@/components/templates/TemplateCard';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroSlider = () => {
  const slides = [
    {
      id: 1,
      title: "Build Better UI, <span className='text-brand-primary'>Faster</span>",
      subtitle: "The #1 Collection of Free and Premium Web Templates",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
      tag: "Vibrant Designs"
    },
    {
      id: 2,
      title: "Premium <span className='text-brand-primary'>Admin</span> Dashboards",
      subtitle: "High-performance interfaces for complex data management.",
      image: "https://images.unsplash.com/photo-1551288049-bbda38a1091e?q=80&w=2670&auto=format&fit=crop",
      tag: "Modern UI"
    },
    {
      id: 3,
      title: "Stunning <span className='text-brand-primary'>Landing</span> Pages",
      subtitle: "Convert visitors into customers with high-conversion templates.",
      image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=2555&auto=format&fit=crop",
      tag: "Conversion Focused"
    }
  ];

  return (
    <section className="py-12 lg:py-10 bg-[#fafafa]">
      <div className="container mx-auto">
        <div className="relative group bg-slate-900 overflow-hidden h-[350px] lg:h-[600px] rounded-[2.5rem] shadow-2xl shadow-slate-200">
          <Swiper
            modules={[Autoplay, Navigation, Pagination, EffectFade]}
            effect="fade"
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
            }}
            pagination={{
                clickable: true,
                el: '.swiper-pagination-custom',
                bulletClass: 'swiper-pagination-bullet-custom',
                bulletActiveClass: 'swiper-pagination-bullet-active-custom',
            }}
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            loop={true}
            className="h-full w-full"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative w-full h-full">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[15s] ease-linear scale-110 group-hover:scale-100"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  ></div>
                </div>
              </SwiperSlide>
            ))}

            <button aria-label="Previous slide" className="swiper-button-prev-custom absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white z-20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 shadow-2xl">
                <span className="text-xl">❮</span>
            </button>
            <button aria-label="Next slide" className="swiper-button-next-custom absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white z-20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 shadow-2xl">
                <span className="text-xl">❯</span>
            </button>

            <div className="swiper-pagination-custom absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4"></div>
          </Swiper>
        </div>
      </div>
    </section>
  );
};



const TemplateSlider = ({ title, description, templates, navId }: { title: string, description?: string, templates: TemplateCardProps[], navId: string }) => {
  return (
    <section className="py-16 overflow-hidden md:overflow-visible">
      <div className="container mx-auto px-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between  gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black text-brand-dark mb-3 tracking-tighter">{title}</h2>
              {description && <p className="text-slate-500 font-medium text-lg leading-relaxed">{description}</p>}
            </div>
            <Button variant="ghost" className="hidden sm:flex items-center gap-2 text-brand-primary font-bold hover:bg-brand-primary/5 rounded-xl px-4 py-2 transition-all">
              View All <ArrowRight size={18} />
            </Button>
        </div>

        <div className="relative group/slider">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            navigation={{
              nextEl: `.${navId}-next`,
              prevEl: `.${navId}-prev`,
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="pb-4 sm:px-2"
          >
            {templates.map((t) => (
              <SwiperSlide key={t.id} className="py-4 h-auto">
                <TemplateCard {...t} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons - Side Positioning */}
          <button aria-label="Prev templates" className={`${navId}-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border border-slate-100 items-center justify-center text-slate-400 z-30 shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary active:scale-90 opacity-0 group-hover/slider:opacity-100 invisible group-hover/slider:visible hidden lg:flex`}>
              <span className="text-3xl mr-1 leading-none">❮</span>
          </button>
          <button aria-label="Next templates" className={`${navId}-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-16 h-16 rounded-full bg-white border border-slate-100 items-center justify-center text-slate-400 z-30 shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary active:scale-90 opacity-0 group-hover/slider:opacity-100 invisible group-hover/slider:visible hidden lg:flex`}>
              <span className="text-3xl ml-1 leading-none">❯</span>
          </button>
        </div>
      </div>
    </section>
  );
};

const FeaturedPosts = () => {
  const posts = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `How to Build a Modern ${['Dashboard', 'E-commerce', 'Portfolio', 'SaaS'][i % 4]} with Next.js 15`,
    image: `https://images.unsplash.com/photo-${[
        '1498050108023-c5249f4df085',
        '1461747541859-4d81f4529e1c',
        '1555066931-4365d14bab8c',
        '1517694712202-14dd9538aa97'
    ][i % 4]}?q=80&w=800&auto=format&fit=crop`,
    category: ['Tutorial', 'Design', 'Trends', 'Coding'][i % 4],
    date: 'Oct 24, 2024'
  }));

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="container mx-auto px-5">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-brand-dark mb-4 group flex items-center gap-3">
               Featured Articles
               <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            </h2>
          </div>
        </div>
        <div className="relative group/article-slider">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{
              nextEl: '.post-next',
              prevEl: '.post-prev',
            }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-12"
          >
            {posts.map((post) => (
              <SwiperSlide key={post.id}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-5">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider text-brand-dark shadow-sm">
                      {post.category}
                    </div>
                  </div>
                  <div className="space-y-3 px-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[12px] font-semibold">
                       <Clock size={14} />
                       <span>{post.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark leading-snug group-hover:text-brand-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons - Side Positioning */}
          <button aria-label="Prev posts" className="post-prev absolute left-0 top-[35%] -translate-y-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border border-slate-100 items-center justify-center text-slate-400 z-30 shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary active:scale-90 opacity-0 group-hover/article-slider:opacity-100 invisible group-hover/article-slider:visible hidden lg:flex">
              <span className="text-2xl mr-1 leading-none">❮</span>
          </button>
          <button aria-label="Next posts" className="post-next absolute right-0 top-[35%] -translate-y-1/2 translate-x-1/2 w-14 h-14 rounded-full bg-white border border-slate-100 items-center justify-center text-slate-400 z-30 shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary active:scale-90 opacity-0 group-hover/article-slider:opacity-100 invisible group-hover/article-slider:visible hidden lg:flex">
              <span className="text-2xl ml-1 leading-none">❯</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const bestSellingTemplates = [
    { id: 1, title: 'Phoenix - Premium Bootstrap 5 Admin Dashboard', image: 'https://images.unsplash.com/photo-1551288049-bbda38a1091e?q=80&w=800', price: 59, originalPrice: 79, isHot: true },
    { id: 2, title: 'Falcon - Premium Bootstrap 5 Dashboard', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800', price: 69, originalPrice: 99, isHot: false },
    { id: 3, title: 'Sparrow - Creative Multipurpose Template', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800', price: 49, originalPrice: 69, isHot: true },
    { id: 4, title: 'Gulp - Multipage Landing Page Portfolio', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800', price: 39, originalPrice: 59, isHot: false },
    { id: 5, title: 'Basic - Simple Free Blog Template', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800', price: 0, isFree: true },
  ];

  const featuredTemplates = [
    { id: 6, title: 'E-commerce Theme - Dark Mode Support', image: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800', price: 79, originalPrice: 129, isHot: true },
    { id: 7, title: 'Modern Real Estate UI Kit', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800', price: 45, originalPrice: 65, isHot: false },
    { id: 8, title: 'Fitness & Gym Landing Page', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800', price: 29, isFree: false },
    { id: 9, title: 'Cryptocurrency Analytics Tool', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=800', price: 89, originalPrice: 149, isHot: true },
    { id: 10, title: 'Travel Booking Modern Interface', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800', price: 55, originalPrice: 75, isHot: false },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-brand-text">
      <Navbar />
      <SubNavbar />
      <main>
        <HeroSlider />

        <TemplateSlider
            title="Sản phẩm bán chạy"
            templates={bestSellingTemplates}
            navId="best-selling"
        />

        <TemplateSlider
            title="Sản phẩm nổi bật"
            templates={featuredTemplates}
            navId="featured"
        />

        <FeaturedPosts />

        <section className="pb-32">
            <div className="container mx-auto px-5">
                <div className="bg-[#0f172a] rounded-[3rem] flex flex-col lg:flex-row overflow-hidden relative shadow-2xl shadow-blue-900/10">
                    <div className="flex-[1.5] p-10 lg:p-20 relative z-10">
                        <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-8">
                           <Gem size={40} className="text-brand-primary" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-8 text-white leading-[1.1] tracking-tight">Hire top notch React & UI/UX specialists</h2>
                        <p className="text-slate-400 text-xl mb-12 max-w-2xl leading-relaxed">Need help with custom development? Our expert team of software engineers and designers can help you scale your product with precision.</p>
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl px-10 py-7 h-auto text-lg font-black shadow-xl shadow-brand-primary/20 transition-all hover:-translate-y-1 active:scale-95 leading-none">Get a Free Quote</Button>
                            <div className="text-white/60 font-bold hover:text-white transition-colors cursor-pointer flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                                <Clock size={20} />
                              </div>
                              contact@mywebsite.com
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 bg-brand-primary relative min-h-[400px] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60"></div>
                        <div className="flex flex-col items-center gap-6 text-white cursor-pointer group relative z-10 transition-transform duration-500 hover:scale-105">
                            <div className="w-28 h-28 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-xl flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-all duration-300 shadow-2xl">
                                <Play size={48} fill="#fff" className="ml-2 scale-90 group-hover:scale-100 transition-transform" />
                            </div>
                            <span className="font-black text-xl tracking-widest uppercase">Watch Success Story</span>
                        </div>
                        <div className="absolute top-0 right-0 p-12">
                          <div className="text-[120px] font-black text-white/5 select-none leading-none">MYWEB</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="bg-brand-bg py-20">
          <div className="container mx-auto px-5">
            <div className="text-center max-w-[600px] mx-auto">
              <h3 className="text-[28px] font-bold mb-3 text-brand-dark">Get new themes and discounts in your inbox!</h3>
              <p className="text-muted-foreground mb-8 text-lg">New themes or big discounts. Never spam.</p>
              <form className="flex gap-3 max-w-md mx-auto">
                <input
                    type="email"
                    placeholder="Email address"
                    className="flex-1 px-5 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm"
                />
                <Button type="submit" className="bg-brand-secondary hover:bg-[#218838] text-white rounded-lg px-8 h-auto font-bold">Subscribe</Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <div className="fixed bottom-6 right-6 bg-[#006070] text-white px-6 py-3 rounded-full flex items-center gap-3 font-bold shadow-xl cursor-pointer z-50 hover:bg-[#004d5a] transition-all hover:-translate-y-1">
        <Play size={18} fill="#fff" /> Support
      </div>
    </div>
  );
}
