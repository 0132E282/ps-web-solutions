import { LoginForm } from "@core/components/login-form";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from '@core/components/ui/carousel';
import type { CarouselApi } from '@core/components/ui/carousel';
import { tt } from '@core/lib/i18n';
import { Head } from '@inertiajs/react';
import Autoplay from 'embla-carousel-autoplay';
import { GalleryVerticalEnd } from "lucide-react";
import * as React from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({
    status,
    canResetPassword,
}: LoginProps) {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: false })
    );

    const sliderImages = [
        'https://images.unsplash.com/photo-1590069261209-18e95f496241?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    ];

    React.useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    return (
        <>
            <Head title={tt('Log in')} />
            <div className="grid min-h-svh lg:grid-cols-2">
                <div className="relative hidden bg-muted lg:block">
                    <Carousel
                        setApi={setApi}
                        plugins={[plugin.current]}
                        className="w-full h-full"
                        opts={{
                            loop: true,
                        }}
                    >
                        <CarouselContent className="h-full ml-0">
                            {sliderImages.map((src, index) => (
                                <CarouselItem key={index} className="h-full pl-0">
                                    <div
                                        className="w-full h-full bg-cover bg-center bg-no-repeat"
                                        style={{ backgroundImage: `url("${src}")` }}
                                    >
                                        <div className="absolute inset-0 bg-black/20" />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                            {Array.from({ length: count }).map((_, index) => (
                                <button
                                    key={index}
                                    className={`h-2 rounded-full transition-all ${
                                        current === index ? 'bg-white w-6' : 'bg-white/50 w-2'
                                    }`}
                                    onClick={() => api?.scrollTo(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </Carousel>
                </div>
                <div className="flex flex-col gap-4 p-6 md:p-10">
                    <div className="flex justify-center gap-2 md:justify-start">
                        <a href="#" className="flex items-center gap-2 font-medium">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <GalleryVerticalEnd className="size-4" />
                            </div>
                            {tt('Acme Inc.')}
                        </a>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-xs">
                            <LoginForm status={status} canResetPassword={canResetPassword} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
