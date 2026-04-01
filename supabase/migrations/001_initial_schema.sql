-- offer概率判别器 - 初始数据库Schema
-- 运行方式: 在Supabase Dashboard → SQL Editor中执行

-- 机构表
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 用户资料表（扩展Supabase Auth）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'consultant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 历史offer数据表
CREATE TABLE IF NOT EXISTS offer_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  uploaded_by UUID REFERENCES profiles(id),
  student_name TEXT,
  undergraduate_school TEXT NOT NULL,
  undergraduate_major TEXT NOT NULL,
  gpa NUMERIC(5,2) NOT NULL,
  gpa_scale TEXT NOT NULL DEFAULT '4.0' CHECK (gpa_scale IN ('4.0', '5.0', '100')),
  language_type TEXT NOT NULL CHECK (language_type IN ('IELTS', 'TOEFL')),
  language_score NUMERIC(5,1) NOT NULL,
  gre_gmat_score NUMERIC(5,0),
  target_school TEXT NOT NULL,
  target_major TEXT NOT NULL,
  target_degree TEXT NOT NULL CHECK (target_degree IN ('bachelor', 'master', 'phd')),
  application_year INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('admitted', 'rejected', 'waitlisted', 'withdrawn')),
  background_tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 查询记录表
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  consultant_id UUID NOT NULL REFERENCES profiles(id),
  input_data JSONB NOT NULL,
  probability NUMERIC(5,2),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low', 'insufficient')),
  similar_cases JSONB,
  result_summary TEXT,
  data_basis TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 字段映射规则表
CREATE TABLE IF NOT EXISTS field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  file_hash TEXT,
  mapping_rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_offer_records_tenant ON offer_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offer_records_school ON offer_records(tenant_id, target_school, target_major);
CREATE INDEX IF NOT EXISTS idx_queries_consultant ON queries(tenant_id, consultant_id);
CREATE INDEX IF NOT EXISTS idx_queries_created ON queries(consultant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);

-- 启用RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- RLS策略：profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can read profiles in same tenant" ON profiles
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (true)
  WITH CHECK (true);

-- RLS策略：offer_records
CREATE POLICY "Users can read own tenant records" ON offer_records
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can insert records" ON offer_records
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS策略：queries
CREATE POLICY "Users can read own tenant queries" ON queries
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own queries" ON queries
  FOR INSERT WITH CHECK (
    consultant_id = auth.uid()
    AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- RLS策略：field_mappings
CREATE POLICY "Admins can manage field mappings" ON field_mappings
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS策略：tenants（通过profiles间接访问）
CREATE POLICY "Users can read own tenant" ON tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
