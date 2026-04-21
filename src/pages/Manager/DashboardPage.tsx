import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { StatCard } from '../../components/UI/StatCard';
import ShelfShareTrend from '../../components/Charts/ShelfShareTrend';
import CompetitorPie from '../../components/Charts/CompetitorPie';
import OutletTable from '../../components/Charts/OutletTable';
import { Store, TrendingUp, AlertTriangle, Users, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({ outlets: 0, avgShare: 0, stockouts: 0, activeMerch: 0 });
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [outletsRes, photosRes, visitsRes] = await Promise.all([
          supabase.from('outlets').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase.from('photos')
            .select('*, visit:visits(id, outlet:outlets(name))')
            .eq('analysis_status', 'complete')
            .order('uploaded_at', { ascending: false })
            .limit(50),
          supabase.from('visits')
            .select('user_id')
            .gte('visit_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
        ]);

        const photos = photosRes.data || [];
        const shareValues = photos
          .map((p: any) => p.analysis_result?.manager_report?.shelf_percentage ?? p.analysis_result?.merchandiser_report?.shelf_percentage)
          .filter(Boolean);
        const avgShare = shareValues.length
          ? Math.round(shareValues.reduce((a: number, b: number) => a + b, 0) / shareValues.length)
          : 0;
        const stockouts = photos.filter((p: any) =>
          (p.analysis_result?.manager_report?.stock_status ?? p.analysis_result?.merchandiser_report?.stock_status ?? '')
            .toLowerCase().includes('out') ||
          (p.analysis_result?.merchandiser_report?.stock_status ?? '').toLowerCase() === 'low'
        ).length;
        const uniqueMerch = new Set((visitsRes.data || []).map((v: any) => v.user_id)).size;

        setStats({ outlets: outletsRes.count || 0, avgShare, stockouts, activeMerch: uniqueMerch });
        setRecentPhotos(photos.slice(0, 6));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-500 font-medium">Real-time insights across all retail channels.</p>
        </div>
        <Link
          to="/export"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all w-fit"
        >
          <Download size={18} />
          <span>Export Report</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Active Outlets"
          value={loading ? '—' : String(stats.outlets)}
          icon={<Store size={24} />}
        />
        <StatCard
          label="Avg Shelf Share"
          value={loading ? '—' : `${stats.avgShare}%`}
          icon={<TrendingUp size={24} />}
          trend={stats.avgShare > 0 ? { value: stats.avgShare, isUp: true } : undefined}
          color="bg-primary/5 border-primary/20"
        />
        <StatCard
          label="Low/Out of Stock"
          value={loading ? '—' : String(stats.stockouts)}
          icon={<AlertTriangle size={24} />}
          color="bg-red-50 border-red-100"
        />
        <StatCard
          label="Active Merch (30d)"
          value={loading ? '—' : String(stats.activeMerch)}
          icon={<Users size={24} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ShelfShareTrend />
        <CompetitorPie />
      </div>

      {/* Outlet Table + Recent Photos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black">Outlet Performance</h3>
            <Link to="/photos" className="text-sm font-bold text-primary hover:underline">View All Photos</Link>
          </div>
          <OutletTable />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black">Recent Photos</h3>
            <Link to="/photos" className="text-sm font-bold text-primary hover:underline">View Grid</Link>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-[#e5e5e5] shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {loading ? (
                [1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-square bg-gray-50 animate-pulse rounded-2xl" />
                ))
              ) : recentPhotos.length === 0 ? (
                <div className="col-span-2 py-10 text-center text-gray-400 text-sm font-medium">No photos yet</div>
              ) : recentPhotos.map(photo => (
                <Link
                  key={photo.id}
                  to={`/photo/${photo.id}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <img src={photo.photo_url} alt="Shelf" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-[10px] font-bold text-white uppercase truncate">{photo.visit?.outlet?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
