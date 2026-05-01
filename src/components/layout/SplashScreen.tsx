"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Staggered cinematic sequence
    const t1 = setTimeout(() => setStage(1), 100);   // Logo in
    const t2 = setTimeout(() => setStage(2), 700);   // Text & loader in
    const t3 = setTimeout(() => setStage(3), 1300);  // Footer in

    // Start fading out the entire screen
    const t4 = setTimeout(() => setIsFading(true), 3800);

    // Completely unmount
    const t5 = setTimeout(() => setIsVisible(false), 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-background transition-opacity duration-1000 ease-in-out overflow-hidden",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div 
          className={cn(
            "w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-primary/10 rounded-full blur-[100px] transition-opacity duration-1000",
            stage >= 1 ? "opacity-100" : "opacity-0"
          )} 
        />
      </div>

      <div className="flex-1 relative z-10" />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center relative z-10 w-full max-w-sm px-6">
        
        {/* Logo Container (Decreased Size) */}
        <div 
          className={cn(
            "relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            stage >= 1 ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-90"
          )}
        >
          {/* Subtle logo pulse effect */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-[1.3] animate-pulse" />
          <img
            src="/AdiARC - Logo.gif"
            alt="AdiARC Splash Screen"
            className="relative w-full h-full object-contain"
          />
        </div>
        
        {/* Title & Loader */}
        <div 
          className={cn(
            "mt-8 flex flex-col items-center w-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
        >
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50 drop-shadow-lg"
          >
            AdiARC
          </h1>
          
          {/* Custom High-Tech Loader */}
          <div className="mt-8 flex items-center gap-3 w-full">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/50 to-primary/50" />
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase font-bold text-muted-foreground">
              Initializing
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-primary/50 to-primary/50" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-1 flex flex-col justify-end pb-8 sm:pb-12 relative z-10">
        <p 
          className={cn(
            "text-[11px] sm:text-xs md:text-sm font-semibold text-muted-foreground/70 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            stage >= 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          Proudly Developed by <span className="text-primary font-bold tracking-wider relative whitespace-nowrap">
            Adil Munawar
            {/* Subtle glow on your name */}
            <span className="absolute inset-0 blur-sm bg-primary/20 -z-10 mix-blend-screen" />
          </span>
        </p>
      </div>
    </div>
  );
}
