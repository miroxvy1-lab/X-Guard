import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';
import Installer from './components/Installer';
import LockScreen from './components/LockScreen';
import Desktop from './components/Desktop';
import { isInstalled } from './utils/store';
import { User } from './types';

type AppState = 'booting' | 'installing' | 'locked' | 'unlocked';

export default function App() {
  const [state, setState] = useState<AppState>('booting');
  const [currentUser, setCurrentUser] = useState<User | 'admin' | null>(null);

  useEffect(() => {
    // Simulated BIOS/Kernel startup delay
    const timer = setTimeout(() => {
      if (isInstalled()) {
        setState('locked');
      } else {
        setState('installing');
      }
    }, 2000); // 2 seconds boot splash screen

    return () => clearTimeout(timer);
  }, []);

  const handleInstallComplete = () => {
    setState('locked');
  };

  const handleUnlock = (user: User | 'admin') => {
    setCurrentUser(user);
    setState('unlocked');
  };

  const handleLock = () => {
    setCurrentUser(null);
    setState('locked');
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-950 select-none">
      <AnimatePresence mode="wait">
        
        {/* BOOTING STATE SPLASH SCREEN */}
        {state === 'booting' && (
          <motion.div
            key="booting"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans"
            dir="rtl"
          >
            <div className="relative mb-6">
              <motion.div 
                className="absolute inset-0 bg-cyan-500/20 rounded-3xl blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-2xl">
                <Shield className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <h1 className="text-xl font-black tracking-widest text-slate-100">سامانه مدیریت دسترسی و امنیت X-Guard</h1>
            <p className="text-xs text-slate-500 mt-2 font-mono">STANDALONE HOST PROTECTION SUITE v1.4.0</p>
            
            <div className="mt-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        )}

        {/* INSTALLER STATE */}
        {state === 'installing' && (
          <motion.div
            key="installing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Installer onComplete={handleInstallComplete} />
          </motion.div>
        )}

        {/* LOCKED STATE */}
        {state === 'locked' && (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 1.05, y: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <LockScreen onUnlock={handleUnlock} />
          </motion.div>
        )}

        {/* UNLOCKED / DESKTOP STATE */}
        {state === 'unlocked' && currentUser && (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 0.96, y: 15, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, y: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <Desktop currentUser={currentUser} onLock={handleLock} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
