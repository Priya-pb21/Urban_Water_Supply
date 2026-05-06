-- ============================================
-- Urban Water Supply DB Schema (PostgreSQL)
-- AquaResolve - Complete Schema with Auth
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
  avatar_url  VARCHAR(500),
  phone       VARCHAR(20),
  last_login  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- REFRESH TOKENS TABLE (JWT Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  is_revoked  BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  is_used     BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOGIN ATTEMPTS TABLE (Brute Force Protection)
-- ============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(150) NOT NULL,
  ip_address   VARCHAR(45),
  success      BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AREAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS areas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  address         TEXT,
  latitude        DECIMAL(10, 8) NOT NULL,
  longitude       DECIMAL(11, 8) NOT NULL,
  area_type       VARCHAR(50) DEFAULT 'residential'
                    CHECK (area_type IN (
                      'hospital', 'residential', 'commercial',
                      'industrial', 'school', 'government'
                    )),
  priority_level  VARCHAR(20) DEFAULT 'medium'
                    CHECK (priority_level IN ('high', 'medium', 'low')),
  daily_demand_kl DECIMAL(12, 2) DEFAULT 0 CHECK (daily_demand_kl >= 0),
  population      INTEGER DEFAULT 0,
  manager_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DEMAND TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demand (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id      UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  quantity     DECIMAL(12, 2) NOT NULL CHECK (quantity > 0),
  priority     INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 10),
  status       VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending', 'processed', 'fulfilled', 'partial')),
  notes        TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUPPLY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS supply (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_water DECIMAL(14, 2) NOT NULL CHECK (total_water > 0),
  available   DECIMAL(14, 2),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  time_slot   VARCHAR(20) NOT NULL
                CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'night', 'all_day')),
  source      VARCHAR(100),
  notes       TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id      UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  reported_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  issue_type   VARCHAR(50) NOT NULL
                CHECK (issue_type IN (
                  'no_supply', 'leakage', 'water_breakout',
                  'contamination', 'low_pressure', 'other'
                )),
  description  TEXT NOT NULL,
  severity     VARCHAR(20) DEFAULT 'medium'
                CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status       VARCHAR(20) DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  image_url    VARCHAR(500),
  resolved_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(20) NOT NULL
                CHECK (type IN ('issue', 'allocation', 'alert', 'system')),
  link        VARCHAR(500),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action       VARCHAR(100) NOT NULL,
  entity       VARCHAR(50) NOT NULL,
  entity_id    UUID,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ============================================
-- PRIORITY TABLE (defines area type priority)
-- ============================================
CREATE TABLE IF NOT EXISTS area_priorities (
  id SERIAL PRIMARY KEY,
  area_type VARCHAR(50) NOT NULL UNIQUE,  -- 'hospital', 'fire_station', 'industry', 'residential'
  priority_rank INT NOT NULL,             -- 1 = highest priority
  description TEXT
);

INSERT INTO area_priorities (area_type, priority_rank, description) VALUES
  ('hospital',      1, 'Medical facilities - critical'),
  ('fire_station',  2, 'Emergency services'),
  ('industry',      3, 'Industrial zones'),
  ('residential',   4, 'Residential areas');

-- ============================================
-- CREDITS TABLE (each area has a credit score)
-- ============================================
-- NEW (correct type)
CREATE TABLE IF NOT EXISTS area_credits (
  id SERIAL PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 50 CHECK (credits BETWEEN 10 AND 100),
  last_updated TIMESTAMP DEFAULT NOW()
);

ALTER TABLE area_credits ADD CONSTRAINT unique_area_credits UNIQUE (area_id);
CREATE INDEX IF NOT EXISTS idx_area_credits_area_id ON area_credits(area_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_area_credits_area_id ON area_credits(area_id);

-- ============================================
-- Add area_type column to your areas table
-- (if not already present)
-- ============================================
ALTER TABLE areas ADD COLUMN IF NOT EXISTS area_type VARCHAR(50) DEFAULT 'residential';
ALTER TABLE areas ADD CONSTRAINT fk_area_type
  FOREIGN KEY (area_type) REFERENCES area_priorities(area_type);

-- ============================================
-- ALLOCATION LOG TABLE (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS allocation_log (
  id SERIAL PRIMARY KEY,
  run_at TIMESTAMP DEFAULT NOW(),
  total_supply NUMERIC(12,2),
  total_demand NUMERIC(12,2),
  mode VARCHAR(20),  -- 'surplus' or 'deficit'
  surplus_amount NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS  allocation_log_items (
  id SERIAL PRIMARY KEY,
  log_id INT REFERENCES allocation_log(id) ON DELETE CASCADE,
  area_id INT REFERENCES areas(id),
  area_name VARCHAR(100),
  area_type VARCHAR(50),
  priority_rank INT,
  credits INT,
  demanded NUMERIC(12,2),
  allocated NUMERIC(12,2),
  fully_satisfied BOOLEAN
);
-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);

-- Refresh Tokens
CREATE INDEX IF NOT EXISTS idx_refresh_token     ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_user_id   ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_expires   ON refresh_tokens(expires_at);

-- Password Resets
CREATE INDEX IF NOT EXISTS idx_reset_token       ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_reset_user_id     ON password_resets(user_id);

-- Login Attempts
CREATE INDEX IF NOT EXISTS idx_login_email       ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_ip          ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempted   ON login_attempts(attempted_at DESC);

-- Areas
CREATE INDEX IF NOT EXISTS idx_areas_type        ON areas(area_type);
CREATE INDEX IF NOT EXISTS idx_areas_priority    ON areas(priority_level);
CREATE INDEX IF NOT EXISTS idx_areas_manager     ON areas(manager_id);

-- Demand
CREATE INDEX IF NOT EXISTS idx_demand_area_id    ON demand(area_id);
CREATE INDEX IF NOT EXISTS idx_demand_timestamp  ON demand(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_demand_status     ON demand(status);

-- Supply
CREATE INDEX IF NOT EXISTS idx_supply_date       ON supply(date DESC);
CREATE INDEX IF NOT EXISTS idx_supply_time_slot  ON supply(time_slot);

-- Allocation
CREATE INDEX IF NOT EXISTS idx_alloc_area_id     ON allocation(area_id);
CREATE INDEX IF NOT EXISTS idx_alloc_supply_id   ON allocation(supply_id);
CREATE INDEX IF NOT EXISTS idx_alloc_timestamp   ON allocation(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alloc_status      ON allocation(status);

-- Issues
CREATE INDEX IF NOT EXISTS idx_issue_area_id     ON issue_reports(area_id);
CREATE INDEX IF NOT EXISTS idx_issue_status      ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_severity    ON issue_reports(severity);
CREATE INDEX IF NOT EXISTS idx_issue_created     ON issue_reports(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notif_user_id     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read     ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created     ON notifications(created_at DESC);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_entity      ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_performer   ON audit_logs(performed_by);

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
-- TRIGGER: Track last_login on token creation
-- ============================================
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_track_last_login ON refresh_tokens;
CREATE TRIGGER trg_track_last_login
  AFTER INSERT ON refresh_tokens
  FOR EACH ROW EXECUTE FUNCTION update_last_login();

-- ============================================
-- TRIGGER: Auto-cleanup expired tokens (optional)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < CURRENT_TIMESTAMP AND is_revoked = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA
-- ============================================

-- Default Admin User
-- Email: admin@waterms.com | Password: Admin@123
INSERT INTO users (name, email, password, role) VALUES
(
  'System Admin',
  'admin@waterms.com',
  '$2a$12$7FbZndjMYBv4ewIdxoUE4efzmJMengCisC/XWZrYqH5q1H/rNGoUi',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET
  password   = EXCLUDED.password,
  role       = EXCLUDED.role,
  is_active  = TRUE;

-- Default Area Manager
-- Email: manager@waterms.com | Password: Manager@123
INSERT INTO users (name, email, password, role) VALUES
(
  'Area Manager',
  'manager@waterms.com',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'area_manager'
)
ON CONFLICT (email) DO NOTHING;

-- Sample Areas (Mysuru, Karnataka based on your location)
-- INSERT INTO areas (name, description, address, latitude, longitude, area_type, priority_level, daily_demand_kl, population)
-- VALUES
-- (
--   'KR Hospital',
--   'Krishnarajendra Government Hospital - Main City Hospital',
--   'Irwin Road, Mysuru, Karnataka 570001',
--   12.30518, 76.65487,
--   'hospital', 'high', 5000.00, 500
-- ),
-- (
--   'Jayadeva Hospital',
--   'Sri Jayadeva Institute of Cardiovascular Sciences',
--   'Bannimantap, Mysuru, Karnataka 570015',
--   12.29761, 76.62504,
--   'hospital', 'high', 3500.00, 300
-- ),
-- (
--   'Vijayanagar Residential Zone',
--   'Vijayanagar residential layout - high density area',
--   'Vijayanagar, Mysuru, Karnataka 570017',
--   12.32105, 76.61872,
--   'residential', 'medium', 12000.00, 15000
-- ),
-- (
--   'Mysuru City Market',
--   'Devaraja Market and commercial hub',
--   'Sayyaji Rao Road, Mysuru, Karnataka 570001',
--   12.30643, 76.65302,
--   'commercial', 'medium', 4000.00, 200
-- ),
-- (
--   'Mysuru DC Office',
--   'Deputy Commissioner Office - Government Zone',
--   'Nazarbad, Mysuru, Karnataka 570010',
--   12.30891, 76.65923,
--   'government', 'high', 1500.00, 100
-- ),
-- (
--   'BEML Township',
--   'BEML Industrial Township residential area',
--   'BEML Nagar, Mysuru, Karnataka 570016',
--   12.33784, 76.58912,
--   'industrial', 'medium', 8000.00, 8000
-- ),
-- (
--   'Vidyaranyapuram School Zone',
--   'Primary and secondary schools cluster',
--   'Vidyaranyapuram, Mysuru, Karnataka 570008',
--   12.31456, 76.63201,
--   'school', 'medium', 2500.00, 2000
-- )
-- ON CONFLICT DO NOTHING;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Dashboard summary view
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  (SELECT COALESCE(SUM(available), 0) FROM supply
   WHERE date = CURRENT_DATE)                          AS total_supply_today,
  (SELECT COALESCE(SUM(quantity), 0) FROM demand
   WHERE DATE(timestamp) = CURRENT_DATE)               AS total_demand_today,
  (SELECT COUNT(*) FROM areas
   WHERE is_active = TRUE)                             AS total_areas,
  (SELECT COUNT(*) FROM issue_reports
   WHERE status IN ('open', 'in_progress'))            AS open_issues,
  (SELECT COUNT(*) FROM allocation
   WHERE status = 'shortage'
   AND DATE(timestamp) = CURRENT_DATE)                 AS shortage_areas_today,
  (SELECT COUNT(*) FROM users
   WHERE is_active = TRUE)                             AS active_users;

-- Active areas with demand summary
CREATE OR REPLACE VIEW areas_with_demand AS
SELECT
  a.id,
  a.name,
  a.area_type,
  a.priority_level,
  a.daily_demand_kl,
  a.latitude,
  a.longitude,
  a.address,
  a.population,
  COALESCE(SUM(d.quantity), 0) AS total_requested,
  COUNT(d.id)                  AS demand_count,
  u.name                       AS manager_name
FROM areas a
LEFT JOIN demand d ON d.area_id = a.id
  AND DATE(d.timestamp) = CURRENT_DATE
LEFT JOIN users u ON u.id = a.manager_id
WHERE a.is_active = TRUE
GROUP BY a.id, u.name;

-- ============================================
-- END OF SCHEMA
-- ============================================