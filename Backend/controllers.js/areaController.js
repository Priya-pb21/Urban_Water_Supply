const pool = require('../config/db');
const { auditLog } = require('../middleware/audit');

const PRIORITY_TO_NUMBER = {
  high: 9,
  medium: 5,
  low: 2,
};

// GET /api/areas
const getAllAreas = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.name AS manager_name, u.email AS manager_email
      FROM areas a
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.is_active = TRUE
      ORDER BY a.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /api/areas/all - all saved locations for map rendering
const getAllLocations = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id, a.name, a.description, a.address, a.latitude, a.longitude,
        a.area_type, a.priority_level, a.daily_demand_kl, a.manager_id,
        a.created_at, a.updated_at,
        COALESCE(SUM(d.quantity) FILTER (WHERE DATE(d.timestamp) = CURRENT_DATE), 0) AS total_demand,
        COALESCE(SUM(al.allocated_water) FILTER (WHERE DATE(al.timestamp) = CURRENT_DATE), 0) AS total_allocated
      FROM areas a
      LEFT JOIN demand d ON a.id = d.area_id
      LEFT JOIN allocation al ON a.id = al.area_id
      WHERE a.is_active = TRUE
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /api/areas/:id
const getAreaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*, u.name AS manager_name
      FROM areas a
      LEFT JOIN users u ON a.manager_id = u.id
      WHERE a.id = $1 AND a.is_active = TRUE
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Area not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /api/areas (admin only)
const createArea = async (req, res, next) => {
  try {
    const { name, description, latitude, longitude, area_type, manager_id } = req.body;
    const result = await pool.query(
      `INSERT INTO areas (name, description, latitude, longitude, area_type, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, latitude, longitude, area_type || 'residential', manager_id || null]
    );
    await auditLog('CREATE_AREA', 'areas', result.rows[0].id, req.user.id, null, result.rows[0], req.ip);
    res.status(201).json({ success: true, message: 'Area created', data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /api/areas/add-location
const addLocation = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      name,
      latitude,
      longitude,
      address,
      type,
      priority,
      daily_demand_kl,
    } = req.body;

    const areaType = type || 'residential';
    const priorityLevel = (priority || 'medium').toLowerCase();
    const dailyDemand = Number(daily_demand_kl || 0);

    await client.query('BEGIN');

    const areaResult = await client.query(
      `INSERT INTO areas
         (name, description, address, latitude, longitude, area_type, priority_level, daily_demand_kl, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        address || null,
        address || null,
        latitude,
        longitude,
        areaType,
        priorityLevel,
        dailyDemand,
        req.user?.role === 'area_manager' ? req.user.id : null,
      ]
    );

    const area = areaResult.rows[0];

    if (dailyDemand > 0) {
      await client.query(
        `INSERT INTO demand (area_id, quantity, priority, notes, requested_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          area.id,
          dailyDemand,
          PRIORITY_TO_NUMBER[priorityLevel] || 5,
          'Auto-created from map location daily demand',
          req.user?.id || null,
        ]
      );
    }

    await client.query('COMMIT');

    await auditLog('ADD_LOCATION', 'areas', area.id, req.user?.id || null, null, area, req.ip);
    res.status(201).json({ success: true, message: 'Location added', data: area });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

// PUT /api/areas/:id (admin only)
const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, latitude, longitude, area_type, manager_id } = req.body;

    const old = await pool.query('SELECT * FROM areas WHERE id = $1', [id]);
    if (!old.rows[0]) return res.status(404).json({ success: false, message: 'Area not found' });

    const result = await pool.query(
      `UPDATE areas SET name=$1, description=$2, latitude=$3, longitude=$4,
       area_type=$5, manager_id=$6 WHERE id=$7 RETURNING *`,
      [name, description, latitude, longitude, area_type, manager_id, id]
    );
    await auditLog('UPDATE_AREA', 'areas', id, req.user.id, old.rows[0], result.rows[0], req.ip);
    res.json({ success: true, message: 'Area updated', data: result.rows[0] });
  } catch (err) { next(err); }
};

// DELETE /api/areas/:id (admin only)
const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE areas SET is_active = FALSE WHERE id = $1', [id]);
    await auditLog('DELETE_AREA', 'areas', id, req.user.id, null, null, req.ip);
    res.json({ success: true, message: 'Area deactivated' });
  } catch (err) { next(err); }
};

// GET /api/areas/map/data - returns geospatial data for map
const getMapData = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id, a.name, a.address, a.latitude, a.longitude, a.area_type,
        a.priority_level, a.daily_demand_kl,
        COALESCE(SUM(d.quantity), 0) AS total_demand,
        COALESCE(SUM(al.allocated_water), 0) AS total_allocated,
        CASE
          WHEN COALESCE(SUM(al.allocated_water), 0) = 0 THEN 'no_data'
          WHEN COALESCE(SUM(al.allocated_water), 0) >= COALESCE(SUM(d.quantity), 0) THEN 'sufficient'
          WHEN COALESCE(SUM(al.allocated_water), 0) >= COALESCE(SUM(d.quantity), 0) * 0.6 THEN 'moderate'
          ELSE 'shortage'
        END AS supply_status
      FROM areas a
      LEFT JOIN demand d ON a.id = d.area_id AND d.timestamp >= CURRENT_DATE
      LEFT JOIN allocation al ON a.id = al.area_id AND al.timestamp >= CURRENT_DATE
      WHERE a.is_active = TRUE
      GROUP BY a.id, a.name, a.address, a.latitude, a.longitude, a.area_type, a.priority_level, a.daily_demand_kl
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

module.exports = {
  getAllAreas,
  getAllLocations,
  getAreaById,
  createArea,
  addLocation,
  updateArea,
  deleteArea,
  getMapData,
};
