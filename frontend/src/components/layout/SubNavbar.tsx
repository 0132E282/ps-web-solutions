import { Badge } from '@/components/ui/badge';

export const SubNavbar = () => (
    <div className="h-[54px] bg-white border-b border-gray-100 flex items-center hidden md:flex">
      <div className="container mx-auto px-5 flex items-center justify-between">
        <div className="flex gap-5 overflow-x-auto py-2.5 no-scrollbar">
          {['Admin & Dashboard', 'Bootstrap 5', 'Material UI', 'Tailwind CSS', 'eCommerce', 'Landing Pages', 'Business & Corporate', 'Portfolio', 'Educational'].map((category, index) => (
              <a key={index} href={`/${category.toLowerCase().replace(/ /g, '-').replace('&', 'and')}`} className={`text-[13px] whitespace-nowrap transition-colors ${index === 0 ? 'text-[#1b2a4e] font-semibold' : 'text-muted-foreground hover:text-[#1b2a4e] hover:font-semibold'}`}>
                  {category}
              </a>
          ))}
        </div>
        <Badge variant="secondary" className="bg-[#fff3da] text-[#856404] hover:bg-[#fff3da] border border-[#ffeeba] rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap hidden lg:inline-flex">
          Bundle - Save 88%
        </Badge>
      </div>
    </div>
  );
