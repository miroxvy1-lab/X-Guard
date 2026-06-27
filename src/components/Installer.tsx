import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Server, CheckCircle2, Cpu, FileText, Lock, Key, Laptop, ArrowLeft, ArrowRight } from 'lucide-react';
import { performInstallation } from '../utils/store';
import { playUnlockSound } from '../utils/audio';

interface InstallerProps {
  onComplete: () => void;
}

export default function Installer({ onComplete }: InstallerProps) {
  const [step, setStep] = useState(1);
  const [gamenetName, setGamenetName] = useState('رایانه خانوادگی (Home PC)');
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('');
  const [adminPassConfirm, setAdminPassConfirm] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  const filesToInstall = [
    'بارگیری درایور کنترل سطح سیستم XGuard.sys...',
    'پیکربندی هوک‌های امنیتی کیبورد و ماوس...',
    'آماده‌سازی پکیج شبیه‌ساز تسک منیجر ادمین...',
    'ایجاد ساختار داده پایگاه داده محلی...',
    'ثبت کدهای تمدید زمان و اکانت‌های دمو...',
    'تکمیل و فعال‌سازی دیواره محافظتی سیستم...',
  ];

  useEffect(() => {
    if (step === 3) {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 2;
        setProgress(currentProgress);
        
        const fileIndex = Math.floor((currentProgress / 100) * filesToInstall.length);
        if (fileIndex < filesToInstall.length) {
          setCurrentFile(filesToInstall[fileIndex]);
        }

        if (currentProgress >= 100) {
          clearInterval(interval);
          playUnlockSound();
          setTimeout(() => {
            performInstallation(adminUser, adminPass, gamenetName);
            onComplete();
          }, 1000);
        }
      }, 80);

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNextStep1 = () => {
    if (!gamenetName.trim()) {
      setError('لطفاً نام یا شناسه رایانه را وارد کنید.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!adminUser.trim()) {
      setError('نام کاربری مدیر نمی‌تواند خالی باشد.');
      return;
    }
    if (adminPass.length < 8) {
      setError('رمز عبور مدیر باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (adminPass !== adminPassConfirm) {
      setError('رمز عبور و تکرار آن مطابقت ندارند.');
      return;
    }
    setError('');
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none font-sans" dir="rtl">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        id="installer-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Header bar */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-slate-200">کیت نصب و راه‌اندازی X-Guard</h1>
              <p className="text-[10px] text-slate-400">نسخه ۱.۴.۰ (مخصوص ویندوز ۱۱ / ۱۰)</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-cyan-400' : 'bg-slate-700'}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-cyan-400' : 'bg-slate-700'}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-cyan-400' : 'bg-slate-700'}`}></span>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-8 min-h-[320px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Welcome and Name Configuration */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 flex-1 flex flex-col justify-center"
              >
                <div className="text-center space-y-2 mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-lg shadow-cyan-500/5">
                    <Shield className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl font-black text-slate-100">به جادوگر نصب X-Guard خوش آمدید</h2>
                  <p className="text-xs text-slate-400">سیستم مدیریت امنیت، دسترسی و زمان استفاده از رایانه به صورت مستقل</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">نام نمایشی یا شناسه این رایانه:</label>
                  <div className="relative">
                    <input
                      id="input-gamenet-name"
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-600 transition"
                      value={gamenetName}
                      onChange={(e) => setGamenetName(e.target.value)}
                      placeholder="مثلاً: رایانه خانوادگی"
                    />
                    <Laptop className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-slate-500 block">این نام در بالای صفحه قفل رایانه به کاربران نشان داده خواهد شد.</span>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs text-center">
                    {error}
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    id="btn-step1-next"
                    onClick={handleNextStep1}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-500/15"
                  >
                    مرحله بعد
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Admin Account Setup */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5 flex-1 flex flex-col justify-center"
              >
                <div className="space-y-1 mb-2">
                  <h2 className="text-base font-bold text-slate-200">تنظیم حساب کاربری مدیر اصلی (Admin)</h2>
                  <p className="text-xs text-slate-400">این نام کاربری و رمز برای باز کردن قفل‌ها، تغییر تمدیدها و ورود به بخش مدیریت استفاده می‌شود.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 block">نام کاربری ادمین:</label>
                    <div className="relative">
                      <input
                        id="input-admin-user"
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 transition"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        placeholder="نام کاربری (مثال: admin)"
                      />
                      <Key className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 block">رمز عبور (حداقل ۸ کاراکتر):</label>
                      <div className="relative">
                        <input
                          id="input-admin-pass"
                          type="password"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 transition"
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          placeholder="••••••••"
                        />
                        <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 block">تکرار رمز عبور مدیر:</label>
                      <div className="relative">
                        <input
                          id="input-admin-pass-confirm"
                          type="password"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 transition"
                          value={adminPassConfirm}
                          onChange={(e) => setAdminPassConfirm(e.target.value)}
                          placeholder="••••••••"
                        />
                        <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs text-center">
                    {error}
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <button
                    id="btn-step2-prev"
                    onClick={() => { setError(''); setStep(1); }}
                    className="border border-slate-800 hover:bg-slate-800/50 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                    مرحله قبل
                  </button>

                  <button
                    id="btn-step2-next"
                    onClick={handleNextStep2}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-500/15"
                  >
                    شروع نصب سیستم
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Installing Progress */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 flex-1 flex flex-col justify-center"
              >
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    {/* Spinning ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10 border-t-cyan-400 animate-spin"></div>
                    <Cpu className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-100">در حال نصب درایورهای امنیتی X-Guard...</h2>
                    <p className="text-xs text-slate-400">سیستم در حال آماده‌سازی فایل‌ها و تنظیمات امنیتی است.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <motion.div 
                      className="h-full bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/20"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span className="font-mono text-cyan-400">{progress}%</span>
                    <span className="truncate max-w-[80%] font-mono">{currentFile}</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
