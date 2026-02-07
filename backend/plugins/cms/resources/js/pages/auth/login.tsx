import InputError from '@core/components/input-error';
import TextLink from '@core/components/text-link';
import { Button } from '@core/components/ui/button';
import { Card, CardContent } from '@core/components/ui/card';
import { Checkbox } from '@core/components/ui/checkbox';
import { Input } from '@core/components/ui/input';
import { Label } from '@core/components/ui/label';
import { Spinner } from '@core/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from '@core/components/ui/carousel';

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
        '/images/auth/slider-1.png',
        '/images/auth/slider-2.png',
        '/images/auth/slider-3.png',
        '/images/auth/slider-4.png',
    ];

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    return (
        <>
            <Head title={tt('Log in')} />
            <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
                <div className="w-full max-w-sm md:max-w-4xl">
                    <Card className="overflow-hidden p-0">
                        <CardContent className="grid p-0 md:grid-cols-2">
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="p-6 md:p-8"
                            >
                                {({ processing, errors }) => (
                                    <div className="flex flex-col gap-6">
                                        <div className="flex flex-col items-center text-center">
                                            <h1 className="text-2xl font-bold">{tt('Welcome back')}</h1>
                                            <p className="text-balance text-muted-foreground">
                                                {tt('Login to your account')}
                                            </p>
                                        </div>

                                        {status && (
                                            <div className="rounded-md bg-green-50 p-3 text-center text-sm font-medium text-green-600">
                                                {status}
                                            </div>
                                        )}

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">{tt('Email')}</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                placeholder={tt('m@example.com')}
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="password">{tt('Password')}</Label>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={request()}
                                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                                        tabIndex={5}
                                                    >
                                                        {tt('Forgot your password?')}
                                                    </TextLink>
                                                )}
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                            />
                                            <Label htmlFor="remember">{tt('Remember me')}</Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && <Spinner />}
                                            {tt('Login')}
                                        </Button>

                                        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                            <span className="relative z-10 bg-white px-2 text-muted-foreground">
                                                {tt('Or continue with')}
                                            </span>
                                        </div>

                                        <div className="grid gap-4">
                                            <Button variant="outline" className="w-full h-11 font-medium" asChild>
                                                <a href="/auth/google">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-5 w-5">
                                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                                    </svg>
                                                    {tt('Login with Google')}
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form>

                            <div className="relative hidden bg-muted md:block">
                                <Carousel
                                    setApi={setApi}
                                    plugins={[plugin.current]}
                                    className="w-full h-full"
                                    opts={{
                                        loop: true,
                                    }}
                                >
                                    <CarouselContent className="h-full ml-0">
                                        {sliderImages.map((src) => (
                                            <CarouselItem key={src} className="h-full pl-0">
                                                <div
                                                    className="w-full h-full bg-cover bg-center bg-no-repeat min-h-[600px]"
                                                    style={{ backgroundImage: `url("${src}")` }}
                                                />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>

                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                        {Array.from({ length: count }).map((_, index) => (
                                            <button
                                                key={index}
                                                className={`h-2 w-2 rounded-full transition-all ${current === index ? 'bg-white w-4' : 'bg-white/50'
                                                    }`}
                                                onClick={() => api?.scrollTo(index)}
                                                aria-label={`Go to slide ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </Carousel>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
