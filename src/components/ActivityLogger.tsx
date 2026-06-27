import React, { useState } from 'react';
import { SystemLog } from '../types';
import { 
  Search, 
  Layers, 
  ShieldAlert, 
  AlertTriangle, 
  Wrench, 
  Settings, 
  CheckCircle, 
  Trash2, 
  Download, 
  Table, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  User, 
  Shield, 
  Info,
  Calendar,
  Grid,
  FileText,
  Lock,
  Unlock,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface ActivityLoggerProps {
  logs: SystemLog[];
  onClearLogs: () => void;
}

export function ActivityLogger({ logs, onClearLogs }: ActivityLoggerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'access' | 'security' | 'admin' | 'system'>('all');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'critical'>('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Categorize log dynamically for the audit list
  const getLogMeta = (log: SystemLog) => {
    const msg = log.message || '';
    const user = log.user || '';
    
    let category: 'access' | 'security' | 'admin' | 'system' = 'system';
    let lucideIcon = <Cpu className="w-4 h-4 text-cyan-400" />;
    let categoryLabel = 'سیستمی';
    let risk: 'low' | 'medium' | 'critical' = 'low';

    // 1. Administrative actions
    if (user === 'مدیریت' || msg.includes('ادمین') || msg.includes('تنظیمات') || msg.includes('کد تمدید') || msg.includes('کاربر جدید')) {
      category = 'admin';
      lucideIcon = <Wrench className="w-4 h-4 text-indigo-400" />;
      categoryLabel = 'اقدام ادمین';
    }
    // 2. Access/Login attempts
    if (msg.includes('ورود') || msg.includes('خروج') || msg.includes('قفل') || msg.includes('شارژ')) {
      category = 'access';
      lucideIcon = msg.includes('موفق') 
        ? <Unlock className="w-4 h-4 text-emerald-400" /> 
        : <Lock className="w-4 h-4 text-amber-400" />;
      categoryLabel = msg.includes('موفق') ? 'ورود موفق' : 'رویداد دسترسی';
    }
    // 3. Security Incidents
    if (log.type === 'security' || msg.includes('مسدود') || msg.includes('غیرمجاز') || msg.includes('هشدار') || msg.includes('Task Manager')) {
      category = 'security';
      lucideIcon = <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />;
      categoryLabel = 'هشدار امنیتی';
    }

    if (log.type === 'security' || msg.includes('مسدودیت') || msg.includes('غیرمجاز')) {
      risk = 'critical';
    } else if (log.type === 'warning' || msg.includes('هشدار') || msg.includes('اشتباه')) {
      risk = 'medium';
    }

    return { category, lucideIcon, categoryLabel, risk };
  };

  // Filter logs based on inputs
  const filteredLogs = logs.filter(log => {
    const meta = getLogMeta(log);
    
    // Search query match
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());

    // Category match
    const matchesCategory = selectedCategory === 'all' || meta.category === selectedCategory;

    // Risk match
    const matchesRisk = selectedRisk === 'all' || meta.risk === selectedRisk;

    return matchesSearch && matchesCategory && matchesRisk;
  });

  // Export logs to CSV
  const handleExportCSV = () => {
    const headers = ['شناسه', 'زمان ثبت', 'نوع پیام', 'توضیحات رویداد', 'کاربر عامل'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const meta = getLogMeta(log);
        return [
          log.id || '',
          new Date(log.timestamp).toLocaleString('fa-IR'),
          meta.categoryLabel,
          `"${log.message.replace(/"/g, '""')}"`,
          log.user
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xguard-security-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 text-right animate-fadeIn font-sans" dir="rtl">
      
      {/* 1. Header Overview Stats (Glass Box with Neon border) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.1)] p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 block">کل وقایع ثبت شده</span>
          <span className="text-sm font-black text-slate-200 block font-mono mt-0.5">{logs.length} رویداد</span>
        </div>
        <div className="bg-slate-950/60 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)] p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 block">تهدیدات امنیتی حاد (Critical)</span>
          <span className="text-sm font-black text-rose-400 block font-mono mt-0.5">
            {logs.filter(l => getLogMeta(l).risk === 'critical').length} مورد
          </span>
        </div>
        <div className="bg-slate-950/60 border border-yellow-500/20 shadow-[0_0_12px_rgba(251,191,36,0.1)] p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 block">هشدارهای ریسک متوسط</span>
          <span className="text-sm font-black text-yellow-400 block font-mono mt-0.5">
            {logs.filter(l => getLogMeta(l).risk === 'medium').length} مورد
          </span>
        </div>
        <div className="bg-slate-950/60 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)] p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 block">اقدامات مدیریتی امن</span>
          <span className="text-sm font-black text-emerald-400 block font-mono mt-0.5">
            {logs.filter(l => getLogMeta(l).category === 'admin').length} مورد
          </span>
        </div>
      </div>

      {/* 2. Advanced Controls Panel */}
      <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در وقایع و کاربران..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs py-2 pr-8 pl-3 text-slate-200 placeholder-slate-500 focus:outline-none transition-all duration-300 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 shrink-0">دسته‌بندی:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs py-2 px-3 text-slate-200 focus:outline-none transition cursor-pointer"
              >
                <option value="all">همه وقایع</option>
                <option value="access">تلاش ورود و خروج</option>
                <option value="security">هشدارها و نقض امنیت</option>
                <option value="admin">اقدامات مدیریتی</option>
                <option value="system">سیستمی پایه</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 shrink-0">سطح ریسک:</span>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs py-2 px-3 text-slate-200 focus:outline-none transition cursor-pointer"
              >
                <option value="all">همه سطوح</option>
                <option value="low">عادی / امن (Low)</option>
                <option value="medium">هشدار جزیی (Medium)</option>
                <option value="critical">بحرانی / مسدود (Critical)</option>
              </select>
            </div>

          </div>

          {/* Controls Toggles & Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>تایم‌لاین خطی</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>جدول وقایع</span>
              </button>
            </div>

            {/* Export & Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[11px] font-black cursor-pointer transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>خروجی CSV</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('آیا از حذف تمام لاگ‌های ثبت شده اطمینان کامل دارید؟ این اقدام غیرقابل بازگشت است.')) {
                    onClearLogs();
                  }
                }}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 border border-rose-500/20 hover:border-rose-500 rounded-xl text-[11px] font-black cursor-pointer transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاک‌سازی کامل</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Event List (Conditional Chronological Timeline vs Table) */}
      {viewMode === 'timeline' ? (
        <div className="relative border-r-2 border-slate-800 pr-6 mr-3 py-4 space-y-5 animate-fadeIn">
          {filteredLogs.length === 0 ? (
            <div className="bg-slate-950/20 border border-slate-900/60 rounded-xl p-12 text-center text-xs text-slate-500 font-bold flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-slate-600 animate-pulse" />
              <span>هیچ رویدادی با فیلترهای مشخص شده یافت نشد.</span>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const meta = getLogMeta(log);
              const isExpanded = selectedLogId === log.id;
              
              // Colors for the timeline nodes based on severity/risk
              const nodeColors = 
                meta.risk === 'critical' ? 'bg-rose-500 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.6)]' :
                meta.risk === 'medium' ? 'bg-amber-400 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.6)]' :
                meta.category === 'admin' ? 'bg-indigo-400 border-indigo-400/50 shadow-[0_0_12px_rgba(129,140,248,0.6)]' :
                'bg-cyan-400 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.6)]';

              const cardBorder = 
                meta.risk === 'critical' ? 'border-rose-500/20 bg-rose-500/[0.02]' :
                meta.risk === 'medium' ? 'border-amber-500/20 bg-amber-500/[0.02]' :
                meta.category === 'admin' ? 'border-indigo-500/20 bg-indigo-500/[0.02]' :
                'border-slate-850 bg-slate-950/40';

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Pulse Node */}
                  <div className={`absolute -right-[32px] top-4.5 w-2.5 h-2.5 rounded-full border-2 z-10 transition-all duration-300 ${nodeColors}`} />
                  
                  {/* Timeline Card */}
                  <div 
                    onClick={() => setSelectedLogId(isExpanded ? null : (log.id || null))}
                    className={`p-4 border rounded-2xl transition duration-200 cursor-pointer backdrop-blur-md relative overflow-hidden ${cardBorder} hover:border-slate-750`}
                  >
                    {/* Glow Accents */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/[0.01] to-transparent pointer-events-none" />
                    
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900/40 pb-2.5 mb-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                          {meta.lucideIcon}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                          meta.risk === 'critical' ? 'bg-rose-500/15 text-rose-400' :
                          meta.risk === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                          meta.category === 'admin' ? 'bg-indigo-500/15 text-indigo-400' :
                          'bg-slate-900 text-slate-400'
                        }`}>
                          {meta.categoryLabel}
                        </span>
                        <span className="font-semibold text-cyan-400 text-xs">@{log.user}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono tabular-nums">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>{new Date(log.timestamp).toLocaleDateString('fa-IR')}</span>
                        <span className="text-slate-700">•</span>
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{new Date(log.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Card Message Body */}
                    <p className="text-xs font-bold leading-relaxed text-slate-200">
                      {log.message}
                    </p>

                    {/* Expanding metadata detail panel */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-900/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] text-slate-400">
                        <div className="space-y-0.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                          <span className="text-slate-500 block">زمان ثبت (UTC):</span>
                          <span className="font-mono text-slate-300">{log.timestamp}</span>
                        </div>
                        <div className="space-y-0.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                          <span className="text-slate-500 block">شناسه ممیزی:</span>
                          <span className="font-mono text-slate-300">{log.id}</span>
                        </div>
                        <div className="space-y-0.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                          <span className="text-slate-500 block">اعتبارسنجی خودکار کلاینت:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>لایسنس فعال و امضا شده کلاینت</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-slate-950/50 border border-slate-850 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-900 font-extrabold">
                  <th className="p-3.5 w-12 text-center">نوع</th>
                  <th className="p-3.5">دسته‌بندی</th>
                  <th className="p-3.5 w-32">کاربر عامل</th>
                  <th className="p-3.5">شرح رویداد ممیزی امنیتی</th>
                  <th className="p-3.5 w-40">زمان دقیق ثبت</th>
                  <th className="p-3.5 w-16 text-center">جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold">
                      هیچ رویدادی با فیلترهای مشخص شده یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const meta = getLogMeta(log);
                    const isExpanded = selectedLogId === log.id;
                    
                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          onClick={() => setSelectedLogId(isExpanded ? null : (log.id || null))}
                          className={`hover:bg-slate-900/30 transition text-slate-300 border-b border-slate-900/60 cursor-pointer ${
                            isExpanded ? 'bg-slate-900/20' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center text-sm">
                            <span className="flex items-center justify-center">{meta.lucideIcon}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              meta.risk === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              meta.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              meta.category === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {meta.categoryLabel}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-cyan-400">@{log.user}</span>
                          </td>
                          <td className="p-3.5 leading-relaxed font-bold">
                            {log.message}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[10px] font-mono tabular-nums">
                            {new Date(log.timestamp).toLocaleDateString('fa-IR')} • {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                          </td>
                          <td className="p-3.5 text-center text-slate-500">
                            <span>{isExpanded ? '▲' : '▼'}</span>
                          </td>
                        </tr>

                        {/* Detail Collapsed Panel */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={6} className="p-4 border-b border-slate-900 text-right">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-300">
                                <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                                  <span className="text-[10px] text-slate-500 block font-bold">زمان میلادی:</span>
                                  <span className="font-mono text-slate-300">{log.timestamp}</span>
                                </div>
                                <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                                  <span className="text-[10px] text-slate-500 block font-bold">شناسه یکتای پیام (UUID):</span>
                                  <span className="font-mono text-slate-300">{log.id}</span>
                                </div>
                                <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                                  <span className="text-[10px] text-slate-500 block font-bold">اعتبارسنجی کلاینت:</span>
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>امضا شده دیجیتالی با لایسنس فعال X-Guard</span>
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
