export interface User {
  id: string;
  username: string;
  passwordHash: string; // Stored in plain text for this local prototype hint system
  dailyMinutes: number;
  remainingMinutes: number;
  passwordHintPhrase: string;
  allowHintOnLogin: boolean;
  totalExtendedMinutes: number;
  lastLogin?: string;
  isOnline: boolean;
  avatar?: string;
  gamerTag?: string;
  bio?: string;
  themeColor?: 'cyan' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo';
  wallpaper?: 'grid' | 'neon' | 'cosmic' | 'minimal';
  language?: 'fa' | 'en';
  soundSuccessfulLogin?: boolean;
  soundLockout?: boolean;
  soundDeniedAccess?: boolean;
  unlockedSecurityShield?: boolean;
  unlockedFirewall?: boolean;
  useCustomInternetLimits?: boolean;
  internetVolumeLimit?: string;
  internetDownloadSpeed?: string;
  internetUploadSpeed?: string;
  internetTimeLimit?: string;
  useCustomAppLimits?: boolean;
  blockedApps?: string[];
}

export interface PromoCode {
  id: string;
  code: string;
  timeAddedMinutes: number;
  maxUses: number;
  currentUses: number;
  isPermanent: boolean; // true = adds to daily minutes permanently, false = only for today's session
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'security' | 'success';
  message: string;
  user: string;
}

export interface SimulatedApp {
  id: string;
  name: string;
  icon: string;
  category: 'Game' | 'Utility' | 'System';
  processName: string;
  status: 'closed' | 'running';
  windowPosition?: { x: number; y: number };
  useCustomInternetLimits?: boolean;
  internetBlocked?: boolean;
  downloadLimitSpeed?: string;
  uploadLimitSpeed?: string;
}

export interface SystemSettings {
  beepSoundEnabled: boolean;
  taskManagerBlockEnabled: boolean;
  blockExitWithoutPassword: boolean;
  gamenetName: string;
  lockHotkey: string;
  toggleHotkey: string;
  decoyActive: boolean;
}

export interface AppRequest {
  id: string;
  username: string;
  appName: string;
  category: 'Game' | 'Utility' | 'System';
  processName: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  purpose?: string;
  description?: string;
}

export interface UserFeedback {
  id: string;
  username: string;
  rating: number; // 1 to 5 stars
  category: 'hardware' | 'software' | 'service' | 'other';
  comment: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminResponse?: string;
}

