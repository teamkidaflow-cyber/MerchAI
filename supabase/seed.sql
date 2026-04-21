-- SAMPLE SEED DATA
-- NOTE: You must create auth users first via Supabase Dashboard

-- 1. Sample Outlets (Kenyan Retail)
INSERT INTO public.outlets (outlet_id, name, location, region, status) VALUES
('OUT-001', 'Nakumatt Junction', 'Ngong Road, Nairobi', 'Nairobi Central', 'active'),
('OUT-002', 'Carrefour Sarit', 'Westlands, Nairobi', 'Nairobi West', 'active'),
('OUT-003', 'Tuskys Adams', 'Adams Arcade, Nairobi', 'Nairobi Central', 'active'),
('OUT-004', 'Naivas Westlands', 'Westlands, Nairobi', 'Nairobi West', 'active'),
('OUT-005', 'QuickMart Lavington', 'Lavington, Nairobi', 'Nairobi South', 'active');

-- 2. Sample Products
INSERT INTO public.products (brand, name, sku, pack_size) VALUES
('Melvins Tea', 'Melvins Green Tea', 'SKU-001', '50g'),
('Melvins Tea', 'Melvins Green Tea', 'SKU-002', '100g'),
('Melvins Tea', 'Melvins Green Tea', 'SKU-003', '250g'),
('Ketepa', 'Ketepa Pride Tea', 'COMP-001', '100g'),
('Brookside', 'Brookside Dairy', 'COMP-002', '500ml');

-- 3. NOTE: After creating auth users, add them to the users table:
-- INSERT INTO public.users (id, email, name, role, phone) 
-- VALUES (auth_user_id, 'user@example.com', 'User Name', 'merchandiser', '+254700000000');

-- 4. Sample analysis data structure for reference (not inserted directly)
-- When photos are uploaded and analyzed, they get this structure in analysis_result:
/*
MERCHANDISER REPORT:
{
  "status": "needs_work|good|urgent",
  "facings": 18,
  "shelf_percentage": 24,
  "stock_status": "Low|Medium|High",
  "price": "KES 85",
  "competitors": [
    { "name": "Ketepa", "facings": 32, "percentage": 45 },
    { "name": "Brookside", "facings": 15, "percentage": 21 }
  ],
  "action_items": ["Action 1", "Action 2", "Action 3"],
  "issues": ["Issue 1", "Issue 2"]
}

MANAGER REPORT:
{
  "facings": { "total": 18, "top": 6, "middle": 7, "bottom": 5 },
  "shelf_percentage": 24,
  "shelf_position": "Eye-level center",
  "stock_status": "In Stock - Good depth",
  "sku_count": 3,
  "skus": ["50g", "100g", "250g"],
  "price": "KES 85",
  "compliance_score": "Good|High|Low",
  "issues": ["Issue 1", "Issue 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "competitive_position": "1st|2nd|3rd place",
  "biggest_threat": "Competitor Name"
}
*/

