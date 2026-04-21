import React from 'react';
import { AlertTriangle, CheckCircle2, Layout, Target, ChevronRight, Tag, Package2, ShoppingBag, Layers } from 'lucide-react';

interface ManagerReportProps {
  report: any;
  confidence: number;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-gray-500 font-medium text-sm">{label}</span>
    <span className="font-bold text-black text-sm text-right max-w-[60%]">{value}</span>
  </div>
);

const ManagerReport: React.FC<ManagerReportProps> = ({ report, confidence }) => {
  if (!report) return null;
  const d = report.detailed_analysis;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Compliance</p>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="text-success shrink-0" size={16} />
            <span className="text-xl font-black text-black">{report.compliance_score}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Confidence</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${confidence > 80 ? 'bg-success' : confidence > 60 ? 'bg-warning' : 'bg-urgent'}`} />
            <span className="text-xl font-black text-black">{confidence}%</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SKUs</p>
          <span className="text-xl font-black text-black">{report.sku_count}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shelf Share</p>
          <span className="text-xl font-black text-primary">{report.shelf_percentage}%</span>
        </div>
      </div>

      {/* Shelf positioning + Facings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-4">
          <h3 className="font-black flex items-center gap-2 text-base">
            <Layout className="text-primary" size={18} /> Shelf Positioning
          </h3>
          <Row label="Placement" value={report.shelf_position} />
          <Row label="Stock Status" value={
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
              report.stock_status?.toLowerCase().includes('out') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>{report.stock_status}</span>
          } />
          {d?.stock_availability?.gap_description && (
            <p className="text-xs text-gray-400 italic">{d.stock_availability.gap_description}</p>
          )}
          {report.facings?.total > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Facings by Shelf</p>
              <div className="flex items-stretch gap-1 h-10 bg-gray-50 rounded-xl overflow-hidden p-1">
                {report.facings.top > 0 && (
                  <div style={{ width: `${(report.facings.top / report.facings.total) * 100}%` }}
                    className="h-full bg-primary rounded flex items-center justify-center text-[9px] font-black text-black">
                    {report.facings.top}T
                  </div>
                )}
                {report.facings.middle > 0 && (
                  <div style={{ width: `${(report.facings.middle / report.facings.total) * 100}%` }}
                    className="h-full bg-primary/60 rounded flex items-center justify-center text-[9px] font-black text-black">
                    {report.facings.middle}M
                  </div>
                )}
                {report.facings.bottom > 0 && (
                  <div style={{ width: `${(report.facings.bottom / report.facings.total) * 100}%` }}
                    className="h-full bg-primary/30 rounded flex items-center justify-center text-[9px] font-black text-black">
                    {report.facings.bottom}B
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium mt-1">{report.facings.total} total facings</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-4">
          <h3 className="font-black flex items-center gap-2 text-base">
            <Target className="text-urgent" size={18} /> Competitive Intelligence
          </h3>
          {report.biggest_threat && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs italic text-red-700 font-medium">
              Biggest threat: {report.biggest_threat}
            </div>
          )}
          <div className="space-y-2.5">
            {(report.competitors ?? []).map((comp: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-black">{comp.name}</span>
                  <span className="text-gray-500 font-medium">{comp.facings}f {comp.percentage != null ? `· ${comp.percentage}%` : ''}</span>
                </div>
                {comp.percentage != null && (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 rounded-full" style={{ width: `${Math.min(comp.percentage, 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {d?.competitor_analysis?.market_leader && (
            <p className="text-xs text-gray-400 font-medium">Market leader: {d.competitor_analysis.market_leader}</p>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-4">
        <h3 className="font-black flex items-center gap-2 text-base">
          <Tag className="text-primary" size={18} /> Pricing
        </h3>
        <div className="space-y-2">
          {/* Brand SKU prices from detailed_analysis */}
          {d?.pricing?.brand_prices?.length > 0 ? (
            d.pricing.brand_prices.map((bp: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-primary/8 rounded-xl">
                <span className="font-bold text-black text-sm">{bp.sku}</span>
                <span className="font-black text-primary">{bp.price}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between items-center p-3 bg-primary/8 rounded-xl">
              <span className="font-bold text-black text-sm">Brand price</span>
              <span className="font-black text-primary">{report.price}</span>
            </div>
          )}
          {/* Competitor prices */}
          {(d?.pricing?.competitor_comparison ?? report.competitor_prices ?? []).map((cp: any, i: number) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-600 text-sm">{cp.brand}</span>
              <span className="font-bold text-black text-sm">{cp.price ?? cp.sku}</span>
            </div>
          ))}
          {d?.pricing?.price_variations && (
            <p className="text-xs text-warning font-medium flex items-center gap-1 mt-1">
              <AlertTriangle size={12} /> Multiple price points visible — check tag consistency
            </p>
          )}
        </div>
      </div>

      {/* SKUs */}
      {(() => {
        const skus: string[] = d?.sku_variety?.flavors_identified?.length > 0
          ? d.sku_variety.flavors_identified
          : report.skus ?? [];
        if (skus.length === 0) return null;
        return (
          <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-4">
            <h3 className="font-black flex items-center gap-2 text-base">
              <Package2 className="text-primary" size={18} /> SKU Varieties Detected
            </h3>
            <div className="flex flex-wrap gap-2">
              {skus.map((sku: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">{sku}</span>
              ))}
            </div>
            {d?.sku_variety?.missing_core_skus && (
              <p className="text-xs text-gray-400 italic">{d.sku_variety.missing_core_skus}</p>
            )}
          </div>
        );
      })()}

      {/* Planogram */}
      {d?.planogram_compliance && (
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-3">
          <h3 className="font-black flex items-center gap-2 text-base">
            <Layers className="text-primary" size={18} /> Planogram Compliance
          </h3>
          <Row label="Vertical Blocking" value={d.planogram_compliance.vertical_blocking ? '✓ Yes' : '✗ No'} />
          <Row label="Facing Direction" value={d.planogram_compliance.facing_direction} />
          <Row label="Alignment" value={d.planogram_compliance.alignment_quality} />
          {(d.planogram_compliance.compliance_issues ?? []).map((issue: string, i: number) => (
            <div key={i} className="flex gap-2 text-warning text-sm">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span className="font-medium">{issue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Promotional elements */}
      {d?.promotional_elements && (
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-3">
          <h3 className="font-black flex items-center gap-2 text-base">
            <ShoppingBag className="text-primary" size={18} /> Promotional Elements
          </h3>
          <Row label="POS Materials" value={d.promotional_elements.pos_materials?.join(', ') || 'None'} />
          <Row label="Promo Signage" value={d.promotional_elements.promotion_signage ? '✓ Present' : '✗ None'} />
          <Row label="Special Displays" value={d.promotional_elements.special_displays ? '✓ Present' : '✗ None'} />
        </div>
      )}

      {/* Issues & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-3">
          <h3 className="font-black text-urgent text-base flex items-center gap-2">
            <AlertTriangle size={18} /> Issues
          </h3>
          {(report.issues ?? []).map((issue: string, idx: number) => (
            <div key={idx} className="flex gap-2 text-urgent">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span className="font-medium text-sm">{issue}</span>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-[#e5e5e5] shadow-sm space-y-3">
          <h3 className="font-black text-success text-base flex items-center gap-2">
            <ChevronRight size={18} /> Recommendations
          </h3>
          {(report.recommendations ?? []).map((rec: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
                <ChevronRight size={12} />
              </div>
              <span className="font-medium text-sm text-gray-700">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerReport;
