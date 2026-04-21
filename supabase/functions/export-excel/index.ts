import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import ExcelJS from "https://esm.sh/exceljs"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, visit_id, filters } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let query = supabase
      .from('photos')
      .select('*, visit:visits(*, outlet:outlets(*), user:users(*))')

    if (type === 'single' && visit_id) {
      query = query.eq('visit_id', visit_id)
    } else if (type === 'bulk' && filters) {
      if (filters.start_date) query = query.gte('visit.visit_date', filters.start_date)
      if (filters.end_date) query = query.lte('visit.visit_date', filters.end_date)
      if (filters.outlet_id) query = query.eq('visit.outlet_id', filters.outlet_id)
      if (filters.user_id) query = query.eq('visit.user_id', filters.user_id)
    }

    const { data: photos, error } = await query.order('visit.visit_date', { ascending: false })
    if (error) throw error

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const dataSheet = workbook.addWorksheet('Shelf Audit Report');

    // Column definitions
    dataSheet.columns = [
      { header: 'Outlet ID', key: 'oid', width: 15 },
      { header: 'Outlet Name', key: 'oname', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 12 },
      { header: 'Merchandiser', key: 'merch', width: 20 },
      { header: 'Facings', key: 'facings', width: 10 },
      { header: 'Shelf %', key: 'share', width: 10 },
      { header: 'Stock Status', key: 'stock', width: 15 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Competitors', key: 'competitors', width: 30 },
      { header: 'Issues', key: 'issues', width: 35 },
      { header: 'Confidence', key: 'confidence', width: 12 },
    ];

    // Add data rows
    let totalFacings = 0;
    let totalShelfPercentage = 0;
    let stockOutCount = 0;
    const issueFrequency: { [key: string]: number } = {};

    photos?.forEach(photo => {
      const report = photo.analysis_result?.merchandiser_report || {};
      const competitors = (report.competitors || []).map(c => `${c.name} (${c.facings})`).join(', ');
      
      dataSheet.addRow({
        oid: photo.visit?.outlet?.outlet_id || 'N/A',
        oname: photo.visit?.outlet?.name || 'N/A',
        date: photo.visit?.visit_date || 'N/A',
        time: photo.visit?.visit_time || 'N/A',
        merch: photo.visit?.user?.name || 'N/A',
        facings: report.facings || 0,
        share: report.shelf_percentage ? `${report.shelf_percentage}%` : 'N/A',
        stock: report.stock_status || 'N/A',
        price: report.price || 'N/A',
        competitors: competitors || 'N/A',
        issues: (report.issues || []).join('; ') || 'None',
        confidence: `${photo.analysis_result?.confidence || 0}%`
      });

      // Aggregation for summary
      totalFacings += report.facings || 0;
      totalShelfPercentage += report.shelf_percentage || 0;
      if (report.stock_status === 'Low' || report.stock_status === 'Out of Stock') {
        stockOutCount++;
      }
      (report.issues || []).forEach(issue => {
        issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
      });
    });

    // Format header row
    const headerRow = dataSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDB913' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'center' };

    // Add alternating row colors
    for (let i = 2; i <= (photos?.length || 0) + 1; i++) {
      if (i % 2 === 0) {
        dataSheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      }
    }

    // Add summary sheet for bulk exports
    if (type === 'bulk' && photos && photos.length > 0) {
      const summarySheet = workbook.addWorksheet('Summary');
      
      const photoCount = photos.length;
      const averageShelfPercentage = photoCount > 0 ? (totalShelfPercentage / photoCount).toFixed(1) : 0;
      const topIssue = Object.entries(issueFrequency).sort((a, b) => b[1] - a[1])[0];

      summarySheet.addRows([
        ['SimplyDone Shelf Analyzer - Summary Report'],
        [],
        ['Total Photos Audited', photoCount],
        ['Total Outlets Visited', new Set(photos.map(p => p.visit?.outlet_id)).size],
        ['Average Shelf Share %', averageShelfPercentage],
        ['Stock-Out Count', stockOutCount],
        ['Most Common Issue', topIssue ? topIssue[0] : 'None'],
        ['Report Generated', new Date().toISOString()],
      ]);

      summarySheet.mergeCells('A1:B1');
      summarySheet.getCell('A1').font = { bold: true, size: 14 };
      summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDB913' } };
      summarySheet.columnWidth = 30;
      summarySheet.rowHeight = 20;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="SimplyDone_Audit_${type}_${Date.now()}.xlsx"`
      },
      status: 200,
    })

  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Export failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

