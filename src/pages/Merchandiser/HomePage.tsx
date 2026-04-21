import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, ChevronRight, Clock } from 'lucide-react';
import { StatusBadge } from '../../components/UI/StatusBadge';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('*, visit:visits(id, visit_date, visit_time, outlet:outlets(id, name))')
          .order('uploaded_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentPhotos(data || []);
      } catch (err) {
        console.error('Error fetching recent photos:', err);
        // For demo: set mock data if fetch fails (e.g. table doesn't exist yet)
        setRecentPhotos([
          {
            id: '1',
            uploaded_at: new Date().toISOString(),
            analysis_status: 'complete',
            analysis_result: { merchandiser_report: { status: 'good' } },
            visit: { outlet: { name: 'Nakumatt Junction' }, visit_time: '14:30' }
          },
          {
            id: '2',
            uploaded_at: new Date(Date.now() - 3600000).toISOString(),
            analysis_status: 'complete',
            analysis_result: { merchandiser_report: { status: 'needs_work' } },
            visit: { outlet: { name: 'Carrefour Sarit' }, visit_time: '11:15' }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <section className="space-y-1">
        <h2 className="text-3xl font-black text-black">Jambo, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-gray-500 font-medium">Ready for today's shelf checks?</p>
      </section>

      {/* Main CTA */}
      <section>
        <Link 
          to="/capture" 
          className="w-full h-48 bg-primary rounded-[32px] shadow-2xl shadow-primary/20 flex flex-col items-center justify-center gap-4 relative overflow-hidden group active:scale-[0.98] transition-all duration-300"
        >
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <Camera size={32} className="text-white" />
          </div>
          <span className="text-2xl font-black text-black tracking-tight">Capture Shelf</span>
          <div className="flex items-center gap-1 text-black/60 font-bold text-sm uppercase tracking-widest">
            <span>New Audit</span>
            <ChevronRight size={16} />
          </div>
        </Link>
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Recent Uploads
          </h3>
          <Link to="/history" className="text-sm font-bold text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/50 animate-pulse rounded-2xl border border-[#e5e5e5]"></div>
            ))
          ) : recentPhotos.length > 0 ? (
            recentPhotos.map((photo) => (
              <Link 
                key={photo.id}
                to={`/analysis/${photo.id}`}
                className="flex items-center gap-4 p-4 bg-white border border-[#e5e5e5] rounded-3xl hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  {photo.photo_url ? (
                    <img src={photo.photo_url} alt="Shelf" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-black truncate">
                    {photo.visit?.outlet?.name || 'Unknown Outlet'}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                      <Clock size={12} />
                      <span>{photo.visit?.visit_time || 'N/A'}</span>
                    </div>
                    <StatusBadge status={photo.analysis_result?.merchandiser_report?.status || photo.analysis_status} className="scale-90 origin-left" />
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </Link>
            ))
          ) : (
            <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-gray-300">
              <p className="text-gray-400 font-medium italic">No recent photos found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;