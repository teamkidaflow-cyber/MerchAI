import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, Package, Tag, Layers,
  BarChart2, ChevronDown, ChevronUp, Check, RefreshCcw, FileSpreadsheet, List,
  Gauge
} from 'lucide-react';

interface MerchandiserReportProps {
  analysis: any;
  photoUrl?: string;
  onExport?: () => void;
  onRetake?: () => void;
  onFullReport?: () => void;
}

const MerchandiserReport: React.FC<MerchandiserReportProps> = ({
  analysis, photoUrl, onExport, onRetake, onFullReport,
}) => {
  const [doneActions, setDoneActions] = useState<Set<number>>(new Set());
  const [expandedShelves, setExpandedShelves] = useState<Set<number>>(new Set());

  const mr       = analysis?.merchandiser_report ?? analysis?.manager_report;
  const summary  = analysis?.overall_summary;
  const confidence = analysis?.confidence ?? 0;
  const edgeCase   = analysis?.edge_case;
  const shelves    = analysis?.shelf_by_shelf_analysis ?? [];
  const targetName = summary?.target_brand ?? 'Melvins Tea';

  if (!mr) return null;

  /* ─── Status config ─── */
  const sc = ({
    good:       { bg: 'bg-success',  ring: 'border-success/30',  text: 'text-white',      label: 'Good Shelf Stand',         icon: <CheckCircle2 size={20} /> },
    needs_work: { bg: 'bg-warning',  ring: 'border-warning/40',  text: 'text-black',      label: 'Needs Work',               icon: <AlertTriangle size={20} /> },
    urgent:     { bg: 'bg-urgent',   ring: 'border-urgent/30',   text: 'text-white',      label: 'Urgent Action Required',   icon: <XCircle size={20} /> },
  } as any)[mr.status] ?? { bg: 'bg-gray-500', ring: 'border-gray-300', text: 'text-white', label: '—', icon: null };

  const confidenceColor = confidence >= 80 ? 'text-success' : confidence >= 60 ? 'text-warning' : 'text-urgent';
  const confidenceBg    = confidence >= 80 ? 'bg-success/10 border-success/20' : confidence >= 60 ? 'bg-warning/10 border-warning/20' : 'bg-urgent/10 border-urgent/20';

  /* ─── Facings ─── */
  const targetFacings: number =
    summary?.total_facings_all_shelves ??
    (typeof mr.facings === 'object' ? (mr.facings?.total ?? 0) : (mr.facings ?? 0));
  const targetShare: number = summary?.total_shelf_percentage ?? mr.shelf_percentage ?? 0;

  /* ─── Competitor bars ─── */
  const competitors = mr.competitors ?? [];
  const allBrands = [
    ...competitors.map((c: any) => ({ name: c.name, facings: Number(c.facings) || 0, isTarget: false })),
    { name: targetName, facings: targetFacings, isTarget: true },
  ].sort((a, b) => b.facings - a.facings);
  const maxFacings = Math.max(...allBrands.map(b => b.facings), 1);
  const leader = allBrands.find(b => !b.isTarget);
  const gap    = leader ? leader.facings - targetFacings : 0;

  /* ─── Actions ─── */
  const actionItems: string[] = mr.action_items ?? mr.recommendations ?? [];
  const primaryAction    = actionItems[0];
  const secondaryActions = actionItems.slice(1);

  /* ─── Price display ─── */
  const displayPrice = (() => {
    const p = mr.price ?? '—';
    if (typeof p === 'string' && p.length > 20) {
      const match = p.match(/(?:KES\s*)?[\d,]+\/-?/i);
      return match ? match[0] : p.slice(0, 18) + '…';
    }
    return p;
  })();

  /* ─── Shelf competitor_facings normaliser (object or array → array) ─── */
  const normaliseShelfCompetitors = (cf: any): { name: string; facings: number }[] => {
    if (!cf) return [];
    if (Array.isArray(cf)) return cf.map((c: any) => ({ name: c.name, facings: Number(c.facings) || 0 }));
    return Object.entries(cf).map(([name, facings]) => ({ name, facings: Number(facings) || 0 }));
  };

  const toggleDone  = (i: number) => setDoneActions(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const toggleShelf = (i: number) => setExpandedShelves(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Low-confidence banner ── */}
      {edgeCase === 'low_confidence' && (
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-2xl">
          <AlertTriangle className="text-warning shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold text-warning text-sm">Low Confidence Analysis</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Photo quality may have affected accuracy. Consider retaking.</p>
          </div>
        </div>
      )}

      {/* ── 1. PHOTO + STATUS HEADER ── */}
      <div className="bg-white rounded-[28px] border border-[#e5e5e5] shadow-sm overflow-hidden">
        {/* Photo thumbnail */}
        {photoUrl && (
          <div className="relative w-full h-40 bg-gray-100">
            <img src={photoUrl} alt="Shelf" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <span className="text-white text-xs font-bold opacity-80">Analyzed photo</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${sc.bg} ${sc.text}`}>
                {mr.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Status row */}
        <div className={`flex items-center gap-3 px-5 py-4 ${sc.bg} ${sc.text} ${photoUrl ? '' : 'rounded-t-[28px]'}`}>
          {sc.icon}
          <p className="font-black text-base leading-tight flex-1">{sc.label}</p>
        </div>

        {/* Confidence row — always visible, outside the coloured area */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.06]">
          <div className="flex items-center gap-2">
            <Gauge size={16} className={confidenceColor} />
            <span className="text-sm font-bold text-gray-700">AI Confidence</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${confidenceBg}`}>
            <span className={`text-sm font-black ${confidenceColor}`}>{confidence}%</span>
            <span className="text-xs text-gray-400 font-medium">
              {confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. VERTICAL COVERAGE SUMMARY ── */}
      {summary && (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shelf Coverage</p>
            <span className={`text-sm font-black px-2.5 py-1 rounded-full ${
              (summary.shelves_present_on?.length ?? 0) >= 4 ? 'bg-success/10 text-success' :
              (summary.shelves_present_on?.length ?? 0) >= 2 ? 'bg-warning/10 text-warning' :
              'bg-urgent/10 text-urgent'
            }`}>
              {summary.vertical_coverage ?? '—'}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(summary.shelves_present_on ?? []).map((s: string) => (
              <span key={s} className="px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded-full">✓ {s}</span>
            ))}
            {(summary.shelves_absent_from ?? []).map((s: string) => (
              <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-400 text-xs font-medium rounded-full">✗ {s}</span>
            ))}
          </div>
          {summary.strongest_shelf && (
            <p className="text-xs text-gray-500 font-medium">Best: <span className="font-bold text-black">{summary.strongest_shelf}</span></p>
          )}
        </div>
      )}

      {/* ── 3. QUICK METRICS ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Layers size={20} />, value: targetFacings, label: 'Total Facings' },
          { icon: <TrendingUp size={20} />, value: `${targetShare}%`, label: 'Shelf Share' },
          { icon: <Package size={20} />, value: mr.stock_status ?? '—', label: 'Stock Level', small: true },
          { icon: <Tag size={20} />, value: displayPrice, label: 'Retail Price', small: true },
        ].map(({ icon, value, label, small }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-sm flex flex-col gap-1.5 min-h-[96px]">
            <div className="text-primary">{icon}</div>
            <p className={`font-black text-black leading-tight break-words ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      {/* ── 3b. FACINGS BY SHELF LEVEL ── */}
      {typeof mr.facings === 'object' && mr.facings?.total > 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm px-5 py-4 space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facings by Shelf Level</p>
          <div className="space-y-2.5">
            {[
              { label: 'Top', value: mr.facings.top, color: 'bg-primary' },
              { label: 'Middle', value: mr.facings.middle, color: 'bg-primary/60' },
              { label: 'Bottom', value: mr.facings.bottom, color: 'bg-primary/30' },
            ].filter(s => s.value > 0).map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-600">{label} shelf</span>
                  <span className="font-black text-gray-800">{value} facings</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${(value / mr.facings.total) * 100}%`, transition: 'width 0.6s ease-out' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. COMPETITOR COMPARISON ── */}
      {allBrands.length > 1 && (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-primary" />
              <h3 className="font-black text-base">Shelf Competition</h3>
            </div>
            {leader && gap > 0 && (
              <p className="text-xs text-gray-500 font-medium mt-1">
                You: <span className="font-black text-black">{targetFacings}</span> ·{' '}
                Leader: <span className="font-black text-black">{leader.facings}</span> ·{' '}
                Gap: <span className="font-black text-urgent">Need {gap} more to match {leader.name}</span>
              </p>
            )}
            {gap <= 0 && leader && (
              <p className="text-xs text-success font-bold mt-1">You lead or match the competition — maintain this!</p>
            )}
          </div>
          <div className="px-5 py-4 space-y-4">
            {allBrands.map((brand, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-bold ${brand.isTarget ? 'text-primary' : 'text-gray-700'}`}>
                    {brand.isTarget ? `→ ${brand.name}` : brand.name}
                    {brand.isTarget && gap > 0 && <span className="ml-1 text-urgent text-xs">⚠</span>}
                  </span>
                  <span className={`text-sm font-black ${brand.isTarget ? 'text-primary' : 'text-gray-500'}`}>
                    {brand.facings}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${brand.isTarget ? 'bg-primary' : 'bg-gray-300'}`}
                    style={{ width: `${(brand.facings / maxFacings) * 100}%`, transition: 'width 0.7s ease-out' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. PRIMARY ACTION ── */}
      {primaryAction && (
        <div className={`p-5 rounded-2xl border-2 transition-all ${doneActions.has(0) ? 'bg-success/8 border-success/25' : 'bg-primary/8 border-primary/25'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${doneActions.has(0) ? 'text-success' : 'text-primary'}`}>
            #1 Priority — Do This Now
          </p>
          <div className="flex items-start justify-between gap-4">
            <p className={`font-black text-base leading-snug flex-1 ${doneActions.has(0) ? 'line-through opacity-50 text-success' : 'text-black'}`}>
              {primaryAction}
            </p>
            <button
              onClick={() => toggleDone(0)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all min-h-[44px] ${
                doneActions.has(0) ? 'bg-success text-white' : 'bg-primary text-black'
              }`}
            >
              <Check size={15} />
              {doneActions.has(0) ? 'Done!' : 'Mark Done'}
            </button>
          </div>
        </div>
      )}

      {/* ── 6. ADDITIONAL ACTIONS ── */}
      {secondaryActions.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden">
          <p className="px-5 pt-4 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">If Time Permits</p>
          <div className="divide-y divide-[#f5f5f5]">
            {secondaryActions.map((item: string, idx: number) => {
              const i = idx + 1;
              return (
                <div key={i} className={`flex items-start gap-4 px-5 py-4 ${doneActions.has(i) ? 'opacity-40' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${doneActions.has(i) ? 'bg-success/15 text-success' : 'bg-gray-100 text-gray-400'}`}>
                    {doneActions.has(i) ? <Check size={13} /> : i + 1}
                  </div>
                  <p className={`font-medium text-sm text-gray-700 flex-1 pt-1 ${doneActions.has(i) ? 'line-through' : ''}`}>{item}</p>
                  <button
                    onClick={() => toggleDone(i)}
                    className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${doneActions.has(i) ? 'bg-success border-success' : 'border-gray-300'}`}>
                      {doneActions.has(i) && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 7. ISSUES ── */}
      {mr.issues?.length > 0 && (
        <div className="bg-urgent/5 border border-urgent/15 rounded-2xl p-5 space-y-3">
          <h3 className="flex items-center gap-2 font-black text-urgent text-sm uppercase tracking-wider">
            <AlertTriangle size={15} />Issues Detected
          </h3>
          {mr.issues.map((issue: string, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-urgent shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-urgent/90">{issue}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 8. SHELF-BY-SHELF ── */}
      {shelves.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-black text-base px-1 flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            Shelf by Shelf
          </h3>
          {shelves.map((shelf: any, i: number) => {
            const isExpanded = expandedShelves.has(i);
            const isPresent  = shelf.target_brand_present ?? shelf.brand_present ?? (shelf.target_brand_facings > 0);
            const shelfLabel = shelf.shelf_position ?? shelf.shelf_name ?? `Shelf ${shelf.shelf_number ?? i + 1}`;
            const shelfNum   = shelf.shelf_number ?? i + 1;
            const shelfFacings = shelf.target_brand_facings ?? 0;
            const shelfShare   = shelf.target_brand_shelf_percentage ?? 0;
            const compFacings  = normaliseShelfCompetitors(shelf.competitor_facings ?? shelf.competitors);
            const maxComp      = Math.max(...compFacings.map(c => c.facings), 1);

            return (
              <div key={i} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${isPresent ? 'border-success/25' : 'border-gray-200'}`}>
                <button
                  onClick={() => toggleShelf(i)}
                  className="w-full flex items-center gap-4 px-5 py-4 min-h-[60px] text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isPresent ? 'bg-success/15 text-success' : 'bg-gray-100 text-gray-400'}`}>
                    {shelfNum}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-black truncate">{shelfLabel}</p>
                    <p className={`text-xs font-medium mt-0.5 ${isPresent ? 'text-success' : 'text-gray-400'}`}>
                      {isPresent
                        ? `${shelfFacings} facings · ${shelfShare}% share`
                        : 'Brand not present'}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${isPresent ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'}`}>
                    {isPresent ? '✓ Present' : '✗ Absent'}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                    {/* Shelf winner */}
                    {shelf.shelf_winner && (
                      <p className="text-xs text-gray-500 font-medium">
                        Shelf leader: <span className="font-bold text-black">{shelf.shelf_winner}</span>
                      </p>
                    )}

                    {/* Competitor bars on this shelf */}
                    {compFacings.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brands on this shelf</p>
                        {compFacings.sort((a, b) => b.facings - a.facings).map((c, ci) => {
                          const isMe = c.name === targetName || c.name.toLowerCase().includes(targetName.toLowerCase().split(' ')[0]);
                          return (
                            <div key={ci} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={`font-bold ${isMe ? 'text-primary' : 'text-gray-600'}`}>{c.name}</span>
                                <span className={`font-black ${isMe ? 'text-primary' : 'text-gray-500'}`}>{c.facings}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isMe ? 'bg-primary' : 'bg-gray-300'}`}
                                  style={{ width: `${(c.facings / maxComp) * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Issues */}
                    {shelf.issues?.length > 0 && (
                      <div className="space-y-1.5">
                        {shelf.issues.map((iss: string, ii: number) => (
                          <div key={ii} className="flex items-start gap-2 p-2.5 bg-urgent/5 rounded-xl">
                            <AlertTriangle size={13} className="text-urgent shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-urgent/80">{iss}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action items */}
                    {shelf.action_items?.length > 0 && (
                      <div className="space-y-1.5">
                        {shelf.action_items.map((act: string, ai: number) => (
                          <div key={ai} className="flex items-start gap-2 p-2.5 bg-primary/6 rounded-xl">
                            <Check size={13} className="text-primary shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-primary/80">{act}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Opportunity */}
                    {(shelf.opportunity ?? shelf.action_required) && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs font-medium text-gray-600">
                          💡 {shelf.opportunity ?? shelf.action_required}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 9. ACTION BUTTONS ── */}
      <div className="space-y-3 pt-2">
        {onFullReport && (
          <button
            onClick={onFullReport}
            className="w-full flex items-center justify-center gap-2 py-4 min-h-[52px] bg-white border-2 border-[#e5e5e5] rounded-2xl font-bold text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-95"
          >
            <List size={20} />
            View Full Manager Report
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          {onExport && (
            <button onClick={onExport} className="flex items-center justify-center gap-2 py-4 min-h-[52px] bg-white border-2 border-[#e5e5e5] rounded-2xl font-bold text-sm text-gray-600 hover:border-success hover:text-success transition-all active:scale-95">
              <FileSpreadsheet size={18} />Export CSV
            </button>
          )}
          {onRetake && (
            <button onClick={onRetake} className="flex items-center justify-center gap-2 py-4 min-h-[52px] bg-white border-2 border-[#e5e5e5] rounded-2xl font-bold text-sm text-gray-600 hover:border-gray-400 transition-all active:scale-95">
              <RefreshCcw size={18} />Retake Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchandiserReport;
