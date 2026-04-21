import React, { useEffect, useState } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { Link } from 'react-router-dom';
import { ArrowUpDown, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface OutletRow {
  id: string;
  name: string;
  visit: string;
  share: number;
  stock: string;
  issues: number;
  latestPhotoId: string | null;
}

const OutletTable: React.FC = () => {
  const [data, setData] = useState<OutletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: outlets } = await supabase.from('outlets').select('id, name').eq('status', 'active');
      if (!outlets) { setLoading(false); return; }

      const rows: OutletRow[] = await Promise.all(outlets.map(async (outlet) => {
        const { data: visits } = await supabase
          .from('visits')
          .select('id, visit_date, photos(id, analysis_status, analysis_result)')
          .eq('outlet_id', outlet.id)
          .order('visit_date', { ascending: false })
          .limit(1);

        const photo = visits?.[0]?.photos?.[0];
        const result = photo?.analysis_result;
        const share = result?.manager_report?.shelf_percentage ?? result?.merchandiser_report?.shelf_percentage ?? 0;
        const stock = result?.manager_report?.stock_status ?? result?.merchandiser_report?.stock_status ?? 'Unknown';
        const issues = (result?.manager_report?.issues ?? result?.merchandiser_report?.issues ?? []).length;

        return {
          id: outlet.id,
          name: outlet.name,
          visit: visits?.[0]?.visit_date ?? 'No visit',
          share,
          stock,
          issues,
          latestPhotoId: photo?.id ?? null,
        };
      }));

      setData(rows);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSort = (key: string) => {
    const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    setData(prev => [...prev].sort((a: any, b: any) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[32px] border border-[#e5e5e5] flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-[#e5e5e5] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-[#e5e5e5]">
              <th onClick={() => handleSort('name')} className="px-6 py-5 cursor-pointer hover:text-primary transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outlet</span>
                  <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </th>
              <th className="px-6 py-5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Visit</span>
              </th>
              <th onClick={() => handleSort('share')} className="px-6 py-5 cursor-pointer hover:text-primary transition-colors group text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shelf %</span>
                  <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </th>
              <th className="px-6 py-5 text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</span>
              </th>
              <th className="px-6 py-5 text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Issues</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium">No outlet data yet</td>
              </tr>
            ) : data.map(row => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <MapPin size={16} className="text-gray-400" />
                    </div>
                    {row.latestPhotoId ? (
                      <Link to={`/photo/${row.latestPhotoId}`} className="font-bold text-black hover:text-primary transition-colors">{row.name}</Link>
                    ) : (
                      <span className="font-bold text-black">{row.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-500">{row.visit}</td>
                <td className="px-6 py-4 text-center">
                  <span className="font-black text-black">{row.share > 0 ? `${row.share}%` : '—'}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    row.stock.toLowerCase().includes('out') ? 'bg-red-100 text-red-600' :
                    row.stock.toLowerCase() === 'low' ? 'bg-yellow-100 text-yellow-600' :
                    row.stock === 'Unknown' ? 'bg-gray-100 text-gray-400' :
                    'bg-green-100 text-green-600'
                  }`}>{row.stock}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {row.issues > 0 ? (
                    <div className="flex items-center justify-center gap-1 text-urgent font-bold">
                      <AlertCircle size={14} /><span>{row.issues}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutletTable;
