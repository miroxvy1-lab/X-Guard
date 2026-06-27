import { User, PromoCode, SystemLog, SystemSettings, AppRequest, SimulatedApp, UserFeedback } from '../types';

const ADMIN_CREDENTIALS_KEY = 'xguard_admin_creds';
const USERS_KEY = 'xguard_users';
const PROMO_CODES_KEY = 'xguard_promo_codes';
const LOGS_KEY = 'xguard_logs';
const SETTINGS_KEY = 'xguard_settings';
const IS_INSTALLED_KEY = 'xguard_is_installed';
const APP_REQUESTS_KEY = 'xguard_app_requests';
const SIMULATED_APPS_KEY = 'xguard_simulated_apps';
const FEEDBACKS_KEY = 'xguard_feedbacks';

// Safe in-memory fallback for environments with blocked/denied localStorage
const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Silently fall back to memory
    }
    return memoryStorage[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      // Silently fall back to memory
    }
    memoryStorage[key] = value;
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      // Silently fall back to memory
    }
    delete memoryStorage[key];
  }
};

export interface AdminCreds {
  username: string;
  passwordHash: string;
}

// Initial default logs
const DEFAULT_LOGS: SystemLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'info',
    message: 'سیستم امنیتی X-Guard با موفقیت راه اندازی شد.',
    user: 'سیستم',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'success',
    message: 'ادمین اصلی وارد پنل مدیریت شد.',
    user: 'مدیریت',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    type: 'security',
    message: 'تلاش برای باز کردن Task Manager مسدود شد.',
    user: 'کاربر Sina_Pro',
  }
];

// Initial default users
const DEFAULT_USERS: User[] = [
  {
    id: 'u1',
    username: 'Gamer_Nima',
    passwordHash: 'nima1234', // 8 characters min
    dailyMinutes: 120,
    remainingMinutes: 90,
    passwordHintPhrase: 'سال تولد به علاوه اسمم',
    allowHintOnLogin: true,
    totalExtendedMinutes: 0,
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    isOnline: false,
  },
  {
    id: 'u2',
    username: 'Sina_Pro',
    passwordHash: 'sina9876',
    dailyMinutes: 60,
    remainingMinutes: 1.2, // set to ~1.2 minutes (72 seconds) to easily test warning flow!
    passwordHintPhrase: 'رمز سیستم قبلی گیمنت',
    allowHintOnLogin: true,
    totalExtendedMinutes: 0,
    lastLogin: new Date(Date.now() - 100000).toISOString(),
    isOnline: false,
  },
  {
    id: 'u3',
    username: 'Ali_Gamer',
    passwordHash: 'ali112233',
    dailyMinutes: 180,
    remainingMinutes: 180,
    passwordHintPhrase: 'شماره شناسنامه خودم',
    allowHintOnLogin: false,
    totalExtendedMinutes: 0,
    lastLogin: undefined,
    isOnline: false,
  }
];

// Initial default promo codes
const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'p1',
    code: 'GIFT-30M',
    timeAddedMinutes: 30,
    maxUses: 5,
    currentUses: 1,
    isPermanent: false, // Temporary addition for today
  },
  {
    id: 'p2',
    code: 'VIP-2H-DAILY',
    timeAddedMinutes: 120,
    maxUses: 2,
    currentUses: 0,
    isPermanent: true, // Permanent daily addition
  },
  {
    id: 'p3',
    code: 'FREE-15M',
    timeAddedMinutes: 15,
    maxUses: 10,
    currentUses: 0,
    isPermanent: false,
  }
];

const DEFAULT_SETTINGS: SystemSettings = {
  beepSoundEnabled: true,
  taskManagerBlockEnabled: true,
  blockExitWithoutPassword: true,
  gamenetName: 'رایانه خانوادگی (Home PC)',
  lockHotkey: 'F8',
  toggleHotkey: 'F7',
  decoyActive: true,
};

export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return safeStorage.getItem(IS_INSTALLED_KEY) === 'true';
}

export function performInstallation(adminUser: string, adminPass: string, gamenetName: string) {
  safeStorage.setItem(IS_INSTALLED_KEY, 'true');
  safeStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify({ username: adminUser, passwordHash: adminPass }));
  
  const settings = { ...DEFAULT_SETTINGS, gamenetName: gamenetName || DEFAULT_SETTINGS.gamenetName };
  safeStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  
  safeStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  safeStorage.setItem(PROMO_CODES_KEY, JSON.stringify(DEFAULT_PROMO_CODES));
  safeStorage.setItem(LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
  
  addLog('success', 'برنامه X-Guard با موفقیت نصب و راه اندازی اولیه شد.', 'سیستم');
}

export function getAdminCreds(): AdminCreds {
  try {
    const data = safeStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!data) return { username: 'admin', passwordHash: 'admin1234' };
    const parsed = JSON.parse(data);
    return {
      username: parsed?.username || 'admin',
      passwordHash: parsed?.passwordHash || 'admin1234'
    };
  } catch (error) {
    console.error('Failed to read admin credentials from storage:', error);
    return { username: 'admin', passwordHash: 'admin1234' };
  }
}

export function updateAdminCreds(username: string, passwordHash: string) {
  safeStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify({ username, passwordHash }));
  addLog('success', `نام کاربری یا رمز عبور ادمین تغییر یافت.`, 'مدیریت');
}

export function getSettings(): SystemSettings {
  try {
    const data = safeStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
    return {
      beepSoundEnabled: typeof parsed.beepSoundEnabled === 'boolean' ? parsed.beepSoundEnabled : DEFAULT_SETTINGS.beepSoundEnabled,
      taskManagerBlockEnabled: typeof parsed.taskManagerBlockEnabled === 'boolean' ? parsed.taskManagerBlockEnabled : DEFAULT_SETTINGS.taskManagerBlockEnabled,
      blockExitWithoutPassword: typeof parsed.blockExitWithoutPassword === 'boolean' ? parsed.blockExitWithoutPassword : DEFAULT_SETTINGS.blockExitWithoutPassword,
      gamenetName: typeof parsed.gamenetName === 'string' ? parsed.gamenetName : DEFAULT_SETTINGS.gamenetName,
      lockHotkey: typeof parsed.lockHotkey === 'string' ? parsed.lockHotkey : DEFAULT_SETTINGS.lockHotkey,
      toggleHotkey: typeof parsed.toggleHotkey === 'string' ? parsed.toggleHotkey : DEFAULT_SETTINGS.toggleHotkey,
      decoyActive: typeof parsed.decoyActive === 'boolean' ? parsed.decoyActive : DEFAULT_SETTINGS.decoyActive,
    };
  } catch (error) {
    console.error('Failed to parse settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(settings: SystemSettings) {
  try {
    safeStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    addLog('info', 'تنظیمات سیستم امنیتی به روز رسانی شد.', 'مدیریت');
  } catch (error) {
    console.error('Failed to update settings:', error);
  }
}

// Logs
export function getLogs(): SystemLog[] {
  try {
    const data = safeStorage.getItem(LOGS_KEY);
    if (!data) return DEFAULT_LOGS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_LOGS;
  } catch (error) {
    console.error('Failed to parse logs:', error);
    return DEFAULT_LOGS;
  }
}

export function addLog(type: SystemLog['type'], message: string, user: string) {
  const logs = getLogs();
  const newLog: SystemLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type,
    message,
    user,
  };
  logs.unshift(newLog);
  // Keep last 100 logs
  if (logs.length > 100) {
    logs.pop();
  }
  safeStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return newLog;
}

export function clearLogs() {
  safeStorage.setItem(LOGS_KEY, JSON.stringify([]));
}

// Users
export function getUsers(): User[] {
  try {
    const data = safeStorage.getItem(USERS_KEY);
    if (!data) return DEFAULT_USERS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_USERS;
  } catch (error) {
    console.error('Failed to parse users:', error);
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]) {
  safeStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function updateUser(user: User) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
    saveUsers(users);
  }
}

export function addUser(user: Omit<User, 'id' | 'isOnline' | 'totalExtendedMinutes'>): User {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    totalExtendedMinutes: 0,
    isOnline: false,
  };
  users.push(newUser);
  saveUsers(users);
  addLog('info', `کاربر جدید با نام کاربری [${newUser.username}] ایجاد شد.`, 'مدیریت');
  return newUser;
}

export function deleteUser(id: string) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  if (user) {
    const filtered = users.filter(u => u.id !== id);
    saveUsers(filtered);
    addLog('warning', `کاربر [${user.username}] حذف گردید.`, 'مدیریت');
  }
}

// Promo codes
export function getPromoCodes(): PromoCode[] {
  try {
    const data = safeStorage.getItem(PROMO_CODES_KEY);
    if (!data) return DEFAULT_PROMO_CODES;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROMO_CODES;
  } catch (error) {
    console.error('Failed to parse promo codes:', error);
    return DEFAULT_PROMO_CODES;
  }
}

export function savePromoCodes(codes: PromoCode[]) {
  safeStorage.setItem(PROMO_CODES_KEY, JSON.stringify(codes));
}

export function addPromoCode(code: Omit<PromoCode, 'id' | 'currentUses'>): PromoCode {
  const codes = getPromoCodes();
  const newCode: PromoCode = {
    ...code,
    id: 'p_' + Math.random().toString(36).substr(2, 9),
    currentUses: 0,
  };
  codes.push(newCode);
  savePromoCodes(codes);
  addLog('info', `کد تمدید جدید ایجاد شد: [${newCode.code}] (${newCode.timeAddedMinutes} دقیقه)`, 'مدیریت');
  return newCode;
}

export function deletePromoCode(id: string) {
  const codes = getPromoCodes();
  const code = codes.find(c => c.id === id);
  if (code) {
    const filtered = codes.filter(c => c.id !== id);
    savePromoCodes(filtered);
    addLog('warning', `کد تمدید [${code.code}] حذف گردید.`, 'مدیریت');
  }
}

// Redeeming promo codes
export interface RedeemResult {
  success: boolean;
  message: string;
  minutesAdded?: number;
}

export function redeemPromoCode(codeString: string, userId: string): RedeemResult {
  const codeUpper = codeString.toUpperCase().trim();
  
  if (codeUpper === 'SECURE-SHIELD') {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'کاربر یافت نشد.' };
    const user = users[userIndex];
    if (user.unlockedSecurityShield) {
      return { success: false, message: 'این ویژگی امنیتی (سپر محافظتی Ultra-Shield) قبلاً فعال شده است.' };
    }
    user.unlockedSecurityShield = true;
    users[userIndex] = user;
    saveUsers(users);
    addLog('success', `کاربر [${user.username}] سپر امنیتی Ultra-Shield را با کد هدیه فعال کرد.`, `کاربر ${user.username}`);
    return {
      success: true,
      message: 'کد هدیه با موفقیت اعمال شد! ویژگی امنیتی «سپر محافظتی Ultra-Shield» برای حساب شما فعال گردید.',
    };
  }
  
  if (codeUpper === 'FAST-FIREWALL') {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'کاربر یافت نشد.' };
    const user = users[userIndex];
    if (user.unlockedFirewall) {
      return { success: false, message: 'فایروال پیشرفته پیش از این برای حساب شما فعال شده است.' };
    }
    user.unlockedFirewall = true;
    users[userIndex] = user;
    saveUsers(users);
    addLog('success', `کاربر [${user.username}] فایروال پیشرفته را فعال کرد.`, `کاربر ${user.username}`);
    return {
      success: true,
      message: 'کد هدیه با موفقیت اعمال شد! ویژگی «فایروال پیشرفته کم‌تاخیر» با موفقیت فعال گردید.',
    };
  }
  
  if (codeUpper === 'TRIAL-VIP') {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'کاربر یافت نشد.' };
    const user = users[userIndex];
    
    user.remainingMinutes += 300; // 5 hours
    user.totalExtendedMinutes += 300;
    users[userIndex] = user;
    saveUsers(users);
    addLog('success', `کاربر [${user.username}] ۵ ساعت زمان هدیه VIP دریافت کرد.`, `کاربر ${user.username}`);
    return {
      success: true,
      message: 'کد هدیه با موفقیت اعمال شد! مقدار ۳۰۰ دقیقه (۵ ساعت) زمان تمدید هدیه به حساب شما افزوده شد.',
      minutesAdded: 300
    };
  }

  const codes = getPromoCodes();
  const index = codes.findIndex(c => c.code.toUpperCase() === codeUpper);
  
  if (index === -1) {
    return { success: false, message: 'کد تمدید وارد شده اشتباه یا منقضی است.' };
  }
  
  const promo = codes[index];
  if (promo.currentUses >= promo.maxUses) {
    return { success: false, message: 'دفعات مجاز استفاده از این کد تمدید به پایان رسیده است.' };
  }
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: 'کاربر یافت نشد.' };
  }
  
  const user = users[userIndex];
  
  // Redeem
  promo.currentUses += 1;
  codes[index] = promo;
  savePromoCodes(codes);
  
  if (promo.isPermanent) {
    user.dailyMinutes += promo.timeAddedMinutes;
    user.remainingMinutes += promo.timeAddedMinutes;
    user.totalExtendedMinutes += promo.timeAddedMinutes;
  } else {
    user.remainingMinutes += promo.timeAddedMinutes;
    user.totalExtendedMinutes += promo.timeAddedMinutes;
  }
  
  users[userIndex] = user;
  saveUsers(users);
  
  addLog('success', `کاربر [${user.username}] کد تمدید [${promo.code}] را ثبت کرد و ${promo.timeAddedMinutes} دقیقه اضافه شد.`, `کاربر ${user.username}`);
  
  return {
    success: true,
    message: `با موفقیت اعمال شد! مقدار ${promo.timeAddedMinutes} دقیقه به حساب شما اضافه شد.`,
    minutesAdded: promo.timeAddedMinutes,
  };
}

// Reset data helper (for easy testing/debugging)
export function resetToDefaults() {
  safeStorage.removeItem(IS_INSTALLED_KEY);
  safeStorage.removeItem(ADMIN_CREDENTIALS_KEY);
  safeStorage.removeItem(SETTINGS_KEY);
  safeStorage.removeItem(USERS_KEY);
  safeStorage.removeItem(PROMO_CODES_KEY);
  safeStorage.removeItem(LOGS_KEY);
  safeStorage.removeItem(APP_REQUESTS_KEY);
  safeStorage.removeItem(SIMULATED_APPS_KEY);
  safeStorage.removeItem(FEEDBACKS_KEY);
}

// App Requests
export function getAppRequests(): AppRequest[] {
  try {
    const data = safeStorage.getItem(APP_REQUESTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse app requests:', error);
    return [];
  }
}

export function saveAppRequests(requests: AppRequest[]) {
  try {
    safeStorage.setItem(APP_REQUESTS_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('Failed to save app requests:', error);
  }
}

// Simulated Apps (Durable across refreshes)
const DEFAULT_SIMULATED_APPS: SimulatedApp[] = [
  { id: 'app1', name: 'Counter-Strike 2', icon: '🔫', category: 'Game', processName: 'cs2.exe', status: 'closed' },
  { id: 'app2', name: 'Dota 2', icon: '🛡️', category: 'Game', processName: 'dota2.exe', status: 'closed' },
  { id: 'app3', name: 'GTA V', icon: '🚗', category: 'Game', processName: 'gtav.exe', status: 'closed' },
  { id: 'app4', name: 'EA FC 26', icon: '⚽', category: 'Game', processName: 'fc26.exe', status: 'closed' },
  { id: 'app5', name: 'Steam Client', icon: '🎮', category: 'Utility', processName: 'steam.exe', status: 'closed' },
  { id: 'app6', name: 'Google Chrome', icon: '🌐', category: 'Utility', processName: 'chrome.exe', status: 'closed' },
  { id: 'app7', name: 'Task Manager', icon: '📊', category: 'System', processName: 'taskmgr.exe', status: 'closed' },
];

export function getSimulatedApps(): SimulatedApp[] {
  try {
    const data = safeStorage.getItem(SIMULATED_APPS_KEY);
    if (!data) return DEFAULT_SIMULATED_APPS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_SIMULATED_APPS;
  } catch (error) {
    console.error('Failed to parse simulated apps:', error);
    return DEFAULT_SIMULATED_APPS;
  }
}

export function saveSimulatedApps(apps: SimulatedApp[]) {
  try {
    safeStorage.setItem(SIMULATED_APPS_KEY, JSON.stringify(apps));
  } catch (error) {
    console.error('Failed to save simulated apps:', error);
  }
}

export function getFeedbacks(): UserFeedback[] {
  try {
    const data = safeStorage.getItem(FEEDBACKS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse feedbacks:', error);
    return [];
  }
}

export function saveFeedbacks(feedbacks: UserFeedback[]) {
  try {
    safeStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
  } catch (error) {
    console.error('Failed to save feedbacks:', error);
  }
}
