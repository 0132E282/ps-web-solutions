'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of Lottie with SSR disabled as it needs 'window'
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import heroAnimation from '../../assets/web-design.json';

const HeroGraphic = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}

            onMouseLeave={() => {
                setMousePos({ x: 0, y: 0 });
            }}
            className="relative w-full aspect-square flex items-center justify-center overflow-hidden rounded-[4rem] group select-none perspective-2000"
        >
            {/* # Liquid Aura Background (Keep it for extra depth) */}
            <div className="absolute inset-0 z-0">
                {/* Radial Depth Glow instead of solid color */}
                <div className="absolute inset-0"></div>

                {/* Modern Wave Distortion Effect Top/Bottom */}
                <div className="absolute top-0 left-0 w-full h-32  from-primary/5 to-transparent opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-full h-40  from-primary/5 to-transparent"></div>

                {/* Ultra-subtle Dot Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Premium Grain Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}></div>

            {/* # The New Hero Piece: Lottie Animation */}
            <div
                className="relative z-20 w-full h-full p-8 transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{
                    transform: `
                        translate3d(${mousePos.x * 30}px, ${mousePos.y * 30}px, 0)
                        rotateX(${mousePos.y * -10}deg)
                        rotateY(${mousePos.x * 10}deg)
                    `
                }}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <Lottie
                        animationData={heroAnimation}
                        loop={true}
                        className="w-full h-full max-w-[800px]"
                    />
                </div>

                {/* Glass Reflective Glare Overlay over the animation */}
                <div className="absolute inset-0 b from-white/20 via-transparent to-primary/5 pointer-events-none rounded-[4rem]"></div>
            </div>

            {/* Stylized Rays */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] blur-[180px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] blur-[150px] translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none"></div>
        </div>
    );
};

export default HeroGraphic;
