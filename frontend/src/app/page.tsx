/* eslint-disable @next/next/no-img-element */
'use client';

import { ArrowRight, CheckCircle, Clock, Gem, Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { SubNavbar } from '@/components/layout/SubNavbar';
import { Footer } from '@/components/layout/Footer';
import { TemplateCard } from '@/components/templates/TemplateCard';

const Hero = () => (
  <header className="bg-brand-bg py-16">
    <div className="container mx-auto px-5 flex flex-col-reverse lg:flex-row items-center gap-10">
      <div className="flex-1 flex justify-center lg:justify-start relative">
        <div className="relative">
             <div className="absolute inset-0 bg-[#e2e8f0] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] z-0 scale-110"></div>
             <img src="https://via.placeholder.com/500x400/f8f9fa/333?text=Modern+UI+Illustration" alt="Hero Illustration" className="relative z-10 max-w-full" />
        </div>
      </div>
      <div className="flex-1 text-center lg:text-left">
        <h1 className="text-5xl lg:text-[64px] font-bold text-brand-dark mb-5 leading-[1.1]">
            Build Better UI, <span className="relative z-10 after:content-[''] after:absolute after:bottom-2 after:left-0 after:w-full after:h-1 after:bg-brand-secondary after:opacity-60 after:-z-10">Faster</span>
        </h1>
        <p className="text-xl text-muted-foreground">The #1 Collection of Free and Premium Web Templates</p>
      </div>
    </div>
  </header>
);

const CustomTabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
    <section className="pt-10">
      <div className="container mx-auto px-5">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          <div
            className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-6 cursor-pointer border-b-[3px] transition-colors min-w-[250px]
                ${activeTab === 'premium' ? 'bg-white border-brand-secondary' : 'bg-[#f8f9fa] border-transparent hover:bg-[#f1f3f5]'}`}
            onClick={() => setActiveTab('premium')}
          >
            <div className={`p-3 rounded-xl bg-white shadow-sm ${activeTab === 'premium' ? 'shadow-md' : ''}`}>
              <CheckCircle size={24} color="#28a745" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1 text-brand-dark">Premium Templates</h3>
              <p className="text-[13px] text-muted-foreground">Better UX. Clean Code. Technical Support</p>
            </div>
          </div>
          <div
            className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-6 cursor-pointer border-b-[3px] transition-colors min-w-[250px]
                ${activeTab === 'freebies' ? 'bg-white border-brand-secondary' : 'bg-[#f8f9fa] border-transparent hover:bg-[#f1f3f5]'}`}
            onClick={() => setActiveTab('freebies')}
          >
             <div className={`p-3 rounded-xl bg-white shadow-sm ${activeTab === 'freebies' ? 'shadow-md' : ''}`}>
              <Gem size={24} color="#6c757d" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1 text-brand-dark">Top Freebies</h3>
              <p className="text-[13px] text-muted-foreground">The most downloaded free templates</p>
            </div>
          </div>
          <div
            className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-6 cursor-pointer border-b-[3px] transition-colors min-w-[250px]
                ${activeTab === 'recent' ? 'bg-white border-brand-secondary' : 'bg-[#f8f9fa] border-transparent hover:bg-[#f1f3f5]'}`}
            onClick={() => setActiveTab('recent')}
          >
             <div className={`p-3 rounded-xl bg-white shadow-sm ${activeTab === 'recent' ? 'shadow-md' : ''}`}>
              <Clock size={24} color="#6c757d" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1 text-brand-dark">Recent Releases</h3>
              <p className="text-[13px] text-muted-foreground">Freshly baked. Latest trending UI</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

export default function Home() {
  const [activeTab, setActiveTab] = useState('premium');

  const templates = [
    { id: 1, title: 'Phoenix - Premium Bootstrap 5 Admin Dashboard', image: 'https://via.placeholder.com/400x250/333/fff?text=Phoenix', price: 59 },
    { id: 2, title: 'Falcon - Premium Bootstrap 5 Dashboard', image: 'https://via.placeholder.com/400x250/222/eee?text=Falcon', price: 69 },
    { id: 3, title: 'Sparrow - Creative Multipurpose Template', image: 'https://via.placeholder.com/400x250/444/ddd?text=Sparrow', price: 49 },
    { id: 4, title: 'Gulp - Multipage Landing Page Portfolio', image: 'https://via.placeholder.com/400x250/555/ccc?text=Gulp', price: 39 },
    { id: 5, title: 'Basic - Simple Free Blog Template', image: 'https://via.placeholder.com/400x250/666/bbb?text=Basic', price: 0, isFree: true },
    { id: 6, title: 'E-commerce Theme - Dark Mode Support', image: 'https://via.placeholder.com/400x250/777/aaa?text=E-commerce', price: 79 },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-brand-text">
      <Navbar />
      <SubNavbar />
      <main>
        <Hero />
        <CustomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <section className="py-16">
            <div className="container mx-auto px-5">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-8">
                    {templates.map(t => (
                    <TemplateCard key={t.id} {...t} />
                    ))}
                </div>
                <div className="flex justify-center mt-10">
                    <Button variant="outline" className="rounded-full px-6 py-6 border-gray-300 hover:border-brand-primary hover:text-brand-primary text-base gap-2">
                        View All Templates <ArrowRight size={16} />
                    </Button>
                </div>
            </div>
        </section>

        <section className="pb-20">
            <div className="container mx-auto px-5">
                <div className="bg-white border border-slate-200 rounded-2xl flex flex-col lg:flex-row overflow-hidden relative">
                    {/* Decorative gradient border effect */}
                    <div className="absolute inset-0 p-[2px] rounded-2xl bg-gradient-to-r from-[#4facfe] to-[#00f2fe] -z-10 pointer-events-none"></div>

                    <div className="flex-[1.5] p-10 lg:p-16 bg-white rounded-l-2xl">
                        <h2 className="text-[32px] font-bold mb-6 text-brand-dark leading-tight">Hire top notch React & UI/UX specialists from MyWebsite</h2>
                        <p className="text-muted-foreground text-lg mb-8">Need help with custom development? We can help you with software engineers experienced in Backend and front-end development.</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <Button className="bg-brand-primary hover:bg-[#e0961d] text-white rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-orange-200">Get a Free Quote</Button>
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
