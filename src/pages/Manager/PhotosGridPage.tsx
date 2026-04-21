import React, { useEffect, useState } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { Link } from 'react-router-dom';
import { Camera, Search, Filter, Calendar } from 'lucide-react';
import { StatusBadge } from '../../components/UI/StatusBadge';

const PhotosGridPage: React.FC = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*, visit:visits(id, visit_date, visit_time, outlet:outlets(name, location), user:users(name))')
        .order('uploaded_at', { ascending: false });

      if (!error && data) setPhotos(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = photos.filter(p =>
    p.visit?.outlet?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.visit?.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black">Shelf Photos</h1>
          <p className="text-gray-500 font-medium">{photos.length} total audits captured</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search outlet or merchandiser..."
              className="bg-white border border-[#e5e5e5] rounded-xl py-2 pl-10 pr-4 outline-none focus:border-primary font-medium text-sm w-64"
            />
          </div>
          <button className="p-2 bg-white border border-[#e5e5e5] rounded-xl text-gray-400 hover:text-black">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="aspect-square bg-white animate-pulse rounded-[24px] border border-[#e5e5e5]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
          <Camera size={48} className="text-gray-200 mb-4" />
          <p className="font-bold text-gray-400">No photos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(photo => (
            <Link
              key={photo.id}
              to={`/photo/${photo.id}`}
              className="group relative bg-white rounded-[24px] border border-[#e5e5e5] overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="aspect-square bg-gray-50">
                {photo.photo_url ? (
                  <img
                    src={photo.photo_url}
                    alt="Shelf"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera size={32} className="text-gray-200" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="font-bold text-black text-sm truncate">{photo.visit?.outlet?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-400 font-medium truncate">{photo.visit?.user?.name || 'Unknown'}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={11} />
                    <span>{photo.visit?.visit_date}</span>
                  </div>
                  <StatusBadge status={photo.analysis_result?.merchandiser_report?.status || photo.analysis_status} className="scale-75 origin-right" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotosGridPage;
