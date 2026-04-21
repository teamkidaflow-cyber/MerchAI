export interface AnalysisUIState {
  status: 'success' | 'success_with_alert' | 'success_with_warning' | 'error';
  severity: 'success' | 'warning' | 'urgent' | 'critical';
  title: string;
  message?: string;
  guidance?: string;
  icon?: string;
  tips?: string[];
  showTips?: boolean;
  allowRetry?: boolean;
  suggestRetake?: boolean;
  allowExport?: boolean;
  action: 'SHOW_RESULTS' | 'SHOW_RESULTS_WITH_WARNING' | 'RETAKE_PHOTO' | 'RETRY_ANALYSIS';
  alert?: { type: string; message: string };
  warning?: { message: string; showBanner: boolean };
  confidence?: number;
  showWarning?: boolean;
  warningMessage?: string | null;
  data?: any;
  rawData?: any;
}

export const handleAnalysisResult = (analysis: any): AnalysisUIState => {
  // System / parse errors
  if (
    analysis.edge_case === 'parse_error' ||
    analysis.edge_case === 'system_error' ||
    analysis.edge_case === 'invalid_structure'
  ) {
    return {
      status: 'error',
      severity: 'critical',
      title: 'System Error',
      message: analysis.error || 'Analysis failed',
      guidance: analysis.user_guidance,
      icon: '⚠️',
      allowRetry: true,
      action: 'RETRY_ANALYSIS',
      rawData: analysis,
    };
  }

  // Critical failures
  if (analysis.success === false) {
    const edgeMessages: Record<string, { title: string; icon: string; tips: string[] }> = {
      wrong_subject: {
        title: 'Not a Retail Shelf',
        icon: '❌',
        tips: [
          'Point camera at supermarket shelf',
          'Make sure products are visible',
          'Take photo from front of shelf',
        ],
      },
      poor_quality: {
        title: 'Photo Quality Too Low',
        icon: '📸',
        tips: [
          'Hold phone steady',
          'Ensure good lighting',
          'Get closer to shelf',
          'Clean camera lens',
        ],
      },
      wrong_orientation: {
        title: 'Incorrect Photo Angle',
        icon: '🔄',
        tips: [
          'Hold phone horizontally',
          'Face shelf directly',
          'Keep phone level',
        ],
      },
      wrong_category: {
        title: 'Wrong Product Section',
        icon: '⚠️',
        tips: [],
      },
    };

    const edgeConfig = edgeMessages[analysis.edge_case] || {
      title: 'Analysis Failed',
      icon: '❌',
      tips: [],
    };

    return {
      status: 'error',
      severity: 'critical',
      title: edgeConfig.title,
      message: analysis.error,
      guidance: analysis.user_guidance,
      icon: edgeConfig.icon,
      showTips: edgeConfig.tips.length > 0,
      tips: edgeConfig.tips,
      allowRetry: true,
      action: 'RETAKE_PHOTO',
      rawData: analysis,
    };
  }

  // Success with edge cases
  if (analysis.success === true && analysis.edge_case) {
    if (analysis.edge_case === 'empty_shelf') {
      return {
        status: 'success_with_alert',
        severity: 'urgent',
        title: '🚨 Empty Shelf',
        message: 'Shelf section completely empty',
        alert: { type: 'urgent', message: 'Immediate restocking required' },
        data: analysis,
        action: 'SHOW_RESULTS',
        allowExport: true,
      };
    }

    if (analysis.edge_case === 'brand_not_found') {
      return {
        status: 'success_with_alert',
        severity: 'urgent',
        title: '🚫 Product Not Found',
        message: 'Target product not visible on shelf',
        alert: { type: 'urgent', message: 'Stock-out detected' },
        data: analysis,
        action: 'SHOW_RESULTS',
        allowExport: true,
      };
    }

    if (analysis.edge_case === 'low_confidence') {
      return {
        status: 'success_with_warning',
        severity: 'warning',
        title: '⚠️ Low Confidence',
        message: `Analysis confidence: ${analysis.confidence}%`,
        warning: {
          message: 'Photo quality affected accuracy. Consider retaking.',
          showBanner: true,
        },
        data: analysis,
        action: 'SHOW_RESULTS_WITH_WARNING',
        suggestRetake: true,
        allowExport: true,
      };
    }
  }

  // Clean success
  if (analysis.success === true) {
    const confidence = analysis.confidence || 0;
    return {
      status: 'success',
      severity: 'success',
      title: '✓ Analysis Complete',
      icon: '✓',
      confidence,
      data: analysis,
      action: 'SHOW_RESULTS',
      allowExport: true,
      showWarning: confidence < 70,
      warningMessage: confidence < 70 ? `Low confidence: ${confidence}%` : null,
    };
  }

  // Fallback
  return {
    status: 'error',
    severity: 'critical',
    title: 'Unexpected Response',
    message: 'Unable to process analysis',
    action: 'RETRY_ANALYSIS',
    rawData: analysis,
  };
};

/**
 * Unwraps the n8n webhook envelope:
 * response[0].data[0].output[0].content[0].text  →  JSON string  →  analysis object
 * Also maps detailed_analysis → manager_report if manager_report is absent.
 */
export const parseWebhookResponse = (raw: any): any => {
  // Unwrap n8n envelope if present
  let analysis = raw;

  try {
    if (Array.isArray(raw)) {
      const d0 = raw[0]?.data?.[0];
      const text =
        // format A: data[0].output[0].content[0].text
        raw[0]?.data?.[0]?.output?.[0]?.content?.[0]?.text ??
        // format B: data[0].content.parts[0].text  (Google Gemini envelope)
        d0?.content?.parts?.[0]?.text ??
        // format C: data[0].content[0].text  (content is array)
        (Array.isArray(d0?.content) ? d0.content.find((c: any) => c.type === 'text' || typeof c.text === 'string')?.text : undefined) ??
        // format D: data[0].text
        d0?.text ??
        // format E: data[0].output  (plain string)
        (typeof d0?.output === 'string' ? d0.output : undefined) ??
        // format F: raw[0] itself is a string
        (typeof raw[0] === 'string' ? raw[0] : undefined);

      if (typeof text === 'string') {
        const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        analysis = JSON.parse(cleaned);
      } else if (d0 && typeof d0 === 'object' && ('success' in d0 || 'merchandiser_report' in d0)) {
        // format G: data[0] is already the parsed object
        analysis = d0;
      }
    }
    // Direct object with text field
    else if (typeof raw?.text === 'string') {
      const cleaned = raw.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      analysis = JSON.parse(cleaned);
    }
    // Already a plain object — use as-is
  } catch {
    return {
      edge_case: 'parse_error',
      error: 'Could not parse AI response',
      user_guidance: 'Please try again',
    };
  }

  // Map detailed_analysis → manager_report if missing
  if (analysis?.detailed_analysis && !analysis?.manager_report) {
    const d = analysis.detailed_analysis;
    const pc = d.product_count ?? {};
    const ss = d.shelf_space_analysis ?? {};
    const ca = d.competitor_analysis ?? {};
    const sa = d.stock_availability ?? {};
    const sv = d.sku_variety ?? {};
    const pr = d.pricing ?? {};
    const pl = d.planogram_compliance ?? {};
    const io = d.issues_and_opportunities ?? {};
    const ci = d.competitive_insights ?? {};

    analysis.manager_report = {
      facings: {
        total: pc.total_facings ?? 0,
        top:    pc.by_shelf_level?.top    ?? 0,
        middle: pc.by_shelf_level?.middle ?? 0,
        bottom: pc.by_shelf_level?.bottom ?? 0,
      },
      shelf_percentage:    ss.brand_percentage ?? 0,
      shelf_position:      ss.positioning_quality ?? '—',
      stock_status:        sa.status ?? 'Unknown',
      competitors:         (ca.competitors ?? []).map((c: any) => ({
        name:             c.name,
        facings:          c.facings,
        percentage:       c.shelf_percentage,
      })),
      sku_count:           sv.sku_count ?? 0,
      skus:                sv.flavors_identified ?? [],
      price:               pr.brand_prices?.[0]?.price ?? '—',
      competitor_prices:   (pr.competitor_comparison ?? []).map((c: any) => ({
        brand: c.brand,
        price: c.price,
      })),
      compliance_score:    pl.execution_score ?? '—',
      issues:              io.problems ?? [],
      recommendations:     io.improvements ?? [],
      competitive_position: ci.competitive_position ?? '—',
      biggest_threat:      ci.biggest_threat ?? '—',
      // Pass through full detail for extended rendering
      detailed_analysis:   d,
    };
  }

  return analysis;
};

export const callAnalysisWebhook = async (
  photoUrl: string,
  targetBrand: string,
  visitId: string,
  photoId: string,
  outletName: string,
  outletId: string
): Promise<AnalysisUIState> => {
  try {
    const response = await fetch(
      'https://taxautomation.app.n8n.cloud/webhook/shelf-analysis',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: photoUrl,
          target_brand: targetBrand,
          visit_id: visitId,
          photo_id: photoId,
          outlet_name: outletName,
          outlet_id: outletId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const raw = await response.json();
    const result = parseWebhookResponse(raw);
    return handleAnalysisResult(result);
  } catch (error: any) {
    return {
      status: 'error',
      severity: 'critical',
      title: 'Connection Error',
      message: 'Unable to connect to analysis service',
      guidance: error.message,
      icon: '⚠️',
      allowRetry: true,
      action: 'RETRY_ANALYSIS',
    };
  }
};
