-- ============================================
-- Urban Water Supply DB Schema (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'area_manager', 'user')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AREAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  latitude    DECIMAL(10, 8) NOT NULL,
  longitude   DECIMAL(11, 8) NOT NULL,
  area_type   VARCHAR(50) DEFAULT 'residential'
                CHECK (area_type IN ('hospital', 'residential', 'commercial', 'industrial', 'school', 'government')),
  manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DEMAND TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demand (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id      UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  quantity     DECIMAL(12, 2) NOT NULL CHECK (quantity > 0),
  priority     INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 10),
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'fulfilled', 'partial')),
  notes        TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUPPLY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS supply (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_water  DECIMAL(14, 2) NOT NULL CHECK (total_water > 0),
  available    DECIMAL(14, 2),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  time_slot    VARCHAR(20) NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'night', 'all_day')),
  source       VARCHAR(100),
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ALLOCATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS allocation (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id          UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  supply_id        UUID REFERENCES supply(id) ON DELETE SET NULL,
  demand_id        UUID REFERENCES demand(id) ON DELETE SET NULL,
  allocated_water  DECIMAL(12, 2) NOT NULL CHECK (allocated_water >= 0),
  demanded_water   DECIMAL(12, 2),
  shortage         DECIMAL(12, 2) DEFAULT 0,
  reason           TEXT NOT NULL,
  status           VARCHAR(20) DEFAULT 'allocated'
                    CHECK (status IN ('allocated', 'shortage', 'fulfilled', 'cancelled')),
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ISSUE REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS issue_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id       UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  reported_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  issue_type    VARCHAR(50) NOT NULL CHECK (issue_type IN ('no_supply', 'leakage', 'water_breakout', 'contamination', 'low_pressure', 'other')),
  description   TEXT NOT NULL,
  severity      VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status        VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMP,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'issue_reports_issue_type_check'
  ) THEN
    ALTER TABLE issue_reports DROP CONSTRAINT issue_reports_issue_type_check;
  END IF;

  ALTER TABLE issue_reports
    ADD CONSTRAINT issue_reports_issue_type_check
    CHECK (issue_type IN ('no_supply', 'leakage', 'water_breakout', 'contamination', 'low_pressure', 'other'));
END;
$$;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('issue', 'allocation', 'alert')),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(50) NOT NULL,
  entity_id   UUID,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_demand_area_id ON demand(area_id);
CREATE INDEX IF NOT EXISTS idx_demand_timestamp ON demand(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_allocation_area_id ON allocation(area_id);
CREATE INDEX IF NOT EXISTS idx_allocation_timestamp ON allocation(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_supply_date ON supply(date DESC);
CREATE INDEX IF NOT EXISTS idx_issue_area_id ON issue_reports(area_id);
CREATE INDEX IF NOT EXISTS idx_issue_status ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- ============================================
-- TRIGGERS: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_areas_updated_at ON areas;
CREATE TRIGGER trg_areas_updated_at
  BEFORE UPDATE ON areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_issues_updated_at ON issue_reports;
CREATE TRIGGER trg_issues_updated_at
  BEFORE UPDATE ON issue_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Default Admin User (password: Admin@123)
INSERT INTO users (name, email, password, role) VALUES
('System Admin', 'admin@waterms.com', '$2a$12$7FbZndjMYBv4ewIdxoUE4efzmJMengCisC/XWZrYqH5q1H/rNGoUi', 'admin')
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = TRUE;
