import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { ChevronLeft, RefreshCcw, Download, ExternalLink, MoreVertical, Loader2 } from 'lucide-react';
import ManagerReport from '../../components/Reports/ManagerReport';
import toast from 'react-hot-toast';

const PhotoDetailPage: React.FC = () => {
  const { photoId } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const fetchPhotoDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('*, visit:visits(*, outlet:outlets(*), user:users(*))')
          .eq('id', photoId)
          .single();

        if (error) throw error;
        setPhoto(data);
      } catch (err) {
        console.error('Error fetching photo detail:', err);
        toast.error('Could not load photo detail');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoDetail();
  }, [photoId]);

  const handleRequestReupload = async () => {
    if (!photo) return;
    setRequesting(true);
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: photo.visit.user_id,
          message: `⚠️ Re-upload requested for ${photo.visit.outlet.name}. Your photo was unclear — please retake and resubmit.`,
          type: 'warning'
        });

      if (error) throw error;
      toast.success('Re-upload request sent to merchandiser');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="font-black text-gray-500">Retrieving intelligence...</p>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-urgent font-black text-xl">Audit Data Missing</p>
        <p className="text-gray-500 mt-2">The requested analysis record could not be found.</p>
        <button onClick={() => navigate('/')} className="text-primary font-bold mt-6 underline">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-12 h-12 rounded-2xl bg-white border border-[#e5e5e5] flex items-center justify-center text-gray-400 hover:text-black hover:border-primary transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-black">{photo.visit.outlet.name}</h1>
              <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-black text-gray-400 uppercase">{photo.visit.outlet.outlet_id}</span>
            </div>
            <p className="text-gray-500 font-medium">{photo.visit.visit_date} • {photo.visit.visit_time} • Audited by {photo.visit.user?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRequestReupload}
            disabled={requesting}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-urgent text-urgent rounded-2xl font-black hover:bg-urgent hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {requesting ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
            <span>Request Re-upload</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-black shadow-lg hover:shadow-black/20 transition-all active:scale-95">
            <Download size={20} />
            <span>Export XLSX</span>
          </button>
          <button className="p-3 bg-white border border-[#e5e5e5] rounded-2xl text-gray-400">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: Captured Image */}
        <div className="lg:col-span-4 sticky top-[100px] space-y-6">
           <div className="relative rounded-[40px] overflow-hidden border-4 border-white shadow-2xl group cursor-zoom-in">
              <img src={photo.photo_url} alt="Shelf Audit" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                    <ExternalLink size={32} />
                 </button>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-[32px] border border-[#e5e5e5] shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Metadata</p>
              <div className="space-y-4">
                 <div className="flex justify-between">
                    <span className="text-gray-500 text-sm font-medium">Captured at</span>
                    <span className="text-black text-sm font-bold">{new Date(photo.uploaded_at).toLocaleTimeString()}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500 text-sm font-medium">Device</span>
                    <span className="text-black text-sm font-bold">iPhone 13 Pro</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500 text-sm font-medium">Confidence</span>
                    <span className="text-black text-sm font-bold">{photo.confidence_score || 92}%</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Content: Detailed Report */}
        <div className="lg:col-span-8">
           {photo.analysis_status === 'complete' ? (
             <ManagerReport 
               report={photo.analysis_result?.manager_report} 
               confidence={photo.analysis_result?.confidence || photo.confidence_score || 92} 
             />
           ) : (
             <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <h3 className="text-xl font-bold">Processing Analysis...</h3>
                <p className="text-gray-400 font-medium">This report will automatically update once AI processing is finished.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PhotoDetailPage;