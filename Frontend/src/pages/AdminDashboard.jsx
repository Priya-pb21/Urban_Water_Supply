import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { API_BASE_URL, waterApi } from "../services/api";

// ── colour tokens ──────────────────────────────────────────────
const C = {
  teal:    "#0891b2",
  tealD:   "#0e7490",
  tealL:   "#06b6d4",
  sky:     "#38bdf8",
  amber:   "#f59e0b",
  rose:    "#f43f5e",
  emerald: "#10b981",
  violet:  "#8b5cf6",
  slate:   "#64748b",
  white:   "#ffffff",
};

// ── animated counter hook ──────────────────────────────────────
function useCounter(target, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return val;
}

// ── fake-but-realistic dataset ─────────────────────────────────
const weeklyTrend = [
  { day: "Mon", supply: 6800, demand: 12400, allocated: 6800 },
  { day: "Tue", supply: 7100, demand: 13100, allocated: 7100 },
  { day: "Wed", supply: 7200, demand: 13400, allocated: 7200 },
  { day: "Thu", supply: 6950, demand: 12800, allocated: 6950 },
  { day: "Fri", supply: 7400, demand: 14200, allocated: 7400 },
  { day: "Sat", supply: 7000, demand: 11900, allocated: 7000 },
  { day: "Sun", supply: 6600, demand: 11200, allocated: 6600 },
];

const areaAllocation = [
  { name: "KR Hospital",      allocated: 5000, demand: 5000, shortage: 0 },
  { name: "Jayadeva Hosp.",   allocated: 3200, demand: 3500, shortage: 300 },
  { name: "Vijayanagar",      allocated: 9800, demand: 12000, shortage: 2200 },
  { name: "City Market",      allocated: 3400, demand: 4000, shortage: 600 },
  { name: "DC Office",        allocated: 1500, demand: 1500, shortage: 0 },
  { name: "BEML Township",    allocated: 6200, demand: 8000, shortage: 1800 },
  { name: "School Zone",      allocated: 2500, demand: 2500, shortage: 0 },
];

const priorityMix = [
  { name: "High Priority",   value: 3, color: C.rose },
  { name: "Medium Priority", value: 3, color: C.amber },
  { name: "Low Priority",    value: 1, color: C.emerald },
];

const issueTypes = [
  { type: "No Supply",     count: 4, color: C.rose },
  { type: "Leakage",       count: 7, color: C.amber },
  { type: "Low Pressure",  count: 3, color: C.violet },
  { type: "Contamination", count: 1, color: C.teal },
  { type: "Other",         count: 2, color: C.slate },
];

const hourlyFlow = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  flow: Math.floor(180 + Math.sin((i / 24) * Math.PI * 2) * 80 + Math.random() * 40),
}));

const radarData = [
  { subject: "Hospitals",    A: 95, fullMark: 100 },
  { subject: "Residential",  A: 62, fullMark: 100 },
  { subject: "Commercial",   A: 71, fullMark: 100 },
  { subject: "Government",   A: 100, fullMark: 100 },
  { subject: "Industrial",   A: 58, fullMark: 100 },
  { subject: "Schools",      A: 88, fullMark: 100 },
];

// ── custom tooltip ─────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(8,145,178,0.2)",
      borderRadius: 12,
      padding: "10px 14px",
      fontSize: 12,
      boxShadow: "0 8px 24px rgba(8,145,178,0.12)",
    }}>
      <p style={{ fontWeight: 700, color: C.tealD, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <b>{Number(p.value).toLocaleString()}</b>
        </p>
      ))}
    </div>
  );
};

// ── stat card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, unit = "KL", sub, color, delay = 0, pulse = false }) {
  const counted = useCounter(typeof value === "number" ? value : 0);
  return (
    <div style={{
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(20px)",
      borderRadius: 20,
      padding: "22px 24px",
      border: `1px solid rgba(255,255,255,0.6)`,
      boxShadow: `0 4px 24px rgba(8,145,178,0.07)`,
      borderTop: `3px solid ${color}`,
      animation: `fadeUp 0.5s ease both`,
      animationDelay: `${delay}ms`,
      cursor: "default",
      transition: "transform 0.2s, box-shadow 0.2s",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(8,145,178,0.14)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 4px 24px rgba(8,145,178,0.07)`;
      }}
    >
      {/* bg glow */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 100, height: 100, borderRadius: "50%",
        background: color, opacity: 0.07,
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 12, color: C.slate, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {typeof value === "number" ? counted.toLocaleString() : value}
            {unit && <span style={{ fontSize: 14, fontWeight: 600, color: C.slate, marginLeft: 4 }}>{unit}</span>}
          </p>
          <p style={{ fontSize: 12, color: C.slate, marginTop: 6 }}>{sub}</p>
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
          ...(pulse ? { animation: "pulseIcon 2s ease-in-out infinite" } : {}),
        }}>{icon}</div>
      </div>
    </div>
  );
}

// ── section header ─────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(8,145,178,0.2), transparent)", marginLeft: 8 }} />
    </div>
  );
}

// ── chart card wrapper ─────────────────────────────────────────
function ChartCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(20px)",
      borderRadius: 20,
      padding: "22px 24px",
      border: "1px solid rgba(255,255,255,0.6)",
      boxShadow: "0 4px 24px rgba(8,145,178,0.07)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState({
    totalSupply: 72000,
    totalDemand: 0,
    shortageAreas: 3,
    openIssues: 17,
    activeAreas: 7,
  });

  const [totSupply, setTotSupply] = useState(750000);

  useEffect(() => {
      waterApi.dashboard()
        .then(response => {
          const data = response.data.data;
          console.log(data)
        const demandVal = data.today.demand.total_demand;
        const baseSupply = totSupply
          console.log(data.today.supply.total_supply)
          setTotSupply(baseSupply - demandVal);
          setStats({
            totalSupply: totSupply,
            totalDemand: data.today.demand.total_demand,
            shortageAreas: data.today.allocation.shortage_areas,
            openIssues: data.today.open_issues,
            activeAreas: 7,
          });
        })
        .catch(err => console.error("Failed to fetch stats:", err));
    }, []); // Empty array means "run once on mount"

    
const isDeficit = stats.totalDemand > totSupply;
const difference = Math.abs(totSupply - stats.totalDemand);
const efficiency = stats.totalDemand > 0
  ? ((totSupply / stats.totalDemand) * 100).toFixed(1)
  : "0.0";
const deficit = stats.totalDemand - totSupply;

  // Load conflict pins from localStorage (set by Map page)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("aqua_conflicts") || "[]");
      setConflicts(saved);
    } catch (_) {}
  }, []);

  return (
    <>
      {/* ── global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.12); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(8,145,178,0.25); border-radius: 99px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)",
        padding: "24px",
        animation: "fadeUp 0.4s ease both",
      }}>

        {/* ── page title ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
            System Overview
          </h1>
          <p style={{ fontSize: 13, color: C.slate, marginTop: 4 }}>
            Live snapshot · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* ══════════════════════════════
            ROW 1 — 6 STAT CARDS
        ══════════════════════════════ */}
        {/* ══════════════════════════════
            SURPLUS / DEFICIT BANNER
        ══════════════════════════════ */}
        <div style={{
          marginBottom: 24,
          padding: "14px 20px",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: isDeficit
            ? `linear-gradient(135deg, ${C.rose}12, ${C.amber}10)`
            : `linear-gradient(135deg, ${C.emerald}12, ${C.teal}10)`,
          border: `1.5px solid ${isDeficit ? C.rose : C.emerald}44`,
          boxShadow: `0 4px 16px ${isDeficit ? C.rose : C.emerald}14`,
          animation: "fadeUp 0.5s ease 0.05s both",
        }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: isDeficit ? `${C.rose}18` : `${C.emerald}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>
            {isDeficit ? "⚠️" : "✅"}
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: isDeficit ? C.rose : C.emerald }}>
              {isDeficit ? "Deficit Mode — Priority & Credits Allocation Active" : "Surplus Mode — All Demands Will Be Fully Met"}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.slate }}>
              {isDeficit
                ? `Demand exceeds supply by ${difference.toLocaleString()} KL. Water will be distributed based on area priority rank and credit score (10–100).`
                : `Supply exceeds demand by ${difference.toLocaleString()} KL. Every area receives 100% of its requested allocation.`
              }
            </p>
          </div>

          {/* Right badge */}
          <div style={{
            padding: "6px 14px", borderRadius: 99, flexShrink: 0,
            background: isDeficit ? `${C.rose}18` : `${C.emerald}18`,
            border: `1px solid ${isDeficit ? C.rose : C.emerald}44`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: isDeficit ? C.rose : C.emerald }}>
              {isDeficit ? `−${difference.toLocaleString()} KL` : `+${difference.toLocaleString()} KL`}
            </span>
          </div>
        </div>

        {/* ══════════════════════════════
            ROW 2 — SUPPLY vs DEMAND (wide) + PRIORITY PIE
        ══════════════════════════════ */}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}>
          <StatCard icon="💧" label="Total Supply"       value={totSupply}  unit="KL"  sub="Available today"          color={C.teal}    delay={0} />
          <StatCard icon="📊" label="Total Demand"       value={stats.totalDemand}  unit="KL"  sub="Requests received"         color={C.amber}   delay={80} />
          <StatCard icon="⚠️" label="Shortage Areas"     value={stats.shortageAreas} unit=""   sub="Need attention"            color={C.rose}    delay={160} pulse={stats.shortageAreas > 0} />
          <StatCard icon="🔧" label="Open Issues"        value={stats.openIssues}    unit=""   sub="User reports"              color={C.violet}  delay={240} />
          {/* <StatCard icon="📍" label="Active Areas"       value={stats.activeAreas}   unit=""   sub="Monitored zones"           color={C.emerald} delay={320} /> */}
          <StatCard icon="⚡" label="Allocation Efficiency" value={`${efficiency}%`} unit=""   sub={isDeficit ? `Deficit: ${difference.toLocaleString()} KL` : `Surplus: ${difference.toLocaleString()} KL`} color={isDeficit ? C.rose : C.emerald} delay={400} />        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Supply vs Demand Area Chart */}
          <ChartCard style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
            <SectionHeader title="Supply vs Demand — Weekly Trend" icon="📈" />
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.teal}  stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.teal}  stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.amber} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<GlassTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="supply" name="Supply (KL)" stroke={C.teal}  strokeWidth={2.5} fill="url(#gSupply)"  dot={false} />
                <Area type="monotone" dataKey="demand" name="Demand (KL)" stroke={C.amber} strokeWidth={2.5} fill="url(#gDemand)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Priority Mix Pie */}
          <ChartCard style={{ animation: "fadeUp 0.5s ease 0.2s both" }}>
            <SectionHeader title="Area Priority Mix" icon="🎯" />
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={priorityMix}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${value}`}
                  labelLine={false}
                >
                  {priorityMix.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {priorityMix.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                  <span style={{ color: C.slate, flex: 1 }}>{p.name}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{p.value} zones</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* ══════════════════════════════
            ROW 3 — AREA ALLOCATION BAR + ISSUE TYPES
        ══════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 24 }}>
          {/* Per-Area Allocation vs Demand */}
          <ChartCard style={{ animation: "fadeUp 0.5s ease 0.15s both" }}>
            <SectionHeader title="Per-Area Allocation vs Demand" icon="🏘️" />
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={areaAllocation} margin={{ top: 5, right: 10, bottom: 40, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.slate }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<GlassTooltip />} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="demand"    name="Demand (KL)"    fill={`${C.amber}55`} radius={[4,4,0,0]} stroke={C.amber} strokeWidth={1} />
                <Bar dataKey="allocated" name="Allocated (KL)" fill={C.teal}         radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Issue Types Bar */}
          <ChartCard style={{ animation: "fadeUp 0.5s ease 0.25s both" }}>
            <SectionHeader title="Issue Breakdown" icon="🔧" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
              {issueTypes.map((item, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{item.type}</span>
                    <span style={{ color: item.color, fontWeight: 700 }}>{item.count}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: "rgba(100,116,139,0.1)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(item.count / 10) * 100}%`,
                      background: item.color,
                      borderRadius: 99,
                      transition: "width 1s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Conflict pins summary */}
            <div style={{
              marginTop: 20,
              padding: "12px 14px",
              background: `linear-gradient(135deg, ${C.rose}11, ${C.rose}22)`,
              border: `1px solid ${C.rose}33`,
              borderRadius: 12,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.rose, margin: "0 0 4px" }}>
                🔴 Conflict Pins on Map
              </p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {conflicts.length}
              </p>
              <p style={{ fontSize: 11, color: C.slate, margin: "2px 0 0" }}>
                User-reported conflict locations
              </p>
            </div>
          </ChartCard>
        </div>

        {/* ══════════════════════════════
            ROW 4 — HOURLY FLOW + RADAR
        ══════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* 24-hour flow */}
          <ChartCard style={{ animation: "fadeUp 0.5s ease 0.2s both" }}>
            <SectionHeader title="24-Hour Water Flow (KL/hr)" icon="🕐" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyFlow} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gFlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={C.tealL} />
                    <stop offset="100%" stopColor={C.violet} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: C.slate }} interval={3} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Line type="monotone" dataKey="flow" name="Flow (KL/hr)" stroke="url(#gFlow)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Radar — allocation coverage by type */}
          <ChartCard style={{ animation: "fadeUp 0.5s ease 0.3s both" }}>
            <SectionHeader title="Coverage by Sector (%)" icon="🎖️" />
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="rgba(100,116,139,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: C.slate }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false} />
                <Radar name="Coverage" dataKey="A" stroke={C.teal} fill={C.teal} fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<GlassTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ══════════════════════════════
            ROW 5 — SHORTAGE TABLE
        ══════════════════════════════ */}
        <ChartCard style={{ animation: "fadeUp 0.5s ease 0.35s both" }}>
          <SectionHeader title="Area-wise Shortage Summary" icon="📋" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(8,145,178,0.12)" }}>
                  {["Area", "Type", "Priority", "Demand (KL)", "Allocated (KL)", "Shortage (KL)", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {areaAllocation.map((row, i) => {
                  const pct = ((row.allocated / row.demand) * 100).toFixed(0);
                  const statusColor = row.shortage === 0 ? C.emerald : row.shortage > 1000 ? C.rose : C.amber;
                  const statusLabel = row.shortage === 0 ? "Fulfilled" : row.shortage > 1000 ? "Critical" : "Partial";
                  return (
                    <tr key={i} style={{
                      borderBottom: "1px solid rgba(100,116,139,0.08)",
                      background: i % 2 === 0 ? "transparent" : "rgba(8,145,178,0.02)",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(8,145,178,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(8,145,178,0.02)"}
                    >
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#0f172a" }}>{row.name}</td>
                      <td style={{ padding: "12px 12px", color: C.slate, textTransform: "capitalize" }}>
                        {i === 0 || i === 1 ? "Hospital" : i === 2 ? "Residential" : i === 3 ? "Commercial" : i === 4 ? "Government" : i === 5 ? "Industrial" : "School"}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: (i < 2 || i === 4) ? `${C.rose}18` : `${C.amber}18`,
                          color: (i < 2 || i === 4) ? C.rose : C.amber,
                        }}>
                          {(i < 2 || i === 4) ? "High" : "Medium"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", color: C.slate, fontFamily: "'DM Mono', monospace" }}>{row.demand.toLocaleString()}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: C.teal, fontFamily: "'DM Mono', monospace" }}>{row.allocated.toLocaleString()}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 700, color: row.shortage > 0 ? C.rose : C.emerald, fontFamily: "'DM Mono', monospace" }}>
                        {row.shortage > 0 ? `-${row.shortage.toLocaleString()}` : "—"}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: `${statusColor}18`,
                          color: statusColor,
                        }}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>

      </div>
    </>
  );
}