import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { SubNavbar } from '@/components/layout/SubNavbar';
import { SidebarFilter } from '@/components/templates/SidebarFilter';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

type Props = {
  params: Promise<{ category: string }>;
};

// Generate dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category }  = await params;
  const title = category ? category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Templates';

  return {
    title: `${title} Templates - Free & Premium | MyWebsite`,
    description: `Discover the best ${title} templates and themes. Download free and premium ${title} templates for your next project.`,
    openGraph: {
        title: `${title} Templates - Free & Premium | MyWebsite`,
        description: `High-quality ${title} templates for modern web development.`,
        type: 'website',
    }
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const CategoryTitle = category ? category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Templates';

  // Mock data for templates
  const templates = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    title: `${CategoryTitle} Template ${i + 1} - Modern Dashboard & Landing Page`,
    image: `https://images.unsplash.com/photo-${[
        '1498050108023-c5249f4df085',
        '1461747541859-4d81f4529e1c',
        '1555066931-4365d14bab8c',
        '1517694712202-14dd9538aa97',
        '1581291518633-83b4ebd1d83e'
    ][i % 5]}?q=80&w=800&auto=format&fit=crop`,
    price: (i % 5) * 10 + 19,
    originalPrice: (i % 5) * 10 + 39,
    isFree: i % 4 === 0,
    isHot: i % 3 === 0,
    slug: `${CategoryTitle.toLowerCase().replace(/ /g, '-')}-template-${i + 1}`
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-brand-text">
      <Navbar />
      <SubNavbar />
      <main className="container mx-auto px-5 pb-10 pt-5">
        <div className="bg-brand-bg border-b border-gray-200">
          <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-brand-primary">Home</Link>
              <ChevronRight size={14} className="mx-2" />
              <span className="text-brand-dark font-medium">{CategoryTitle}</span>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8 mt-5">
            <aside className="w-full lg:w-[260px] shrink-0">
                <div className="lg:sticky lg:top-24">
                    <SidebarFilter />
                </div>
            </aside>

            <div className="flex-1">
               <div className="flex justify-end mb-4">
                  <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Sort by:</span>
                        <select className="bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all cursor-pointer">
                            <option>Newest Release</option>
                            <option>Popularity</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-16">
                    {templates.map(t => (
                        <TemplateCard key={t.id} {...t} />
                    ))}
                </div>

                <div className="flex justify-center items-center gap-2">
                    <Button variant="outline" size="icon" className="w-10 h-10 rounded-full" disabled>
                        <ChevronLeft size={16} />
                    </Button>
                    <Button variant="default" className="w-10 h-10 rounded-full bg-brand-primary text-white hover:bg-[#e0961d]">1</Button>
                    <Button variant="outline" className="w-10 h-10 rounded-full hover:bg-brand-bg hover:text-brand-primary border-transparent">2</Button>
                    <Button variant="outline" className="w-10 h-10 rounded-full hover:bg-brand-bg hover:text-brand-primary border-transparent">3</Button>
                    <span className="text-muted-foreground px-2">...</span>
                    <Button variant="outline" className="w-10 h-10 rounded-full hover:bg-brand-bg hover:text-brand-primary border-transparent">8</Button>
                    <Button variant="outline" size="icon" className="w-10 h-10 rounded-full hover:bg-brand-bg hover:text-brand-primary">
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
