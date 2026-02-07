/* eslint-disable @next/next/no-img-element */
'use client';

import { ArrowRight, CheckCircle, Clock, Gem, Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { SubNavbar } from '@/components/layout/SubNavbar';
import { Footer } from '@/components/layout/Footer';
import { TemplateCard } from '@/components/templates/TemplateCard';

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
    <section className="py-10">
      <div className="container mx-auto px-5">
        <div className="relative group bg-slate-900 overflow-hidden h-[300px] lg:h-[550px] rounded-3xl shadow-2xl shadow-slate-200">
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
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            className="h-full w-full"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative w-full h-full">
                  {/* Image Only Layer */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-linear scale-110 group-hover:scale-100"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  >
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-500"></div>
                  </div>
                </div>
              </SwiperSlide>
            ))}

            {/* Custom Navigation */}
            <button className="swiper-button-prev-custom absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white z-20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 pointer-events-auto">
                ❮
            </button>
            <button className="swiper-button-next-custom absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white z-20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 pointer-events-auto">
                ❯
            </button>

            {/* Custom Pagination */}
            <div className="swiper-pagination-custom absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3"></div>
          </Swiper>
        </div>
      </div>
    </section>
  );
};

const CustomTabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
  <section className="py-8">
    <div className="container mx-auto px-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100">
        <div
          className={`group flex items-center gap-5 p-7 cursor-pointer transition-all duration-300 relative overflow-hidden
              ${activeTab === 'premium' ? 'bg-white' : 'hover:bg-slate-50'}`}
          onClick={() => setActiveTab('premium')}
        >
          <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-sm
              ${activeTab === 'premium' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
            <CheckCircle size={28} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h3 className={`text-lg font-bold transition-colors ${activeTab === 'premium' ? 'text-brand-dark' : 'text-slate-500'}`}>Premium Themes</h3>
            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">High-Quality UI • Clean Code • Support</p>
          </div>
          {activeTab === 'premium' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 animate-in fade-in slide-in-from-bottom-1" />}
        </div>

        <div
          className={`group flex items-center gap-5 p-7 cursor-pointer transition-all duration-300 relative overflow-hidden
              ${activeTab === 'freebies' ? 'bg-white' : 'hover:bg-slate-50'}`}
          onClick={() => setActiveTab('freebies')}
        >
          <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-sm
              ${activeTab === 'freebies' ? 'bg-amber-50 text-amber-600 shadow-amber-100' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
            <Gem size={28} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h3 className={`text-lg font-bold transition-colors ${activeTab === 'freebies' ? 'text-brand-dark' : 'text-slate-500'}`}>Top Freebies</h3>
            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Most popular free-to-use templates</p>
          </div>
          {activeTab === 'freebies' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 animate-in fade-in slide-in-from-bottom-1" />}
        </div>

        <div
          className={`group flex items-center gap-5 p-7 cursor-pointer transition-all duration-300 relative overflow-hidden
              ${activeTab === 'recent' ? 'bg-white' : 'hover:bg-slate-50'}`}
          onClick={() => setActiveTab('recent')}
        >
          <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-sm
              ${activeTab === 'recent' ? 'bg-blue-50 text-blue-600 shadow-blue-100' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
            <Clock size={28} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h3 className={`text-lg font-bold transition-colors ${activeTab === 'recent' ? 'text-brand-dark' : 'text-slate-500'}`}>Fresh Releases</h3>
            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Latest trends and fresh UI patterns</p>
          </div>
          {activeTab === 'recent' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 animate-in fade-in slide-in-from-bottom-1" />}
        </div>
      </div>
    </div>
  </section>
);

const TemplateSlider = ({ templates }: { templates: any[] }) => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-5">
        <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-brand-dark mb-3">Trending Templates</h2>
              <p className="text-slate-500 font-medium">Hand-picked premium assets with exclusive discounts.</p>
            </div>
            <div className="flex gap-2">
              <button className="tmpl-prev w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-brand-primary hover:text-white transition-all active:scale-90 shadow-sm">❮</button>
              <button className="tmpl-next w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-brand-primary hover:text-white transition-all active:scale-90 shadow-sm">❯</button>
            </div>
        </div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation={{
            nextEl: '.tmpl-next',
            prevEl: '.tmpl-prev',
          }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1280: { slidesPerView: 3 },
          }}
          className="pb-16"
        >
          {templates.map((t) => (
            <SwiperSlide key={t.id}>
              <TemplateCard {...t} />
            </SwiperSlide>
          ))}
        </Swiper>
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
            <p className="text-slate-500 font-medium">Insights, tutorials and the latest trends in web development.</p>
          </div>
          <div className="flex gap-2">
            <button className="post-prev w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-brand-dark hover:text-white transition-all active:scale-90">❮</button>
            <button className="post-next w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-brand-dark hover:text-white transition-all active:scale-90">❯</button>
          </div>
        </div>

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
      </div>
    </section>
  );
};

export default function Home() {
  const templates = [
    { id: 1, title: 'Phoenix - Premium Bootstrap 5 Admin Dashboard', image: 'https://images.unsplash.com/photo-1551288049-bbda38a1091e?q=80&w=800', price: 59, originalPrice: 79, isHot: true },
    { id: 2, title: 'Falcon - Premium Bootstrap 5 Dashboard', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800', price: 69, originalPrice: 99, isHot: false },
    { id: 3, title: 'Sparrow - Creative Multipurpose Template', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800', price: 49, originalPrice: 69, isHot: true },
    { id: 4, title: 'Gulp - Multipage Landing Page Portfolio', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800', price: 39, originalPrice: 59, isHot: false },
    { id: 5, title: 'Basic - Simple Free Blog Template', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800', price: 0, isFree: true },
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

        <section className="py-20">
          <div className="container mx-auto px-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-4xl font-black text-brand-dark mb-4 tracking-tighter">
                   Explore <span className="text-brand-primary">Premium</span> Assets
                </h2>
                <p className="text-slate-500 font-medium text-lg">Browse our highly curated collection of high-quality website templates.</p>
              </div>
              <Button variant="outline" className="rounded-2xl  border-slate-200 hover:border-brand-primary hover:text-brand-primary text-base font-bold gap-3 transition-all hover:bg-brand-primary/5 active:scale-95 h-auto">
                View All <ArrowRight size={20} />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {templates.map((t) => (
                <TemplateCard key={t.id} {...t} />
              ))}
            </div>
          </div>
        </section>

        <FeaturedPosts />

        <section className="pb-20">
            <div className="container mx-auto px-5">
                <div className="bg-white border border-slate-200 rounded-2xl flex flex-col lg:flex-row overflow-hidden relative">
                    <div className="absolute inset-0 p-[2px] rounded-2xl bg-gradient-to-r from-[#4facfe] to-[#00f2fe] -z-10 pointer-events-none"></div>

                    <div className="flex-[1.5] p-10 lg:p-16 bg-white rounded-l-2xl">
                        <h2 className="text-[32px] font-bold mb-6 text-brand-dark leading-tight">Hire top notch React & UI/UX specialists from MyWebsite</h2>
                        <p className="text-muted-foreground text-lg mb-8">Need help with custom development? We can help you with software engineers experienced in Backend and front-end development.</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <Button className="bg-brand-primary hover:bg-[#e0961d] text-white rounded-xl px-8 py-6 h-auto text-base font-bold shadow-lg shadow-orange-200">Get a Free Quote</Button>
                            <div className="text-[#2196f3] font-semibold underline cursor-pointer hover:text-blue-600 transition-colors">Email: contact@mywebsite.com</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-[#1a202c] min-h-[300px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-white cursor-pointer group">
                            <div className="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Play size={40} fill="#fff" className="ml-1" />
                            </div>
                            <span className="font-semibold tracking-wide">Watch Video</span>
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
