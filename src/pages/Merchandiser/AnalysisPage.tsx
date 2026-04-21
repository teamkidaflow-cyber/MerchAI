import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { callAnalysisWebhook, handleAnalysisResult } from '../../lib/analyzePhoto';
import { ChevronLeft, Loader2, Camera, X, AlertTriangle, RotateCcw, Ban, ArrowRight, Maximize2 } from 'lucide-react';
import MerchandiserReport from '../../components/Reports/MerchandiserReport';
import ManagerReport from '../../components/Reports/ManagerReport';
import toast from 'react-hot-toast';

const MAX_RERUNS = 3;

const AnalysisPage: React.FC = () => {
  const { photoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFullReport, setShowFullReport] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [beforeSnapshot, setBeforeSnapshot] = useState<any>(null);
  const [comparePhoto, setComparePhoto] = useState<any>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const { data: updated } = await supabaseAdmin
        .from('photos')
        .select('*, visit:visits(id, visit_date, visit_time, outlet:outlets(name, outlet_id))')
        .eq('id', photoId)
        .single();

      if (updated) {
        setPhoto(updated);
        if (updated.analysis_status !== 'pending' && updated.analysis_status !== 'analyzing') {
          stopPolling();
        }
      }
    }, 3000);
  };

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('photos')
          .select('*, visit:visits(id, visit_date, visit_time, outlet:outlets(name, outlet_id))')
          .eq('id', photoId)
          .single();

        if (error) throw error;
        setPhoto(data);

        if (data.analysis_status === 'pending' || data.analysis_status === 'analyzing') {
          startPolling();
        }
      } catch (err) {
        console.error('Error fetching photo:', err);
        toast.error('Could not load analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();

    // If navigated from a new-photo rerun, fetch the original photo for comparison
    const compareId = (location.state as any)?.comparePhotoId;
    if (compareId) {
      supabaseAdmin
        .from('photos')
        .select('*, visit:visits(id, visit_date, visit_time, outlet:outlets(name, outlet_id))')
        .eq('id', compareId)
        .single()
        .then(({ data }) => { if (data) setComparePhoto(data); });
    }

    return () => stopPolling();
  }, [photoId]);

  const handleCancel = async () => {
    stopPolling();
    await supabaseAdmin
      .from('photos')
      .update({ analysis_status: 'cancelled' })
      .eq('id', photoId);
    toast('Analysis cancelled');
    navigate(-1);
  };

  const rerunCount = photo?.analysis_result?.rerun_count ?? 0;

  const handleRerun = async () => {
    if (rerunCount >= MAX_RERUNS) {
      toast.error('Maximum 3 reruns reached');
      return;
    }
    if (!photo) return;

    setRerunning(true);
    const newCount = rerunCount + 1;

    // Save snapshot for before/after comparison
    setBeforeSnapshot(photo);

    // Reset to analyzing
    setPhoto((prev: any) => ({ ...prev, analysis_status: 'analyzing' }));
    await supabaseAdmin
      .from('photos')
      .update({ analysis_status: 'analyzing' })
      .eq('id', photoId);

    try {
      const uiState = await callAnalysisWebhook(
        photo.photo_url,
        'Melvins Tea',
        photo.visit?.id ?? photo.visit_id,
        photoId!,
        photo.visit?.outlet?.name ?? '',
        photo.visit?.outlet?.outlet_id ?? ''
      );

      const dbStatus = uiState.status === 'error' ? 'failed' : 'complete';
      const dbResult = {
        ...(uiState.data ?? uiState.rawData ?? { error: uiState.message }),
        rerun_count: newCount,
      };

      await supabaseAdmin
        .from('photos')
        .update({ analysis_status: dbStatus, analysis_result: dbResult })
        .eq('id', photoId);

      setPhoto((prev: any) => ({
        ...prev,
        analysis_status: dbStatus,
        analysis_result: dbResult,
      }));

      toast.success(`Re-analysis complete (run ${newCount + 1})`);
    } catch {
      toast.error('Re-analysis failed');
      setPhoto((prev: any) => ({ ...prev, analysis_status: 'failed' }));
      await supabaseAdmin
        .from('photos')
        .update({ analysis_status: 'failed' })
        .eq('id', photoId);
    } finally {
      setRerunning(false);
    }
  };

  const handleExport = () => {
    if (!photo?.analysis_result) return;
    const r = photo.analysis_result;
    const mr = r.manager_report;
    const d = mr?.detailed_analysis ?? r.detailed_analysis;
    const outlet = photo.visit?.outlet?.name ?? '—';
    const date = photo.visit?.visit_date ?? '—';
    const time = photo.visit?.visit_time ?? '—';
    const generatedAt = new Date().toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' });

    const col = (v: any) => `"${String(v ?? '—').replace(/"/g, '""')}"`;
    const row = (...cells: any[]) => cells.map(col).join(',');
    const blank = () => '';
    const heading = (title: string) => row(title.toUpperCase(), '', '', '', '');
    const divider = () => row('─────────────────────────────', '', '', '', '');

    const lines: string[] = [
      // Cover block
      row('SHELF AUDIT INTELLIGENCE REPORT', '', '', '', ''),
      row('Generated by', 'merchAI', '', '', ''),
      row('Report Date', generatedAt, '', '', ''),
      blank(),

      // Audit metadata
      divider(),
      heading('AUDIT DETAILS'),
      divider(),
      row('Outlet', outlet),
      row('Visit Date', date),
      row('Visit Time', time),
      row('AI Confidence', `${r.confidence ?? '—'}%`),
      row('Analysis Runs', (mr?.rerun_count ?? r.rerun_count ?? 0) + 1),
      blank(),

      // KPIs
      divider(),
      heading('KEY PERFORMANCE INDICATORS'),
      divider(),
      row('Metric', 'Value'),
      row('Total Facings', mr?.facings?.total ?? mr?.facings ?? r.merchandiser_report?.facings ?? '—'),
      row('Facings — Top Shelf', mr?.facings?.top ?? '—'),
      row('Facings — Middle Shelf', mr?.facings?.middle ?? '—'),
      row('Facings — Bottom Shelf', mr?.facings?.bottom ?? '—'),
      row('Shelf Share', `${mr?.shelf_percentage ?? r.merchandiser_report?.shelf_percentage ?? '—'}%`),
      row('Stock Status', mr?.stock_status ?? r.merchandiser_report?.stock_status ?? '—'),
      row('SKU Count', mr?.sku_count ?? '—'),
      row('Compliance Score', mr?.compliance_score ?? '—'),
      row('Competitive Position', mr?.competitive_position ?? '—'),
      blank(),

      // Pricing
      divider(),
      heading('PRICING'),
      divider(),
      row('SKU', 'Price'),
      ...(d?.pricing?.brand_prices?.length > 0
        ? d.pricing.brand_prices.map((bp: any) => row(bp.sku, bp.price))
        : [row('Brand Price', mr?.price ?? r.merchandiser_report?.price ?? '—')]
      ),
      blank(),
      row('COMPETITOR PRICING', '', ''),
      row('Brand', 'Price'),
      ...(d?.pricing?.competitor_comparison ?? mr?.competitor_prices ?? []).map((cp: any) =>
        row(cp.brand, cp.price ?? cp.sku ?? '—')
      ),
      blank(),

      // Competitive landscape
      divider(),
      heading('COMPETITIVE LANDSCAPE'),
      divider(),
      row('Brand', 'Facings', 'Shelf Share %', 'Rank'),
      ...(mr?.competitors ?? r.merchandiser_report?.competitors ?? []).map((c: any, i: number) =>
        row(c.name, c.facings, c.percentage != null ? `${c.percentage}%` : '—', i + 1)
      ),
      row('Market Leader', d?.competitor_analysis?.market_leader ?? '—'),
      row('Biggest Threat', mr?.biggest_threat ?? '—'),
      blank(),

      // SKU varieties
      ...(d?.sku_variety?.flavors_identified?.length > 0 ? [
        divider(),
        heading('SKU VARIETIES DETECTED'),
        divider(),
        row('SKU / Variant'),
        ...d.sku_variety.flavors_identified.map((s: string) => row(s)),
        ...(d.sku_variety.missing_core_skus ? [row('Missing SKUs Note', d.sku_variety.missing_core_skus)] : []),
        blank(),
      ] : []),

      // Planogram
      ...(d?.planogram_compliance ? [
        divider(),
        heading('PLANOGRAM COMPLIANCE'),
        divider(),
        row('Vertical Blocking', d.planogram_compliance.vertical_blocking ? 'Yes' : 'No'),
        row('Facing Direction', d.planogram_compliance.facing_direction ?? '—'),
        row('Alignment Quality', d.planogram_compliance.alignment_quality ?? '—'),
        row('Execution Score', d.planogram_compliance.execution_score ?? '—'),
        ...(d.planogram_compliance.compliance_issues?.length > 0
          ? [row('Compliance Issues'), ...d.planogram_compliance.compliance_issues.map((i: string) => row('', i))]
          : []
        ),
        blank(),
      ] : []),

      // Issues & Recommendations
      divider(),
      heading('ISSUES IDENTIFIED'),
      divider(),
      ...(mr?.issues ?? r.merchandiser_report?.issues ?? []).map((i: string, idx: number) =>
        row(`${idx + 1}.`, i)
      ),
      blank(),

      divider(),
      heading('RECOMMENDATIONS'),
      divider(),
      ...(mr?.recommendations ?? r.merchandiser_report?.action_items ?? []).map((i: string, idx: number) =>
        row(`${idx + 1}.`, i)
      ),
      blank(),

      // Footer
      divider(),
      row('CONFIDENTIAL — Generated by merchAI Shelf Intelligence Platform', '', '', '', ''),
      row('© ' + new Date().getFullYear() + ' — For internal use only', '', '', '', ''),
    ];

    const csv = lines.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merchAI_ShelfReport_${outlet.replace(/\s+/g, '_')}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="font-bold text-gray-500">Loading your analysis...</p>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-bold">Analysis Record Not Found</p>
        <Link to="/" className="text-primary font-bold mt-4 inline-block underline">Return Home</Link>
      </div>
    );
  }

  const isWorking = photo.analysis_status === 'pending' || photo.analysis_status === 'analyzing';

  const RerunBar = () => {
    if (rerunCount >= MAX_RERUNS) return (
      <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <Ban size={16} className="text-gray-400" />
        <p className="text-sm font-bold text-gray-400">Maximum reruns reached (3/3)</p>
      </div>
    );
    return (
      <button
        onClick={() => setShowRerunModal(true)}
        disabled={rerunning}
        className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-primary/30 text-primary rounded-2xl font-bold hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-50"
      >
        {rerunning ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
        <span>{rerunning ? 'Re-analyzing…' : 'Re-analyze Shelf'}</span>
        <span className="text-xs text-primary/60 font-medium">({rerunCount}/{MAX_RERUNS} used)</span>
      </button>
    );
  };

  return (
    <div className="max-w-md mx-auto pb-10 space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between sticky top-[65px] bg-secondary/80 backdrop-blur-md z-30 py-4 -mx-4 px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 font-bold text-gray-400 hover:text-black transition-colors">
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="font-black text-lg truncate max-w-[200px]">{photo.visit?.outlet?.name}</h2>
          <p className="text-xs text-gray-400 font-medium">{photo.visit?.visit_date} • {photo.visit?.visit_time}</p>
        </div>
        <div className="w-10" />
      </div>

      {isWorking ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 bg-white rounded-[40px] border border-[#e5e5e5] shadow-xl">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera size={32} className="text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2 px-8">
            <h3 className="text-2xl font-black">Analyzing Shelf…</h3>
            <p className="text-gray-500 font-medium">Our AI is counting facings and checking stock levels.</p>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-400 rounded-2xl font-bold hover:border-urgent hover:text-urgent transition-all"
          >
            <Ban size={16} />
            Cancel
          </button>
        </div>
      ) : (() => {
        const ui = handleAnalysisResult(photo.analysis_result || {});

        // Error / failed states
        if (ui.status === 'error' || photo.analysis_status === 'failed' || photo.analysis_status === 'cancelled') {
          const isCancelled = photo.analysis_status === 'cancelled';
          return (
            <div className="space-y-4">
              <div className={`flex flex-col items-center justify-center py-14 space-y-5 rounded-[40px] border-2 ${isCancelled ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-5xl">{isCancelled ? '🚫' : (ui.icon || '❌')}</div>
                <div className="text-center space-y-2 px-6">
                  <h3 className={`text-2xl font-black ${isCancelled ? 'text-gray-600' : 'text-red-600'}`}>
                    {isCancelled ? 'Analysis Cancelled' : ui.title}
                  </h3>
                  {!isCancelled && ui.message && <p className="text-red-500 font-medium text-sm">{ui.message}</p>}
                  {!isCancelled && ui.guidance && <p className="text-xs text-red-400 font-medium">{ui.guidance}</p>}
                </div>
                {!isCancelled && ui.showTips && ui.tips && ui.tips.length > 0 && (
                  <div className="w-full px-6 space-y-2">
                    {ui.tips.map((tip, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-red-100">
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-400 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                        <span className="text-sm font-medium text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <RerunBar />
            </div>
          );
        }

        const analysisData = ui.data || photo.analysis_result;

        // Determine the "before" source: new-photo comparison takes priority, then same-photo snapshot
        const beforeData = comparePhoto ?? beforeSnapshot;

        const PhotoStrip = () => {
          if (!beforeData) return null;

          const beforeMr = beforeData.analysis_result?.merchandiser_report ?? beforeData.analysis_result?.manager_report;
          const afterMr  = analysisData?.merchandiser_report ?? analysisData?.manager_report;
          const beforeFacings = typeof beforeMr?.facings === 'object' ? beforeMr?.facings?.total : beforeMr?.facings;
          const afterFacings  = typeof afterMr?.facings  === 'object' ? afterMr?.facings?.total  : afterMr?.facings;
          const beforeShare = beforeMr?.shelf_percentage;
          const afterShare  = afterMr?.shelf_percentage;

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Before / After</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* BEFORE */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 aspect-[3/4]">
                    <img src={beforeData.photo_url} alt="Before" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className="px-2.5 py-1 bg-black/70 text-white text-[10px] font-black rounded-full uppercase tracking-wider backdrop-blur-sm">Before</span>
                    </div>
                  </div>
                  {beforeMr && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 border border-gray-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-medium">Facings</span>
                        <span className="font-black text-gray-700">{beforeFacings ?? '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-medium">Shelf share</span>
                        <span className="font-black text-gray-700">{beforeShare != null ? `${beforeShare}%` : '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-medium">Status</span>
                        <span className={`font-black text-xs ${beforeMr?.status === 'good' ? 'text-success' : beforeMr?.status === 'urgent' ? 'text-urgent' : 'text-warning'}`}>
                          {beforeMr?.status?.replace('_', ' ') ?? '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AFTER */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-primary/40 aspect-[3/4]">
                    <img src={photo.photo_url} alt="After" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className="px-2.5 py-1 bg-primary/90 text-black text-[10px] font-black rounded-full uppercase tracking-wider backdrop-blur-sm">After</span>
                    </div>
                  </div>
                  {afterMr && (
                    <div className="bg-primary/5 rounded-xl p-3 space-y-1.5 border border-primary/15">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-medium">Facings</span>
                        <span className={`font-black ${afterFacings > beforeFacings ? 'text-success' : afterFacings < beforeFacings ? 'text-urgent' : 'text-gray-700'}`}>
                          {afterFacings ?? '—'}
                          {beforeFacings != null && afterFacings != null && afterFacings !== beforeFacings && (
                            <span className="ml-1 text-[10px]">{afterFacings > beforeFacings ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-medium">Shelf share</span>
                        <span className={`font-black ${afterShare > beforeShare ? 'text-success' : afterShare < beforeShare ? 'text-urgent' : 'text-gray-700'}`}>
                          {afterShare != null ? `${afterShare}%` : '—'}
                          {beforeShare != null && afterShare != null && afterShare !== beforeShare && (
                            <span className="ml-1 text-[10px]">{afterShare > beforeShare ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 font-medium">Status</span>
                        <span className={`font-black text-xs ${afterMr?.status === 'good' ? 'text-success' : afterMr?.status === 'urgent' ? 'text-urgent' : 'text-warning'}`}>
                          {afterMr?.status?.replace('_', ' ') ?? '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delta summary */}
              {beforeFacings != null && afterFacings != null && (
                <div className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-bold ${
                  afterFacings > beforeFacings ? 'bg-success/10 text-success' :
                  afterFacings < beforeFacings ? 'bg-urgent/10 text-urgent' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <span>{beforeFacings} facings</span>
                  <ArrowRight size={14} />
                  <span>{afterFacings} facings</span>
                  {afterFacings !== beforeFacings && (
                    <span className="ml-1 text-xs opacity-70">
                      ({afterFacings > beforeFacings ? '+' : ''}{afterFacings - beforeFacings})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        };

        // Current photo thumbnail — shown at top in all success states
        const CurrentPhotoCard = () => (
          <button
            onClick={() => setShowPhotoModal(true)}
            className="relative w-full aspect-[4/3] rounded-[32px] overflow-hidden shadow-xl border-2 border-white group"
          >
            <img src={photo.photo_url} alt="Current shelf" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-bold rounded-full">
              <Maximize2 size={12} />
              <span>View</span>
            </div>
          </button>
        );

        // Success with urgent alert (empty shelf / brand not found)
        if (ui.status === 'success_with_alert') return (
          <div className="space-y-4">
            <CurrentPhotoCard />
            <div className="flex items-center gap-3 p-5 bg-urgent/10 border border-urgent/30 rounded-3xl">
              <AlertTriangle className="text-urgent shrink-0" size={24} />
              <div>
                <p className="font-black text-urgent">{ui.title}</p>
                <p className="text-sm font-medium text-urgent/80">{ui.alert?.message}</p>
              </div>
            </div>
            <MerchandiserReport
              analysis={analysisData}
              onExport={handleExport}
              onRetake={() => setShowRerunModal(true)}
              onFullReport={analysisData?.manager_report ? () => setShowFullReport(true) : undefined}
            />
            <RerunBar />
            <PhotoStrip />
          </div>
        );

        // Success with warning (low confidence)
        if (ui.status === 'success_with_warning') return (
          <div className="space-y-4">
            <CurrentPhotoCard />
            <MerchandiserReport
              analysis={analysisData}
              onExport={handleExport}
              onRetake={() => setShowRerunModal(true)}
              onFullReport={analysisData?.manager_report ? () => setShowFullReport(true) : undefined}
            />
            <RerunBar />
            <PhotoStrip />
          </div>
        );

        // Clean success
        return (
          <div className="space-y-5">
            <CurrentPhotoCard />
            <MerchandiserReport
              analysis={analysisData}
              onExport={handleExport}
              onRetake={() => setShowRerunModal(true)}
              onFullReport={analysisData?.manager_report ? () => setShowFullReport(true) : undefined}
            />
            <RerunBar />
            <PhotoStrip />
          </div>
        );
      })()}

      {/* Fullscreen Photo Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <img
            src={photo.photo_url}
            alt="Shelf"
            className="max-w-full max-h-full rounded-2xl object-contain"
          />
          <button
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Re-analyze Choice Modal */}
      {showRerunModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[36px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-1 pb-2">
              <h3 className="text-xl font-black text-black">Re-analyze Shelf</h3>
              <p className="text-sm text-gray-500 font-medium">Do you want to upload a new photo, or re-run the AI on the existing one?</p>
            </div>

            <button
              onClick={() => {
                setShowRerunModal(false);
                navigate('/capture', { state: { comparePhotoId: photoId } });
              }}
              className="w-full flex items-center gap-4 p-5 bg-primary/8 border-2 border-primary/20 rounded-2xl hover:bg-primary/15 transition-all active:scale-95"
            >
              <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Camera size={22} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-black text-black">Upload New Photo</p>
                <p className="text-xs text-gray-500 font-medium">Retake the shelf photo and run fresh analysis</p>
              </div>
            </button>

            <button
              onClick={() => {
                setShowRerunModal(false);
                handleRerun();
              }}
              className="w-full flex items-center gap-4 p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
            >
              <div className="w-11 h-11 rounded-2xl bg-gray-200 flex items-center justify-center shrink-0">
                <RotateCcw size={22} className="text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-black text-black">Re-run on Same Photo</p>
                <p className="text-xs text-gray-500 font-medium">Re-analyze the existing photo ({rerunCount}/{MAX_RERUNS} runs used)</p>
              </div>
            </button>

            <button
              onClick={() => setShowRerunModal(false)}
              className="w-full py-3 text-gray-400 font-bold text-sm hover:text-black transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Full Report Modal */}
      {showFullReport && photo?.analysis_result?.manager_report && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-secondary rounded-[40px] p-6 my-8 relative">
            <button
              onClick={() => setShowFullReport(false)}
              className="sticky top-4 ml-auto flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg text-gray-400 hover:text-black z-10 mb-4"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black mb-6 px-2">Full Manager Report</h2>
            <ManagerReport
              report={photo.analysis_result.manager_report}
              confidence={photo.analysis_result.confidence || 92}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
