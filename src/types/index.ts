export type UserRole = 'merchandiser' | 'manager';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  created_at: string;
}

export interface Outlet {
  id: string;
  outlet_id: string;
  name: string;
  location?: string;
  region?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Visit {
  id: string;
  outlet_id: string;
  user_id: string;
  visit_date: string;
  visit_time: string;
  created_at: string;
  outlet?: Outlet;
  user?: User;
}

export type AnalysisStatus = 'pending' | 'analyzing' | 'complete' | 'failed';

export interface CompetitorData {
  name: string;
  facings: number;
  percentage?: number;
  price?: string;
}

export interface MerchandiserReport {
  status: 'good' | 'needs_work' | 'urgent';
  facings: number;
  shelf_percentage: number;
  stock_status: string;
  price: string;
  competitors: CompetitorData[];
  action_items: string[];
  issues: string[];
}

export interface ManagerReport {
  facings: {
    total: number;
    top: number;
    middle: number;
    bottom: number;
  };
  shelf_percentage: number;
  shelf_position: string;
  stock_status: string;
  competitors: CompetitorData[];
  sku_count: number;
  skus: string[];
  price: string;
  competitor_prices: { brand: string; price: string }[];
  compliance_score: string;
  issues: string[];
  recommendations: string[];
  competitive_position: string;
  biggest_threat: string;
}

export interface Photo {
  id: string;
  visit_id: string;
  photo_url: string;
  analysis_status: AnalysisStatus;
  analysis_result: {
    success: boolean;
    confidence: number;
    merchandiser_report: MerchandiserReport;
    manager_report: ManagerReport;
    error?: string;
  } | null;
  confidence_score: number | null;
  uploaded_at: string;
  analyzed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  read: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  brand: string;
  sku: string;
  name: string;
  pack_size: string;
  image_url: string;
  created_at: string;
}
