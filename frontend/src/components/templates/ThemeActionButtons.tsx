'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye, Wrench, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ThemeActionButtonsProps {
  price: number;
  themeTitle: string;
}

export const ThemeActionButtons = ({ price, themeTitle }: ThemeActionButtonsProps) => {
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState<'custom' | 'contact'>('custom');

  const handleOpen = (type: 'custom' | 'contact') => {
    setFormType(type);
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Mua ngay */}
      <Button className="w-full bg-brand-primary hover:bg-[#e0961d] text-white font-black h-14 text-base shadow-lg shadow-orange-100 gap-3 transition-transform active:scale-95">
        <ShoppingCart size={20} /> Mua ngay (${price})
      </Button>

      {/* Custom Chỉnh sửa */}
      <Button
        variant="outline"
        onClick={() => handleOpen('custom')}
        className="w-full h-14 text-base font-bold gap-3 border-2 border-slate-100 hover:border-brand-primary hover:text-brand-primary transition-all"
      >
        <Wrench size={20} /> Tùy chỉnh theo yêu cầu
      </Button>

      {/* Liên hệ tư vấn */}
      <Button
        variant="secondary"
        onClick={() => handleOpen('contact')}
        className="w-full h-14 text-base font-bold gap-3 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
      >
        <Phone size={20} /> Liên hệ tư vấn
      </Button>

      {/* Live Preview - Keep it as requested or keep existing */}
      <Button variant="ghost" className="w-full h-12 text-sm gap-2 text-slate-400 hover:text-brand-primary font-medium">
        <Eye size={18} /> Xem bản thử nghiệm
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-4xl border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-brand-dark mb-2">
              {formType === 'custom' ? 'Yêu cầu tùy chỉnh' : 'Liên hệ tư vấn'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Bạn đang quan tâm đến <strong>{themeTitle}</strong>. Vui lòng để lại thông tin, chúng tôi sẽ liên hệ lại ngay!
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6 transition-all">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-bold text-brand-dark ml-1">Họ và tên</Label>
              <Input id="name" placeholder="Nguyễn Văn A" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="email" className="font-bold text-brand-dark ml-1">Email</Label>
                 <Input id="email" type="email" placeholder="example@gmail.com" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="phone" className="font-bold text-brand-dark ml-1">Số điện thoại</Label>
                 <Input id="phone" placeholder="0901 xxx xxx" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" />
               </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content" className="font-bold text-brand-dark ml-1">Nội dung yêu cầu</Label>
              <Textarea
                id="content"
                placeholder={formType === 'custom' ? 'Hãy mô tả những thay đổi bạn muốn thực hiện...' : 'Hãy cho chúng tôi biết bạn cần hỗ trợ gì về sản phẩm này...'}
                className="min-h-[120px] rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full bg-brand-primary hover:bg-[#e0961d] text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-orange-100 transition-all hover:scale-[1.02] active:scale-95">
              Gửi yêu cầu ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
