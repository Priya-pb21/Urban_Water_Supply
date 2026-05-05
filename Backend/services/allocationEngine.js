/**
 * ============================================================
 * WATER ALLOCATION ENGINE
 * Smart conflict resolver for urban water distribution
 * ============================================================
 *
 * Algorithm:
 * 1. Sort all demands by priority (DESC), then quantity (ASC)
 * 2. Allocate water to high-priority areas first (greedy)
 * 3. If all high-priority demands are met, distribute remaining
 *    water to lower-priority areas proportionally
 * 4. Generate a human-readable reason for every allocation
 * ============================================================
 */

const PRIORITY_LABELS = {
  10: 'Critical (Hospital/Emergency)',
  9:  'Critical',
  8:  'Very High',
  7:  'High',
  6:  'Above Average',
  5:  'Medium',
  4:  'Below Average',
  3:  'Low',
  2:  'Very Low',
  1:  'Minimal',
};

const AREA_TYPE_PRIORITY_BOOST = {
  hospital:    2,
  government:  1,
  school:      1,
  residential: 0,
  commercial:  0,
  industrial: -1,
};

/**
 * Main allocation function
 * @param {number} totalSupply - Total available water (in kilolitres)
 * @param {Array}  demands     - Array of demand objects from DB
 * @returns {Object} { allocations, summary, conflictResolved }
 */
function allocateWater(totalSupply, demands) {
  if (!demands || demands.length === 0) {
    return { allocations: [], summary: buildSummary(totalSupply, 0, []), conflictResolved: false };
  }

  const totalDemand = demands.reduce((sum, d) => sum + parseFloat(d.quantity), 0);
  const isConflict = totalDemand > totalSupply;

  // Effective priority = stated priority + area type boost
  const enriched = demands.map((d) => ({
    ...d,
    quantity: parseFloat(d.quantity),
    effectivePriority: Math.min(10, parseInt(d.priority) + (AREA_TYPE_PRIORITY_BOOST[d.area_type] || 0)),
  }));

  // Sort: highest effective priority first; ties broken by quantity (lower = easier to fulfill)
  enriched.sort((a, b) =>
    b.effectivePriority - a.effectivePriority || a.quantity - b.quantity
  );

  let remaining = totalSupply;
  const allocations = [];

  if (!isConflict) {
    // ── No conflict: everyone gets full allocation ──
    for (const d of enriched) {
      allocations.push({
        demand_id:       d.id,
        area_id:         d.area_id,
        area_name:       d.area_name,
        demanded_water:  d.quantity,
        allocated_water: d.quantity,
        shortage:        0,
        status:          'fulfilled',
        reason:          buildReason(d, d.quantity, d.quantity, false, enriched.length, totalSupply, totalDemand),
      });
      remaining -= d.quantity;
    }
  } else {
    // ── Conflict: priority-first greedy allocation ──

    // Phase 1: full allocation for top-priority areas
    const fullyFunded = [];
    const deferred    = [];

    for (const d of enriched) {
      if (remaining >= d.quantity) {
        remaining -= d.quantity;
        fullyFunded.push(d);
      } else {
        deferred.push(d);
      }
    }

    for (const d of fullyFunded) {
      allocations.push({
        demand_id:       d.id,
        area_id:         d.area_id,
        area_name:       d.area_name,
        demanded_water:  d.quantity,
        allocated_water: d.quantity,
        shortage:        0,
        status:          'fulfilled',
        reason:          buildReason(d, d.quantity, d.quantity, true, enriched.length, totalSupply, totalDemand),
      });
    }

    // Phase 2: proportional distribution of leftover water to deferred areas
    if (deferred.length > 0 && remaining > 0) {
      const deferredTotalDemand = deferred.reduce((s, d) => s + d.quantity, 0);

      // Weight by effective priority within deferred pool
      const totalWeight = deferred.reduce((s, d) => s + d.effectivePriority, 0);

      for (const d of deferred) {
        const weight       = d.effectivePriority / totalWeight;
        const allocated    = parseFloat((remaining * weight).toFixed(2));
        const shortage     = parseFloat((d.quantity - allocated).toFixed(2));

        allocations.push({
          demand_id:       d.id,
          area_id:         d.area_id,
          area_name:       d.area_name,
          demanded_water:  d.quantity,
          allocated_water: allocated,
          shortage:        shortage,
          status:          'shortage',
          reason:          buildReason(d, d.quantity, allocated, true, enriched.length, totalSupply, totalDemand, {
            deferredTotalDemand,
            remaining,
            totalWeight,
            weight,
          }),
        });
      }
    } else if (deferred.length > 0) {
      // No water left at all
      for (const d of deferred) {
        allocations.push({
          demand_id:       d.id,
          area_id:         d.area_id,
          area_name:       d.area_name,
          demanded_water:  d.quantity,
          allocated_water: 0,
          shortage:        d.quantity,
          status:          'shortage',
          reason:          `Area "${d.area_name}" received no allocation. Total water supply (${totalSupply.toFixed(2)} KL) was fully consumed by ${fullyFunded.length} higher-priority area(s). Priority level: ${PRIORITY_LABELS[d.priority] || d.priority}.`,
        });
      }
    }
  }

  return {
    allocations,
    summary:         buildSummary(totalSupply, totalDemand, allocations),
    conflictResolved: isConflict,
  };
}

function buildReason(d, demanded, allocated, isConflict, totalAreas, totalSupply, totalDemand, extra = {}) {
  const priorityLabel = PRIORITY_LABELS[d.effectivePriority] || `Priority ${d.effectivePriority}`;
  const fulfilled     = allocated >= demanded;

  if (!isConflict) {
    return `Area "${d.area_name}" received its full requested allocation of ${allocated.toFixed(2)} KL. ` +
           `Total supply (${totalSupply.toFixed(2)} KL) is sufficient to meet all ${totalAreas} area demands ` +
           `(${totalDemand.toFixed(2)} KL total). Priority: ${priorityLabel}.`;
  }

  if (fulfilled) {
    return `Area "${d.area_name}" received its full requested allocation of ${allocated.toFixed(2)} KL ` +
           `due to high priority (${priorityLabel}). Supply shortage exists system-wide ` +
           `(${totalDemand.toFixed(2)} KL demanded vs ${totalSupply.toFixed(2)} KL available). ` +
           `This area was prioritised in the conflict resolution process.`;
  }

  const pct = ((allocated / demanded) * 100).toFixed(1);
  return `Area "${d.area_name}" received a reduced allocation of ${allocated.toFixed(2)} KL ` +
         `(${pct}% of ${demanded.toFixed(2)} KL demanded) due to system-wide water shortage. ` +
         `Total demand (${totalDemand.toFixed(2)} KL) exceeds supply (${totalSupply.toFixed(2)} KL). ` +
         `This area's priority (${priorityLabel}) placed it in the proportional distribution pool ` +
         `after higher-priority zones were served. Shortage: ${(demanded - allocated).toFixed(2)} KL.`;
}

function buildSummary(totalSupply, totalDemand, allocations) {
  const totalAllocated = allocations.reduce((s, a) => s + a.allocated_water, 0);
  const totalShortage  = allocations.reduce((s, a) => s + a.shortage, 0);

  return {
    total_supply:    parseFloat(totalSupply.toFixed(2)),
    total_demand:    parseFloat(totalDemand.toFixed(2)),
    total_allocated: parseFloat(totalAllocated.toFixed(2)),
    total_shortage:  parseFloat(totalShortage.toFixed(2)),
    total_remaining: parseFloat((totalSupply - totalAllocated).toFixed(2)),
    areas_fulfilled: allocations.filter((a) => a.status === 'fulfilled').length,
    areas_shortage:  allocations.filter((a) => a.status === 'shortage').length,
    conflict:        totalDemand > totalSupply,
    efficiency_pct:  totalDemand > 0
      ? parseFloat(((totalAllocated / totalDemand) * 100).toFixed(1))
      : 100,
  };
}

module.exports = { allocateWater };