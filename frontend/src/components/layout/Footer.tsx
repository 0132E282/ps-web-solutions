import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => (
    <footer className="pt-16 pb-5 border-t border-gray-100 bg-white">
      <div className="container mx-auto px-5">
        <div className="flex justify-center flex-wrap gap-x-8 gap-y-4 mb-12">
          {['Blog', 'About', 'Terms', 'License', 'Contact', 'Support', 'Submit Free Template'].map((item) => (
               <a key={item} href="#" className="text-muted-foreground hover:text-brand-dark text-sm transition-colors">{item}</a>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#f1f1f1] text-[13px] text-muted-foreground gap-4">
          <div className="flex gap-4">
            {/* Placeholder social icons */}
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"><Mail size={14}/></div>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"><Phone size={14}/></div>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"><MapPin size={14}/></div>
          </div>
          <div className="text-center">
            MyWebsite Inc © 2026. All rights reserved.
          </div>
          <div className="text-[#2196f3] cursor-pointer hover:underline font-medium">
             Redownload a theme
          </div>
        </div>
      </div>
    </footer>
);
