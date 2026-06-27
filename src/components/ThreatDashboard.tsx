import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { SystemLog } from '../types';

interface ThreatDashboardProps {
  logs: SystemLog[];
}

export function ThreatDashboard({ logs }: ThreatDashboardProps) {
  const [timeRange, setTimeRange] = useState<'hours' | 'days'>('hours');

  // 1. Calculate dynamic Threat Level
  const getThreatStatus = () => {
    const now = Date.now();
    const failedLogs = logs.filter(log => {
      const isFailed = log.message.includes('ناموفق') || log.message.includes('اشتباه') || log.message.includes('failed');
      const isRecent = now - new Date(log.timestamp).getTime() < 24 * 3600000;
      return isFailed && isRecent;
    });

    const count = failedLogs.length;

    if (count === 0) {
      return {
        level: 'عادی',
        count,
        text: 'امن • عادی 🟢',
        color: '#22d3ee', // Cyan
        bgClass: 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
        accentColor: '#22d3ee'
      };
    } else if (count <= 2) {
      return {
        level: 'کم',
        count,
        text: 'کم • هشدار جزئی 🟡',
        color: '#fbbf24', // Yellow
        bgClass: 'border-yellow-500/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
        accentColor: '#fbbf24'
      };
    } else if (count <= 4) {
      return {
        level: 'متوسط',
        count,
        text: 'متوسط • آماده‌باش 🟠',
        color: '#f97316', // Orange
        bgClass: 'border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]',
        accentColor: '#f97316'
      };
    } else {
      return {
        level: 'بحرانی',
        count,
        text: 'بحرانی • زنگ خطر 🔴',
        color: '#f43f5e', // Rose/Red
        bgClass: 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        accentColor: '#f43f5e'
      };
    }
  };

  const status = getThreatStatus();

  // 2. Prepare data for Recharts Half-Donut Gauge
  // We can represent 4 segments of threat level: Green/Cyan (0 failed), Yellow (1-2 failed), Orange (3-4 failed), Red (5+ failed)
  const gaugeSegments = [
    { name: 'عادی', value: 25, color: '#22d3ee' },
    { name: 'کم', value: 25, color: '#fbbf24' },
    { name: 'متوسط', value: 25, color: '#f97316' },
    { name: 'بحرانی', value: 25, color: '#f43f5e' }
  ];

  // Map failedCount to an approximate position angle (from 180 to 0 degrees)
  // 0 attempts -> 170 degrees (Safe sector)
  // 1-2 attempts -> 125 degrees (Low sector)
  // 3-4 attempts -> 75 degrees (Medium sector)
  // 5+ attempts -> 25 degrees (Critical sector)
  const getNeedleAngle = (count: number) => {
    if (count === 0) return 155;
    if (count <= 2) return 115;
    if (count <= 4) return 65;
    return 25;
  };

  const needleAngle = getNeedleAngle(status.count);

  // 3. Prepare data for "Failed attempts over time"
  const getTimelineData = () => {
    const now = Date.now();
    const failedLogs = logs.filter(log => {
      return log.message.includes('ناموفق') || log.message.includes('اشتباه') || log.message.includes('failed');
    });

    if (timeRange === 'hours') {
      // Create 6 hourly buckets for the last 12 hours (each bucket is 2 hours)
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const start = now - (i + 1) * 2 * 3600000;
        const end = now - i * 2 * 3600000;
        
        // Generate label in Persian
        const labelHour = new Date(end).getHours();
        const label = `${labelHour}:00`;

        const count = failedLogs.filter(log => {
          const t = new Date(log.timestamp).getTime();
          return t >= start && t < end;
        }).length;

        data.push({
          name: label,
          'تلاش‌های ناموفق': count
        });
      }
      return data;
    } else {
      // Daily buckets for the last 7 days
      const data = [];
      const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
      for (let i = 6; i >= 0; i--) {
        const start = now - (i + 1) * 24 * 3600000;
        const end = now - i * 24 * 3600000;
        
        const dateObj = new Date(end);
        const label = i === 0 ? 'امروز' : dayNames[dateObj.getDay()];

        const count = failedLogs.filter(log => {
          const t = new Date(log.timestamp).getTime();
          return t >= start && t < end;
        }).length;

        data.push({
          name: label,
          'تلاش‌های ناموفق': count
        });
      }
      return data;
    }
  };

  const chartData = getTimelineData();

  // Custom tooltip styling for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-lg text-right font-sans text-xs shadow-lg backdrop-blur-md">
          <p className="text-slate-400 mb-1 font-bold">{label}</p>
          <p className="text-red-400 font-extrabold font-mono">
            ❌ {payload[0].name}: {payload[0].value} بار
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* 1. Security Threat Level Gauge */}
      <div className={`bg-slate-950/60 border ${status.bgClass} p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden backdrop-blur-md`}>
        <div className="flex justify-between items-start mb-3">
          <div className="text-right">
            <h5 className="text-xs font-black text-slate-200">سطح تهدید امنیتی کلاینت</h5>
            <p className="text-[10px] text-slate-500 mt-0.5">وضعیت نظارتی ورودهای مشکوک در ۲۴ ساعت گذشته</p>
          </div>
          <span className="text-base">🚨</span>
        </div>

        {/* Recharts Half-Donut Gauge rendering */}
        <div className="flex flex-col items-center justify-center relative mt-2 h-[140px]">
          <PieChart width={220} height={130}>
            <Pie
              data={gaugeSegments}
              cx={110}
              cy={110}
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={75}
              dataKey="value"
              stroke="none"
            >
              {gaugeSegments.map((seg, idx) => (
                <Cell key={`cell-${idx}`} fill={seg.color} opacity={status.level === seg.name ? 1 : 0.25} />
              ))}
            </Pie>
          </PieChart>

          {/* Needle rendering using customized SVG overlay */}
          <div 
            className="absolute bottom-[20px] left-1/2 w-1.5 h-14 bg-slate-100 rounded-full origin-bottom -translate-x-1/2 transition-transform duration-1000 ease-out shadow-[0_0_10px_white]"
            style={{ 
              transform: `translateX(-50%) rotate(${needleAngle - 90}deg)`,
              height: '52px',
              bottom: '20px'
            }}
          />
          
          {/* Needle Pin */}
          <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-200 border-2 border-slate-950 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        </div>

        {/* Current status display */}
        <div className="text-center mt-3 pb-1 border-t border-slate-900/60 pt-3">
          <div className="inline-block px-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-black" style={{ color: status.color }}>
            {status.text}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-bold">
            تعداد تلاش‌های ناموفق در ۲۴ ساعت اخیر: <span className="font-mono font-black" style={{ color: status.color }}>{status.count} بار</span>
          </p>
        </div>
      </div>

      {/* 2. Failed Login Attempts Timeline Chart */}
      <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between backdrop-blur-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="text-right">
            <h5 className="text-xs font-black text-slate-200">تحلیل زمانی تلاش‌های ناکام</h5>
            <p className="text-[10px] text-slate-500 mt-0.5">پراکندگی تلاش‌های ناموفق ورود به تفکیک زمان</p>
          </div>
          
          {/* Time range selector */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setTimeRange('hours')}
              className={`px-2.5 py-1 text-[9px] font-black rounded-md transition ${
                timeRange === 'hours' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ساعتی
            </button>
            <button
              onClick={() => setTimeRange('days')}
              className={`px-2.5 py-1 text-[9px] font-black rounded-md transition ${
                timeRange === 'days' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              روزانه
            </button>
          </div>
        </div>

        {/* Recharts BarChart without gradients */}
        <div className="w-full h-[140px] pr-1 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                fontFamily="Vazirmatn"
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                fontFamily="Vazirmatn"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }} />
              <Bar 
                dataKey="تلاش‌های ناموفق" 
                fill="#f43f5e" // Rose/red solid color with no gradients
                radius={[4, 4, 0, 0]} 
                maxBarSize={30}
              >
                {chartData.map((entry, idx) => (
                  <Cell 
                    key={`cell-${idx}`} 
                    fill={entry['تلاش‌های ناموفق'] > 0 ? '#f43f5e' : '#1e293b'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-right text-[10px] text-slate-500 mt-2 font-bold flex items-center gap-1.5 bg-slate-900/30 p-2 border border-slate-900 rounded-xl">
          <span>📈</span>
          <span>افزایش جهشی در نمودار فوق نشان‌دهنده احتمال وقوع حملات Brute-Force به کلاینت است.</span>
        </div>
      </div>

    </div>
  );
}
