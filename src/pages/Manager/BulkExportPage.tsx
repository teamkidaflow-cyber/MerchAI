import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { FileSpreadsheet, Calendar, Store, Download, Filter, CheckCircle2, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Outlet } from '../../types';

const downloadCSV = (rows: any[][], filename: string) => {
  const csv = rows.map(r => r.map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const BulkExportPage: React.FC = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');

  useEffect(() => {
    supabase.from('outlets').select('*').then(({ data }) => { if (data) setOutlets(data); });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      let query = supabase
        .from('photos')
        .select('*, visit:visits(visit_date, visit_time, outlet:outlets(name, outlet_id, location), user:users(name, email))')
        .eq('analysis_status', 'complete')
        .gte('uploaded_at', startDate)
        .lte('uploaded_at', endDate + 'T23:59:59');

      if (selectedOutlet !== 'all') {
        query = query.eq('visit.outlet_id', selectedOutlet);
      }

      const { data: photos, error } = await query;
      if (error) throw error;
      if (!photos?.length) { toast.error('No data found for selected filters'); setExporting(false); return; }

      const rows: any[][] = [
        ['Date', 'Time', 'Outlet', 'Outlet ID', 'Location', 'Merchandiser', 'Email',
         'Facings', 'Shelf %', 'Stock Status', 'Price', 'Compliance', 'Issues', 'Recommendations', 'AI Confidence']
      ];

      for (const p of photos) {
        const mr = p.analysis_result?.manager_report;
        const merch = p.analysis_result?.merchandiser_report;
        rows.push([
          p.visit?.visit_date ?? '',
          p.visit?.visit_time ?? '',
          p.visit?.outlet?.name ?? '',
          p.visit?.outlet?.outlet_id ?? '',
          p.visit?.outlet?.location ?? '',
          p.visit?.user?.name ?? '',
          p.visit?.user?.email ?? '',
          mr?.facings?.total ?? merch?.facings ?? '',
          mr?.shelf_percentage ?? merch?.shelf_percentage ?? '',
          mr?.stock_status ?? merch?.stock_status ?? '',
          mr?.price ?? merch?.price ?? '',
          mr?.compliance_score ?? '',
          (mr?.issues ?? merch?.issues ?? []).join('; '),
          (mr?.recommendations ?? merch?.action_items ?? []).join('; '),
          p.analysis_result?.confidence ?? '',
        ]);
      }

      downloadCSV(rows, `Shelf_Audit_${startDate}_to_${endDate}.csv`);
      toast.success(`Exported ${photos.length} records`);
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-[#e5e5e5] pb-8">
        <div className="w-16 h-16 bg-success/10 rounded-[28px] flex items-center justify-center text-success shadow-sm">
          <FileSpreadsheet size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Bulk Data Export</h1>
          <p className="text-gray-500 font-medium">Generate CSV reports from all shelf audit data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Filter Panel */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-[#e5e5e5] shadow-sm space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Filter size={20} className="text-primary" />
            Report Filters
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Date Range</label>
              <div className="space-y-3">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary font-bold" />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Outlet</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select value={selectedOutlet} onChange={e => setSelectedOutlet(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary font-bold appearance-none cursor-pointer">
                  <option value="all">All Outlets</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleExport} disabled={exporting}
            className="w-full btn-primary py-5 rounded-[28px] shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50">
            {exporting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
            <span className="text-lg font-black">{exporting ? 'Generating...' : 'Download CSV'}</span>
          </button>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-[#e5e5e5] shadow-sm">
            <h3 className="text-xl font-bold mb-6">What's included in the CSV?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <CheckCircle2 className="text-success shrink-0" size={24} />, title: 'Full Audit Data', desc: 'Outlet, date, time, facings, shelf %, stock status.' },
                { icon: <TrendingUp className="text-primary shrink-0" size={24} />, title: 'AI Confidence', desc: 'Confidence score for each photo analysis.' },
                { icon: <Store className="text-blue-500 shrink-0" size={24} />, title: 'Competitor Pricing', desc: 'Shelf share comparisons with rival brands.' },
                { icon: <AlertTriangle className="text-urgent shrink-0" size={24} />, title: 'Issues & Actions', desc: 'All detected issues and recommendations.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-3xl">
                  {item.icon}
                  <div>
                    <p className="font-bold text-black uppercase tracking-tight text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkExportPage;
