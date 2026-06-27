import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WindowWrapper from './WindowWrapper';
import { 
  Shield, 
  Power, 
  RefreshCw, 
  HelpCircle, 
  PlusCircle, 
  AlertCircle, 
  User as UserIcon, 
  Settings, 
  Menu, 
  X, 
  Minimize2, 
  MousePointer, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Gamepad2, 
  Layers, 
  Clock, 
  LogOut, 
  Trash2,
  LayoutDashboard,
  Users,
  History, 
  Key, 
  Check, 
  Search, 
  Terminal, 
  Radio, 
  Volume2, 
  Wifi, 
  WifiOff,
  Cpu,
  Server,
  Globe,
  Monitor,
  Maximize2,
  FolderOpen,
  Edit2,
  Lock,
  Activity,
  ShieldAlert,
  LogIn,
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  Calendar,
  Star,
  MessageSquare,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { 
  User, 
  PromoCode, 
  SystemLog, 
  SimulatedApp, 
  SystemSettings,
  AppRequest,
  UserFeedback
} from '../types';
import { 
  getUsers, 
  saveUsers, 
  getPromoCodes, 
  addPromoCode, 
  deletePromoCode, 
  getLogs, 
  addLog, 
  clearLogs,
  getSettings, 
  updateSettings, 
  updateAdminCreds, 
  getAdminCreds, 
  redeemPromoCode,
  deleteUser,
  addUser,
  getSimulatedApps,
  saveSimulatedApps,
  getAppRequests,
  saveAppRequests,
  getFeedbacks,
  saveFeedbacks
} from '../utils/store';
import { 
  playOneMinuteWarning, 
  playThirtySecondWarning, 
  playCountdownBeep, 
  playLockSound, 
  playUnlockSound, 
  playBeep,
  playDeniedAccessSound,
  playSystemLockoutSound
} from '../utils/audio';
import { ThreatDashboard } from './ThreatDashboard';
import { ActivityLogger } from './ActivityLogger';
import { LanguageSelector } from './LanguageSelector';

interface DesktopProps {
  currentUser: User | 'admin';
  onLock: () => void;
}

export default function Desktop({ currentUser, onLock }: DesktopProps) {
  // Loaded state from store
  const [users, setUsers] = useState<User[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [adminCreds, setAdminCreds] = useState(getAdminCreds());

  // App list (Simulated launcher apps)
  const [simulatedApps, setSimulatedApps] = useState<SimulatedApp[]>(() => getSimulatedApps());
  const [appRequests, setAppRequests] = useState<AppRequest[]>(() => getAppRequests());
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(() => getFeedbacks());
  const [activeWindowId, setActiveWindowId] = useState<string>('');

  // Current session timing (for normal users)
  const [activeUser, setActiveUser] = useState<User | null>(
    currentUser === 'admin' ? null : currentUser
  );
  const [remainingTime, setRemainingTime] = useState<number>(
    currentUser === 'admin' ? 999999 : currentUser.remainingMinutes * 60 // convert to seconds
  );

  // Customization states for Admin & Lock Screen
  const [adminThemeColor, setAdminThemeColor] = useState<string>(() => {
    try {
      return localStorage.getItem('xguard_admin_theme_color') || 'indigo';
    } catch (e) {
      return 'indigo';
    }
  });

  const [adminWallpaper, setAdminWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem('xguard_admin_wallpaper') || 'minimal';
    } catch (e) {
      return 'minimal';
    }
  });

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

  // Battery Status API State
  const [battery, setBattery] = useState<{
    supported: boolean;
    charging: boolean;
    level: number;
    hasBattery: boolean;
  }>({
    supported: false,
    charging: false,
    level: 1.0,
    hasBattery: false,
  });

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        const updateBattery = () => {
          setBattery({
            supported: true,
            charging: batt.charging,
            level: batt.level,
            hasBattery: true, // Always show battery option
          });
        };

        updateBattery();

        batt.addEventListener('chargingchange', updateBattery);
        batt.addEventListener('levelchange', updateBattery);

        return () => {
          batt.removeEventListener('chargingchange', updateBattery);
          batt.removeEventListener('levelchange', updateBattery);
        };
      }).catch(() => {
        // Fallback simulated battery for desktop/sandbox environment
        setBattery({ supported: true, charging: false, level: 0.88, hasBattery: true });
      });
    } else {
      // Fallback simulated battery if navigator.getBattery doesn't exist
      setBattery({ supported: true, charging: false, level: 0.88, hasBattery: true });
    }
  }, []);

  // Internet Access Control States
  const [internetVolumeLimit, setInternetVolumeLimit] = useState<string>(() => {
    return localStorage.getItem('xguard_internet_volume_limit') || 'نامحدود';
  });
  const [internetUploadSpeed, setInternetUploadSpeed] = useState<string>(() => {
    return localStorage.getItem('xguard_internet_upload_speed') || 'نامحدود';
  });
  const [internetDownloadSpeed, setInternetDownloadSpeed] = useState<string>(() => {
    return localStorage.getItem('xguard_internet_download_speed') || 'نامحدود';
  });
  const [internetTimeLimit, setInternetTimeLimit] = useState<string>(() => {
    return localStorage.getItem('xguard_internet_time_limit') || 'همزمان با جلسه اصلی';
  });
  const [internetBlockedApps, setInternetBlockedApps] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('xguard_internet_blocked_apps') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Resolved active internet limits for the current logged-in user
  const activeUserCustomInternet = activeUser?.useCustomInternetLimits;
  const activeVolume = activeUserCustomInternet ? (activeUser?.internetVolumeLimit || 'نامحدود') : internetVolumeLimit;
  const activeDownload = activeUserCustomInternet ? (activeUser?.internetDownloadSpeed || 'نامحدود') : internetDownloadSpeed;
  const activeUpload = activeUserCustomInternet ? (activeUser?.internetUploadSpeed || 'نامحدود') : internetUploadSpeed;
  const activeTimeLimit = activeUserCustomInternet ? (activeUser?.internetTimeLimit || 'همزمان با جلسه اصلی') : internetTimeLimit;

  // Resolved active app firewall limits
  const activeUserCustomApps = activeUser?.useCustomAppLimits;
  const activeBlockedAppsList = activeUserCustomApps ? (activeUser?.blockedApps || []) : internetBlockedApps;
  
  // Speed simulation option for tester (1x, 5x, 20x, 60x speed to easily test countdown warning)
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Layout UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'users' | 'promos' | 'logs' | 'settings' | 'requests' | 'security' | 'apps' | 'feedback'>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('list'); // sub tab differs per page
  
  // Audit log filters & sub-tabs
  const [logsSubTab, setLogsSubTab] = useState<'system' | 'audit'>('audit');
  const [auditCategory, setAuditCategory] = useState<string>('all');
  const [auditRisk, setAuditRisk] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const loginTimeRef = React.useRef<number>(Date.now());
  
  // Show / Hide X-Guard Main Admin panel window
  const [showAdminPanel, setShowAdminPanel] = useState(currentUser === 'admin');
  
  // Custom Tray popups & tooltips
  const [showGuardianTooltip, setShowGuardianTooltip] = useState(false);
  const [showBatteryPopover, setShowBatteryPopover] = useState(false);

  // User session activity log selections
  const [selectedActivityUsername, setSelectedActivityUsername] = useState<string>('');

  // AI Wallpaper generation states
  const [aiWallpaperPrompt, setAiWallpaperPrompt] = useState('یک یوزپلنگ وحشی مکانیکی نئون فیروزه‌ای در خیابان‌های بارانی توکیو سایبرپانک');
  const [aiWallpaperStyle, setAiWallpaperStyle] = useState('neon-cyber');
  const [isGeneratingWallpaper, setIsGeneratingWallpaper] = useState(false);
  const [generatingProgressText, setGeneratingProgressText] = useState('');
  
  // Show / Hide X-Guard User Controller Widget
  const [isUserWidgetCollapsed, setIsUserWidgetCollapsed] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showNetworkWidget, setShowNetworkWidget] = useState(true);
  const [showPerfWidget, setShowPerfWidget] = useState(true);
  const [showNetworkTooltip, setShowNetworkTooltip] = useState(false);

  // New system windows
  const [showWifiWindow, setShowWifiWindow] = useState(false);
  const [showSoundWindow, setShowSoundWindow] = useState(false);
  const [showMouseWindow, setShowMouseWindow] = useState(false);

  // WiFi / Network card settings
  const [wifiCardEnabled, setWifiCardEnabled] = useState(true);
  const [connectedWifi, setConnectedWifi] = useState('X-Guard_HighSpeed_5G');
  const [connectingToWifi, setConnectingToWifi] = useState<string | null>(null);
  const [wifiPasswordInput, setWifiPasswordInput] = useState('');
  const [wifiPasswordTarget, setWifiPasswordTarget] = useState<string | null>(null);
  
  const [ethernetCardEnabled, setEthernetCardEnabled] = useState(true);
  const [ethernetSpeed, setEthernetSpeed] = useState('Auto');
  const [ethernetDhcp, setEthernetDhcp] = useState(true);
  const [ethernetIp, setEthernetIp] = useState('192.168.1.42');
  const [ethernetSubnet, setEthernetSubnet] = useState('255.255.255.0');
  const [ethernetGateway, setEthernetGateway] = useState('192.168.1.1');
  const [ethernetDns, setEthernetDns] = useState('1.1.1.1');

  // Manual Wifi Adding state
  const [manualWifiSSID, setManualWifiSSID] = useState('');
  const [manualWifiPassword, setManualWifiPassword] = useState('');
  const [manualWifiSecurity, setManualWifiSecurity] = useState('WPA2-Personal');
  const [showManualWifiForm, setShowManualWifiForm] = useState(false);

  // Available WiFi Networks list state
  const [wifiList, setWifiList] = useState([
    { ssid: 'X-Guard_HighSpeed_5G', signal: 98, secure: true, connected: true },
    { ssid: 'X-Guard_Gamers_2.4G', signal: 82, secure: true, connected: false },
    { ssid: 'Mokhaberat_VDSL_Decoy', signal: 65, secure: true, connected: false },
    { ssid: 'Shatel_LTE_Ultra', signal: 45, secure: true, connected: false },
    { ssid: 'Free_Public_Wifi', signal: 30, secure: false, connected: false },
  ]);

  // Sound settings
  const [soundMasterVolume, setSoundMasterVolume] = useState(80);
  const [soundMasterMuted, setSoundMasterMuted] = useState(false);
  const [soundGameVolume, setSoundGameVolume] = useState(90);
  const [soundGameMuted, setSoundGameMuted] = useState(false);
  const [soundSystemVolume, setSoundSystemVolume] = useState(50);
  const [soundSystemMuted, setSoundSystemMuted] = useState(false);
  const [soundVoiceVolume, setSoundVoiceVolume] = useState(75);
  const [soundVoiceMuted, setSoundVoiceMuted] = useState(false);

  const [soundOutputDevice, setSoundOutputDevice] = useState('HyperX Cloud III');
  const [soundInputDevice, setSoundInputDevice] = useState('Blue Yeti USB Microphone');

  const [soundMicLevel, setSoundMicLevel] = useState(0);
  const [soundEqPreset, setSoundEqPreset] = useState('گیمینگ'); // 'گیمینگ' | 'موزیک' | 'تقویت بیس' | 'حالت تخت' | 'شخصی'
  const [soundEq60Hz, setSoundEq60Hz] = useState(75);
  const [soundEq230Hz, setSoundEq230Hz] = useState(60);
  const [soundEq910Hz, setSoundEq910Hz] = useState(50);
  const [soundEq4kHz, setSoundEq4kHz] = useState(70);
  const [soundEq14kHz, setSoundEq14kHz] = useState(85);

  // Mouse settings
  const [mouseSpeed, setMouseSpeed] = useState(10);
  const [mousePrecision, setMousePrecision] = useState(true);
  const [mouseScrollSpeed, setMouseScrollSpeed] = useState(3);
  const [mousePrimarySwap, setMousePrimarySwap] = useState<'left' | 'right'>('left');
  const [mouseTrail, setMouseTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const trailIdRef = useRef(0);

  // Network Connection Widget States
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(true);
  const [networkPing, setNetworkPing] = useState<number>(12);
  const [networkDownload, setNetworkDownload] = useState<number>(942.5);
  const [networkUpload, setNetworkUpload] = useState<number>(485.2);

  // CPU & RAM Performance Widget States
  const [cpuUsage, setCpuUsage] = useState<number>(18);
  const [ramUsage, setRamUsage] = useState<number>(54.2);
  const [cpuHistory, setCpuHistory] = useState<number[]>(() => 
    Array.from({ length: 15 }, () => Math.floor(Math.random() * 15 + 10))
  );
  const [ramHistory, setRamHistory] = useState<number[]>(() => 
    Array.from({ length: 15 }, () => Math.floor(Math.random() * 10 + 45))
  );

  // System Tray & Clock
  const [desktopTime, setDesktopTime] = useState(new Date());
  const [isTrayMenuOpen, setIsTrayMenuOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [showExitPasswordDialog, setShowExitPasswordDialog] = useState(false);
  const [exitProtectionPurpose, setExitProtectionPurpose] = useState<'exit' | 'admin'>('exit');
  const [exitPasswordInput, setExitPasswordInput] = useState('');
  const [exitError, setExitError] = useState('');

  // Dialog for Task Manager Block
  const [showTaskManagerBlockDialog, setShowTaskManagerBlockDialog] = useState(false);
  const [taskManagerPasswordInput, setTaskManagerPasswordInput] = useState('');
  const [taskManagerError, setTaskManagerError] = useState('');

  // Toast notifications array
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'info' | 'warning' | 'error' }[]>([]);

  // Non-intrusive system notification banner state
  const [systemAlert, setSystemAlert] = useState<{
    id: string;
    type: 'update' | 'security' | 'info';
    title: string;
    message: string;
    timestamp: string;
  } | null>(null);

  // User panel form states
  const [userOldPass, setUserOldPass] = useState('');
  const [userNewPass, setUserNewPass] = useState('');
  const [userPassHint, setUserPassHint] = useState('');
  const [userAllowHint, setUserAllowHint] = useState(true);
  const [userPromoInput, setUserPromoInput] = useState('');
  
  // Custom user profile states
  const [userGamerTag, setUserGamerTag] = useState('');
  const [userBio, setUserBio] = useState('');

  // Dynamic language detection
  const lang = activeUser?.language || localStorage.getItem('xguard_lang') || 'fa';

  const t = (key: string): string => {
    const translations: Record<string, { fa: string; en: string }> = {
      // Floating Widget
      widget_title: { fa: 'ابزار محافظتی X-Guard', en: 'X-Guard Shield' },
      widget_remaining: { fa: 'زمان باقی‌مانده جلسه:', en: 'Time Left to Play:' },
      widget_profile_btn: { fa: 'پروفایل و شخصی‌سازی', en: 'My Vibe & Profile' },
      widget_quick_lock: { fa: 'قفل موقت', en: 'AFK Lock' },
      widget_active_user: { fa: 'کاربر فعال:', en: 'Gamer:' },
      
      // User Dashboard Tabs & Headers
      user_panel_title: { fa: 'پنل شخصی کاربر:', en: 'My Battle Station:' },
      tab_account: { fa: 'اطلاعات و امنیت حساب', en: 'My Safe & Vault' },
      tab_apps: { fa: 'برنامه‌ها و درخواست دسترسی', en: 'My Stash & Requests' },
      tab_customization: { fa: '👤 شخصی‌سازی پروفایل گیمر', en: '👤 My Vibe Customize' },
      tab_sound: { fa: '🔊 تنظیمات صوتی', en: '🔊 SFX & Tunes' },
      tab_feedback: { fa: '💬 ثبت بازخورد و گزارش', en: '💬 Feedback & Reports' },

      // Account Tab
      promo_title: { fa: 'کد تمدید شارژ دارید؟', en: 'Got a Cheat Code / Voucher?' },
      promo_placeholder: { fa: 'مثلاً: GIFT-30M', en: 'e.g. CHEAT-99M' },
      promo_btn: { fa: 'ثبت کد تمدید زمان', en: 'Redeem Voucher' },
      acc_info_title: { fa: 'اطلاعات حساب شما', en: 'My Rent Details' },
      acc_daily: { fa: 'زمان مجاز روزانه:', en: 'Daily Allowance:' },
      acc_extended: { fa: 'زمان هدیه تمدیدی:', en: 'Bonus Minutes:' },
      acc_remaining: { fa: 'زمان باقی‌مانده:', en: 'Rent Time Left:' },

      // Customization Tab
      profile_slogan_title: { fa: 'مشخصات کاربری و شعار گیمر', en: 'Gamer Alias & Slogan' },
      gamer_tag_label: { fa: 'نام مستعار داخل بازی (Gamer Tag):', en: 'Alias (Gamer Tag):' },
      bio_label: { fa: 'شعار گیمری (Slogan/Bio):', en: 'Motto / Bio:' },
      save_profile_btn: { fa: 'ذخیره اطلاعات متنی پروفایل', en: 'Lock In My Details' },
      avatar_picker_title: { fa: '👤 انتخاب آواتار گیمنت', en: '👤 Choose Avatar Vibe' },
      theme_picker_title: { fa: '🎨 انتخاب رنگ تم سیستم (Theme)', en: '🎨 Choose UI Glow (Accent)' },
      wallpaper_picker_title: { fa: '🖼️ انتخاب پس‌زمینه دسکتاپ (Wallpaper)', en: '🖼️ Choose Desktop Canvas' },
      lang_picker_title: { fa: 'انتخاب زبان سیستم / Language Selection', en: 'Choose Lingo (Language)' },
      lang_picker_desc: { fa: 'زبان بخش‌های مختلف سیستم را بین انگلیسی عامیانه (Slang) و فارسی تغییر دهید.', en: 'Change lingo to gamer slang english or standard persian.' },

      // Tray Menu
      tray_guard_header: { fa: 'نگهبان سیستم گیمنت X-Guard', en: 'X-Guard Root Daemon' },
      tray_admin_panel: { fa: 'ورود به پنل تنظیمات مدیریت', en: 'Staff Portal (Root Admin)' },
      tray_restore_widget: { fa: 'نمایش مجدد کادر شناور تایمر', en: 'Show Timer Widget' },
      tray_lock_pc: { fa: 'قفل کردن فوری رایانه (Lock)', en: 'Lock Battle Station (AFK)' },
      tray_exit: { fa: 'خروج کامل و بستن X-Guard (رمز ادمین)', en: 'Quit Daemon & Unlock PC (Staff Only)' },
      start_menu_active: { fa: 'فعال و ایمن', en: 'Active & Secure' },
      start_menu_apps: { fa: 'برنامه‌ها و ابزارهای سیستم:', en: 'System Programs & Tools:' },
      start_menu_admin: { fa: 'تنظیمات ادمین', en: 'Admin Portal' },

      // App Requests
      request_title: { fa: 'درخواست دسترسی به برنامه سیستم', en: 'Beg Admin for Locked App' },
      request_desc: { fa: 'برنامه‌هایی که قفل هستند را درخواست بدهید تا مدیریت گیم‌نت دسترسی دسکتاپ آن را برای شما آزاد کند.', en: 'Request games or utilities to be unlocked by local staff.' },
      request_app_name: { fa: 'نام برنامه یا بازی درخواستی:', en: 'Locked App / Game Name:' },
      request_category: { fa: 'دسته‌بندی برنامه:', en: 'App Category:' },
      request_purpose: { fa: 'هدف از دسترسی و نیاز شما:', en: 'Why do you need it? (Reason):' },
      request_purpose_placeholder: { fa: 'مثلاً: اجرای بازی با دوستان به مدت ۲ ساعت', en: 'e.g. Wanna play coop for 2 hours with homies' },
      request_desc_more: { fa: 'توضیحات بیشتر (اختیاری):', en: 'Extra Deets (Optional):' },
      request_submit_btn: { fa: 'ارسال درخواست به ادمین', en: 'Send Beg-Request to Staff' },
      request_list_title: { fa: 'وضعیت درخواست‌های شما', en: 'Your Beg-Requests Status' },
      request_no_reqs: { fa: 'هیچ درخواستی ارسال نکرده‌اید.', en: 'No requests sent yet.' },

      // Dialogs
      dialog_title: { fa: 'درخواست دسترسی مدیریت سیستم کلاینت', en: 'Staff Clearance Required' },
      dialog_desc: { fa: 'بستن برنامه، خروج کامل یا باز کردن پنل ادمین مستلزم وارد کردن کلمه عبور ادمین کلاینت است.', en: 'Quitting, modifying system, or opening admin panel requires root staff key.' },
      dialog_pass_label: { fa: 'کلمه عبور مدیریت:', en: 'Staff Password:' },
      dialog_cancel: { fa: 'انصراف', en: 'Abort' },
      dialog_confirm: { fa: 'تایید', en: 'Clear' },

      // Shortcuts
      shortcut_wifi: { fa: 'تنظیمات وای‌فای', en: 'Wi-Fi Rig' },
      shortcut_sound: { fa: 'تنظیمات صدا', en: 'Audio Vibe' },
      shortcut_mouse: { fa: 'سرعت موس', en: 'Mouse Speed' },
      shortcut_admin: { fa: 'تنظیمات ادمین', en: 'Admin Portal' },
      battery_status: { fa: 'وضعیت باتری کلاینت', en: 'Client Battery Status' },
      battery_charging: { fa: 'در حال شارژ', en: 'Charging' },
      battery_discharging: { fa: 'در حال تخلیه (باتری)', en: 'Discharging (Battery)' },
      battery_level: { fa: 'میزان باتری:', en: 'Battery Level:' },

      // Wi-Fi Window
      wifi_title: { fa: 'تنظیمات کارت شبکه و اتصال وای‌فای', en: 'Wi-Fi & LAN Adapter Settings' },
      tab_wifi_networks: { fa: 'شبکه‌های وای‌فای در دسترس', en: 'Available Wi-Fi Streams' },
      tab_ethernet_settings: { fa: 'تنظیمات کارت شبکه سیمی (LAN)', en: 'Ethernet Link Parameters' },
      wifi_adapter_label: { fa: 'کارت شبکه بی‌سیم (Wi-Fi)', en: 'Wi-Fi Wireless Card' },
      wifi_connected_to: { fa: 'متصل به شبکه: ', en: 'Connected to: ' },
      wifi_disconnect_btn: { fa: 'قطع اتصال', en: 'Disconnect' },
      wifi_ip_addr: { fa: 'آدرس آی‌پی:', en: 'IP Address:' },
      wifi_signal_strength: { fa: 'سیگنال:', en: 'Signal:' },
      wifi_excellent: { fa: '۹۸٪ (عالی)', en: '98% (Sick!)' },
      wifi_security: { fa: 'پروتکل امنیتی:', en: 'Security:' },
      wifi_link_speed: { fa: 'سرعت لینک:', en: 'Link Speed:' },
      wifi_no_connection: { fa: 'اتصال برقرار نیست. یک شبکه را از لیست زیر انتخاب کنید.', en: 'No connection. Pick a stream from the list below.' },
      wifi_pass_prompt: { fa: 'ورود رمز عبور برای اتصال به ', en: 'Enter secret password for ' },
      wifi_pass_short_err: { fa: 'رمز عبور باید حداقل ۴ کاراکتر باشد.', en: 'Secret key must be at least 4 characters long.' },
      wifi_connected_success: { fa: 'با موفقیت به شبکه متصل شدید.', en: 'Fully connected! Let\'s go!' },
      wifi_btn_cancel: { fa: 'انصراف', en: 'Abort' },
      wifi_btn_connect: { fa: 'اتصال', en: 'Connect' },
      wifi_networks_found: { fa: 'شبکه‌های بی‌سیم یافت شده:', en: 'Discovered Wi-Fi Networks:' },
      wifi_negotiating: { fa: 'در حال مذاکره امنیتی و دریافت آی‌پی...', en: 'Shaking hands & grabbing IP address...' },
      wifi_status_connected: { fa: 'متصل', en: 'Connected' },
      wifi_status_secure: { fa: 'ایمن', en: 'Secure' },
      wifi_hidden_prompt: { fa: 'آیا شبکه مخفی دارید؟', en: 'Got a hidden network?' },
      wifi_manual_scan: { fa: 'اسکن دستی فرکانس‌ها', en: 'Manual scan' },
      wifi_adapter_disabled: { fa: 'گیرنده بی‌سیم خاموش است.', en: 'Wireless rig is powered down.' },
      ethernet_adapter_label: { fa: 'کارت شبکه سیمی (LAN)', en: 'Wired Network Adapter (LAN)' },
      ethernet_speed_duplex: { fa: 'سرعت و دوطرفه (Speed/Duplex):', en: 'Speed & Duplex Mode:' },
      ethernet_auto: { fa: 'مذاکره خودکار (Auto Negotiation)', en: 'Auto Negotiation' },
      ethernet_ip_mode: { fa: 'پیکربندی آدرس (IP Mode):', en: 'IP Assign Mode:' },
      ethernet_dhcp: { fa: 'دریافت خودکار (DHCP)', en: 'Automatic (DHCP)' },
      ethernet_static: { fa: 'تنظیمات دستی (Static IP)', en: 'Manual static config' },
      ethernet_subnet: { fa: 'سابنت ماسک (Subnet Mask):', en: 'Subnet Mask:' },
      ethernet_gateway: { fa: 'دروازه اصلی (Gateway):', en: 'Gateway Route:' },
      ethernet_dns: { fa: 'کارساز دی‌ان‌اس (DNS Server):', en: 'DNS Resolver:' },
      ethernet_save_btn: { fa: 'ذخیره و اعمال تنظیمات LAN', en: 'Lock In LAN Config' },
      ethernet_save_success: { fa: 'تنظیمات کارت شبکه سیمی با موفقیت ذخیره و مجدداً پیکربندی شد.', en: 'Wired LAN settings locked in and reloaded.' },
      ethernet_disabled: { fa: 'اتصال سیمی خاموش یا غیرفعال است.', en: 'Wired link is disabled.' },

      // Sound Window
      sound_title: { fa: 'تنظیمات چندرسانه‌ای و کنترل صدا کلاینت', en: 'Multimedia & Audio Vibe Control' },
      sound_channels_vol: { fa: 'میزان ولوم کانال‌های خروجی', en: 'Channel Sound Blasters' },
      sound_test_btn: { fa: 'تست صدای استریو کلاینت', en: 'Test Stereo Sound' },
      sound_test_success: { fa: 'پروتکل پخش فرکانس صوتی با موفقیت آزمایش شد.', en: 'Audio freq blast completed successfully!' },
      sound_master_label: { fa: 'ولوم کلی سیستم (Master):', en: 'System Master Volume:' },
      sound_mute: { fa: 'بسته', en: 'Muted' },
      sound_unmute: { fa: 'صدا', en: 'Sound On' },
      sound_game_label: { fa: 'صدای بازی‌ها و نرم‌افزارها:', en: 'Games & Apps Volume:' },
      sound_system_label: { fa: 'هشدارهای سیستم (Notification):', en: 'System Pings & Alerts:' },
      sound_voice_label: { fa: 'چت صوتی (Discord / TS):', en: 'Voice Chat Comms (Discord/TS):' },
      sound_output_device: { fa: 'دستگاه خروجی صدا (Output):', en: 'Audio Output Blaster:' },
      sound_input_device: { fa: 'میکروفون ورودی (Input):', en: 'Mic Input Capture:' },
      sound_quality: { fa: 'کیفیت پخش: 24bit / 192kHz Studio', en: 'Playback Quality: 24-bit / 192kHz Studio Master' },
      sound_mic_level: { fa: 'پایش سطح ورودی میکروفون:', en: 'Mic Input Gain Level:' },
      sound_eq_title: { fa: 'اکولایزر صوتی سخت‌افزاری کلاینت', en: 'Hardware Sound Equalizer' },
      sound_eq_preset: { fa: 'پروفایل:', en: 'Preset Profile:' },
      sound_preset_gaming: { fa: 'حالت گیمینگ (Gaming Preset)', en: 'Gaming Mode (Boost Footsteps)' },
      sound_preset_music: { fa: 'حالت موزیک (Music Preset)', en: 'Symphony / Music Mode' },
      sound_preset_bass: { fa: 'تقویت بیس عمیق (Bass Boost)', en: 'Subwoofer Bass Boost' },
      sound_preset_flat: { fa: 'حالت تخت (Flat EQ)', en: 'Pure Flat EQ' },
      sound_preset_custom: { fa: 'تنظیمات دستی (Custom)', en: 'Custom Tweaks' },

      // Mouse Window
      mouse_title: { fa: 'تنظیمات پیشرفته و سرعت حرکت موس', en: 'Advanced Mouse Pointer Speed & Setup' },
      mouse_sensitivity: { fa: 'سرعت حرکت نشانگر (Sensitivity):', en: 'Cursor Glide Sensitivity:' },
      mouse_slow: { fa: 'کند (Slow)', en: 'Noob Slow' },
      mouse_normal: { fa: 'معمولی (Default)', en: 'Chill Default' },
      mouse_fast: { fa: 'سریع (Fast)', en: 'Aimbot Fast' },
      mouse_precision_label: { fa: 'افزایش دقت نشانگر (Pointer Precision)', en: 'Enhance Pointer Precision (Raw Input)' },
      mouse_precision_desc: { fa: 'شتاب‌دهی هوشمند موس بر اساس سرعت فیزیکی دست (Mouse Acceleration)', en: 'Dynamically scales velocity based on swipe speed (Mouse Accel)' },
      mouse_accel_disabled: { fa: 'شتاب سخت‌افزاری موس غیرفعال شد.', en: 'Raw Input locked. Accel disabled.' },
      mouse_accel_enabled: { fa: 'شتاب سخت‌افزاری موس فعال شد.', en: 'Smart mouse accel activated.' },
      mouse_primary_button: { fa: 'دکمه اصلی کلیک (Primary Button):', en: 'Primary Mouse Trigger:' },
      mouse_button_left: { fa: 'چپ (Left)', en: 'Left Click' },
      mouse_button_right: { fa: 'راست (Right)', en: 'Right Click' },
      mouse_scroll_lines: { fa: 'خطوط اسکرول چرخ موس:', en: 'Lines per scroll notch:' },
      mouse_test_title: { fa: 'محیط سنجش و تست سرعت نشانگر موس (جعبه شتاب):', en: 'Flick & Sensitivity Test Arena (Speed Box):' },
      mouse_test_placeholder: { fa: 'نشانگر را در این بخش حرکت دهید تا اثر سرعت و شتاب را حس کنید', en: 'Glide your cursor here to feel the acceleration trail & latency' },

      // Generic Note keys
      admin_note: { fa: 'ℹ️ **توجه:** این کاربر به طور پیش‌فرض از **قوانین عمومی و همگانی کلاینت** (تعریف شده در تنظیمات همگانی سیستم) استفاده می‌کند. در صورت تیک زدن گزینه بالا، می‌توانید قوانین سرعت اینترنت و فایروال اختصاصی برای این کاربر مشخص کنید.', en: 'ℹ️ **Heads up:** This gamer default-runs on **Global Client Rules** (defined in System settings). Tick the box above to customize bandwidth and specific firewall protocols for this user.' },
      taskmgr_note: { fa: 'نکته: با زدن ضربدر بالا، این ابزار سیستمی امنیتی شبیه‌ساز بسته می‌شود.', en: 'Tip: Press the close button above to exit this simulated security node.' },
      app_monitor_note: { fa: 'سیستم امنیتی X-Guard بر ارتباطات شبکه و رفتار پردازشی این برنامه نظارت دارد.', en: 'X-Guard Daemon is monitoring net sockets and process cycles of this app.' },
    };

    return translations[key]?.[lang as 'fa' | 'en'] || translations[key]?.fa || key;
  };

  const adminT = (key: string): string => {
    const dict: Record<string, { fa: string; en: string }> = {
      dashboard_title: { fa: 'نمای کلی وضعیت کلاینت', en: 'Client Host Overview' },
      admin_time: { fa: 'زمان فعلی ادمین:', en: 'Admin Local Time:' },
      logged_in_user: { fa: 'کاربر وارد شده', en: 'Authenticated Gamer' },
      no_user_locked: { fa: 'بدون کاربر (قفل)', en: 'No User (Locked)' },
      remaining_session_time: { fa: 'زمان باقی‌مانده جلسه', en: 'Remaining Session Time' },
      taskmgr_blocker_driver: { fa: 'درایور مسدودسازی Task Manager', en: 'Task Manager Blocker Driver' },
      active_protected: { fa: 'فعال و محافظت‌شده', en: 'Active & Protected' },
      disabled: { fa: 'غیرفعال', en: 'Disabled' },
      quick_charge_title: { fa: 'تمدید سریع شارژ برای کاربر ', en: 'Quick Add Minutes for @' },
      quick_charge_desc: { fa: 'افزایش دستی دقیقه‌ای زمان دسترسی بدون وارد کردن کد تمدید', en: 'Manually add game time to the active session instantly' },
      minutes_suffix: { fa: 'دقیقه', en: 'mins' },
      no_active_user_session: { fa: 'هیچ کاربری در حال حاضر وارد سیستم نشده است.', en: 'No gamer is currently logged in.' },
      no_active_user_session_desc: { fa: 'هنگامی که کاربری با پسوردش وارد شود، کنترلر شارژ سریع در این بخش فعال خواهد شد.', en: 'Once a gamer authenticates at the lock screen, quick charge buttons will light up.' },
      
      // Sidebar Tabs
      tab_dashboard: { fa: 'داشبورد سیستم', en: 'Command Dashboard' },
      tab_users: { fa: 'مدیریت کاربران', en: 'Account Vault' },
      tab_requests: { fa: 'درخواست‌های دسترسی', en: 'Access Requests' },
      tab_apps: { fa: 'مدیریت برنامه‌ها', en: 'App Registry' },
      tab_promos: { fa: 'کدهای تمدید', en: 'Redeem Vouchers' },
      tab_logs: { fa: 'لاگ جامع کلاینت', en: 'Audit Logs' },
      tab_security: { fa: 'فعالیت کاربران', en: 'Session Logs' },
      tab_feedback: { fa: 'بازخوردهای کاربران', en: 'Gamer Feedbacks' },
      tab_settings: { fa: 'تنظیمات حفاظتی', en: 'Security Shields' },
      
      // Admin Panel Headers
      admin_panel_title: { fa: 'سامانه مرکزی مدیریت X-Guard کلاینت', en: 'X-Guard Central Command Center' },
      admin_panel_subtitle: { fa: 'مدیریت مستقل برای این سیستم', en: 'Autonomous Host Management Console' },
      current_active_user: { fa: 'کاربر فعال جاری:', en: 'Current Active Gamer:' },
    };
    return dict[key]?.[lang as 'fa' | 'en'] || dict[key]?.fa || key;
  };
  
  // User panel app/request states
  const [userPanelTab, setUserPanelTab] = useState<'account' | 'apps' | 'customization' | 'sound-settings' | 'feedback'>('account');
  const [addAppName, setAddAppName] = useState('');
  const [addAppIcon, setAddAppIcon] = useState('🎮');
  const [addAppCategory, setAddAppCategory] = useState<'Game' | 'Utility' | 'System'>('Game');
  const [addAppProcess, setAddAppProcess] = useState('');
  const [reqAppName, setReqAppName] = useState('Valorant');
  const [customReqAppName, setCustomReqAppName] = useState('');
  const [reqAppPurpose, setReqAppPurpose] = useState('');
  const [reqAppDesc, setReqAppDesc] = useState('');
  const [reqAppCategory, setReqAppCategory] = useState<'Game' | 'Utility' | 'System'>('Game');

  // User feedback states
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<'hardware' | 'software' | 'service' | 'other'>('service');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackAdminReplyText, setFeedbackAdminReplyText] = useState<string>('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  // Sync inputs on activeUser change
  useEffect(() => {
    if (activeUser) {
      setUserGamerTag(activeUser.gamerTag || '');
      setUserBio(activeUser.bio || '');
    }
  }, [activeUser]);

  // Admin Panel Form states
  // Users form
  const [newUsername, setNewUsername] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserDailyMinutes, setNewUserDailyMinutes] = useState(60);
  const [newUserPassHint, setNewUserPassHint] = useState('');
  const [newUserAllowHint, setNewUserAllowHint] = useState(true);
  const [newUserUseCustomInternet, setNewUserUseCustomInternet] = useState(false);
  const [newUserInternetVolume, setNewUserInternetVolume] = useState('نامحدود');
  const [newUserInternetDownload, setNewUserInternetDownload] = useState('نامحدود');
  const [newUserInternetUpload, setNewUserInternetUpload] = useState('نامحدود');
  const [newUserInternetTime, setNewUserInternetTime] = useState('همزمان با جلسه اصلی');
  const [newUserUseCustomApps, setNewUserUseCustomApps] = useState(false);
  const [newUserBlockedApps, setNewUserBlockedApps] = useState<string[]>([]);
  const [userEditTarget, setUserEditTarget] = useState<User | null>(null);
  
  // Promo code form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoTime, setNewPromoTime] = useState(30);
  const [newPromoMaxUses, setNewPromoMaxUses] = useState(5);
  const [newPromoIsPermanent, setNewPromoIsPermanent] = useState(false);

  // Admin App Management form states
  const [adminNewAppName, setAdminNewAppName] = useState('');
  const [adminNewAppPath, setAdminNewAppPath] = useState('');
  const [adminNewAppIcon, setAdminNewAppIcon] = useState('🎮');
  const [adminNewAppCategory, setAdminNewAppCategory] = useState<'Game' | 'Utility' | 'System'>('Game');
  const [adminNewAppUseCustomLimits, setAdminNewAppUseCustomLimits] = useState(false);
  const [adminNewAppInternetBlocked, setAdminNewAppInternetBlocked] = useState(false);
  const [adminNewAppDownloadLimit, setAdminNewAppDownloadLimit] = useState('نامحدود');
  const [adminNewAppUploadLimit, setAdminNewAppUploadLimit] = useState('نامحدود');
  const [appEditTarget, setAppEditTarget] = useState<SimulatedApp | null>(null);

  // Admin settings form
  const [gamenetNameInput, setGamenetNameInput] = useState(settings.gamenetName);
  const [beepSoundConfig, setBeepSoundConfig] = useState(settings.beepSoundEnabled);
  const [tmBlockConfig, setTmBlockConfig] = useState(settings.taskManagerBlockEnabled);
  const [exitBlockConfig, setExitBlockConfig] = useState(settings.blockExitWithoutPassword);
  const [lockHotkeyConfig, setLockHotkeyConfig] = useState(settings.lockHotkey || 'F8');
  const [toggleHotkeyConfig, setToggleHotkeyConfig] = useState(settings.toggleHotkey || 'F7');

  // Admin Password Change Form
  const [adminOldPass, setAdminOldPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');

  // Drag position for User Widget (Floating Bubble)
  const [widgetPosition, setWidgetPosition] = useState({ x: 20, y: 20 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load Initial Store Data
  useEffect(() => {
    setUsers(getUsers());
    setPromoCodes(getPromoCodes());
    setLogs(getLogs());
  }, []);

  // Global hotkeys & suspicious keyboard pattern listener
  useEffect(() => {
    let keystrokeTimestamps: number[] = [];
    let modifierTapCount = 0;
    let modifierTimeout: any = null;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const lockKey = settings.lockHotkey || 'F8';
      const toggleKey = settings.toggleHotkey || 'F7';
      const pressedKey = e.key;

      // Check for lock hotkey or standard global key combos (e.g. Win+L, Alt+L)
      const isLockCombo = ((e.metaKey || e.altKey) && pressedKey.toLowerCase() === 'l');
      if (pressedKey === lockKey || isLockCombo) {
        e.preventDefault();
        playLockSound();
        onLock();
        triggerToast(lang === 'fa' ? 'سیستم با کلید میانبر قفل شد 🔒' : 'System locked via shortcut 🔒', 'info');
        return;
      }

      // Check for Windows / Meta key to toggle start menu
      if (pressedKey === 'Meta' || pressedKey === 'OS') {
        e.preventDefault();
        setIsStartMenuOpen(prev => !prev);
        return;
      }

      // Check for toggle hotkey
      if (pressedKey === toggleKey) {
        if (currentUser === 'admin') {
          e.preventDefault();
          setShowAdminPanel(prev => !prev);
          triggerToast('نمای پنل مدیریت تغییر یافت 🖥️', 'info');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [settings, currentUser, onLock, lang]);

  // Sync simulated apps to store
  useEffect(() => {
    saveSimulatedApps(simulatedApps);
  }, [simulatedApps]);

  // Sync app requests to store
  useEffect(() => {
    saveAppRequests(appRequests);
  }, [appRequests]);

  // Sync admin customization to localStorage
  useEffect(() => {
    localStorage.setItem('xguard_admin_theme_color', adminThemeColor);
  }, [adminThemeColor]);

  useEffect(() => {
    localStorage.setItem('xguard_admin_wallpaper', adminWallpaper);
  }, [adminWallpaper]);

  useEffect(() => {
    localStorage.setItem('xguard_lockscreen_wallpaper', lockWallpaper);
  }, [lockWallpaper]);

  useEffect(() => {
    localStorage.setItem('xguard_lockscreen_theme', lockTheme);
  }, [lockTheme]);

  // Sync internet settings to localStorage
  useEffect(() => {
    localStorage.setItem('xguard_internet_volume_limit', internetVolumeLimit);
  }, [internetVolumeLimit]);

  useEffect(() => {
    localStorage.setItem('xguard_internet_upload_speed', internetUploadSpeed);
  }, [internetUploadSpeed]);

  useEffect(() => {
    localStorage.setItem('xguard_internet_download_speed', internetDownloadSpeed);
  }, [internetDownloadSpeed]);

  useEffect(() => {
    localStorage.setItem('xguard_internet_time_limit', internetTimeLimit);
  }, [internetTimeLimit]);

  useEffect(() => {
    localStorage.setItem('xguard_internet_blocked_apps', JSON.stringify(internetBlockedApps));
  }, [internetBlockedApps]);

  // Sync state helpers
  const refreshUsers = () => setUsers(getUsers());
  const refreshPromoCodes = () => setPromoCodes(getPromoCodes());
  const refreshLogs = () => setLogs(getLogs());

  // Show Toast
  const triggerToast = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Trigger top desktop system/security event alert
  const triggerSystemAlert = (type: 'update' | 'security' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemAlert({ id, type, title, message, timestamp });
    
    // Also save to systems logs for traceability
    addLog(type === 'security' ? 'security' : 'info', `[اعلان سیستم] ${title}: ${message}`, 'سیستم');
    refreshLogs();
    
    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setSystemAlert(prev => prev?.id === id ? null : prev);
    }, 6000);
  };

  // Trigger initial desktop scan alert and start periodic system simulation events
  useEffect(() => {
    if (!activeUser) return;

    // 1. Welcome and Initial Security Check after 4 seconds
    const initialScanTimeout = setTimeout(() => {
      triggerSystemAlert(
        'security',
        'اسکنر امنیتی خودکار X-Guard',
        'پروتکل اسکن عمیق سیستم با موفقیت به پایان رسید. تمام فایل‌های اجرایی دسکتاپ ایمن هستند.'
      );
    }, 4000);

    // 2. Periodic system event triggers (every 85 seconds)
    const periodicEvents = [
      {
        type: 'update' as const,
        title: 'بروزرسانی ماژول ضد باج‌افزار',
        message: 'دیتا بیس رفتاری باج‌افزارها به نسخه 2026.6.24 بروزرسانی شد.'
      },
      {
        type: 'security' as const,
        title: 'گزارش فایروال محلی کلاینت',
        message: 'اسکن پورت‌های ناشناس از شبکه داخلی مسدود شد. امنیت سیستم ۱۰۰٪ برقرار است.'
      },
      {
        type: 'update' as const,
        title: 'همگام‌سازی ابری کتابخانه بازی‌ها',
        message: 'آخرین پچ‌ها و دیتای ذخیره شده بازی‌ها با کلود گیم‌نت همگام‌سازی شد.'
      },
      {
        type: 'info' as const,
        title: 'بهینه‌سازی حافظه رم سیستم',
        message: 'فضای رم غیر فعال پس از بستن شورت‌کات بازی‌ها با موفقیت پاکسازی شد.'
      },
      {
        type: 'security' as const,
        title: 'کنترل دیسک و یکپارچه‌سازی شیلد',
        message: 'فایل‌سیستم درایو C اسکن شد. نرخ سلامت دیسک عالی ارزیابی شده است.'
      }
    ];

    let eventIndex = 0;
    const intervalTimer = setInterval(() => {
      const event = periodicEvents[eventIndex];
      triggerSystemAlert(event.type, event.title, event.message);
      eventIndex = (eventIndex + 1) % periodicEvents.length;
    }, 85000);

    return () => {
      clearTimeout(initialScanTimeout);
      clearInterval(intervalTimer);
    };
  }, [activeUser]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setDesktopTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Main countdown loop (for normal logged-in users)
  useEffect(() => {
    if (!activeUser) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        const nextTime = prev - 1 * simulationSpeed;
        
        // Convert to minutes for local storage update every few seconds
        const prevMins = Math.ceil(prev / 60);
        const nextMins = Math.ceil(nextTime / 60);
        if (prevMins !== nextMins && nextTime > 0) {
          // Update user minutes in DB
          const allUsers = getUsers();
          const index = allUsers.findIndex(u => u.id === activeUser.id);
          if (index !== -1) {
            allUsers[index].remainingMinutes = Math.max(0, nextTime / 60);
            saveUsers(allUsers);
            setUsers(allUsers);
          }
        }

        // --- ALARM TRIGGERS ---
        // 1. One Minute Warning (60 seconds remaining)
        if (prev > 60 && nextTime <= 60) {
          if (settings.beepSoundEnabled) playOneMinuteWarning();
          triggerToast('تنها ۱ دقیقه از زمان دسترسی شما باقی مانده است!', 'warning');
          addLog('warning', `هشدار ۱ دقیقه زمان باقی‌مانده برای کاربر [${activeUser.username}] صادر شد.`, 'سیستم');
          refreshLogs();
        }

        // 2. Thirty Seconds Warning (30 seconds remaining)
        if (prev > 30 && nextTime <= 30) {
          if (settings.beepSoundEnabled) playThirtySecondWarning();
          triggerToast('توجه: ۳۰ ثانیه تا قفل شدن رایانه!', 'error');
          addLog('warning', `هشدار بحرانی ۳۰ ثانیه برای کاربر [${activeUser.username}] صادر شد.`, 'سیستم');
          refreshLogs();
        }

        // 3. 5, 4, 3, 2, 1 Countdown Beeps
        if (nextTime > 0 && nextTime <= 5) {
          const currentSec = Math.ceil(nextTime);
          const prevSec = Math.ceil(prev);
          if (currentSec !== prevSec) {
            if (settings.beepSoundEnabled) playCountdownBeep(currentSec);
          }
        }

        // 4. Session Expired (0 seconds)
        if (nextTime <= 0) {
          clearInterval(timer);
          handleSessionExpired();
          return 0;
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeUser, simulationSpeed, settings]);

  const handleSessionExpired = () => {
    // 1. Simulate closing all windows
    setSimulatedApps(prev => prev.map(app => ({ ...app, status: 'closed' })));
    triggerToast('زمان دسترسی شما به پایان رسید! رایانه در حال قفل شدن است.', 'error');
    
    // Save to logs
    if (activeUser) {
      const elapsedSecs = Math.floor((Date.now() - loginTimeRef.current) / 1000);
      const mins = Math.floor(elapsedSecs / 60);
      const secs = elapsedSecs % 60;
      addLog('security', `زمان دسترسی کاربر [${activeUser.username}] به پایان رسید. سیستم قفل شد. مدت زمان جلسه: ${mins} دقیقه و ${secs} ثانیه.`, `کاربر ${activeUser.username}`);
      
      // Update DB to 0 remaining minutes
      const allUsers = getUsers();
      const index = allUsers.findIndex(u => u.id === activeUser.id);
      if (index !== -1) {
        allUsers[index].remainingMinutes = 0;
        allUsers[index].isOnline = false;
        saveUsers(allUsers);
      }
    }
    
    setTimeout(() => {
      playLockSound();
      onLock();
    }, 1500);
  };

  // Draggable widget mouse/touch events
  const handleWidgetMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - widgetPosition.x,
      y: e.clientY - widgetPosition.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      // Constrain inside viewport boundaries
      const newX = Math.max(10, Math.min(window.innerWidth - 320, e.clientX - dragStartRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - dragStartRef.current.y));
      
      setWidgetPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Update CPU/RAM performance and network simulation metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update CPU usage (usually fluctuating between 10% and 40%, with occasional random spikes)
      setCpuUsage(prev => {
        const isSpike = Math.random() < 0.08;
        const base = isSpike 
          ? Math.floor(Math.random() * 30 + 65) // Spike: 65% - 95%
          : Math.floor(Math.random() * 18 + 12); // Normal: 12% - 30%
        const nextVal = Math.max(5, Math.min(98, base));
        
        setCpuHistory(history => {
          const updated = [...history.slice(1), nextVal];
          return updated;
        });
        return nextVal;
      });

      // 2. Update RAM usage (slower drift between 45% and 70%)
      setRamUsage(prev => {
        const offset = Math.random() * 2.4 - 1.2;
        const nextVal = Math.max(35, Math.min(85, Number((prev + offset).toFixed(1))));
        
        setRamHistory(history => {
          const updated = [...history.slice(1), Math.floor(nextVal)];
          return updated;
        });
        return nextVal;
      });

      // 3. Update network speed metrics slightly if online
      if (isNetworkOnline) {
        setNetworkPing(prev => {
          const change = Math.floor(Math.random() * 3 - 1); // -1, 0, or 1
          return Math.max(6, Math.min(45, prev + change));
        });
        setNetworkDownload(prev => {
          const change = Number((Math.random() * 30 - 15).toFixed(1));
          return Math.max(850, Math.min(995, Number((prev + change).toFixed(1))));
        });
        setNetworkUpload(prev => {
          const change = Number((Math.random() * 16 - 8).toFixed(1));
          return Math.max(420, Math.min(540, Number((prev + change).toFixed(1))));
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isNetworkOnline]);

  // Simulate Microphone level fluctuations when the sound settings window is open
  useEffect(() => {
    if (!showSoundWindow) {
      setSoundMicLevel(0);
      return;
    }
    const interval = setInterval(() => {
      setSoundMicLevel(prev => {
        // Random fluctuation mimicking microphone voice level
        const rand = Math.random();
        if (rand < 0.25) {
          return Math.floor(Math.random() * 8 + 3);
        } else if (rand < 0.75) {
          return Math.floor(Math.random() * 25 + 15);
        } else {
          return Math.floor(Math.random() * 45 + 35);
        }
      });
    }, 150);
    return () => clearInterval(interval);
  }, [showSoundWindow]);

  // Minimize app click (X button behavior on user panel / widget)
  const handleCloseUserPanelWidget = () => {
    setIsUserWidgetCollapsed(true);
    triggerToast('برنامه X-Guard کوچک شد و در نوار ساعت ویندوز قرار گرفت.', 'info');
    addLog('info', 'کاربر ابزار کنترلی X-Guard را به سیستم ترای (System Tray) منتقل کرد.', activeUser?.username || 'مدیریت');
    refreshLogs();
  };

  // Launch Simulated App
  const launchApp = (appId: string) => {
    const app = simulatedApps.find(a => a.id === appId);
    if (!app) return;

    // INTERCEPT TASK MANAGER ACCESS!
    if (app.processName === 'taskmgr.exe' && settings.taskManagerBlockEnabled) {
      if (!activeUser || activeUser.soundDeniedAccess !== false) {
        playDeniedAccessSound();
      }
      addLog('security', 'تلاش کاربر برای اجرای Task Manager توسط فیلتر درایور X-Guard شناسایی و مسدود شد.', activeUser?.username || 'مهمان');
      refreshLogs();
      setTaskManagerPasswordInput('');
      setTaskManagerError('');
      setShowTaskManagerBlockDialog(true);
      return;
    }

    setSimulatedApps(prev => prev.map(a => {
      if (a.id === appId) {
        return { 
          ...a, 
          status: 'running', 
          windowPosition: { x: 150 + Math.random() * 80, y: 100 + Math.random() * 50 } 
        };
      }
      return a;
    }));

    triggerToast(`برنامه ${app.name} با موفقیت اجرا شد.`, 'info');
    addLog('info', `پروسه شبیه‌ساز [${app.processName}] اجرا شد.`, activeUser?.username || 'مهمان');
    refreshLogs();
  };

  // Close Simulated App
  const closeApp = (appId: string) => {
    const app = simulatedApps.find(a => a.id === appId);
    if (!app) return;

    setSimulatedApps(prev => prev.map(a => {
      if (a.id === appId) return { ...a, status: 'closed' };
      return a;
    }));

    addLog('info', `پروسه شبیه‌ساز [${app.processName}] بسته شد.`, activeUser?.username || 'مهمان');
    refreshLogs();
  };

  // Exit Protection Authentication (Full Close or Admin panel unlock)
  const handleExitProtectionAuth = () => {
    if (exitPasswordInput === adminCreds.passwordHash) {
      setShowExitPasswordDialog(false);
      setIsTrayMenuOpen(false);
      if (exitProtectionPurpose === 'admin') {
        setShowAdminPanel(true);
        triggerToast('پنل مدیریت باز شد 🖥️', 'info');
        addLog('success', 'پنل تنظیمات مدیریت X-Guard با تأیید کلمه عبور ادمین باز شد.', 'مدیریت');
        refreshLogs();
      } else {
        addLog('success', 'رایانه و برنامه X-Guard با وارد کردن رمز مدیریت توسط ادمین بسته شدند.', 'مدیریت');
        playLockSound();
        onLock();
      }
    } else {
      if (!activeUser || activeUser.soundDeniedAccess !== false) {
        playDeniedAccessSound();
      }
      setExitError('رمز مدیریت اشتباه است.');
      addLog('security', `تلاش غیرمجاز برای ${exitProtectionPurpose === 'admin' ? 'ورود به پنل مدیریت' : 'خروج کامل'} با رمز مدیریت نامعتبر!`, activeUser?.username || 'مهمان');
      refreshLogs();
    }
  };

  // Bypass Task Manager Protection
  const handleTaskManagerBypassAuth = () => {
    if (taskManagerPasswordInput === adminCreds.passwordHash) {
      setShowTaskManagerBlockDialog(false);
      // Let them run Task Manager
      setSimulatedApps(prev => prev.map(a => {
        if (a.processName === 'taskmgr.exe') {
          return { ...a, status: 'running', windowPosition: { x: 200, y: 120 } };
        }
        return a;
      }));
      addLog('success', 'دسترسی ویژه به Task Manager با تایید رمز ادمین صادر شد.', 'مدیریت');
      refreshLogs();
    } else {
      if (!activeUser || activeUser.soundDeniedAccess !== false) {
        playDeniedAccessSound();
      }
      setTaskManagerError('رمز عبور مدیریت اشتباه است.');
      addLog('security', 'تلاش ناموفق برای باز کردن قفل Task Manager با رمز عبور نامعتبر!', activeUser?.username || 'مهمان');
      refreshLogs();
    }
  };

  // Redeem Promo code in user panel
  const handleUserRedeemPromo = () => {
    if (!userPromoInput.trim() || !activeUser) return;

    const res = redeemPromoCode(userPromoInput, activeUser.id);
    if (res.success) {
      triggerToast(res.message, 'info');
      // Reload user remaining time
      const updatedUsers = getUsers();
      const me = updatedUsers.find(u => u.id === activeUser.id);
      if (me) {
        setActiveUser(me);
        setRemainingTime(me.remainingMinutes * 60);
      }
      setUserPromoInput('');
    } else {
      triggerToast(res.message, 'error');
    }
    refreshUsers();
    refreshPromoCodes();
    refreshLogs();
  };

  // Submit Feedback from user panel
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!feedbackComment.trim()) {
      triggerToast('لطفا متن بازخورد خود را بنویسید.', 'error');
      return;
    }

    const newFeedback: UserFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      username: activeUser.username,
      rating: feedbackRating,
      category: feedbackCategory,
      comment: feedbackComment,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    const currentFeedbacks = getFeedbacks();
    const updated = [newFeedback, ...currentFeedbacks];
    saveFeedbacks(updated);
    setFeedbacks(updated);

    addLog('info', `کاربر @${activeUser.username} یک بازخورد ثبت کرد (${feedbackRating} ستاره)`, activeUser.username);
    refreshLogs();

    triggerToast('بازخورد شما با موفقیت ثبت و به مدیریت ارسال شد. سپاس از همراهی شما!', 'info');
    setFeedbackComment('');
    setFeedbackRating(5);
    setFeedbackCategory('service');
  };

  // Admin updates feedback status
  const handleFeedbackUpdateStatus = (id: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
    const currentFeedbacks = getFeedbacks();
    const updated = currentFeedbacks.map(f => f.id === id ? { ...f, status: newStatus } : f);
    saveFeedbacks(updated);
    setFeedbacks(updated);
    triggerToast('وضعیت بازخورد به‌روزرسانی شد.', 'info');
  };

  // Admin replies to feedback
  const handleFeedbackReply = (id: string, replyText: string) => {
    if (!replyText.trim()) return;
    const currentFeedbacks = getFeedbacks();
    const updated = currentFeedbacks.map(f => f.id === id ? { ...f, adminResponse: replyText, status: 'reviewed' as const } : f);
    saveFeedbacks(updated);
    setFeedbacks(updated);
    
    const targetFb = currentFeedbacks.find(f => f.id === id);
    if (targetFb) {
      addLog('success', `پاسخ مدیریت به بازخورد @${targetFb.username} ثبت شد.`, 'مدیریت');
      refreshLogs();
    }
    
    triggerToast('پاسخ شما برای کاربر ثبت شد.', 'info');
  };

  // Admin deletes feedback
  const handleDeleteFeedback = (id: string) => {
    const currentFeedbacks = getFeedbacks();
    const updated = currentFeedbacks.filter(f => f.id !== id);
    saveFeedbacks(updated);
    setFeedbacks(updated);
    if (selectedFeedbackId === id) {
      setSelectedFeedbackId(null);
      setFeedbackAdminReplyText('');
    }
    triggerToast('بازخورد مربوطه حذف شد.', 'info');
  };

  // User changes own password
  const handleUserChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    if (userNewPass.length < 8) {
      triggerToast('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.', 'error');
      return;
    }

    if (activeUser.passwordHash !== userOldPass) {
      triggerToast('رمز عبور فعلی اشتباه است.', 'error');
      return;
    }

    const allUsers = getUsers();
    const index = allUsers.findIndex(u => u.id === activeUser.id);
    if (index !== -1) {
      allUsers[index].passwordHash = userNewPass;
      allUsers[index].passwordHintPhrase = userPassHint;
      allUsers[index].allowHintOnLogin = userAllowHint;
      saveUsers(allUsers);
      
      setActiveUser(allUsers[index]);
      triggerToast('رمز عبور و عبارت راهنما با موفقیت به روز شد.', 'info');
      addLog('info', 'کاربر رمز عبور و تنظیمات راهنمای خود را تغییر داد.', activeUser.username);
      refreshLogs();
      
      setUserOldPass('');
      setUserNewPass('');
    }
  };

  // User updates profile details
  const handleUpdateUserProfile = (updates: Partial<User>) => {
    if (!activeUser) return;

    const allUsers = getUsers();
    const index = allUsers.findIndex(u => u.id === activeUser.id);
    if (index !== -1) {
      const updatedUser = { ...allUsers[index], ...updates };
      allUsers[index] = updatedUser;
      saveUsers(allUsers);
      setActiveUser(updatedUser);
      triggerToast('تنظیمات پروفایل با موفقیت بروز شد!', 'info');
      addLog('info', 'کاربر اطلاعات پروفایل خود (ظاهر یا مشخصات) را ویرایش کرد.', activeUser.username);
      refreshLogs();
    }
  };

  // Generate wallpaper using AI (Gemini Imagen)
  const handleGenerateAiWallpaper = async () => {
    if (!aiWallpaperPrompt.trim()) {
      triggerToast('لطفاً توصیف والپیپر را وارد کنید.', 'error');
      return;
    }

    setIsGeneratingWallpaper(true);
    setGeneratingProgressText('در حال ارسال درخواست به هوش مصنوعی جمینی...');
    
    try {
      // Simulate stepping progress text
      const progressSteps = [
        'در حال تحلیل پرامپت فانتزی نئون...',
        'در حال پردازش پیکسل‌ها توسط هوش مصنوعی Imagen...',
        'در حال ساخت پالت رنگی سایبرپانک و اعمال نورپردازی...',
        'تکمیل و دانلود والپیپر نهایی...',
      ];
      
      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < progressSteps.length) {
          setGeneratingProgressText(progressSteps[stepIdx]);
          stepIdx++;
        }
      }, 2500);

      const res = await fetch('/api/generate-lockscreen-wallpaper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiWallpaperPrompt,
          style: aiWallpaperStyle,
          ratio: '16:9'
        })
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'خطایی در تولید تصویر رخ داد.');
      }

      const data = await res.json();
      if (!data.imageUrl) {
        throw new Error('آدرس تصویر معتبر دریافت نشد.');
      }

      // Apply to activeUser or admin
      if (activeUser) {
        handleUpdateUserProfile({ wallpaper: data.imageUrl });
        addLog('success', `تصویر پس‌زمینه اختصاصی با هوش مصنوعی برای کاربر [${activeUser.username}] با موفقیت تولید و اعمال شد.`, activeUser.username);
      } else {
        setAdminWallpaper(data.imageUrl);
        localStorage.setItem('xguard_admin_wallpaper', data.imageUrl);
        addLog('success', 'تصویر پس‌زمینه اختصاصی با هوش مصنوعی برای دسکتاپ مدیریت با موفقیت تولید و اعمال شد.', 'مدیریت');
      }
      
      triggerToast('والپیپر اختصاصی شما با هوش مصنوعی تولید و اعمال شد!', 'info');
      refreshLogs();
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'خطا در ارتباط با سرور هوش مصنوعی.', 'error');
    } finally {
      setIsGeneratingWallpaper(false);
      setGeneratingProgressText('');
    }
  };

  // Helper to get structured, categorized user activities
  const getUserActivities = (username: string) => {
    if (!username) return [];

    // Filter logs related to this user
    const userLogs = logs.filter(l => {
      const msg = l.message || '';
      const u = l.user || '';
      return (
        u === username ||
        u === `کاربر ${username}` ||
        msg.includes(`[${username}]`) ||
        msg.includes(`کاربر ${username}`)
      );
    });

    const activities: any[] = [];
    const openApps: Record<string, { startTime: string; logId: string }> = {};

    // Process logs in chronological order (from oldest to newest)
    const cronLogs = [...userLogs].reverse();

    cronLogs.forEach(l => {
      const msg = l.message || '';
      
      // 1. Logins
      if (msg.includes('ورود موفقیت‌آمیز') || msg.includes('ورود موفق') || msg.includes('وارد کلاینت شد')) {
        activities.push({
          id: l.id,
          timestamp: l.timestamp,
          type: 'login',
          title: 'ورود به سیستم',
          desc: msg,
          icon: '🔑',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        });
      }
      
      // 2. Locks / Logout
      else if (msg.includes('قفل') || msg.includes('قفل شد') || msg.includes('به طور موقت قفل کرد')) {
        activities.push({
          id: l.id,
          timestamp: l.timestamp,
          type: 'lock',
          title: 'قفل کلاینت / خروج موقت',
          desc: msg,
          icon: '🔒',
          color: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
        });
      }

      // 3. Time extended / Promo codes
      else if (msg.includes('تمدید') || msg.includes('شارژ') || msg.includes('اضافه شد')) {
        activities.push({
          id: l.id,
          timestamp: l.timestamp,
          type: 'extend',
          title: 'تمدید زمان / شارژ حساب',
          desc: msg,
          icon: '⚡',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        });
      }
      
      // 4. App/Game launches
      else if (msg.includes('پروسه شبیه‌ساز') && msg.includes('اجرا شد')) {
        const appNameMatch = msg.match(/\[(.*?)\]/);
        const appName = appNameMatch ? appNameMatch[1] : 'برنامه کلاینت';
        
        openApps[appName] = {
          startTime: l.timestamp,
          logId: l.id
        };
      }
      
      else if (msg.includes('پروسه شبیه‌ساز') && msg.includes('بسته شد')) {
        const appNameMatch = msg.match(/\[(.*?)\]/);
        const appName = appNameMatch ? appNameMatch[1] : 'برنامه کلاینت';
        
        const openApp = openApps[appName];
        if (openApp) {
          const start = new Date(openApp.startTime);
          const end = new Date(l.timestamp);
          const diffMs = end.getTime() - start.getTime();
          const diffMin = Math.round(diffMs / 60000);
          
          activities.push({
            id: l.id,
            timestamp: l.timestamp,
            type: 'game',
            title: `بازی ${appName}`,
            desc: `بازی [${appName}] بسته شد. مدت زمان اجرا: ${diffMin || 1} دقیقه.`,
            duration: diffMin,
            appName,
            icon: '🎮',
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
          });
          
          delete openApps[appName];
        } else {
          activities.push({
            id: l.id,
            timestamp: l.timestamp,
            type: 'game',
            title: `بستن بازی ${appName}`,
            desc: msg,
            appName,
            icon: '🎮',
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
          });
        }
      }
      
      // 5. Security blocks & alerts
      else if (l.type === 'security' || msg.includes('مسدود') || msg.includes('غیرمجاز') || msg.includes('Task Manager')) {
        activities.push({
          id: l.id,
          timestamp: l.timestamp,
          type: 'security',
          title: 'رویداد مسدودسازی / امنیتی',
          desc: msg,
          icon: '🚨',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        });
      }

      // 6. Warning notices
      else if (msg.includes('هشدار ۱ دقیقه') || msg.includes('هشدار بحرانی') || msg.includes('ثانیه')) {
        activities.push({
          id: l.id,
          timestamp: l.timestamp,
          type: 'warning',
          title: 'هشدار سیستمی',
          desc: msg,
          icon: '⚠️',
          color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
        });
      }
    });

    // Check open apps still running
    Object.keys(openApps).forEach(appName => {
      const openApp = openApps[appName];
      const start = new Date(openApp.startTime);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffMin = Math.round(diffMs / 60000);
      
      activities.push({
        id: openApp.logId,
        timestamp: openApp.startTime,
        type: 'game_active',
        title: `در حال اجرای ${appName}`,
        desc: `بازی [${appName}] اجرا شد و همچنان در حال اجراست. مدت فعال: ${diffMin || 1} دقیقه.`,
        appName,
        icon: '🎮',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 animate-pulse'
      });
    });

    // Sort newest first
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // User adds personal app to desktop
  const handleUserAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAppName.trim() || !addAppProcess.trim()) {
      triggerToast('لطفاً نام برنامه و نام پروسس را وارد کنید.', 'error');
      return;
    }
    
    // Check if process name ends with .exe, if not add it
    let proc = addAppProcess.trim().toLowerCase();
    if (!proc.endsWith('.exe')) {
      proc += '.exe';
    }

    // Check if name or process is duplicated
    const isDup = simulatedApps.some(a => a.name.toLowerCase() === addAppName.trim().toLowerCase() || a.processName.toLowerCase() === proc);
    if (isDup) {
      triggerToast('برنامه‌ای با این نام یا پروسس از قبل وجود دارد.', 'warning');
      return;
    }

    const newApp: SimulatedApp = {
      id: 'custom_' + Math.random().toString(36).substr(2, 9),
      name: addAppName.trim(),
      icon: addAppIcon || '🎮',
      category: addAppCategory,
      processName: proc,
      status: 'closed'
    };

    setSimulatedApps(prev => [...prev, newApp]);
    addLog('info', `کاربر [${activeUser?.username || 'ناشناس'}] برنامه جدید [${addAppName.trim()}] را به دسکتاپ اضافه کرد.`, activeUser?.username || 'کاربر');
    triggerToast(`برنامه ${addAppName.trim()} با موفقیت به دسکتاپ اضافه شد!`, 'info');
    refreshLogs();
    
    // Clear form
    setAddAppName('');
    setAddAppProcess('');
  };

  // User requests access to a server app
  const handleUserRequestApp = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAppName = customReqAppName.trim();
    
    if (!finalAppName) {
      triggerToast('لطفاً نام برنامه یا بازی را مشخص کنید.', 'error');
      return;
    }

    // Check if already requested and pending
    const exists = appRequests.some(r => r.username === activeUser?.username && r.appName.toLowerCase() === finalAppName.toLowerCase() && r.status === 'pending');
    if (exists) {
      triggerToast('درخواست برای این برنامه قبلاً ارسال شده و در انتظار تأیید است.', 'warning');
      return;
    }

    const proc = finalAppName.toLowerCase().replace(/\s+/g, '') + '.exe';

    const newRequest: AppRequest = {
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      username: activeUser?.username || 'کاربر',
      appName: finalAppName,
      category: reqAppCategory,
      processName: proc,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      purpose: reqAppPurpose.trim(),
      description: reqAppDesc.trim()
    };

    setAppRequests(prev => [newRequest, ...prev]);
    addLog('info', `کاربر [${activeUser?.username || 'ناشناس'}] درخواست دسترسی به برنامه [${finalAppName}] با هدف [${reqAppPurpose}] را ارسال کرد.`, activeUser?.username || 'کاربر');
    triggerToast(`درخواست دسترسی به ${finalAppName} برای مدیر سیستم ارسال شد.`, 'info');
    refreshLogs();
    
    setCustomReqAppName('');
    setReqAppPurpose('');
    setReqAppDesc('');
  };

  // Admin handles app requests
  const handleAdminApproveRequest = (reqId: string) => {
    const targetReq = appRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    // 1. Update request status to approved
    setAppRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'approved' } : r));

    // 2. Add the app to simulatedApps if it doesn't exist
    const appExists = simulatedApps.some(a => a.name.toLowerCase() === targetReq.appName.toLowerCase() || a.processName.toLowerCase() === targetReq.processName.toLowerCase());
    
    if (!appExists) {
      const iconMap: Record<string, string> = {
        'Valorant': '🎯',
        'Minecraft': '⛏️',
        'Adobe Photoshop': '🎨',
        'Visual Studio Code': '💻',
        'ChatGPT Client': '🤖'
      };
      const newApp: SimulatedApp = {
        id: 'approved_' + Math.random().toString(36).substr(2, 9),
        name: targetReq.appName,
        icon: iconMap[targetReq.appName] || '🎮',
        category: targetReq.category,
        processName: targetReq.processName,
        status: 'closed'
      };
      setSimulatedApps(prev => [...prev, newApp]);
    }

    addLog('success', `درخواست دسترسی کاربر [${targetReq.username}] به برنامه [${targetReq.appName}] موافقت و فعال شد.`, 'مدیریت');
    triggerToast(`درخواست دسترسی ${targetReq.appName} برای ${targetReq.username} تأیید و برنامه اضافه شد!`, 'info');
    refreshLogs();
  };

  const handleAdminRejectRequest = (reqId: string) => {
    const targetReq = appRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    setAppRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'rejected' } : r));
    addLog('warning', `درخواست دسترسی کاربر [${targetReq.username}] به برنامه [${targetReq.appName}] رد شد.`, 'مدیریت');
    triggerToast(`درخواست دسترسی ${targetReq.appName} برای ${targetReq.username} رد شد.`, 'warning');
    refreshLogs();
  };

  const handleAdminDeleteRequest = (reqId: string) => {
    setAppRequests(prev => prev.filter(r => r.id !== reqId));
    triggerToast('درخواست حذف شد.', 'info');
  };

  // Admin: Add simulated app manually
  const handleAdminAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewAppName.trim() || !adminNewAppPath.trim()) {
      triggerToast('نام برنامه و مسیر آن الزامی است.', 'error');
      return;
    }

    const appExists = simulatedApps.some(
      a => a.name.toLowerCase() === adminNewAppName.trim().toLowerCase() || 
           a.processName.toLowerCase() === adminNewAppPath.trim().toLowerCase()
    );

    if (appExists) {
      triggerToast('برنامه‌ای با این نام یا مسیر پروسس قبلاً اضافه شده است.', 'warning');
      return;
    }

    const newApp: SimulatedApp = {
      id: 'app_' + Math.random().toString(36).substr(2, 9),
      name: adminNewAppName.trim(),
      icon: adminNewAppIcon,
      category: adminNewAppCategory,
      processName: adminNewAppPath.trim(),
      status: 'closed',
      useCustomInternetLimits: adminNewAppUseCustomLimits,
      internetBlocked: adminNewAppInternetBlocked,
      downloadLimitSpeed: adminNewAppDownloadLimit,
      uploadLimitSpeed: adminNewAppUploadLimit,
    };

    setSimulatedApps(prev => [...prev, newApp]);
    addLog('success', `برنامه جدید [${adminNewAppName.trim()}] توسط مدیر سیستم اضافه شد.`, 'مدیریت');
    triggerToast(`برنامه ${adminNewAppName.trim()} با موفقیت به سیستم اضافه شد.`, 'info');
    
    // Clear form
    setAdminNewAppName('');
    setAdminNewAppPath('');
    setAdminNewAppIcon('🎮');
    setAdminNewAppCategory('Game');
    setAdminNewAppUseCustomLimits(false);
    setAdminNewAppInternetBlocked(false);
    setAdminNewAppDownloadLimit('نامحدود');
    setAdminNewAppUploadLimit('نامحدود');
  };

  const handleAdminEditApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appEditTarget) return;

    if (!appEditTarget.name.trim() || !appEditTarget.processName.trim()) {
      triggerToast('نام برنامه و مسیر آن الزامی است.', 'error');
      return;
    }

    setSimulatedApps(prev => {
      const copy = [...prev];
      const index = copy.findIndex(a => a.id === appEditTarget.id);
      if (index !== -1) {
        copy[index] = appEditTarget;
      }
      return copy;
    });

    addLog('info', `اطلاعات برنامه [${appEditTarget.name}] توسط مدیر سیستم ویرایش شد.`, 'مدیریت');
    triggerToast(`برنامه ${appEditTarget.name} با موفقیت ویرایش شد.`, 'info');
    setAppEditTarget(null);
    setActiveSubTab('list');
  };

  const handleAdminDeleteApp = (appId: string) => {
    const targetApp = simulatedApps.find(a => a.id === appId);
    if (!targetApp) return;

    setSimulatedApps(prev => prev.filter(a => a.id !== appId));
    addLog('warning', `برنامه [${targetApp.name}] توسط مدیر سیستم حذف شد.`, 'مدیریت');
    triggerToast(`برنامه ${targetApp.name} از لیست سیستم حذف شد.`, 'info');
  };

  // Admin: Create user
  const handleAdminCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPass) {
      triggerToast('لطفاً نام کاربری و رمز را تکمیل کنید.', 'error');
      return;
    }

    if (newUserPass.length < 8) {
      triggerToast('کلمه عبور کاربر باید حداقل ۸ کاراکتر باشد.', 'error');
      return;
    }

    const existing = users.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (existing) {
      triggerToast('این نام کاربری از قبل وجود دارد.', 'error');
      return;
    }

    addUser({
      username: newUsername.trim(),
      passwordHash: newUserPass,
      dailyMinutes: newUserDailyMinutes,
      remainingMinutes: newUserDailyMinutes,
      passwordHintPhrase: newUserPassHint,
      allowHintOnLogin: newUserAllowHint,
      useCustomInternetLimits: newUserUseCustomInternet,
      internetVolumeLimit: newUserInternetVolume,
      internetDownloadSpeed: newUserInternetDownload,
      internetUploadSpeed: newUserInternetUpload,
      internetTimeLimit: newUserInternetTime,
      useCustomAppLimits: newUserUseCustomApps,
      blockedApps: newUserBlockedApps,
    });

    triggerToast(`کاربر ${newUsername} با موفقیت ایجاد شد.`, 'info');
    setNewUsername('');
    setNewUserPass('');
    setNewUserPassHint('');
    setNewUserUseCustomInternet(false);
    setNewUserInternetVolume('نامحدود');
    setNewUserInternetDownload('نامحدود');
    setNewUserInternetUpload('نامحدود');
    setNewUserInternetTime('همزمان با جلسه اصلی');
    setNewUserUseCustomApps(false);
    setNewUserBlockedApps([]);
    refreshUsers();
    refreshLogs();
    setActiveSubTab('list');
  };

  // Admin: Update user
  const handleAdminUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEditTarget) return;

    if (userEditTarget.passwordHash.length < 8) {
      triggerToast('رمز عبور باید حداقل ۸ حرف باشد.', 'error');
      return;
    }

    const allUsers = getUsers();
    const index = allUsers.findIndex(u => u.id === userEditTarget.id);
    if (index !== -1) {
      allUsers[index] = userEditTarget;
      saveUsers(allUsers);
      triggerToast(`مشخصات کاربر ${userEditTarget.username} ویرایش شد.`, 'info');
      addLog('info', `ادمین مشخصات کاربر [${userEditTarget.username}] را ویرایش کرد.`, 'مدیریت');
      refreshUsers();
      refreshLogs();
      setUserEditTarget(null);
      setActiveSubTab('list');
    }
  };

  // Admin: Delete user
  const handleAdminDeleteUser = (id: string) => {
    if (activeUser && activeUser.id === id) {
      triggerToast('نمی‌توانید کاربر فعال جاری سیستم را حذف کنید.', 'error');
      return;
    }
    deleteUser(id);
    triggerToast('کاربر حذف گردید.', 'info');
    refreshUsers();
    refreshLogs();
  };

  // Admin: Quick charge active user
  const handleAdminQuickCharge = (minutes: number) => {
    if (!activeUser) {
      triggerToast('هیچ کاربری در حال حاضر وارد سیستم نشده است.', 'error');
      return;
    }

    const allUsers = getUsers();
    const index = allUsers.findIndex(u => u.id === activeUser.id);
    if (index !== -1) {
      allUsers[index].remainingMinutes += minutes;
      saveUsers(allUsers);
      setRemainingTime(prev => prev + minutes * 60);
      setActiveUser(allUsers[index]);
      triggerToast(`شارژ فوری اعمال شد! ${minutes} دقیقه به کاربر افزوده شد.`, 'info');
      addLog('success', `ادمین به طور مستقیم شارژ فوری ${minutes} دقیقه‌ای به حساب [${activeUser.username}] اعمال کرد.`, 'مدیریت');
      refreshUsers();
      refreshLogs();
    }
  };

  // Admin: Create promo code
  const handleAdminCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) {
      triggerToast('کد تخفیف نمی‌تواند خالی باشد.', 'error');
      return;
    }

    const existing = promoCodes.find(c => c.code.toUpperCase() === newPromoCode.trim().toUpperCase());
    if (existing) {
      triggerToast('این کد تمدید قبلاً ایجاد شده است.', 'error');
      return;
    }

    addPromoCode({
      code: newPromoCode.trim().toUpperCase(),
      timeAddedMinutes: newPromoTime,
      maxUses: newPromoMaxUses,
      isPermanent: newPromoIsPermanent,
    });

    triggerToast(`کد تمدید ${newPromoCode.toUpperCase()} با موفقیت ساخته شد.`, 'info');
    setNewPromoCode('');
    refreshPromoCodes();
    refreshLogs();
    setActiveSubTab('list');
  };

  // Admin: Delete promo
  const handleAdminDeletePromo = (id: string) => {
    deletePromoCode(id);
    triggerToast('کد تمدید حذف شد.', 'info');
    refreshPromoCodes();
    refreshLogs();
  };

  // Admin: Save settings
  const handleAdminSaveSettings = () => {
    const updated: SystemSettings = {
      gamenetName: gamenetNameInput,
      beepSoundEnabled: beepSoundConfig,
      taskManagerBlockEnabled: tmBlockConfig,
      blockExitWithoutPassword: exitBlockConfig,
      lockHotkey: lockHotkeyConfig,
      toggleHotkey: toggleHotkeyConfig,
      decoyActive: false,
    };
    updateSettings(updated);
    setSettings(updated);
    triggerToast('تنظیمات امنیتی و کلیدهای میانبر به روز رسانی شد.', 'info');
    refreshLogs();
  };

  // Admin: Change password
  const handleAdminChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminOldPass !== adminCreds.passwordHash) {
      triggerToast('رمز عبور قدیمی مدیریت اشتباه است.', 'error');
      return;
    }
    if (adminNewPass.length < 8) {
      triggerToast('رمز جدید مدیریت باید حداقل ۸ حرف باشد.', 'error');
      return;
    }
    if (adminNewPass !== adminConfirmPass) {
      triggerToast('تکرار رمز عبور جدید مطابقت ندارد.', 'error');
      return;
    }

    updateAdminCreds(adminCreds.username, adminNewPass);
    setAdminCreds({ username: adminCreds.username, passwordHash: adminNewPass });
    triggerToast('رمز عبور مدیریت با موفقیت تغییر کرد.', 'info');
    setAdminOldPass('');
    setAdminNewPass('');
    setAdminConfirmPass('');
    refreshLogs();
  };

  // Format seconds to hh:mm:ss for user countdown display
  const formatSeconds = (totalSecs: number) => {
    if (totalSecs > 100000) return 'بی‌نهایت (ادمین)';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);

    const fH = hrs.toString().padStart(2, '0');
    const fM = mins.toString().padStart(2, '0');
    const fS = secs.toString().padStart(2, '0');

    return `${fH}:${fM}:${fS}`;
  };

  const getThemeColors = (color?: string) => {
    switch(color) {
      case 'emerald':
        return {
          text: 'text-emerald-400',
          textDark: 'text-emerald-500',
          border: 'border-emerald-500/40',
          borderFocus: 'focus:border-emerald-500',
          bg: 'bg-emerald-500',
          bgHover: 'hover:bg-emerald-600',
          shadow: 'shadow-emerald-500/10',
          glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]',
          bgTransparent: 'bg-emerald-500/10',
          borderTransparent: 'border-emerald-500/30',
          textBtn: 'text-slate-950',
          accent: 'emerald'
        };
      case 'purple':
        return {
          text: 'text-purple-400',
          textDark: 'text-purple-500',
          border: 'border-purple-500/40',
          borderFocus: 'focus:border-purple-500',
          bg: 'bg-purple-500',
          bgHover: 'hover:bg-purple-600',
          shadow: 'shadow-purple-500/10',
          glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]',
          bgTransparent: 'bg-purple-500/10',
          borderTransparent: 'border-purple-500/30',
          textBtn: 'text-slate-100',
          accent: 'purple'
        };
      case 'amber':
        return {
          text: 'text-amber-400',
          textDark: 'text-amber-500',
          border: 'border-amber-500/40',
          borderFocus: 'focus:border-amber-500',
          bg: 'bg-amber-500',
          bgHover: 'hover:bg-amber-600',
          shadow: 'shadow-amber-500/10',
          glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]',
          bgTransparent: 'bg-amber-500/10',
          borderTransparent: 'border-amber-500/30',
          textBtn: 'text-slate-950',
          accent: 'amber'
        };
      case 'rose':
        return {
          text: 'text-rose-400',
          textDark: 'text-rose-500',
          border: 'border-rose-500/40',
          borderFocus: 'focus:border-rose-500',
          bg: 'bg-rose-500',
          bgHover: 'hover:bg-rose-600',
          shadow: 'shadow-rose-500/10',
          glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]',
          bgTransparent: 'bg-rose-500/10',
          borderTransparent: 'border-rose-500/30',
          textBtn: 'text-slate-100',
          accent: 'rose'
        };
      case 'indigo':
        return {
          text: 'text-indigo-400',
          textDark: 'text-indigo-500',
          border: 'border-indigo-500/40',
          borderFocus: 'focus:border-indigo-500',
          bg: 'bg-indigo-500',
          bgHover: 'hover:bg-indigo-600',
          shadow: 'shadow-indigo-500/10',
          glow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]',
          bgTransparent: 'bg-indigo-500/10',
          borderTransparent: 'border-indigo-500/30',
          textBtn: 'text-slate-100',
          accent: 'indigo'
        };
      case 'cyan':
      default:
        return {
          text: 'text-cyan-400',
          textDark: 'text-cyan-500',
          border: 'border-cyan-500/40',
          borderFocus: 'focus:border-cyan-500',
          bg: 'bg-cyan-500',
          bgHover: 'hover:bg-cyan-600',
          shadow: 'shadow-cyan-500/10',
          glow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]',
          bgTransparent: 'bg-cyan-500/10',
          borderTransparent: 'border-cyan-500/30',
          textBtn: 'text-slate-950',
          accent: 'cyan'
        };
    }
  };

  const getWallpaperBackgrounds = () => {
    const userWallpaper = activeUser ? (activeUser.wallpaper || 'grid') : adminWallpaper;
    
    // Check if userWallpaper is an image URL or data-url base64 string
    if (userWallpaper && (userWallpaper.startsWith('http') || userWallpaper.startsWith('data:image'))) {
      return (
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
          <img 
            src={userWallpaper} 
            alt="AI Generated Desktop Background" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
        </div>
      );
    }

    switch(userWallpaper) {
      case 'neon':
        return (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-fuchsia-950/30 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b0764_1px,transparent_1px),linear-gradient(to_bottom,#3b0764_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
          </>
        );
      case 'cosmic':
        return (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/35 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="absolute inset-0 bg-stars opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px)', backgroundSize: '550px 550px', backgroundPosition: '0 0, 40px 60px' }} />
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          </>
        );
      case 'minimal':
        return (
          <>
            <div className="absolute inset-0 bg-slate-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/60 to-slate-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#111827_25%,transparent_25%),linear-gradient(-45deg,#111827_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#111827_75%),linear-gradient(-45deg,transparent_75%,#111827_75%)] bg-[size:20px_20px] opacity-10 pointer-events-none" />
          </>
        );
      case 'grid':
      default:
        return (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20 pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          </>
        );
    }
  };

  const uTheme = getThemeColors(activeUser ? activeUser.themeColor : adminThemeColor);

  return (
    <div className="fixed inset-0 bg-slate-950 select-none overflow-hidden font-sans text-slate-100 flex flex-col justify-between" dir="rtl">
      
      {/* DESKTOP BACKGROUND */}
      {getWallpaperBackgrounds()}

      {/* SUBTLE WATERMARK ON DESKTOP WALLPAPER */}
      <div className="absolute top-4 left-4 z-0 pointer-events-none opacity-20 font-sans text-[10px] font-bold text-slate-400 select-none tracking-wide text-left">
        ساخته شده با ❤️ و ☕ توسط Amir-X
      </div>

      {/* TOAST SYSTEM */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-3 text-xs backdrop-blur-md bg-slate-950/75 ${
                toast.type === 'error' 
                  ? 'border-red-500/35 text-red-300' 
                  : toast.type === 'warning'
                  ? 'border-amber-500/35 text-amber-300'
                  : 'border-cyan-500/35 text-cyan-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className={`w-4 h-4 flex-shrink-0 ${
                  toast.type === 'error' ? 'text-red-400' : toast.type === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                }`} />
                <span className="font-medium text-right leading-relaxed">{toast.message}</span>
              </div>
              <button
                onClick={() => {
                  setToasts(prev => prev.filter(t => t.id !== toast.id));
                }}
                className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-900/60 flex-shrink-0 cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* SYSTEM ALERT BANNER */}
      <div className="absolute top-16 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
        <AnimatePresence>
          {systemAlert && (
            <motion.div
              initial={{ opacity: 0, y: -25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto w-full max-w-lg bg-slate-950/70 border ${
                systemAlert.type === 'security'
                  ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                  : systemAlert.type === 'update'
                  ? `border-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]`
                  : 'border-slate-800 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
              } backdrop-blur-lg rounded-xl p-3.5 flex items-start gap-3.5 text-right relative overflow-hidden`}
            >
              {/* Decorative top colored border line */}
              <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${
                systemAlert.type === 'security'
                  ? 'from-red-500 via-rose-500 to-red-500'
                  : systemAlert.type === 'update'
                  ? `from-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500 via-indigo-500 to-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500`
                  : 'from-slate-700 via-slate-500 to-slate-700'
              }`} />

              {/* Icon container */}
              <div className={`p-2 rounded-lg ${
                systemAlert.type === 'security'
                  ? 'bg-red-500/10 text-red-400'
                  : systemAlert.type === 'update'
                  ? `bg-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500/10 text-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400`
                  : 'bg-slate-900 text-slate-400'
              } flex-shrink-0 mt-0.5`}>
                {systemAlert.type === 'security' ? (
                  <Shield className="w-5 h-5 animate-pulse" />
                ) : systemAlert.type === 'update' ? (
                  <RefreshCw className="w-5 h-5 animate-spin-slow" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                    <span>{systemAlert.title}</span>
                    {systemAlert.type === 'security' && (
                      <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-black animate-pulse">رویداد امنیتی</span>
                    )}
                    {systemAlert.type === 'update' && (
                      <span className="text-[8px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-black">به‌روزرسانی</span>
                    )}
                  </h5>
                  <span className="text-[9px] font-mono text-slate-500">{systemAlert.timestamp}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  {systemAlert.message}
                </p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSystemAlert(null)}
                className="text-slate-500 hover:text-slate-300 transition cursor-pointer p-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PERSISTENT TOP STATUS & TIMER BAR (ALWAYS VISIBLE ON MAIN DESKTOP) */}
      {activeUser && (
        <div className="w-full h-14 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between z-40 select-none relative shrink-0">
          {/* Top Bar bottom glowing border */}
          <div className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500/50 to-transparent`} />
          
          {/* Right side: Game-net Name & Status */}
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-black tracking-wider text-slate-100 flex items-center gap-2">
              <span>{settings.gamenetName || "سامانه امنیتی X-Guard"}</span>
              <span className="text-[10px] text-slate-500 font-normal">| رایانه شماره ۷</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">
              CLIENT-ID: XG-07
            </span>
          </div>

          {/* Center: THE PERSISTENT NEON TIMER (ALWAYS VISIBLE) */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 bg-slate-950 border border-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500/30 px-5 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden group`}>
              <div className={`absolute inset-0 bg-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500/5 group-hover:bg-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-500/10 transition-colors`} />
              
              <div className="flex items-center gap-1.5 z-10">
                <Clock className={`w-3.5 h-3.5 ${uTheme.text} animate-spin-slow`} />
                <span className="text-[10px] text-slate-400 font-black">زمان باقی‌مانده:</span>
              </div>

              <span className={`text-sm font-black font-mono tracking-widest tabular-nums z-10 ${
                remainingTime < 300 
                  ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                  : `${uTheme.text} ${uTheme.glow}`
              }`}>
                {formatSeconds(remainingTime)}
              </span>
              
              {/* Progress pill line in the center */}
              <div 
                className={`absolute bottom-0 left-0 h-[2.5px] transition-all duration-1000 ${remainingTime < 300 ? 'bg-red-500' : uTheme.bg}`} 
                style={{ width: `${Math.min(100, (remainingTime / (activeUser.dailyMinutes * 60)) * 100)}%` }} 
              />
            </div>

            {/* Simulated Speed Indicator for visual testing confirmation */}
            {simulationSpeed > 1 && (
              <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded-full animate-pulse font-bold">
                تست: {simulationSpeed}x
              </span>
            )}
          </div>

          {/* Left side: Active User Profile Summary & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg ${uTheme.bgTransparent} border ${uTheme.borderTransparent} flex items-center justify-center text-sm font-bold`}>
                {activeUser.avatar || "👤"}
              </div>
              <div className="text-right leading-none hidden md:block">
                <div className="text-[9px] text-slate-500 font-bold">کاربر فعال</div>
                <div className="text-[11px] font-black text-slate-200 mt-0.5">
                  {activeUser.gamerTag ? `${activeUser.gamerTag} (${activeUser.username})` : activeUser.username}
                </div>
              </div>
            </div>

            <span className="w-[1px] h-4 bg-slate-800" />

            {/* Trigger Profile Panel */}
            <button
              onClick={() => {
                setUserPanelTab('customization');
                setShowUserDashboard(true);
              }}
              className={`${uTheme.bg} hover:${uTheme.bgHover} ${uTheme.textBtn} px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-md ${uTheme.shadow}`}
            >
              <UserIcon className="w-3 h-3" />
              <span>پروفایل و شخصی‌سازی</span>
            </button>

            {/* Quick Lock */}
            <button
              onClick={() => {
                playLockSound();
                if (activeUser) {
                  const elapsedSecs = Math.floor((Date.now() - loginTimeRef.current) / 1000);
                  const mins = Math.floor(elapsedSecs / 60);
                  const secs = elapsedSecs % 60;
                  addLog('info', `کاربر رایانه را به طور موقت قفل کرد. مدت زمان جلسه: ${mins} دقیقه و ${secs} ثانیه.`, activeUser.username);
                } else {
                  addLog('info', 'رایانه توسط ادمین قفل شد.', 'مدیریت');
                }
                onLock();
              }}
              className="border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-300 p-1.5 rounded-lg transition cursor-pointer"
              title="قفل موقت رایانه"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1: REMOVED FLOATING WIDGET AS REQUESTED */}

      {/* STAGE 2: DESKTOP WORKSPACE & LAUNCHED WINDOWS */}
      <div className="flex-1 p-6 relative flex flex-col justify-start gap-6 select-none pointer-events-auto">
        
        {/* PINNED DESKTOP TIMER & USER STATUS WIDGET */}
        {activeUser && (
          <div 
            className="absolute top-6 left-6 w-72 bg-slate-950/75 border border-cyan-500/20 p-4 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.06)] backdrop-blur-md z-0 select-none text-right font-sans"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black text-slate-300">وضعیت کلاینت گیم‌نت (Active Session)</span>
              </div>
              <button
                onClick={() => setShowUserDashboard(true)}
                className="text-[10px] text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                پروفایل من
              </button>
            </div>

            {/* Time Countdown Area */}
            <div className="text-center space-y-2.5">
              <div className="text-[10px] text-slate-400">
                کاربر فعال جاری: <span className="text-cyan-400 font-bold">@{activeUser.username}</span>
              </div>
              
              <div className="bg-slate-950/90 border border-slate-900 py-2.5 rounded-xl">
                <span className={`text-2xl font-black font-mono tracking-widest tabular-nums ${remainingTime < 60 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                  {formatSeconds(remainingTime)}
                </span>
              </div>

              {/* Simulated Speed booster for testing */}
              <div className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-900 text-[9px]">
                <span className="text-slate-500">سرعت تست تایمر کلاینت:</span>
                <div className="flex gap-1 font-mono">
                  {[1, 5, 20, 60].map(sp => (
                    <button
                      key={sp}
                      onClick={() => {
                        setSimulationSpeed(sp);
                        triggerToast(`شبیه‌ساز زمان با سرعت ${sp} برابر فعال شد.`, 'info');
                      }}
                      className={`px-1.5 py-0.5 rounded ${simulationSpeed === sp ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'}`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${remainingTime < 60 ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(100, (remainingTime / (activeUser.dailyMinutes * 60)) * 100)}%` }}
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { setShowUserDashboard(true); }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-[10px] py-1.5 rounded-lg font-black transition cursor-pointer"
                >
                  {t('promo_btn')}
                </button>
                <button
                  onClick={() => {
                    playLockSound();
                    if (activeUser) {
                      const elapsedSecs = Math.floor((Date.now() - loginTimeRef.current) / 1000);
                      const mins = Math.floor(elapsedSecs / 60);
                      const secs = elapsedSecs % 60;
                      addLog('info', `کاربر رایانه را به طور موقت قفل کرد. مدت زمان جلسه: ${mins} دقیقه و ${secs} ثانیه.`, activeUser.username);
                    }
                    onLock();
                  }}
                  className="border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950 text-slate-300 text-[10px] py-1.5 rounded-lg font-semibold transition cursor-pointer"
                >
                  {t('widget_quick_lock')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Shortcut Icons on Desktop */}
        <div className="flex flex-col flex-wrap gap-y-4 gap-x-6 items-start h-[calc(100vh-220px)] max-h-[640px] content-start text-center mt-2 z-10 select-none pointer-events-auto">
          {simulatedApps.map(app => (
            <motion.button
              key={app.id}
              onClick={() => launchApp(app.id)}
              whileHover={{ scale: 1.12, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 14 }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-300 hover:text-white transition w-24 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-950/60 group-hover:bg-cyan-500/10 border border-slate-800/80 group-hover:border-cyan-500/20 flex items-center justify-center text-2xl shadow-md transition">
                {app.icon}
              </div>
              <span className="text-[10px] font-bold tracking-tight leading-none drop-shadow-md">{app.name}</span>
            </motion.button>
          ))}

          {/* WiFi & Network Settings Shortcut */}
          <motion.button
            onClick={() => {
              setShowWifiWindow(true);
              setActiveWindowId('wifi-settings-window');
              playUnlockSound();
            }}
            whileHover={{ scale: 1.12, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 14 }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-300 hover:text-white transition w-24 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md transition group-hover:border-cyan-400 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Wifi className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-cyan-400 drop-shadow-md">{t('shortcut_wifi')}</span>
          </motion.button>

          {/* Sound Settings Shortcut */}
          <motion.button
            onClick={() => {
              setShowSoundWindow(true);
              setActiveWindowId('sound-settings-window');
              playUnlockSound();
            }}
            whileHover={{ scale: 1.12, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 14 }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-300 hover:text-white transition w-24 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md transition group-hover:border-purple-400 group-hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <Volume2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-purple-400 drop-shadow-md">{t('shortcut_sound')}</span>
          </motion.button>

          {/* Mouse Speed Shortcut */}
          <motion.button
            onClick={() => {
              setShowMouseWindow(true);
              setActiveWindowId('mouse-settings-window');
              playUnlockSound();
            }}
            whileHover={{ scale: 1.12, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 14 }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-300 hover:text-white transition w-24 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md transition group-hover:border-emerald-400 group-hover:shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              <MousePointer className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 drop-shadow-md">{t('shortcut_mouse')}</span>
          </motion.button>

          {/* Admin Tools Shortcut */}
          {currentUser === 'admin' && (
            <motion.button
              onClick={() => setShowAdminPanel(true)}
              whileHover={{ scale: 1.12, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 14 }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-300 hover:text-white transition w-24 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md transition">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <span className="text-[10px] font-bold text-cyan-400 drop-shadow-md">{t('shortcut_admin')}</span>
            </motion.button>
          )}
        </div>

        {/* DESKTOP HARDWARE MONITORING & NETWORK WIDGETS as Movable/Resizable Windows */}
        {showNetworkWidget && (
          <WindowWrapper
            id="network-widget-window"
            title={
              <div className="flex items-center gap-1.5 font-sans">
                {isNetworkOnline ? <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                <span className="font-sans font-bold">شبکه کلاینت X-Guard</span>
              </div>
            }
            onClose={() => setShowNetworkWidget(false)}
            defaultX={20}
            defaultY={20}
            defaultWidth={300}
            defaultHeight={285}
            minWidth={260}
            minHeight={180}
            activeWindowId={activeWindowId}
            setActiveWindowId={setActiveWindowId}
            isRtl={true}
          >
            <div className="p-4 space-y-3 text-right select-none font-sans" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 font-sans">
                <span className="text-[9px] text-slate-500 font-sans">پایش پهنای باند و وضعیت آنلاین</span>
                <div className="flex items-center gap-1.5 font-sans">
                  <span className={`w-2 h-2 rounded-full ${isNetworkOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                  <span className={`text-[10px] font-bold ${isNetworkOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isNetworkOnline ? 'آنلاین' : 'آفلاین'}
                  </span>
                </div>
              </div>

              {/* Connection Speed Details and Tooltip Trigger */}
              <div 
                className="relative bg-slate-950/50 border border-slate-900 rounded-xl p-3 space-y-2 cursor-help"
                onMouseEnter={() => setShowNetworkTooltip(true)}
                onMouseLeave={() => setShowNetworkTooltip(false)}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">تاخیر شبکه (Ping):</span>
                  <span className={`font-mono font-bold ${isNetworkOnline ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {isNetworkOnline ? `${networkPing} ms` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">سرعت دانلود:</span>
                  <span className={`font-mono font-bold ${isNetworkOnline ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {isNetworkOnline ? `${networkDownload} Mbps` : '0 Mbps'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">سرعت آپلود:</span>
                  <span className={`font-mono font-bold ${isNetworkOnline ? 'text-purple-400' : 'text-slate-600'}`}>
                    {isNetworkOnline ? `${networkUpload} Mbps` : '0 Mbps'}
                  </span>
                </div>

                {/* Progress/speed bar simulation */}
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isNetworkOnline ? 'bg-cyan-500' : 'bg-slate-800'}`} 
                    style={{ width: isNetworkOnline ? `${(networkDownload / 1000) * 100}%` : '0%' }}
                  />
                </div>

                {/* Tooltip implementation */}
                <AnimatePresence>
                  {showNetworkTooltip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 5 }}
                      className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-64 bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-2xl text-right text-[9px] text-slate-300 leading-relaxed z-30 pointer-events-none font-sans"
                    >
                      <p className="font-bold text-cyan-400 mb-1 flex items-center gap-1 justify-end font-sans">
                        <Server className="w-3 h-3" />
                        محدودیت‌های اینترنت فعال کاربر
                      </p>
                      <div className="space-y-1 text-slate-300 font-sans" dir="rtl">
                        <p>🔋 حجم مجاز: <span className="font-bold text-cyan-400">{activeVolume}</span></p>
                        <p>⚡ سرعت دانلود: <span className="font-bold text-emerald-400">{activeDownload}</span></p>
                        <p>📤 سرعت آپلود: <span className="font-bold text-purple-400">{activeUpload}</span></p>
                        <p>⏳ زمان اینترنت: <span className="font-bold text-amber-400">{activeTimeLimit}</span></p>
                      </div>
                      {activeUserCustomInternet && (
                        <p className="mt-1 text-rose-400 font-bold border-t border-slate-900 pt-1 text-[8px] font-sans">
                          ⚠️ سیاست شخصی کلاینت فعال است
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Interactive Toggle Button */}
              <button
                onClick={() => {
                  const nextState = !isNetworkOnline;
                  setIsNetworkOnline(nextState);
                  if (nextState) {
                    playUnlockSound();
                    addLog('success', 'اتصال شبکه کلاینت مجدداً برقرار شد.', activeUser?.username || 'مدیریت');
                    triggerToast('شبکه با موفقیت متصل شد. پهنای باند بازی‌ها فعال شد.', 'info');
                  } else {
                    playDeniedAccessSound();
                    addLog('warning', 'کلاینت شبکه به دستور کاربر به حالت آفلاین رفت.', activeUser?.username || 'مدیریت');
                    triggerToast('شبکه قطع گردید. سیستم در وضعیت آفلاین قرار دارد.', 'warning');
                  }
                  refreshLogs();
                }}
                className={`w-full py-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all duration-200 border flex items-center justify-center gap-1.5 ${
                  isNetworkOnline 
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/30'
                }`}
              >
                <Power className="w-3 h-3" />
                {isNetworkOnline ? 'قطع اتصال فیزیکی شبکه' : 'برقراری اتصال شبکه'}
              </button>
            </div>
          </WindowWrapper>
        )}


        {showPerfWidget && (
          <WindowWrapper
            id="perf-widget-window"
            title={
              <div className="flex items-center gap-1.5 font-sans">
                <Cpu className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="font-sans font-bold">سنسور پایش منابع کلاینت</span>
              </div>
            }
            onClose={() => setShowPerfWidget(false)}
            defaultX={20}
            defaultY={320}
            defaultWidth={300}
            defaultHeight={335}
            minWidth={260}
            minHeight={240}
            activeWindowId={activeWindowId}
            setActiveWindowId={setActiveWindowId}
            isRtl={true}
          >
            <div className="p-4 space-y-4 text-right select-none font-sans" dir="rtl">
              {/* Performance Stats & Sparklines */}
              <div className="space-y-4 font-sans">
                {/* CPU Usage Block */}
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-1 font-sans">
                    <span className="text-slate-400 font-sans">بار پردازنده (CPU Usage):</span>
                    <span className="font-mono font-bold text-cyan-400">{cpuUsage}%</span>
                  </div>
                  
                  {/* Micro progress bar */}
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mb-1.5">
                    <div 
                      className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${cpuUsage}%` }}
                    />
                  </div>

                  {/* Real-time Bezier Sparkline Chart */}
                  <div className="bg-slate-950/60 border border-slate-900/60 rounded-lg p-1.5 flex items-center justify-center">
                    {(() => {
                      const cpuPoints = cpuHistory.map((val, idx) => {
                        const x = (idx / (cpuHistory.length - 1)) * 240;
                        const y = 32 - (val / 100) * 28 - 2; // Scaled for 32px height
                        return `${x},${y}`;
                      });
                      const cpuPathD = `M ${cpuPoints.join(' L ')}`;
                      const cpuAreaD = `${cpuPathD} L 240,32 L 0,32 Z`;
                      
                      return (
                        <svg width="100%" height="32" viewBox="0 0 240 32" className="overflow-visible">
                          <defs>
                            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25"/>
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>
                          <path d={cpuAreaD} fill="url(#cpuGrad)" />
                          <path d={cpuPathD} fill="none" stroke="#06b6d4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="240" cy={32 - (cpuUsage / 100) * 28 - 2} r="2.5" fill="#06b6d4" className="animate-ping" />
                          <circle cx="240" cy={32 - (cpuUsage / 100) * 28 - 2} r="1.5" fill="#22d3ee" />
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* RAM Usage Block */}
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-1 font-sans">
                    <span className="text-slate-400 font-sans">حافظه رم (RAM Usage):</span>
                    <span className="font-mono font-bold text-purple-400">
                      {ramUsage}% <span className="text-[9px] text-slate-500 font-sans">({((ramUsage * 16) / 100).toFixed(1)} GB / 16 GB)</span>
                    </span>
                  </div>
                  
                  {/* Micro progress bar */}
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mb-1.5">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${ramUsage}%` }}
                    />
                  </div>

                  {/* Real-time Bezier Sparkline Chart */}
                  <div className="bg-slate-950/60 border border-slate-900/60 rounded-lg p-1.5 flex items-center justify-center">
                    {(() => {
                      const ramPoints = ramHistory.map((val, idx) => {
                        const x = (idx / (ramHistory.length - 1)) * 240;
                        const y = 32 - (val / 100) * 28 - 2; // Scaled for 32px height
                        return `${x},${y}`;
                      });
                      const ramPathD = `M ${ramPoints.join(' L ')}`;
                      const ramAreaD = `${ramPathD} L 240,32 L 0,32 Z`;
                      
                      return (
                        <svg width="100%" height="32" viewBox="0 0 240 32" className="overflow-visible">
                          <defs>
                            <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25"/>
                              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>
                          <path d={ramAreaD} fill="url(#ramGrad)" />
                          <path d={ramPathD} fill="none" stroke="#a855f7" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="240" cy={32 - (ramUsage / 100) * 28 - 2} r="2.5" fill="#a855f7" className="animate-ping" />
                          <circle cx="240" cy={32 - (ramUsage / 100) * 28 - 2} r="1.5" fill="#c084fc" />
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </WindowWrapper>
        )}

        {/* ACTIVE SIMULATED APP WINDOWS */}
        {simulatedApps.filter(a => a.status === 'running').map((app, index) => (
          <WindowWrapper
            key={app.id}
            id={`app-${app.id}`}
            title={
              <div className="flex items-center gap-2">
                <span>{app.icon}</span>
                <span>{app.name} - شبیه‌ساز گیمنت X-Guard</span>
              </div>
            }
            onClose={() => closeApp(app.id)}
            defaultX={180 + (index * 25) % 200}
            defaultY={120 + (index * 25) % 150}
            defaultWidth={450}
            defaultHeight={280}
            activeWindowId={activeWindowId}
            setActiveWindowId={setActiveWindowId}
            isRtl={true}
          >
            {/* Window Content */}
            <div className="p-6 text-center space-y-4 select-text">
              {app.category === 'Game' ? (
                <div className="space-y-3 py-2">
                  <div className="text-3xl animate-bounce">{app.icon}</div>
                  <h4 className="font-bold text-sm text-cyan-400">بازی {app.name} در حال اجراست</h4>
                  <div className="font-mono text-[10px] text-slate-500 space-y-1" dir="ltr">
                    <p>Process: {app.processName} (PID: {Math.floor(Math.random() * 8000 + 1000)})</p>
                    <p>Graphics Driver: Direct3D 12 (Shader Model 6.6)</p>
                    <p className="text-emerald-500">Framerate: {Math.floor(Math.random() * 20 + 140)} FPS</p>
                  </div>
                  <div className="h-1.5 w-32 bg-slate-900 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full animate-pulse w-full" />
                  </div>
                </div>
              ) : app.processName === 'taskmgr.exe' ? (
                <div className="space-y-3 py-1" dir="ltr">
                  <h4 className="font-bold text-sm text-lime-400 text-right">Windows Task Manager - Admin Mode</h4>
                  <div className="text-left font-mono text-[11px] text-slate-400 space-y-1 p-3 bg-slate-950 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-lime-500 font-bold">[!] BYPASS SECURITY ACTIVE</p>
                    <p>• system.exe - 0.4% CPU - 22MB RAM</p>
                    <p className="text-cyan-400 font-bold">• xguard.exe - 0.01% CPU - 12MB RAM [PROTECTED]</p>
                    <p>• cs2.exe - 12.8% CPU - 3450MB RAM</p>
                    <p>• steam_client.exe - 1.1% CPU - 180MB RAM</p>
                  </div>
                  <p className="text-[10px] text-slate-500 text-right" dir={lang === 'fa' ? 'rtl' : 'ltr'}>{t('taskmgr_note')}</p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="text-2xl">{app.icon}</div>
                  <h4 className="font-bold text-xs">{app.name} Client running</h4>
                  <p className="text-[10px] text-slate-500" dir={lang === 'fa' ? 'rtl' : 'ltr'}>{t('app_monitor_note')}</p>
                </div>
              )}
            </div>
          </WindowWrapper>
        ))}

        {/* ACTIVE USER FULL DASHBOARD WINDOW */}
        {activeUser && showUserDashboard && (
          <WindowWrapper
            id="user-dashboard-window"
            title={
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-cyan-400" />
                <span>{t('user_panel_title')} {activeUser.username}</span>
              </div>
            }
            onClose={() => setShowUserDashboard(false)}
            defaultX={220}
            defaultY={80}
            defaultWidth={520}
            defaultHeight={540}
            activeWindowId={activeWindowId}
            setActiveWindowId={setActiveWindowId}
            isRtl={true}
          >
            {/* Tab navigation headers */}
            <div className="bg-slate-950 px-4 pt-2 flex border-b border-slate-800 gap-2">
              <button
                onClick={() => setUserPanelTab('account')}
                className={`py-2 px-3 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
                  userPanelTab === 'account'
                    ? `border-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 text-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 bg-slate-900/40`
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('tab_account')}
              </button>
              <button
                onClick={() => setUserPanelTab('apps')}
                className={`py-2 px-3 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
                  userPanelTab === 'apps'
                    ? `border-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 text-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 bg-slate-900/40`
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('tab_apps')}
              </button>
              <button
                onClick={() => setUserPanelTab('customization')}
                className={`py-2 px-3 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
                  userPanelTab === 'customization'
                    ? `border-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 text-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 bg-slate-900/40`
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('tab_customization')}
              </button>
              <button
                onClick={() => setUserPanelTab('sound-settings')}
                className={`py-2 px-3 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
                  userPanelTab === 'sound-settings'
                    ? `border-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 text-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 bg-slate-900/40`
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('tab_sound')}
              </button>
              <button
                onClick={() => setUserPanelTab('feedback')}
                className={`py-2 px-3 text-xs font-bold transition-all border-b-2 rounded-t-lg ${
                  userPanelTab === 'feedback'
                    ? `border-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 text-${uTheme.accent === 'cyan' ? 'cyan' : uTheme.accent}-400 bg-slate-900/40`
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('tab_feedback')}
              </button>
            </div>

            <div className="bg-slate-900/40 p-5 space-y-5 overflow-y-auto max-h-[460px]">
              {userPanelTab === 'account' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Stats & Recharge Code */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Promo Code Redeemer inside panel */}
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4" />
                        {t('promo_title')}
                      </h4>
                      <div className="space-y-2">
                        <input
                          id="user-panel-promo-input"
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-center font-mono focus:outline-none focus:border-cyan-500 text-slate-100"
                          placeholder={t('promo_placeholder')}
                          value={userPromoInput}
                          onChange={(e) => setUserPromoInput(e.target.value)}
                        />
                        <button
                          id="btn-user-panel-promo-submit"
                          onClick={handleUserRedeemPromo}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-[10px] py-1.5 rounded-lg font-black transition cursor-pointer"
                        >
                          {t('promo_btn')}
                        </button>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-slate-300">{t('acc_info_title')}</h4>
                      <div className="space-y-1 text-[11px] text-slate-400">
                        <p>• {t('acc_daily')} {activeUser.dailyMinutes} دقیقه</p>
                        <p>• {t('acc_extended')} {activeUser.totalExtendedMinutes} دقیقه</p>
                        <p className="text-cyan-400 font-bold">• {t('acc_remaining')} {formatSeconds(remainingTime)}</p>
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM SECURITY AND TRIAL EXTENSIONS MODULE */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      ویژگی‌های امنیتی پرمیوم و دوره‌های تمدیدی ویژه X-Guard
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      کدهای هدیه ویژه را در بخش بالای صفحه وارد کرده و دکمه بررسی را کلیک نمایید تا امکانات ویژه امنیتی دسکتاپ یا تمدید زمان VIP فعال شوند.
                    </p>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      {/* Shield Feature */}
                      <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex flex-col justify-between space-y-2 text-center">
                        <span className="text-[10px] font-black text-slate-200">سپر امنیتی Ultra-Shield</span>
                        <div className="flex justify-center">
                          {activeUser?.unlockedSecurityShield ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black">
                              ✓ فعال شد
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-850 text-slate-500 border border-slate-800 font-bold">
                              🔒 قفل
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">SECURE-SHIELD</span>
                      </div>

                      {/* Firewall Feature */}
                      <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex flex-col justify-between space-y-2 text-center">
                        <span className="text-[10px] font-black text-slate-200">فایروال کم‌تاخیر</span>
                        <div className="flex justify-center">
                          {activeUser?.unlockedFirewall ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black">
                              ✓ فعال شد
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-850 text-slate-500 border border-slate-800 font-bold">
                              🔒 قفل
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">FAST-FIREWALL</span>
                      </div>

                      {/* VIP Extended Trial Feature */}
                      <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex flex-col justify-between space-y-2 text-center">
                        <span className="text-[10px] font-black text-slate-200">شارژ ۵ ساعته VIP</span>
                        <div className="flex justify-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-black">
                            تمدید آزمایشی
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">TRIAL-VIP</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          if (!userPromoInput.trim()) {
                            triggerToast('لطفاً ابتدا کد تخفیف یا هدیه امنیتی را در فیلد بالا وارد کنید.', 'warning');
                            return;
                          }
                          handleUserRedeemPromo();
                        }}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 text-[10px] py-1.5 rounded-lg font-black transition cursor-pointer text-center"
                      >
                        بررسی و فعال‌سازی کد هدیه پرمیوم
                      </button>
                    </div>
                  </div>

                  {/* Password update form */}
                  <form onSubmit={handleUserChangePassword} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-300">تغییر گذرواژه حساب</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">رمز عبور فعلی:</label>
                        <input
                          id="user-old-pass-input"
                          type="password"
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500"
                          value={userOldPass}
                          onChange={(e) => setUserOldPass(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">رمز جدید (حداقل ۸ حرف):</label>
                        <input
                          id="user-new-pass-input"
                          type="password"
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500"
                          value={userNewPass}
                          onChange={(e) => setUserNewPass(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block">عبارت راهنمای رمز عبور (جهت یادآوری):</label>
                      <input
                        id="user-hint-phrase-input"
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500"
                        placeholder="مثلاً: ترکیبی از سال تولد و نام مادرم"
                        value={userPassHint}
                        onChange={(e) => setUserPassHint(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="user-allow-hint-toggle"
                        type="checkbox"
                        className="rounded border-slate-800 bg-slate-900 text-cyan-500"
                        checked={userAllowHint}
                        onChange={(e) => setUserAllowHint(e.target.checked)}
                      />
                      <label htmlFor="user-allow-hint-toggle" className="text-[10px] text-slate-400">نمایش بخشی از کلمه عبور در صفحه ورود مجاز باشد</label>
                    </div>

                    <button
                      id="btn-user-change-password-submit"
                      type="submit"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] py-1.5 rounded-lg font-bold transition cursor-pointer border border-slate-700"
                    >
                      ذخیره اطلاعات امنیتی جدید
                    </button>
                  </form>
                </div>
              )}

              {userPanelTab === 'apps' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Two sections: Add App & Request App */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* section 1: Add app */}
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-emerald-400">افزودن برنامه شخصی</h4>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        شورت‌کات یک برنامه یا بازی را روی دسکتاپ خود اضافه کنید تا بتوانید آن را اجرا کنید.
                      </p>
                      
                      <form onSubmit={handleUserAddApp} className="space-y-2 text-right">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">نام برنامه:</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلاً: Discord"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100"
                            value={addAppName}
                            onChange={(e) => setAddAppName(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">آیکون:</label>
                            <select
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100"
                              value={addAppIcon}
                              onChange={(e) => setAddAppIcon(e.target.value)}
                            >
                              <option value="🎮">🎮 بازی</option>
                              <option value="💬">💬 چت</option>
                              <option value="🌐">🌐 مرورگر</option>
                              <option value="🎬">🎬 رسانه</option>
                              <option value="🎨">🎨 گرافیک</option>
                              <option value="💻">💻 کدنویسی</option>
                              <option value="⚙️">⚙️ سیستمی</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">دسته‌بندی:</label>
                            <select
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100"
                              value={addAppCategory}
                              onChange={(e) => setAddAppCategory(e.target.value as any)}
                            >
                              <option value="Game">بازی</option>
                              <option value="Utility">کاربردی</option>
                              <option value="System">سیستمی</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">پروسس اجرایی (مثلاً launcher.exe):</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلاً: discord.exe"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100"
                            value={addAppProcess}
                            onChange={(e) => setAddAppProcess(e.target.value)}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-1.5 rounded-lg font-bold transition cursor-pointer"
                        >
                          اضافه کردن به دسکتاپ
                        </button>
                      </form>
                    </div>

                    {/* section 2: Request app access */}
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-purple-400">{t('request_title')}</h4>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        {t('request_desc')}
                      </p>

                      <form onSubmit={handleUserRequestApp} className="space-y-2.5 text-right">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">{t('request_app_name')}</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلاً: GTA VI یا Discord"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100 font-sans"
                            value={customReqAppName}
                            onChange={(e) => setCustomReqAppName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">{t('request_category')}</label>
                          <select
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer"
                            value={reqAppCategory}
                            onChange={(e) => setReqAppCategory(e.target.value as any)}
                          >
                            <option value="Game">🎮 بازی</option>
                            <option value="Utility">🌐 کاربردی</option>
                            <option value="System">⚙️ سیستمی</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">{t('request_purpose')}</label>
                          <input
                            type="text"
                            required
                            placeholder={t('request_purpose_placeholder')}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100 font-sans"
                            value={reqAppPurpose}
                            onChange={(e) => setReqAppPurpose(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">{t('request_desc_more')}</label>
                          <input
                            type="text"
                            placeholder="مثلاً: نسخه اورجینال استیم"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500 text-slate-100 font-sans"
                            value={reqAppDesc}
                            onChange={(e) => setReqAppDesc(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[10px] py-1.5 rounded-lg font-bold transition cursor-pointer"
                        >
                          {t('request_submit_btn')}
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* List of active user's requests */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-300">{t('request_list_title')}</h4>
                    {appRequests.filter(r => r.username === activeUser?.username).length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-2">{t('request_no_reqs')}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {appRequests.filter(r => r.username === activeUser?.username).map((req) => (
                          <div key={req.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/60 px-3 py-1.5 rounded-lg text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{req.appName}</span>
                              <span className="text-slate-500 text-[8px]">({req.category})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[8px] text-slate-500">{req.timestamp}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                                req.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : req.status === 'rejected'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {req.status === 'approved' ? 'تأیید شده' : req.status === 'rejected' ? 'رد شده' : 'در انتظار ادمین'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {userPanelTab === 'customization' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* LIVE PREVIEW GAMER ID CARD (Dynamic Customization Showcase) */}
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 shadow-[0_0_20px_rgba(6,182,212,0.1)] text-right">
                    {/* Glass glare effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                    <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />
                    <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-4">
                      <span className="text-[9px] font-black tracking-widest text-cyan-400 font-mono">X-GUARD SECURE PASSPORT</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center text-3xl shadow-inner relative shrink-0">
                        <div className="absolute inset-0 border border-white/[0.05] rounded-2xl pointer-events-none" />
                        <span>{activeUser?.avatar || '👤'}</span>
                      </div>

                      {/* Text details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-black text-slate-100 truncate">
                            {userGamerTag || activeUser?.username || 'Gamer_Tag'}
                          </h5>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-mono font-black ${uTheme.bgTransparent} ${uTheme.text} border ${uTheme.borderTransparent}`}>
                            {activeUser?.themeColor?.toUpperCase() || 'CYAN'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 italic truncate leading-relaxed">
                          "{userBio || 'Live fast, game hard!'}"
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                            UID: {activeUser?.id?.substring(0, 8) || 'SYSTEM'}
                          </span>
                          <span className="text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                            کلاینت: {settings.gamenetName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Section 1: Gamer Tag & Bio */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-4">
                    <h4 className={`text-xs font-black ${uTheme.text} flex items-center gap-1.5`}>
                      <Edit2 className="w-4 h-4" />
                      {t('profile_slogan_title')}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">{t('gamer_tag_label')}</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-cyan-500 text-slate-100 font-bold"
                          placeholder="مثال: Cyber_Hero"
                          value={userGamerTag}
                          onChange={(e) => setUserGamerTag(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">{t('bio_label')}</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-cyan-500 text-slate-100"
                          placeholder="مثال: No Lag, Just Skill!"
                          value={userBio}
                          onChange={(e) => setUserBio(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdateUserProfile({ gamerTag: userGamerTag, bio: userBio })}
                      className={`w-full ${uTheme.bg} hover:${uTheme.bgHover} ${uTheme.textBtn} text-[10px] py-2 rounded-lg font-black transition cursor-pointer shadow-md ${uTheme.shadow}`}
                    >
                      {t('save_profile_btn')}
                    </button>
                  </div>

                  {/* Section 2: Avatar Picker */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <span>{t('avatar_picker_title')}</span>
                      <span className="text-[9px] text-slate-500 font-normal">(کلیک برای اعمال فوری)</span>
                    </h4>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {['👤', '🎮', '🕹️', '🦸‍♂️', '🥷', '🧙‍♂️', '🤖', '👽', '🦊', '🐯', '⚡', '💎', '🐉', '🔥', '👑'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleUpdateUserProfile({ avatar: emoji })}
                          className={`w-10 h-10 text-lg rounded-xl flex items-center justify-center transition cursor-pointer border ${
                            (activeUser.avatar || '👤') === emoji
                              ? `${uTheme.border} bg-slate-900 scale-110 shadow-lg ${uTheme.shadow}`
                              : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Theme Color Picker */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <span>{t('theme_picker_title')}</span>
                    </h4>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { id: 'cyan', name: 'سایان', colorClass: 'bg-cyan-500' },
                        { id: 'emerald', name: 'ونوم', colorClass: 'bg-emerald-500' },
                        { id: 'purple', name: 'پرتو بنفش', colorClass: 'bg-purple-500' },
                        { id: 'amber', name: 'شنگرف', colorClass: 'bg-amber-500' },
                        { id: 'rose', name: 'روبی', colorClass: 'bg-rose-500' },
                        { id: 'indigo', name: 'آبی کازمیک', colorClass: 'bg-indigo-500' }
                      ].map((th) => (
                        <button
                          key={th.id}
                          onClick={() => handleUpdateUserProfile({ themeColor: th.id as any })}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                            (activeUser.themeColor || 'cyan') === th.id
                              ? `${uTheme.border} bg-slate-900 shadow-md`
                              : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-800'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full ${th.colorClass} shadow-inner`} />
                          <span className="text-[8px] font-black text-slate-400">{th.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Wallpaper Selector */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <span>{t('wallpaper_picker_title')}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                      {[
                        { 
                          id: 'grid', 
                          title: 'شبکه دیجیتال (Grid)', 
                          desc: 'طرح اصلی اتمسفر گیمنت',
                          preview: 'bg-gradient-to-br from-indigo-950 to-slate-950 border-indigo-500/20' 
                        },
                        { 
                          id: 'neon', 
                          title: 'شفق بنفش نئون (Neon)', 
                          desc: 'پوسته‌ مدرن سایبرپانکی',
                          preview: 'bg-gradient-to-br from-fuchsia-950 to-slate-950 border-pink-500/20' 
                        },
                        { 
                          id: 'cosmic', 
                          title: 'ستاره‌های عمیق (Cosmic)', 
                          desc: 'فضای کیهانی پرستاره ملایم',
                          preview: 'bg-gradient-to-br from-sky-950 to-slate-950 border-cyan-500/20' 
                        },
                        { 
                          id: 'minimal', 
                          title: 'کربن مشکی (Carbon)', 
                          desc: 'طرح تیره ملایم و چشم‌نواز',
                          preview: 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/20' 
                        },
                      ].map((wall) => (
                        <button
                          key={wall.id}
                          onClick={() => handleUpdateUserProfile({ wallpaper: wall.id as any })}
                          className={`p-2 rounded-xl border text-right transition cursor-pointer flex gap-2 items-center ${
                            (activeUser.wallpaper || 'grid') === wall.id
                              ? `${uTheme.border} bg-slate-900 shadow-md`
                              : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${wall.preview} border flex-shrink-0`} />
                          <div className="leading-tight">
                            <p className="text-[10px] font-black text-slate-200">{wall.title}</p>
                            <p className="text-[8px] text-slate-500 mt-0.5">{wall.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* AI Generator Box */}
                    <div className="mt-3 bg-slate-900/60 border border-cyan-500/20 p-3.5 rounded-xl space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-black text-cyan-400">تصویرساز هوش مصنوعی والپیپر (Imagen 4)</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold block">توصیف والپیپر سایبرپانک خود را بنویسید:</label>
                        <textarea
                          rows={2}
                          value={aiWallpaperPrompt}
                          onChange={(e) => setAiWallpaperPrompt(e.target.value)}
                          placeholder="مثال: یک اژدهای طلایی نئونی روی سقف برج‌های گیم‌نت در یک شب بارانی"
                          className="w-full bg-slate-950/80 border border-slate-850 focus:border-cyan-500/50 rounded-lg text-[10px] py-2 px-2.5 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none leading-relaxed"
                          disabled={isGeneratingWallpaper}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex gap-1">
                          {[
                            { id: 'neon-cyber', name: 'سایبر نئون' },
                            { id: 'cosmic-star', name: 'کازمیک استار' },
                            { id: 'vector-flat', name: 'وکتور تخت' }
                          ].map(st => (
                            <button
                              key={st.id}
                              onClick={() => setAiWallpaperStyle(st.id)}
                              type="button"
                              className={`px-2 py-1 rounded text-[8px] font-black transition cursor-pointer ${
                                aiWallpaperStyle === st.id
                                  ? 'bg-cyan-500 text-slate-950 font-black'
                                  : 'bg-slate-950 text-slate-400 hover:bg-slate-850'
                              }`}
                              disabled={isGeneratingWallpaper}
                            >
                              {st.name}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleGenerateAiWallpaper}
                          disabled={isGeneratingWallpaper}
                          type="button"
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-[10px] rounded-lg shadow-lg shadow-cyan-500/10 cursor-pointer transition flex items-center gap-1"
                        >
                          {isGeneratingWallpaper ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>در حال تولید...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>تولید والپیپر هوشمند</span>
                            </>
                          )}
                        </button>
                      </div>

                      {isGeneratingWallpaper && (
                        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg text-center space-y-2 animate-fadeIn">
                          <p className="text-[9px] text-cyan-400 font-bold animate-pulse">{generatingProgressText}</p>
                          <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden relative">
                            <motion.div 
                              className="h-full bg-cyan-500 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 10, ease: "easeInOut" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 5: Language Selection */}
                  <LanguageSelector
                    activeUser={activeUser}
                    onUpdateUserProfile={handleUpdateUserProfile}
                    t={t}
                  />

                  {/* Section 6: System Notification Tests */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                      <span>🔔 تست اعلان‌های هوشمند سیستم</span>
                    </h4>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      شبیه‌ساز اعلان‌های سیستمی بالا رونده را فورا تست کنید. این سیستم رویدادهای فایروال و پچ‌های کلاینت را به شما هشدار می‌دهد.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => triggerSystemAlert(
                          'update',
                          'درخواست تست به‌روزرسانی',
                          'ماژول شبیه‌سازی سیستم و پچ‌های بازی‌های گیم‌نت با موفقیت تست شد.'
                        )}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-[10px] py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                        تست اعلان بروزرسانی
                      </button>
                      <button
                        onClick={() => triggerSystemAlert(
                          'security',
                          'هشدار امنیتی فرضی',
                          'تست موفقیت‌آمیز فایروال امنیتی محلی؛ یک ترافیک شبکه غیرمجاز در کلاینت شماره ۷ دفع شد.'
                        )}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-[10px] py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Shield className="w-3.5 h-3.5 text-red-400" />
                        تست اعلان امنیتی
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {userPanelTab === 'sound-settings' && (
                <div className="space-y-5 animate-fadeIn text-right">
                  <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                      <Volume2 className={`w-5 h-5 ${uTheme.text}`} />
                      <div>
                        <h4 className="text-xs font-black text-slate-200">مدیریت هشدارهای صوتی سیستم (Sound Cues)</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">سیستم‌های چندرسانه‌ای و بوق‌های هشدار رویدادهای امنیتی کلاینت را سفارشی‌سازی کنید.</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Toggle 1: Successful login */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-850">
                        <div className="space-y-0.5 text-right pl-4">
                          <span className="text-xs font-bold text-slate-200 block">صدای ورود موفقیت‌آمیز (Successful Login)</span>
                          <span className="text-[10px] text-slate-500 block">پخش یک ملودی دلنشین دیجیتالی پس از وارد کردن رمز عبور صحیح.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={activeUser?.soundSuccessfulLogin !== false}
                            onChange={(e) => handleUpdateUserProfile({ soundSuccessfulLogin: e.target.checked })}
                          />
                          <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
                        </label>
                      </div>

                      {/* Toggle 2: Denied access */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-850">
                        <div className="space-y-0.5 text-right pl-4">
                          <span className="text-xs font-bold text-slate-200 block">صدای خطای دسترسی مسدود شده (Denied Access)</span>
                          <span className="text-[10px] text-slate-500 block">پخش صدای بوق بم هشدار در صورت ورود رمز اشتباه یا تلاش برای گشودن ابزار سیستمی فیلتر شده.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={activeUser?.soundDeniedAccess !== false}
                            onChange={(e) => handleUpdateUserProfile({ soundDeniedAccess: e.target.checked })}
                          />
                          <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
                        </label>
                      </div>

                      {/* Toggle 3: Lockouts */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-850">
                        <div className="space-y-0.5 text-right pl-4">
                          <span className="text-xs font-bold text-slate-200 block">صدای وضعیت قفل امنیتی (Lockout Siren)</span>
                          <span className="text-[10px] text-slate-500 block">پخش آژیر هشدار در زمان مسدودسازی ۳۰ ثانیه‌ای کلاینت به دلیل ۳ تلاش ناموفق متوالی.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={activeUser?.soundLockout !== false}
                            onChange={(e) => handleUpdateUserProfile({ soundLockout: e.target.checked })}
                          />
                          <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Immediate sound tester */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h5 className="text-[11px] font-black text-slate-400">تست بلادرنگ هشدارهای انتخابی شما</h5>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => playUnlockSound()}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] py-2 rounded-lg font-bold transition cursor-pointer hover:border-cyan-500/30"
                      >
                        تست زنگ ورود
                      </button>
                      <button
                        type="button"
                        onClick={() => playDeniedAccessSound()}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] py-2 rounded-lg font-bold transition cursor-pointer hover:border-cyan-500/30"
                      >
                        تست هشدار خطا
                      </button>
                      <button
                        type="button"
                        onClick={() => playSystemLockoutSound()}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] py-2 rounded-lg font-bold transition cursor-pointer hover:border-cyan-500/30"
                      >
                        تست زنگ قفل موقت
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {userPanelTab === 'feedback' && (
                <div className="space-y-5 animate-fadeIn text-right" dir="rtl">
                  {/* Title Section */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-100 flex items-center gap-2 font-bold">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        ثبت نظرات، بازخوردها و گزارشات کلاینت
                      </h4>
                      <p className="text-[10px] text-slate-500">مشکلات سخت‌افزاری، نرم‌افزاری یا کیفیت خدمات را مستقیماً به مدیریت گزارش کنید.</p>
                    </div>
                    <span className="text-[9px] text-cyan-500 font-mono">FEEDBACK-HUB</span>
                  </div>

                  {/* Feedback Form */}
                  <form onSubmit={handleFeedbackSubmit} className="bg-slate-950/40 border border-slate-900/80 backdrop-blur-md p-5 rounded-2xl space-y-4 shadow-lg shadow-cyan-500/5">
                    {/* Rating Selection */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">امتیاز شما به سیستم و خدمات:</span>
                      <div className="flex items-center gap-1.5" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="p-1 transition-all duration-200 transform hover:scale-115 cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= feedbackRating
                                  ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]'
                                  : 'text-slate-700 hover:text-slate-500'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-[10px] text-slate-500 ml-2 font-mono" dir="rtl">
                          ({feedbackRating} از ۵ ستاره)
                        </span>
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">دسته‌بندی گزارش / بازخورد:</label>
                      <select
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans cursor-pointer"
                      >
                        <option value="service">کیفیت خدمات و سرعت اینترنت کلاینت</option>
                        <option value="hardware">مشکل سخت‌افزاری و لوازم جانبی (کیبورد، موس، هدست)</option>
                        <option value="software">مشکل بازی‌ها یا برنامه‌ها (نیاز به آپدیت، کرش یا قفل)</option>
                        <option value="other">پیشنهادات، انتقادات یا سایر موارد</option>
                      </select>
                    </div>

                    {/* Comment text area */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">توضیحات و پیام شما:</label>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="مشکل خود یا پیشنهاد بهبود سیستم را به همراه شماره سیستم با جزییات کامل یادداشت فرمایید..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-3 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed text-right"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg text-xs font-black bg-cyan-500 hover:bg-cyan-600 text-slate-950 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition duration-200 cursor-pointer"
                    >
                      ارسال نهایی بازخورد به مدیریت
                    </button>
                  </form>

                  {/* Past User Feedbacks */}
                  <div className="space-y-3">
                    <h5 className="text-[11px] font-black text-slate-400">تاریخچه گزارشات و بازخوردهای ارسالی شما:</h5>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {feedbacks.filter(f => f.username === activeUser.username).length === 0 ? (
                        <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 text-center text-[10px] text-slate-600">
                          شما هنوز بازخوردی در سیستم ثبت نکرده‌اید.
                        </div>
                      ) : (
                        feedbacks
                          .filter(f => f.username === activeUser.username)
                          .map((fb) => (
                            <div key={fb.id} className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl space-y-2.5">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-300">
                                      {fb.category === 'hardware' && '💻 سخت‌افزار'}
                                      {fb.category === 'software' && '🎮 نرم‌افزار و بازی'}
                                      {fb.category === 'service' && '⚡ سرعت و خدمات'}
                                      {fb.category === 'other' && '⚙️ سایر موارد'}
                                    </span>
                                    <div className="flex items-center gap-0.5" dir="ltr">
                                      {Array.from({ length: fb.rating }).map((_, i) => (
                                        <Star key={i} className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-[9px] text-slate-500 block font-mono">
                                    {new Date(fb.timestamp).toLocaleDateString('fa-IR')} - {new Date(fb.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  fb.status === 'resolved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : fb.status === 'reviewed'
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {fb.status === 'resolved' ? 'برطرف شده' : fb.status === 'reviewed' ? 'بررسی شده' : 'در حال بررسی'}
                                </span>
                              </div>

                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{fb.comment}</p>

                              {fb.adminResponse && (
                                <div className="bg-cyan-500/5 border-r-2 border-cyan-500/30 p-2 rounded-l-lg space-y-0.5 text-right mt-1.5">
                                  <span className="text-[9px] text-cyan-400 font-black block">پاسخ مدیریت گیمنت:</span>
                                  <p className="text-[10px] text-slate-300 font-sans leading-relaxed">{fb.adminResponse}</p>
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WindowWrapper>
        )}

        {/* WIFI & NETWORK CARDS SETTINGS WINDOW */}
        {showWifiWindow && (
          <WindowWrapper
            id="wifi-settings-window"
            title={
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span>{t('wifi_title')}</span>
              </div>
            }
            onClose={() => setShowWifiWindow(false)}
            defaultX={250}
            defaultY={100}
            defaultWidth={480}
            defaultHeight={500}
            activeWindowId={activeWindowId}
            setActiveWindowId={setActiveWindowId}
            isRtl={lang === 'fa'}
          >
            <div className={`p-4 space-y-4 select-none font-sans ${lang === 'fa' ? 'text-right' : 'text-left'}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800 gap-1.5 pb-2">
                <button
                  onClick={() => setShowManualWifiForm(false)}
                  className={`py-1.5 px-3 text-[11px] font-bold rounded-lg transition-all ${
                    !showManualWifiForm
                      ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400'
                      : 'border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('tab_wifi_networks')}
                </button>
                <button
                  onClick={() => setShowManualWifiForm(true)}
                  className={`py-1.5 px-3 text-[11px] font-bold rounded-lg transition-all ${
                    showManualWifiForm
                      ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400'
                      : 'border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('tab_ethernet_settings')}
                </button>
              </div>

              {!showManualWifiForm ? (
                // Wi-Fi TAB
                <div className="space-y-4">
                  {/* Master Switch */}
                  <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-2">
                      <Wifi className={`w-4 h-4 ${wifiCardEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <div className={lang === 'fa' ? 'text-right' : 'text-left'}>
                        <div className="text-[11px] font-bold text-slate-200">{t('wifi_adapter_label')}</div>
                        <div className="text-[9px] text-slate-500 font-mono">Intel(R) Wi-Fi 6E AX211 160MHz</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setWifiCardEnabled(!wifiCardEnabled);
                        if (wifiCardEnabled) {
                          setConnectedWifi('');
                        } else {
                          setConnectedWifi('X-Guard_HighSpeed_5G');
                        }
                      }}
                      className={`relative w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                        wifiCardEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform duration-200 ${
                        (wifiCardEnabled && lang === 'fa') || (!wifiCardEnabled && lang !== 'fa') ? '-translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {wifiCardEnabled ? (
                    <>
                      {/* Connected Wifi Info */}
                      {connectedWifi ? (
                        <div className="bg-slate-900/40 border border-cyan-500/30 p-3 rounded-xl space-y-2 relative">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[11px] text-slate-300">{t('wifi_connected_to')}<strong className="text-cyan-400">{connectedWifi}</strong></span>
                            </div>
                            <button
                              onClick={() => {
                                setConnectedWifi('');
                                triggerToast(lang === 'fa' ? 'از شبکه وای‌فای قطع شدید.' : 'Disconnected from Wi-Fi stream.', 'warning');
                              }}
                              className="text-[9px] text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded cursor-pointer"
                            >
                              {t('wifi_disconnect_btn')}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400 font-mono mt-1">
                            <div>{t('wifi_ip_addr')} <span className="text-slate-300 font-rounded-num">192.168.1.155</span></div>
                            <div>{t('wifi_signal_strength')} <span className="text-emerald-400">{t('wifi_excellent')}</span></div>
                            <div>{t('wifi_security')} <span className="text-slate-300 font-rounded-num">WPA3-Personal</span></div>
                            <div>{t('wifi_link_speed')} <span className="text-slate-300 font-rounded-num">1.2 Gbps</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-950/40 border border-rose-500/20 p-3 rounded-xl text-center text-[10px] text-slate-400">
                          {t('wifi_no_connection')}
                        </div>
                      )}

                      {/* Password Prompt */}
                      {wifiPasswordTarget && (
                        <div className="bg-slate-900/60 border border-cyan-500/30 p-3 rounded-xl space-y-2 animate-fadeIn">
                          <div className="text-[10px] text-slate-300 font-bold">{t('wifi_pass_prompt')}{wifiPasswordTarget}:</div>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono text-left"
                              placeholder="••••••••"
                              value={wifiPasswordInput}
                              onChange={(e) => setWifiPasswordInput(e.target.value)}
                            />
                            <button
                              onClick={() => {
                                if (wifiPasswordInput.length < 4) {
                                  triggerToast(t('wifi_pass_short_err'), 'error');
                                  return;
                                }
                                const target = wifiPasswordTarget;
                                setConnectingToWifi(target);
                                setWifiPasswordTarget(null);
                                setWifiPasswordInput('');
                                setTimeout(() => {
                                  setConnectingToWifi(null);
                                  setConnectedWifi(target);
                                  setWifiList(prev => prev.map(w => ({
                                    ...w,
                                    connected: w.ssid === target
                                  })));
                                  triggerToast(t('wifi_connected_success'), 'info');
                                  addLog('info', `Gamer connected to Wi-Fi stream ${target}.`, activeUser.username);
                                }, 1500);
                              }}
                              className="bg-cyan-500 text-slate-950 text-[10px] px-3 py-1 rounded font-bold hover:bg-cyan-400 transition cursor-pointer"
                            >
                              {t('wifi_btn_connect')}
                            </button>
                            <button
                              onClick={() => setWifiPasswordTarget(null)}
                              className="bg-slate-800 text-slate-300 text-[10px] px-2.5 py-1 rounded hover:bg-slate-700 transition cursor-pointer"
                            >
                              {t('wifi_btn_cancel')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Available Networks List */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-slate-500 mr-1">{t('wifi_networks_found')}</div>
                        <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-2 max-h-[160px] overflow-y-auto space-y-1">
                          {connectingToWifi ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-2">
                              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                              <span className="text-[10px] text-slate-400">{t('wifi_negotiating')}</span>
                            </div>
                          ) : (
                            wifiList.map(wifi => (
                              <div
                                key={wifi.ssid}
                                onClick={() => {
                                  if (wifi.connected) return;
                                  if (wifi.secure) {
                                    setWifiPasswordTarget(wifi.ssid);
                                  } else {
                                    setConnectingToWifi(wifi.ssid);
                                    setTimeout(() => {
                                      setConnectingToWifi(null);
                                      setConnectedWifi(wifi.ssid);
                                      setWifiList(prev => prev.map(w => ({
                                        ...w,
                                        connected: w.ssid === wifi.ssid
                                      })));
                                      triggerToast(lang === 'fa' ? `اتصال به شبکه باز ${wifi.ssid} برقرار شد.` : `Connected to open stream ${wifi.ssid}.`, 'info');
                                    }, 1000);
                                  }
                                }}
                                className={`flex justify-between items-center p-2 rounded-lg border text-[11px] transition cursor-pointer ${
                                  wifi.connected
                                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold'
                                    : 'bg-slate-900/20 border-transparent hover:bg-slate-900/60 hover:border-slate-800 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Wifi className={`w-3.5 h-3.5 ${wifi.connected ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                                  <span>{wifi.ssid}</span>
                                  {wifi.connected && <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-bold">{t('wifi_status_connected')}</span>}
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                                  <span className="font-rounded-num">{wifi.signal}٪</span>
                                  {wifi.secure && <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{t('wifi_status_secure')}</span>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Manual SSID Form Toggle */}
                      <div className="border-t border-slate-800/40 pt-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">{t('wifi_hidden_prompt')}</span>
                        <button
                          onClick={() => triggerToast(lang === 'fa' ? 'قابلیت اسکن شبکه‌های پنهان فعال شد.' : 'Hidden SSID scanning initiated.', 'info')}
                          className="text-[9px] text-cyan-400 hover:underline font-bold cursor-pointer"
                        >
                          {t('wifi_manual_scan')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                      <WifiOff className="w-8 h-8 text-slate-600" />
                      <span className="text-[11px]">{t('wifi_adapter_disabled')}</span>
                    </div>
                  )}
                </div>
              ) : (
                // ETHERNET TAB
                <div className="space-y-4">
                  {/* Lan Switch */}
                  <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-2">
                      <Server className={`w-4 h-4 ${ethernetCardEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <div className={lang === 'fa' ? 'text-right' : 'text-left'}>
                        <div className="text-[11px] font-bold text-slate-200">{t('ethernet_adapter_label')}</div>
                        <div className="text-[9px] text-slate-500 font-mono">Realtek PCIe 2.5GbE Controller</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEthernetCardEnabled(!ethernetCardEnabled)}
                      className={`relative w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                        ethernetCardEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform duration-200 ${
                        (ethernetCardEnabled && lang === 'fa') || (!ethernetCardEnabled && lang !== 'fa') ? '-translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {ethernetCardEnabled ? (
                    <div className="space-y-3 bg-slate-900/20 p-3 rounded-xl border border-slate-850">
                      {/* Speed Settings */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">{t('ethernet_speed_duplex')}</label>
                          <select
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
                            value={ethernetSpeed}
                            onChange={(e) => setEthernetSpeed(e.target.value)}
                          >
                            <option value="Auto">{t('ethernet_auto')}</option>
                            <option value="100m">100 Mbps Full Duplex</option>
                            <option value="1g">1.0 Gbps Full Duplex</option>
                            <option value="2.5g">2.5 Gbps Full Duplex</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">{t('ethernet_ip_mode')}</label>
                          <select
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
                            value={ethernetDhcp ? 'dhcp' : 'static'}
                            onChange={(e) => setEthernetDhcp(e.target.value === 'dhcp')}
                          >
                            <option value="dhcp">{t('ethernet_dhcp')}</option>
                            <option value="static">{t('ethernet_static')}</option>
                          </select>
                        </div>
                      </div>

                      {/* LAN Parameters */}
                      <div className="space-y-2 border-t border-slate-850 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block">{t('wifi_ip_addr')} (IP Address):</label>
                            <input
                              type="text"
                              disabled={ethernetDhcp}
                              className="w-full bg-slate-950 disabled:bg-slate-900/60 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-mono text-left disabled:text-slate-500"
                              value={ethernetIp}
                              onChange={(e) => setEthernetIp(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block">{t('ethernet_subnet')}</label>
                            <input
                              type="text"
                              disabled={ethernetDhcp}
                              className="w-full bg-slate-950 disabled:bg-slate-900/60 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-mono text-left disabled:text-slate-500"
                              value={ethernetSubnet}
                              onChange={(e) => setEthernetSubnet(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block">{t('ethernet_gateway')}</label>
                            <input
                              type="text"
                              disabled={ethernetDhcp}
                              className="w-full bg-slate-950 disabled:bg-slate-900/60 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-mono text-left disabled:text-slate-500"
                              value={ethernetGateway}
                              onChange={(e) => setEthernetGateway(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 block">{t('ethernet_dns')}</label>
                            <input
                              type="text"
                              disabled={ethernetDhcp}
                              className="w-full bg-slate-950 disabled:bg-slate-900/60 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-mono text-left disabled:text-slate-500"
                              value={ethernetDns}
                              onChange={(e) => setEthernetDns(e.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            triggerToast(t('ethernet_save_success'), 'info');
                            addLog('info', `Wired LAN reconfigured. Speed: ${ethernetSpeed}, Mode: ${ethernetDhcp ? 'DHCP' : 'Static'}.`, activeUser.username);
                          }}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold py-1.5 rounded-lg mt-3 transition duration-150 cursor-pointer"
                        >
                          {t('ethernet_save_btn')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                      <Server className="w-8 h-8 text-slate-600" />
                      <span className="text-[11px]">{t('ethernet_disabled')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </WindowWrapper>
        )}

        {/* SOUND & AUDIO SETTINGS WINDOW */}
        {showSoundWindow && (
          <WindowWrapper
            id="sound-settings-window"
            title={
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>{t('sound_title')}</span>
              </div>
            }
            onClose={() => setShowSoundWindow(false)}
            defaultX={300}
            defaultY={120}
            defaultWidth={490}
            defaultHeight={510}
            activeWindowId={activeWindowId}
            setActiveWindowId={setActiveWindowId}
            isRtl={lang === 'fa'}
          >
            <div className={`p-4 space-y-4 select-none font-sans ${lang === 'fa' ? 'text-right' : 'text-left'}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
              {/* Audio Channels Volumes */}
              <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 mb-2">
                  <span className="text-[11px] font-bold text-slate-200">{t('sound_channels_vol')}</span>
                  <button
                    onClick={() => {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      const vol = soundMasterMuted ? 0 : soundMasterVolume / 100;
                      gain.gain.setValueAtTime(0, ctx.currentTime);
                      gain.gain.linearRampToValueAtTime(vol * 0.15, ctx.currentTime + 0.05);
                      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(440, ctx.currentTime);
                      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.8);
                      triggerToast(t('sound_test_success'), 'info');
                    }}
                    className="text-[9px] text-purple-400 hover:text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    {t('sound_test_btn')}
                  </button>
                </div>

                {/* Master Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span className="font-bold flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      {t('sound_master_label')}
                    </span>
                    <span className="font-mono text-purple-400 font-bold font-rounded-num">{soundMasterMuted ? 'Muted' : `${soundMasterVolume}%`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSoundMasterMuted(!soundMasterMuted)}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                        soundMasterMuted ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {soundMasterMuted ? t('sound_mute') : t('sound_unmute')}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="flex-1 accent-purple-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                      value={soundMasterVolume}
                      onChange={(e) => setSoundMasterVolume(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Game Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t('sound_game_label')}</span>
                    <span className="font-mono font-rounded-num">{soundGameMuted ? 'Muted' : `${soundGameVolume}%`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSoundGameMuted(!soundGameMuted)}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                        soundGameMuted ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {soundGameMuted ? t('sound_mute') : t('sound_unmute')}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="flex-1 accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                      value={soundGameVolume}
                      onChange={(e) => setSoundGameVolume(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* System volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t('sound_system_label')}</span>
                    <span className="font-mono font-rounded-num">{soundSystemMuted ? 'Muted' : `${soundSystemVolume}%`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSoundSystemMuted(!soundSystemMuted)}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                        soundSystemMuted ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {soundSystemMuted ? t('sound_mute') : t('sound_unmute')}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="flex-1 accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                      value={soundSystemVolume}
                      onChange={(e) => setSoundSystemVolume(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Voice Discord Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t('sound_voice_label')}</span>
                    <span className="font-mono font-rounded-num">{soundVoiceMuted ? 'Muted' : `${soundVoiceVolume}%`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSoundVoiceMuted(!soundVoiceMuted)}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                        soundVoiceMuted ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {soundVoiceMuted ? t('sound_mute') : t('sound_unmute')}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="flex-1 accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                      value={soundVoiceVolume}
                      onChange={(e) => setSoundVoiceVolume(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Devices Selection & Microphone Analyzer */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl space-y-2">
                  <label className="text-[10px] text-slate-400 block font-bold">{t('sound_output_device')}</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                    value={soundOutputDevice}
                    onChange={(e) => setSoundOutputDevice(e.target.value)}
                  >
                    <option value="HyperX Cloud III">HyperX Cloud III Headset</option>
                    <option value="ASUS ROG Speakers">ASUS ROG Speakers</option>
                    <option value="Focusrite Solo USB">Focusrite Solo USB</option>
                  </select>
                  <div className="text-[9px] text-slate-500 font-rounded-num">{t('sound_quality')}</div>
                </div>

                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl space-y-2">
                  <label className="text-[10px] text-slate-400 block font-bold">{t('sound_input_device')}</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                    value={soundInputDevice}
                    onChange={(e) => setSoundInputDevice(e.target.value)}
                  >
                    <option value="Blue Yeti USB Microphone">Blue Yeti USB Microphone</option>
                    <option value="HyperX Mic">HyperX Inline Mic</option>
                    <option value="Realtek Audio Input">Realtek Audio Input</option>
                  </select>
                  
                  {/* Real-time Level visualizer */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>{t('sound_mic_level')}</span>
                      <span className="font-mono font-rounded-num">{soundMicLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded overflow-hidden flex flex-row border border-slate-900">
                      <div
                        style={{ width: `${soundMicLevel}%` }}
                        className={`h-full transition-all duration-75 ${
                          soundMicLevel > 60
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Graphic Equalizer */}
              <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                  <span className="text-[11px] font-bold text-slate-200">{t('sound_eq_title')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500">{t('sound_eq_preset')}</span>
                    <select
                      className="bg-slate-950 border border-slate-800 text-purple-400 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                      value={soundEqPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSoundEqPreset(val);
                        if (val === 'گیمینگ') {
                          setSoundEq60Hz(75); setSoundEq230Hz(60); setSoundEq910Hz(50); setSoundEq4kHz(70); setSoundEq14kHz(85);
                        } else if (val === 'موزیک') {
                          setSoundEq60Hz(60); setSoundEq230Hz(50); setSoundEq910Hz(65); setSoundEq4kHz(75); setSoundEq14kHz(70);
                        } else if (val === 'تقویت بیس') {
                          setSoundEq60Hz(95); setSoundEq230Hz(80); setSoundEq910Hz(45); setSoundEq4kHz(40); setSoundEq14kHz(45);
                        } else if (val === 'حالت تخت') {
                          setSoundEq60Hz(50); setSoundEq230Hz(50); setSoundEq910Hz(50); setSoundEq4kHz(50); setSoundEq14kHz(50);
                        }
                        triggerToast(lang === 'fa' ? `پروفایل اکولایزر به "${val}" تغییر یافت.` : `Equalizer preset changed to "${val}".`, 'info');
                      }}
                    >
                      <option value="گیمینگ">{t('sound_preset_gaming')}</option>
                      <option value="موزیک">{t('sound_preset_music')}</option>
                      <option value="تقویت بیس">{t('sound_preset_bass')}</option>
                      <option value="حالت تخت">{t('sound_preset_flat')}</option>
                      <option value="شخصی">{t('sound_preset_custom')}</option>
                    </select>
                  </div>
                </div>

                {/* Equalizer Faders layout */}
                <div className="flex justify-between items-center px-4 py-1.5 font-mono text-[9px] text-slate-400">
                  <div className="flex flex-col items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      orient="vertical"
                      className="accent-purple-500 h-20 w-1 bg-slate-900 rounded"
                      style={{ WebkitAppearance: 'slider-vertical' } as any}
                      value={soundEq60Hz}
                      onChange={(e) => {
                        setSoundEq60Hz(Number(e.target.value));
                        setSoundEqPreset('شخصی');
                      }}
                    />
                    <span>60Hz</span>
                    <span className="text-purple-400 font-bold font-rounded-num">{soundEq60Hz}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      orient="vertical"
                      className="accent-purple-500 h-20 w-1 bg-slate-900 rounded"
                      style={{ WebkitAppearance: 'slider-vertical' } as any}
                      value={soundEq230Hz}
                      onChange={(e) => {
                        setSoundEq230Hz(Number(e.target.value));
                        setSoundEqPreset('شخصی');
                      }}
                    />
                    <span>230Hz</span>
                    <span className="text-purple-400 font-bold font-rounded-num">{soundEq230Hz}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      orient="vertical"
                      className="accent-purple-500 h-20 w-1 bg-slate-900 rounded"
                      style={{ WebkitAppearance: 'slider-vertical' } as any}
                      value={soundEq910Hz}
                      onChange={(e) => {
                        setSoundEq910Hz(Number(e.target.value));
                        setSoundEqPreset('شخصی');
                      }}
                    />
                    <span>910Hz</span>
                    <span className="text-purple-400 font-bold font-rounded-num">{soundEq910Hz}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      orient="vertical"
                      className="accent-purple-500 h-20 w-1 bg-slate-900 rounded"
                      style={{ WebkitAppearance: 'slider-vertical' } as any}
                      value={soundEq4kHz}
                      onChange={(e) => {
                        setSoundEq4kHz(Number(e.target.value));
                        setSoundEqPreset('شخصی');
                      }}
                    />
                    <span>4kHz</span>
                    <span className="text-purple-400 font-bold font-rounded-num">{soundEq4kHz}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      orient="vertical"
                      className="accent-purple-500 h-20 w-1 bg-slate-900 rounded"
                      style={{ WebkitAppearance: 'slider-vertical' } as any}
                      value={soundEq14kHz}
                      onChange={(e) => {
                        setSoundEq14kHz(Number(e.target.value));
                        setSoundEqPreset('شخصی');
                      }}
                    />
                    <span>14kHz</span>
                    <span className="text-purple-400 font-bold font-rounded-num">{soundEq14kHz}</span>
                  </div>
                </div>
              </div>
            </div>
          </WindowWrapper>
        )}

        {/* MOUSE POINTER SENSITIVITY & SPEED WINDOW */}
        {showMouseWindow && (
          <WindowWrapper
            id="mouse-settings-window"
            title={
              <div className="flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{t('mouse_title')}</span>
              </div>
            }
            onClose={() => {
              setShowMouseWindow(false);
              setMouseTrail([]);
            }}
            defaultX={350}
            defaultY={150}
            defaultWidth={470}
            defaultHeight={460}
            activeWindowId={activeWindowId}
            setActiveWindowId={setActiveWindowId}
            isRtl={lang === 'fa'}
          >
            <div className={`p-4 space-y-4 select-none font-sans ${lang === 'fa' ? 'text-right' : 'text-left'}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
              {/* Sensitivity Sliders */}
              <div className="space-y-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="font-bold">{t('mouse_speed_label')}</span>
                    <span className="font-mono text-emerald-400 font-bold font-rounded-num">{mouseSpeed} / 20</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    className="w-full accent-emerald-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                    value={mouseSpeed}
                    onChange={(e) => {
                      setMouseSpeed(Number(e.target.value));
                      triggerToast(`${t('mouse_toast_speed')} ${e.target.value}`, 'info');
                    }}
                  />
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>{t('mouse_slow')}</span>
                    <span>{t('mouse_normal')}</span>
                    <span>{t('mouse_fast')}</span>
                  </div>
                </div>

                {/* Enhance Precision Toggle */}
                <div className="flex justify-between items-center border-t border-slate-850/60 pt-3">
                  <div className={lang === 'fa' ? 'text-right' : 'text-left'}>
                    <label htmlFor="mouse-precision-toggle" className="text-[11px] font-bold text-slate-200 cursor-pointer block">{t('mouse_precision_label')}</label>
                    <span className="text-[9px] text-slate-500">{t('mouse_precision_desc')}</span>
                  </div>
                  <button
                    id="mouse-precision-toggle"
                    onClick={() => {
                      setMousePrecision(!mousePrecision);
                      triggerToast(mousePrecision ? t('mouse_toast_precision_off') : t('mouse_toast_precision_on'), 'info');
                    }}
                    className={`relative w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                      mousePrecision ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform duration-200 ${
                      (mousePrecision && lang === 'fa') || (!mousePrecision && lang !== 'fa') ? '-translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Scroll Speed & Swap buttons */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl space-y-2">
                  <label className="text-[10px] text-slate-400 block font-bold">{t('mouse_primary_label')}</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        setMousePrimarySwap('left');
                        triggerToast(t('mouse_toast_primary_left'), 'info');
                      }}
                      className={`text-[10px] font-bold py-1 px-2 rounded border transition cursor-pointer ${
                        mousePrimarySwap === 'left'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t('mouse_primary_left')}
                    </button>
                    <button
                      onClick={() => {
                        setMousePrimarySwap('right');
                        triggerToast(t('mouse_toast_primary_right'), 'info');
                      }}
                      className={`text-[10px] font-bold py-1 px-2 rounded border transition cursor-pointer ${
                        mousePrimarySwap === 'right'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t('mouse_primary_right')}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-bold">{t('mouse_scroll_label')}</span>
                    <span className="font-mono text-emerald-400 font-rounded-num">{mouseScrollSpeed} {t('mouse_scroll_unit')}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg cursor-pointer mt-2"
                    value={mouseScrollSpeed}
                    onChange={(e) => setMouseScrollSpeed(Number(e.target.value))}
                  />
                  <div className="text-[8px] text-slate-500 text-center">{t('mouse_scroll_notch')}</div>
                </div>
              </div>

              {/* Interactive Mouse Speed Testing Box */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 mr-1">{t('mouse_test_title')}</div>
                <div
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const point = { x, y, id: trailIdRef.current++ };
                    setMouseTrail(prev => {
                      const maxLen = Math.max(3, Math.floor(mouseSpeed * 1.6));
                      const nextTrail = [...prev, point];
                      if (nextTrail.length > maxLen) {
                        return nextTrail.slice(nextTrail.length - maxLen);
                      }
                      return nextTrail;
                    });
                  }}
                  onMouseLeave={() => setMouseTrail([])}
                  className="relative w-full h-[140px] bg-slate-950/80 rounded-xl border border-dashed border-emerald-500/20 overflow-hidden flex items-center justify-center cursor-crosshair group hover:border-emerald-500/40 transition"
                >
                  {mouseTrail.length === 0 && (
                    <div className="text-center space-y-1 text-slate-600 animate-pulse pointer-events-none">
                      <MousePointer className="w-5 h-5 mx-auto text-slate-700" />
                      <div className="text-[9px]">{t('mouse_test_prompt')}</div>
                    </div>
                  )}

                  {/* Draw trailing dots */}
                  {mouseTrail.map((point, index) => {
                    const opacity = (index + 1) / mouseTrail.length;
                    const size = 3 + (index / mouseTrail.length) * (mouseSpeed * 0.6);
                    return (
                      <div
                        key={point.id}
                        className="absolute rounded-full bg-emerald-400 pointer-events-none shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        style={{
                          left: point.x - size / 2,
                          top: point.y - size / 2,
                          width: size,
                          height: size,
                          opacity: opacity,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </WindowWrapper>
        )}

        {/* MAIN ADMIN MANAGEMENT WINDOW (IF ADMIN IS LOGGED IN OR PANEL IS OPENED) */}
        {showAdminPanel && (
          <motion.div
            id="admin-dashboard-window"
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            className="absolute left-1/2 top-1/2 w-[95%] max-w-[880px] h-[90%] max-h-[550px] bg-slate-900 border-2 border-cyan-500/80 rounded-2xl shadow-2xl z-40 overflow-hidden flex flex-col"
          >
            {/* Title Bar / Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Shield className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-100">{adminT('admin_panel_title')}</h3>
                  <p className="text-[10px] text-slate-500">{adminT('admin_panel_subtitle')} • {settings.gamenetName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeUser && (
                  <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-full font-bold">
                    {adminT('current_active_user')} {activeUser.username} ({Math.ceil(remainingTime / 60)} {adminT('minutes_suffix')})
                  </span>
                )}
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-slate-500 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split layout: Vertical menu on left, content on right (using Persian right-to-left layout) */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* VERTICAL MAIN MENU - COLLAPSED OR WIDE */}
              <div className={`bg-slate-950 border-l border-slate-850 flex flex-col justify-between py-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-48'}`}>
                
                <div className="space-y-1.5 px-2">
                  <button
                    onClick={() => { setActiveAdminTab('dashboard'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeAdminTab === 'dashboard' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_dashboard')}</span>}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('users'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeAdminTab === 'users' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_users')}</span>}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('requests'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                      activeAdminTab === 'requests' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Radio className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_requests')}</span>}
                    {appRequests.filter(r => r.status === 'pending').length > 0 && (
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 min-w-[16px] h-4 rounded-full bg-red-500 text-slate-100 text-[8px] font-black flex items-center justify-center px-1">
                        {appRequests.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('apps'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeAdminTab === 'apps' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_apps')}</span>}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('promos'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeAdminTab === 'promos' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_promos')}</span>}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('logs'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeAdminTab === 'logs' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_logs')}</span>}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('security'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeAdminTab === 'security' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_security')}</span>}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('feedback'); setActiveSubTab('list'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                      activeAdminTab === 'feedback' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_feedback')}</span>}
                    {feedbacks.filter(f => f.status === 'pending').length > 0 && (
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 min-w-[16px] h-4 rounded-full bg-red-500 text-slate-100 text-[8px] font-black flex items-center justify-center px-1">
                        {feedbacks.filter(f => f.status === 'pending').length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveAdminTab('settings'); setActiveSubTab('app'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeAdminTab === 'settings' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{adminT('tab_settings')}</span>}
                  </button>
                </div>

                {/* Collapse toggle at bottom */}
                <div className="px-3 border-t border-slate-900 pt-3 flex justify-center">
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition"
                  >
                    {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

              </div>

              {/* RIGHT SIDE MAIN VIEW AREA */}
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/95">
                
                {/* 1. VIEW 1: SYSTEM DASHBOARD */}
                {activeAdminTab === 'dashboard' && (
                  <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                        <span>🖥️</span>
                        نمای کلی وضعیت کلاینت
                      </h4>
                      <span className="text-[10px] text-slate-500">زمان فعلی ادمین: {desktopTime.toLocaleTimeString('fa-IR')}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 block">کاربر وارد شده</span>
                        <span className="text-sm font-bold text-slate-200 block">{activeUser ? activeUser.username : 'بدون کاربر (قفل)'}</span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 block">زمان باقی‌مانده جلسه</span>
                        <span className="text-sm font-mono font-bold text-cyan-400 block">{formatSeconds(remainingTime)}</span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 block">درایور مسدودسازی Task Manager</span>
                        <span className={`text-[11px] font-bold block ${settings.taskManagerBlockEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                          {settings.taskManagerBlockEnabled ? 'فعال و محافظت‌شده' : 'غیرفعال'}
                        </span>
                      </div>
                    </div>

                    {/* Threat Monitoring & Analyzers */}
                    <ThreatDashboard logs={logs} />

                    {/* Active session controls (Quick Charge) */}
                    {activeUser ? (
                      <div className="bg-slate-950/30 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div>
                            <h5 className="text-xs font-black text-slate-200">تمدید سریع شارژ برای کاربر {activeUser.username}</h5>
                            <p className="text-[10px] text-slate-500">افزایش دستی دقیقه‌ای زمان دسترسی بدون وارد کردن کد تمدید</p>
                          </div>
                          <Clock className="w-5 h-5 text-cyan-400" />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {[15, 30, 45, 60, 120, 180].map(mins => (
                            <button
                              key={mins}
                              onClick={() => handleAdminQuickCharge(mins)}
                              className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/20 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              +{mins} دقیقه
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950/40 border border-slate-800/60 p-8 rounded-2xl text-center space-y-2 text-slate-500 text-xs">
                        <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                        <p>هیچ کاربری در حال حاضر وارد سیستم نشده است.</p>
                        <p className="text-[10px] text-slate-600">هنگامی که کاربری با پسوردش وارد شود، کنترلر شارژ سریع در این بخش فعال خواهد شد.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. VIEW 2: USER MANAGEMENT (With Horizontal Sub-Menu) */}
                {activeAdminTab === 'users' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Horizontal Submenu */}
                    <div className="bg-slate-950 px-6 border-b border-slate-800/80 flex gap-4">
                      <button
                        onClick={() => { setActiveSubTab('list'); setUserEditTarget(null); }}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'list' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        لیست کاربران سیستم
                      </button>
                      <button
                        onClick={() => { setActiveSubTab('create'); setUserEditTarget(null); }}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'create' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ثبت کاربر جدید
                      </button>
                    </div>

                    {/* Subview Contents */}
                    <div className="p-6 flex-1 overflow-y-auto">
                      
                      {/* USER LIST SUB-TAB */}
                      {activeSubTab === 'list' && !userEditTarget && (
                        <div className="space-y-4">
                          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-right border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                                  <th className="p-3.5">نام کاربری</th>
                                  <th className="p-3.5">رمز ورود (شخصی)</th>
                                  <th className="p-3.5">شارژ روزانه (دقیقه)</th>
                                  <th className="p-3.5">شارژ باقیمانده</th>
                                  <th className="p-3.5 text-center">عملیات مدیریت</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850">
                                {users.map(u => (
                                  <tr key={u.id} className="hover:bg-slate-900/60 transition text-slate-300">
                                    <td className="p-3.5 font-bold">{u.username}</td>
                                    <td className="p-3.5 font-mono text-slate-500">{u.passwordHash}</td>
                                    <td className="p-3.5">{u.dailyMinutes} دقیقه</td>
                                    <td className="p-3.5 font-bold font-mono text-cyan-400">{Math.floor(u.remainingMinutes)} دقیقه</td>
                                    <td className="p-3.5 flex justify-center gap-2">
                                      <button
                                        onClick={() => setUserEditTarget(u)}
                                        className="p-1.5 rounded bg-slate-800 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 cursor-pointer"
                                        title="ویرایش کاربر"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleAdminDeleteUser(u.id)}
                                        className="p-1.5 rounded bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 cursor-pointer"
                                        title="حذف کاربر"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* EDIT USER FORM SUB-VIEW */}
                      {userEditTarget && (
                        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl max-w-lg mx-auto space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <h5 className="font-bold text-xs text-cyan-400">ویرایش حساب کاربری {userEditTarget.username}</h5>
                            <button onClick={() => setUserEditTarget(null)} className="text-[10px] text-slate-500 hover:text-white">انصراف</button>
                          </div>

                          <form onSubmit={handleAdminUpdateUser} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">نام کاربری:</label>
                              <input
                                type="text"
                                disabled
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500"
                                value={userEditTarget.username}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">رمز ورود (حداقل ۸ کاراکتر):</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  value={userEditTarget.passwordHash}
                                  onChange={(e) => setUserEditTarget({ ...userEditTarget, passwordHash: e.target.value })}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">شارژ روزانه (دقیقه):</label>
                                <input
                                  type="number"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  value={userEditTarget.dailyMinutes}
                                  onChange={(e) => setUserEditTarget({ ...userEditTarget, dailyMinutes: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">شارژ باقی‌مانده فعلی (دقیقه):</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  value={userEditTarget.remainingMinutes}
                                  onChange={(e) => setUserEditTarget({ ...userEditTarget, remainingMinutes: parseFloat(e.target.value) || 0 })}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">عبارت راهنمای یادآوری رمز:</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  value={userEditTarget.passwordHintPhrase}
                                  onChange={(e) => setUserEditTarget({ ...userEditTarget, passwordHintPhrase: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                id="admin-user-allow-hint-toggle"
                                type="checkbox"
                                className="rounded border-slate-800 bg-slate-900 text-cyan-500 cursor-pointer"
                                checked={userEditTarget.allowHintOnLogin}
                                onChange={(e) => setUserEditTarget({ ...userEditTarget, allowHintOnLogin: e.target.checked })}
                              />
                              <label htmlFor="admin-user-allow-hint-toggle" className="text-[11px] text-slate-400 cursor-pointer">مجوز نمایش راهنمای جزئی رمز عبور در لاک اسکرین</label>
                            </div>

                             {/* Master limits toggle for Edit */}
                             <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-3">
                               <div className="flex items-center justify-between bg-slate-900/30 p-2.5 rounded-xl border border-slate-800">
                                 <div className="flex items-center gap-1.5">
                                   <ShieldAlert className="w-4 h-4 text-cyan-400" />
                                   <span className="text-[11px] font-black text-slate-200">قوانین و محدودیت‌های اختصاصی کاربر</span>
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                   <input
                                     id="edit-user-custom-limits-master"
                                     type="checkbox"
                                     className="rounded border-slate-800 bg-slate-900 text-cyan-500 cursor-pointer"
                                     checked={userEditTarget.useCustomInternetLimits || false}
                                     onChange={(e) => setUserEditTarget({ 
                                       ...userEditTarget, 
                                       useCustomInternetLimits: e.target.checked,
                                       useCustomAppLimits: e.target.checked,
                                       internetVolumeLimit: userEditTarget.internetVolumeLimit || 'نامحدود',
                                       internetDownloadSpeed: userEditTarget.internetDownloadSpeed || 'نامحدود',
                                       internetUploadSpeed: userEditTarget.internetUploadSpeed || 'نامحدود',
                                       internetTimeLimit: userEditTarget.internetTimeLimit || 'همزمان با جلسه اصلی',
                                       blockedApps: userEditTarget.blockedApps || []
                                     })}
                                   />
                                   <label htmlFor="edit-user-custom-limits-master" className="text-[10px] text-slate-300 cursor-pointer font-bold">فعال‌سازی قوانین اختصاصی</label>
                                 </div>
                               </div>

                               {!(userEditTarget.useCustomInternetLimits || false) ? (
                                 <div className={`bg-slate-950/40 border border-slate-900/80 p-3 rounded-xl text-[10px] text-slate-400 font-sans leading-relaxed ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                                   {lang === 'fa' ? (
                                     <>ℹ️ <strong>توجه:</strong> این کاربر به طور پیش‌فرض از <strong>قوانین عمومی و همگانی کلاینت</strong> (تعریف شده در تنظیمات همگانی سیستم) استفاده می‌کند. در صورت تیک زدن گزینه بالا، می‌توانید قوانین سرعت اینترنت و فایروال اختصاصی برای این کاربر مشخص کنید.</>
                                   ) : (
                                     <>ℹ️ <strong>Heads up:</strong> This gamer default-runs on <strong>Global Client Rules</strong> (defined in System settings). Tick the box above to customize bandwidth and specific firewall protocols for this user.</>
                                   )}
                                 </div>
                               ) : (
                                 <div className="space-y-4 animate-fadeIn">
                                   {/* Custom Internet limits */}
                                   <div className="bg-slate-900/20 border border-slate-850 p-3 rounded-xl space-y-3">
                                     <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                                       <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                       <span className="text-[10px] font-bold text-slate-300">محدودیت‌های سرعت و ترافیک اینترنت</span>
                                     </div>
                                     <div className="grid grid-cols-2 gap-3">
                                       <div className="space-y-1">
                                         <label className="text-[10px] text-slate-400 block">سقف ترافیک مجاز (Volume):</label>
                                         <select
                                           className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                           value={userEditTarget.internetVolumeLimit || 'نامحدود'}
                                           onChange={(e) => setUserEditTarget({ ...userEditTarget, internetVolumeLimit: e.target.value })}
                                         >
                                           {['۵۰۰ مگابایت', '۱ گیگابایت', '۲ گیگابایت', '۵ گیگابایت', '۱۰ گیگابایت', 'نامحدود'].map(v => (
                                             <option key={v} value={v}>{v}</option>
                                           ))}
                                         </select>
                                       </div>

                                       <div className="space-y-1">
                                         <label className="text-[10px] text-slate-400 block">سرعت دانلود:</label>
                                         <select
                                           className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                           value={userEditTarget.internetDownloadSpeed || 'نامحدود'}
                                           onChange={(e) => setUserEditTarget({ ...userEditTarget, internetDownloadSpeed: e.target.value })}
                                         >
                                           {['۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۴ مگابایت', '۸ مگابایت', '۱۶ مگابایت', 'نامحدود'].map(v => (
                                             <option key={v} value={v}>{v}</option>
                                           ))}
                                         </select>
                                       </div>

                                       <div className="space-y-1">
                                         <label className="text-[10px] text-slate-400 block">سرعت آپلود:</label>
                                         <select
                                           className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                           value={userEditTarget.internetUploadSpeed || 'نامحدود'}
                                           onChange={(e) => setUserEditTarget({ ...userEditTarget, internetUploadSpeed: e.target.value })}
                                         >
                                           {['۱۲۸ کیلوبیت', '۲۵۶ کیلوبیت', '۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۵ مگابایت', 'نامحدود'].map(v => (
                                             <option key={v} value={v}>{v}</option>
                                           ))}
                                         </select>
                                       </div>

                                       <div className="space-y-1">
                                         <label className="text-[10px] text-slate-400 block">محدودیت زمان اتصال:</label>
                                         <select
                                           className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                           value={userEditTarget.internetTimeLimit || 'همزمان با جلسه اصلی'}
                                           onChange={(e) => setUserEditTarget({ ...userEditTarget, internetTimeLimit: e.target.value })}
                                         >
                                           {['۱۵ دقیقه', '۳۰ دقیقه', '۱ ساعت', '۲ ساعت', 'همزمان با جلسه اصلی'].map(v => (
                                             <option key={v} value={v}>{v}</option>
                                           ))}
                                         </select>
                                       </div>
                                     </div>
                                   </div>

                                   {/* Custom App limits */}
                                   <div className="bg-slate-900/20 border border-slate-850 p-3 rounded-xl space-y-3">
                                     <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                                       <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                                       <span className="text-[10px] font-bold text-slate-300">فایروال اختصاصی برنامه‌ها (قطع دسترسی وب)</span>
                                     </div>
                                     <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 space-y-2 max-h-[120px] overflow-y-auto text-right">
                                       <p className="text-[9px] text-slate-500 leading-relaxed mb-2">
                                         برنامه‌هایی که تیک بزنید از دسترسی به اینترنت محروم خواهند شد:
                                       </p>
                                       {simulatedApps.map(app => {
                                         const blockedList = userEditTarget.blockedApps || [];
                                         const isBlocked = blockedList.includes(app.name);
                                         return (
                                           <div key={app.id} className="flex items-center justify-between">
                                             <span className="text-[10px] text-slate-300">{app.icon} {app.name}</span>
                                             <input
                                               type="checkbox"
                                               className="rounded border-slate-800 bg-slate-900 text-rose-500 cursor-pointer"
                                               checked={isBlocked}
                                               onChange={(e) => {
                                                 if (e.target.checked) {
                                                   setUserEditTarget({
                                                     ...userEditTarget,
                                                     blockedApps: [...blockedList, app.name]
                                                   });
                                                 } else {
                                                   setUserEditTarget({
                                                     ...userEditTarget,
                                                     blockedApps: blockedList.filter(name => name !== app.name)
                                                   });
                                                 }
                                               }}
                                             />
                                           </div>
                                         );
                                       })}
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </div>

                            <button
                              type="submit"
                              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs py-2 rounded-lg cursor-pointer"
                            >
                              ثبت تغییرات کاربر
                            </button>
                          </form>
                        </div>
                      )}

                      {/* CREATE USER SUB-TAB */}
                      {activeSubTab === 'create' && (
                        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl max-w-lg mx-auto">
                          <form onSubmit={handleAdminCreateUser} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">نام کاربری جدید:</label>
                              <input
                                type="text"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                placeholder="مثلاً: Gamer_Parsa"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">کلمه عبور ورود (حداقل ۸ حرف):</label>
                                <input
                                  type="text"
                                  required
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  placeholder="رمز عبور گیمر"
                                  value={newUserPass}
                                  onChange={(e) => setNewUserPass(e.target.value)}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">زمان شارژ روزانه (دقیقه):</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  value={newUserDailyMinutes}
                                  onChange={(e) => setNewUserDailyMinutes(parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">عبارت راهنمای یادآوری رمز عبور:</label>
                              <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                placeholder="مثال: شماره موبایلم بدون صفر"
                                value={newUserPassHint}
                                onChange={(e) => setNewUserPassHint(e.target.value)}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                id="new-user-allow-hint-toggle"
                                type="checkbox"
                                className="rounded border-slate-800 bg-slate-900 text-cyan-500 cursor-pointer"
                                checked={newUserAllowHint}
                                onChange={(e) => setNewUserAllowHint(e.target.checked)}
                              />
                              <label htmlFor="new-user-allow-hint-toggle" className="text-[11px] text-slate-400 cursor-pointer">نمایش راهنمای جزئی در صفحه ورود مجاز باشد</label>
                            </div>

                            {/* Master limits toggle */}
                            <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-3">
                              <div className="flex items-center justify-between bg-slate-900/30 p-2.5 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                                  <span className="text-[11px] font-black text-slate-200">قوانین و محدودیت‌های اختصاصی کاربر</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    id="new-user-custom-limits-master"
                                    type="checkbox"
                                    className="rounded border-slate-800 bg-slate-900 text-cyan-500 cursor-pointer"
                                    checked={newUserUseCustomInternet}
                                    onChange={(e) => {
                                      setNewUserUseCustomInternet(e.target.checked);
                                      setNewUserUseCustomApps(e.target.checked);
                                    }}
                                  />
                                  <label htmlFor="new-user-custom-limits-master" className="text-[10px] text-slate-300 cursor-pointer font-bold">فعال‌سازی قوانین اختصاصی</label>
                                </div>
                              </div>

                              {!newUserUseCustomInternet ? (
                                <div className={`bg-slate-950/40 border border-slate-900/80 p-3 rounded-xl text-[10px] text-slate-400 font-sans leading-relaxed ${lang === 'fa' ? 'text-right' : 'text-left'}`}>
                                  {lang === 'fa' ? (
                                    <>ℹ️ <strong>توجه:</strong> این کاربر به طور پیش‌فرض از <strong>قوانین عمومی و همگانی کلاینت</strong> (تعریف شده در تنظیمات همگانی سیستم) استفاده می‌کند. در صورت تیک زدن گزینه بالا، می‌توانید قوانین سرعت اینترنت و فایروال اختصاصی برای این کاربر مشخص کنید.</>
                                  ) : (
                                    <>ℹ️ <strong>Heads up:</strong> This gamer default-runs on <strong>Global Client Rules</strong> (defined in System settings). Tick the box above to customize bandwidth and specific firewall protocols for this user.</>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-4 animate-fadeIn">
                                  {/* Custom Internet limits */}
                                  <div className="bg-slate-900/20 border border-slate-850 p-3 rounded-xl space-y-3">
                                    <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                      <span className="text-[10px] font-bold text-slate-300">محدودیت‌های سرعت و ترافیک اینترنت</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">سقف ترافیک مجاز (Volume):</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                          value={newUserInternetVolume}
                                          onChange={(e) => setNewUserInternetVolume(e.target.value)}
                                        >
                                          {['۵۰۰ مگابایت', '۱ گیگابایت', '۲ گیگابایت', '۵ گیگابایت', '۱۰ گیگابایت', 'نامحدود'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">سرعت دانلود:</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                          value={newUserInternetDownload}
                                          onChange={(e) => setNewUserInternetDownload(e.target.value)}
                                        >
                                          {['۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۴ مگابایت', '۸ مگابایت', '۱۶ مگابایت', 'نامحدود'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">سرعت آپلود:</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                          value={newUserInternetUpload}
                                          onChange={(e) => setNewUserInternetUpload(e.target.value)}
                                        >
                                          {['۱۲۸ کیلوبیت', '۲۵۶ کیلوبیت', '۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۵ مگابایت', 'نامحدود'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">محدودیت زمان اتصال:</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                          value={newUserInternetTime}
                                          onChange={(e) => setNewUserInternetTime(e.target.value)}
                                        >
                                          {['۱۵ دقیقه', '۳۰ دقیقه', '۱ ساعت', '۲ ساعت', 'همزمان با جلسه اصلی'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Custom App limits */}
                                  <div className="bg-slate-900/20 border border-slate-850 p-3 rounded-xl space-y-3">
                                    <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                                      <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                                      <span className="text-[10px] font-bold text-slate-300">فایروال اختصاصی برنامه‌ها (قطع دسترسی وب)</span>
                                    </div>
                                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 space-y-2 max-h-[120px] overflow-y-auto text-right">
                                      <p className="text-[9px] text-slate-500 leading-relaxed mb-2">
                                        برنامه‌هایی که تیک بزنید از دسترسی به اینترنت محروم خواهند شد:
                                      </p>
                                      {simulatedApps.map(app => {
                                        const isBlocked = newUserBlockedApps.includes(app.name);
                                        return (
                                          <div key={app.id} className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-300">{app.icon} {app.name}</span>
                                            <input
                                              type="checkbox"
                                              className="rounded border-slate-800 bg-slate-900 text-rose-500 cursor-pointer"
                                              checked={isBlocked}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setNewUserBlockedApps([...newUserBlockedApps, app.name]);
                                                } else {
                                                  setNewUserBlockedApps(newUserBlockedApps.filter(name => name !== app.name));
                                                }
                                              }}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs py-2 rounded-lg cursor-pointer"
                            >
                              افزودن و ثبت نهایی کاربر سیستم
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* 3. VIEW 3: PROMO CODES (With Horizontal Sub-Menu) */}
                {activeAdminTab === 'promos' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Horizontal Submenu */}
                    <div className="bg-slate-950 px-6 border-b border-slate-800/80 flex gap-4">
                      <button
                        onClick={() => setActiveSubTab('list')}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'list' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        لیست کدهای تمدید فعال
                      </button>
                      <button
                        onClick={() => setActiveSubTab('create')}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'create' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ساخت کد تمدید جدید (پروکد)
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 overflow-y-auto">
                      
                      {/* PROMO LIST */}
                      {activeSubTab === 'list' && (
                        <div className="space-y-4">
                          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-right border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                                  <th className="p-3.5">کد تمدید زمان</th>
                                  <th className="p-3.5">میزان افزودن زمان (دقیقه)</th>
                                  <th className="p-3.5">حداکثر دفعات استفاده</th>
                                  <th className="p-3.5">استفاده شده</th>
                                  <th className="p-3.5">دامنه تمدید</th>
                                  <th className="p-3.5 text-center">عملیات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850">
                                {promoCodes.map(c => (
                                  <tr key={c.id} className="hover:bg-slate-900/60 transition text-slate-300">
                                    <td className="p-3.5 font-mono font-bold text-slate-200">{c.code}</td>
                                    <td className="p-3.5 text-cyan-400 font-mono font-bold">+{c.timeAddedMinutes} دقیقه</td>
                                    <td className="p-3.5">{c.maxUses} بار</td>
                                    <td className="p-3.5 font-mono">{c.currentUses} بار</td>
                                    <td className="p-3.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.isPermanent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                                        {c.isPermanent ? 'دائمی به شارژ روزانه' : 'موقت (فقط برای امروز فرد)'}
                                      </span>
                                    </td>
                                    <td className="p-3.5 flex justify-center">
                                      <button
                                        onClick={() => handleAdminDeletePromo(c.id)}
                                        className="p-1.5 rounded bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 cursor-pointer"
                                        title="حذف کد"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* CREATE PROMO */}
                      {activeSubTab === 'create' && (
                        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl max-w-lg mx-auto">
                          <form onSubmit={handleAdminCreatePromo} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">کد تمدید (ترجیحاً حروف انگلیسی بزرگ):</label>
                              <input
                                type="text"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 font-mono uppercase"
                                placeholder="مثال: XG-HAPPY-1HR"
                                value={newPromoCode}
                                onChange={(e) => setNewPromoCode(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">زمان شارژ اضافه (دقیقه):</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  value={newPromoTime}
                                  onChange={(e) => setNewPromoTime(parseInt(e.target.value) || 0)}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">حداکثر دفعات استفاده:</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                  value={newPromoMaxUses}
                                  onChange={(e) => setNewPromoMaxUses(parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>

                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-2">
                              <label className="text-[11px] text-slate-400 block">نوع اعمال زمان شارژ:</label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="promo-type"
                                    checked={!newPromoIsPermanent}
                                    onChange={() => setNewPromoIsPermanent(false)}
                                    className="text-cyan-500"
                                  />
                                  <span>موقت برای جلسه امروز (Today's session limit)</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="promo-type"
                                    checked={newPromoIsPermanent}
                                    onChange={() => setNewPromoIsPermanent(true)}
                                    className="text-cyan-500"
                                  />
                                  <span>دائمی به شارژ روزانه کاربر (Permanent Daily extension)</span>
                                </label>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs py-2 rounded-lg cursor-pointer"
                            >
                              ایجاد و فعال‌سازی نهایی کد تمدید
                            </button>
                          </form>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* 4. VIEW 4: SYSTEM LOGS & REPORTS */}
                {activeAdminTab === 'logs' && (
                  <div className="p-6 flex-1 overflow-y-auto space-y-4 text-right">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        مرکز ثبت وقایع و گزارشات ممیزی X-Guard
                      </h4>
                      <span className="text-[10px] text-slate-500">وقایع‌نگاری یکپارچه و گزارش‌های جامع سیستمی</span>
                    </div>

                    <ActivityLogger 
                      logs={logs} 
                      onClearLogs={() => {
                        clearLogs();
                        setLogs([]);
                        triggerToast('تمامی گزارش‌های وقایع با موفقیت پاک‌سازی شدند.', 'info');
                      }} 
                    />
                  </div>
                )}

                {/* VIEW: USER APP ACCESS REQUESTS */}
                {activeAdminTab === 'requests' && (
                  <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                        درخواست‌های دسترسی به برنامه‌ها
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        درخواست‌های ارسالی کاربران برای اجرای برنامه‌های سیستمی و بازی‌های محدود شده را تأیید یا رد کنید.
                      </p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-12 gap-2 p-3 bg-slate-950 border-b border-slate-800 text-slate-400 font-bold text-right">
                        <div className="col-span-3">نام کاربر</div>
                        <div className="col-span-3">برنامه درخواستی</div>
                        <div className="col-span-2">دسته‌بندی / پروسس</div>
                        <div className="col-span-2 text-center">وضعیت</div>
                        <div className="col-span-2 text-center">عملیات</div>
                      </div>

                      {appRequests.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          هیچ درخواستی برای دسترسی به برنامه‌ها ثبت نشده است.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-850/60">
                          {appRequests.map((req) => (
                            <div key={req.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-slate-900/30 transition text-right">
                              
                              <div className="col-span-3 font-semibold text-slate-200">
                                {req.username}
                              </div>

                               <div className="col-span-3 flex flex-col text-right">
                                <span className="text-cyan-400 font-bold">{req.appName}</span>
                                {req.purpose && (
                                  <span className="text-[9px] text-purple-300 mt-0.5">🎯 هدف: {req.purpose}</span>
                                )}
                                {req.description && (
                                  <span className="text-[9px] text-slate-400">📝 توضیحات: {req.description}</span>
                                )}
                              </div>

                              <div className="col-span-2 text-[10px] text-slate-400 space-y-0.5">
                                <p>{req.category === 'Game' ? '🎮 بازی' : req.category === 'Utility' ? '🌐 کاربردی' : '⚙️ سیستمی'}</p>
                                <p className="font-mono text-slate-500">{req.processName}</p>
                              </div>

                              <div className="col-span-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  req.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : req.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {req.status === 'approved' ? 'تأیید شده' : req.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                                </span>
                              </div>

                              <div className="col-span-2 flex items-center justify-center gap-1.5">
                                {req.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleAdminApproveRequest(req.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 font-bold px-2 py-1 rounded text-[9px] transition cursor-pointer flex items-center gap-0.5 text-slate-100"
                                      title="موافقت و نصب شورت‌کات دسکتاپ"
                                    >
                                      <Check className="w-3 h-3" />
                                      تأیید
                                    </button>
                                    <button
                                      onClick={() => handleAdminRejectRequest(req.id)}
                                      className="bg-red-600/20 hover:bg-red-600 hover:text-white text-red-400 font-bold px-2 py-1 rounded text-[9px] transition cursor-pointer flex items-center gap-0.5 border border-red-500/30"
                                      title="رد کردن درخواست"
                                    >
                                      <X className="w-3 h-3" />
                                      رد
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleAdminDeleteRequest(req.id)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                                    title="حذف از لیست تاریخچه"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 8. VIEW 8: APP MANAGEMENT (New Tab) */}
                {activeAdminTab === 'apps' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Horizontal Submenu */}
                    <div className="bg-slate-950 px-6 border-b border-slate-800/80 flex gap-4">
                      <button
                        onClick={() => {
                          setAppEditTarget(null);
                          setActiveSubTab('list');
                        }}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          activeSubTab === 'list' && !appEditTarget ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>لیست برنامه‌ها و بازی‌ها</span>
                      </button>
                      <button
                        onClick={() => {
                          setAppEditTarget(null);
                          setActiveSubTab('create');
                        }}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          activeSubTab === 'create' && !appEditTarget ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>➕ افزودن برنامه جدید</span>
                      </button>
                      {appEditTarget && (
                        <button
                          className="py-3.5 px-1 border-b-2 text-xs font-bold border-cyan-400 text-cyan-400 flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>🔧 ویرایش برنامه: {appEditTarget.name}</span>
                        </button>
                      )}
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                      
                      {/* APP LIST SUB-TAB */}
                      {activeSubTab === 'list' && !appEditTarget && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                              <Gamepad2 className="w-4 h-4 text-cyan-400" />
                              لیست برنامه‌ها و بازی‌های تعریف‌شده سیستم
                            </h4>
                            <p className="text-[10px] text-slate-500 font-sans">
                              مجموعاً {simulatedApps.length} برنامه در کلاینت ثبت شده است.
                            </p>
                          </div>

                          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden text-xs">
                            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-950 border-b border-slate-800 text-slate-400 font-bold text-right">
                              <div className="col-span-3">نام برنامه / بازی</div>
                              <div className="col-span-2">دسته‌بندی</div>
                              <div className="col-span-3">مسیر یا نام پروسس اجرایی</div>
                              <div className="col-span-2 text-center">محدودیت اختصاصی اینترنت</div>
                              <div className="col-span-1 text-center">وضعیت</div>
                              <div className="col-span-1 text-center">عملیات</div>
                            </div>

                            {simulatedApps.length === 0 ? (
                              <div className="text-center py-8 text-slate-500 font-sans">
                                هیچ برنامه‌ای در سیستم تعریف نشده است.
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-850/60">
                                {simulatedApps.map((app) => (
                                  <div key={app.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-slate-900/30 transition text-right">
                                    <div className="col-span-3 flex items-center gap-2">
                                      <span className="text-lg">{app.icon}</span>
                                      <span className="font-semibold text-slate-200">{app.name}</span>
                                    </div>

                                    <div className="col-span-2 text-[10px] text-slate-400">
                                      {app.category === 'Game' ? '🎮 بازی' : app.category === 'Utility' ? '🌐 کاربردی' : '⚙️ سیستمی'}
                                    </div>

                                    <div className="col-span-3 font-mono text-slate-400 text-[10px] truncate" title={app.processName}>
                                      {app.processName}
                                    </div>

                                    <div className="col-span-2 text-center">
                                      {app.useCustomInternetLimits ? (
                                        app.internetBlocked ? (
                                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold">
                                            🔴 مسدود کامل
                                          </span>
                                        ) : (
                                          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-1.5 py-0.5 text-[9px] font-sans">
                                            ⬇️ {app.downloadLimitSpeed || 'نامحدود'} / ⬆️ {app.uploadLimitSpeed || 'نامحدود'}
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-slate-500 text-[9px] font-sans">
                                          🌐 قوانین عمومی سیستم
                                        </span>
                                      )}
                                    </div>

                                    <div className="col-span-1 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black inline-block ${
                                        app.status === 'running'
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                                      }`}>
                                        {app.status === 'running' ? 'اجرا شده' : 'بسته'}
                                      </span>
                                    </div>

                                    <div className="col-span-1 flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => setAppEditTarget(app)}
                                        className="text-cyan-400 hover:text-cyan-300 p-1 rounded transition cursor-pointer"
                                        title="ویرایش و اعمال محدودیت برنامه"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleAdminDeleteApp(app.id)}
                                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                                        title="حذف برنامه از کل سیستم"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ADD APP SUB-TAB */}
                      {activeSubTab === 'create' && !appEditTarget && (
                        <div className="max-w-md mx-auto bg-slate-950/40 border border-slate-800 p-6 rounded-xl space-y-4">
                          <h4 className="text-xs font-black text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                            <PlusCircle className="w-4 h-4 text-cyan-400" />
                            تعریف و افزودن برنامه جدید به سیستم
                          </h4>

                          <form onSubmit={handleAdminAddApp} className="space-y-4 text-right">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">نام برنامه یا بازی:</label>
                              <input
                                type="text"
                                required
                                placeholder="مثلاً: Grand Theft Auto V"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 font-sans"
                                value={adminNewAppName}
                                onChange={(e) => setAdminNewAppName(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">مسیر یا نام پروسس اجرایی (Executable Process Path):</label>
                              <input
                                type="text"
                                required
                                placeholder="مثلاً: gtav.exe یا D:\Games\GTA V\PlayGTAV.exe"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 font-mono text-left"
                                dir="ltr"
                                value={adminNewAppPath}
                                onChange={(e) => setAdminNewAppPath(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">دسته‌بندی برنامه:</label>
                                <select
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                  value={adminNewAppCategory}
                                  onChange={(e) => setAdminNewAppCategory(e.target.value as any)}
                                >
                                  <option value="Game">🎮 بازی</option>
                                  <option value="Utility">🌐 کاربردی</option>
                                  <option value="System">⚙️ سیستمی</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">انتخاب نماد / آیکون:</label>
                                <select
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                  value={adminNewAppIcon}
                                  onChange={(e) => setAdminNewAppIcon(e.target.value)}
                                >
                                  <option value="🎮">🎮 بازی عمومی</option>
                                  <option value="⚽">⚽ فوتبال / ورزشی</option>
                                  <option value="🎯">🎯 اکشن / شوتر</option>
                                  <option value="⛏️">⛏️ ساخت‌وساز / فکری</option>
                                  <option value="🚗">🚗 ماشین / مسابقه‌ای</option>
                                  <option value="🌐">🌐 مرورگر وب</option>
                                  <option value="💬">💬 چت / شبکه‌های اجتماعی</option>
                                  <option value="🎬">🎬 رسانه / ویدیو پلیر</option>
                                  <option value="🎨">🎨 گرافیکی / طراحی</option>
                                  <option value="💻">💻 برنامه‌نویسی / ابزار توسعه</option>
                                  <option value="⚙️">⚙️ سیستمی / مدیریتی</option>
                                </select>
                              </div>
                            </div>

                            {/* Custom app limitations toggle */}
                            <div className="border-t border-slate-800/60 pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                                  <span className="text-[11px] font-bold text-slate-300">محدودیت‌های اینترنت اختصاصی برنامه</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    id="add-app-custom-limits"
                                    type="checkbox"
                                    className="rounded border-slate-800 bg-slate-900 text-cyan-500 cursor-pointer"
                                    checked={adminNewAppUseCustomLimits}
                                    onChange={(e) => setAdminNewAppUseCustomLimits(e.target.checked)}
                                  />
                                  <label htmlFor="add-app-custom-limits" className="text-[10px] text-slate-400 cursor-pointer">فعال‌سازی محدودیت شخصی</label>
                                </div>
                              </div>

                              {adminNewAppUseCustomLimits && (
                                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-3 animate-fadeIn">
                                  <div className="flex items-center gap-2">
                                    <input
                                      id="add-app-internet-blocked"
                                      type="checkbox"
                                      className="rounded border-slate-800 bg-slate-900 text-rose-500 cursor-pointer"
                                      checked={adminNewAppInternetBlocked}
                                      onChange={(e) => setAdminNewAppInternetBlocked(e.target.checked)}
                                    />
                                    <label htmlFor="add-app-internet-blocked" className="text-[10px] text-slate-300 cursor-pointer">مسدودسازی کامل ترافیک اینترنت این برنامه (Firewall)</label>
                                  </div>

                                  {!adminNewAppInternetBlocked && (
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">سقف سرعت دانلود:</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                          value={adminNewAppDownloadLimit}
                                          onChange={(e) => setAdminNewAppDownloadLimit(e.target.value)}
                                        >
                                          {['۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۴ مگابایت', '۸ مگابایت', '۱۶ مگابایت', 'نامحدود'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">سقف سرعت آپلود:</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                          value={adminNewAppUploadLimit}
                                          onChange={(e) => setAdminNewAppUploadLimit(e.target.value)}
                                        >
                                          {['۱۲۸ کیلوبیت', '۲۵۶ کیلوبیت', '۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۵ مگابایت', 'نامحدود'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer mt-2"
                            >
                              افزودن برنامه به مخزن سیستم
                            </button>
                          </form>
                        </div>
                      )}

                      {/* EDIT APP SUB-TAB */}
                      {appEditTarget && (
                        <div className="max-w-md mx-auto bg-slate-950/40 border border-slate-800 p-6 rounded-xl space-y-4">
                          <h4 className="text-xs font-black text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Edit2 className="w-4 h-4 text-cyan-400" />
                            ویرایش و تنظیم محدودیت‌های اختصاصی برنامه
                          </h4>

                          <form onSubmit={handleAdminEditApp} className="space-y-4 text-right">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">نام برنامه یا بازی:</label>
                              <input
                                type="text"
                                required
                                placeholder="مثلاً: Grand Theft Auto V"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 font-sans"
                                value={appEditTarget.name}
                                onChange={(e) => setAppEditTarget({ ...appEditTarget, name: e.target.value })}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">مسیر یا نام پروسس اجرایی (Executable Process Path):</label>
                              <input
                                type="text"
                                required
                                placeholder="مثلاً: gtav.exe"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 font-mono text-left"
                                dir="ltr"
                                value={appEditTarget.processName}
                                onChange={(e) => setAppEditTarget({ ...appEditTarget, processName: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">دسته‌بندی برنامه:</label>
                                <select
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                  value={appEditTarget.category}
                                  onChange={(e) => setAppEditTarget({ ...appEditTarget, category: e.target.value as any })}
                                >
                                  <option value="Game">🎮 بازی</option>
                                  <option value="Utility">🌐 کاربردی</option>
                                  <option value="System">⚙️ سیستمی</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-400 block">انتخاب نماد / آیکون:</label>
                                <select
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                  value={appEditTarget.icon}
                                  onChange={(e) => setAppEditTarget({ ...appEditTarget, icon: e.target.value })}
                                >
                                  <option value="🎮">🎮 بازی عمومی</option>
                                  <option value="⚽">⚽ فوتبال / ورزشی</option>
                                  <option value="🎯">🎯 اکشن / شوتر</option>
                                  <option value="⛏️">⛏️ ساخت‌وساز / فکری</option>
                                  <option value="🚗">🚗 ماشین / مسابقه‌ای</option>
                                  <option value="🌐">🌐 مرورگر وب</option>
                                  <option value="💬">💬 چت / شبکه‌های اجتماعی</option>
                                  <option value="🎬">🎬 رسانه / ویدیو پلیر</option>
                                  <option value="🎨">🎨 گرافیکی / طراحی</option>
                                  <option value="💻">💻 برنامه‌نویسی / ابزار توسعه</option>
                                  <option value="⚙️">⚙️ سیستمی / مدیریتی</option>
                                </select>
                              </div>
                            </div>

                            {/* Custom app limitations toggle */}
                            <div className="border-t border-slate-800/60 pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                                  <span className="text-[11px] font-bold text-slate-300">محدودیت‌های اینترنت اختصاصی برنامه</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    id="edit-app-custom-limits"
                                    type="checkbox"
                                    className="rounded border-slate-800 bg-slate-900 text-cyan-500 cursor-pointer"
                                    checked={appEditTarget.useCustomInternetLimits || false}
                                    onChange={(e) => setAppEditTarget({ 
                                      ...appEditTarget, 
                                      useCustomInternetLimits: e.target.checked,
                                      internetBlocked: appEditTarget.internetBlocked || false,
                                      downloadLimitSpeed: appEditTarget.downloadLimitSpeed || 'نامحدود',
                                      uploadLimitSpeed: appEditTarget.uploadLimitSpeed || 'نامحدود'
                                    })}
                                  />
                                  <label htmlFor="edit-app-custom-limits" className="text-[10px] text-slate-400 cursor-pointer">فعال‌سازی محدودیت شخصی</label>
                                </div>
                              </div>

                              {appEditTarget.useCustomInternetLimits && (
                                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-3 animate-fadeIn">
                                  <div className="flex items-center gap-2">
                                    <input
                                      id="edit-app-internet-blocked"
                                      type="checkbox"
                                      className="rounded border-slate-800 bg-slate-900 text-rose-500 cursor-pointer"
                                      checked={appEditTarget.internetBlocked || false}
                                      onChange={(e) => setAppEditTarget({ ...appEditTarget, internetBlocked: e.target.checked })}
                                    />
                                    <label htmlFor="edit-app-internet-blocked" className="text-[10px] text-slate-300 cursor-pointer">مسدودسازی کامل ترافیک اینترنت این برنامه (Firewall)</label>
                                  </div>

                                  {!appEditTarget.internetBlocked && (
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">سقف سرعت دانلود:</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none font-sans"
                                          value={appEditTarget.downloadLimitSpeed || 'نامحدود'}
                                          onChange={(e) => setAppEditTarget({ ...appEditTarget, downloadLimitSpeed: e.target.value })}
                                        >
                                          {['۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۴ مگابایت', '۸ مگابایت', '۱۶ مگابایت', 'نامحدود'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 block">سقف سرعت آپلود:</label>
                                        <select
                                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none font-sans"
                                          value={appEditTarget.uploadLimitSpeed || 'نامحدود'}
                                          onChange={(e) => setAppEditTarget({ ...appEditTarget, uploadLimitSpeed: e.target.value })}
                                        >
                                          {['۱۲۸ کیلوبیت', '۲۵۶ کیلوبیت', '۵۱۲ کیلوبیت', '۱ مگابایت', '۲ مگابایت', '۵ مگابایت', 'نامحدود'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-3 mt-2">
                              <button
                                type="submit"
                                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                              >
                                ذخیره تغییرات برنامه
                              </button>
                              <button
                                type="button"
                                onClick={() => setAppEditTarget(null)}
                                className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                              >
                                انصراف
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Secure Activity Logger Tab */}
                {activeAdminTab === 'security' && (() => {
                  const targetUser = users.find(u => u.username === selectedActivityUsername) || users[0];
                  const currentUsername = targetUser ? targetUser.username : '';
                  
                  const activities = currentUsername ? getUserActivities(currentUsername) : [];
                  const loginsCount = activities.filter(a => a.type === 'login').length;
                  const gamesCount = activities.filter(a => a.type === 'game' || a.type === 'game_active').length;
                  const warningsCount = activities.filter(a => a.type === 'warning').length;
                  const incidentsCount = activities.filter(a => a.type === 'security').length;

                  return (
                    <div className="p-6 flex-1 overflow-y-auto space-y-4 text-right" dir="rtl">
                      {/* Header Row */}
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-100 flex items-center gap-2 font-bold">
                            <span>🕒</span>
                            نظارت هوشمند و آنالیز فعالیت کاربران
                          </h4>
                          <p className="text-[10px] text-slate-500">مشاهده تفکیک‌شده لاگین‌ها، زمان شروع و پایان بازی‌ها و هشدارهای دریافتی هر کاربر کلاینت</p>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-black font-mono">X-GUARD SESSION TRACKER</span>
                      </div>

                      {/* User Selector Dropdown & User Profile Summary */}
                      <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400">انتخاب کاربر کلاینت:</span>
                          <select
                            value={selectedActivityUsername || (users[0]?.username || '')}
                            onChange={(e) => setSelectedActivityUsername(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-400 py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer focus:border-cyan-500/50"
                          >
                            {users.map(u => (
                              <option key={u.id} value={u.username}>
                                کاربر: @{u.username} ({u.fullName})
                              </option>
                            ))}
                          </select>
                        </div>

                        {targetUser && (
                          <div className="flex items-center gap-4 text-xs font-black">
                            <span className="text-slate-500">باقی‌مانده زمانی:</span>
                            <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{Math.floor(targetUser.remainingMinutes)} دقیقه</span>
                            
                            <span className="text-slate-500">پوسته رنگی:</span>
                            <span className="text-slate-300 font-mono capitalize">{targetUser.themeColor || 'cyan'}</span>
                          </div>
                        )}
                      </div>

                      {currentUsername ? (
                        <>
                          {/* User KPI Stat Cards */}
                          <div className="grid grid-cols-4 gap-3.5">
                            {/* Stats Card 1 */}
                            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 block">دفعات ورود کلاینت</span>
                                <span className="text-sm font-black text-cyan-400 font-mono">{loginsCount} بار</span>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                <span>🔑</span>
                              </div>
                            </div>
                            {/* Stats Card 2 */}
                            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 block">بازی‌های اجرا شده</span>
                                <span className="text-sm font-black text-purple-400 font-mono">{gamesCount} بازی</span>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <span>🎮</span>
                              </div>
                            </div>
                            {/* Stats Card 3 */}
                            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 block">هشدارهای زمانی</span>
                                <span className="text-sm font-black text-amber-400 font-mono">{warningsCount} بار</span>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                                <span>⚠️</span>
                              </div>
                            </div>
                            {/* Stats Card 4 */}
                            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 block">رویدادهای مسدود شده</span>
                                <span className="text-sm font-black text-rose-400 font-mono">{incidentsCount} رویداد</span>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                                <span>🚨</span>
                              </div>
                            </div>
                          </div>

                          {/* Session Activity Timeline list */}
                          <div className="bg-slate-950/60 border border-slate-900 rounded-xl overflow-hidden">
                            <div className="p-3 bg-slate-950 border-b border-slate-900 flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-300">وقایع زمانی اخیر کلاینت</span>
                              <span className="text-[9px] text-slate-500 font-mono font-rounded-num">ACTIVITY-LOG</span>
                            </div>

                            <div className="divide-y divide-slate-900/60 max-h-[420px] overflow-y-auto">
                              {activities.length === 0 ? (
                                <div className="p-8 text-center text-slate-600 text-xs">
                                  هیچ رویداد فعالیتی ثبت‌شده‌ای برای این کاربر در پایگاه‌داده وجود ندارد.
                                </div>
                              ) : (
                                activities.map(act => (
                                  <div key={act.id} className="p-4 flex items-start gap-3.5 hover:bg-slate-900/20 transition">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border shrink-0 ${act.color}`}>
                                      {act.icon}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex justify-between items-center">
                                        <h5 className="text-[11px] font-black text-slate-200">{act.title}</h5>
                                        <span className="text-[9px] text-slate-500 font-mono">
                                          {new Date(act.timestamp).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{act.desc}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center text-slate-600 text-xs">
                          هیچ کاربری در سیستم یافت نشد. برای ایجاد حساب به زبانه کاربران مراجعه کنید.
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 4.5 VIEW: USER FEEDBACKS & SESSION REPORTS */}
                {activeAdminTab === 'feedback' && (() => {
                  const allFbs = feedbacks || [];
                  const totalCount = allFbs.length;
                  const pendingCount = allFbs.filter(f => f.status === 'pending').length;
                  const resolvedCount = allFbs.filter(f => f.status === 'resolved').length;
                  
                  // Calculate average rating
                  const avgRating = totalCount > 0 
                    ? (allFbs.reduce((acc, curr) => acc + curr.rating, 0) / totalCount).toFixed(1)
                    : '0.0';

                  // Apply local filter states (we can define local state or use activeSubTab for simplicity)
                  // Let's filter in-place or use a simple drop down filtering
                  return (
                    <div className="p-6 flex-1 overflow-y-auto space-y-5 text-right" dir="rtl">
                      {/* Header Row */}
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-100 flex items-center gap-2 font-bold">
                            <MessageSquare className="w-4 h-4 text-cyan-400" />
                            مدیریت و آنالیز نظرات و بازخوردهای کاربران کلاینت
                          </h4>
                          <p className="text-[10px] text-slate-500">گزارشات مراجعین را درباره سخت‌افزار، بازی‌ها و خدمات بررسی کرده و پاسخ خود را ثبت کنید.</p>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-black font-mono">X-GUARD FEEDBACK CENTER</span>
                      </div>

                      {/* KPI Dashboard Cards */}
                      <div className="grid grid-cols-4 gap-4">
                        {/* Avg Rating Card */}
                        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 block">میانگین امتیاز مراجعین</span>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-amber-400 font-mono">{avgRating}</span>
                              <div className="flex items-center" dir="ltr">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${
                                      i < Math.round(Number(avgRating)) 
                                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]' 
                                        : 'text-slate-700'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <Star className="w-5 h-5 fill-amber-400" />
                          </div>
                        </div>

                        {/* Total Count */}
                        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 block">کل بازخوردهای ثبت شده</span>
                            <span className="text-base font-black text-slate-100 font-mono">{totalCount} مورد</span>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Pending Count */}
                        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 block">در انتظار بررسی مدیریت</span>
                            <span className="text-base font-black text-rose-400 font-mono">{pendingCount} مورد</span>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          </div>
                        </div>

                        {/* Resolved Count */}
                        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 block">موارد حل و فصل شده</span>
                            <span className="text-base font-black text-emerald-400 font-mono">{resolvedCount} مورد</span>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Filter/Search Bar */}
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400">فیلتر موضوعی:</span>
                          <select
                            id="admin-fb-filter-category"
                            value={auditCategory === 'all' ? 'all' : auditCategory}
                            onChange={(e) => setAuditCategory(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-200 focus:outline-none focus:border-cyan-500/40 font-sans cursor-pointer"
                          >
                            <option value="all">همه دسته‌ها</option>
                            <option value="hardware">💻 مشکلات سخت‌افزاری</option>
                            <option value="software">🎮 مشکلات بازی و نرم‌افزار</option>
                            <option value="service">⚡ سرعت اینترنت و خدمات</option>
                            <option value="other">⚙️ پیشنهادها و انتقادات</option>
                          </select>

                          <span className="text-xs font-bold text-slate-400 mr-2">فیلتر وضعیت بررسی:</span>
                          <select
                            id="admin-fb-filter-status"
                            value={auditRisk === 'all' ? 'all' : auditRisk}
                            onChange={(e) => setAuditRisk(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-200 focus:outline-none focus:border-cyan-500/40 font-sans cursor-pointer"
                          >
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="pending">در انتظار بررسی</option>
                            <option value="reviewed">بررسی و پاسخ داده شده</option>
                            <option value="resolved">برطرف شده</option>
                          </select>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm('آیا مایل به حذف تمامی بازخوردهای ثبت شده در سیستم هستید؟ (این عمل غیرقابل بازگشت است)')) {
                              saveFeedbacks([]);
                              setFeedbacks([]);
                              triggerToast('تمامی بازخوردها با موفقیت حذف شدند.', 'info');
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                        >
                          پاک‌سازی کل پایگاه‌داده بازخوردها
                        </button>
                      </div>

                      {/* Main Feedback list */}
                      <div className="space-y-4">
                        {(() => {
                          const filtered = allFbs.filter(f => {
                            const catMatch = auditCategory === 'all' || f.category === auditCategory;
                            const statMatch = auditRisk === 'all' || f.status === auditRisk;
                            return catMatch && statMatch;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="bg-slate-950/20 border border-slate-900/60 rounded-xl p-10 text-center text-xs text-slate-500">
                                هیچ بازخوردی متناسب با فیلترهای بالا یافت نشد.
                              </div>
                            );
                          }

                          return filtered.map((fb) => (
                            <div 
                              key={fb.id} 
                              className={`bg-slate-950/40 border p-5 rounded-2xl space-y-4 transition duration-200 ${
                                fb.status === 'pending'
                                  ? 'border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.02)]'
                                  : fb.status === 'resolved'
                                  ? 'border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.02)]'
                                  : 'border-slate-850'
                              }`}
                            >
                              {/* Card Header */}
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-3">
                                  {/* User profile details */}
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg font-black text-cyan-400">
                                    {fb.username[0].toUpperCase()}
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-200">کاربر: @{fb.username}</span>
                                      <span className="text-[10px] text-slate-500">
                                        {fb.category === 'hardware' && '💻 مشکل سخت‌افزاری'}
                                        {fb.category === 'software' && '🎮 مشکل نرم‌افزاری و بازی'}
                                        {fb.category === 'service' && '⚡ سرعت اینترنت و خدمات'}
                                        {fb.category === 'other' && '⚙️ پیشنهاد و انتقاد'}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono block">
                                      {new Date(fb.timestamp).toLocaleDateString('fa-IR')} ساعت {new Date(fb.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>

                                {/* Star & Status badges */}
                                <div className="flex flex-col items-end gap-1.5">
                                  <div className="flex items-center gap-0.5" dir="ltr">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`w-3.5 h-3.5 ${
                                          i < fb.rating 
                                            ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]' 
                                            : 'text-slate-800'
                                        }`} 
                                      />
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={fb.status}
                                      onChange={(e) => handleFeedbackUpdateStatus(fb.id, e.target.value as any)}
                                      className="bg-slate-900 border border-slate-800 rounded-lg text-[9px] py-1 px-2 text-slate-300 focus:outline-none font-sans cursor-pointer focus:border-cyan-500/40"
                                    >
                                      <option value="pending">⏳ در حال بررسی</option>
                                      <option value="reviewed">💬 بررسی و پاسخ داده شده</option>
                                      <option value="resolved">✅ برطرف شده</option>
                                    </select>

                                    <button
                                      onClick={() => handleDeleteFeedback(fb.id)}
                                      className="p-1 rounded bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                      title="حذف بازخورد"
                                    >
                                      <span>🗑️</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Message Body */}
                              <div className="bg-slate-950/40 border border-slate-900/60 p-4 rounded-xl leading-relaxed text-xs text-slate-300 font-sans">
                                {fb.comment}
                              </div>

                              {/* Admin Response section */}
                              {fb.adminResponse ? (
                                <div className="bg-cyan-500/5 border-r-2 border-cyan-500/30 p-3 rounded-l-xl space-y-1 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-cyan-400 font-black">پاسخ ثبت‌شده مدیریت:</span>
                                    <button
                                      onClick={() => {
                                        setSelectedFeedbackId(fb.id);
                                        setFeedbackAdminReplyText(fb.adminResponse || '');
                                      }}
                                      className="text-[9px] text-slate-500 hover:text-cyan-400 underline font-bold"
                                    >
                                      ویرایش پاسخ
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{fb.adminResponse}</p>
                                </div>
                              ) : (
                                selectedFeedbackId !== fb.id && (
                                  <button
                                    onClick={() => {
                                      setSelectedFeedbackId(fb.id);
                                      setFeedbackAdminReplyText('');
                                    }}
                                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-cyan-500/30 text-[10px] px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                                  >
                                    ✍️ ثبت پاسخ مدیریت
                                  </button>
                                )
                              )}

                              {/* Replying form */}
                              {selectedFeedbackId === fb.id && (
                                <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl space-y-3 mt-2 animate-fadeIn">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-cyan-400">پاسخ جدید مدیریت به کاربر:</span>
                                    <button
                                      onClick={() => {
                                        setSelectedFeedbackId(null);
                                        setFeedbackAdminReplyText('');
                                      }}
                                      className="text-[9px] text-slate-500 hover:text-slate-300 font-bold"
                                    >
                                      انصراف
                                    </button>
                                  </div>
                                  <textarea
                                    value={feedbackAdminReplyText}
                                    onChange={(e) => setFeedbackAdminReplyText(e.target.value)}
                                    placeholder="پاسخ خود را بنویسید (مثلا: هماهنگی‌های لازم با بخش فنی انجام شد و سیستم شماره ۳ کیبوردش تعویض گردید)..."
                                    rows={2}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        handleFeedbackReply(fb.id, feedbackAdminReplyText);
                                        setSelectedFeedbackId(null);
                                        setFeedbackAdminReplyText('');
                                      }}
                                      className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-[10px] px-4 py-1.5 rounded-lg font-black transition cursor-pointer"
                                    >
                                      ارسال و ثبت پاسخ
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedFeedbackId(null);
                                        setFeedbackAdminReplyText('');
                                      }}
                                      className="bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] px-3 py-1.5 rounded-lg font-bold transition cursor-pointer border border-slate-800"
                                    >
                                      بستن کادر
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {/* 5. VIEW 5: PROTECTION SETTINGS (Bilingual sub sections) */}
                {activeAdminTab === 'settings' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Horizontal Submenu */}
                    <div className="bg-slate-950 px-6 border-b border-slate-800/80 flex gap-4">
                      <button
                        onClick={() => setActiveSubTab('app')}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'app' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        تنظیمات عمومی کلاینت
                      </button>
                      <button
                        onClick={() => setActiveSubTab('password')}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'password' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        رمز عبور پنل مدیریت
                      </button>
                      <button
                        onClick={() => setActiveSubTab('theme')}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'theme' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        شخصی‌سازی ظاهر و تم
                      </button>
                      <button
                        onClick={() => setActiveSubTab('internet')}
                        className={`py-3.5 px-1 border-b-2 text-xs font-bold transition cursor-pointer ${
                          activeSubTab === 'internet' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        کنترل اینترنت و پهنای باند
                      </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                      
                      {/* GENERAL PROTECTION SETTINGS */}
                      {activeSubTab === 'app' && (
                        <div className="max-w-md mx-auto bg-slate-950/40 border border-slate-800 p-6 rounded-xl space-y-4">
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 block">نام نمایشی سیستم:</label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                              value={gamenetNameInput}
                              onChange={(e) => setGamenetNameInput(e.target.value)}
                            />
                          </div>

                          <div className="space-y-3 pt-2">
                            <h5 className="text-[11px] font-bold text-slate-400">سیاست‌ها و پارامترهای مسدودسازی</h5>
                            
                            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                              <span className="text-xs text-slate-300">پخش هشدارهای صوتی (بیپ شمارش معکوس)</span>
                              <input
                                type="checkbox"
                                className="rounded border-slate-800 bg-slate-900 text-cyan-500"
                                checked={beepSoundConfig}
                                onChange={(e) => setBeepSoundConfig(e.target.checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                              <span className="text-xs text-slate-300">مسدودسازی خودکار ابزار Task Manager ویندوز</span>
                              <input
                                type="checkbox"
                                className="rounded border-slate-800 bg-slate-900 text-cyan-500"
                                checked={tmBlockConfig}
                                onChange={(e) => setTmBlockConfig(e.target.checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                              <span className="text-xs text-slate-300">مسدودسازی بستن برنامه بدون پسورد ادمین</span>
                              <input
                                type="checkbox"
                                className="rounded border-slate-800 bg-slate-900 text-cyan-500"
                                checked={exitBlockConfig}
                                onChange={(e) => setExitBlockConfig(e.target.checked)}
                              />
                            </div>

                            <div className="border-t border-slate-800/80 my-3" />

                            <h5 className="text-[11px] font-black text-slate-400">⌨️ پیکربندی کلیدهای میانبر و پروتکل لایه فریب</h5>

                            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                              <span className="text-xs text-slate-300">کلید قفل اضطراری دسکتاپ:</span>
                              <select
                                value={lockHotkeyConfig}
                                onChange={(e) => setLockHotkeyConfig(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-cyan-400 font-bold text-xs rounded-lg py-1 px-2.5 focus:outline-none cursor-pointer"
                              >
                                <option value="F4">F4</option>
                                <option value="F8">F8 (پیش‌فرض)</option>
                                <option value="F9">F9</option>
                                <option value="F12">F12</option>
                                <option value="Escape">Esc</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                              <span className="text-xs text-slate-300">کلید جابجایی بین پنل و دسکتاپ:</span>
                              <select
                                value={toggleHotkeyConfig}
                                onChange={(e) => setToggleHotkeyConfig(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-cyan-400 font-bold text-xs rounded-lg py-1 px-2.5 focus:outline-none cursor-pointer"
                              >
                                <option value="F7">F7 (پیش‌فرض)</option>
                                <option value="F10">F10</option>
                                <option value="F11">F11</option>
                                <option value="Insert">Insert</option>
                                <option value="Home">Home</option>
                              </select>
                            </div>
                          </div>

                          <button
                            onClick={handleAdminSaveSettings}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs py-2 rounded-lg cursor-pointer transition mb-2"
                          >
                            ذخیره تنظیمات سیستم کلاینت
                          </button>

                          {/* Simulated System Alerts Section for Admin */}
                          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
                            <h5 className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                              <span>🔔 سیستم ارسال و شبیه‌سازی اعلان دسکتاپ</span>
                            </h5>
                            <p className="text-[9px] text-slate-500 leading-normal">
                              با کلیک بر روی گزینه‌های زیر، فورا یک رویداد به‌روزرسانی سیستم یا رویداد فایروال امنیتی را روی دسکتاپ این کلاینت شبیه‌سازی کنید:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => triggerSystemAlert(
                                  'update',
                                  'به‌روزرسانی موفقیت‌آمیز سیستم',
                                  'آخرین بروزرسانی سیستم کلاینت از راه دور توسط ادمین در ساعت جاری اعمال شد.'
                                )}
                                className="bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 text-[9px] py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin-slow" />
                                ارسال پچ بروزرسانی
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerSystemAlert(
                                  'security',
                                  'رویداد امنیتی مسدود شده',
                                  'یک نفوذ ترافیکی مشکوک شناسایی و توسط فایروال سیستم با موفقیت قرنطینه گردید.'
                                )}
                                className="bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 text-[9px] py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Shield className="w-3 h-3 text-red-400 animate-pulse" />
                                شبیه‌سازی تهدید امنیتی
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ADMIN PASSWORD CHANGE */}
                      {activeSubTab === 'password' && (
                        <div className="max-w-md mx-auto bg-slate-950/40 border border-slate-800 p-6 rounded-xl">
                          <form onSubmit={handleAdminChangePassword} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">رمز عبور قدیمی مدیریت:</label>
                              <input
                                type="password"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                value={adminOldPass}
                                onChange={(e) => setAdminOldPass(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">رمز عبور جدید مدیریت (حداقل ۸ حرف):</label>
                              <input
                                type="password"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                value={adminNewPass}
                                onChange={(e) => setAdminNewPass(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">تکرار کلمه عبور جدید:</label>
                              <input
                                type="password"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                                value={adminConfirmPass}
                                onChange={(e) => setAdminConfirmPass(e.target.value)}
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs py-2 rounded-lg cursor-pointer transition"
                            >
                              تغییر کلمه عبور ادمین اصلی
                            </button>
                          </form>
                        </div>
                      )}

                      {/* ADMIN SYSTEM THEMING & PERSONALIZATION */}
                      {activeSubTab === 'theme' && (
                        <div className="max-w-xl mx-auto space-y-6">
                          
                          {/* Part 1: Admin Panel Theme & Wallpaper */}
                          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-xl space-y-4">
                            <h4 className="text-xs font-black text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                              <Settings className="w-4 h-4 text-cyan-400" />
                              شخصی‌سازی ظاهر محیط مدیریت
                            </h4>

                            <div className="space-y-4">
                              {/* Theme Color Picker */}
                              <div className="space-y-2">
                                <label className="text-[11px] text-slate-400 block font-bold">انتخاب رنگ تم پنل مدیریت:</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {[
                                    { id: 'cyan', name: 'سایان', colorClass: 'bg-cyan-500' },
                                    { id: 'emerald', name: 'ونوم', colorClass: 'bg-emerald-500' },
                                    { id: 'purple', name: 'پرتو بنفش', colorClass: 'bg-purple-500' },
                                    { id: 'amber', name: 'شنگرف', colorClass: 'bg-amber-500' },
                                    { id: 'rose', name: 'روبی', colorClass: 'bg-rose-500' },
                                    { id: 'indigo', name: 'آبی کازمیک', colorClass: 'bg-indigo-500' }
                                  ].map((th) => (
                                    <button
                                      key={th.id}
                                      onClick={() => setAdminThemeColor(th.id)}
                                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                                        adminThemeColor === th.id
                                          ? 'border-cyan-400 bg-slate-900 shadow-md'
                                          : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-800'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full ${th.colorClass} shadow-inner`} />
                                      <span className="text-[9px] font-black text-slate-400">{th.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Desktop Wallpaper */}
                              <div className="space-y-2 pt-2">
                                <label className="text-[11px] text-slate-400 block font-bold">پس‌زمینه پیش‌فرض دسکتاپ مدیریت:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                                  {[
                                    { 
                                      id: 'grid', 
                                      title: 'شبکه دیجیتال (Grid)', 
                                      desc: 'طرح اصلی اتمسفر گیمنت',
                                      preview: 'bg-gradient-to-br from-indigo-950 to-slate-950 border-indigo-500/20' 
                                    },
                                    { 
                                      id: 'neon', 
                                      title: 'شفق بنفش نئون (Neon)', 
                                      desc: 'پوسته‌ مدرن سایبرپانکی',
                                      preview: 'bg-gradient-to-br from-fuchsia-950 to-slate-950 border-pink-500/20' 
                                    },
                                    { 
                                      id: 'cosmic', 
                                      title: 'ستاره‌های عمیق (Cosmic)', 
                                      desc: 'فضای کیهانی پرستاره ملایم',
                                      preview: 'bg-gradient-to-br from-sky-950 to-slate-950 border-cyan-500/20' 
                                    },
                                    { 
                                      id: 'minimal', 
                                      title: 'کربن مشکی (Carbon)', 
                                      desc: 'طرح تیره ملایم و چشم‌نواز',
                                      preview: 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/20' 
                                    },
                                  ].map((wall) => (
                                    <button
                                      key={wall.id}
                                      onClick={() => setAdminWallpaper(wall.id)}
                                      className={`p-2 rounded-xl border text-right transition cursor-pointer flex gap-2 items-center ${
                                        adminWallpaper === wall.id
                                          ? 'border-cyan-400 bg-slate-900 shadow-md'
                                          : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-800'
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-lg ${wall.preview} border flex-shrink-0`} />
                                      <div className="leading-tight">
                                        <p className="text-[10px] font-black text-slate-200">{wall.title}</p>
                                        <p className="text-[8px] text-slate-500 mt-0.5">{wall.desc}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Part 2: System Lock Screen Customization */}
                          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-xl space-y-4">
                            <h4 className="text-xs font-black text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                              <Lock className="w-4 h-4 text-cyan-400" />
                              تنظیمات ظاهر صفحه قفل سیستم (Lock Screen)
                            </h4>

                            <div className="space-y-4">
                              {/* Lock Theme Picker */}
                              <div className="space-y-2">
                                <label className="text-[11px] text-slate-400 block font-bold">رنگ تم و نورهای نئون صفحه قفل:</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {[
                                    { id: 'cyan', name: 'سایان', colorClass: 'bg-cyan-500' },
                                    { id: 'emerald', name: 'ونوم', colorClass: 'bg-emerald-500' },
                                    { id: 'purple', name: 'پرتو بنفش', colorClass: 'bg-purple-500' },
                                    { id: 'amber', name: 'شنگرف', colorClass: 'bg-amber-500' },
                                    { id: 'rose', name: 'روبی', colorClass: 'bg-rose-500' },
                                    { id: 'indigo', name: 'آبی کازمیک', colorClass: 'bg-indigo-500' }
                                  ].map((th) => (
                                    <button
                                      key={th.id}
                                      onClick={() => setLockTheme(th.id)}
                                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                                        lockTheme === th.id
                                          ? 'border-cyan-400 bg-slate-900 shadow-md'
                                          : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-800'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full ${th.colorClass} shadow-inner`} />
                                      <span className="text-[9px] font-black text-slate-400">{th.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Lock Wallpaper Picker */}
                              <div className="space-y-2 pt-2">
                                <label className="text-[11px] text-slate-400 block font-bold">تصویر پس‌زمینه صفحه قفل سیستم:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                                  {[
                                    { 
                                      id: 'grid', 
                                      title: 'شبکه دیجیتال (Grid)', 
                                      desc: 'طرح اصلی اتمسفر گیمنت',
                                      preview: 'bg-gradient-to-br from-indigo-950 to-slate-950 border-indigo-500/20' 
                                    },
                                    { 
                                      id: 'neon', 
                                      title: 'شفق بنفش نئون (Neon)', 
                                      desc: 'پوسته‌ مدرن سایبرپانکی',
                                      preview: 'bg-gradient-to-br from-fuchsia-950 to-slate-950 border-pink-500/20' 
                                    },
                                    { 
                                      id: 'cosmic', 
                                      title: 'ستاره‌های عمیق (Cosmic)', 
                                      desc: 'فضای کیهانی پرستاره ملایم',
                                      preview: 'bg-gradient-to-br from-sky-950 to-slate-950 border-cyan-500/20' 
                                    },
                                    { 
                                      id: 'minimal', 
                                      title: 'کربن مشکی (Carbon)', 
                                      desc: 'طرح تیره ملایم و چشم‌نواز',
                                      preview: 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/20' 
                                    },
                                  ].map((wall) => (
                                    <button
                                      key={wall.id}
                                      onClick={() => setLockWallpaper(wall.id)}
                                      className={`p-2 rounded-xl border text-right transition cursor-pointer flex gap-2 items-center ${
                                        lockWallpaper === wall.id
                                          ? 'border-cyan-400 bg-slate-900 shadow-md'
                                          : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-800'
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-lg ${wall.preview} border flex-shrink-0`} />
                                      <div className="leading-tight">
                                        <p className="text-[10px] font-black text-slate-200">{wall.title}</p>
                                        <p className="text-[8px] text-slate-500 mt-0.5">{wall.desc}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* INTERNET ACCESS CONTROL SETTINGS */}
                      {activeSubTab === 'internet' && (
                        <div className="max-w-md mx-auto bg-slate-950/40 border border-slate-800 p-6 rounded-xl space-y-5 text-right">
                          <h4 className="text-xs font-black text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Globe className="w-4 h-4 text-cyan-400" />
                            تنظیمات کنترل پهنای باند و محدودیت اینترنت کاربران
                          </h4>

                          <div className="space-y-4">
                            {/* Volume Limit */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">سقف ترافیک مجاز هر کاربر (Volume Limit):</label>
                              <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                value={internetVolumeLimit}
                                onChange={(e) => {
                                  setInternetVolumeLimit(e.target.value);
                                  addLog('info', `سقف ترافیک مجاز اینترنت کاربران به [${e.target.value}] تغییر یافت.`, 'مدیریت');
                                }}
                              >
                                <option value="۵۰۰ مگابایت">۵۰۰ مگابایت در روز</option>
                                <option value="۱ گیگابایت">۱ گیگابایت در روز</option>
                                <option value="۲ گیگابایت">۲ گیگابایت در روز</option>
                                <option value="۵ گیگابایت">۵ گیگابایت در روز</option>
                                <option value="۱۰ گیگابایت">۱۰ گیگابایت در روز</option>
                                <option value="نامحدود">نامحدود (بدون محدودیت حجمی)</option>
                              </select>
                            </div>

                            {/* Download Speed */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">حداکثر سرعت دانلود (Download Speed Limit):</label>
                              <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                value={internetDownloadSpeed}
                                onChange={(e) => {
                                  setInternetDownloadSpeed(e.target.value);
                                  addLog('info', `سرعت دانلود اینترنت کاربران به [${e.target.value}] محدود شد.`, 'مدیریت');
                                }}
                              >
                                <option value="۵۱۲ کیلوبیت">۵۱۲ کیلوبیت بر ثانیه</option>
                                <option value="۱ مگابیت">۱ مگابیت بر ثانیه</option>
                                <option value="۲ مگابیت">۲ مگابیت بر ثانیه</option>
                                <option value="۴ مگابیت">۴ مگابیت بر ثانیه</option>
                                <option value="۸ مگابیت">۸ مگابیت بر ثانیه</option>
                                <option value="۱۶ مگابیت">۱۶ مگابیت بر ثانیه</option>
                                <option value="نامحدود">نامحدود (حداکثر کشش پهنای باند)</option>
                              </select>
                            </div>

                            {/* Upload Speed */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">حداکثر سرعت آپلود (Upload Speed Limit):</label>
                              <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                value={internetUploadSpeed}
                                onChange={(e) => {
                                  setInternetUploadSpeed(e.target.value);
                                  addLog('info', `سرعت آپلود اینترنت کاربران به [${e.target.value}] محدود شد.`, 'مدیریت');
                                }}
                              >
                                <option value="۱۲۸ کیلوبیت">۱۲۸ کیلوبیت بر ثانیه</option>
                                <option value="۲۵۶ کیلوبیت">۲۵۶ کیلوبیت بر ثانیه</option>
                                <option value="۵۱۲ کیلوبیت">۵۱۲ کیلوبیت بر ثانیه</option>
                                <option value="۱ مگابیت">۱ مگابیت بر ثانیه</option>
                                <option value="۲ مگابیت">۲ مگابیت بر ثانیه</option>
                                <option value="۵ مگابیت">۵ مگابیت بر ثانیه</option>
                                <option value="نامحدود">نامحدود (حداکثر سرعت اتصال)</option>
                              </select>
                            </div>

                            {/* Separate Time Limit */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400 block">زمان مجاز استفاده از اینترنت در هر جلسه (Internet Duration):</label>
                              <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 cursor-pointer font-sans"
                                value={internetTimeLimit}
                                onChange={(e) => {
                                  setInternetTimeLimit(e.target.value);
                                  addLog('info', `محدودیت زمانی اینترنت به [${e.target.value}] تنظیم شد.`, 'مدیریت');
                                }}
                              >
                                <option value="۱۵ دقیقه">۱۵ دقیقه در هر جلسه</option>
                                <option value="۳۰ دقیقه">۳۰ دقیقه در هر جلسه</option>
                                <option value="۱ ساعت">۱ ساعت در هر جلسه</option>
                                <option value="۲ ساعت">۲ ساعت در هر جلسه</option>
                                <option value="همزمان با جلسه اصلی">همزمان با جلسه اصلی (بدون محدودیت زمانی مجزا)</option>
                              </select>
                            </div>

                            {/* Blocked Apps Checkboxes */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/60">
                              <label className="text-[11px] text-slate-400 block font-bold">محدودسازی دسترسی اینترنت برنامه‌ها (فایروال برنامه):</label>
                              <p className="text-[9px] text-slate-500 leading-relaxed mb-2">
                                برنامه‌های علامت‌گذاری شده به طور کامل توسط سیستم فایروال محلی از دسترسی به اینترنت محروم خواهند شد.
                              </p>
                              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2.5 max-h-[150px] overflow-y-auto">
                                {simulatedApps.map((app) => {
                                  const isBlocked = internetBlockedApps.includes(app.name);
                                  return (
                                    <div key={app.id} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{app.icon}</span>
                                        <span className="text-xs text-slate-300 font-semibold">{app.name}</span>
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="rounded border-slate-800 bg-slate-950 text-cyan-500 cursor-pointer w-4 h-4"
                                        checked={isBlocked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setInternetBlockedApps(prev => [...prev, app.name]);
                                            addLog('warning', `دسترسی به اینترنت برای برنامه [${app.name}] مسدود شد.`, 'مدیریت');
                                          } else {
                                            setInternetBlockedApps(prev => prev.filter(name => name !== app.name));
                                            addLog('success', `دسترسی به اینترنت برای برنامه [${app.name}] مجدداً فعال شد.`, 'مدیریت');
                                          }
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                                {simulatedApps.length === 0 && (
                                  <p className="text-[10px] text-slate-500 text-center py-2 font-sans">هیچ برنامه‌ای در سیستم تعریف نشده است.</p>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>

            </div>
          </motion.div>
        )}

      </div>

      {/* STAGE 3: THE WINDOWS TASKBAR WITH TIME, SYSTEM TRAY, START MENU & SERVICE ICONS */}
      <div className="h-12 w-full bg-slate-950 border-t border-slate-800 px-4 flex justify-between items-center z-50">
        
        {/* RIGHT SIDE: START MENU & QUICK ICONS */}
        <div className="flex items-center gap-1 relative">
          {/* Start Button */}
          <motion.button
            id="taskbar-start-btn"
            onClick={() => {
              setIsStartMenuOpen(!isStartMenuOpen);
              setShowCalendar(false); // Close calendar if open
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            animate={{ y: [0, -1, 0] }}
            transition={{
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              scale: { duration: 0.15 }
            }}
            className={`h-10 px-4 rounded transition flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer ${
              isStartMenuOpen ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/35' : 'hover:bg-white/5'
            }`}
          >
            <div className="w-5 h-5 rounded bg-cyan-500 flex items-center justify-center text-slate-950 font-black text-[10px]">X</div>
            <span>شروع (Start)</span>
          </motion.button>

          {/* Start Menu Popup */}
          <AnimatePresence>
            {isStartMenuOpen && (
              <motion.div
                id="xguard-start-menu"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 right-0 w-85 bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] z-[1000] text-right font-sans"
                dir="rtl"
              >
                {/* User Profile Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-900 mb-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    {currentUser === 'admin' ? 'A' : (activeUser?.username?.substring(0, 2).toUpperCase() || 'U')}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-xs font-bold text-slate-100">
                      {currentUser === 'admin' ? 'مدیر سیستم (Administrator)' : (activeUser?.gamerTag || activeUser?.username || 'کاربر مهمان')}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-400">سیستم فعال و ایمن</span>
                    </div>
                  </div>
                </div>

                {/* Grid of Shortcuts */}
                <div className="mb-4">
                  <div className="text-[10px] text-slate-500 font-bold mb-2 mr-1">برنامه‌ها و ابزارهای سیستم:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsStartMenuOpen(false);
                        setShowWifiWindow(true);
                        setActiveWindowId('wifi-settings-window');
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 text-right text-[11px] transition duration-150 cursor-pointer"
                    >
                      <Wifi className="w-4 h-4 text-cyan-400" />
                      <span>تنظیمات وای‌فای</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsStartMenuOpen(false);
                        setShowSoundWindow(true);
                        setActiveWindowId('sound-settings-window');
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850 hover:border-purple-500/30 text-slate-300 hover:text-purple-400 text-right text-[11px] transition duration-150 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-purple-400" />
                      <span>تنظیمات صدا</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsStartMenuOpen(false);
                        setShowMouseWindow(true);
                        setActiveWindowId('mouse-settings-window');
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 text-right text-[11px] transition duration-150 cursor-pointer"
                    >
                      <MousePointer className="w-4 h-4 text-emerald-400" />
                      <span>تنظیمات موس</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsStartMenuOpen(false);
                        if (currentUser === 'admin') {
                          setShowAdminPanel(true);
                        } else {
                          setExitError('');
                          setExitPasswordInput('');
                          setExitProtectionPurpose('admin');
                          setShowExitPasswordDialog(true);
                        }
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/85 border border-slate-850 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 text-right text-[11px] transition duration-150 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>پنل تنظیمات مدیریت</span>
                    </button>
                  </div>
                </div>

                {/* X-Guard Operations */}
                <div className="space-y-1.5 border-t border-slate-900 pt-3">
                  <div className="text-[10px] text-slate-500 font-bold mb-1 mr-1">سامانه نگهبان X-Guard:</div>
                  
                  {activeUser && (
                    <button
                      onClick={() => {
                        setIsStartMenuOpen(false);
                        setIsUserWidgetCollapsed(false);
                        triggerToast('کنترلر شناور تایمر مجدداً فعال گردید.', 'info');
                      }}
                      className="w-full flex items-center gap-2 text-right px-3 py-2 rounded-lg bg-slate-900/20 hover:bg-slate-900/60 hover:text-white border border-transparent hover:border-slate-800 transition cursor-pointer text-xs"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-500" />
                      <span>نمایش مجدد کادر شناور تایمر</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsStartMenuOpen(false);
                      playLockSound();
                      if (activeUser) {
                        const elapsedSecs = Math.floor((Date.now() - loginTimeRef.current) / 1000);
                        const mins = Math.floor(elapsedSecs / 60);
                        const secs = elapsedSecs % 60;
                        addLog('info', `کاربر رایانه را به طور موقت قفل کرد. مدت زمان جلسه: ${mins} دقیقه و ${secs} ثانیه.`, activeUser.username);
                      } else {
                        addLog('info', 'رایانه توسط ادمین قفل شد.', 'مدیریت');
                      }
                      onLock();
                    }}
                    className="w-full flex items-center gap-2 text-right px-3 py-2 rounded-lg bg-slate-900/20 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 border border-transparent hover:border-amber-500/20 transition cursor-pointer text-xs font-bold"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>قفل کردن فوری رایانه (Lock)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsStartMenuOpen(false);
                      setExitError('');
                      setExitPasswordInput('');
                      setExitProtectionPurpose('exit');
                      setShowExitPasswordDialog(true);
                    }}
                    className="w-full flex items-center gap-2 text-right px-3 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/20 transition cursor-pointer text-xs font-black"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>خروج کامل و بستن X-Guard (رمز ادمین)</span>
                  </button>
                </div>

                {/* Signature inside Start Menu */}
                <div className="border-t border-slate-900 mt-3 pt-2 text-center text-[10px] text-slate-500 font-bold select-none">
                  ساخته شده با ❤️ و ☕ توسط Amir-X
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <span className="w-[1px] h-6 bg-slate-800 mx-2" />

          {/* Running program quick tiles in taskbar */}
          {simulatedApps.filter(app => app.status === 'running').map(app => (
            <button
              key={app.id}
              onClick={() => {
                // Focus app window (trigger toast)
                triggerToast(`شبیه‌ساز پنجره بازی [${app.name}] فعال است.`, 'info');
              }}
              className="h-10 px-3 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer max-w-[120px]"
            >
              <span>{app.icon}</span>
              <span className="truncate">{app.name}</span>
            </button>
          ))}
        </div>

        {/* CENTER: DESKTOP DECORATION */}
        <div className="hidden lg:flex items-center justify-center font-mono text-[10px] text-slate-600">
          X-GUARD CLIENT PROTECTION ENGINE ACTIVE • DESKTOP v1.4 • STANDALONE
        </div>

        {/* LEFT SIDE: SYSTEM CLOCK & TRAY ICONS WITH CONTEXT MENU */}
        <div className="flex items-center gap-3 font-mono relative">
          
          {/* SYSTEM TRAY ICONS */}
          <div className="flex items-center gap-2.5 text-slate-500 text-xs">
            {battery.supported && battery.hasBattery && (
              <div className="relative">
                <motion.div 
                  onClick={() => setShowBatteryPopover(!showBatteryPopover)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  animate={{ y: [0, -1, 0] }}
                  transition={{
                    y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
                    scale: { duration: 0.15 }
                  }}
                  className="flex items-center gap-1 cursor-pointer mr-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition"
                >
                  {battery.charging ? (
                    <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
                  ) : battery.level <= 0.2 ? (
                    <BatteryLow className="w-4 h-4 text-rose-500 animate-pulse" />
                  ) : battery.level <= 0.6 ? (
                    <BatteryMedium className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Battery className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-[10px] font-mono select-none font-rounded-num text-slate-400">
                    {Math.round(battery.level * 100)}%
                  </span>
                </motion.div>

                <AnimatePresence>
                  {showBatteryPopover && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: -8, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute bottom-9 left-0 w-64 bg-slate-950/95 border border-cyan-500/20 p-4 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-md z-[1001] text-right font-sans space-y-4"
                      dir="rtl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-[10px] font-black text-slate-300">جزئیات باتری سیستم کلاینت</span>
                        <span className="text-[9px] text-slate-500 font-mono">BATTERY-INFO</span>
                      </div>

                      {/* Radial Progress and Stats */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 flex items-center justify-center rounded-full border border-slate-900 bg-slate-900/40">
                          <span className="text-sm font-black text-cyan-400 font-mono">{Math.round(battery.level * 100)}%</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-200">
                            {battery.charging ? 'در حال شارژ با کابل AC' : 'درحال کار روی باتری داخلی'}
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {battery.charging ? 'جریان ورودی: ۲۴ وات فست شارژ' : 'حدود ۳ ساعت و ۴۵ دقیقه باقی‌مانده'}
                          </p>
                        </div>
                      </div>

                      {/* Technical Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-950 border border-slate-900 p-2 rounded-lg">
                        <div className="text-slate-500">سلامت فیزیکی:</div>
                        <div className="text-emerald-400 font-bold text-left">عالی (۹۸٪)</div>
                        <div className="text-slate-500">دمای سلول‌ها:</div>
                        <div className="text-slate-300 text-left">۳۲ °C</div>
                        <div className="text-slate-500">ولتاژ مصرفی:</div>
                        <div className="text-slate-300 text-left">۱۲.۴ ولت</div>
                        <div className="text-slate-500">ظرفیت طراحی:</div>
                        <div className="text-slate-300 text-left">۴,۸۰۰ mAh</div>
                      </div>

                      {/* Dynamic plugging simulator toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBattery(prev => ({
                            ...prev,
                            charging: !prev.charging,
                            level: prev.charging ? Math.max(0.1, prev.level - 0.1) : Math.min(1.0, prev.level + 0.1)
                          }));
                          triggerToast('وضعیت شارژ باتری به‌طور مجازی شبیه‌سازی شد.', 'info');
                        }}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-1.5 rounded-lg text-[9px] font-black transition cursor-pointer text-center"
                      >
                        {battery.charging ? '🔌 قطع مجازی کابل شارژر' : '⚡ اتصال مجازی کابل شارژر'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Volume2 
              onClick={() => {
                setShowSoundWindow(true);
                setActiveWindowId('sound-settings-window');
              }}
              className="w-4 h-4 cursor-pointer hover:text-slate-300 transition-colors" 
              title={t('shortcut_sound')}
            />
            <Wifi 
              onClick={() => {
                setShowWifiWindow(true);
                setActiveWindowId('wifi-settings-window');
              }}
              className="w-4 h-4 cursor-pointer hover:text-slate-300 transition-colors" 
              title={t('shortcut_wifi')}
            />
            
            {/* THE SECURITY TRAY SERVICE ICON */}
            <div className="relative">
              <button
                id="xguard-tray-icon"
                onMouseEnter={() => setShowGuardianTooltip(true)}
                onMouseLeave={() => setShowGuardianTooltip(false)}
                className="w-7 h-7 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/60 flex items-center justify-center text-cyan-400 cursor-pointer animate-pulse"
              >
                <Shield className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showGuardianTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: -8 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 border border-cyan-500/50 px-3 py-1.5 rounded-lg text-[10px] text-cyan-400 font-bold font-sans shadow-[0_0_15px_rgba(6,182,212,0.35)] backdrop-blur-md z-[1001]"
                    dir="rtl"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>سیستم بدون مشکل فعال است</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <span className="w-[1px] h-5 bg-slate-800" />

          {/* CLOCK AREA */}
          <motion.div 
            onClick={() => {
              setShowCalendar(!showCalendar);
              setIsStartMenuOpen(false); // Close start menu if open
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            animate={{ y: [0, -1, 0] }}
            transition={{
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              scale: { duration: 0.15 }
            }}
            className="flex flex-col items-center justify-center leading-none text-right cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors"
          >
            <span className="text-[11px] font-bold text-slate-300 tabular-nums">
              {desktopTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[8px] text-slate-500 mt-0.5">
              {desktopTime.toLocaleDateString('fa-IR', { month: '2-digit', day: '2-digit' })}
            </span>
          </motion.div>

          {/* MINIMAL CALENDAR & CLOCK POPUP */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 left-0 w-80 bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] z-[1000] text-right text-xs text-slate-300 font-sans"
                dir="rtl"
              >
                {/* Live Clock with Seconds */}
                <div className="pb-3 border-b border-slate-900 mb-3 text-right">
                  <div className="font-mono text-2xl font-black text-cyan-400 font-rounded-num tracking-widest leading-none">
                    {desktopTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-bold">
                    {desktopTime.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* Calendar Month Switcher Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition duration-150 cursor-pointer text-xs"
                  >
                    ←
                  </button>
                  
                  <span className="text-xs font-bold text-slate-100 font-rounded-num">
                    {new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(viewDate)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition duration-150 cursor-pointer text-xs"
                  >
                    →
                  </button>
                </div>

                {/* Weekdays Headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-slate-500 mb-1">
                  {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(w => <span key={w}>{w}</span>)}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-rounded-num">
                  {(() => {
                    const grid = [];
                    const year = viewDate.getFullYear();
                    const month = viewDate.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const jsDay = firstDay.getDay(); // 0-6 (Sun-Sat)
                    
                    // Persian week starts on Saturday (Sat=6, Sun=0, Mon=1, etc)
                    const offset = (jsDay + 1) % 7;
                    
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - offset);
                    
                    for (let i = 0; i < 42; i++) {
                      const cellDate = new Date(startDate);
                      cellDate.setDate(cellDate.getDate() + i);
                      grid.push(cellDate);
                    }

                    return grid.map((cellDate, idx) => {
                      const isCurrentMonth = cellDate.getMonth() === viewDate.getMonth();
                      const isToday = cellDate.toDateString() === new Date().toDateString();
                      
                      // Day display string (Persian digits)
                      const dayDisplay = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(cellDate);

                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerToast(`تاریخ انتخاب شده: ${cellDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}`, 'info');
                          }}
                          className={`h-7 w-full rounded-md flex items-center justify-center font-bold transition duration-150 cursor-pointer ${
                            isToday
                              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                              : isCurrentMonth
                                ? 'text-slate-200 hover:bg-slate-900 hover:text-cyan-400'
                                : 'text-slate-600 hover:bg-slate-900/40'
                          }`}
                          title={cellDate.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        >
                          {dayDisplay}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Signature in Calendar Popover */}
                <div className="border-t border-slate-900 mt-3 pt-2 text-center text-[10px] text-slate-500 font-bold select-none">
                  ساخته شده با ❤️ و ☕ توسط Amir-X
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* DIALOG 1: EXIT / SHUT DOWN PROTECTION (REQUIRES ADMIN PASSWORD) */}
      <AnimatePresence>
        {showExitPasswordDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <motion.div
              id="exit-protection-dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border-2 border-red-500/40 p-6 rounded-2xl shadow-2xl relative"
            >
              <div className="text-center space-y-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 animate-pulse">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="font-black text-sm text-slate-100">{t('dialog_title')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('dialog_desc')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">{t('dialog_pass_label')}</label>
                  <input
                    id="exit-admin-password-input"
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-center font-mono text-slate-100"
                    placeholder="••••••••"
                    value={exitPasswordInput}
                    onChange={(e) => setExitPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleExitProtectionAuth();
                    }}
                  />
                </div>

                {exitError && (
                  <p className="text-[10px] text-red-400 text-center">{exitError}</p>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    id="btn-exit-auth-cancel"
                    onClick={() => {
                      setShowExitPasswordDialog(false);
                      setIsTrayMenuOpen(false);
                    }}
                    className="flex-1 border border-slate-800 hover:bg-slate-850 py-2 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer text-center"
                  >
                    {t('dialog_cancel')}
                  </button>
                  <button
                    id="btn-exit-auth-confirm"
                    onClick={handleExitProtectionAuth}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center"
                  >
                    {t('dialog_confirm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG 2: TASK MANAGER BYPASS SCREEN */}
      <AnimatePresence>
        {showTaskManagerBlockDialog && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans" dir="rtl">
            <motion.div
              id="task-manager-block-dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/50 p-6 rounded-2xl shadow-2xl relative"
            >
              <div className="text-center space-y-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-black text-sm text-slate-100">هشدار حفاظتی: ابزار سیستمی مسدود است</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  درایور امنیتی X-Guard دسترسی به Windows Task Manager را غیرفعال کرده است. دور زدن حفاظت نیازمند تأیید هویت ادمین است.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">رمز عبور مدیر سیستم:</label>
                  <input
                    id="tm-admin-password-input"
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-center font-mono text-slate-100"
                    placeholder="••••••••"
                    value={taskManagerPasswordInput}
                    onChange={(e) => setTaskManagerPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTaskManagerBypassAuth();
                    }}
                  />
                </div>

                {taskManagerError && (
                  <p className="text-[10px] text-red-400 text-center">{taskManagerError}</p>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    id="btn-tm-auth-cancel"
                    onClick={() => setShowTaskManagerBlockDialog(false)}
                    className="flex-1 border border-slate-800 hover:bg-slate-850 py-2 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer"
                  >
                    مسدود بماند
                  </button>
                  <button
                    id="btn-tm-auth-confirm"
                    onClick={handleTaskManagerBypassAuth}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    تأیید و اجرای ابزار
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
}
