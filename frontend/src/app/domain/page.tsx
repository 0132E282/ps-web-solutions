'use client';

import { Search, Globe, ShieldCheck, Zap, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { SubNavbar } from '@/components/layout/SubNavbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';

const DomainPricing = [
  { ext: '.biz.vn', oldPrice: '566,000đ', price: '458,000đ' },
  { ext: '.ai.vn', oldPrice: '566,000đ', price: '458,000đ' },
  { ext: '.com', oldPrice: '300,000đ', price: '253,800đ' },
  { ext: '.net', oldPrice: '330,000đ', price: '302,400đ' },
  { ext: '.info', oldPrice: '500,000đ', price: '216,000đ' },
  { ext: '.org', oldPrice: '350,000đ', price: '302,400đ' },
  { ext: '.biz', oldPrice: '400,000đ', price: '410,400đ' },
];

const Features = [
    {
      title: 'Quản lý dễ dàng',
      description: 'Giao diện quản lý tên miền trực quan, giúp bạn dễ dàng cập nhật thông tin và cài đặt.',
      icon: <Globe className="w-10 h-10 text-blue-500" />
    },
    {
      title: 'Bảo mật tuyệt đối',
      description: 'Hỗ trợ bảo mật DNSSEC, ẩn thông tin Whois giúp tên miền của bạn luôn an toàn.',
      icon: <ShieldCheck className="w-10 h-10 text-green-500" />
    },
    {
      title: 'Kích hoạt ngay lập tức',
      description: 'Tên miền được kích hoạt tự động ngay sau khi hoàn tất thanh toán.',
      icon: <Zap className="w-10 h-10 text-orange-500" />
    },
    {
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ kỹ thuật giàu kinh nghiệm luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào.',
      icon: <Headphones className="w-10 h-10 text-brand-primary" />
    }
];

export default function DomainPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-brand-text">
      <Navbar />
      <SubNavbar />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-linear-to-br from-[#0072ff] via-[#00c6ff] to-[#0072ff] overflow-hidden">
          {/* Animated Background Icons */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 text-[80px] font-black rotate-[-15deg] select-none text-white">.com</div>
             <div className="absolute top-40 right-20 text-[60px] font-black rotate-10 select-none text-white">.net</div>
             <div className="absolute bottom-10 left-1/4 text-[50px] font-black rotate-[5deg] select-none text-white">.vn</div>
             <div className="absolute bottom-1/2 right-1/2 text-[40px] font-black rotate-[-20deg] select-none text-white">.info</div>
          </div>

          <div className="container mx-auto px-5 relative z-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-10 tracking-tight flex flex-col items-center gap-2">
                ĐĂNG KÝ TÊN MIỀN GIÁ TỐT TẠI MYWEBSITE
            </h1>


            {/* Search Bar */}
            <div className="max-w-4xl mx-auto relative group">
                <div className="bg-white p-2 rounded-2xl flex flex-col md:flex-row shadow-2xl shadow-blue-900/40 relative">
                    <div className="flex-1 flex items-center px-4 gap-3 border-r border-slate-100 mb-2 md:mb-0">
                        <Search className="text-slate-400" size={24} />
                        <Input
                            placeholder="Tìm tên miền bạn muốn..."
                            className="border-none bg-transparent h-14 text-lg font-medium focus-visible:ring-0 placeholder:text-slate-300"
                        />
                    </div>
                    <Button className="bg-[#ff9c00] hover:bg-[#e68a00] text-white font-black h-14 px-12 md:px-16 text-lg rounded-xl shadow-lg transition-all active:scale-95">
                        Kiểm tra
                    </Button>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-white/90 text-sm font-bold opacity-80 decoration-white/20">
                    <a href="#" className="hover:underline underline-offset-4 decoration-1">Tìm kiếm nhiều tên miền</a>
                </div>
            </div>

            {/* Price Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-16 max-w-6xl mx-auto">
                {DomainPricing.map((item, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white transition-all hover:bg-white/20 hover:-translate-y-1">
                        <div className="font-bold text-lg mb-1">{item.ext}</div>
                        <div className="text-[10px] opacity-60 line-through mb-1">{item.oldPrice}</div>
                        <div className="font-extrabold text-[#ffd900]">{item.price}</div>
                        <div className="text-[10px] opacity-60">/Năm</div>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-5 text-center">
                <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4 tracking-tight">Tại sao nên đăng ký tên miền tại MyWebsite?</h2>
                <p className="text-slate-500 font-medium mb-16 max-w-2xl mx-auto text-lg leading-relaxed">
                   Chúng tôi cung cấp giải pháp tên miền toàn diện với mức giá cạnh tranh và hỗ trợ tận tâm nhất.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {Features.map((f, i) => (
                        <Card key={i} className="border-none shadow-xl shadow-slate-200/60 rounded-4xl hover:-translate-y-2 transition-all duration-500 overflow-hidden bg-white">
                            <CardContent className="p-10 flex flex-col items-center text-center">
                                <div className="mb-6 bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-4 tracking-tight">{f.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{f.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-brand-dark relative overflow-hidden">
             <div className="absolute inset-0 bg-[#0072ff]/5 opacity-50"></div>
             <div className="container mx-auto px-5 relative z-10 text-center">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter">Bạn đã sẵn sàng đưa thương hiệu lên Internet?</h2>
                <p className="text-slate-400 text-xl font-medium mb-12 max-w-3xl mx-auto">Kiểm tra sự tồn tại của tên miền ngay bây giờ và nhận những ưu đãi đặc biệt nhất dành riêng cho bạn.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button className="bg-brand-primary hover:bg-[#e0961d] text-white px-10 py-8 h-auto text-xl font-black rounded-2xl shadow-2xl shadow-orange-500/10">Tìm kiếm ngay</Button>
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 px-10 py-8 h-auto text-xl font-bold rounded-2xl backdrop-blur-sm">Liên hệ tư vấn</Button>
                </div>
             </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
