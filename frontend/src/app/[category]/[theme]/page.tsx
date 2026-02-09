import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { SubNavbar } from '@/components/layout/SubNavbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Eye, Heart, Star, Share2, Info, Layers, Layout, Globe, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeActionButtons } from '@/components/templates/ThemeActionButtons';

type Props = {
  params: Promise<{ theme: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme }  = await params;
  const title = theme.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    title: `${title} - Free & Premium Theme | MyWebsite`,
    description: `Download ${title}, a high quality theme for your next project.`,
    openGraph: {
        title: `${title} - Free & Premium Theme`,
        type: 'website',
    }
  };
}

export default async function ThemeDetailPage({ params }: Props) {
  const { theme: themeSlug } = await params;
  console.log('ThemeDetailPage params:', { themeSlug });
  const ThemeTitle = themeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Mock data
  const theme = {
    title: ThemeTitle,
    version: '1.2.0',
    lastUpdate: 'February 7, 2026',
    published: 'January 15, 2026',
    category: 'Admin & Dashboard',
    framework: 'React / Next.js',
    css: 'Tailwind CSS',
    price: 49,
    rating: 4.8,
    reviews: 124,
    sales: 1540,
    features: [
        'Fully Responsive Layout',
        'Clean & Modern Design',
        'Dark Mode Support',
        'Next.js 14+ Architecture',
        'TypeScript Support',
        'RTL Support',
        'Customizable Components',
        'Detailed Documentation'
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-brand-text">
      <Navbar />
      <SubNavbar />

      <main className="container mx-auto px-5 py-10">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                   <Link href="/" className="hover:text-brand-primary">Home</Link> /
                   <Link href="#" className="hover:text-brand-primary">Themes</Link> /
                   <span className="text-brand-dark font-medium">{ThemeTitle}</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">{ThemeTitle}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold text-brand-dark">{theme.rating}</span> ({theme.reviews} Reviews)
                    </div>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{theme.sales} Sales</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>by <a href="#" className="text-brand-primary hover:underline">MyWebsite</a></span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <Button variant="outline" size="icon" className="rounded-full">
                    <Heart size={18} />
                 </Button>
                 <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 size={18} />
                 </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content Column */}
            <div className="lg:col-span-2 space-y-8">

                {/* Preview Image */}
                <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative group">
                        <img
                            src={`https://via.placeholder.com/800x450/e0e0e0/555?text=${ThemeTitle}+Preview`}
                            alt={`${ThemeTitle} Preview`}
                            className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button className="bg-brand-secondary hover:bg-[#218838] text-white rounded-full font-bold px-8 py-6 text-lg gap-2">
                                <Eye size={20} /> Live Preview
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs Information */}
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 mb-6">
                        <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary px-6 py-3 text-base">Item Details</TabsTrigger>
                        <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary px-6 py-3 text-base">Reviews ({theme.reviews})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="bg-white p-8 rounded-xl border border-gray-200">
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Description</h3>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            {ThemeTitle} is a powerful and flexible admin dashboard template built with the latest technologies.
                            It provides a clean, modern, and intuitive user interface that is easy to customize and adapt to your specific needs.
                            Whether you are building a SaaS application, an e-commerce platform, or a corporate dashboard, {ThemeTitle} has got you covered.
                        </p>

                        <h3 className="text-xl font-bold text-brand-dark mb-4">Key Features</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                            {theme.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                                    <Check size={16} className="text-green-500 shrink-0" /> {feature}
                                </li>
                            ))}
                        </ul>

                        <Separator className="my-6" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Layers className="mx-auto mb-2 text-brand-primary" />
                                <div className="font-bold text-brand-dark">Files Included</div>
                                <div className="text-xs text-muted-foreground">HTML, CSS, JS</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Layout className="mx-auto mb-2 text-brand-primary" />
                                <div className="font-bold text-brand-dark">Layout</div>
                                <div className="text-xs text-muted-foreground">Responsive</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Globe className="mx-auto mb-2 text-brand-primary" />
                                <div className="font-bold text-brand-dark">Browsers</div>
                                <div className="text-xs text-muted-foreground">Cross-Browser</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Code className="mx-auto mb-2 text-brand-primary" />
                                <div className="font-bold text-brand-dark">Code</div>
                                <div className="text-xs text-muted-foreground">Clean & Valid</div>
                            </div>
                        </div>

                    </TabsContent>

                    <TabsContent value="reviews" className="bg-white p-8 rounded-xl border border-gray-200">
                        <div className="text-center py-10 text-muted-foreground">
                            No reviews yet. Be the first to review!
                        </div>
                    </TabsContent>

                </Tabs>

            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-6">

                {/* Purchase Card */}
                <Card className="border shadow-lg border-brand-primary/20 sticky top-24">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-2">
                             <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Regular License</Badge>
                             <span className="text-3xl font-extrabold text-brand-dark">${theme.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">Quality checked by MyWebsite</p>

                        <ThemeActionButtons price={theme.price} themeTitle={theme.title} />

                        <Separator className="my-6" />

                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <span>Quality checked by MyWebsite</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <span>Future updates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <span>6 months support from author</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Theme Information */}
                <Card className="border shadow-sm border-gray-200">
                    <CardContent className="p-6">
                        <h4 className="font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                           <Info size={18} /> Theme Information
                        </h4>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-1 border-b border-dashed border-gray-100 pb-2">
                                <span className="text-muted-foreground">Last Update</span>
                                <span className="font-medium text-brand-dark">{theme.lastUpdate}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-dashed border-gray-100 pb-2">
                                <span className="text-muted-foreground">Created</span>
                                <span className="font-medium text-brand-dark">{theme.published}</span>
                            </div>
                             <div className="flex justify-between py-1 border-b border-dashed border-gray-100 pb-2">
                                <span className="text-muted-foreground">High Resolution</span>
                                <span className="font-medium text-brand-dark">Yes</span>
                            </div>
                             <div className="flex justify-between py-1 border-b border-dashed border-gray-100 pb-2">
                                <span className="text-muted-foreground">Widget Ready</span>
                                <span className="font-medium text-brand-dark">Yes</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-dashed border-gray-100 pb-2">
                                <span className="text-muted-foreground">Compatible Browsers</span>
                                <span className="font-medium text-brand-dark">IE11, Firefox, Safari, Opera, Chrome, Edge</span>
                            </div>
                             <div className="flex justify-between py-1 border-b border-dashed border-gray-100 pb-2">
                                <span className="text-muted-foreground">Framework</span>
                                <span className="font-medium text-brand-dark">{theme.framework}</span>
                            </div>
                             <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Version</span>
                                <span className="font-medium text-brand-dark">{theme.version}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 {/* Tags */}
                <Card className="border shadow-sm border-gray-200">
                    <CardContent className="p-6">
                        <h4 className="font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {['admin', 'dashboard', 'template', 'react', 'nextjs', 'tailwind', 'ui-kit', 'responsive'].map((tag, i) => (
                                <Badge key={i} variant="outline" className="font-normal text-muted-foreground hover:text-brand-primary cursor-pointer">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
