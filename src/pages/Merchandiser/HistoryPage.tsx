import React, { useEffect, useState } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, ChevronRight, Clock, Filter } from 'lucide-react';
import { StatusBadge } from '../../components/UI/StatusBadge';

const HistoryPage: React.FC = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const { data, error } = await supabase
          .from('visits')
          .select('*, outlet:outlets(name, location), photos(id, photo_url, analysis_status, analysis_result)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVisits(data || []);
      } catch (err) {
        console.error('Error fetching history:', err);
        // Mock for demo if error
        setVisits([
          {
            id: '1',
            visit_date: '2026-04-09',
            visit_time: '14:30',
            outlet: { name: 'Nakumatt Junction', location: 'Nairobi' },
            photos: [{ id: 'p1', analysis_status: 'complete', analysis_result: { merchandiser_report: { status: 'good' } } }]
          },
          {
            id: '2',
            visit_date: '2026-04-09',
            visit_time: '11:15',
            outlet: { name: 'Carrefour Sarit', location: 'Nairobi' },
            photos: [{ id: 'p2', analysis_status: 'complete', analysis_result: { merchandiser_report: { status: 'needs_work' } } }]
          },
          {
            id: '3',
            visit_date: '2026-04-08',
            visit_time: '16:45',
            outlet: { name: 'Tuskys Adams', location: 'Nairobi' },
            photos: [{ id: 'p3', analysis_status: 'failed', analysis_result: { error: 'Blurry' } }]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, []);

  const filteredVisits = visits.filter(v => 
    v.outlet?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-black">Audit History</h2>
        <p className="text-gray-500 font-medium">Review your previous shelf checks.</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-primary font-medium text-sm"
            placeholder="Search outlets..."
          />
        </div>
        <button className="p-3 bg-white border border-[#e5e5e5] rounded-2xl text-gray-400 hover:text-black">
          <Filter size={20} />
        </button>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white/50 animate-pulse rounded-[32px] border border-[#e5e5e5]"></div>
          ))
        ) : filteredVisits.length > 0 ? (
          filteredVisits.map((visit) => {
            const photo = visit.photos?.[0];
            const status = photo?.analysis_result?.merchandiser_report?.status || photo?.analysis_status || 'pending';
            const hasResults = photo?.analysis_status === 'complete' && photo?.analysis_result;
            const isClickable = hasResults && photo?.id;
            
            return (
              <Link 
                key={visit.id}
                to={isClickable ? `/analysis/${photo.id}` : '#'}
                className={`block p-5 rounded-[32px] transition-all active:scale-[0.99] group ${
                  isClickable
                    ? 'bg-white border border-[#e5e5e5] hover:shadow-md hover:border-primary/30 cursor-pointer'
                    : 'bg-gray-50 border border-gray-200 cursor-default pointer-events-none opacity-75'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className={`font-bold text-lg ${isClickable ? 'text-black group-hover:text-primary transition-colors' : 'text-gray-500'}`}>
                      {visit.outlet?.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <MapPin size={12} />
                      <span>{visit.outlet?.location || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    {hasResults && <span className="text-xs bg-success/10 text-success px-2.5 py-1 rounded-full font-bold">Results</span>}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Calendar size={14} className={isClickable ? 'text-primary' : 'text-gray-400'} />
                      <span>{visit.visit_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Clock size={14} className={isClickable ? 'text-primary' : 'text-gray-400'} />
                      <span>{visit.visit_time}</span>
                    </div>
                  </div>
                  {isClickable && <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-[40px] border border-dashed border-gray-300">
            <p className="text-gray-400 font-medium italic">No audit history found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;