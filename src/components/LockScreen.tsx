import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User as UserIcon, Power, RefreshCw, HelpCircle, PlusCircle, AlertCircle, Eye, EyeOff, LifeBuoy, ArrowRight, LogIn, Sparkles, Image as ImageIcon, Palette, Globe } from 'lucide-react';
import { getUsers, getSettings, redeemPromoCode, getAdminCreds, addLog } from '../utils/store';
import { playLockSound, playUnlockSound, playDeniedAccessSound, playSystemLockoutSound } from '../utils/audio';
import { useSecurityAudio } from '../hooks/useSecurityAudio';
import { User } from '../types';

interface LockScreenProps {
  onUnlock: (user: User | 'admin') => void;
}

// Aesthetic Theme Helper for LockScreen
export const getLockThemeClasses = (theme: string) => {
  switch (theme) {
    case 'cyan':
      return {
        text: 'text-cyan-400',
        textHover: 'hover:text-cyan-300',
        bg: 'bg-cyan-500',
        bgHover: 'hover:bg-cyan-600',
        border: 'border-cyan-500/30',
        borderFocus: 'focus:border-cyan-500',
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.25)]',
        accentGlow: 'bg-cyan-600/20 blur-2xl',
        ring: 'border-cyan-500/30',
        badge: 'text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
        gradientLine: 'from-cyan-500 via-teal-500 to-cyan-500',
        neonGlow: 'neon-glow-cyan'
      };
    case 'emerald':
      return {
        text: 'text-emerald-400',
        textHover: 'hover:text-emerald-300',
        bg: 'bg-emerald-500',
        bgHover: 'hover:bg-emerald-600',
        border: 'border-emerald-500/30',
        borderFocus: 'focus:border-emerald-500',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        accentGlow: 'bg-emerald-600/20 blur-2xl',
        ring: 'border-emerald-500/30',
        badge: 'text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        gradientLine: 'from-emerald-500 via-teal-500 to-emerald-500',
        neonGlow: 'neon-glow-emerald'
      };
    case 'amber':
      return {
        text: 'text-amber-400',
        textHover: 'hover:text-amber-300',
        bg: 'bg-amber-500',
        bgHover: 'hover:bg-amber-600',
        border: 'border-amber-500/30',
        borderFocus: 'focus:border-amber-500',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        accentGlow: 'bg-amber-600/20 blur-2xl',
        ring: 'border-amber-500/30',
        badge: 'text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
        gradientLine: 'from-amber-500 via-orange-500 to-amber-500',
        neonGlow: 'neon-glow-amber'
      };
    case 'rose':
      return {
        text: 'text-rose-400',
        textHover: 'hover:text-rose-300',
        bg: 'bg-rose-500',
        bgHover: 'hover:bg-rose-600',
        border: 'border-rose-500/30',
        borderFocus: 'focus:border-rose-500',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
        accentGlow: 'bg-rose-600/20 blur-2xl',
        ring: 'border-rose-500/30',
        badge: 'text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
        gradientLine: 'from-rose-500 via-pink-500 to-rose-500',
        neonGlow: 'neon-glow-rose'
      };
    case 'indigo':
      return {
        text: 'text-indigo-400',
        textHover: 'hover:text-indigo-300',
        bg: 'bg-indigo-500',
        bgHover: 'hover:bg-indigo-600',
        border: 'border-indigo-500/30',
        borderFocus: 'focus:border-indigo-500',
        glow: 'shadow-[0_0_20px_rgba(99,102,241,0.25)]',
        accentGlow: 'bg-indigo-600/20 blur-2xl',
        ring: 'border-indigo-500/30',
        badge: 'text-indigo-300 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.3)]',
        gradientLine: 'from-indigo-500 via-blue-500 to-indigo-500',
        neonGlow: 'neon-glow-indigo'
      };
    case 'purple':
    default:
      return {
        text: 'text-purple-400',
        textHover: 'hover:text-purple-300',
        bg: 'bg-purple-500',
        bgHover: 'hover:bg-purple-600',
        border: 'border-purple-500/30',
        borderFocus: 'focus:border-purple-500',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
        accentGlow: 'bg-purple-600/20 blur-2xl',
        ring: 'border-purple-500/30',
        badge: 'text-purple-300 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
        gradientLine: 'from-purple-500 via-indigo-500 to-purple-500',
        neonGlow: 'neon-glow-purple'
      };
  }
};

// A highly polished cyber logo with gorgeous rotational animations
const CyberLogo = ({ size = 'medium', theme = 'purple' }: { size?: 'small' | 'medium' | 'large', theme?: string }) => {
  const dimensions = size === 'small' ? 'w-16 h-16 mb-2' : size === 'medium' ? 'w-26 h-26 mb-3' : 'w-36 h-36 mb-5';
  const iconSize = size === 'small' ? 'w-8 h-8' : size === 'medium' ? 'w-12 h-12' : 'w-18 h-18';
  const t = getLockThemeClasses(theme);
  
  return (
    <div className={`relative ${dimensions} flex items-center justify-center select-none mx-auto`}>
      {/* Soft ambient background radial glow */}
      <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${t.accentGlow}`} />
      
      {/* Outer Spinning Ring with tech dashes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        className={`absolute inset-0 rounded-full border border-dashed p-1 ${t.ring}`}
      />

      {/* Orbiting Ring with node anchor */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
        className="absolute inset-2 rounded-full border border-indigo-500/20"
      >
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      </motion.div>
      
      {/* Inner Glowing Shield Container (No scale heartbeat animation as requested) */}
      <div className={`absolute inset-3.5 rounded-full border flex items-center justify-center bg-slate-950/90 ${t.border} ${t.glow}`}>
        <div className="w-full h-full rounded-full border border-indigo-500/20 bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
          {/* Shimmer light effect sweeping through */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/5 to-transparent -translate-x-full animate-[shimmer_5s_infinite]" />

          {/* SVG Tech X Mark */}
          <svg className={`${iconSize} drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cyberXGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#d8b4fe" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="circleGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" stroke="url(#circleGrad)" strokeWidth="2" strokeDasharray="4 3" />
            <circle cx="50" cy="50" r="32" stroke="#a855f7" strokeWidth="1" className="opacity-30" />
            
            {/* Styled Tech X */}
            <path d="M28 28 L40 28 L50 43 L60 28 L72 28 L57 50 L72 72 L60 72 L50 57 L40 72 L28 72 L43 50 Z" fill="url(#cyberXGrad)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const getTranslation = (key: string, lang: 'fa' | 'en') => {
  const dict: Record<string, { fa: string, en: string }> = {
    cyber_security_sys: {
      fa: 'سیستم امنیتی مستقل گیمنت',
      en: 'Independent GameNet Defense Rig'
    },
    auto_lock: {
      fa: 'قفل خودکار',
      en: 'Auto Lock'
    },
    anti_bypass: {
      fa: 'ضد دورزدن',
      en: 'Anti-Cheat'
    },
    time_mgmt: {
      fa: 'مدیریت زمان',
      en: 'Time Grind'
    },
    no_server: {
      fa: 'بدون سرور',
      en: 'No Server'
    },
    enter_system: {
      fa: 'ورود به سیستم',
      en: 'Start Grinding'
    },
    power_off: {
      fa: 'خاموش',
      en: 'Power Off'
    },
    restart: {
      fa: 'ری‌استارت',
      en: 'Reboot'
    },
    back: {
      fa: 'بازگشت',
      en: 'Go Back'
    },
    login_title: {
      fa: 'ورود به X-Guard',
      en: 'Log in to X-Guard'
    },
    login_desc: {
      fa: 'اعتبارسنجی هویت برای باز کردن قفل سیستم',
      en: 'Verify your ID to unlock the machine'
    },
    autofill_hint: {
      fa: 'ورود سریع جهت تست سیستم (بر روی اکانت مورد نظر کلیک کنید):',
      en: 'Quick log in for testing (click to auto-fill):'
    },
    username_label: {
      fa: 'نام کاربری',
      en: 'Gamer Handle / Username'
    },
    username_placeholder: {
      fa: 'نام کاربری یا admin',
      en: 'Enter your handle or "admin"'
    },
    password_label: {
      fa: 'رمز عبور',
      en: 'Secret Password'
    },
    submit_login: {
      fa: 'ورود و باز کردن قفل',
      en: 'Let me in!'
    },
    forgot_password: {
      fa: 'فراموشی رمز',
      en: 'Forgot Pass?'
    },
    redeem_promo: {
      fa: 'تمدید با کد',
      en: 'Apply Cheat Code'
    },
    access_guide_title: {
      fa: 'راهنمای شروع دسترسی:',
      en: 'How to use this PC:'
    },
    guide_1: {
      fa: '• حساب کاربری خود را با نام کاربری و رمز عبور وارد کنید.',
      en: '• Punch in your username & password to start playing.'
    },
    guide_2: {
      fa: '• با اتمام زمان تعیین‌شده، دسترسی به دسکتاپ به صورت خودکار مسدود می‌شود.',
      en: '• Once your playtime hits zero, you get locked out instantly.'
    },
    guide_3: {
      fa: '• می‌توانید با کدهای تمدید معتبر، زمان استفاده از رایانه را افزایش دهید.',
      en: '• Redeem promo codes to load more juice onto your PC.'
    },
    seat_help_title: {
      fa: 'راهنما و اطلاعات صندلی',
      en: 'Seat Help & PC Station Info'
    },
    username: {
      fa: 'نام کاربری',
      en: 'Username'
    },
    admin_autofill_btn: {
      fa: 'مدیر',
      en: 'Admin'
    },
    user_autofill_btn: {
      fa: 'کاربر',
      en: 'User'
    },
    help_and_seat: {
      fa: 'راهنما و اطلاعات صندلی',
      en: 'Seat Info & Help'
    }
  };
  const entry = dict[key];
  if (!entry) return key;
  return lang === 'en' ? entry.en : entry.fa;
};

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { triggerSecuritySound } = useSecurityAudio();
  const [lang, setLang] = useState<'fa' | 'en'>(() => {
    try {
      return (localStorage.getItem('xguard_lang') as 'fa' | 'en') || 'fa';
    } catch (e) {
      return 'fa';
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [time, setTime] = useState(new Date());

  // Navigation steps: 'welcome' | 'form'
  const [loginStep, setLoginStep] = useState<'welcome' | 'form'>('welcome');

  // Popup modal state: 'forgot' | 'promo' | 'help' | 'shutdown' | 'restart' | 'ai-wallpaper' | null
  const [activeModal, setActiveModal] = useState<'forgot' | 'promo' | 'help' | 'shutdown' | 'restart' | 'ai-wallpaper' | null>(null);
  
  // LockScreen Wallpaper and Theme state
  const [lockWallpaper, setLockWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem('xguard_lockscreen_wallpaper') || 'grid';
    } catch (e) {
      return 'grid';
    }
  });

  const [lockTheme, setLockTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('xguard_lockscreen_theme') || 'purple';
    } catch (e) {
      return 'purple';
    }
  });

  // AI wallpaper generator state
  const [aiPrompt, setAiPrompt] = useState('یک پس‌زمینه ماتریکس پیشرفته با امواج شبکه دیجیتال');
  const [aiStyle, setAiStyle] = useState('neon-cyber');
  const [aiRatio, setAiRatio] = useState('16:9');
  const [aiAccent, setAiAccent] = useState('purple');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');

  const t = getLockThemeClasses(lockTheme);

  // Dialog variables
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotHintResult, setForgotHintResult] = useState<{
    success: boolean;
    hint?: string;
    phrase?: string;
    message?: string;
  } | null>(null);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoTargetUser, setPromoTargetUser] = useState('');
  const [promoResult, setPromoResult] = useState<{ success: boolean; message: string } | null>(null);

  const [helpSeatNo, setHelpSeatNo] = useState('سیستم شخصی');
  const [helpMessageText, setHelpMessageText] = useState('نیاز به افزایش زمان دسترسی یا راهنمایی دارم.');
  const [helpResult, setHelpResult] = useState<{ success: boolean; message: string } | null>(null);

  // Advanced Simulated OS Power state: 'normal' | 'shutting_down' | 'off' | 'restarting' | 'bios'
  const [powerState, setPowerState] = useState<'normal' | 'shutting_down' | 'off' | 'restarting' | 'bios'>('normal');

  const settings = getSettings();

  // Clock updating
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // System sound beep on boot
  useEffect(() => {
    playLockSound();
  }, []);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lockoutTimer > 0) {
      setError(`سیستم موقتاً قفل است. ${lockoutTimer} ثانیه منتظر بمانید.`);
      return;
    }

    try {
      const userVal = typeof username === 'string' ? username : '';
      const passVal = typeof password === 'string' ? password : '';

      if (!userVal.trim() || !passVal) {
        setError('نام کاربری و رمز عبور را وارد کنید.');
        return;
      }

      const trimmedUser = userVal.trim();

      // Check failed attempts helper
      const handleFailedAttempt = (targetUser?: User | null) => {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        
        // Play denied sound if permitted
        if (!targetUser || targetUser.soundDeniedAccess !== false) {
          triggerSecuritySound('invalid_password');
        }

        if (nextFailed >= 3) {
          // Play lockout sound if permitted
          if (!targetUser || targetUser.soundLockout !== false) {
            triggerSecuritySound('forced_lockout');
          }
          setLockoutTimer(30);
          setFailedAttempts(0);
          setError('رایانه به دلیل تلاش‌های مکرر ناموفق برای ۳۰ ثانیه قفل شد.');
          addLog('security', `فعال شدن قفل امنیتی ۳۰ ثانیه‌ای کلاینت به دلیل تلاش‌های ناموفق متوالی. حساب هدف: [${trimmedUser}]`, targetUser ? `کاربر ${targetUser.username}` : 'سیستم');
        }
      };

      // 1. Admin login verification
      const adminCreds = getAdminCreds();
      const adminUserStr = typeof adminCreds?.username === 'string' ? adminCreds.username : 'admin';
      const adminHashStr = typeof adminCreds?.passwordHash === 'string' ? adminCreds.passwordHash : 'admin1234';

      if (trimmedUser.toLowerCase() === adminUserStr.toLowerCase()) {
        if (passVal === adminHashStr) {
          triggerSecuritySound('success_auth');
          addLog('success', 'ورود ادمین با استفاده از پسورد اصلی در صفحه کلاینت', 'مدیریت');
          onUnlock('admin');
          return;
        } else {
          setError('رمز عبور مدیر سیستم اشتباه است.');
          addLog('security', 'تلاش ناموفق برای ورود مدیر با رمز عبور اشتباه', 'مدیریت');
          handleFailedAttempt(null);
          return;
        }
      }

      // 2. Normal User login verification
      const users = getUsers() || [];
      const user = users.find(u => typeof u?.username === 'string' && u.username.toLowerCase() === trimmedUser.toLowerCase());

      if (!user) {
        setError('کاربر یافت نشد.');
        addLog('security', `تلاش ناموفق برای ورود با کاربری نامعتبر: [${trimmedUser}]`, 'ورود کلاینت');
        handleFailedAttempt(null);
        return;
      }

      if (user.passwordHash !== passVal) {
        setError('رمز عبور وارد شده اشتباه است.');
        addLog('security', `تلاش ناموفق برای ورود کاربر [${user.username}] - رمز اشتباه`, `کاربر ${user.username}`);
        handleFailedAttempt(user);
        return;
      }

      if (user.remainingMinutes <= 0) {
        setError('زمان مجاز دسترسی حساب شما به اتمام رسیده است. جهت تمدید اقدام کنید.');
        addLog('warning', `کاربر [${user.username}] فاقد شارژ زمانی کافی برای ورود است.`, `کاربر ${user.username}`);
        if (user.soundDeniedAccess !== false) {
          triggerSecuritySound('invalid_password');
        }
        return;
      }

      // Auth succeeded
      setFailedAttempts(0);
      if (user.soundSuccessfulLogin !== false) {
        triggerSecuritySound('success_auth');
      }
      addLog('success', `ورود موفقیت‌آمیز کاربر [${user.username}] به رایانه با ${Math.floor(user.remainingMinutes)} دقیقه شارژ.`, `کاربر ${user.username}`);
      onUnlock(user);
    } catch (err) {
      console.error('Login processing error:', err);
      setError('خطایی در پردازش ورود رخ داد. لطفا دوباره تلاش کنید.');
    }
  };

  const handleForgotLookup = () => {
    setForgotHintResult(null);
    if (!forgotUsername.trim()) {
      setForgotHintResult({ success: false, message: 'لطفاً نام کاربری خود را وارد کنید.' });
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === forgotUsername.toLowerCase().trim());

    if (!user) {
      setForgotHintResult({ success: false, message: 'کاربر در پایگاه داده سیستم یافت نشد.' });
      return;
    }

    if (!user.allowHintOnLogin) {
      setForgotHintResult({
        success: false,
        message: 'نمایش راهنمای رمز عبور برای این حساب مجاز نیست. لطفاً به مدیریت مراجعه نمایید.'
      });
      return;
    }

    // Mask format: first & last character visible
    const pass = user.passwordHash;
    const masked = pass.length > 2 
      ? pass[0] + '*'.repeat(pass.length - 2) + pass[pass.length - 1] 
      : pass[0] + '*';

    setForgotHintResult({
      success: true,
      hint: masked,
      phrase: user.passwordHintPhrase || 'عبارت راهنما ثبت نشده است.'
    });
    addLog('info', `کاربر [${user.username}] مشخصات بازیابی و راهنما را درخواست کرد.`, `کاربر ${user.username}`);
  };

  const handlePromoRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoResult(null);

    if (!promoCodeInput.trim() || !promoTargetUser.trim()) {
      setPromoResult({ success: false, message: 'پر کردن هر دو فیلد الزامی است.' });
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === promoTargetUser.toLowerCase().trim());

    if (!user) {
      setPromoResult({ success: false, message: 'کاربر مورد نظر یافت نشد.' });
      return;
    }

    const res = redeemPromoCode(promoCodeInput, user.id);
    setPromoResult({
      success: res.success,
      message: res.message
    });

    if (res.success) {
      setPromoCodeInput('');
    }
  };

  const handleSendHelpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpSeatNo.trim() || !helpMessageText.trim()) {
      setHelpResult({ success: false, message: 'لطفاً مشخصات را کامل کنید.' });
      return;
    }

    // Add help notification to system logs
    addLog('warning', `درخواست کمک فوری [${helpSeatNo}]: "${helpMessageText}"`, 'راهنمایی کاربر');
    setHelpResult({
      success: true,
      message: 'درخواست شما با موفقیت برای مدیریت ارسال شد.'
    });
    setHelpMessageText('');
  };

  const handleGenerateAIWallpaper = async () => {
    if (!aiPrompt.trim()) {
      setGenError('لطفاً توصیف تصویر را وارد کنید.');
      return;
    }

    setIsGenerating(true);
    setGenError('');
    setGenSuccess('');

    try {
      const response = await fetch('/api/generate-lockscreen-wallpaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          style: aiStyle,
          ratio: aiRatio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ارتباط با سرور.');
      }

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedUrl(data.imageUrl);
        setGenSuccess('تصویر پس‌زمینه با موفقیت طراحی شد!');
      } else {
        throw new Error('تصویری بازگردانده نشد.');
      }
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'خطایی در تولید تصویر رخ داد. مطمئن شوید کلید GEMINI_API_KEY تعریف شده است.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWallpaperAndTheme = (wallpaperValue: string, themeValue: string) => {
    try {
      localStorage.setItem('xguard_lockscreen_wallpaper', wallpaperValue);
      localStorage.setItem('xguard_lockscreen_theme', themeValue);
      setLockWallpaper(wallpaperValue);
      setLockTheme(themeValue);
      addLog('info', `پس‌زمینه به "${wallpaperValue.startsWith('data:image') || wallpaperValue.startsWith('http') ? 'تصویر اختصاصی هوش مصنوعی' : wallpaperValue}" و پوسته به "${themeValue}" تغییر یافت.`, 'شخصی‌سازی');
      setActiveModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Full Simulated PC OS Shutdown
  const executeShutdown = () => {
    setActiveModal(null);
    setPowerState('shutting_down');
    addLog('info', 'سیستم شبیه‌ساز خاموش‌شدن کلی رایانه را آغاز کرد.', 'رایانه');
    setTimeout(() => {
      setPowerState('off');
    }, 2000);
  };

  // Full Simulated PC OS Restart & BIOS checks
  const executeRestart = () => {
    setActiveModal(null);
    setPowerState('restarting');
    addLog('info', 'سیستم شبیه‌ساز راه‌اندازی مجدد سخت‌افزاری را آغاز کرد.', 'رایانه');
    setTimeout(() => {
      setPowerState('bios');
      setTimeout(() => {
        setPowerState('normal');
        playLockSound();
      }, 3000);
    }, 1800);
  };

  // Welcome page Persian dates
  const formattedTimeWelcome = time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const welcomeWeekday = time.toLocaleDateString('fa-IR', { weekday: 'long' });
  const welcomeDay = time.toLocaleDateString('fa-IR', { day: 'numeric' });
  const welcomeMonth = time.toLocaleDateString('fa-IR', { month: 'long' });
  const welcomeDateString = `${welcomeWeekday} ${welcomeDay} ${welcomeMonth}`;

  // Form step standard date & clock
  const formattedTimeForm = time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDateForm = time.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // SHUTDOWN & BIOS STATE UI
  if (powerState === 'shutting_down') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-100 z-50 font-sans" dir="rtl">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500/10 border-t-purple-500 rounded-full mb-5"
        />
        <h2 className="text-xl font-black text-purple-400">در حال خاموش کردن رایانه...</h2>
        <p className="text-[11px] text-slate-500 mt-2 font-bold">اتصالات امنیتی بسته می‌شوند.</p>
      </div>
    );
  }

  if (powerState === 'off') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-slate-500 z-50 font-sans" dir="rtl">
        <p className="text-[10px] uppercase tracking-widest text-purple-950 mb-6 font-black">رایانه خاموش است • محافظت کلاینت غیرفعال شد</p>
        <button
          id="btn-boot-pc"
          onClick={() => {
            setPowerState('bios');
            setTimeout(() => {
              setPowerState('normal');
              playLockSound();
            }, 3000);
          }}
          className="w-16 h-16 rounded-full bg-slate-950 border border-purple-950 hover:border-purple-500 flex items-center justify-center text-slate-500 hover:text-purple-400 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]"
        >
          <Power className="w-6 h-6" />
        </button>
        <span className="text-[11px] text-slate-600 mt-4 font-bold">جهت روشن کردن مجدد کلیک کنید.</span>
      </div>
    );
  }

  if (powerState === 'restarting') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-100 z-50 font-sans" dir="rtl">
        <RefreshCw className="w-10 h-10 text-purple-400 animate-spin mb-5" />
        <h2 className="text-xl font-black text-purple-400">رایانه در حال راه‌اندازی مجدد سخت‌افزاری است...</h2>
      </div>
    );
  }

  if (powerState === 'bios') {
    return (
      <div className="fixed inset-0 bg-black text-purple-400 font-mono p-10 text-left z-50 overflow-hidden leading-relaxed text-xs">
        <p>X-GUARD SECURITY SYSTEMS BIOS v1.4.0</p>
        <p>COPYRIGHT (C) 2026 GALAXY SOFT INC.</p>
        <p>--------------------------------------------------</p>
        <p>CPU: AMD Ryzen 7 7800X3D @ 4.20 GHz</p>
        <p>MEMORY: 32768MB RAM - DUAL CHANNEL OK</p>
        <p>STORAGE: NVMe Gen4 SSD 2TB - OK</p>
        <p className="mt-4">Checking security drivers...</p>
        <p className="text-purple-400">Loading X-Guard Kernel Hooks....................... [SUCCESS]</p>
        <p className="text-purple-400">Verifying Anti-Task-Manager Filter Driver.......... [SUCCESS]</p>
        <p className="text-purple-400">Locking Input Buffer Devices (Keyboard/Mouse)...... [LOCKED]</p>
        <p className="text-purple-300 mt-4">Starting User Access Control Shell...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 select-none flex flex-col justify-between overflow-hidden font-sans" dir="rtl">
      {/* Dynamic Background Image if custom AI wallpaper is set */}
      {lockWallpaper && (lockWallpaper.startsWith('data:image') || lockWallpaper.startsWith('http')) ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src={lockWallpaper} 
            alt="AI Wall" 
            className="w-full h-full object-cover opacity-60" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
        </div>
      ) : lockWallpaper === 'cosmic' ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/30 via-slate-950 to-slate-950 pointer-events-none z-0" />
      ) : lockWallpaper === 'neon' ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/30 via-slate-950 to-slate-950 pointer-events-none z-0" />
      ) : lockWallpaper === 'minimal' ? (
        <div className="absolute inset-0 bg-slate-950 pointer-events-none z-0" />
      ) : (
        /* grid default */
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none z-0" />
        </>
      )}

      <AnimatePresence mode="wait">
        
        {/* STEP 1: WELCOME SCREEN (IDENTICAL TO IMAGE 1) */}
        {loginStep === 'welcome' && (
          <motion.div
            key="welcome-step"
            initial={{ opacity: 0, scale: 0.97, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col justify-between h-full p-10 relative z-10"
          >
            {/* Top Row: Date/Clock on the Left, AdminSystem Badge on the Right */}
            <div className={`flex justify-between items-start w-full ${lang === 'fa' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className="flex items-center gap-2.5">
                {/* Badge: AdminSystem with green dot inside on its right side */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 border text-[11px] font-extrabold backdrop-blur-md ${t.border} ${t.text}`}>
                  <span>AdminSystem</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                </div>

                {/* Language Switcher */}
                <button
                  type="button"
                  id="btn-toggle-lang"
                  onClick={() => {
                    const newLang = lang === 'fa' ? 'en' : 'fa';
                    setLang(newLang);
                    localStorage.setItem('xguard_lang', newLang);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 font-bold backdrop-blur-md cursor-pointer hover:bg-slate-850 transition"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'fa' ? 'English (Slang)' : 'فارسی'}</span>
                </button>
              </div>

              {/* Clock: Large white text, text-left/right aligned */}
              <div className={lang === 'fa' ? 'text-left flex flex-col' : 'text-right flex flex-col'}>
                <span className="text-5xl font-black tracking-tight text-white font-rounded-num tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]">
                  {formattedTimeWelcome}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 font-bold">
                  {welcomeDateString}
                </span>
              </div>
            </div>

            {/* Middle Logo & Welcome title */}
            <div className="flex flex-col items-center justify-center text-center">
              {/* Refined cyber logo with gorgeous orbital rotations and custom glowing effects */}
              <CyberLogo size="large" theme={lockTheme} />

              <h1 className="text-5xl font-black tracking-wider flex items-center justify-center gap-2 select-text">
                <span className="text-white">X</span>
                <span className={`bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent ${t.neonGlow} font-black`}>-Guard</span>
              </h1>

              <p className="text-[13px] font-bold text-slate-400 mt-3 select-text">{getTranslation('cyber_security_sys', lang)}</p>

              {/* Horizontal Pill Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {[
                  getTranslation('auto_lock', lang),
                  getTranslation('anti_bypass', lang),
                  getTranslation('time_mgmt', lang),
                  getTranslation('no_server', lang)
                ].map((badge, idx) => (
                  <span 
                    key={idx} 
                    className={`px-4 py-1.5 rounded-full text-[11px] bg-slate-900/70 border text-slate-300 font-bold ${t.border}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Launch Action Button with left arrow */}
              <motion.button
                id="btn-goto-login-form"
                onClick={() => setLoginStep('form')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`group mt-10 px-12 py-3.5 rounded-2xl ${t.bg} ${t.bgHover} text-white font-extrabold text-[13px] ${t.glow} flex items-center gap-2 transition-all duration-300 cursor-pointer`}
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{getTranslation('enter_system', lang)}</span>
              </motion.button>
            </div>

            {/* Bottom Version Details and OS shutdown/reboots */}
            <div className="flex justify-between items-center w-full">
              {/* Buttons: Plain text with simple icons, placed on the bottom right of the screen */}
              <div className="flex items-center gap-5">
                <button 
                  id="welcome-btn-shutdown"
                  onClick={() => setActiveModal('shutdown')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer font-bold"
                >
                  <Power className="w-3.5 h-3.5 text-rose-500" />
                  <span>{getTranslation('power_off', lang)}</span>
                </button>
                <button 
                  id="welcome-btn-restart"
                  onClick={() => setActiveModal('restart')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{getTranslation('restart', lang)}</span>
                </button>
              </div>

              {/* Version (Pushed to Left side in RTL) */}
              <div className="text-slate-500 font-mono text-[11px] font-black">
                X-Guard v1.0.0
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: LOGIN FORM (WITH OPTIMIZED SPLIT VIEW & EXACT STYLING OF IMAGE 2) */}
        {loginStep === 'form' && (
          <motion.div
            key="form-step"
            initial={{ opacity: 0, scale: 1.03, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.97, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`flex-1 flex flex-col justify-between h-full p-10 relative z-10 ${lang === 'fa' ? 'text-right' : 'text-left'}`}
          >
            {/* Top row: AdminSystem badge on Left, back button on Right (respecting language) */}
            <div className={`flex justify-between items-center w-full ${lang === 'fa' ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Back button */}
              <button
                id="btn-back-to-welcome-link"
                onClick={() => setLoginStep('welcome')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 border border-slate-800 text-[11px] text-slate-300 font-bold backdrop-blur-md cursor-pointer hover:bg-slate-850 transition"
              >
                {lang === 'fa' ? (
                  <>
                    <span>{getTranslation('back', lang)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                    <span>{getTranslation('back', lang)}</span>
                  </>
                )}
              </button>

              {/* AdminSystem badge with shield icon */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 border text-[11px] font-bold backdrop-blur-md ${t.border} ${t.text}`}>
                <span>AdminSystem</span>
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Middle Container split: Large Date/Clock & Guide and Login Box */}
            <div className={`w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 flex-1 py-4 ${lang === 'fa' ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
              
              {/* Clock & Starting Access Guide */}
              <motion.div 
                initial={{ opacity: 0, x: lang === 'fa' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className={`space-y-4 flex-1 lg:max-w-md hidden md:block ${lang === 'fa' ? 'text-right' : 'text-left'}`}
              >
                <span className="bg-slate-900 border border-slate-800 text-purple-300 px-4 py-1.5 rounded-full text-[11px] font-black shadow-[0_0_12px_rgba(168,85,247,0.1)]">
                  {settings.gamenetName}
                </span>
                
                <h2 className="text-5xl font-black text-slate-100 font-rounded-num tracking-tight tabular-nums select-all pt-2 leading-none">
                  {formattedTimeForm}
                </h2>
                <p className="text-[12px] text-slate-400 font-bold">{formattedDateForm}</p>
                
                <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-400 space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-900/50 leading-relaxed font-bold">
                  <p className="text-slate-300 text-[11px] mb-1 font-black">{getTranslation('access_guide_title', lang)}</p>
                  <p>{getTranslation('guide_1', lang)}</p>
                  <p>{getTranslation('guide_2', lang)}</p>
                  <p>{getTranslation('guide_3', lang)}</p>
                </div>
              </motion.div>

              {/* Pristine Login Glassmorphic Panel */}
              <motion.div 
                id="login-panel"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[420px] bg-slate-950/45 border border-slate-800/80 p-8 rounded-[2rem] shadow-2xl relative backdrop-blur-xl"
              >
                {/* Cyber animated logo inside the card with rotation glow effects */}
                <div className="text-center mt-2 mb-6">
                  <CyberLogo size="small" theme={lockTheme} />
                  <h3 className="text-lg font-black text-slate-100 mt-2">{getTranslation('login_title', lang)}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-bold">{getTranslation('login_desc', lang)}</p>
                </div>


                {/* Quick Auto-fill Tester Section */}
                <div className={`mb-5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                  <span className="text-[10px] text-slate-400 block mb-2 font-bold">{getTranslation('autofill_hint', lang)}</span>
                  <div className={`flex flex-wrap gap-1.5 ${lang === 'fa' ? 'justify-start' : 'justify-start'}`}>
                    <button
                      type="button"
                      id="btn-autofill-admin"
                      onClick={() => {
                        const creds = getAdminCreds();
                        setUsername(creds?.username || 'admin');
                        setPassword(creds?.passwordHash || 'admin1234');
                      }}
                      className="bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/25 text-purple-300 px-3 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all hover:scale-105"
                    >
                      {getTranslation('admin_autofill_btn', lang)} ({getAdminCreds()?.username || 'admin'})
                    </button>
                    {getUsers().slice(0, 2).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        id={`btn-autofill-user-${u.username}`}
                        onClick={() => {
                           setUsername(u.username);
                           setPassword(u.passwordHash);
                        }}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all hover:scale-105"
                      >
                        {getTranslation('user_autofill_btn', lang)} {u.username}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label className={`text-xs text-slate-300 block font-bold ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{getTranslation('username_label', lang)}</label>
                    <div className="relative">
                      <input
                        id="login-username"
                        type="text"
                        className={`w-full bg-slate-900/50 border border-slate-800/80 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500 text-slate-100 transition-all font-bold placeholder:text-slate-600 ${lang === 'fa' ? 'text-right' : 'text-left'}`}
                        placeholder={getTranslation('username_placeholder', lang)}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className={`text-xs text-slate-300 block font-bold ${lang === 'fa' ? 'text-right' : 'text-left'}`}>{getTranslation('password_label', lang)}</label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type="password"
                        className={`w-full bg-slate-900/50 border border-slate-800/80 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500 text-slate-100 transition-all font-bold placeholder:text-slate-600 ${lang === 'fa' ? 'text-right' : 'text-left'}`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-[10px] text-center flex items-center gap-2 justify-center font-extrabold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    id="btn-submit-login"
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  >
                    <LogIn className="w-4 h-4 text-white" />
                    <span>{getTranslation('submit_login', lang)}</span>
                  </button>
                </form>

                {/* Bottom Actions Row */}
                <div className={`mt-6 pt-5 border-t border-slate-900/60 flex items-center justify-between text-xs font-bold text-slate-400 px-1 ${lang === 'fa' ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Forgot password */}
                  <button
                    type="button"
                    id="btn-forgot-password-modal"
                    onClick={() => { setActiveModal('forgot'); setForgotHintResult(null); }}
                    className="flex items-center gap-1.5 hover:text-slate-200 transition cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>{getTranslation('forgot_password', lang)}</span>
                  </button>

                  {/* Promo code */}
                  <button
                    type="button"
                    id="btn-promo-code-modal"
                    onClick={() => { setActiveModal('promo'); setPromoResult(null); }}
                    className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>{getTranslation('redeem_promo', lang)}</span>
                  </button>

                  {/* Shutdown */}
                  <button
                    type="button"
                    id="btn-lockscreen-shutdown"
                    onClick={() => setActiveModal('shutdown')}
                    className="flex items-center gap-1.5 hover:text-slate-200 transition cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 text-rose-500" />
                    <span>{getTranslation('power_off', lang)}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* POPUP GLASSMORPHIC MODAL DIALOGS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <motion.div
              id="lock-screen-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-[360px] bg-slate-950/95 border border-slate-800/80 p-6 rounded-2xl shadow-2xl relative"
            >
              {/* Forgot Password Dialog */}
              {activeModal === 'forgot' && (
                <div className="space-y-4 pt-2 text-right">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60">
                    <span className="text-sm">❓</span>
                    <h3 className="font-extrabold text-[13px] text-slate-100">فراموشی رمز عبور</h3>
                  </div>
                  
                  <div className="space-y-3 pt-1">
                    <input
                      id="forgot-username-input"
                      type="text"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-purple-500 text-slate-100 font-bold placeholder:text-slate-600 text-right"
                      placeholder="نام کاربری..."
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                    />
                    
                    {forgotHintResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl text-[11px] space-y-1.5 border text-right leading-relaxed ${
                          forgotHintResult.success 
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-300 font-bold' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400 font-bold'
                        }`}
                      >
                        {forgotHintResult.success ? (
                          <>
                            <p className="font-extrabold text-slate-200">✓ مشخصات بازیابی:</p>
                            <p className="text-[10px] text-slate-400 font-mono text-left" dir="ltr">
                              Mask: {forgotHintResult.hint}
                            </p>
                            <p className="text-[11px]">
                              <span className="font-extrabold block text-slate-300">عبارت راهنما:</span>
                              "{forgotHintResult.phrase}"
                            </p>
                          </>
                        ) : (
                          <p>{forgotHintResult.message}</p>
                        )}
                      </motion.div>
                    )}

                    <button
                      id="btn-forgot-lookup"
                      onClick={handleForgotLookup}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                    >
                      دریافت راهنما
                    </button>
                    
                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              )}

              {/* Promo Code Dialog */}
              {activeModal === 'promo' && (
                <div className="space-y-4 pt-2 text-right">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60">
                    <span className="text-sm">➕</span>
                    <h3 className="font-extrabold text-[13px] text-slate-100">تمدید زمان با کد</h3>
                  </div>

                  <form onSubmit={handlePromoRedeem} className="space-y-3 pt-1">
                    <input
                      id="promo-target-user-input"
                      type="text"
                      required
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-purple-500 text-slate-100 font-bold placeholder:text-slate-600 text-right"
                      placeholder="نام کاربری..."
                      value={promoTargetUser}
                      onChange={(e) => setPromoTargetUser(e.target.value)}
                    />

                    <input
                      id="promo-code-input-field"
                      type="text"
                      required
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-purple-500 text-slate-100 font-mono font-bold placeholder:text-slate-600 text-right"
                      placeholder="XG-CODE"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                    />

                    {promoResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl text-[11px] text-right border ${
                          promoResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold'
                            : 'bg-red-500/10 border-red-500/25 text-red-400 font-bold'
                        }`}
                      >
                        {promoResult.message}
                      </motion.div>
                    )}

                    <button
                      id="btn-submit-promo-code"
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-md"
                    >
                      اعمال کد
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      بستن
                    </button>
                  </form>
                </div>
              )}

              {/* Request Help Dialog */}
              {activeModal === 'help' && (
                <div className="space-y-4 pt-2 text-right">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60">
                    <span className="text-sm animate-pulse">💬</span>
                    <h3 className="font-extrabold text-[13px] text-slate-100">ارسال پیام به مدیر سیستم</h3>
                  </div>

                  <form onSubmit={handleSendHelpRequest} className="space-y-3 pt-1">
                    <input
                      id="help-seat-no-input"
                      type="text"
                      required
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 font-bold placeholder:text-slate-600 text-right"
                      placeholder="شناسه سیستم..."
                      value={helpSeatNo}
                      onChange={(e) => setHelpSeatNo(e.target.value)}
                    />

                    <textarea
                      id="help-message-textarea"
                      required
                      rows={2}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 font-bold resize-none placeholder:text-slate-600 text-right"
                      placeholder="پیغام شما..."
                      value={helpMessageText}
                      onChange={(e) => setHelpMessageText(e.target.value)}
                    />

                    {helpResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl text-[11px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-right"
                      >
                        {helpResult.message}
                      </motion.div>
                    )}

                    <button
                      id="btn-submit-help-request"
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-md"
                    >
                      ارسال پیام
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      بستن
                    </button>
                  </form>
                </div>
              )}

              {/* Confirm Shutdown Dialog */}
              {activeModal === 'shutdown' && (
                <div className="space-y-4 pt-2 text-right">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60 text-red-400">
                    <span className="text-sm">🛑</span>
                    <h3 className="font-extrabold text-[13px]">خاموش کردن سیستم</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-bold">
                    آیا مطمئن هستید؟ تمام نشست‌های فعال بسته خواهند شد.
                  </p>

                  <div className="flex gap-2.5 pt-1.5">
                    <button
                      id="btn-confirm-shutdown-ok"
                      onClick={executeShutdown}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                    >
                      خاموش شود
                    </button>
                    <button
                      id="btn-confirm-shutdown-cancel"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      لغو
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Restart Dialog */}
              {activeModal === 'restart' && (
                <div className="space-y-4 pt-2 text-right">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60 text-indigo-400">
                    <span className="text-sm animate-pulse">🔄</span>
                    <h3 className="font-extrabold text-[13px]">ری‌استارت سیستم</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-bold">
                    سیستم مجدداً راه‌اندازی خواهد شد.
                  </p>

                  <div className="flex gap-2.5 pt-1.5">
                    <button
                      id="btn-confirm-restart-ok"
                      onClick={executeRestart}
                      className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                    >
                      ری‌استارت
                    </button>
                    <button
                      id="btn-confirm-restart-cancel"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      لغو
                    </button>
                  </div>
                </div>
              )}

              {/* AI Wallpaper and Theme Customizer Modal */}
              {false && (
                <div className="space-y-5 pt-1 text-right max-h-[75vh] overflow-y-auto pr-1">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800/60 text-cyan-400">
                    <span className="text-base">🎨</span>
                    <h3 className="font-extrabold text-[15px] text-slate-100">شخصی‌سازی تم و تصویر زمینه سیستم</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-slate-400">۱. پوسته‌های پیشنهادی و هماهنگ‌شده X-Guard</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      یکی از تم‌های حرفه‌ای طراحی‌شده زیر را انتخاب کنید تا پس‌زمینه و رنگ نئونی سیستم به صورت هماهنگ همزمان تنظیم شوند:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        {
                          id: 'cyberpunk',
                          name: 'پوسته سایبرپانک نئون',
                          desc: 'پوسته نئونی درخشان سایبرپانکی با رنگ فیروزه‌ای.',
                          wallpaper: 'neon',
                          theme: 'cyan',
                          previewBg: 'bg-gradient-to-br from-cyan-950/50 to-slate-950 border-cyan-500/20'
                        },
                        {
                          id: 'aurora',
                          name: 'پوسته شفق قطبی',
                          desc: 'ترکیب جادویی رنگ‌های سبز زمردی و ارغوانی آسمان قطب.',
                          wallpaper: 'cosmic',
                          theme: 'emerald',
                          previewBg: 'bg-gradient-to-br from-emerald-950/50 to-slate-950 border-emerald-500/20'
                        },
                        {
                          id: 'deep-space',
                          name: 'کهکشان ژرف کازمیک',
                          desc: 'تم فضایی آرام‌بخش با رنگ بنفش رویایی ستاره‌ها.',
                          wallpaper: 'cosmic',
                          theme: 'purple',
                          previewBg: 'bg-gradient-to-br from-purple-950/50 to-slate-950 border-purple-500/20'
                        },
                        {
                          id: 'carbon',
                          name: 'کربن مشکی مینیمال',
                          desc: 'ساده، سنگین و فوق‌تیره برای کاهش خستگی چشم.',
                          wallpaper: 'minimal',
                          theme: 'indigo',
                          previewBg: 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800'
                        },
                        {
                          id: 'ruby-sunset',
                          name: 'غروب یاقوتی گرم',
                          desc: 'پوسته پرشور با ترکیب طیف سرخ روبی و کهربایی.',
                          wallpaper: 'neon',
                          theme: 'rose',
                          previewBg: 'bg-gradient-to-br from-rose-950/50 to-slate-950 border-rose-500/20'
                        },
                        {
                          id: 'venom-grid',
                          name: 'شبکه گیمینگ کلاسیک',
                          desc: 'طرح شبکه‌ای نوستالژیک با استایل هک ماتریکسی.',
                          wallpaper: 'grid',
                          theme: 'emerald',
                          previewBg: 'bg-gradient-to-br from-indigo-950/30 to-slate-950 border-indigo-500/20'
                        }
                      ].map((preset) => {
                        const isCurrent = lockWallpaper === preset.wallpaper && lockTheme === preset.theme;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setAiAccent(preset.theme);
                              handleSaveWallpaperAndTheme(preset.wallpaper, preset.theme);
                            }}
                            className={`group p-3 rounded-2xl border text-right transition cursor-pointer flex gap-3 items-center relative overflow-hidden ${
                              isCurrent
                                ? 'border-cyan-500 bg-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                : 'border-slate-800 bg-slate-950/50 hover:bg-slate-900/80 hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl ${preset.previewBg} border flex-shrink-0 flex items-center justify-center`} />
                            <div className="leading-tight flex-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-100">{preset.name}</span>
                                {isCurrent && (
                                  <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-black">فعال</span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 mt-1">{preset.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Part 2: Advanced manual fine-tuning */}
                  <div className="space-y-3 bg-slate-900/20 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-xs font-black text-slate-400 block mb-1">۲. شخصی‌سازی دستی و پیشرفته (Fine-Tuning)</span>
                    
                    {/* Subpart A: Accent Colors */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold block">رنگ نئونی سیستم (Accent Color):</label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[
                          { id: 'cyan', label: 'فیروزه‌ای', color: 'bg-cyan-500' },
                          { id: 'emerald', label: 'ونوم', color: 'bg-emerald-500' },
                          { id: 'purple', label: 'ارغوانی', color: 'bg-purple-500' },
                          { id: 'amber', label: 'کهربایی', color: 'bg-amber-500' },
                          { id: 'rose', label: 'یاقوتی', color: 'bg-rose-500' },
                          { id: 'indigo', label: 'نیلی', color: 'bg-indigo-500' },
                        ].map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => {
                              setAiAccent(col.id);
                              handleSaveWallpaperAndTheme(lockWallpaper, col.id);
                            }}
                            className={`p-1 border rounded-lg flex flex-col items-center gap-1 transition cursor-pointer ${
                              lockTheme === col.id
                                ? 'border-slate-300 bg-slate-900'
                                : 'border-slate-850 bg-slate-950/40 hover:border-slate-800'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full ${col.color}`} />
                            <span className="text-[8px] font-bold text-slate-400">{col.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subpart B: Wallpaper Backgrounds */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] text-slate-500 font-bold block">تصویر پس‌زمینه دسکتاپ (Wallpaper):</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'grid', label: 'شبکه ماتریکس', preview: 'bg-[radial-gradient(ellipse_at_center,#1e1b4b_20%,#020617_100%)]' },
                          { id: 'cosmic', label: 'کیهان عمیق', preview: 'bg-[radial-gradient(ellipse_at_center,#3b0764_20%,#020617_100%)]' },
                          { id: 'neon', label: 'شفق نئون', preview: 'bg-[radial-gradient(ellipse_at_center,#083344_20%,#020617_100%)]' },
                          { id: 'minimal', label: 'مات تیره', preview: 'bg-slate-950' },
                        ].map((wall) => (
                          <button
                            key={wall.id}
                            type="button"
                            onClick={() => {
                              handleSaveWallpaperAndTheme(wall.id, lockTheme);
                            }}
                            className={`relative h-12 rounded-lg border overflow-hidden cursor-pointer transition p-2 flex flex-col justify-end text-right ${
                              lockWallpaper === wall.id
                                ? 'border-slate-300'
                                : 'border-slate-850 hover:border-slate-700'
                            }`}
                          >
                            <div className={`absolute inset-0 z-0 opacity-40 ${wall.preview}`} />
                            <span className="relative z-10 text-[9px] text-white font-extrabold">{wall.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer apply & cancel buttons */}
                  <div className="flex gap-2.5 pt-3.5 border-t border-slate-800/40">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shadow-md"
                    >
                      <span>ثبت و ذخیره‌سازی تم نهایی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="w-24 bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
