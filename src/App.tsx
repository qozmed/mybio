
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { 
  Github, 
  Send, 
  MessagesSquare as Discord, 
  Mail, 
  Globe,
  ArrowUpRight,
  Quote,
  ShieldCheck
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

// --- Types ---
interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ElementType;
}

// --- Icons ---
const CustomIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
  <Icon size={18} strokeWidth={1} className="text-white/60" />
);

// --- Components ---

const NoiseOverlay = () => <div className="noise-overlay" />;

const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState({ beta: 0, gamma: 0 });
  const isSupported = typeof window !== 'undefined' && !!window.DeviceOrientationEvent;

  useEffect(() => {
    if (!isSupported) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // beta: front-to-back tilt (-180 to 180)
      // gamma: left-to-right tilt (-90 to 90)
      setOrientation({
        beta: e.beta || 0,
        gamma: e.gamma || 0,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isSupported]);

  return orientation;
};

const MorphingBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const orientation = useDeviceOrientation();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Combine Mouse and Gyro (Gyro scaled to feel similar to mouse offsets)
  const gyroX = useSpring(orientation.gamma * 2, { stiffness: 50, damping: 20 });
  const gyroY = useSpring(orientation.beta * 2, { stiffness: 50, damping: 20 });
  
  const mouseSpringX = useSpring(useTransform(mouseX, [0, window.innerWidth], [-40, 40]), { stiffness: 50, damping: 20 });
  const mouseSpringY = useSpring(useTransform(mouseY, [0, window.innerHeight], [-40, 40]), { stiffness: 50, damping: 20 });

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <motion.div 
        style={{ 
          x: orientation.gamma !== 0 ? gyroX : mouseSpringX, 
          y: orientation.beta !== 0 ? gyroY : mouseSpringY 
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[100px] opacity-[0.15]"
      >
        <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            animate={{
              d: [
                "M450.5,348Q401,396,339.5,431Q278,466,227,419Q176,372,138.5,311.5Q101,251,148,197Q195,143,267,112Q339,81,401.5,133.5Q464,186,482,243Q500,300,450.5,348Z",
                "M427,337.5Q389,425,296.5,433.5Q204,442,159,363Q114,284,153,205.5Q192,127,288.5,123.5Q385,120,425,185Q465,250,427,337.5Z",
                "M450.5,348Q401,396,339.5,431Q278,466,227,419Q176,372,138.5,311.5Q101,251,148,197Q195,143,267,112Q339,81,401.5,133.5Q464,186,482,243Q500,300,450.5,348Z"
              ]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            fill="#FFF"
          />
        </svg>
      </motion.div>
    </div>
  );
};

const Magnetic = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const orientation = useDeviceOrientation();
  
  const springX = useSpring(x, { stiffness: 100, damping: 15 });
  const springY = useSpring(y, { stiffness: 100, damping: 15 });

  useEffect(() => {
    // If gyro is active (beta/gamma not zero), override with gyro data
    if (orientation.beta !== 0 || orientation.gamma !== 0) {
      x.set(orientation.gamma * 1.5);
      y.set(orientation.beta * 1.5);
    }
  }, [orientation, x, y]);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Only use mouse if gyro isn't doing much (likely desktop)
    if (orientation.beta === 0 && orientation.gamma === 0) {
      if (!ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      if (Math.abs(distanceX) < 150 && Math.abs(distanceY) < 150) {
        x.set(distanceX * 0.1);
        y.set(distanceY * 0.1);
      } else {
        x.set(0);
        y.set(0);
      }
    }
  };

  const handleMouseLeave = () => {
    if (orientation.beta === 0 && orientation.gamma === 0) {
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
};

const Section = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <motion.section 
      ref={ref}
      style={{ opacity, scale }}
      className={`relative min-h-screen flex flex-col justify-center items-center px-8 md:px-24 py-32 snap-center snap-always ${className}`}
    >
      <Magnetic>
        {children}
      </Magnetic>
    </motion.section>
  );
};

// --- Main App ---

export default function App() {
  const containerRef = useRef(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification(`${label} COPIED TO CLIPS`);
  };

  const links: LinkItem[] = [
    { id: '1', title: 'Services', description: 'List of all my services', url: 'https://t.me/+xgez-SS2VAFkNjEy', icon: ArrowUpRight },
    { id: '2', title: 'Vouches', description: 'Client feedback & integrity', url: 'https://t.me/+ulURcYOrMn82MmUy', icon: ShieldCheck },
    { id: '3', title: 'Coming soon...', description: 'New projects arriving', url: '#', icon: Globe },
  ];

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#000] selection:bg-white selection:text-black min-h-[500vh]">
      <NoiseOverlay />
      <MorphingBackground />

      {/* 1. Hero Section */}
      <Section>
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="text-center"
          >
            <span className="text-sm md:text-base font-serif italic opacity-30 tracking-[0.3em] block mb-4">
              my name is...
            </span>
            <h1 className="text-[64px] sm:text-[100px] md:text-[160px] font-display font-extralight uppercase tracking-[-0.04em] leading-none steel-shimmer bg-clip-text">
              lowball
            </h1>
          </motion.div>
        </div>
      </Section>

      {/* 2. Status Section */}
      <Section className="bg-[#000]/50 backdrop-blur-3xl">
        <div className="w-full max-w-4xl space-y-24">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] tracking-[0.4em] uppercase opacity-30 steel-shimmer bg-clip-text">Availability</span>
            <div className="h-[1px] w-full bg-white/5" />
            <div className="flex flex-col sm:flex-row justify-start sm:gap-12 md:gap-32 sm:items-baseline">
              <h2 className="text-3xl md:text-5xl font-display font-extralight tracking-tight mb-2 sm:mb-0 sm:w-48 md:w-64">Active Hours</h2>
              <span className="text-xl font-mono steel-shimmer bg-clip-text">09:00 — 22:00</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-[10px] tracking-[0.4em] uppercase opacity-30 steel-shimmer bg-clip-text">Location</span>
            <div className="h-[1px] w-full bg-white/5" />
            <div className="flex flex-col sm:flex-row justify-start sm:gap-12 md:gap-32 sm:items-baseline">
              <h2 className="text-3xl md:text-5xl font-display font-extralight tracking-tight mb-2 sm:mb-0 sm:w-48 md:w-64">Current Time</h2>
              <span className="text-lg sm:text-xl font-mono steel-shimmer bg-clip-text">
                {new Date(time.getTime() + 3 * 3600000).toLocaleTimeString([], { hour12: false, timeZone: 'UTC' })} <span className="text-xs ml-2 opacity-50">UTC +3</span>
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Portfolio/Services */}
      <Section>
        <div className="w-full max-w-3xl space-y-12">
          <span className="text-[10px] tracking-[0.4em] uppercase opacity-30 block text-center mb-12 steel-shimmer bg-clip-text">Selected Index</span>
          <div className="flex flex-col w-full border-t border-white/10 mt-8">
            {links.map((link, index) => {
              const isComingSoon = link.title === 'Coming soon...';
              return (
                <a 
                  key={link.id} 
                  href={isComingSoon ? undefined : link.url}
                  target={isComingSoon ? undefined : "_blank"}
                  rel={isComingSoon ? undefined : "noopener noreferrer"}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between py-8 sm:py-10 border-b border-white/10 transition-all duration-500 ${isComingSoon ? 'cursor-default opacity-30 w-full' : 'w-full opacity-60 hover:opacity-100 hover:pl-4 sm:hover:pl-6'}`}
                  onClick={(e) => isComingSoon && e.preventDefault()}
                >
                  <div className="flex items-center gap-6 sm:gap-10 flex-1">
                    <span className="text-[10px] tracking-[0.3em] font-mono opacity-30 hidden sm:block">0{index + 1}</span>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-extralight tracking-tight w-full">
                      {link.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-8 mt-4 sm:mt-0 w-full sm:w-auto">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/40 hidden sm:block">
                      {link.description}
                    </span>
                    <div className={`transition-transform duration-500 ${!isComingSoon ? 'group-hover:translate-x-1 group-hover:-translate-y-1' : ''}`}>
                      <link.icon size={18} strokeWidth={1} className={isComingSoon ? 'opacity-40' : 'opacity-60 group-hover:opacity-100'} />
                    </div>
                  </div>
                  {/* Mobile description */}
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block sm:hidden mt-2">
                    {link.description}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 4. Reviews */}
      <Section className="bg-[#000]/50 backdrop-blur-2xl">
        <div className="max-w-xl text-center flex flex-col items-center gap-12">
          <Quote size={32} strokeWidth={1} className="opacity-20" />
          <p className="text-2xl md:text-4xl font-display font-light leading-snug text-white/80 italic">
            "The hardest thing is to start acting, everything else depends only on your persistence."
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.3em] uppercase opacity-50">Writer and aviator</span>
            <span className="text-[11px] tracking-[0.3em] uppercase font-medium steel-shimmer bg-clip-text">Amelia Earhart</span>
          </div>
        </div>
      </Section>

      {/* 5. Contact */}
      <Section>
        <div className="w-full max-w-4xl flex flex-col items-center gap-16 md:gap-24">
          <h2 className="text-4xl sm:text-6xl md:text-9xl font-display font-extralight tracking-tighter text-center steel-shimmer bg-clip-text py-4">
            CONTACT ME.
          </h2>
          
          <div className="flex flex-wrap justify-center gap-10 md:gap-24 opacity-40 focus-within:opacity-100 hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleCopy('lowball@list.ru', 'EMAIL')}
              className="flex flex-col items-center gap-4 group cursor-pointer"
            >
              <Mail size={24} strokeWidth={1} />
              <span className="text-[9px] tracking-widest uppercase group-hover:opacity-100 opacity-0 transition-opacity">Email</span>
            </button>
            <a 
              href="https://t.me/lowbail" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-4 group"
            >
              <Send size={24} strokeWidth={1} />
              <span className="text-[9px] tracking-widest uppercase group-hover:opacity-100 opacity-0 transition-opacity">Telegram</span>
            </a>
            <button 
              onClick={() => handleCopy('q3s3', 'DISCORD')}
              className="flex flex-col items-center gap-4 group cursor-pointer"
            >
              <Discord size={24} strokeWidth={1} />
              <span className="text-[9px] tracking-widest uppercase group-hover:opacity-100 opacity-0 transition-opacity">Discord</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 mt-12">
             <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
             <span className="text-[9px] tracking-[0.5em] uppercase opacity-20 italic font-serif text-lg">made by lowball</span>
          </div>
        </div>
      </Section>

      {/* Global Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 border border-white/10 bg-black/80 backdrop-blur-xl rounded-full"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase steel-shimmer bg-clip-text font-medium">
              {notification}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
