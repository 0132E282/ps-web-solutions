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
    image: `https://via.placeholder.com/400x250/e0e0e0/555?text=${CategoryTitle}+${i + 1}`,
    price: (i % 5) * 10 + 19,
    isFree: i % 3 === 0,
    slug: `${CategoryTitle.toLowerCase().replace(/ /g, '-')}-template-${i + 1}`
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-brand-text">
      <Navbar />
      <SubNavbar />

      <div className="bg-brand-bg py-8 border-b border-gray-200">
        <div className="container mx-auto px-5">
            <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Link href="/" className="hover:text-brand-primary">Home</Link>
                <ChevronRight size={14} className="mx-2" />
                <span className="text-brand-dark font-medium">{CategoryTitle}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark">{CategoryTitle} Templates</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
                Browse our collection of {CategoryTitle} templates. Use these templates to build responsive, mobile-first websites.
            </p>
        </div>
      </div>

      <main className="container mx-auto px-5 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar */}
            <aside className="w-full lg:w-[280px] shrink-0">
                <div className="lg:sticky lg:top-24">
                    <SidebarFilter />
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-muted-foreground">
                        Showing <span className="font-bold text-brand-dark">1-12</span> of <span className="font-bold text-brand-dark">45</span> templates
                    </div>

                    {/* Simple Sort Dropdown Mock */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
                        <select className="bg-white border border-gray-200 text-sm rounded-md p-2 outline-none focus:ring-1 focus:ring-brand-primary">
                            <option>Newest</option>
                            <option>Popular</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {templates.map(t => (
                        <TemplateCard key={t.id} {...t} />
                    ))}
                </div>

                {/* Pagination */}
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
