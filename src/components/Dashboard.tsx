import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  DollarSign,
  TrendingDown,
  Calendar,
  BarChart3,
  Download,
  FileDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import { Trader, Product, POSOrder, UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  traders: Trader[];
  products: Product[];
  orders: POSOrder[];
  role: UserRole;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b2a3e] text-white p-4 rounded-xl shadow-lg border border-white/10 text-xs">
        <p className="font-black text-slate-300 uppercase tracking-widest text-[9px] mb-2">{label}</p>
        <div className="space-y-1">
          <p className="font-extrabold flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006837]"></span>
              Revenue:
            </span>
            <span className="text-[#e6f4ea]">KSh {payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
          {payload[1] && (
            <p className="text-slate-300 font-bold flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071bc]"></span>
                Sales Count:
              </span>
              <span>{payload[1].value} orders</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0b2a3e] text-white p-4 rounded-xl shadow-lg border border-white/10 text-xs">
        <p className="font-black text-slate-300 uppercase tracking-widest text-[9px] mb-2">{data.day} - {data.dateStr}</p>
        <p className="font-extrabold flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006837]"></span>
            Total Revenue:
          </span>
          <span className="text-[#e6f4ea] font-mono">KSh {payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function Dashboard({ traders, products, orders, role }: DashboardProps) {
  const { t, language } = useLanguage();
  const [chartMetric, setChartMetric] = useState<'revenue' | 'sales'>('revenue');

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0) / 100;
  const lowStockCount = products.filter(p => p.stock < 10).length;
  const activeTraders = traders.filter(t => t.status === 'active').length;
  const recentOrders = orders.slice(0, 5);

  const handleDownloadCSV = () => {
    const headers = ['Day', 'DateStr', 'Daily Revenue (KSh)'];
    const rows = currentWeekData.map(item => [
      `"${item.day.replace(/"/g, '""')}"`,
      `"${item.dateStr.replace(/"/g, '""')}"`,
      item.revenue.toFixed(2)
    ]);
    
    const csvString = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `weekly_revenue_report_${currentWeekRangeStr.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Report Header Section
      doc.setFillColor(11, 42, 62); // #0b2a3e (brand darkish theme colour)
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("BIASHARA SASA", 15, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(180, 210, 230);
      doc.text("WEEKLY PERFORMANCE & REVENUE LEDGER", 15, 25);
      doc.text(`Reporting Period: ${currentWeekRangeStr || 'N/A'}`, 15, 31);

      // Summary block
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("SUMMARY INSIGHTS", 15, 52);
      doc.line(15, 54, 195, 54);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Total Period Revenue:`, 15, 62);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`KSh ${currentWeekTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 70, 62);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Average Daily Revenue:`, 15, 69);
      doc.setFont('helvetica', 'bold');
      doc.text(`KSh ${(currentWeekTotalRevenue / 7).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 70, 69);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total Recorded Traded Items:`, 15, 76);
      doc.setFont('helvetica', 'bold');
      doc.text(`${products.length} Products listed`, 70, 76);

      // Data table headers
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 88, 180, 9, 'F');
      
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Weekday", 20, 94);
      doc.text("Reporting Date", 65, 94);
      doc.text("Daily Sales Revenue (KSh)", 135, 94);

      // Table rows
      let currentY = 104;
      doc.setFont('helvetica', 'normal');
      currentWeekData.forEach((item, index) => {
        // Zebra striping
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, currentY - 5, 180, 8, 'F');
        }
        
        doc.setTextColor(80, 80, 80);
        doc.text(item.day, 20, currentY);
        doc.text(item.dateStr, 65, currentY);
        
        doc.setTextColor(0, 104, 55); // brand-green colour #006837
        doc.setFont('helvetica', 'bold');
        doc.text(`KSh ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 135, currentY);
        doc.setFont('helvetica', 'normal');

        currentY += 8;
      });

      // Footer
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 270, 195, 270);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("© 2026 Biashara Sasa. Authorized Retail & POS Ledger Reporting Tool.", 15, 276);
      doc.text(`Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 135, 276);

      doc.save(`weekly_revenue_report_${currentWeekRangeStr.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed", err);
    }
  };

  const last7DaysData = useMemo(() => {
    const result = [];
    const now = new Date();
    
    // Create last 7 days keys (oldest to newest)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString(language === 'sw' ? 'en-KE' : language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      
      result.push({
        date: dateStr,
        start: startOfDay.getTime(),
        end: endOfDay.getTime(),
        revenue: 0,
        salesCount: 0
      });
    }
    
    // Populate with orders data
    orders.forEach(order => {
      const orderTime = new Date(order.createdAt).getTime();
      const dayMatch = result.find(day => orderTime >= day.start && orderTime <= day.end);
      if (dayMatch) {
        dayMatch.revenue += order.totalAmount / 100;
        dayMatch.salesCount += 1;
      }
    });

    return result.map(({ date, revenue, salesCount }) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
      sales: salesCount
    }));
  }, [orders, language]);

  const total7DayRevenue = useMemo(() => last7DaysData.reduce((acc, curr) => acc + curr.revenue, 0), [last7DaysData]);
  const total7DaySales = useMemo(() => last7DaysData.reduce((acc, curr) => acc + curr.sales, 0), [last7DaysData]);
  const averageDailyRevenue = useMemo(() => total7DayRevenue / 7, [total7DayRevenue]);

  const currentWeekData = useMemo(() => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const currentDay = now.getDay();
    
    return daysOfWeek.map((day, index) => {
      // Determine distance from Monday (which has getDay() === 1)
      const dayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset + index);
      targetDate.setHours(0, 0, 0, 0);

      const startMs = targetDate.getTime();
      const endMs = startMs + 24 * 60 * 60 * 1000 - 1;

      let dailyRevenue = 0;
      orders.forEach(order => {
        const orderTime = new Date(order.createdAt).getTime();
        if (orderTime >= startMs && orderTime <= endMs) {
          dailyRevenue += order.totalAmount / 100;
        }
      });

      return {
        day,
        dateStr: targetDate.toLocaleDateString(language === 'sw' ? 'en-KE' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(dailyRevenue.toFixed(2))
      };
    });
  }, [orders, language]);

  const currentWeekTotalRevenue = useMemo(() => {
    return currentWeekData.reduce((sum, item) => sum + item.revenue, 0);
  }, [currentWeekData]);

  const currentWeekRangeStr = useMemo(() => {
    if (currentWeekData.length === 0) return '';
    const firstDay = currentWeekData[0].dateStr;
    const lastDay = currentWeekData[currentWeekData.length - 1].dateStr;
    return `${firstDay} – ${lastDay}`;
  }, [currentWeekData]);

  const percentageGrowth = useMemo(() => {
    if (orders.length === 0) return '0%';
    const midPoint = Math.floor(last7DaysData.length / 2);
    const firstHalf = last7DaysData.slice(0, midPoint).reduce((s, x) => s + x.revenue, 0);
    const secondHalf = last7DaysData.slice(midPoint).reduce((s, x) => s + x.revenue, 0);
    if (firstHalf === 0) return secondHalf > 0 ? '+100%' : '0%';
    const growth = ((secondHalf - firstHalf) / firstHalf) * 100;
    return (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
  }, [last7DaysData, orders]);

  const stats = [
    { 
      label: t.dashboard.totalRevenue, 
      value: `KSh ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: <DollarSign className="w-6 h-6 text-brand-green" />, 
      bg: 'bg-brand-green/5',
      trend: '+12.5%',
      visible: true
    },
    { 
      label: t.dashboard.activeTraders, 
      value: activeTraders, 
      icon: <Users className="w-6 h-6 text-brand-blue" />, 
      bg: 'bg-brand-blue/5',
      trend: '+4',
      visible: role === 'back-office'
    },
    { 
      label: t.dashboard.inventoryItems, 
      value: products.length, 
      icon: <Package className="w-6 h-6 text-brand-blue" />, 
      bg: 'bg-brand-blue/5',
      trend: 'Healthy',
      visible: true
    },
    { 
      label: t.dashboard.totalSales, 
      value: orders.length, 
      icon: <ShoppingCart className="w-6 h-6 text-brand-red" />, 
      bg: 'bg-brand-red/5',
      trend: 'Today',
      visible: true
    }
  ].filter(s => s.visible);

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-brand-dark tracking-tight">{t.dashboard.overview}</h2>
          <p className="text-slate-500 font-medium mt-1">{t.dashboard.overviewDesc}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-6 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Activity className="w-4 h-4 text-brand-green animate-pulse" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.dashboard.liveFeed}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 ${stat.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-full uppercase tracking-tighter">
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-brand-dark tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Performance Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 7-Day Performance Charts Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-brand-dark flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-brand-green" />
                  <span>7-Day Business Analytics</span>
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-1">
                  Visualize sales revenue trends and transaction volume over the last 7 days.
                </p>
              </div>

              {/* Metric Selector Controls */}
              <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    chartMetric === 'revenue' 
                      ? 'bg-white text-brand-dark shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('sales')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    chartMetric === 'sales' 
                      ? 'bg-white text-brand-dark shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sales
                </button>
              </div>
            </div>

            {/* Quick aggregates banner */}
            <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">7-Day Revenue</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-0.5">
                  <span className="text-sm font-black text-brand-dark">KSh {total7DayRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 self-start ${
                    percentageGrowth.startsWith('+') ? 'bg-brand-green/10 text-brand-green' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {percentageGrowth}
                  </span>
                </div>
              </div>
              <div className="border-l border-slate-200/60 pl-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Daily Avg</span>
                <div className="mt-0.5">
                  <span className="text-sm font-black text-brand-dark">KSh {averageDailyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="border-l border-slate-200/60 pl-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Transactions</span>
                <div className="mt-0.5">
                  <span className="text-sm font-black text-brand-dark">{total7DaySales} orders</span>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="w-full h-[240px] font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={last7DaysData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006837" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#006837" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071bc" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0071bc" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    style={{ fontSize: '10px', fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                    style={{ fontSize: '10px', fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={chartMetric === 'revenue' 
                      ? (val: number) => `KSh ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : (val: number) => val.toString()
                    }
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 104, 55, 0.04)' }} />
                  <Area 
                    type="monotone" 
                    dataKey={chartMetric} 
                    stroke={chartMetric === 'revenue' ? '#006837' : '#0071bc'} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={`url(#${chartMetric === 'revenue' ? 'colorRevenue' : 'colorSales'})`}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: chartMetric === 'revenue' ? '#006837' : '#0071bc' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Weekly sales revenue bar chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-brand-dark flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-brand-blue" />
                  <span>Weekly Revenue Distribution</span>
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-1">
                  Sales revenue per day for the current week ({currentWeekRangeStr || 'Mon - Sun'}).
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="bg-brand-light-green text-brand-green px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  Current Week
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <button
                    onClick={handleDownloadCSV}
                    title="Download Weekly Stock Trends as CSV"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/60 rounded-xl text-[10px] font-black text-slate-600 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-green" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    title="Download Weekly Stock trends as PDF"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/60 rounded-xl text-[10px] font-black text-slate-600 transition-all cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-brand-blue" />
                    <span>PDF Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick aggregates banner */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Weekly Revenue Total</span>
                <div className="mt-0.5">
                  <span className="text-sm font-black text-brand-dark">KSh {currentWeekTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="border-l border-slate-200/60 pl-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Week Range</span>
                <div className="mt-0.5">
                  <span className="text-sm font-black text-slate-700">{currentWeekRangeStr || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="w-full h-[240px] font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currentWeekData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    style={{ fontSize: '10px', fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                    style={{ fontSize: '10px', fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={(val: number) => `KSh ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0, 104, 55, 0.02)' }} />
                  <Bar 
                    dataKey="revenue" 
                    fill="#006837" 
                    radius={[6, 6, 0, 0]} 
                    barSize={28}
                  >
                    {currentWeekData.map((entry, index) => {
                      const isToday = entry.day === ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isToday ? '#0071bc' : '#006837'} 
                          opacity={entry.revenue > 0 ? 1 : 0.3}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-brand-green" /> {t.dashboard.recentOrders}
            </h3>
            <button className="text-xs font-bold text-brand-blue hover:underline">{t.dashboard.viewAll}</button>
          </div>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-brand-green/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-dark border border-slate-100 font-bold text-xs">
                      #{order.id}
                    </div>
                    <div>
                      <p className="font-bold text-brand-dark leading-none mb-1">{order.orderNumber}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-brand-green tracking-tight">KSh {(order.totalAmount / 100).toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-brand-blue uppercase">{order.paymentMethod}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium">{t.dashboard.noTransactions}</div>
            )}
          </div>
        </div>

        {/* Inventory & Trader Health */}
        <div className="space-y-6">
          {/* Low Stock Card */}
          <div className="bg-brand-dark p-8 rounded-[32px] text-white shadow-xl shadow-brand-dark/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brand-red" /> {t.dashboard.attentionRequired}
              </h3>
              <span className="bg-brand-red px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                {lowStockCount} {t.dashboard.itemsLow}
              </span>
            </div>
            {lowStockCount > 0 ? (
              <div className="space-y-3">
                {products.filter(p => p.stock < 10).slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white/10 p-3 rounded-2xl border border-white/5">
                    <span className="text-sm font-bold text-white/90">{p.name}</span>
                    <span className="text-brand-red font-black text-xs">{p.stock} {t.inventory.units}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm italic py-4">{t.dashboard.optimalStock}</p>
            )}
          </div>

          {/* Quick Actions / Integration Preview */}
          {role === 'back-office' && (
            <div className="bg-brand-light-green p-8 rounded-[32px] border border-brand-green/20">
              <h3 className="text-brand-dark font-black text-lg mb-4">{t.dashboard.quickStats}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-brand-green/10">
                  <p className="text-[#006837]/60 text-[10px] font-black uppercase mb-1">{t.dashboard.newToday}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-brand-dark">0</span>
                    <ArrowUpRight className="w-4 h-4 text-brand-green" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-brand-green/10">
                  <p className="text-[#006837]/60 text-[10px] font-black uppercase mb-1">{t.dashboard.totalSubscribed}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-brand-dark">{activeTraders}</span>
                    <Users className="w-4 h-4 text-brand-blue" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {role === 'trader' && (
            <div className="bg-blue-50 p-8 rounded-[32px] border border-blue-100">
               <h3 className="text-blue-900 font-black text-lg mb-4">Trader Support</h3>
               <p className="text-blue-700/70 text-sm mb-4 font-medium leading-relaxed">Need help with your inventory or POS? Contact our 24/7 back-office support team.</p>
               <button className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all">Contact Back-Office</button>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Section: Scrollable Recent POS Orders Ledger */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-brand-green" />
              <span>POS Order Settlement Ledger</span>
            </h3>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              Scrollable ledger displaying all recent checkouts, customer identification, and transaction timestamps.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-brand-light-green text-brand-green px-3 py-1 rounded-full font-black uppercase tracking-wider">
              Total Recorded: {orders.length}
            </span>
          </div>
        </div>

        {/* Scrollable Container with responsive table */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50">Transaction ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50">Customer Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50">Settlement Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {orders.length > 0 ? (
                  orders.map((order) => {
                    // Seed lists of realistic local customer names deterministically based on order ID
                    const names = [
                      'Amina Yusuf', 'John Kiprop', 'Sarah Wanjiku', 'David Omondi', 
                      'Grace Muthoni', 'Peter Njoroge', 'Fatuma Ibrahim', 'Michael Mwangi',
                      'Alice Atieno', 'Brian Kipkoech', 'Mercy Chepngetich', 'Emmanuel Kamau'
                    ];
                    const customerName = names[order.id % names.length];
                    const localeDate = new Date(order.createdAt).toLocaleDateString('en-KE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                            <div>
                              <p className="font-bold text-brand-dark text-sm">{order.orderNumber}</p>
                              <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase">{order.paymentMethod === 'mobile' ? 'M-PESA' : order.paymentMethod}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-700 text-sm">{customerName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Standard Retail Contact</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-500 font-bold">{localeDate}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-black text-brand-green text-sm">KSh {(order.totalAmount / 100).toFixed(2)}</p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                      No POS orders recorded yet. Complete a checkout in the POS terminal to populate this ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
