"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://brightsky-api.sahilswarajjena456.workers.dev";

const authFetch = async (path, opts = {}) => {
  let token = localStorage.getItem("accessToken");
  let res = await fetch(`${API}${path}`, {
    ...opts, credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
  if (res.status === 401) {
    try {
      const r = await fetch(`${API}/api/auth/refresh`, { method: "POST", credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        localStorage.setItem("accessToken", d.accessToken);
        token = d.accessToken;
        res = await fetch(`${API}${path}`, {
          ...opts, credentials: "include",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
        });
      } else {
        localStorage.removeItem("accessToken"); localStorage.removeItem("bsc_session");
        window.location.reload();
      }
    } catch {
      localStorage.removeItem("accessToken"); localStorage.removeItem("bsc_session");
      window.location.reload();
    }
  }
  return res;
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:#0b0f1a; --bg2:#111827; --bg3:#1a2235; --card:#151d2e; --border:#1e2d45;
      --amber:#f59e0b; --amber2:#fbbf24; --amber-dim:rgba(245,158,11,0.12); --amber-glow:rgba(245,158,11,0.25);
      --green:#10b981; --green-dim:rgba(16,185,129,0.12); --red:#ef4444; --red-dim:rgba(239,68,68,0.12);
      --blue:#3b82f6; --blue-dim:rgba(59,130,246,0.12); --purple:#8b5cf6;
      --text:#f1f5f9; --text2:#94a3b8; --text3:#64748b; --radius:12px; --radius-lg:16px;
    }
    html,body{height:100%;-webkit-text-size-adjust:100%;}
    body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;}
    ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:var(--bg2);} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
    @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6;}100%{transform:scale(2.4);opacity:0;}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes badge-in{from{transform:scale(0.7);opacity:0;}to{transform:scale(1);opacity:1;}}
    .fade-up{animation:fadeUp 0.35s ease both;}
    .fade-up-d1{animation:fadeUp 0.35s 0.05s ease both;}
    .fade-up-d2{animation:fadeUp 0.35s 0.10s ease both;}
    .fade-up-d3{animation:fadeUp 0.35s 0.15s ease both;}
    .fade-up-d4{animation:fadeUp 0.35s 0.20s ease both;}
    .spin{animation:spin 1s linear infinite;}
    input,select,textarea{
      font-family:'DM Sans',sans-serif;background:var(--bg3);border:1px solid var(--border);
      color:var(--text);border-radius:8px;padding:10px 14px;font-size:16px;width:100%;outline:none;
      transition:border-color 0.2s,box-shadow 0.2s;-webkit-appearance:none;appearance:none;
    }
    input:focus,select:focus,textarea:focus{border-color:var(--amber);box-shadow:0 0 0 3px var(--amber-dim);}
    input::placeholder{color:var(--text3);}
    select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px;}
    button{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;outline:none;transition:all 0.18s;-webkit-tap-highlight-color:transparent;}
    button:disabled{opacity:0.45;cursor:not-allowed;}
    table{border-collapse:collapse;width:100%;}
    th{font-family:'Syne',sans-serif;font-weight:600;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);}
    td{padding:10px 12px;font-size:13px;color:var(--text2);border-bottom:1px solid rgba(30,45,69,0.5);}
    tr:last-child td{border-bottom:none;}
    .pin-input{letter-spacing:0.3em;font-size:24px;font-family:'Syne',sans-serif;font-weight:700;text-align:center;padding:12px;background:var(--bg3);border:2px solid var(--border);border-radius:12px;color:var(--text);width:100%;outline:none;transition:border-color 0.2s,box-shadow 0.2s;}
    .pin-input:focus{border-color:var(--amber);box-shadow:0 0 0 3px var(--amber-dim);}
    .pin-dot{width:14px;height:14px;border-radius:50%;background:var(--amber);display:inline-block;flex-shrink:0;transition:all 0.25s;box-shadow:0 0 8px var(--amber-glow);}
    .pin-dot.empty{background:transparent;border:2px solid var(--text3);box-shadow:none;}
  `}</style>
);

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString([], { month:"short", day:"numeric", year:"numeric" }) : "—";
const fmtMins = (m) => { if (!m && m !== 0) return "—"; const h=Math.floor(m/60),min=m%60; return h?`${h}h ${min}m`:`${min}m`; };

function distanceFeet(lat1,lon1,lat2,lon2){
  const R=20902231,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const DEFAULT_SETTINGS = {
  companyName:"Bright Sky Construction", siteName:"",
  latitude:null, longitude:null, radiusFeet:null,
  workStart:"07:00", workEnd:"17:00",
  autoClockInEnabled:true, autoBreakOnExitEnabled:true, autoCorrectionEnabled:true,
  maxBreaksPerDay:3, minBreakMinutes:5,
};

// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    clocked_in:    { label:"Clocked In",    bg:"var(--green-dim)", c:"var(--green)",  dot:true },
    on_break:      { label:"On Break",       bg:"var(--amber-dim)",c:"var(--amber2)", dot:true },
    clocked_out:   { label:"Clocked Out",    bg:"rgba(100,116,139,0.12)",c:"var(--text3)",dot:false },
    off_site:      { label:"Off Site",       bg:"var(--red-dim)",  c:"var(--red)",    dot:false },
    auto_corrected:{ label:"Auto Corrected", bg:"var(--blue-dim)", c:"var(--blue)",   dot:false },
  }[status] || { label:status||"Unknown", bg:"rgba(100,116,139,0.12)", c:"var(--text3)", dot:false };
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,background:cfg.bg,color:cfg.c,
      padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:600,letterSpacing:"0.03em",
      fontFamily:"'Syne',sans-serif",animation:"badge-in 0.2s ease both",whiteSpace:"nowrap"}}>
      {cfg.dot&&<span style={{width:6,height:6,borderRadius:"50%",background:cfg.c,boxShadow:`0 0 5px ${cfg.c}`,display:"inline-block",flexShrink:0}}/>}
      {cfg.label}
    </span>
  );
};

const Card = ({ children, style={}, className="" }) => (
  <div className={className} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:16,...style}}>
    {children}
  </div>
);

const StatCard = ({ label, value, icon, color="var(--amber)", sub }) => (
  <Card style={{display:"flex",flexDirection:"column",gap:6}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <span style={{fontSize:10,color:"var(--text3)",fontFamily:"'Syne',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,lineHeight:1.3}}>{label}</span>
      <span style={{color,background:`${color}22`,padding:"5px 6px",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name={icon} size={13} color={color}/>
      </span>
    </div>
    <div style={{fontSize:22,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text)",lineHeight:1.2,wordBreak:"break-word"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"var(--text3)"}}>{sub}</div>}
  </Card>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"var(--text)"}}>{title}</h2>
      {subtitle&&<p style={{color:"var(--text3)",fontSize:12,marginTop:3}}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Btn = ({ children, onClick, variant="primary", size="md", disabled, style:s={}, loading }) => {
  const sizes = { sm:{padding:"7px 14px",fontSize:12.5}, md:{padding:"11px 20px",fontSize:14}, lg:{padding:"15px 24px",fontSize:15} };
  const variants = {
    primary:{background:"var(--amber)",color:"#0b0f1a",fontWeight:700},
    secondary:{background:"var(--bg3)",color:"var(--text2)",border:"1px solid var(--border)"},
    danger:{background:"var(--red-dim)",color:"var(--red)",border:"1px solid rgba(239,68,68,0.25)"},
    ghost:{background:"transparent",color:"var(--text2)",border:"1px solid var(--border)"},
    green:{background:"var(--green-dim)",color:"var(--green)",border:"1px solid rgba(16,185,129,0.25)",fontWeight:600},
    blue:{background:"var(--blue-dim)",color:"var(--blue)",border:"1px solid rgba(59,130,246,0.25)",fontWeight:600},
  };
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{...sizes[size],...variants[variant],borderRadius:9,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'DM Sans',sans-serif",transition:"all 0.18s",minHeight:44,...s}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.filter="brightness(1.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.filter="";}}>
      {loading&&<span className="spin" style={{width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",flexShrink:0}}/>}
      {children}
    </button>
  );
};

const Toast = ({ toasts, removeToast }) => (
  <div style={{position:"fixed",bottom:16,left:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
    {toasts.map(t=>(
      <div key={t.id} className="fade-up" style={{
        background:t.type==="error"?"#1a0a0a":t.type==="success"?"#071a12":"#0f1829",
        border:`1px solid ${t.type==="error"?"var(--red)":t.type==="success"?"var(--green)":"var(--amber)"}`,
        borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",
        color:t.type==="error"?"var(--red)":t.type==="success"?"var(--green)":"var(--amber)",
        boxShadow:"0 4px 24px rgba(0,0,0,0.5)",pointerEvents:"all"}}>
        <Icon name={t.type==="error"?"x":t.type==="success"?"check":"alert"} size={15}/>
        <span style={{fontSize:13,color:"var(--text)",flex:1}}>{t.message}</span>
        <button onClick={()=>removeToast(t.id)} style={{background:"none",color:"var(--text3)",fontSize:20,lineHeight:1,padding:"0 2px"}}>×</button>
      </div>
    ))}
  </div>
);

const LocationIndicator = ({ onSite, distance, loading }) => (
  <div style={{display:"flex",alignItems:"center",gap:6,
    background:onSite?"var(--green-dim)":"var(--red-dim)",
    border:`1px solid ${onSite?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.25)"}`,
    borderRadius:8,padding:"6px 10px",fontSize:11.5,color:onSite?"var(--green)":"var(--red)",whiteSpace:"nowrap"}}>
    {loading
      ? <span className="spin" style={{width:11,height:11,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block"}}/>
      : <Icon name={onSite?"wifi":"wifiOff"} size={12}/>}
    <span style={{fontWeight:600}}>{loading?"Locating…":onSite?"On Site":"Off Site"}</span>
    {distance!=null&&!loading&&<span style={{opacity:0.7}}>· {Math.round(distance)}ft</span>}
  </div>
);

const Icon = ({ name, size=18, color="currentColor", style={} }) => {
  const icons = {
    clock:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    login:<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
    logout:<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    user:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    users:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    home:<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    download:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    bar:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    log:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    pin:<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    check:<><polyline points="20 6 9 17 4 12"/></>,
    x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    alert:<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    coffee:<><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>,
    menu:<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    refresh:<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
    play:<><polygon points="5 3 19 12 5 21 5 3"/></>,
    stop:<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></>,
    shield:<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    trend:<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    wifi:<><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    wifiOff:<><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    calendar:<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    hard_hat:<><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a2 2 0 0 1 4 0v5"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></>,
    map:<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    eye:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    key:<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
    edit:<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    plus:<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    layers:<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",flexShrink:0,...style}}>
      {icons[name]||null}
    </svg>
  );
};

// ── MODAL ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg2)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:600,maxHeight:"90vh",overflowY:"auto",padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"var(--bg3)",border:"none",color:"var(--text2)",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <Icon name="close" size={16}/>
        </button>
      </div>
      {children}
    </div>
  </div>
);

function SidebarProfile({ currentUser, handleLogout }) {
  const [photo, setPhoto] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`bsc_photo_${currentUser.id}`);
      if (saved) setPhoto(saved);
    } catch {}
  }, [currentUser.id]);

  const processFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be under 5MB. Please choose a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      // Compress image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setPhoto(compressed);
        try { localStorage.setItem(`bsc_photo_${currentUser.id}`, compressed); } catch {}
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    try { localStorage.removeItem(`bsc_photo_${currentUser.id}`); } catch {}
    setShowPhotoMenu(false);
  };

  return (
    <div style={{padding:"12px",borderTop:"1px solid var(--border)"}}>
      <div style={{background:"var(--bg3)",borderRadius:12,padding:"12px",border:"1px solid var(--border)"}}>

        {/* Profile row */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>

          {/* Avatar — tap to open menu */}
          <div style={{position:"relative",flexShrink:0}}>
            <div
              onClick={()=>setShowPhotoMenu(s=>!s)}
              style={{width:48,height:48,borderRadius:"50%",background:"var(--amber-dim)",
                display:"flex",alignItems:"center",justifyContent:"center",
                border:"2px solid var(--amber-glow)",overflow:"hidden",
                cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
              {photo
                ? <img src={photo} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <Icon name="user" size={22} color="var(--amber2)"/>
              }
            </div>
            {/* Camera badge */}
            <div style={{position:"absolute",bottom:0,right:0,width:18,height:18,borderRadius:"50%",
              background:"var(--amber)",display:"flex",alignItems:"center",justifyContent:"center",
              border:"2px solid var(--bg3)",pointerEvents:"none"}}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0b0f1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>

          {/* Name and role */}
          <div style={{overflow:"hidden",flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text)",
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {currentUser.name}
            </div>
            <div style={{fontSize:11,color:"var(--text3)",textTransform:"capitalize",marginTop:2}}>
              {currentUser.role}
            </div>
            {currentUser.userId&&(
              <div style={{display:"inline-flex",alignItems:"center",gap:4,
                background:"var(--amber-dim)",padding:"2px 8px",borderRadius:999,marginTop:4}}>
                <Icon name="key" size={9} color="var(--amber2)"/>
                <span style={{fontSize:11,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--amber2)"}}>
                  {currentUser.userId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Photo options menu */}
        {showPhotoMenu&&(
          <div style={{marginBottom:12,background:"var(--bg2)",borderRadius:10,overflow:"hidden",
            border:"1px solid var(--border)"}}>
            <div style={{padding:"8px 12px",fontSize:11,color:"var(--text3)",
              fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",
              textTransform:"uppercase",borderBottom:"1px solid var(--border)"}}>
              Profile Photo
            </div>

            {/* Choose from gallery */}
            <label style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",
              cursor:"pointer",borderBottom:"1px solid rgba(30,45,69,0.5)",
              WebkitTapHighlightColor:"transparent",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:8,background:"var(--blue-dim)",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div>
                <div style={{fontSize:14,color:"var(--text)",fontWeight:500}}>Choose from Gallery</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>Pick any photo from your phone</div>
              </div>
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                onChange={e=>{ processFile(e.target.files?.[0]); setShowPhotoMenu(false); e.target.value=""; }}
                style={{display:"none"}}
              />
            </label>

            {/* Take a photo */}
            <label style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",
              cursor:"pointer",borderBottom:"1px solid rgba(30,45,69,0.5)",
              WebkitTapHighlightColor:"transparent",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:8,background:"var(--green-dim)",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div>
                <div style={{fontSize:14,color:"var(--text)",fontWeight:500}}>Take a Photo</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>Use your camera directly</div>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={e=>{ processFile(e.target.files?.[0]); setShowPhotoMenu(false); e.target.value=""; }}
                style={{display:"none"}}
              />
            </label>

            {/* Remove photo — only show if photo exists */}
            {photo&&(
              <button
                onClick={handleRemovePhoto}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 14px",
                  background:"none",border:"none",cursor:"pointer",minHeight:48,
                  WebkitTapHighlightColor:"transparent"}}>
                <div style={{width:32,height:32,borderRadius:8,background:"var(--red-dim)",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon name="x" size={16} color="var(--red)"/>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:14,color:"var(--red)",fontWeight:500}}>Remove Photo</div>
                  <div style={{fontSize:11,color:"var(--text3)"}}>Reset to default avatar</div>
                </div>
              </button>
            )}

            {/* Cancel */}
            <button
              onClick={()=>setShowPhotoMenu(false)}
              style={{width:"100%",padding:"13px 14px",background:"none",border:"none",
                fontSize:14,color:"var(--text3)",cursor:"pointer",minHeight:48,
                WebkitTapHighlightColor:"transparent"}}>
              Cancel
            </button>
          </div>
        )}

        {/* Sign out button */}
        <button onClick={handleLogout} style={{width:"100%",display:"flex",alignItems:"center",
          justifyContent:"center",gap:8,padding:"11px",borderRadius:9,
          background:"var(--red-dim)",color:"var(--red)",
          border:"1px solid rgba(239,68,68,0.2)",fontSize:13,cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif",minHeight:44,
          WebkitTapHighlightColor:"transparent"}}>
          <Icon name="logout" size={14} color="var(--red)"/>Sign Out
        </button>
      </div>
    </div>
  );
}
// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try { const s=localStorage.getItem("bsc_session"); if(s) setCurrentUser(JSON.parse(s)); } catch {}
    localStorage.removeItem("bsc_settings");
    setMounted(true);
  }, []);

  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [todayData, setTodayData] = useState(null);
  const [adminData, setAdminData] = useState({ employees:[], attendance:[], summary:[] });
  const [worksites, setWorksites] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const toastCounter = useRef(0);

  const addToast = useCallback((msg, type="info") => {
    const id = ++toastCounter.current;
    setToasts(t=>[...t,{id,message:msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
  }, []);
  const removeToast = useCallback((id)=>setToasts(t=>t.filter(x=>x.id!==id)),[]);

  const [userLat, setUserLat] = useState(null);
  const [userLon, setUserLon] = useState(null);
  let onSite = false, distanceFt = null;
  if (userLat!=null && settings.latitude!=null && settings.longitude!=null) {
    distanceFt = distanceFeet(userLat, userLon, settings.latitude, settings.longitude);
    onSite = settings.radiusFeet!=null && distanceFt <= settings.radiusFeet;
  }

  useEffect(() => {
    if (!navigator.geolocation) { setGpsLoading(false); return; }
    const id = navigator.geolocation.watchPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLon(pos.coords.longitude); setGpsLoading(false); },
      () => setGpsLoading(false),
      { enableHighAccuracy:true, maximumAge:15000, timeout:10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await authFetch("/api/settings");
      if (res.ok) {
        const d = await res.json();
        if (d) setSettings({
          companyName:d.company_name, siteName:d.site_name,
          latitude:parseFloat(d.latitude), longitude:parseFloat(d.longitude),
          radiusFeet:parseFloat(d.radius_feet),
          workStart:d.working_hours_start?.slice(0,5)||"07:00",
          workEnd:d.working_hours_end?.slice(0,5)||"17:00",
          autoClockInEnabled:d.auto_clock_in_enabled,
          autoBreakOnExitEnabled:d.auto_break_on_exit_enabled,
          autoCorrectionEnabled:d.auto_correction_enabled,
          maxBreaksPerDay:3, minBreakMinutes:5,
        });
      }
    } catch {}
  }, []);

  const refreshTodayData = useCallback(async () => {
    if (!currentUser) return;
    try { const r=await authFetch("/api/attendance/me/today"); if(r.ok){const d=await r.json();setTodayData(d);} } catch {}
  }, [currentUser]);

  const refreshAdminData = useCallback(async () => {
    if (!currentUser||(currentUser.role!=="admin"&&currentUser.role!=="manager")) return;
    try {
      const today = new Date().toISOString().slice(0,10);
      const [eR,aR,sR] = await Promise.all([
        authFetch("/api/admin/employees"),
        authFetch(`/api/admin/attendance?date_from=${today}&date_to=${today}`),
        authFetch("/api/admin/reports/summary"),
      ]);
      setAdminData({
        employees: eR.ok ? await eR.json() : [],
        attendance: aR.ok ? await aR.json() : [],
        summary: sR.ok ? await sR.json() : [],
      });
    } catch {}
  }, [currentUser]);

  const refreshWorksites = useCallback(async () => {
    if (!currentUser) return;
    try { const r=await authFetch("/api/worksites"); if(r.ok){const d=await r.json();setWorksites(Array.isArray(d)?d:[]);} } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshTodayData(); refreshSettings(); refreshWorksites();
      if (currentUser.role==="admin"||currentUser.role==="manager") refreshAdminData();
    }
  }, [currentUser, refreshTodayData, refreshSettings, refreshAdminData, refreshWorksites]);

  useEffect(() => {
    if (!currentUser) return;
    const iv = setInterval(() => {
      refreshTodayData();
      if (currentUser.role==="admin"||currentUser.role==="manager") refreshAdminData();
    }, 30000);
    return () => clearInterval(iv);
  }, [currentUser, refreshTodayData, refreshAdminData]);

  const empStatus = todayData?.status || "clocked_out";

  const doPunch = async (endpoint, msg) => {
    if (punchLoading) return;
    setPunchLoading(true);
    try {
      const res = await authFetch(`/api/attendance/${endpoint}`, {
        method:"POST",
        body:JSON.stringify({ latitude:userLat||settings.latitude||0, longitude:userLon||settings.longitude||0 }),
      });
      const d = await res.json();
      if (!res.ok) { addToast(d.error||"Action failed.", "error"); return; }
      addToast(msg, "success");
      await refreshTodayData();
    } catch { addToast("Cannot connect to server.", "error"); }
    finally { setPunchLoading(false); }
  };

  const handleClockIn    = () => doPunch("clock-in",    "Clocked in successfully!");
  const handleClockOut   = () => doPunch("clock-out",   "Clocked out. Have a great day!");
  const handleBreakStart = () => doPunch("break-start", "Break started. Enjoy your break!");
  const handleBreakEnd   = () => doPunch("break-end",   "Break ended. Welcome back!");

  const handleLogin = async (userId, password, isEmail=false) => {
    try {
      const body = isEmail
        ? { email: userId, password }
        : { userId, password };
      const res = await fetch(`${API}/api/auth/login`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error||"Invalid credentials.", "error"); return; }
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("bsc_session", JSON.stringify(data.user));
      localStorage.removeItem("bsc_settings");
      setCurrentUser(data.user);
      addToast(`Welcome, ${data.user.name.split(" ")[0]}!`, "success");
      setPage("dashboard");
    } catch { addToast("Cannot connect to server.", "error"); }
  };

  const handleLogout = async () => {
    try { await authFetch("/api/auth/logout",{method:"POST"}); } catch {}
    setCurrentUser(null);
    ["accessToken","bsc_session","bsc_settings"].forEach(k=>localStorage.removeItem(k));
    setPage("dashboard"); setTodayData(null); setAdminData({employees:[],attendance:[],summary:[]});
    addToast("Logged out.", "info");
  };

  const isAdmin = currentUser?.role==="admin"||currentUser?.role==="manager";
  const navItems = currentUser ? [
    {id:"dashboard", label:isAdmin?"Dashboard":"My Dashboard", icon:"home"},
    ...(isAdmin?[
      {id:"employees",  label:"Employees",  icon:"users"},
      {id:"worksites",  label:"Worksites",  icon:"map"},
      {id:"attendance", label:"Attendance", icon:"calendar"},
      {id:"reports",    label:"Reports",    icon:"bar"},
      {id:"settings",   label:"Settings",   icon:"settings"},
      {id:"export",     label:"Export",     icon:"download"},
      {id:"audit",      label:"Audit Logs", icon:"log"},
    ]:[
      {id:"my_attendance", label:"My Attendance", icon:"calendar"},
      {id:"my_profile",    label:"My Profile",    icon:"user"},
    ]),
  ] : [];

  if (!mounted) return null;
  if (!currentUser) return (
    <><GlobalStyle/><LoginPage onLogin={handleLogin}/><Toast toasts={toasts} removeToast={removeToast}/></>
  );

  return (
    <>
      <GlobalStyle/>
      <div style={{display:"flex",minHeight:"100vh",position:"relative"}}>
        {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,backdropFilter:"blur(2px)"}}/>}
        <aside style={{
          position:"fixed",top:0,left:0,height:"100vh",zIndex:300,
          width:260,transform:sidebarOpen?"translateX(0)":"translateX(-100%)",
          background:"var(--bg2)",borderRight:"1px solid var(--border)",
          transition:"transform 0.28s cubic-bezier(.4,0,.2,1)",
          display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,background:"var(--amber)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon name="hard_hat" size={17} color="#0b0f1a"/>
              </div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,color:"var(--text)"}}>Bright Sky</div>
                <div style={{fontSize:10,color:"var(--text3)"}}>Construction</div>
              </div>
            </div>
            <button onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",color:"var(--text3)",padding:4,display:"flex"}}>
              <Icon name="close" size={18}/>
            </button>
          </div>
          <nav style={{flex:1,padding:"10px 8px",overflowY:"auto",paddingBottom:4}}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}} style={{
                width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:9,
                background:page===item.id?"var(--amber-dim)":"transparent",
                color:page===item.id?"var(--amber2)":"var(--text2)",
                fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:page===item.id?600:400,
                border:"none",cursor:"pointer",marginBottom:2,transition:"background 0.15s",minHeight:44}}>
                <Icon name={item.icon} size={16} color={page===item.id?"var(--amber2)":"var(--text3)"}/>
                {item.label}
              </button>
            ))}
          </nav>
          <SidebarProfile currentUser={currentUser} handleLogout={handleLogout}/>
        </aside>

        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,width:"100%"}}>
          <header style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:100}}>
            <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:"var(--text2)",padding:6,borderRadius:7,display:"flex",cursor:"pointer",minWidth:36,minHeight:36,alignItems:"center",justifyContent:"center"}}>
              <Icon name="menu" size={20}/>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:0}}>
              <div style={{width:26,height:26,borderRadius:6,background:"var(--amber)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon name="hard_hat" size={13} color="#0b0f1a"/>
              </div>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>BSC Tracker</span>
            </div>
            <LocationIndicator onSite={onSite} distance={distanceFt} loading={gpsLoading||settings.latitude==null}/>
          </header>

          <main style={{flex:1,padding:"16px 14px",maxWidth:900,width:"100%",margin:"0 auto"}}>
            {page==="dashboard"&&(isAdmin
              ? <AdminDashboard adminData={adminData} refreshAdminData={refreshAdminData}/>
              : <EmployeeDashboard user={currentUser} todayData={todayData} empStatus={empStatus}
                  onSite={onSite} settings={settings} punchLoading={punchLoading}
                  handleClockIn={handleClockIn} handleClockOut={handleClockOut}
                  handleBreakStart={handleBreakStart} handleBreakEnd={handleBreakEnd}/>
            )}
            {page==="my_attendance"&&<MyAttendance/>}
            {page==="my_profile"&&<MyProfile user={currentUser} addToast={addToast}/>}
            {page==="employees"&&isAdmin&&<EmployeeList adminData={adminData} refreshAdminData={refreshAdminData} addToast={addToast} worksites={worksites}/>}
            {page==="worksites"&&isAdmin&&<WorksitesPage worksites={worksites} refreshWorksites={refreshWorksites} adminData={adminData} addToast={addToast}/>}
            {page==="attendance"&&isAdmin&&<AttendancePage adminData={adminData}/>}
            {page==="reports"&&isAdmin&&<ReportsPage adminData={adminData}/>}
            {page==="settings"&&isAdmin&&<SettingsPage settings={settings} addToast={addToast} refreshSettings={refreshSettings}/>}
            {page==="export"&&isAdmin&&<ExportPage adminData={adminData} addToast={addToast}/>}
            {page==="audit"&&isAdmin&&<AuditPage/>}
          </main>
        </div>
      </div>
      <Toast toasts={toasts} removeToast={removeToast}/>
    </>
  );
}

// ── LOGIN PAGE (Redesigned with 4-digit User ID) ───────────────────────────────
function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useEmail, setUseEmail] = useState(false);

  const validate = () => {
  if (!useEmail) {
    if (!/^[A-Za-z0-9]{4}$/.test(userId)) {
      setError("User ID must be exactly 4 alphanumeric characters.");
      return false;
    }
    if (!/^\d{4}$/.test(password)) {
      setError("Password must be exactly 4 digits.");
      return false;
    }
  }
  setError("");
  return true;
};

  const handle = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await onLogin(userId, password, useEmail);
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--bg)",
      backgroundImage:"radial-gradient(ellipse 100% 50% at 50% -20%, rgba(245,158,11,0.15), transparent)"}}>
      
      {/* Top branding */}
      <div style={{padding:"40px 24px 20px",textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:20,background:"var(--amber)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 0 40px var(--amber-glow)"}}>
          <Icon name="hard_hat" size={36} color="#0b0f1a"/>
        </div>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:"var(--text)",lineHeight:1.2}}>
          Bright Sky<br/>Construction
        </h1>
        <p style={{color:"var(--text3)",fontSize:13,marginTop:8}}>Employee Time Tracking System</p>
      </div>

      {/* Login card */}
      <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"0 16px 40px"}}>
        <div style={{width:"100%",maxWidth:380}} className="fade-up">
          <Card style={{padding:24}}>
            {/* Header */}
            <div style={{marginBottom:24}}>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,marginBottom:4}}>
                {useEmail ? "Admin Sign In" : "Employee Sign In"}
              </h2>
              <p style={{color:"var(--text3)",fontSize:13}}>
                {useEmail ? "Enter your email and password" : "Enter your 4-character User ID"}
              </p>
            </div>

            <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* User ID / Email field */}
              <div>
                <label style={{fontSize:11,color:"var(--text3)",fontWeight:600,display:"flex",alignItems:"center",gap:6,marginBottom:6,fontFamily:"'Syne',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  <Icon name={useEmail?"user":"key"} size={12} color="var(--text3)"/>
                  {useEmail ? "Email Address" : "User ID"}
                </label>
                {useEmail ? (
                  <input
                    type="email"
                    value={userId}
                    onChange={e=>{setUserId(e.target.value);setError("");}}
                    placeholder="your@email.com"
                    autoComplete="email"
                    style={{fontSize:16}}
                    required
                  />
                ) : (
                  <input
                    type="text"
                    className="pin-input"
                    value={userId}
                    onChange={e=>{
                      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);
                      setUserId(v); setError("");
                    }}
                    placeholder="0000"
                    maxLength={4}
                    autoComplete="off"
                    inputMode="text"
                    style={{fontSize:28,letterSpacing:"0.3em",textAlign:"center"}}
                    required
                  />
                )}
                {!useEmail && (
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:8,height:20}}>
  {[0,1,2,3].map(i=>(
    <div key={i} className={`pin-dot${userId.length>i?"":" empty"}`}
      style={{transform:userId.length>i?"scale(1.15)":"scale(1)"}}/>
  ))}
</div>
                )}
              </div>

              {/* Password field */}
<div>
  <label style={{fontSize:11,color:"var(--text3)",fontWeight:600,display:"flex",alignItems:"center",gap:6,marginBottom:6,fontFamily:"'Syne',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>
    <Icon name="shield" size={12} color="var(--text3)"/>
    Password
  </label>
  <div style={{position:"relative"}}>
    <input
      type={showPass?"text":"password"}
      className="pin-input"
      value={password}
      onChange={e=>{
        const v = e.target.value.replace(/\D/g,"").slice(0,4);
        setPassword(v); setError("");
      }}
      placeholder="0000"
      autoComplete="off"
      inputMode="numeric"
      maxLength={4}
      style={{fontSize:28,letterSpacing:"0.3em",textAlign:"center"}}
      required
    />
    <button type="button" onClick={()=>setShowPass(s=>!s)} style={{
      position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
      background:"none",border:"none",color:"var(--text3)",cursor:"pointer",
      padding:4,display:"flex",alignItems:"center",justifyContent:"center",minWidth:32,minHeight:32}}>
      <Icon name={showPass?"eyeOff":"eye"} size={18} color="var(--text3)"/>
    </button>
  </div>
  {/* Password dots indicator */}
  <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:8,height:20}}>
  {[0,1,2,3].map(i=>(
    <div key={i} className={`pin-dot${password.length>i?"":" empty"}`}
      style={{transform:password.length>i?"scale(1.15)":"scale(1)"}}/>
  ))}
</div>
</div>

              {/* Error */}
              {error && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:8,background:"var(--red-dim)",border:"1px solid rgba(239,68,68,0.2)"}}>
                  <Icon name="alert" size={14} color="var(--red)"/>
                  <span style={{fontSize:13,color:"var(--red)"}}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <Btn loading={loading} style={{width:"100%",marginTop:4}} size="lg">
                <Icon name="login" size={16} color="#0b0f1a"/>
                Sign In
              </Btn>
            </form>

            {/* Toggle between User ID and email */}
            <div style={{marginTop:16,textAlign:"center"}}>
              <button onClick={()=>{setUseEmail(e=>!e);setUserId("");setPassword("");setError("");}}
                style={{background:"none",border:"none",color:"var(--text3)",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
                {useEmail ? "Use 4-digit User ID instead" : "Admin login with email"}
              </button>
            </div>
          </Card>

          {/* Info card */}
          <div style={{marginTop:12,padding:"12px 16px",borderRadius:12,background:"rgba(245,158,11,0.06)",border:"1px solid var(--amber-dim)",display:"flex",gap:10,alignItems:"flex-start"}}>
            <Icon name="alert" size={14} color="var(--amber)" style={{marginTop:1,flexShrink:0}}/>
            <div style={{fontSize:12,color:"var(--text3)",lineHeight:1.5}}>
              Use your <span style={{color:"var(--amber)",fontWeight:600}}>4-character User ID</span> and password provided by your manager. Contact admin if you forgot your credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EMPLOYEE DASHBOARD ────────────────────────────────────────────────────────
function EmployeeDashboard({ user, todayData, empStatus, onSite, settings, punchLoading, handleClockIn, handleClockOut, handleBreakStart, handleBreakEnd }) {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);

  const session = todayData?.session;
  const punches = todayData?.punches || [];
  const breakCount = punches.filter(p=>p.punch_type==="break_start").length;

  let liveWorked = session?.worked_minutes || 0;
  if ((empStatus==="clocked_in"||empStatus==="on_break") && session?.clock_in_time) {
    const elapsed = Math.round((now.getTime()-new Date(session.clock_in_time).getTime())/60000);
    liveWorked = Math.max(0, elapsed-(session.break_minutes||0));
  } else if (empStatus==="clocked_out" && session?.worked_minutes) {
    liveWorked = session.worked_minutes;
  }

  const punchLabels = {clock_in:"Clocked In",clock_out:"Clocked Out",break_start:"Break Start",break_end:"Break End",auto_clock_in:"Auto Clock-In",auto_break:"Auto Break"};
  const punchColors = {clock_in:"var(--green)",clock_out:"var(--red)",break_start:"var(--amber)",break_end:"var(--amber2)",auto_clock_in:"var(--blue)",auto_break:"var(--blue)"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="fade-up">
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"var(--text)"}}>
          Good {now.getHours()<12?"Morning":now.getHours()<17?"Afternoon":"Evening"}, {user.name.split(" ")[0]} 👋
        </h1>
        <p style={{color:"var(--text3)",fontSize:12,marginTop:3}}>
          {now.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} · {now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </p>
        {user.userId && <p style={{color:"var(--text3)",fontSize:11,marginTop:2}}>User ID: <span style={{color:"var(--amber)",fontWeight:700,fontFamily:"'Syne',sans-serif"}}>{user.userId}</span></p>}
      </div>

      <Card className="fade-up-d1" style={{
        background:empStatus==="clocked_in"?"linear-gradient(135deg,#071a12 0%,var(--card) 60%)":empStatus==="on_break"?"linear-gradient(135deg,#1a130a 0%,var(--card) 60%)":"var(--card)",
        border:`1px solid ${empStatus==="clocked_in"?"rgba(16,185,129,0.3)":empStatus==="on_break"?"rgba(245,158,11,0.3)":"var(--border)"}`}}>
        {(empStatus==="clocked_in"||empStatus==="on_break")&&(
          <div style={{position:"relative",display:"inline-block",marginBottom:12}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:empStatus==="clocked_in"?"var(--green)":"var(--amber)",position:"relative",zIndex:2}}/>
            {[1,2].map(i=><div key={i} style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${empStatus==="clocked_in"?"var(--green)":"var(--amber)"}`,animation:`pulse-ring ${1.4+i*0.3}s ease-out infinite`,animationDelay:`${i*0.35}s`}}/>)}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:"var(--text3)",marginBottom:6}}>Current Status</div>
            <StatusBadge status={empStatus}/>
          </div>
          {(empStatus==="clocked_in"||empStatus==="on_break")&&(
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"var(--text3)"}}>Today's Work</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:empStatus==="clocked_in"?"var(--green)":"var(--amber)"}}>{fmtMins(liveWorked)}</div>
            </div>
          )}
        </div>
        {session?.clock_in_time&&(
          <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{fontSize:12,color:"var(--text3)"}}>In: <span style={{color:"var(--text)",fontWeight:600}}>{fmtTime(session.clock_in_time)}</span></div>
            {session.clock_out_time&&<div style={{fontSize:12,color:"var(--text3)"}}>Out: <span style={{color:"var(--text)",fontWeight:600}}>{fmtTime(session.clock_out_time)}</span></div>}
            <div style={{fontSize:12,color:"var(--text3)"}}>Breaks: <span style={{color:"var(--text)",fontWeight:600}}>{fmtMins(session.break_minutes)}</span></div>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {empStatus==="clocked_out"&&<Btn onClick={handleClockIn} disabled={!onSite||punchLoading} loading={punchLoading} size="lg" style={{width:"100%"}}><Icon name="play" size={16} color="#0b0f1a"/>Clock In</Btn>}
          {empStatus==="clocked_in"&&<>
            <Btn onClick={handleBreakStart} disabled={punchLoading} loading={punchLoading} variant="secondary" size="md" style={{width:"100%"}}><Icon name="coffee" size={15}/>Start Break</Btn>
            <Btn onClick={handleClockOut} disabled={punchLoading} loading={punchLoading} variant="danger" size="md" style={{width:"100%"}}><Icon name="stop" size={15}/>Clock Out</Btn>
          </>}
          {empStatus==="on_break"&&<Btn onClick={handleBreakEnd} disabled={punchLoading} loading={punchLoading} variant="green" size="lg" style={{width:"100%"}}><Icon name="play" size={16}/>End Break</Btn>}
        </div>
        {!onSite&&settings.latitude!=null&&(
          <div style={{marginTop:12,padding:"9px 12px",borderRadius:8,background:"var(--red-dim)",border:"1px solid rgba(239,68,68,0.2)",display:"flex",gap:7,alignItems:"center"}}>
            <Icon name="alert" size={13} color="var(--red)"/>
            <span style={{fontSize:12,color:"var(--red)"}}>Must be within {settings.radiusFeet} ft of the worksite.</span>
          </div>
        )}
      </Card>

      <div className="fade-up-d2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <StatCard label="Today" value={fmtMins(liveWorked)} icon="clock" color="var(--green)"/>
        <StatCard label="Status" value={empStatus==="clocked_in"?"Active":empStatus==="on_break"?"On Break":"Inactive"} icon="shield"
          color={empStatus==="clocked_in"?"var(--green)":empStatus==="on_break"?"var(--amber)":"var(--text3)"}/>
        <StatCard label="Breaks" value={breakCount} icon="coffee" color="var(--amber)" sub={`${fmtMins(session?.break_minutes||0)} total`}/>
        <StatCard label="Punches" value={punches.length} icon="log" color="var(--blue)"/>
      </div>

      <Card className="fade-up-d3">
        <SectionHeader title="Today's Activity" subtitle="All punch events"/>
        {punches.length===0
          ? <div style={{textAlign:"center",padding:"20px 0",color:"var(--text3)",fontSize:13}}>No activity yet today.</div>
          : <div style={{display:"flex",flexDirection:"column"}}>
              {punches.map((p,i)=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<punches.length-1?"1px solid rgba(30,45,69,0.4)":"none"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,background:punchColors[p.punch_type]||"var(--text3)"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"var(--text)",fontWeight:500}}>{punchLabels[p.punch_type]||p.punch_type}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>via {p.source}</div>
                  </div>
                  <div style={{fontSize:12,color:"var(--text2)",fontFamily:"'Syne',sans-serif",fontWeight:600,flexShrink:0}}>{fmtTime(p.punch_time)}</div>
                </div>
              ))}
            </div>
        }
      </Card>

      {settings.siteName&&(
        <Card className="fade-up-d4" style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:10,background:"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name="pin" size={18} color="var(--amber)"/>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{settings.siteName}</div>
            {settings.latitude&&<div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{settings.latitude.toFixed(4)}°, {settings.longitude.toFixed(4)}° · {settings.radiusFeet} ft radius</div>}
            <div style={{fontSize:11,color:"var(--text3)"}}>Hours: {settings.workStart} – {settings.workEnd}</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({ adminData, refreshAdminData }) {
  const { employees, attendance, summary } = adminData;
  const todayActive = attendance.filter(s=>s.status==="active").length;
  const totalMins = attendance.reduce((a,s)=>{
    if(s.status==="active"&&s.clock_in_time){
      return a+Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0));
    }
    return a+(parseInt(s.worked_minutes)||0);
  },0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="fade-up" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>Overview Dashboard</h1>
          <p style={{color:"var(--text3)",fontSize:12,marginTop:2}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric",year:"numeric"})}</p>
        </div>
        <Btn onClick={refreshAdminData} variant="secondary" size="sm"><Icon name="refresh" size={13}/>Refresh</Btn>
      </div>

      <div className="fade-up-d1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <StatCard label="Employees" value={employees.length} icon="users" color="var(--amber)"/>
        <StatCard label="Active Now" value={todayActive} icon="clock" color="var(--green)" sub={`of ${employees.length}`}/>
        <StatCard label="Sessions Today" value={attendance.length} icon="calendar" color="var(--blue)"/>
        <StatCard label="Hours Today" value={`${Math.round(totalMins/60)}h`} icon="trend" color="var(--purple)"/>
      </div>

      <Card className="fade-up-d2">
        <SectionHeader title="Employee Summary"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:480}}>
            <thead><tr><th>Employee</th><th>ID</th><th>Hours</th><th>This Week</th><th>Breaks</th></tr></thead>
            <tbody>
              {summary.length===0
                ? <tr><td colSpan={5} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No data yet.</td></tr>
                : summary.map(s=>(
                  <tr key={s.id}>
                    <td><div style={{fontWeight:600,color:"var(--text)",fontSize:13}}>{s.name}</div><div style={{fontSize:10,color:"var(--text3)"}}>{s.designation||s.department||""}</div></td>
                    <td><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:"var(--amber)",background:"var(--amber-dim)",padding:"2px 8px",borderRadius:6}}>{s.user_id||"—"}</span></td>
                    <td style={{color:"var(--amber)",fontWeight:600}}>{Math.round(s.total_minutes/60)}h</td>
                    <td style={{color:"var(--green)",fontWeight:600}}>{Math.round(s.week_minutes/60)}h</td>
                    <td style={{textAlign:"center"}}><span style={{background:"var(--blue-dim)",color:"var(--blue)",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:600}}>{s.total_breaks||0}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="fade-up-d3">
        <SectionHeader title="Recent Sessions"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:500}}>
            <thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th>Worked</th><th>Status</th></tr></thead>
            <tbody>
              {[...attendance].sort((a,b)=>b.work_date.localeCompare(a.work_date)).slice(0,10).map(s=>(
                <tr key={s.id}>
                  <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{s.name||"—"}</td>
                  <td style={{fontSize:11}}>{fmtDate(s.work_date)}</td>
                  <td style={{fontSize:11}}>{fmtTime(s.clock_in_time)}</td>
                  <td style={{fontSize:11}}>{fmtTime(s.clock_out_time)}</td>
                  <td style={{color:"var(--green)",fontSize:12}}>
                    {s.status==="active"&&s.clock_in_time
                      ? fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0)))
                      : fmtMins(s.worked_minutes)}
                  </td>
                  <td><StatusBadge status={s.status==="completed"?"clocked_out":"clocked_in"}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── WORKSITES PAGE ────────────────────────────────────────────────────────────
function WorksitesPage({ worksites, refreshWorksites, adminData, addToast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingWorksite, setEditingWorksite] = useState(null);
  const [showAssign, setShowAssign] = useState(null);

  const nameRef = useRef(null);
  const latRef = useRef(null);
  const lonRef = useRef(null);
  const radiusRef = useRef(null);
  const notesRef = useRef(null);

  const handleSave = async () => {
    const body = {
      name: nameRef.current?.value,
      latitude: parseFloat(latRef.current?.value),
      longitude: parseFloat(lonRef.current?.value),
      radiusFeet: parseFloat(radiusRef.current?.value)||200,
      notes: notesRef.current?.value,
    };
    if (!body.name||!body.latitude||!body.longitude) { addToast("Name, lat, lon required.", "error"); return; }

    const url = editingWorksite ? `/api/worksites/${editingWorksite.id}` : "/api/worksites";
    const method = editingWorksite ? "PUT" : "POST";
    const res = await authFetch(url, { method, body: JSON.stringify(body) });
    if (!res.ok) { addToast("Failed to save worksite.", "error"); return; }
    addToast(editingWorksite?"Worksite updated.":"Worksite created.", "success");
    setShowAdd(false); setEditingWorksite(null);
    refreshWorksites();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this worksite?")) return;
    await authFetch(`/api/worksites/${id}`, { method:"DELETE" });
    addToast("Worksite deleted.", "info");
    refreshWorksites();
  };

  const handleAssign = async (worksiteId, employeeId, isDefault) => {
    const res = await authFetch(`/api/worksites/${worksiteId}/assign`, {
      method:"POST", body: JSON.stringify({ employeeId, isDefault }),
    });
    if (!res.ok) { addToast("Failed to assign.", "error"); return; }
    addToast("Employee assigned to worksite.", "success");
    refreshWorksites();
  };

  const handleRemove = async (worksiteId, employeeId) => {
    await authFetch(`/api/worksites/${worksiteId}/remove/${employeeId}`, { method:"DELETE" });
    addToast("Employee removed from worksite.", "info");
    refreshWorksites();
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="Worksites" subtitle={`${worksites.length} configured`}
        action={<Btn onClick={()=>{setShowAdd(true);setEditingWorksite(null);}} size="sm">
          <Icon name="plus" size={14} color="#0b0f1a"/>Add Worksite
        </Btn>}/>

      {worksites.length===0 ? (
        <Card style={{textAlign:"center",padding:32,color:"var(--text3)"}}>
          No worksites configured yet. Add one to get started.
        </Card>
      ) : worksites.map(w=>(
        <Card key={w.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:32,height:32,borderRadius:8,background:"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon name="pin" size={15} color="var(--amber)"/>
                </div>
                <div>
                  <div style={{fontWeight:600,color:"var(--text)",fontSize:14}}>{w.name}</div>
                  <div style={{fontSize:11,color:"var(--text3)"}}>{w.latitude?.toFixed(4)}°, {w.longitude?.toFixed(4)}° · {w.radius_feet} ft</div>
                </div>
              </div>
              {w.notes&&<div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>{w.notes}</div>}
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{background:"var(--blue-dim)",color:"var(--blue)",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:600}}>
                  {w.assigned_count||0} employees
                </span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <Btn onClick={()=>setShowAssign(w)} variant="blue" size="sm">
                <Icon name="users" size={13}/>Assign
              </Btn>
              <Btn onClick={()=>{setEditingWorksite(w);setShowAdd(true);}} variant="secondary" size="sm">
                <Icon name="edit" size={13}/>
              </Btn>
              <Btn onClick={()=>handleDelete(w.id)} variant="danger" size="sm">
                <Icon name="x" size={13}/>
              </Btn>
            </div>
          </div>
        </Card>
      ))}

      {/* Add/Edit Modal */}
      {(showAdd||editingWorksite)&&(
        <Modal title={editingWorksite?"Edit Worksite":"New Worksite"} onClose={()=>{setShowAdd(false);setEditingWorksite(null);}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Worksite Name</label>
              <input type="text" ref={nameRef} defaultValue={editingWorksite?.name||""} placeholder="e.g. Main Site Block A" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Latitude</label>
                <input type="text" inputMode="decimal" ref={latRef} defaultValue={editingWorksite?.latitude||""} placeholder="e.g. 33.9495" style={{fontSize:16}} autoCorrect="off"/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Longitude</label>
                <input type="text" inputMode="decimal" ref={lonRef} defaultValue={editingWorksite?.longitude||""} placeholder="e.g. -83.7656" style={{fontSize:16}} autoCorrect="off"/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Radius (feet)</label>
              <input type="text" inputMode="decimal" ref={radiusRef} defaultValue={editingWorksite?.radius_feet||200} placeholder="200" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Notes (optional)</label>
              <input type="text" ref={notesRef} defaultValue={editingWorksite?.notes||""} placeholder="Any notes about this site" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <Btn onClick={handleSave} style={{width:"100%",marginTop:4}}>
              <Icon name="check" size={14} color="#0b0f1a"/>{editingWorksite?"Update Worksite":"Create Worksite"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Assign employees modal */}
      {showAssign&&(
        <Modal title={`Assign Employees — ${showAssign.name}`} onClose={()=>setShowAssign(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:12,color:"var(--text3)",marginBottom:4}}>Select employees to assign to this worksite:</p>
            {adminData.employees.filter(e=>e.role==="employee").map(emp=>{
              const isAssigned = false; // Would need to fetch assignments
              return (
                <div key={emp.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{emp.name}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>{emp.employee_code||""} · {emp.department||""}</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <Btn onClick={()=>handleAssign(showAssign.id, emp.id, true)} size="sm" variant="green">
                      <Icon name="check" size={12}/>Default
                    </Btn>
                    <Btn onClick={()=>handleAssign(showAssign.id, emp.id, false)} size="sm" variant="blue">
                      <Icon name="plus" size={12}/>Add
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── MY ATTENDANCE ─────────────────────────────────────────────────────────────
function MyAttendance() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("week");
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async()=>{
    try{ const r=await authFetch("/api/attendance/me"); const d=await r.json(); setSessions(Array.isArray(d)?d:[]); }catch{}
    setLoading(false);
  },[]);

  useEffect(()=>{fetch_();},[fetch_]);
  useEffect(()=>{const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[fetch_]);

  const filtered = sessions.filter(s=>{
    const diff=Math.floor((Date.now()-new Date(s.work_date).getTime())/86400000);
    if(filter==="week") return diff<7;
    if(filter==="month") return diff<30;
    return true;
  }).sort((a,b)=>b.work_date.localeCompare(a.work_date));

  const totalMins = filtered.reduce((a,s)=>a+(s.worked_minutes||0),0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="My Attendance" subtitle="Your attendance history"
        action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>Refresh</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <StatCard label="Sessions" value={filtered.length} icon="calendar" color="var(--amber)"/>
        <StatCard label="Total Hrs" value={`${Math.round(totalMins/60)}h`} icon="clock" color="var(--green)"/>
        <StatCard label="Daily Avg" value={fmtMins(filtered.length?Math.round(totalMins/filtered.length):0)} icon="trend" color="var(--blue)"/>
      </div>
      <Card>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {[["week","7 Days"],["month","30 Days"],["all","All"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"7px 14px",borderRadius:20,border:"1px solid",borderColor:filter===v?"var(--amber)":"var(--border)",background:filter===v?"var(--amber-dim)":"transparent",color:filter===v?"var(--amber)":"var(--text3)",fontSize:12,cursor:"pointer",fontFamily:"'Syne',sans-serif",fontWeight:600,minHeight:36}}>{l}</button>
          ))}
        </div>
        {loading?<div style={{textAlign:"center",padding:20,color:"var(--text3)"}}>Loading...</div>:(
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{minWidth:420}}>
              <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Break</th><th>Worked</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No records.</td></tr>
                  : filtered.map(s=>(
                    <tr key={s.id}>
                      <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{fmtDate(s.work_date)}</td>
                      <td style={{fontSize:11}}>{fmtTime(s.clock_in_time)}</td>
                      <td style={{fontSize:11}}>{fmtTime(s.clock_out_time)}</td>
                      <td style={{fontSize:11}}>{fmtMins(s.break_minutes)}</td>
                      <td style={{color:"var(--green)",fontWeight:600,fontSize:12}}>
                        {s.status==="active"&&s.clock_in_time
                          ? fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0)))
                          : fmtMins(s.worked_minutes)}
                      </td>
                      <td><span style={{fontSize:10,color:s.status==="completed"?"var(--text3)":"var(--amber)",textTransform:"capitalize"}}>{s.status}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── MY PROFILE ────────────────────────────────────────────────────────────────
function MyProfile({ user, addToast }) {
  const [summary, setSummary] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [worksite, setWorksite] = useState(null);

  useEffect(()=>{
    authFetch("/api/attendance/me/summary").then(r=>r.json()).then(d=>setSummary(d)).catch(()=>{});
    authFetch(`/api/employees/${user.id}/schedule`).then(r=>r.json()).then(d=>setSchedule(d)).catch(()=>{});
    authFetch(`/api/worksites`).then(r=>r.json()).then(d=>{
      if (Array.isArray(d) && d.length > 0) setWorksite(d[0]);
    }).catch(()=>{});
  },[user.id]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="My Profile"/>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid var(--amber-glow)",flexShrink:0}}>
            <Icon name="user" size={24} color="var(--amber)"/>
          </div>
          <div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800}}>{user.name}</h2>
            <p style={{color:"var(--text3)",fontSize:12,textTransform:"capitalize"}}>{user.role}</p>
            {user.userId&&<div style={{marginTop:4,display:"inline-flex",alignItems:"center",gap:6,background:"var(--amber-dim)",padding:"3px 10px",borderRadius:999}}>
              <Icon name="key" size={11} color="var(--amber2)"/>
              <span style={{fontSize:12,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--amber2)"}}>{user.userId}</span>
            </div>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[["Email",user.email||"—"],["Role",user.role]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(30,45,69,0.4)"}}>
              <span style={{fontSize:12,color:"var(--text3)"}}>{k}</span>
              <span style={{fontSize:13,color:"var(--text)",fontWeight:500,textAlign:"right",maxWidth:"60%",wordBreak:"break-all"}}>{v}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Assigned worksite */}
      {worksite&&(
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <Icon name="pin" size={15} color="var(--amber)"/>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Assigned Worksite</h3>
            <span style={{background:"var(--green-dim)",color:"var(--green)",padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:600}}>Active</span>
          </div>
          <div style={{fontSize:13,color:"var(--text)",fontWeight:600,marginBottom:4}}>{worksite.name}</div>
          <div style={{fontSize:12,color:"var(--text3)"}}>{worksite.latitude?.toFixed(4)}°, {worksite.longitude?.toFixed(4)}°</div>
          <div style={{fontSize:12,color:"var(--text3)"}}>Geofence: {worksite.radius_feet} ft</div>
        </Card>
      )}

      {/* Personal schedule */}
      {schedule&&(
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <Icon name="clock" size={15} color="var(--blue)"/>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>My Schedule</h3>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              ["Work Hours",`${schedule.scheduled_start_time?.slice(0,5)||"07:00"} – ${schedule.scheduled_end_time?.slice(0,5)||"17:00"}`],
              ["Working Days",(schedule.working_days||[]).join(", ")],
              ["Grace Period",`${schedule.grace_minutes||15} minutes`],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(30,45,69,0.3)"}}>
                <span style={{fontSize:12,color:"var(--text3)"}}>{k}</span>
                <span style={{fontSize:12,fontWeight:500,color:"var(--text)"}}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {summary&&(
        <Card>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:12}}>Work Summary</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["Total Sessions",summary.total_sessions],["Total Hours",`${Math.round(summary.total_minutes/60)}h`],["Daily Avg",fmtMins(Math.round(summary.avg_daily_minutes))],["This Week",`${Math.round(summary.week_minutes/60)}h`]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(30,45,69,0.3)"}}>
                <span style={{fontSize:12,color:"var(--text3)"}}>{k}</span>
                <span style={{fontSize:13,fontWeight:600,color:"var(--text)",fontFamily:"'Syne',sans-serif"}}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── EMPLOYEE LIST ─────────────────────────────────────────────────────────────
function EmployeeList({ adminData, refreshAdminData, addToast, worksites }) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const userIdRef = useRef(null);
  const deptRef = useRef(null);
  const desigRef = useRef(null);
  const codeRef = useRef(null);
  const [role, setRole] = useState("employee");
  const [showPass, setShowPass] = useState(false);

  const employees = adminData.employees.filter(u=>
    u.name?.toLowerCase().includes(search.toLowerCase())||
    u.email?.toLowerCase().includes(search.toLowerCase())||
    u.employee_code?.toLowerCase().includes(search.toLowerCase())||
    u.user_id?.includes(search)
  );

  const handleAdd = async()=>{
    const name = nameRef.current?.value;
    const pass = passRef.current?.value;
    if(!name||!pass){addToast("Name and password required.","error");return;}
    const res=await authFetch("/api/admin/employees",{method:"POST",body:JSON.stringify({
      name, email:emailRef.current?.value||null,
      password:pass, role,
      department:deptRef.current?.value,
      designation:desigRef.current?.value,
      employeeCode:codeRef.current?.value,
      userId:userIdRef.current?.value||null,
    })});
    const d=await res.json();
    if(!res.ok){addToast(d.error||"Failed.","error");return;}
    addToast(`Employee added. User ID: ${d.userId}`,"success");
    setAdding(false); refreshAdminData();
  };

  const handleDelete=async(uid)=>{
    if(!confirm("Deactivate this employee?"))return;
    await authFetch(`/api/admin/employees/${uid}`,{method:"DELETE"});
    addToast("Employee deactivated.","info");refreshAdminData();
  };

  const openSchedule = async (emp) => {
    setEditingSchedule(emp);
    const r = await authFetch(`/api/employees/${emp.id}/schedule`);
    if (r.ok) { const d = await r.json(); setScheduleData(d); }
    else setScheduleData(null);
  };

  const startRef = useRef(null);
  const endRef = useRef(null);
  const graceRef = useRef(null);

  const saveSchedule = async () => {
    if (!editingSchedule) return;
    const res = await authFetch(`/api/employees/${editingSchedule.id}/schedule`, {
      method:"PUT",
      body:JSON.stringify({
        scheduledStartTime: startRef.current?.value||"07:00",
        scheduledEndTime: endRef.current?.value||"17:00",
        graceMinutes: parseInt(graceRef.current?.value)||15,
        workingDays: ["Mon","Tue","Wed","Thu","Fri"],
      }),
    });
    if (!res.ok) { addToast("Failed to save schedule.","error"); return; }
    addToast("Schedule saved.","success");
    setEditingSchedule(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="Employees" subtitle={`${employees.length} members`}
        action={<Btn onClick={()=>setAdding(a=>!a)} variant={adding?"secondary":"primary"} size="sm">
          {adding?"Cancel":<><Icon name="plus" size={13} color="#0b0f1a"/>Add</>}
        </Btn>}/>

      {adding&&(
        <Card style={{border:"1px solid var(--amber-glow)"}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:14,color:"var(--amber)"}}>New Employee</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Full Name *</label>
              <input type="text" ref={nameRef} placeholder="Full name" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>User ID (4-char)</label>
                <input type="text" ref={userIdRef} placeholder="Auto" maxLength={4} style={{fontSize:16,textAlign:"center",letterSpacing:"0.2em"}} autoCorrect="off" autoCapitalize="off"/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Password *</label>
                <div style={{position:"relative"}}>
                  <input type={showPass?"text":"password"} ref={passRef} placeholder="Password" style={{fontSize:16,paddingRight:44}} autoCorrect="off"/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text3)",cursor:"pointer",padding:4,display:"flex",minWidth:28,minHeight:28,alignItems:"center",justifyContent:"center"}}>
                    <Icon name={showPass?"eyeOff":"eye"} size={16}/>
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Email (optional)</label>
              <input type="email" ref={emailRef} placeholder="email@brightsky.com" style={{fontSize:16}} autoCorrect="off" autoCapitalize="off"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Department</label>
                <input type="text" ref={deptRef} placeholder="e.g. Construction" style={{fontSize:16}} autoCorrect="off"/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Designation</label>
                <input type="text" ref={desigRef} placeholder="e.g. Foreman" style={{fontSize:16}} autoCorrect="off"/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Employee Code</label>
              <input type="text" ref={codeRef} placeholder="e.g. BSC-012" style={{fontSize:16}} autoCorrect="off" autoCapitalize="characters"/>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Role</label>
              <select value={role} onChange={e=>setRole(e.target.value)} style={{fontSize:16}}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <Btn onClick={handleAdd} style={{width:"100%"}}><Icon name="check" size={14} color="#0b0f1a"/>Add Employee</Btn>
        </Card>
      )}

      <Card>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, code, or User ID…" style={{marginBottom:14,fontSize:16}} autoCorrect="off"/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {employees.length===0
            ? <div style={{textAlign:"center",color:"var(--text3)",padding:20}}>No employees found.</div>
            : employees.map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px",background:"var(--bg3)",borderRadius:10,border:"1px solid var(--border)"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon name="user" size={16} color="var(--amber2)"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,color:"var(--text)",fontSize:13}}>{u.name||u.full_name}</div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>{u.email||""} · {u.department||""}</div>
                  <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                    {u.user_id&&<span style={{background:"var(--amber-dim)",color:"var(--amber2)",padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>ID: {u.user_id}</span>}
                    <span style={{background:"rgba(100,116,139,0.12)",color:"var(--text3)",padding:"1px 7px",borderRadius:999,fontSize:10,textTransform:"capitalize"}}>{u.role}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <Btn onClick={()=>openSchedule(u)} variant="blue" size="sm" style={{padding:"6px 10px"}}>
                    <Icon name="clock" size={12}/>
                  </Btn>
                  <Btn onClick={()=>handleDelete(u.id)} variant="danger" size="sm" style={{padding:"6px 10px"}}>
                    <Icon name="x" size={12}/>
                  </Btn>
                </div>
              </div>
            ))
          }
        </div>
      </Card>

      {/* Schedule editor modal */}
      {editingSchedule&&(
        <Modal title={`Schedule — ${editingSchedule.name}`} onClose={()=>setEditingSchedule(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Start Time</label>
                <input type="time" ref={startRef} defaultValue={scheduleData?.scheduled_start_time?.slice(0,5)||"07:00"} style={{fontSize:16}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>End Time</label>
                <input type="time" ref={endRef} defaultValue={scheduleData?.scheduled_end_time?.slice(0,5)||"17:00"} style={{fontSize:16}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Syne',sans-serif",fontWeight:600}}>Grace Period (minutes)</label>
              <input type="text" inputMode="numeric" ref={graceRef} defaultValue={scheduleData?.grace_minutes||15} placeholder="15" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div style={{padding:"12px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
              <div style={{fontSize:12,color:"var(--text3)",marginBottom:4}}>Working Days</div>
              <div style={{fontSize:13,color:"var(--text)"}}>{(scheduleData?.working_days||["Mon","Tue","Wed","Thu","Fri"]).join(", ")}</div>
            </div>
            <Btn onClick={saveSchedule} style={{width:"100%",marginTop:4}}>
              <Icon name="check" size={14} color="#0b0f1a"/>Save Schedule
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── ATTENDANCE PAGE ───────────────────────────────────────────────────────────
function AttendancePage({ adminData }) {
  const [empFilter, setEmpFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async()=>{
    const p=new URLSearchParams();
    if(empFilter!=="all") p.set("user_id",empFilter);
    if(dateFrom) p.set("date_from",dateFrom);
    if(dateTo) p.set("date_to",dateTo);
    setLoading(true);
    try{const r=await authFetch(`/api/admin/attendance?${p}`);const d=await r.json();setRecords(Array.isArray(d)?d:[]);}catch{}
    setLoading(false);
  },[empFilter,dateFrom,dateTo]);

  useEffect(()=>{fetch_();},[fetch_]);
  useEffect(()=>{const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[fetch_]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="Attendance Records" subtitle={`${records.length} records`}
        action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>Refresh</Btn>}/>
      <Card>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{fontSize:16}}>
            <option value="all">All Employees</option>
            {adminData.employees.map(u=><option key={u.id} value={u.id}>{u.name} {u.user_id?`(${u.user_id})`:""}</option>)}
          </select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{fontSize:16}}/>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{fontSize:16}}/>
          </div>
        </div>
        {loading?<div style={{textAlign:"center",padding:20,color:"var(--text3)"}}>Loading...</div>:(
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{minWidth:480}}>
              <thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th>Break</th><th>Worked</th><th>Status</th></tr></thead>
              <tbody>
                {records.length===0
                  ? <tr><td colSpan={7} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No records.</td></tr>
                  : records.map(s=>(
                    <tr key={s.id}>
                      <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{s.name||"—"}</td>
                      <td style={{fontSize:11}}>{fmtDate(s.work_date)}</td>
                      <td style={{fontSize:11}}>{fmtTime(s.clock_in_time)}</td>
                      <td style={{fontSize:11}}>{fmtTime(s.clock_out_time)}</td>
                      <td style={{fontSize:11}}>{fmtMins(s.break_minutes)}</td>
                      <td style={{color:"var(--green)",fontWeight:600,fontSize:12}}>
                        {s.status==="active"&&s.clock_in_time
                          ? fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0)))
                          : fmtMins(s.worked_minutes)}
                      </td>
                      <td><span style={{fontSize:10,color:s.status==="completed"?"var(--text3)":"var(--amber)",textTransform:"capitalize"}}>{s.status}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function ReportsPage({ adminData }) {
  const [summary, setSummary] = useState(adminData.summary||[]);
  const [loading, setLoading] = useState(false);
  useEffect(()=>{setSummary(adminData.summary||[]);},[adminData.summary]);
  const fetch_ = useCallback(async()=>{
    setLoading(true);
    try{const r=await authFetch("/api/admin/reports/summary");if(r.ok){const d=await r.json();setSummary(Array.isArray(d)?d:[]);}}catch{}
    setLoading(false);
  },[]);
  useEffect(()=>{fetch_();},[fetch_]);
  useEffect(()=>{const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[fetch_]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="Reports" subtitle="Hours summary & analytics"
        action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>Refresh</Btn>}/>
      {summary.length>0&&(
        <Card>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:12}}>Weekly Hours</h3>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100}}>
            {summary.map(u=>{
              const h=Math.round(u.week_minutes/60);
              const barH=Math.min(90,Math.round(h/50*90));
              return (
                <div key={u.id} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,gap:3}}>
                  <span style={{fontSize:9,color:"var(--amber)",fontFamily:"'Syne',sans-serif",fontWeight:700}}>{h}h</span>
                  <div style={{width:"100%",height:barH||3,borderRadius:"3px 3px 0 0",background:"linear-gradient(180deg,var(--amber) 0%,rgba(245,158,11,0.4) 100%)",minHeight:3}}/>
                  <span style={{fontSize:8,color:"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",textAlign:"center"}}>{u.name?.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      <Card>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:500}}>
            <thead><tr><th>Employee</th><th>ID</th><th>Sessions</th><th>Total Hrs</th><th>This Week</th><th>Breaks</th></tr></thead>
            <tbody>
              {summary.length===0
                ? <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No data.</td></tr>
                : summary.map(u=>(
                  <tr key={u.id}>
                    <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{u.name}</td>
                    <td><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"var(--amber)"}}>{u.user_id||"—"}</span></td>
                    <td style={{fontWeight:700,color:"var(--text)"}}>{u.total_sessions}</td>
                    <td style={{color:"var(--amber)",fontWeight:600}}>{Math.round(u.total_minutes/60)}h</td>
                    <td style={{color:"var(--green)",fontWeight:600}}>{Math.round(u.week_minutes/60)}h</td>
                    <td style={{textAlign:"center"}}><span style={{background:"var(--blue-dim)",color:"var(--blue)",padding:"2px 7px",borderRadius:999,fontSize:11,fontWeight:600}}>{u.total_breaks||0}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPage({ settings, addToast, refreshSettings }) {
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({
    autoClockInEnabled: settings.autoClockInEnabled ?? true,
    autoBreakOnExitEnabled: settings.autoBreakOnExitEnabled ?? true,
    autoCorrectionEnabled: settings.autoCorrectionEnabled ?? true,
  });

  useEffect(() => {
    setToggles({
      autoClockInEnabled: settings.autoClockInEnabled ?? true,
      autoBreakOnExitEnabled: settings.autoBreakOnExitEnabled ?? true,
      autoCorrectionEnabled: settings.autoCorrectionEnabled ?? true,
    });
  }, [settings]);

  const refs = {
    companyName: useRef(null), siteName: useRef(null),
    latitude: useRef(null), longitude: useRef(null),
    radiusFeet: useRef(null), workStart: useRef(null),
    workEnd: useRef(null), maxBreaks: useRef(null), minBreak: useRef(null),
  };

  const handleSave = async () => {
    const lat = refs.latitude.current?.value;
    const lon = refs.longitude.current?.value;
    const radius = refs.radiusFeet.current?.value;
    if (!lat||!lon||!radius) { addToast("Latitude, longitude and radius are required.", "error"); return; }
    setSaving(true);
    const res = await authFetch("/api/settings", { method:"PUT", body:JSON.stringify({
      companyName: refs.companyName.current?.value,
      siteName: refs.siteName.current?.value,
      latitude: parseFloat(lat), longitude: parseFloat(lon),
      radiusFeet: parseFloat(radius),
      workingHoursStart: refs.workStart.current?.value,
      workingHoursEnd: refs.workEnd.current?.value,
      autoClockInEnabled: toggles.autoClockInEnabled,
      autoBreakOnExitEnabled: toggles.autoBreakOnExitEnabled,
      autoCorrectionEnabled: toggles.autoCorrectionEnabled,
    })});
    const d = await res.json();
    if (!res.ok) { addToast(d.error||"Failed.", "error"); setSaving(false); return; }
    localStorage.removeItem("bsc_settings");
    await refreshSettings();
    addToast("Settings saved and applied.", "success");
    setSaving(false);
  };

  const Toggle = ({ label, value, onChange, desc }) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid rgba(30,45,69,0.4)"}}>
      <div style={{flex:1,paddingRight:12}}>
        <div style={{fontSize:13,color:"var(--text)",fontWeight:500}}>{label}</div>
        {desc&&<div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{desc}</div>}
      </div>
      <button onClick={()=>onChange(!value)} style={{width:44,height:26,borderRadius:13,border:"none",cursor:"pointer",background:value?"var(--amber)":"var(--border)",position:"relative",transition:"background 0.2s",flexShrink:0,minWidth:44}}>
        <div style={{width:20,height:20,borderRadius:"50%",background:"white",position:"absolute",top:3,transition:"left 0.2s",left:value?21:3,boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
      </button>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="Settings" subtitle="Configure worksite and rules"/>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Icon name="pin" size={15} color="var(--amber)"/>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Site Location</h3>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            ["COMPANY NAME","companyName","text",settings.companyName||"","Company name"],
            ["SITE NAME","siteName","text",settings.siteName||"","Site address"],
          ].map(([label,key,type,def,ph])=>(
            <div key={key}>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}>{label}</label>
              <input type={type} ref={refs[key]} defaultValue={def} placeholder={ph} style={{fontSize:16}} autoCorrect="off"/>
            </div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}>LATITUDE</label>
              <input type="text" inputMode="decimal" ref={refs.latitude} defaultValue={settings.latitude??""} placeholder="e.g. 33.9495" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}>LONGITUDE</label>
              <input type="text" inputMode="decimal" ref={refs.longitude} defaultValue={settings.longitude??""} placeholder="e.g. -83.7656" style={{fontSize:16}} autoCorrect="off"/>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}>GEOFENCE RADIUS (FEET)</label>
            <input type="text" inputMode="decimal" ref={refs.radiusFeet} defaultValue={settings.radiusFeet??""} placeholder="200" style={{fontSize:16}} autoCorrect="off"/>
            <p style={{fontSize:10,color:"var(--text3)",marginTop:4}}>200 ft for on-site use · 999999999 for remote testing</p>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Icon name="clock" size={15} color="var(--blue)"/>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Work Schedule</h3>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}>START TIME</label>
            <input type="time" ref={refs.workStart} defaultValue={settings.workStart||"07:00"} style={{fontSize:16}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}>END TIME</label>
            <input type="time" ref={refs.workEnd} defaultValue={settings.workEnd||"17:00"} style={{fontSize:16}}/>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <Icon name="refresh" size={15} color="var(--green)"/>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Automation</h3>
        </div>
        <Toggle label="Auto Clock-In" value={toggles.autoClockInEnabled} onChange={v=>setToggles(t=>({...t,autoClockInEnabled:v}))} desc="Clock in when entering the geofence"/>
        <Toggle label="Auto Break on Exit" value={toggles.autoBreakOnExitEnabled} onChange={v=>setToggles(t=>({...t,autoBreakOnExitEnabled:v}))} desc="Start break when leaving the geofence"/>
        <Toggle label="Auto Punch Correction" value={toggles.autoCorrectionEnabled} onChange={v=>setToggles(t=>({...t,autoCorrectionEnabled:v}))} desc="Fix missing punches automatically"/>
      </Card>
      <Btn onClick={handleSave} loading={saving} size="lg" style={{width:"100%"}}>
        <Icon name="check" size={15} color="#0b0f1a"/>Save All Settings
      </Btn>
    </div>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function ExportPage({ adminData, addToast }) {
  const [empFilter, setEmpFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async()=>{
    setLoading(true);
    const p=new URLSearchParams();
    if(empFilter!=="all") p.set("user_id",empFilter);
    if(dateFrom) p.set("date_from",dateFrom);
    if(dateTo) p.set("date_to",dateTo);
    const token=localStorage.getItem("accessToken");
    const res=await fetch(`${API}/api/export/csv?${p}`,{credentials:"include",headers:{Authorization:`Bearer ${token}`}});
    if(!res.ok){addToast("Export failed.","error");setLoading(false);return;}
    const blob=await res.blob();
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`bsc_attendance_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    addToast("CSV downloaded.","success");
    setLoading(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="Export Center" subtitle="Download attendance data as CSV"/>
      <Card>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
          <div>
            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5}}>Employee</label>
            <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{fontSize:16}}>
              <option value="all">All Employees</option>
              {adminData.employees.map(u=><option key={u.id} value={u.id}>{u.name} {u.user_id?`(${u.user_id})`:""}</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5}}>From Date</label>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{fontSize:16}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5}}>To Date</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{fontSize:16}}/>
            </div>
          </div>
        </div>
        <Btn onClick={handleExport} loading={loading} style={{width:"100%"}}>
          <Icon name="download" size={15} color="#0b0f1a"/>Export to CSV
        </Btn>
      </Card>
    </div>
  );
}

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    authFetch("/api/audit-logs").then(r=>r.json()).then(d=>{setLogs(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));
  },[]);
  const colors={clock_in:"var(--green)",clock_out:"var(--red)",break_start:"var(--amber)",break_end:"var(--amber2)",update_settings:"var(--blue)",auto_clock_in:"var(--purple)"};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title="Audit Logs" subtitle="All system events"/>
      <Card>
        {loading?<div style={{textAlign:"center",padding:24,color:"var(--text3)"}}>Loading...</div>:
         logs.length===0?<div style={{textAlign:"center",padding:24,color:"var(--text3)"}}>No logs yet.</div>:(
          <div style={{display:"flex",flexDirection:"column"}}>
            {logs.map((log,i)=>(
              <div key={log.id} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<logs.length-1?"1px solid rgba(30,45,69,0.35)":"none",alignItems:"flex-start"}}>
                <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,marginTop:4,background:colors[log.action_type]||"var(--text3)"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:"var(--text)",fontWeight:500}}>
                    <span style={{color:colors[log.action_type]||"var(--text2)"}}>{(log.action_type||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</span>
                  </div>
                  <div style={{fontSize:10,color:"var(--text3)",marginTop:1}}>Entity: {log.entity_type} · IP: {log.ip_address}</div>
                </div>
                <div style={{fontSize:10,color:"var(--text3)",flexShrink:0,textAlign:"right"}}>
                  <div>{fmtDate(log.created_at)}</div>
                  <div>{fmtTime(log.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}