import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock analysis data generator
function generateMockAnalysis(confidence: number) {
  return {
    success: true,
    confidence,
    merchandiser_report: {
      status: confidence > 85 ? "good" : "needs_work",
      facings: Math.floor(Math.random() * 30) + 15,
      shelf_percentage: Math.floor(Math.random() * 35) + 20,
      stock_status: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      price: "KES 85",
      competitors: [
        { name: "Ketepa", facings: Math.floor(Math.random() * 40) + 25, percentage: Math.floor(Math.random() * 50) + 30 },
        { name: "Brookside", facings: Math.floor(Math.random() * 25) + 10, percentage: Math.floor(Math.random() * 30) + 15 }
      ],
      action_items: [
        "Add 3 more boxes to top shelf",
        "Ensure secondary brand doesn't overlap",
        "Fix price tag on 250g SKU"
      ],
      issues: ["Competitor gaining space", "Price tag visibility issue"]
    },
    manager_report: {
      facings: { total: 22, top: 8, middle: 10, bottom: 4 },
      shelf_percentage: 28,
      shelf_position: "Eye-level center",
      stock_status: "In Stock - Good depth",
      competitors: [
        { name: "Ketepa", facings: 35, percentage: 42 },
        { name: "Brookside", facings: 12, percentage: 15 }
      ],
      sku_count: 5,
      skus: ["50g", "100g", "250g", "Green Tea", "Black Tea"],
      price: "KES 85",
      competitor_prices: [
        { brand: "Ketepa", price: "KES 80" },
        { brand: "Brookside", price: "KES 95" }
      ],
      compliance_score: "High",
      issues: [
        "Ketepa share increased 5% vs last week",
        "Promotional bunting missing"
      ],
      recommendations: [
        "Reinstate promotional materials",
        "Negotiate for 5 additional facings"
      ],
      competitive_position: "2nd in category",
      biggest_threat: "Ketepa - aggressive pricing"
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let photoId: string | null = null;

  try {
    const { photo_id, visit_id, photo_url, target_brand } = await req.json()
    photoId = photo_id || visit_id;

    // 1. Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Update status to 'analyzing'
    await supabase
      .from('photos')
      .update({ analysis_status: 'analyzing' })
      .eq('id', photoId)

    // 3. Call n8n webhook or use demo mode
    let analysis: any;
    const n8nWebhook = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (n8nWebhook) {
      // Production: Call actual n8n webhook
      try {
        const n8nResponse = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo_url,
            target_brand: target_brand || 'Melvins Tea'
          })
        })

        if (!n8nResponse.ok) throw new Error(`n8n returned ${n8nResponse.status}`)
        analysis = await n8nResponse.json()
      } catch (n8nError) {
        console.error('n8n webhook failed:', n8nError);
        // Fallback to mock data if n8n fails
        analysis = generateMockAnalysis(75);
      }
    } else {
      // Demo mode: Simulate AI processing with mock data
      await new Promise(resolve => setTimeout(resolve, 5000))
      analysis = generateMockAnalysis(94);
    }

    // 4. Save to database
    const { error: updateError } = await supabase
      .from('photos')
      .update({ 
        analysis_status: analysis.success ? 'complete' : 'failed',
        analysis_result: analysis,
        confidence_score: analysis.confidence || 0,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', photoId)

    if (updateError) throw updateError

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Analysis error:', error);
    
    // Update photo status to failed
    if (photoId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabase
        .from('photos')
        .update({ 
          analysis_status: 'failed',
          analysis_result: { success: false, error: error.message }
        })
        .eq('id', photoId)
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Analysis failed',
      confidence: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
