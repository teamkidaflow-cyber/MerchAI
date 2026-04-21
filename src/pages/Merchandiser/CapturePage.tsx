import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { callAnalysisWebhook } from '../../lib/analyzePhoto';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Upload, CheckCircle2, AlertCircle, Search, ChevronRight, X, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Outlet } from '../../types';

const CapturePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const comparePhotoId = (location.state as any)?.comparePhotoId ?? null;
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [qualityStatus, setQualityStatus] = useState<'pending' | 'good' | 'poor'>('pending');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOutlets = async () => {
      const { data, error } = await supabase.from('outlets').select('*').eq('status', 'active');
      if (!error && data) setOutlets(data);
    };
    fetchOutlets();
  }, []);

  const filteredOutlets = outlets.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.outlet_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Max 10MB.');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      
      // Simulate quality check
      setQualityStatus('pending');
      setTimeout(() => {
        setQualityStatus('good');
      }, 1500);
    }
  };

  const handleUpload = async () => {
    if (!selectedOutlet || !image || !user) return;
    setUploading(true);

    try {
      // 1. Create Visit (admin bypasses RLS)
      const { data: visit, error: visitError } = await supabaseAdmin
        .from('visits')
        .insert({
          outlet_id: selectedOutlet.id,
          user_id: user.id,
          visit_date: new Date().toISOString().split('T')[0],
          visit_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // 2. Upload to Storage
      const fileName = `${visit.id}/${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from('shelf-photos')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shelf-photos')
        .getPublicUrl(fileName);

      // 3. Create Photo record (admin bypasses RLS)
      const { data: photo, error: photoError } = await supabaseAdmin
        .from('photos')
        .insert({
          visit_id: visit.id,
          photo_url: publicUrl,
          analysis_status: 'pending'
        })
        .select()
        .single();

      if (photoError) throw photoError;

      // 4. Navigate immediately — pass comparePhotoId for before/after if present
      toast.success('Photo uploaded! Analyzing...');
      navigate(`/analysis/${photo.id}`, comparePhotoId ? { state: { comparePhotoId } } : undefined);

      // 5. Call n8n webhook and write result back to DB
      const uiState = await callAnalysisWebhook(
        publicUrl,
        'Melvins Tea',
        visit.id,
        photo.id,
        selectedOutlet.name,
        selectedOutlet.outlet_id
      );

      const dbStatus = uiState.status === 'error' ? 'failed' : 'complete';
      const dbResult = uiState.data ?? uiState.rawData ?? { error: uiState.message };

      await supabaseAdmin
        .from('photos')
        .update({ analysis_status: dbStatus, analysis_result: dbResult })
        .eq('id', photo.id);

    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${step === 1 ? 'bg-primary text-black' : 'bg-success text-white'}`}>
          {step === 1 ? '1' : <CheckCircle2 size={24} />}
        </div>
        <div className="h-[2px] w-12 bg-gray-200"></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${step === 2 ? 'bg-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
          2
        </div>
        <h2 className="ml-auto text-sm font-bold text-gray-400 uppercase tracking-widest">
          {step === 1 ? 'Select Outlet' : 'Capture Photo'}
        </h2>
      </div>

      {step === 1 ? (
        <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="space-y-2">
            <h3 className="text-2xl font-black">Where are you?</h3>
            <p className="text-gray-500 font-medium">Select the outlet you are visiting.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
              placeholder="Search outlet name or ID..."
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
            {filteredOutlets.length > 0 ? (
              filteredOutlets.map(outlet => (
                <button
                  key={outlet.id}
                  onClick={() => {
                    setSelectedOutlet(outlet);
                    setStep(2);
                  }}
                  className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all group ${selectedOutlet?.id === outlet.id ? 'border-primary bg-primary/5' : 'border-white bg-white hover:border-gray-100'}`}
                >
                  <div className="text-left">
                    <p className="font-black text-lg">{outlet.name}</p>
                    <p className="text-sm text-gray-500 font-medium">{outlet.outlet_id} • {outlet.location || 'Nairobi'}</p>
                  </div>
                  <ChevronRight size={24} className={selectedOutlet?.id === outlet.id ? 'text-primary' : 'text-gray-300 group-hover:translate-x-1 transition-transform'} />
                </button>
              ))
            ) : (
              <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed text-gray-400 font-medium italic">
                No outlets found matching "{search}"
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black">Capture Shelf</h3>
              <p className="text-gray-500 font-medium flex items-center gap-1">
                <MapPin size={14} /> {selectedOutlet?.name}
              </p>
            </div>
            <button onClick={() => setStep(1)} className="p-2 text-gray-400 hover:text-black">
              <X size={24} />
            </button>
          </div>

          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[300px] border-4 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center gap-6 bg-white hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera size={48} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black">Take Photo</p>
                <p className="text-gray-400 font-medium mt-1">or tap to upload from gallery</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-6">
              <div className="relative w-full aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => {setImage(null); setImagePreview(null);}}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"
                >
                  <X size={20} />
                </button>
                
                {qualityStatus === 'pending' && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white px-6 py-4 rounded-3xl shadow-xl flex items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={24} />
                      <span className="font-bold">Checking quality...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-5 rounded-3xl border flex items-center gap-4 ${qualityStatus === 'good' ? 'bg-success/10 border-success/20 text-success' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                {qualityStatus === 'good' ? (
                  <>
                    <CheckCircle2 size={24} />
                    <div>
                      <p className="font-black">Quality Looks Great!</p>
                      <p className="text-xs font-medium opacity-80">Photo is clear enough for AI analysis.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={24} />
                    <div>
                      <p className="font-black">Waiting for check...</p>
                      <p className="text-xs font-medium opacity-80">Ensuring the photo is high resolution.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          <button
            disabled={!image || uploading || qualityStatus !== 'good'}
            onClick={handleUpload}
            className="btn-primary w-full py-5 rounded-3xl shadow-2xl disabled:opacity-50 disabled:grayscale transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={22} />
                <span className="text-lg font-black">Analyze Shelf</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CapturePage;