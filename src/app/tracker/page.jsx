"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://brightsky-api.sahils2.workers.dev";

// ── Device fingerprint for security ──────────────────────────────────────────
const getDeviceFingerprint = () => {
  try {
    const fp = [
      navigator.userAgent, navigator.language, screen.width, screen.height,
      screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency||"",
    ].join("|");
    let hash = 0;
    for (let i = 0; i < fp.length; i++) {
      hash = ((hash << 5) - hash) + fp.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch { return "unknown"; }
};

// ── Vibration helper ──────────────────────────────────────────────────────────
const vibrate = (pattern) => {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
};

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    signIn:"Sign In", userId:"User ID", password:"Password",
    clockIn:"Clock In", clockOut:"Clock Out", startBreak:"Start Break", endBreak:"End Break",
    onSite:"On Site", offSite:"Off Site", locating:"Locating…",
    dashboard:"Dashboard", employees:"Employees", worksites:"Worksites",
    attendance:"Attendance", reports:"Reports", settings:"Settings",
    export:"Export", auditLogs:"Audit Logs", myAttendance:"My Attendance",
    myProfile:"My Profile", signOut:"Sign Out",
    today:"Today", status:"Status", breaks:"Breaks", punches:"Punches",
    active:"Active", onBreak:"On Break", inactive:"Inactive",
    overtime:"Overtime", working:"Working", clockedIn:"Clocked In",
    clockedOut:"Clocked Out", autoClockIn:"Auto Clock-In",
    noActivity:"No activity yet today.", morning:"Morning",
    afternoon:"Afternoon", evening:"Evening",
    welcomeBack:"Welcome back",
    missedClockOut:"You forgot to clock out!",
    missedClockOutMsg:"You have an active session from yesterday. Please clock out now.",
    assignedWorksite:"Assigned Worksite", mySchedule:"My Schedule",
    workHours:"Work Hours", workingDays:"Working Days", grace:"Grace Period",
    language:"Language", english:"English", spanish:"Spanish",
    updateLocation:"Update My Location", locationUpdated:"Location updated.",
    noWorksiteAssigned:"No worksite assigned",
    adminLogin:"Admin login with email",
    useUserId:"Use 4-digit User ID instead",
    tapToChange:"Tap photo to change",
    refresh:"Refresh", save:"Save", cancel:"Cancel",
    add:"Add", edit:"Edit", delete:"Delete", assign:"Assign",
    remove:"Remove", close:"Close", search:"Search",
  },
  es: {
    signIn:"Iniciar Sesión", userId:"ID de Usuario", password:"Contraseña",
    clockIn:"Registrar Entrada", clockOut:"Registrar Salida",
    startBreak:"Iniciar Descanso", endBreak:"Terminar Descanso",
    onSite:"En Sitio", offSite:"Fuera del Sitio", locating:"Localizando…",
    dashboard:"Panel", employees:"Empleados", worksites:"Sitios de Trabajo",
    attendance:"Asistencia", reports:"Reportes", settings:"Configuración",
    export:"Exportar", auditLogs:"Registros de Auditoría",
    myAttendance:"Mi Asistencia", myProfile:"Mi Perfil", signOut:"Cerrar Sesión",
    today:"Hoy", status:"Estado", breaks:"Descansos", punches:"Registros",
    active:"Activo", onBreak:"En Descanso", inactive:"Inactivo",
    overtime:"Horas Extra", working:"Trabajando", clockedIn:"Entrada Registrada",
    clockedOut:"Salida Registrada", autoClockIn:"Entrada Automática",
    noActivity:"Sin actividad hoy.", morning:"Buenos Días",
    afternoon:"Buenas Tardes", evening:"Buenas Noches",
    welcomeBack:"Bienvenido",
    missedClockOut:"¡Olvidaste registrar tu salida!",
    missedClockOutMsg:"Tienes una sesión activa de ayer. Por favor registra tu salida ahora.",
    assignedWorksite:"Sitio Asignado", mySchedule:"Mi Horario",
    workHours:"Horario", workingDays:"Días de Trabajo", grace:"Período de Gracia",
    language:"Idioma", english:"Inglés", spanish:"Español",
    updateLocation:"Actualizar Mi Ubicación", locationUpdated:"Ubicación actualizada.",
    noWorksiteAssigned:"Sin sitio asignado",
    adminLogin:"Acceso de administrador con correo",
    useUserId:"Usar ID de 4 dígitos",
    tapToChange:"Toca para cambiar foto",
    refresh:"Actualizar", save:"Guardar", cancel:"Cancelar",
    add:"Agregar", edit:"Editar", delete:"Eliminar", assign:"Asignar",
    remove:"Quitar", close:"Cerrar", search:"Buscar",
  },
};

const authFetch = async (path, opts = {}) => {
  let token = localStorage.getItem("accessToken");
  let res = await fetch(`${API}${path}`, {
    ...opts, credentials:"include",
    headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}),...opts.headers},
  });
  if (res.status === 401) {
    try {
      const r = await fetch(`${API}/api/auth/refresh`,{method:"POST",credentials:"include"});
      if (r.ok) {
        const d = await r.json();
        localStorage.setItem("accessToken", d.accessToken);
        token = d.accessToken;
        res = await fetch(`${API}${path}`,{
          ...opts,credentials:"include",
          headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...opts.headers},
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
      --blue:#3b82f6; --blue-dim:rgba(59,130,246,0.12); --purple:#8b5cf6; --orange:#f97316;
      --text:#f1f5f9; --text2:#94a3b8; --text3:#64748b; --radius:12px; --radius-lg:16px;
    }
    html,body{height:100%;-webkit-text-size-adjust:100%;}
    body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;}
    ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:var(--bg2);} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
    @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6;}100%{transform:scale(2.4);opacity:0;}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes badge-in{from{transform:scale(0.7);opacity:0;}to{transform:scale(1);opacity:1;}}
    @keyframes shake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-6px);}40%,80%{transform:translateX(6px);}}
    @keyframes overtime-pulse{0%,100%{opacity:1;}50%{opacity:0.6;}}
    .fade-up{animation:fadeUp 0.35s ease both;}
    .fade-up-d1{animation:fadeUp 0.35s 0.05s ease both;}
    .fade-up-d2{animation:fadeUp 0.35s 0.10s ease both;}
    .fade-up-d3{animation:fadeUp 0.35s 0.15s ease both;}
    .fade-up-d4{animation:fadeUp 0.35s 0.20s ease both;}
    .spin{animation:spin 1s linear infinite;}
    .shake{animation:shake 0.5s ease;}
    .overtime-pulse{animation:overtime-pulse 2s ease infinite;}
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
    .pin-input{letter-spacing:0.3em;font-size:28px;font-family:'Syne',sans-serif;font-weight:700;text-align:center;}
    .pin-dot{width:14px;height:14px;border-radius:50%;background:var(--amber);display:inline-block;flex-shrink:0;transition:all 0.25s;box-shadow:0 0 8px var(--amber-glow);}
    .pin-dot.empty{background:transparent;border:2px solid var(--text3);box-shadow:none;}
  `}</style>
);

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}) : "—";
const fmtMins = (m) => { if(!m&&m!==0) return "—"; const h=Math.floor(m/60),min=m%60; return h?`${h}h ${min}m`:`${min}m`; };

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
};

// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, lang="en" }) => {
  const t = T[lang]||T.en;
  const cfg = {
    clocked_in:    {label:t.clockedIn,   bg:"var(--green-dim)",c:"var(--green)", dot:true},
    on_break:      {label:t.onBreak,     bg:"var(--amber-dim)",c:"var(--amber2)",dot:true},
    clocked_out:   {label:t.clockedOut,  bg:"rgba(100,116,139,0.12)",c:"var(--text3)",dot:false},
    overtime:      {label:t.overtime,    bg:"rgba(249,115,22,0.12)",c:"var(--orange)",dot:true},
    auto_corrected:{label:"Auto Fixed",  bg:"var(--blue-dim)", c:"var(--blue)",  dot:false},
  }[status]||{label:status||"Unknown",bg:"rgba(100,116,139,0.12)",c:"var(--text3)",dot:false};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,background:cfg.bg,color:cfg.c,
      padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:600,letterSpacing:"0.03em",
      fontFamily:"'Syne',sans-serif",animation:"badge-in 0.2s ease both",whiteSpace:"nowrap"}}>
      {cfg.dot&&<span style={{width:6,height:6,borderRadius:"50%",background:cfg.c,
        boxShadow:`0 0 5px ${cfg.c}`,display:"inline-block",flexShrink:0}}/>}
      {cfg.label}
    </span>
  );
};

const Card = ({children,style={},className=""}) => (
  <div className={className} style={{background:"var(--card)",border:"1px solid var(--border)",
    borderRadius:"var(--radius-lg)",padding:16,...style}}>{children}</div>
);

const StatCard = ({label,value,icon,color="var(--amber)",sub,flash}) => (
  <Card style={{display:"flex",flexDirection:"column",gap:6,
    ...(flash?{border:"1px solid rgba(249,115,22,0.4)",background:"rgba(249,115,22,0.05)"}:{})}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <span style={{fontSize:10,color:"var(--text3)",fontFamily:"'Syne',sans-serif",
        letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:600,lineHeight:1.3}}>{label}</span>
      <span style={{color,background:`${color}22`,padding:"5px 6px",borderRadius:7,
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name={icon} size={13} color={color}/>
      </span>
    </div>
    <div style={{fontSize:22,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--text)",
      lineHeight:1.2,wordBreak:"break-word",
      ...(flash?{color:"var(--orange)"}:{})}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"var(--text3)"}}>{sub}</div>}
  </Card>
);

const SectionHeader = ({title,subtitle,action}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
    marginBottom:16,flexWrap:"wrap",gap:8}}>
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"var(--text)"}}>{title}</h2>
      {subtitle&&<p style={{color:"var(--text3)",fontSize:12,marginTop:3}}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Btn = ({children,onClick,variant="primary",size="md",disabled,style:s={},loading}) => {
  const sizes={sm:{padding:"7px 14px",fontSize:12.5},md:{padding:"11px 20px",fontSize:14},lg:{padding:"15px 24px",fontSize:15}};
  const variants={
    primary:{background:"var(--amber)",color:"#0b0f1a",fontWeight:700},
    secondary:{background:"var(--bg3)",color:"var(--text2)",border:"1px solid var(--border)"},
    danger:{background:"var(--red-dim)",color:"var(--red)",border:"1px solid rgba(239,68,68,0.25)"},
    ghost:{background:"transparent",color:"var(--text2)",border:"1px solid var(--border)"},
    green:{background:"var(--green-dim)",color:"var(--green)",border:"1px solid rgba(16,185,129,0.25)",fontWeight:600},
    blue:{background:"var(--blue-dim)",color:"var(--blue)",border:"1px solid rgba(59,130,246,0.25)",fontWeight:600},
    orange:{background:"rgba(249,115,22,0.12)",color:"var(--orange)",border:"1px solid rgba(249,115,22,0.25)",fontWeight:600},
  };
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{...sizes[size],...variants[variant],borderRadius:9,display:"inline-flex",
        alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'DM Sans',sans-serif",
        transition:"all 0.18s",minHeight:44,...s}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.filter="brightness(1.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.filter="";}}>
      {loading&&<span className="spin" style={{width:14,height:14,border:"2px solid currentColor",
        borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",flexShrink:0}}/>}
      {children}
    </button>
  );
};

const Toast = ({toasts,removeToast}) => (
  <div style={{position:"fixed",bottom:16,left:16,right:16,zIndex:9999,
    display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
    {toasts.map(t=>(
      <div key={t.id} className="fade-up" style={{
        background:t.type==="error"?"#1a0a0a":t.type==="success"?"#071a12":t.type==="warning"?"#1a1000":"#0f1829",
        border:`1px solid ${t.type==="error"?"var(--red)":t.type==="success"?"var(--green)":t.type==="warning"?"var(--orange)":"var(--amber)"}`,
        borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",
        color:t.type==="error"?"var(--red)":t.type==="success"?"var(--green)":t.type==="warning"?"var(--orange)":"var(--amber)",
        boxShadow:"0 4px 24px rgba(0,0,0,0.5)",pointerEvents:"all"}}>
        <Icon name={t.type==="error"?"x":t.type==="success"?"check":t.type==="warning"?"alert":"alert"} size={15}/>
        <span style={{fontSize:13,color:"var(--text)",flex:1}}>{t.message}</span>
        <button onClick={()=>removeToast(t.id)} style={{background:"none",color:"var(--text3)",
          fontSize:20,lineHeight:1,padding:"0 2px"}}>×</button>
      </div>
    ))}
  </div>
);

const LocationIndicator = ({onSite,distance,loading,lang="en"}) => {
  const t = T[lang]||T.en;
  if (loading) return (
    <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(100,116,139,0.1)",
      border:"1px solid rgba(100,116,139,0.2)",borderRadius:8,padding:"6px 10px",
      fontSize:11.5,color:"var(--text3)",whiteSpace:"nowrap"}}>
      <span className="spin" style={{width:10,height:10,border:"2px solid currentColor",
        borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",flexShrink:0}}/>
      <span style={{fontWeight:500,fontSize:11}}>{t.locating}</span>
    </div>
  );
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,
      background:onSite?"var(--green-dim)":"var(--red-dim)",
      border:`1px solid ${onSite?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.25)"}`,
      borderRadius:8,padding:"6px 10px",fontSize:11.5,
      color:onSite?"var(--green)":"var(--red)",whiteSpace:"nowrap"}}>
      <Icon name={onSite?"wifi":"wifiOff"} size={12}/>
      <span style={{fontWeight:600}}>{onSite?t.onSite:t.offSite}</span>
      {distance!=null&&<span style={{opacity:0.7}}>· {Math.round(distance)}ft</span>}
    </div>
  );
};

const Icon = ({name,size=18,color="currentColor",style={}}) => {
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
    globe:<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    navigation:<><polygon points="3 11 22 2 13 21 11 13 3 11"/></>,
    zap:<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    bell:<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{display:"inline-block",flexShrink:0,...style}}>
      {icons[name]||null}
    </svg>
  );
};

const Modal = ({title,onClose,children,fullScreen=false}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,
    display:"flex",alignItems:fullScreen?"stretch":"flex-end",justifyContent:"center"}}
    onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{
      background:"var(--bg2)",
      borderRadius:fullScreen?"0":"20px 20px 0 0",
      width:"100%",maxWidth:600,
      maxHeight:fullScreen?"100vh":"92vh",
      overflowY:"auto",padding:20,
      ...(fullScreen?{height:"100vh"}:{})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"var(--bg3)",border:"none",
          color:"var(--text2)",width:32,height:32,borderRadius:"50%",
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <Icon name="close" size={16}/>
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── SIDEBAR PROFILE ───────────────────────────────────────────────────────────
function SidebarProfile({currentUser,handleLogout,lang,setLang}) {
  const [photo,setPhoto]=useState(null);
  const [showMenu,setShowMenu]=useState(false);
  const galleryRef=useRef(null);
  const cameraRef=useRef(null);
  const t=T[lang]||T.en;

  useEffect(()=>{
    try{const s=localStorage.getItem(`bsc_photo_${currentUser.id}`);if(s)setPhoto(s);}catch{}
  },[currentUser.id]);

  const processFile=(file)=>{
    if(!file)return;
    if(file.size>5*1024*1024){alert("Photo must be under 5MB.");return;}
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement("canvas");
        const MAX=300;let w=img.width,h=img.height;
        if(w>h){if(w>MAX){h=h*MAX/w;w=MAX;}}else{if(h>MAX){w=w*MAX/h;h=MAX;}}
        canvas.width=w;canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL("image/jpeg",0.7);
        setPhoto(compressed);
        try{localStorage.setItem(`bsc_photo_${currentUser.id}`,compressed);}catch{}
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{padding:"12px",borderTop:"1px solid var(--border)"}}>
      <div style={{background:"var(--bg3)",borderRadius:12,padding:"12px",border:"1px solid var(--border)"}}>
        {/* Profile row */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{position:"relative",flexShrink:0}} onClick={()=>setShowMenu(s=>!s)}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"var(--amber-dim)",
              display:"flex",alignItems:"center",justifyContent:"center",
              border:"2px solid var(--amber-glow)",overflow:"hidden",cursor:"pointer"}}>
              {photo?<img src={photo} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                :<Icon name="user" size={22} color="var(--amber2)"/>}
            </div>
            <div style={{position:"absolute",bottom:0,right:0,width:18,height:18,borderRadius:"50%",
              background:"var(--amber)",display:"flex",alignItems:"center",justifyContent:"center",
              border:"2px solid var(--bg3)",pointerEvents:"none"}}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0b0f1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <div style={{overflow:"hidden",flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text)",
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.name}</div>
            <div style={{fontSize:11,color:"var(--text3)",textTransform:"capitalize",marginTop:1}}>{currentUser.role}</div>
            {currentUser.userId&&(
              <div style={{display:"inline-flex",alignItems:"center",gap:4,
                background:"var(--amber-dim)",padding:"2px 8px",borderRadius:999,marginTop:3}}>
                <Icon name="key" size={9} color="var(--amber2)"/>
                <span style={{fontSize:11,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"var(--amber2)"}}>{currentUser.userId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Photo menu */}
        {showMenu&&(
          <div style={{marginBottom:12,background:"var(--bg2)",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)"}}>
            <div style={{padding:"8px 12px",fontSize:11,color:"var(--text3)",fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",borderBottom:"1px solid var(--border)"}}>
              {t.tapToChange}
            </div>
            <label style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid rgba(30,45,69,0.5)",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:8,background:"var(--blue-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div><div style={{fontSize:14,color:"var(--text)",fontWeight:500}}>Choose from Gallery</div><div style={{fontSize:11,color:"var(--text3)"}}>Pick any photo from your phone</div></div>
              <input ref={galleryRef} type="file" accept="image/*" onChange={e=>{processFile(e.target.files?.[0]);setShowMenu(false);e.target.value="";}} style={{display:"none"}}/>
            </label>
            <label style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid rgba(30,45,69,0.5)",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:8,background:"var(--green-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <div><div style={{fontSize:14,color:"var(--text)",fontWeight:500}}>Take a Photo</div><div style={{fontSize:11,color:"var(--text3)"}}>Use your camera directly</div></div>
              <input ref={cameraRef} type="file" accept="image/*" capture="user" onChange={e=>{processFile(e.target.files?.[0]);setShowMenu(false);e.target.value="";}} style={{display:"none"}}/>
            </label>
            {photo&&<button onClick={()=>{setPhoto(null);try{localStorage.removeItem(`bsc_photo_${currentUser.id}`);}catch{}setShowMenu(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"none",border:"none",cursor:"pointer",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:8,background:"var(--red-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="x" size={16} color="var(--red)"/></div>
              <div style={{textAlign:"left"}}><div style={{fontSize:14,color:"var(--red)",fontWeight:500}}>Remove Photo</div></div>
            </button>}
            <button onClick={()=>setShowMenu(false)} style={{width:"100%",padding:"12px 14px",background:"none",border:"none",fontSize:14,color:"var(--text3)",cursor:"pointer",minHeight:44}}>{t.cancel}</button>
          </div>
        )}

        {/* Language selector */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"var(--text3)",marginBottom:6,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>{t.language}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["en","🇺🇸 EN"],["es","🇪🇸 ES"]].map(([code,label])=>(
              <button key={code} onClick={async()=>{
                setLang(code);
                localStorage.setItem("bsc_lang",code);
                try{await authFetch("/api/security/language",{method:"PUT",body:JSON.stringify({language:code})});}catch{}
              }} style={{padding:"7px",borderRadius:8,border:"1px solid",
                borderColor:lang===code?"var(--amber)":"var(--border)",
                background:lang===code?"var(--amber-dim)":"transparent",
                color:lang===code?"var(--amber)":"var(--text3)",
                fontSize:12,cursor:"pointer",fontFamily:"'Syne',sans-serif",fontWeight:600,minHeight:34}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button onClick={handleLogout} style={{width:"100%",display:"flex",alignItems:"center",
          justifyContent:"center",gap:8,padding:"11px",borderRadius:9,
          background:"var(--red-dim)",color:"var(--red)",
          border:"1px solid rgba(239,68,68,0.2)",fontSize:13,cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif",minHeight:44}}>
          <Icon name="logout" size={14} color="var(--red)"/>{t.signOut}
        </button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser,setCurrentUser]=useState(null);
  const [mounted,setMounted]=useState(false);
  const [lang,setLang]=useState("en");

  useEffect(()=>{
    try{const s=localStorage.getItem("bsc_session");if(s)setCurrentUser(JSON.parse(s));}catch{}
    try{const l=localStorage.getItem("bsc_lang");if(l)setLang(l);}catch{}
    localStorage.removeItem("bsc_settings");
    setMounted(true);
  },[]);

  const t=T[lang]||T.en;
  const [page,setPage]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [toasts,setToasts]=useState([]);
  const [settings,setSettings]=useState(DEFAULT_SETTINGS);
  const [todayData,setTodayData]=useState(null);
  const [adminData,setAdminData]=useState({employees:[],attendance:[],summary:[]});
  const [worksites,setWorksites]=useState([]);
  const [employeeWorksite,setEmployeeWorksite]=useState(null);
  const [gpsLoading,setGpsLoading]=useState(true);
  const [punchLoading,setPunchLoading]=useState(false);
  const [isOvertime,setIsOvertime]=useState(false);
  const [overtimeMins,setOvertimeMins]=useState(0);
  const toastCounter=useRef(0);
  const missedClockoutWarned=useRef(false);

  const addToast=useCallback((message,type="info")=>{
    const id=++toastCounter.current;
    setToasts(t=>[...t,{id,message,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),5000);
  },[]);
  const removeToast=useCallback((id)=>setToasts(t=>t.filter(x=>x.id!==id)),[]);

  // GPS
  const [userLat,setUserLat]=useState(null);
  const [userLon,setUserLon]=useState(null);

  const geoTarget=employeeWorksite||(settings.latitude!=null?{
    latitude:settings.latitude,longitude:settings.longitude,radius_feet:settings.radiusFeet
  }:null);
  let onSite=false,distanceFt=null;
  if(userLat!=null&&geoTarget?.latitude!=null){
    distanceFt=distanceFeet(userLat,userLon,geoTarget.latitude,geoTarget.longitude);
    onSite=geoTarget.radius_feet!=null&&distanceFt<=geoTarget.radius_feet;
  }

  useEffect(()=>{
    if(!navigator.geolocation){setGpsLoading(false);return;}
    navigator.geolocation.getCurrentPosition(
      pos=>{setUserLat(pos.coords.latitude);setUserLon(pos.coords.longitude);setGpsLoading(false);},
      ()=>setGpsLoading(false),
      {enableHighAccuracy:false,maximumAge:60000,timeout:5000}
    );
    const watchId=navigator.geolocation.watchPosition(
      pos=>{setUserLat(pos.coords.latitude);setUserLon(pos.coords.longitude);setGpsLoading(false);},
      ()=>{},
      {enableHighAccuracy:true,maximumAge:10000,timeout:30000}
    );
    return()=>navigator.geolocation.clearWatch(watchId);
  },[]);

  const refreshSettings=useCallback(async()=>{
    try{
      const res=await authFetch("/api/settings");
      if(res.ok){
        const d=await res.json();
        if(d)setSettings({
          companyName:d.company_name,siteName:d.site_name,
          latitude:parseFloat(d.latitude),longitude:parseFloat(d.longitude),
          radiusFeet:parseFloat(d.radius_feet),
          workStart:d.working_hours_start?.slice(0,5)||"07:00",
          workEnd:d.working_hours_end?.slice(0,5)||"17:00",
          autoClockInEnabled:d.auto_clock_in_enabled,
          autoBreakOnExitEnabled:d.auto_break_on_exit_enabled,
          autoCorrectionEnabled:d.auto_correction_enabled,
        });
      }
    }catch{}
  },[]);

  const refreshTodayData=useCallback(async()=>{
    if(!currentUser)return;
    try{const r=await authFetch("/api/attendance/me/today");if(r.ok){const d=await r.json();setTodayData(d);}}catch{}
  },[currentUser]);

  const refreshAdminData=useCallback(async()=>{
    if(!currentUser||(currentUser.role!=="admin"&&currentUser.role!=="manager"))return;
    try{
      const today=new Date().toISOString().slice(0,10);
      const[eR,aR,sR]=await Promise.all([
        authFetch("/api/admin/employees"),
        authFetch(`/api/admin/attendance?date_from=${today}&date_to=${today}`),
        authFetch("/api/admin/reports/summary"),
      ]);
      setAdminData({
        employees:eR.ok?await eR.json():[],
        attendance:aR.ok?await aR.json():[],
        summary:sR.ok?await sR.json():[],
      });
    }catch{}
  },[currentUser]);

  const refreshWorksites=useCallback(async()=>{
    if(!currentUser)return;
    try{
      const r=await authFetch("/api/worksites");
      if(r.ok){const d=await r.json();setWorksites(Array.isArray(d)?d:[]);}
    }catch{}
  },[currentUser]);

  const refreshEmployeeWorksite=useCallback(async()=>{
    if(!currentUser||currentUser.role==="admin"||currentUser.role==="manager")return;
    try{
      const r=await authFetch("/api/worksites/my-assignment");
      if(r.ok){const d=await r.json();setEmployeeWorksite(d);}
    }catch{}
  },[currentUser]);

  // Check overtime
  const checkOvertime=useCallback(async()=>{
    if(!currentUser)return;
    try{
      const r=await authFetch(`/api/employees/${currentUser.id}/overtime`);
      if(r.ok){const d=await r.json();setIsOvertime(d.isOvertime||false);setOvertimeMins(d.overtimeMins||0);}
    }catch{}
  },[currentUser]);

  // Check missed clock-out
  const checkMissedClockout=useCallback(()=>{
    if(!todayData||missedClockoutWarned.current)return;
    const session=todayData?.session;
    if(!session)return;
    const sessionDate=new Date(session.clock_in_time).toDateString();
    const today=new Date().toDateString();
    if(sessionDate!==today&&session.status==="active"){
      missedClockoutWarned.current=true;
      vibrate([300,100,300,100,300]);
      addToast(t.missedClockOutMsg,"warning");
    }
  },[todayData,t,addToast]);

  useEffect(()=>{
    if(currentUser){
      refreshTodayData();refreshSettings();refreshWorksites();refreshEmployeeWorksite();
      if(currentUser.role==="admin"||currentUser.role==="manager")refreshAdminData();
    }
  },[currentUser,refreshTodayData,refreshSettings,refreshAdminData,refreshWorksites,refreshEmployeeWorksite]);

  useEffect(()=>{
    if(!currentUser)return;
    const iv=setInterval(()=>{
      refreshTodayData();checkOvertime();
      if(currentUser.role==="admin"||currentUser.role==="manager")refreshAdminData();
    },30000);
    return()=>clearInterval(iv);
  },[currentUser,refreshTodayData,refreshAdminData,checkOvertime]);

  useEffect(()=>{checkMissedClockout();},[checkMissedClockout]);
  useEffect(()=>{if(todayData)checkOvertime();},[todayData,checkOvertime]);

  const empStatus=todayData?.status||"clocked_out";

  const doPunch=async(endpoint,msg)=>{
    if(punchLoading)return;
    setPunchLoading(true);
    try{
      const res=await authFetch(`/api/attendance/${endpoint}`,{
        method:"POST",
        body:JSON.stringify({latitude:userLat||geoTarget?.latitude||0,longitude:userLon||geoTarget?.longitude||0}),
      });
      const d=await res.json();
      if(!res.ok){addToast(d.error||"Action failed.","error");vibrate([100,50,100]);return;}
      addToast(msg,"success");vibrate([50]);
      await refreshTodayData();
    }catch{addToast("Cannot connect to server.","error");}
    finally{setPunchLoading(false);}
  };

  const handleClockIn=()=>doPunch("clock-in",t.clockedIn+" ✓");
  const handleClockOut=()=>doPunch("clock-out",t.clockedOut+" ✓");
  const handleBreakStart=()=>doPunch("break-start",t.startBreak+" ✓");
  const handleBreakEnd=()=>doPunch("break-end",t.endBreak+" ✓");

  const handleLogin=async(userId,password,isEmail=false)=>{
    const deviceFingerprint=getDeviceFingerprint();
    try{
      // Check device binding
      const checkRes=await fetch(`${API}/api/security/check-device`,{
        method:"POST",credentials:"include",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userId,deviceFingerprint}),
      });
      if(checkRes.ok){
        const check=await checkRes.json();
        if(!check.allowed){
          addToast("This device is registered to another account. Access denied.","error");
          vibrate([200,100,200,100,200]);
          return;
        }
      }
      const body=isEmail?{email:userId,password}:{userId,password};
      const res=await fetch(`${API}/api/auth/login`,{
        method:"POST",credentials:"include",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body),
      });
      const data=await res.json();
      if(!res.ok){addToast(data.error||"Invalid credentials.","error");vibrate([100,50,100]);return;}
      localStorage.setItem("accessToken",data.accessToken);
      localStorage.setItem("bsc_session",JSON.stringify(data.user));
      localStorage.removeItem("bsc_settings");
      setCurrentUser(data.user);
      addToast(`${t.welcomeBack}, ${data.user.name.split(" ")[0]}!`,"success");
      vibrate([50]);
      setPage("dashboard");
    }catch{addToast("Cannot connect to server.","error");}
  };

  const handleLogout=async()=>{
    try{await authFetch("/api/auth/logout",{method:"POST"});}catch{}
    setCurrentUser(null);
    ["accessToken","bsc_session","bsc_settings"].forEach(k=>localStorage.removeItem(k));
    setPage("dashboard");setTodayData(null);
    setAdminData({employees:[],attendance:[],summary:[]});
    addToast("Logged out.","info");
  };

  const isAdmin=currentUser?.role==="admin"||currentUser?.role==="manager";
  const navItems=currentUser?[
    {id:"dashboard",label:isAdmin?t.dashboard:`My ${t.dashboard}`,icon:"home"},
    ...(isAdmin?[
      {id:"employees",label:t.employees,icon:"users"},
      {id:"worksites",label:t.worksites,icon:"map"},
      {id:"attendance",label:t.attendance,icon:"calendar"},
      {id:"reports",label:t.reports,icon:"bar"},
      {id:"settings",label:t.settings,icon:"settings"},
      {id:"export",label:t.export,icon:"download"},
      {id:"audit",label:t.auditLogs,icon:"log"},
    ]:[
      {id:"my_attendance",label:t.myAttendance,icon:"calendar"},
      {id:"my_profile",label:t.myProfile,icon:"user"},
    ]),
  ]:[];

  if(!mounted)return null;
  if(!currentUser)return(
    <><GlobalStyle/><LoginPage onLogin={handleLogin} lang={lang} setLang={setLang}/><Toast toasts={toasts} removeToast={removeToast}/></>
  );

  return(
    <>
      <GlobalStyle/>
      <div style={{display:"flex",minHeight:"100vh",position:"relative"}}>
        {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,backdropFilter:"blur(2px)"}}/>}
        <aside style={{position:"fixed",top:0,left:0,height:"100vh",zIndex:300,width:270,
          transform:sidebarOpen?"translateX(0)":"translateX(-100%)",
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
            <button onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",color:"var(--text3)",padding:4,display:"flex"}}><Icon name="close" size={18}/></button>
          </div>
          <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}} style={{
                width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:9,
                background:page===item.id?"var(--amber-dim)":"transparent",
                color:page===item.id?"var(--amber2)":"var(--text2)",
                fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:page===item.id?600:400,
                border:"none",cursor:"pointer",marginBottom:2,transition:"background 0.15s",minHeight:44}}>
                <Icon name={item.icon} size={16} color={page===item.id?"var(--amber2)":"var(--text3)"}/>
                {item.label}
                {item.id==="dashboard"&&isOvertime&&<span className="overtime-pulse" style={{marginLeft:"auto",background:"rgba(249,115,22,0.15)",color:"var(--orange)",padding:"1px 7px",borderRadius:999,fontSize:9,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>OT</span>}
              </button>
            ))}
          </nav>
          <SidebarProfile currentUser={currentUser} handleLogout={handleLogout} lang={lang} setLang={setLang}/>
        </aside>

        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,width:"100%"}}>
          <header style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)",
            padding:"10px 14px",display:"flex",alignItems:"center",gap:10,
            position:"sticky",top:0,zIndex:100}}>
            <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",
              color:"var(--text2)",padding:6,borderRadius:7,display:"flex",cursor:"pointer",
              minWidth:36,minHeight:36,alignItems:"center",justifyContent:"center"}}>
              <Icon name="menu" size={20}/>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:0}}>
              <div style={{width:26,height:26,borderRadius:6,background:"var(--amber)",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon name="hard_hat" size={13} color="#0b0f1a"/>
              </div>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,
                color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",
                whiteSpace:"nowrap",maxWidth:120}}>BSC Tracker</span>
              {isOvertime&&<span className="overtime-pulse" style={{background:"rgba(249,115,22,0.15)",
                color:"var(--orange)",padding:"2px 8px",borderRadius:999,fontSize:10,
                fontWeight:700,fontFamily:"'Syne',sans-serif",flexShrink:0}}>
                {t.overtime}
              </span>}
            </div>
            <LocationIndicator onSite={onSite} distance={distanceFt}
              loading={gpsLoading&&userLat==null&&geoTarget?.latitude!=null} lang={lang}/>
          </header>

          <main style={{flex:1,padding:"16px 14px",maxWidth:900,width:"100%",margin:"0 auto"}}>
            {/* Manager/Admin location update button */}
            {isAdmin&&(
              <AdminLocationBar userLat={userLat} userLon={userLon} worksites={worksites}
                onSite={onSite} distanceFt={distanceFt} addToast={addToast} t={t}
                onWorksiteSelect={(ws)=>setEmployeeWorksite(ws)}/>
            )}

            {page==="dashboard"&&(isAdmin
              ? <AdminDashboard adminData={adminData} refreshAdminData={refreshAdminData}
                  isOvertime={isOvertime} t={t}/>
              : <EmployeeDashboard user={currentUser} todayData={todayData} empStatus={empStatus}
                  onSite={onSite} settings={settings} punchLoading={punchLoading}
                  gpsLoading={gpsLoading} userLat={userLat}
                  isOvertime={isOvertime} overtimeMins={overtimeMins}
                  employeeWorksite={employeeWorksite}
                  handleClockIn={handleClockIn} handleClockOut={handleClockOut}
                  handleBreakStart={handleBreakStart} handleBreakEnd={handleBreakEnd} t={t}/>
            )}
            {page==="my_attendance"&&<MyAttendance t={t}/>}
            {page==="my_profile"&&<MyProfile user={currentUser} addToast={addToast}
              employeeWorksite={employeeWorksite} t={t}/>}
            {page==="employees"&&isAdmin&&<EmployeeList adminData={adminData}
              refreshAdminData={refreshAdminData} addToast={addToast}
              worksites={worksites} t={t}/>}
            {page==="worksites"&&isAdmin&&<WorksitesPage worksites={worksites}
              refreshWorksites={refreshWorksites} adminData={adminData}
              addToast={addToast} t={t}/>}
            {page==="attendance"&&isAdmin&&<AttendancePage adminData={adminData} t={t}/>}
            {page==="reports"&&isAdmin&&<ReportsPage adminData={adminData} t={t}/>}
            {page==="settings"&&isAdmin&&<SettingsPage settings={settings}
              addToast={addToast} refreshSettings={refreshSettings} t={t}/>}
            {page==="export"&&isAdmin&&<ExportPage adminData={adminData} addToast={addToast} t={t}/>}
            {page==="audit"&&isAdmin&&<AuditPage t={t}/>}
          </main>
        </div>
      </div>
      <Toast toasts={toasts} removeToast={removeToast}/>
    </>
  );
}

// ── ADMIN LOCATION BAR ────────────────────────────────────────────────────────
function AdminLocationBar({userLat,userLon,worksites,onSite,distanceFt,addToast,t,onWorksiteSelect}){
  const [show,setShow]=useState(false);
  const [updating,setUpdating]=useState(false);
  if(worksites.length===0)return null;
  return(
    <div style={{marginBottom:12}}>
      {show&&(
        <Card style={{marginBottom:8,border:"1px solid var(--amber-glow)"}}>
          <div style={{fontSize:12,color:"var(--text3)",marginBottom:10,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t.updateLocation}</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {worksites.map(w=>{
              let dist=null;
              if(userLat!=null) dist=distanceFeet(userLat,userLon,w.latitude,w.longitude);
              const isHere=dist!=null&&dist<=w.radius_feet;
              return(
                <button key={w.id} onClick={()=>{onWorksiteSelect(w);addToast(t.locationUpdated,"success");setShow(false);}} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"11px 12px",borderRadius:9,
                  border:`1px solid ${isHere?"rgba(16,185,129,0.3)":"var(--border)"}`,
                  background:isHere?"var(--green-dim)":"var(--bg3)",cursor:"pointer",
                  textAlign:"left",width:"100%",minHeight:48}}>
                  <div style={{width:32,height:32,borderRadius:8,
                    background:isHere?"var(--green-dim)":"var(--amber-dim)",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="pin" size={14} color={isHere?"var(--green)":"var(--amber)"}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:isHere?"var(--green)":"var(--text)",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {w.project_name||w.name}
                    </div>
                    {w.address&&<div style={{fontSize:10,color:"var(--text3)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.address}</div>}
                  </div>
                  {dist!=null&&<span style={{fontSize:10,color:isHere?"var(--green)":"var(--text3)",
                    flexShrink:0,fontFamily:"'Syne',sans-serif",fontWeight:600}}>
                    {Math.round(dist)}ft{isHere?" ✓":""}
                  </span>}
                </button>
              );
            })}
          </div>
          <button onClick={()=>setShow(false)} style={{width:"100%",marginTop:10,padding:"9px",
            background:"none",border:"1px solid var(--border)",borderRadius:8,
            color:"var(--text3)",fontSize:13,cursor:"pointer"}}>{t.cancel}</button>
        </Card>
      )}
      <Btn onClick={()=>setShow(s=>!s)} variant="secondary" size="sm" style={{width:"100%"}}>
        <Icon name="navigation" size={13}/>{t.updateLocation}
        {distanceFt!=null&&<span style={{marginLeft:4,opacity:0.7,fontSize:11}}>{Math.round(distanceFt)}ft</span>}
      </Btn>
    </div>
  );
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({onLogin,lang,setLang}){
  const [userId,setUserId]=useState("");
  const [password,setPassword]=useState("");
  const [showPass,setShowPass]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [useEmail,setUseEmail]=useState(false);
  const t=T[lang]||T.en;

  const validate=()=>{
    if(!useEmail){
      if(!/^[A-Za-z0-9]{4}$/.test(userId)){setError(`${t.userId} must be exactly 4 characters.`);return false;}
      if(!/^\d{4}$/.test(password)){setError(`${t.password} must be exactly 4 digits.`);return false;}
    }
    setError("");return true;
  };

  const handle=async(e)=>{
    e.preventDefault();if(!validate())return;
    setLoading(true);await onLogin(userId,password,useEmail);setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--bg)",
      backgroundImage:"radial-gradient(ellipse 100% 50% at 50% -20%, rgba(245,158,11,0.15), transparent)"}}>
      {/* Lang switcher top */}
      <div style={{padding:"12px 16px",display:"flex",justifyContent:"flex-end",gap:6}}>
        {[["en","EN"],["es","ES"]].map(([code,label])=>(
          <button key={code} onClick={()=>{setLang(code);localStorage.setItem("bsc_lang",code);}} style={{
            padding:"5px 12px",borderRadius:20,border:"1px solid",
            borderColor:lang===code?"var(--amber)":"var(--border)",
            background:lang===code?"var(--amber-dim)":"transparent",
            color:lang===code?"var(--amber)":"var(--text3)",
            fontSize:12,cursor:"pointer",fontFamily:"'Syne',sans-serif",fontWeight:600}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 16px 40px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,borderRadius:20,background:"var(--amber)",
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 14px",boxShadow:"0 0 40px var(--amber-glow)"}}>
            <Icon name="hard_hat" size={36} color="#0b0f1a"/>
          </div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:"var(--text)",lineHeight:1.2}}>
            Bright Sky<br/>Construction
          </h1>
          <p style={{color:"var(--text3)",fontSize:13,marginTop:6}}>Employee Time Tracking System</p>
        </div>

        <div style={{width:"100%",maxWidth:380}} className="fade-up">
          <Card style={{padding:24}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,marginBottom:4}}>
                {useEmail?"Admin Sign In":"Employee Sign In"}
              </h2>
              <p style={{color:"var(--text3)",fontSize:13}}>
                {useEmail?"Enter your email and password":`Enter your 4-character ${t.userId}`}
              </p>
            </div>
            <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",fontWeight:600,display:"flex",
                  alignItems:"center",gap:6,marginBottom:6,fontFamily:"'Syne',sans-serif",
                  textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  <Icon name={useEmail?"user":"key"} size={12} color="var(--text3)"/>
                  {useEmail?"Email Address":t.userId}
                </label>
                {useEmail?(
                  <input type="email" value={userId} onChange={e=>{setUserId(e.target.value);setError("");}}
                    placeholder="your@email.com" autoComplete="off" style={{fontSize:16}} required/>
                ):(
                  <>
                    <input type="text" className="pin-input" value={userId}
                      onChange={e=>{const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);setUserId(v);setError("");}}
                      placeholder="0000" maxLength={4} autoComplete="off" inputMode="text"
                      style={{fontSize:28,letterSpacing:"0.3em",textAlign:"center",width:"100%",padding:"12px"}} required/>
                    <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:8,height:20}}>
                      {[0,1,2,3].map(i=><div key={i} className={`pin-dot${userId.length>i?"":" empty"}`}
                        style={{transform:userId.length>i?"scale(1.15)":"scale(1)"}}/>)}
                    </div>
                  </>
                )}
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",fontWeight:600,display:"flex",
                  alignItems:"center",gap:6,marginBottom:6,fontFamily:"'Syne',sans-serif",
                  textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  <Icon name="shield" size={12} color="var(--text3)"/>{t.password}
                </label>
                <div style={{position:"relative"}}>
                  <input type={showPass?"text":"password"} value={password}
                    onChange={e=>{const v=useEmail?e.target.value:e.target.value.replace(/\D/g,"").slice(0,4);setPassword(v);setError("");}}
                    placeholder={useEmail?"••••••••":"0000"} autoComplete="off"
                    inputMode={useEmail?"text":"numeric"}
                    maxLength={useEmail?undefined:4}
                    style={{fontSize:useEmail?16:24,letterSpacing:useEmail?"normal":"0.3em",
                      textAlign:useEmail?"left":"center",paddingRight:48}} required/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)} style={{
                    position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",color:"var(--text3)",cursor:"pointer",
                    padding:4,display:"flex",alignItems:"center",justifyContent:"center",
                    minWidth:32,minHeight:32}}>
                    <Icon name={showPass?"eyeOff":"eye"} size={18} color="var(--text3)"/>
                  </button>
                </div>
                {!useEmail&&(
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:8,height:20}}>
                    {[0,1,2,3].map(i=><div key={i} className={`pin-dot${password.length>i?"":" empty"}`}
                      style={{transform:password.length>i?"scale(1.15)":"scale(1)"}}/>)}
                  </div>
                )}
              </div>
              {error&&(
                <div className="shake" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",
                  borderRadius:8,background:"var(--red-dim)",border:"1px solid rgba(239,68,68,0.2)"}}>
                  <Icon name="alert" size={14} color="var(--red)"/>
                  <span style={{fontSize:13,color:"var(--red)"}}>{error}</span>
                </div>
              )}
              <Btn loading={loading} style={{width:"100%",marginTop:4}} size="lg">
                <Icon name="login" size={16} color="#0b0f1a"/>{t.signIn}
              </Btn>
            </form>
            <div style={{marginTop:14,textAlign:"center"}}>
              <button onClick={()=>{setUseEmail(e=>!e);setUserId("");setPassword("");setError("");}}
                style={{background:"none",border:"none",color:"var(--text3)",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
                {useEmail?t.useUserId:t.adminLogin}
              </button>
            </div>
          </Card>
          <div style={{marginTop:10,padding:"11px 14px",borderRadius:10,background:"rgba(245,158,11,0.06)",border:"1px solid var(--amber-dim)",display:"flex",gap:8,alignItems:"flex-start"}}>
            <Icon name="alert" size={13} color="var(--amber)" style={{marginTop:1,flexShrink:0}}/>
            <div style={{fontSize:11,color:"var(--text3)",lineHeight:1.5}}>
              Use your <span style={{color:"var(--amber)",fontWeight:600}}>4-character User ID</span> and <span style={{color:"var(--amber)",fontWeight:600}}>4-digit password</span>. Contact admin if you need help.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EMPLOYEE DASHBOARD ────────────────────────────────────────────────────────
function EmployeeDashboard({user,todayData,empStatus,onSite,settings,punchLoading,gpsLoading,userLat,isOvertime,overtimeMins,employeeWorksite,handleClockIn,handleClockOut,handleBreakStart,handleBreakEnd,t}){
  const[now,setNow]=useState(new Date());
  useEffect(()=>{const i=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(i);},[]);

  const session=todayData?.session;
  const punches=todayData?.punches||[];
  const breakCount=punches.filter(p=>p.punch_type==="break_start").length;

  let liveWorked=session?.worked_minutes||0;
  if((empStatus==="clocked_in"||empStatus==="on_break")&&session?.clock_in_time){
    const elapsed=Math.round((now.getTime()-new Date(session.clock_in_time).getTime())/60000);
    liveWorked=Math.max(0,elapsed-(session.break_minutes||0));
  }else if(empStatus==="clocked_out"&&session?.worked_minutes){
    liveWorked=session.worked_minutes;
  }

  const punchLabels={clock_in:t.clockedIn,clock_out:t.clockedOut,break_start:t.startBreak,break_end:t.endBreak,auto_clock_in:t.autoClockIn,auto_break:"Auto Break"};
  const punchColors={clock_in:"var(--green)",clock_out:"var(--red)",break_start:"var(--amber)",break_end:"var(--amber2)",auto_clock_in:"var(--blue)",auto_break:"var(--blue)"};
  const displayWorksite=employeeWorksite||{latitude:settings.latitude,longitude:settings.longitude,radius_feet:settings.radiusFeet,name:settings.siteName};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="fade-up">
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"var(--text)"}}>
          {t[now.getHours()<12?"morning":now.getHours()<17?"afternoon":"evening"]}, {user.name.split(" ")[0]} 👋
        </h1>
        <p style={{color:"var(--text3)",fontSize:12,marginTop:3}}>
          {now.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} · {now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </p>
        {user.userId&&<p style={{color:"var(--text3)",fontSize:11,marginTop:2}}>{t.userId}: <span style={{color:"var(--amber)",fontWeight:700,fontFamily:"'Syne',sans-serif"}}>{user.userId}</span></p>}
      </div>

      {/* Overtime alert */}
      {isOvertime&&(
        <div className="fade-up overtime-pulse" style={{padding:"12px 14px",borderRadius:10,
          background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.35)",
          display:"flex",alignItems:"center",gap:10}}>
          <Icon name="zap" size={16} color="var(--orange)"/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--orange)"}}>{t.overtime}</div>
            <div style={{fontSize:11,color:"var(--text3)"}}>Working {fmtMins(overtimeMins)} beyond scheduled hours</div>
          </div>
        </div>
      )}

      {/* Status card */}
      <Card className="fade-up-d1" style={{
        background:empStatus==="clocked_in"?"linear-gradient(135deg,#071a12 0%,var(--card) 60%)":empStatus==="on_break"?"linear-gradient(135deg,#1a130a 0%,var(--card) 60%)":"var(--card)",
        border:`1px solid ${empStatus==="clocked_in"?"rgba(16,185,129,0.3)":empStatus==="on_break"?"rgba(245,158,11,0.3)":isOvertime?"rgba(249,115,22,0.3)":"var(--border)"}`}}>
        {(empStatus==="clocked_in"||empStatus==="on_break")&&(
          <div style={{position:"relative",display:"inline-block",marginBottom:12}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:empStatus==="clocked_in"?"var(--green)":"var(--amber)",position:"relative",zIndex:2}}/>
            {[1,2].map(i=><div key={i} style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${empStatus==="clocked_in"?"var(--green)":"var(--amber)"}`,animation:`pulse-ring ${1.4+i*0.3}s ease-out infinite`,animationDelay:`${i*0.35}s`}}/>)}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:"var(--text3)",marginBottom:6}}>Current Status</div>
            <StatusBadge status={isOvertime&&empStatus==="clocked_in"?"overtime":empStatus}/>
          </div>
          {(empStatus==="clocked_in"||empStatus==="on_break")&&(
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"var(--text3)"}}>{t.today}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,
                color:isOvertime?"var(--orange)":empStatus==="clocked_in"?"var(--green)":"var(--amber)"}}>
                {fmtMins(liveWorked)}
              </div>
              {isOvertime&&<div style={{fontSize:10,color:"var(--orange)",fontWeight:600}}>+{fmtMins(overtimeMins)} OT</div>}
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
          {empStatus==="clocked_out"&&<Btn onClick={handleClockIn} disabled={!onSite||punchLoading} loading={punchLoading} size="lg" style={{width:"100%"}}><Icon name="play" size={16} color="#0b0f1a"/>{t.clockIn}</Btn>}
          {empStatus==="clocked_in"&&<>
            <Btn onClick={handleBreakStart} disabled={punchLoading} loading={punchLoading} variant="secondary" size="md" style={{width:"100%"}}><Icon name="coffee" size={15}/>{t.startBreak}</Btn>
            <Btn onClick={handleClockOut} disabled={punchLoading} loading={punchLoading} variant="danger" size="md" style={{width:"100%"}}><Icon name="stop" size={15}/>{t.clockOut}</Btn>
          </>}
          {empStatus==="on_break"&&<Btn onClick={handleBreakEnd} disabled={punchLoading} loading={punchLoading} variant="green" size="lg" style={{width:"100%"}}><Icon name="play" size={16}/>{t.endBreak}</Btn>}
        </div>
        {gpsLoading&&userLat==null&&displayWorksite?.latitude!=null&&(
          <div style={{marginTop:12,padding:"9px 12px",borderRadius:8,background:"var(--amber-dim)",border:"1px solid rgba(245,158,11,0.2)",display:"flex",gap:7,alignItems:"center"}}>
            <span className="spin" style={{width:12,height:12,border:"2px solid var(--amber)",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",flexShrink:0}}/>
            <span style={{fontSize:12,color:"var(--amber)"}}>{t.locating}</span>
          </div>
        )}
        {!gpsLoading&&!onSite&&displayWorksite?.latitude!=null&&userLat!=null&&(
          <div style={{marginTop:12,padding:"9px 12px",borderRadius:8,background:"var(--red-dim)",border:"1px solid rgba(239,68,68,0.2)",display:"flex",gap:7,alignItems:"center"}}>
            <Icon name="alert" size={13} color="var(--red)"/>
            <span style={{fontSize:12,color:"var(--red)"}}>Must be within {displayWorksite.radius_feet} ft of your assigned worksite.</span>
          </div>
        )}
      </Card>

      <div className="fade-up-d2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <StatCard label={t.today} value={fmtMins(liveWorked)} icon="clock" color={isOvertime?"var(--orange)":"var(--green)"} flash={isOvertime}/>
        <StatCard label={t.status} value={empStatus==="clocked_in"?t.active:empStatus==="on_break"?t.onBreak:t.inactive} icon="shield" color={empStatus==="clocked_in"?"var(--green)":empStatus==="on_break"?"var(--amber)":"var(--text3)"}/>
        <StatCard label={t.breaks} value={breakCount} icon="coffee" color="var(--amber)" sub={`${fmtMins(session?.break_minutes||0)} total`}/>
        <StatCard label={t.punches} value={punches.length} icon="log" color="var(--blue)"/>
      </div>

      <Card className="fade-up-d3">
        <SectionHeader title="Today's Activity"/>
        {punches.length===0
          ? <div style={{textAlign:"center",padding:"20px 0",color:"var(--text3)",fontSize:13}}>{t.noActivity}</div>
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

      {/* Assigned worksite card */}
      {employeeWorksite&&(
        <Card className="fade-up-d4" style={{border:"1px solid rgba(245,158,11,0.15)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name="pin" size={18} color="var(--amber)"/>
            </div>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:10,color:"var(--text3)",fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>{t.assignedWorksite}</div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{employeeWorksite.project_name||employeeWorksite.name}</div>
              {employeeWorksite.address&&<div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{employeeWorksite.address}</div>}
              <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{parseFloat(employeeWorksite.latitude).toFixed(4)}°, {parseFloat(employeeWorksite.longitude).toFixed(4)}° · {employeeWorksite.radius_feet}ft</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({adminData,refreshAdminData,isOvertime,t}){
  const{employees,attendance,summary}=adminData;
  const todayActive=attendance.filter(s=>s.status==="active").length;
  const totalMins=attendance.reduce((a,s)=>{
    if(s.status==="active"&&s.clock_in_time)
      return a+Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0));
    return a+(parseInt(s.worked_minutes)||0);
  },0);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="fade-up" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>{t.dashboard}</h1>
          <p style={{color:"var(--text3)",fontSize:12,marginTop:2}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric",year:"numeric"})}</p>
        </div>
        <Btn onClick={refreshAdminData} variant="secondary" size="sm"><Icon name="refresh" size={13}/>{t.refresh}</Btn>
      </div>

      <div className="fade-up-d1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <StatCard label={t.employees} value={employees.length} icon="users" color="var(--amber)"/>
        <StatCard label="Active Now" value={todayActive} icon="clock" color="var(--green)" sub={`of ${employees.length}`}/>
        <StatCard label="Sessions Today" value={attendance.length} icon="calendar" color="var(--blue)"/>
        <StatCard label="Hours Today" value={`${Math.round(totalMins/60)}h`} icon="trend" color="var(--purple)"/>
      </div>

      <Card className="fade-up-d2">
        <SectionHeader title="Employee Summary"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:520}}>
            <thead><tr><th>Employee</th><th>ID</th><th>Hours</th><th>This Week</th><th>Status</th></tr></thead>
            <tbody>
              {summary.length===0
                ? <tr><td colSpan={5} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No data yet.</td></tr>
                : summary.map(s=>{
                  const activeSession=attendance.find(a=>a.user_id===s.id&&a.status==="active");
                  const nowMins=activeSession?Math.max(0,Math.round((Date.now()-new Date(activeSession.clock_in_time).getTime())/60000)-(parseInt(activeSession.break_minutes)||0)):null;
                  return(
                    <tr key={s.id}>
                      <td><div style={{fontWeight:600,color:"var(--text)",fontSize:13}}>{s.name}</div><div style={{fontSize:10,color:"var(--text3)"}}>{s.designation||s.department||""}</div></td>
                      <td><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"var(--amber)",background:"var(--amber-dim)",padding:"1px 6px",borderRadius:4}}>{s.user_id||"—"}</span></td>
                      <td style={{color:"var(--amber)",fontWeight:600}}>{Math.round(s.total_minutes/60)}h</td>
                      <td style={{color:"var(--green)",fontWeight:600}}>{Math.round(s.week_minutes/60)}h</td>
                      <td>{activeSession?<StatusBadge status="clocked_in"/>:<StatusBadge status="clocked_out"/>}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="fade-up-d3">
        <SectionHeader title="Today's Sessions"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:500}}>
            <thead><tr><th>Employee</th><th>In</th><th>Out</th><th>Worked</th><th>Status</th></tr></thead>
            <tbody>
              {attendance.length===0
                ? <tr><td colSpan={5} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No sessions today.</td></tr>
                : [...attendance].sort((a,b)=>b.work_date?.localeCompare(a.work_date||"")||0).slice(0,15).map(s=>(
                  <tr key={s.id}>
                    <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{s.name||"—"}</td>
                    <td style={{fontSize:11}}>{fmtTime(s.clock_in_time)}</td>
                    <td style={{fontSize:11}}>{fmtTime(s.clock_out_time)}</td>
                    <td style={{color:"var(--green)",fontSize:12}}>
                      {s.status==="active"&&s.clock_in_time
                        ? fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0)))
                        : fmtMins(s.worked_minutes)}
                    </td>
                    <td><StatusBadge status={s.status==="completed"?"clocked_out":"clocked_in"}/></td>
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

// ── WORKSITES PAGE (Fully Redesigned) ─────────────────────────────────────────
function WorksitesPage({worksites,refreshWorksites,adminData,addToast,t}){
  const[view,setView]=useState("sites");
  const[showAdd,setShowAdd]=useState(false);
  const[editingWS,setEditingWS]=useState(null);
  const[assigningTo,setAssigningTo]=useState(null);
  const[assignments,setAssignments]=useState([]);
  const[loadingA,setLoadingA]=useState(false);
  const[showMapPicker,setShowMapPicker]=useState(false);
  const[mapPickerFor,setMapPickerFor]=useState(null); // "lat"|"lon"

  const nameRef=useRef(null),projectRef=useRef(null),addressRef=useRef(null);
  const latRef=useRef(null),lonRef=useRef(null),radiusRef=useRef(null),notesRef=useRef(null);

  const loadAssignments=useCallback(async()=>{
    setLoadingA(true);
    try{const r=await authFetch("/api/worksites/assignments");if(r.ok){const d=await r.json();setAssignments(Array.isArray(d)?d:[]);}}catch{}
    setLoadingA(false);
  },[]);

  useEffect(()=>{loadAssignments();},[loadAssignments]);
  // Reload when worksites change
  useEffect(()=>{loadAssignments();},[worksites.length]);

  const getAssigned=(wsId)=>assignments.filter(a=>a.worksite_id===wsId);
  const getEmpWS=(empId)=>assignments.find(a=>a.employee_id===empId&&a.is_default);

  const handleSave=async()=>{
    const body={
      name:nameRef.current?.value,
      projectName:projectRef.current?.value||nameRef.current?.value,
      address:addressRef.current?.value,
      latitude:parseFloat(latRef.current?.value),
      longitude:parseFloat(lonRef.current?.value),
      radiusFeet:parseFloat(radiusRef.current?.value)||200,
      notes:notesRef.current?.value,
    };
    if(!body.name||!body.latitude||!body.longitude){addToast("Name, latitude and longitude required.","error");return;}
    const url=editingWS?`/api/worksites/${editingWS.id}`:"/api/worksites";
    const method=editingWS?"PUT":"POST";
    const res=await authFetch(url,{method,body:JSON.stringify(body)});
    if(!res.ok){addToast("Failed to save.","error");return;}
    addToast(editingWS?"Worksite updated.":"Worksite created.","success");
    setShowAdd(false);setEditingWS(null);
    await refreshWorksites();await loadAssignments();
  };

  const handleDelete=async(id)=>{
    if(!confirm("Delete this worksite?"))return;
    await authFetch(`/api/worksites/${id}`,{method:"DELETE"});
    addToast("Deleted.","info");
    await refreshWorksites();await loadAssignments();
  };

  const handleAssign=async(wsId,empId)=>{
    const res=await authFetch(`/api/worksites/${wsId}/assign`,{
      method:"POST",body:JSON.stringify({employeeId:empId,isDefault:true}),
    });
    if(!res.ok){addToast("Failed to assign.","error");return;}
    addToast("Assigned.","success");
    await refreshWorksites();await loadAssignments();
  };

  const handleRemove=async(wsId,empId)=>{
    await authFetch(`/api/worksites/${wsId}/remove/${empId}`,{method:"DELETE"});
    addToast("Removed.","info");
    await refreshWorksites();await loadAssignments();
  };

  const employees=adminData.employees.filter(e=>e.role==="employee");

  // Map picker using OpenStreetMap
  const MapPicker=({onPick,onClose,title})=>{
    const[searchAddr,setSearchAddr]=useState("");
    const[pickedLat,setPickedLat]=useState(null);
    const[pickedLon,setPickedLon]=useState(null);
    const[searching,setSearching]=useState(false);
    const[searchResults,setSearchResults]=useState([]);

    const searchLocation=async()=>{
      if(!searchAddr.trim())return;
      setSearching(true);
      try{
        const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddr)}&format=json&limit=5`);
        const d=await res.json();
        setSearchResults(d);
      }catch{}
      setSearching(false);
    };

    const pickResult=(r)=>{
      setPickedLat(parseFloat(r.lat));
      setPickedLon(parseFloat(r.lon));
      setSearchAddr(r.display_name);
      setSearchResults([]);
      if(latRef.current) latRef.current.value=parseFloat(r.lat).toFixed(7);
      if(lonRef.current) lonRef.current.value=parseFloat(r.lon).toFixed(7);
      if(addressRef.current) addressRef.current.value=r.display_name;
    };

    return(
      <Modal title={title||"Find Location"} onClose={onClose} fullScreen>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{padding:"10px",borderRadius:8,background:"var(--blue-dim)",border:"1px solid rgba(59,130,246,0.2)",fontSize:12,color:"var(--blue)"}}>
            Search for an address or place. Select a result to auto-fill the coordinates.
          </div>
          <div style={{display:"flex",gap:8}}>
            <input type="text" value={searchAddr}
              onChange={e=>setSearchAddr(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&searchLocation()}
              placeholder="Search address, city, place…"
              style={{fontSize:16,flex:1}} autoCorrect="off"/>
            <Btn onClick={searchLocation} loading={searching} size="sm" style={{flexShrink:0}}>
              <Icon name="navigation" size={14} color="#0b0f1a"/>
            </Btn>
          </div>

          {/* Search results */}
          {searchResults.length>0&&(
            <div style={{background:"var(--bg3)",borderRadius:10,overflow:"hidden",border:"1px solid var(--border)"}}>
              {searchResults.map((r,i)=>(
                <button key={i} onClick={()=>pickResult(r)} style={{
                  width:"100%",display:"flex",alignItems:"flex-start",gap:10,
                  padding:"12px 14px",background:"none",border:"none",
                  borderBottom:i<searchResults.length-1?"1px solid rgba(30,45,69,0.4)":"none",
                  cursor:"pointer",textAlign:"left",minHeight:48}}>
                  <Icon name="pin" size={14} color="var(--amber)" style={{marginTop:2,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:13,color:"var(--text)",fontWeight:500,lineHeight:1.4}}>{r.display_name}</div>
                    <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>
                      {parseFloat(r.lat).toFixed(6)}°, {parseFloat(r.lon).toFixed(6)}°
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Map embed */}
          {pickedLat!=null&&(
            <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)"}}>
              <iframe
                title="map"
                width="100%"
                height="220"
                style={{border:"none",display:"block"}}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${pickedLon-0.005}%2C${pickedLat-0.005}%2C${pickedLon+0.005}%2C${pickedLat+0.005}&layer=mapnik&marker=${pickedLat}%2C${pickedLon}`}
              />
              <div style={{padding:"10px 12px",background:"var(--bg3)"}}>
                <div style={{fontSize:11,color:"var(--text3)"}}>Selected: <span style={{color:"var(--amber)",fontWeight:600}}>{pickedLat?.toFixed(6)}°, {pickedLon?.toFixed(6)}°</span></div>
              </div>
            </div>
          )}

          {pickedLat!=null&&(
            <Btn onClick={()=>{onPick(pickedLat,pickedLon);onClose();}} style={{width:"100%"}} size="lg">
              <Icon name="check" size={15} color="#0b0f1a"/>Use This Location
            </Btn>
          )}

          <div style={{padding:"10px",borderRadius:8,background:"var(--bg3)",border:"1px solid var(--border)"}}>
            <div style={{fontSize:11,color:"var(--text3)",marginBottom:6,fontFamily:"'Syne',sans-serif",fontWeight:600}}>OR ENTER MANUALLY</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <label style={{fontSize:10,color:"var(--text3)",display:"block",marginBottom:4}}>Latitude</label>
                <input type="text" inputMode="decimal" value={pickedLat??""} readOnly style={{fontSize:14,background:"var(--bg2)"}}/>
              </div>
              <div>
                <label style={{fontSize:10,color:"var(--text3)",display:"block",marginBottom:4}}>Longitude</label>
                <input type="text" inputMode="decimal" value={pickedLon??""} readOnly style={{fontSize:14,background:"var(--bg2)"}}/>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // Add/Edit worksite modal
  const WorksiteModal=()=>(
    <Modal title={editingWS?"Edit Worksite":"Add New Worksite"} onClose={()=>{setShowAdd(false);setEditingWS(null);}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Display Name *</label>
          <input type="text" ref={nameRef} defaultValue={editingWS?.name||""} placeholder="e.g. Site A" style={{fontSize:16}} autoCorrect="off"/>
        </div>
        <div>
          <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Project Name</label>
          <input type="text" ref={projectRef} defaultValue={editingWS?.project_name||""} placeholder="e.g. Bright Sky Tower Phase 1" style={{fontSize:16}} autoCorrect="off"/>
        </div>
        <div>
          <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Address</label>
          <input type="text" ref={addressRef} defaultValue={editingWS?.address||""} placeholder="Full street address" style={{fontSize:16}} autoCorrect="off"/>
        </div>

        {/* Coordinates with map finder */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{fontSize:11,color:"var(--text3)",fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Coordinates *</label>
            <Btn onClick={()=>setShowMapPicker(true)} variant="blue" size="sm" style={{padding:"5px 10px",fontSize:11}}>
              <Icon name="map" size={12}/>Find on Map
            </Btn>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:10,color:"var(--text3)",display:"block",marginBottom:4}}>Latitude</label>
              <input type="text" inputMode="decimal" ref={latRef} defaultValue={editingWS?.latitude||""} placeholder="e.g. 33.9495" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div>
              <label style={{fontSize:10,color:"var(--text3)",display:"block",marginBottom:4}}>Longitude</label>
              <input type="text" inputMode="decimal" ref={lonRef} defaultValue={editingWS?.longitude||""} placeholder="e.g. -83.7656" style={{fontSize:16}} autoCorrect="off"/>
            </div>
          </div>
        </div>

        {/* Radius with presets */}
        <div>
          <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Geofence Radius (feet)</label>
          <input type="text" inputMode="decimal" ref={radiusRef} defaultValue={editingWS?.radius_feet||200} placeholder="200" style={{fontSize:16}} autoCorrect="off"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:8}}>
            {[["100","100ft"],["200","200ft"],["500","500ft"],["999999999","All"]].map(([val,label])=>(
              <button key={val} onClick={()=>{if(radiusRef.current)radiusRef.current.value=val;}} style={{
                padding:"7px 4px",borderRadius:7,border:"1px solid var(--border)",
                background:"var(--bg3)",color:"var(--text3)",fontSize:11,cursor:"pointer",
                fontFamily:"'Syne',sans-serif",fontWeight:600}}>{label}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Notes (optional)</label>
          <input type="text" ref={notesRef} defaultValue={editingWS?.notes||""} placeholder="Additional notes" style={{fontSize:16}} autoCorrect="off"/>
        </div>

        <Btn onClick={handleSave} style={{width:"100%"}} size="lg">
          <Icon name="check" size={15} color="#0b0f1a"/>{editingWS?"Update Worksite":"Create Worksite"}
        </Btn>
      </div>
    </Modal>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.worksites} subtitle="Manage locations and assignments"
        action={<Btn onClick={()=>{setShowAdd(true);setEditingWS(null);}} size="sm">
          <Icon name="plus" size={13} color="#0b0f1a"/>New
        </Btn>}/>

      {/* Tab switcher */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["sites","Worksites","map"],["assignments","Assignments","users"]].map(([v,l,icon])=>(
          <button key={v} onClick={()=>setView(v)} style={{
            padding:"10px",borderRadius:10,border:"1px solid",
            borderColor:view===v?"var(--amber)":"var(--border)",
            background:view===v?"var(--amber-dim)":"var(--bg3)",
            color:view===v?"var(--amber)":"var(--text3)",
            fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:600,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            gap:7,minHeight:44}}>
            <Icon name={icon} size={14} color={view===v?"var(--amber)":"var(--text3)"}/>
            {l}
          </button>
        ))}
      </div>

      {/* ── WORKSITES ── */}
      {view==="sites"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {worksites.length===0?(
            <Card style={{textAlign:"center",padding:32}}>
              <Icon name="map" size={32} color="var(--text3)" style={{marginBottom:12}}/>
              <p style={{color:"var(--text3)",fontSize:13}}>No worksites configured.</p>
            </Card>
          ):worksites.map(w=>{
            const assigned=getAssigned(w.id);
            return(
              <Card key={w.id} style={{padding:0,overflow:"hidden"}}>
                {/* Worksite header */}
                <div style={{padding:"14px 14px 10px",borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:"var(--green)",flexShrink:0,boxShadow:"0 0 6px var(--green)"}}/>
                        <div style={{fontSize:16,fontWeight:800,color:"var(--text)",fontFamily:"'Syne',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {w.project_name||w.name}
                        </div>
                      </div>
                      {w.address&&<div style={{fontSize:11,color:"var(--text3)",marginBottom:4,paddingLeft:18,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.address}</div>}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingLeft:18}}>
                        <span style={{background:"var(--bg3)",border:"1px solid var(--border)",padding:"2px 8px",borderRadius:6,fontSize:10,color:"var(--text3)",fontFamily:"'Syne',sans-serif"}}>
                          📍 {parseFloat(w.latitude).toFixed(4)}°, {parseFloat(w.longitude).toFixed(4)}°
                        </span>
                        <span style={{background:"var(--bg3)",border:"1px solid var(--border)",padding:"2px 8px",borderRadius:6,fontSize:10,color:"var(--text3)"}}>
                          🎯 {w.radius_feet}ft
                        </span>
                        <span style={{background:parseInt(w.assigned_count)>0?"var(--amber-dim)":"rgba(100,116,139,0.1)",border:`1px solid ${parseInt(w.assigned_count)>0?"var(--amber-glow)":"var(--border)"}`,padding:"2px 8px",borderRadius:6,fontSize:10,color:parseInt(w.assigned_count)>0?"var(--amber)":"var(--text3)",fontWeight:600}}>
                          👥 {w.assigned_count||0} assigned
                        </span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>{setEditingWS(w);setShowAdd(true);}} style={{width:34,height:34,borderRadius:8,background:"var(--bg3)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                        <Icon name="edit" size={14} color="var(--text3)"/>
                      </button>
                      <button onClick={()=>handleDelete(w.id)} style={{width:34,height:34,borderRadius:8,background:"var(--red-dim)",border:"1px solid rgba(239,68,68,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                        <Icon name="x" size={14} color="var(--red)"/>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Assigned employees */}
                <div style={{padding:"10px 14px"}}>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>
                    Assigned Employees ({assigned.length})
                  </div>
                  {assigned.length===0?(
                    <div style={{fontSize:12,color:"var(--text3)",padding:"8px 0"}}>No employees assigned yet.</div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                      {assigned.map(a=>(
                        <div key={a.employee_id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
                          <div style={{width:28,height:28,borderRadius:"50%",background:"var(--green-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <Icon name="user" size={13} color="var(--green)"/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {a.employee_name||a.full_name}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:1,flexWrap:"wrap"}}>
                              {a.user_id&&<span style={{fontSize:10,fontWeight:700,color:"var(--amber)",fontFamily:"'Syne',sans-serif",background:"var(--amber-dim)",padding:"0 5px",borderRadius:4}}>{a.user_id}</span>}
                              <span style={{fontSize:10,color:"var(--text3)"}}>{a.designation||a.department||""}</span>
                              {a.is_default&&<span style={{fontSize:9,color:"var(--green)",background:"var(--green-dim)",padding:"1px 6px",borderRadius:999,fontWeight:600}}>✓ Default</span>}
                            </div>
                          </div>
                          <button onClick={()=>handleRemove(w.id,a.employee_id)} style={{width:28,height:28,borderRadius:6,background:"var(--red-dim)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                            <Icon name="x" size={12} color="var(--red)"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Btn onClick={()=>setAssigningTo(w)} variant="blue" size="sm" style={{width:"100%"}}>
                    <Icon name="plus" size={13}/>Assign Employee to this Site
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── ASSIGNMENTS ── */}
      {view==="assignments"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"10px 14px",borderRadius:10,background:"var(--blue-dim)",border:"1px solid rgba(59,130,246,0.2)",fontSize:12,color:"var(--blue)",lineHeight:1.5}}>
            Each employee should have one default worksite. Their geofencing uses that worksite's coordinates.
          </div>
          {loadingA?(
            <Card style={{textAlign:"center",padding:24,color:"var(--text3)"}}>Loading assignments...</Card>
          ):employees.length===0?(
            <Card style={{textAlign:"center",padding:24,color:"var(--text3)"}}>No employees.</Card>
          ):employees.map(emp=>{
            const current=getEmpWS(emp.id);
            const allEmpA=assignments.filter(a=>a.employee_id===emp.id);
            return(
              <Card key={emp.id} style={{padding:0,overflow:"hidden"}}>
                {/* Employee header */}
                <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid var(--amber-glow)"}}>
                    <Icon name="user" size={18} color="var(--amber2)"/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:"var(--text)",fontSize:14}}>{emp.name||emp.full_name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}}>
                      {emp.user_id&&<span style={{fontSize:10,fontWeight:700,color:"var(--amber)",fontFamily:"'Syne',sans-serif",background:"var(--amber-dim)",padding:"1px 6px",borderRadius:4}}>{emp.user_id}</span>}
                      <span style={{fontSize:11,color:"var(--text3)"}}>{emp.department||""}</span>
                    </div>
                  </div>
                </div>

                {/* Current worksite */}
                <div style={{padding:"10px 14px",borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>Current Worksite</div>
                  {current?(
                    <div style={{padding:"10px 12px",background:"var(--green-dim)",borderRadius:8,border:"1px solid rgba(16,185,129,0.2)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <Icon name="pin" size={12} color="var(--green)"/>
                        <span style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{current.worksite_name}</span>
                      </div>
                      {current.worksite_address&&<div style={{fontSize:11,color:"var(--text3)",paddingLeft:18}}>{current.worksite_address}</div>}
                      <div style={{fontSize:10,color:"var(--text3)",paddingLeft:18,marginTop:2}}>
                        {parseFloat(current.latitude).toFixed(4)}°, {parseFloat(current.longitude).toFixed(4)}° · {current.radius_feet}ft
                      </div>
                    </div>
                  ):(
                    <div style={{padding:"10px 12px",background:"var(--red-dim)",borderRadius:8,border:"1px solid rgba(239,68,68,0.2)",display:"flex",gap:8,alignItems:"center"}}>
                      <Icon name="alert" size={13} color="var(--red)"/>
                      <span style={{fontSize:12,color:"var(--red)",fontWeight:500}}>No worksite assigned — cannot clock in</span>
                    </div>
                  )}
                </div>

                {/* Assign options */}
                <div style={{padding:"10px 14px"}}>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>Assign to Worksite</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {worksites.map(w=>{
                      const isA=allEmpA.some(a=>a.worksite_id===w.id&&a.is_default);
                      return(
                        <button key={w.id} onClick={()=>!isA&&handleAssign(w.id,emp.id)} style={{
                          display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,
                          border:`1px solid ${isA?"rgba(16,185,129,0.3)":"var(--border)"}`,
                          background:isA?"var(--green-dim)":"var(--bg3)",
                          cursor:isA?"default":"pointer",textAlign:"left",width:"100%",minHeight:48}}>
                          <div style={{width:28,height:28,borderRadius:8,background:isA?"var(--green-dim)":"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <Icon name="pin" size={13} color={isA?"var(--green)":"var(--amber)"}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:isA?"var(--green)":"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {w.project_name||w.name}
                            </div>
                            {w.address&&<div style={{fontSize:10,color:"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.address}</div>}
                            <div style={{fontSize:10,color:"var(--text3)"}}>🎯 {w.radius_feet}ft</div>
                          </div>
                          {isA?(
                            <span style={{fontSize:10,color:"var(--green)",fontWeight:700,background:"var(--green-dim)",padding:"2px 8px",borderRadius:999,flexShrink:0}}>✓ Active</span>
                          ):(
                            <span style={{fontSize:10,color:"var(--text3)",padding:"2px 8px",borderRadius:999,flexShrink:0,background:"var(--bg2)",border:"1px solid var(--border)"}}>Tap to assign</span>
                          )}
                        </button>
                      );
                    })}
                    {worksites.length===0&&<div style={{fontSize:12,color:"var(--text3)",padding:"8px 0"}}>No worksites available. Create one first.</div>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {(showAdd||editingWS)&&<WorksiteModal/>}

      {showMapPicker&&(
        <MapPicker
          title="Find Worksite on Map"
          onPick={(lat,lon)=>{
            if(latRef.current)latRef.current.value=lat.toFixed(7);
            if(lonRef.current)lonRef.current.value=lon.toFixed(7);
          }}
          onClose={()=>setShowMapPicker(false)}
        />
      )}

      {assigningTo&&(
        <Modal title={`Assign to: ${assigningTo.project_name||assigningTo.name}`} onClose={()=>setAssigningTo(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {assigningTo.address&&<div style={{fontSize:12,color:"var(--text3)",marginBottom:4,padding:"8px 10px",background:"var(--bg3)",borderRadius:8}}>{assigningTo.address}</div>}
            <p style={{fontSize:12,color:"var(--text3)",marginBottom:4}}>Select employee to assign:</p>
            {employees.map(emp=>{
              const current=getEmpWS(emp.id);
              const isHere=assignments.some(a=>a.worksite_id===assigningTo.id&&a.employee_id===emp.id&&a.is_default);
              return(
                <button key={emp.id} onClick={()=>{handleAssign(assigningTo.id,emp.id);setAssigningTo(null);}} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,
                  border:`1px solid ${isHere?"rgba(16,185,129,0.3)":"var(--border)"}`,
                  background:isHere?"var(--green-dim)":"var(--bg3)",
                  cursor:"pointer",textAlign:"left",width:"100%",minHeight:52}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:isHere?"var(--green-dim)":"var(--amber-dim)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="user" size={16} color={isHere?"var(--green)":"var(--amber2)"}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:isHere?"var(--green)":"var(--text)"}}>{emp.name||emp.full_name}{isHere&&" ✓"}</div>
                    <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>
                      {emp.user_id&&<span style={{color:"var(--amber)",fontWeight:700,marginRight:6}}>{emp.user_id}</span>}
                      {current?<span>Currently: <span style={{color:"var(--text)"}}>{current.worksite_name}</span></span>:<span style={{color:"var(--red)"}}>Not assigned</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── MY ATTENDANCE ─────────────────────────────────────────────────────────────
function MyAttendance({t}){
  const[sessions,setSessions]=useState([]);
  const[filter,setFilter]=useState("week");
  const[loading,setLoading]=useState(true);
  const fetch_=useCallback(async()=>{
    try{const r=await authFetch("/api/attendance/me");const d=await r.json();setSessions(Array.isArray(d)?d:[]);}catch{}
    setLoading(false);
  },[]);
  useEffect(()=>{fetch_();},[fetch_]);
  useEffect(()=>{const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[fetch_]);
  const filtered=sessions.filter(s=>{
    const diff=Math.floor((Date.now()-new Date(s.work_date).getTime())/86400000);
    if(filter==="week")return diff<7;if(filter==="month")return diff<30;return true;
  }).sort((a,b)=>b.work_date.localeCompare(a.work_date));
  const totalMins=filtered.reduce((a,s)=>a+(s.worked_minutes||0),0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.myAttendance} subtitle="Your attendance history"
        action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>{t.refresh}</Btn>}/>
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
                {filtered.length===0?<tr><td colSpan={6} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No records.</td></tr>
                :filtered.map(s=>(
                  <tr key={s.id}>
                    <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{fmtDate(s.work_date)}</td>
                    <td style={{fontSize:11}}>{fmtTime(s.clock_in_time)}</td>
                    <td style={{fontSize:11}}>{fmtTime(s.clock_out_time)}</td>
                    <td style={{fontSize:11}}>{fmtMins(s.break_minutes)}</td>
                    <td style={{color:s.is_overtime?"var(--orange)":"var(--green)",fontWeight:600,fontSize:12}}>
                      {s.status==="active"&&s.clock_in_time
                        ? fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0)))
                        : fmtMins(s.worked_minutes)}
                      {s.is_overtime&&" 🔥"}
                    </td>
                    <td><StatusBadge status={s.status==="completed"?"clocked_out":s.is_overtime?"overtime":"clocked_in"}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── MY PROFILE ────────────────────────────────────────────────────────────────
function MyProfile({user,addToast,employeeWorksite,t}){
  const[summary,setSummary]=useState(null);
  const[schedule,setSchedule]=useState(null);
  useEffect(()=>{
    authFetch("/api/attendance/me/summary").then(r=>r.json()).then(d=>setSummary(d)).catch(()=>{});
    authFetch(`/api/employees/${user.id}/schedule`).then(r=>r.json()).then(d=>setSchedule(d)).catch(()=>{});
  },[user.id]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.myProfile}/>
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
      </Card>

      {/* Assigned worksite */}
      {employeeWorksite&&(
        <Card style={{border:"1px solid rgba(245,158,11,0.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <Icon name="pin" size={15} color="var(--amber)"/>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>{t.assignedWorksite}</h3>
            <span style={{background:"var(--green-dim)",color:"var(--green)",padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:600}}>Active</span>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:3}}>{employeeWorksite.project_name||employeeWorksite.name}</div>
          {employeeWorksite.address&&<div style={{fontSize:12,color:"var(--text3)",marginBottom:4}}>{employeeWorksite.address}</div>}
          <div style={{fontSize:11,color:"var(--text3)"}}>{parseFloat(employeeWorksite.latitude).toFixed(4)}°, {parseFloat(employeeWorksite.longitude).toFixed(4)}° · {employeeWorksite.radius_feet}ft</div>
        </Card>
      )}

      {/* Schedule */}
      {schedule&&(
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <Icon name="clock" size={15} color="var(--blue)"/>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>{t.mySchedule}</h3>
          </div>
          {[
            [t.workHours,`${schedule.scheduled_start_time?.slice(0,5)||"07:00"} – ${schedule.scheduled_end_time?.slice(0,5)||"17:00"}`],
            [t.workingDays,(schedule.working_days||[]).join(", ")],
            [t.grace,`${schedule.grace_minutes||15} minutes`],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(30,45,69,0.3)"}}>
              <span style={{fontSize:12,color:"var(--text3)"}}>{k}</span>
              <span style={{fontSize:12,fontWeight:500,color:"var(--text)"}}>{v}</span>
            </div>
          ))}
        </Card>
      )}

      {summary&&(
        <Card>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:12}}>Work Summary</h3>
          {[["Total Sessions",summary.total_sessions],["Total Hours",`${Math.round(summary.total_minutes/60)}h`],["Daily Avg",fmtMins(Math.round(summary.avg_daily_minutes))],["This Week",`${Math.round(summary.week_minutes/60)}h`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(30,45,69,0.3)"}}>
              <span style={{fontSize:12,color:"var(--text3)"}}>{k}</span>
              <span style={{fontSize:13,fontWeight:600,color:"var(--text)",fontFamily:"'Syne',sans-serif"}}>{v}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── EMPLOYEE LIST ─────────────────────────────────────────────────────────────
function EmployeeList({adminData,refreshAdminData,addToast,worksites,t}){
  const[search,setSearch]=useState("");
  const[adding,setAdding]=useState(false);
  const[editingSchedule,setEditingSchedule]=useState(null);
  const[scheduleData,setScheduleData]=useState(null);
  const nameRef=useRef(null),emailRef=useRef(null),passRef=useRef(null);
  const userIdRef=useRef(null),deptRef=useRef(null),desigRef=useRef(null),codeRef=useRef(null);
  const[role,setRole]=useState("employee");
  const[showPass,setShowPass]=useState(false);
  const startRef=useRef(null),endRef=useRef(null),graceRef=useRef(null);

  const employees=adminData.employees.filter(u=>
    u.name?.toLowerCase().includes(search.toLowerCase())||
    u.email?.toLowerCase().includes(search.toLowerCase())||
    u.employee_code?.toLowerCase().includes(search.toLowerCase())||
    u.user_id?.includes(search)
  );

  const handleAdd=async()=>{
    const name=nameRef.current?.value;const pass=passRef.current?.value;
    if(!name||!pass){addToast("Name and password required.","error");return;}
    const res=await authFetch("/api/admin/employees",{method:"POST",body:JSON.stringify({
      name,email:emailRef.current?.value||null,password:pass,role,
      department:deptRef.current?.value,designation:desigRef.current?.value,
      employeeCode:codeRef.current?.value,userId:userIdRef.current?.value||null,
    })});
    const d=await res.json();
    if(!res.ok){addToast(d.error||"Failed.","error");return;}
    addToast(`Employee added. User ID: ${d.userId}`,"success");
    setAdding(false);refreshAdminData();
  };

  const handleDelete=async(uid)=>{
    if(!confirm("Deactivate this employee?"))return;
    await authFetch(`/api/admin/employees/${uid}`,{method:"DELETE"});
    addToast("Deactivated.","info");refreshAdminData();
  };

  const openSchedule=async(emp)=>{
    setEditingSchedule(emp);
    const r=await authFetch(`/api/employees/${emp.id}/schedule`);
    if(r.ok){const d=await r.json();setScheduleData(d);}else setScheduleData(null);
  };

  const saveSchedule=async()=>{
    if(!editingSchedule)return;
    const res=await authFetch(`/api/employees/${editingSchedule.id}/schedule`,{
      method:"PUT",
      body:JSON.stringify({
        scheduledStartTime:startRef.current?.value||"07:00",
        scheduledEndTime:endRef.current?.value||"17:00",
        graceMinutes:parseInt(graceRef.current?.value)||15,
        workingDays:["Mon","Tue","Wed","Thu","Fri"],
      }),
    });
    if(!res.ok){addToast("Failed to save schedule.","error");return;}
    addToast("Schedule saved.","success");setEditingSchedule(null);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.employees} subtitle={`${employees.length} members`}
        action={<Btn onClick={()=>setAdding(a=>!a)} variant={adding?"secondary":"primary"} size="sm">
          {adding?t.cancel:<><Icon name="plus" size={13} color="#0b0f1a"/>{t.add}</>}
        </Btn>}/>

      {adding&&(
        <Card style={{border:"1px solid var(--amber-glow)"}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:14,color:"var(--amber)"}}>New Employee</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Full Name *</label>
              <input type="text" ref={nameRef} placeholder="Full name" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>User ID (4-char)</label>
                <input type="text" ref={userIdRef} placeholder="Auto" maxLength={4} style={{fontSize:16,textAlign:"center",letterSpacing:"0.2em"}} autoCorrect="off" autoCapitalize="off"/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Password *</label>
                <div style={{position:"relative"}}>
                  <input type={showPass?"text":"password"} ref={passRef} placeholder="Password" style={{fontSize:16,paddingRight:44}} autoCorrect="off"/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text3)",cursor:"pointer",padding:4,display:"flex",minWidth:28,minHeight:28,alignItems:"center",justifyContent:"center"}}>
                    <Icon name={showPass?"eyeOff":"eye"} size={16}/>
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Email (optional)</label>
              <input type="email" ref={emailRef} placeholder="email@brightsky.com" style={{fontSize:16}} autoCorrect="off" autoCapitalize="off"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Department</label>
                <input type="text" ref={deptRef} placeholder="Construction" style={{fontSize:16}} autoCorrect="off"/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Designation</label>
                <input type="text" ref={desigRef} placeholder="Site Worker" style={{fontSize:16}} autoCorrect="off"/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Employee Code</label>
              <input type="text" ref={codeRef} placeholder="BSC-012" style={{fontSize:16}} autoCorrect="off" autoCapitalize="characters"/>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Role</label>
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
                  <div style={{fontSize:10,color:"var(--text3)"}}>{u.email||""} {u.department?`· ${u.department}`:""}</div>
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

      {/* Schedule modal */}
      {editingSchedule&&(
        <Modal title={`Schedule — ${editingSchedule.name}`} onClose={()=>setEditingSchedule(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{padding:"10px",borderRadius:8,background:"var(--blue-dim)",border:"1px solid rgba(59,130,246,0.2)",fontSize:12,color:"var(--blue)"}}>
              This schedule is used for auto clock-in/out and overtime detection.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Start Time</label>
                <input type="time" ref={startRef} defaultValue={scheduleData?.scheduled_start_time?.slice(0,5)||"07:00"} style={{fontSize:16}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>End Time</label>
                <input type="time" ref={endRef} defaultValue={scheduleData?.scheduled_end_time?.slice(0,5)||"17:00"} style={{fontSize:16}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Grace Period (minutes)</label>
              <input type="text" inputMode="numeric" ref={graceRef} defaultValue={scheduleData?.grace_minutes||15} placeholder="15" style={{fontSize:16}} autoCorrect="off"/>
            </div>
            <div style={{padding:"10px",background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
              <div style={{fontSize:11,color:"var(--text3)",marginBottom:4}}>Working Days (default)</div>
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
function AttendancePage({adminData,t}){
  const[empFilter,setEmpFilter]=useState("all");
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[records,setRecords]=useState([]);
  const[loading,setLoading]=useState(true);
  const fetch_=useCallback(async()=>{
    const p=new URLSearchParams();
    if(empFilter!=="all")p.set("user_id",empFilter);
    if(dateFrom)p.set("date_from",dateFrom);
    if(dateTo)p.set("date_to",dateTo);
    setLoading(true);
    try{const r=await authFetch(`/api/admin/attendance?${p}`);const d=await r.json();setRecords(Array.isArray(d)?d:[]);}catch{}
    setLoading(false);
  },[empFilter,dateFrom,dateTo]);
  useEffect(()=>{fetch_();},[fetch_]);
  useEffect(()=>{const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[fetch_]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.attendance} subtitle={`${records.length} records`}
        action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>{t.refresh}</Btn>}/>
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
            <table style={{minWidth:500}}>
              <thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th>Worked</th><th>Status</th></tr></thead>
              <tbody>
                {records.length===0?<tr><td colSpan={6} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No records.</td></tr>
                :records.map(s=>(
                  <tr key={s.id}>
                    <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{s.name||"—"}</td>
                    <td style={{fontSize:11}}>{fmtDate(s.work_date)}</td>
                    <td style={{fontSize:11}}>{fmtTime(s.clock_in_time)}</td>
                    <td style={{fontSize:11}}>{fmtTime(s.clock_out_time)}</td>
                    <td style={{color:s.is_overtime?"var(--orange)":"var(--green)",fontWeight:600,fontSize:12}}>
                      {s.status==="active"&&s.clock_in_time
                        ? fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0)))
                        : fmtMins(s.worked_minutes)}
                      {s.is_overtime&&" 🔥"}
                    </td>
                    <td><StatusBadge status={s.status==="completed"?"clocked_out":s.is_overtime?"overtime":"clocked_in"}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function ReportsPage({adminData,t}){
  const[summary,setSummary]=useState(adminData.summary||[]);
  const[loading,setLoading]=useState(false);
  useEffect(()=>{setSummary(adminData.summary||[]);},[adminData.summary]);
  const fetch_=useCallback(async()=>{
    setLoading(true);
    try{const r=await authFetch("/api/admin/reports/summary");if(r.ok){const d=await r.json();setSummary(Array.isArray(d)?d:[]);}}catch{}
    setLoading(false);
  },[]);
  useEffect(()=>{fetch_();},[fetch_]);
  useEffect(()=>{const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[fetch_]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.reports} subtitle="Hours summary & analytics"
        action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>{t.refresh}</Btn>}/>
      {summary.length>0&&(
        <Card>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:12}}>Weekly Hours</h3>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100}}>
            {summary.map(u=>{
              const h=Math.round(u.week_minutes/60);
              const barH=Math.min(90,Math.round(h/50*90));
              return(
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
              {summary.length===0?<tr><td colSpan={6} style={{textAlign:"center",color:"var(--text3)",padding:20}}>No data.</td></tr>
              :summary.map(u=>(
                <tr key={u.id}>
                  <td style={{color:"var(--text)",fontWeight:500,fontSize:12}}>{u.name}</td>
                  <td><span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"var(--amber)"}}>{u.user_id||"—"}</span></td>
                  <td style={{fontWeight:700,color:"var(--text)"}}>{u.total_sessions}</td>
                  <td style={{color:"var(--amber)",fontWeight:600}}>{Math.round(u.total_minutes/60)}h</td>
                  <td style={{color:"var(--green)",fontWeight:600}}>{Math.round(u.week_minutes/60)}h</td>
                  <td style={{textAlign:"center"}}><span style={{background:"var(--blue-dim)",color:"var(--blue)",padding:"2px 7px",borderRadius:999,fontSize:11,fontWeight:600}}>{u.total_breaks||0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPage({settings,addToast,refreshSettings,t}){
  const[saving,setSaving]=useState(false);
  const[toggles,setToggles]=useState({
    autoClockInEnabled:settings.autoClockInEnabled??true,
    autoBreakOnExitEnabled:settings.autoBreakOnExitEnabled??true,
    autoCorrectionEnabled:settings.autoCorrectionEnabled??true,
  });
  useEffect(()=>{setToggles({autoClockInEnabled:settings.autoClockInEnabled??true,autoBreakOnExitEnabled:settings.autoBreakOnExitEnabled??true,autoCorrectionEnabled:settings.autoCorrectionEnabled??true});},[settings]);
  const companyRef=useRef(null),startRef=useRef(null),endRef=useRef(null);
  const handleSave=async()=>{
    setSaving(true);
    const res=await authFetch("/api/settings",{method:"PUT",body:JSON.stringify({
      companyName:companyRef.current?.value,
      siteName:settings.siteName,latitude:settings.latitude,longitude:settings.longitude,radiusFeet:settings.radiusFeet,
      workingHoursStart:startRef.current?.value,workingHoursEnd:endRef.current?.value,
      autoClockInEnabled:toggles.autoClockInEnabled,
      autoBreakOnExitEnabled:toggles.autoBreakOnExitEnabled,
      autoCorrectionEnabled:toggles.autoCorrectionEnabled,
    })});
    const d=await res.json();
    if(!res.ok){addToast(d.error||"Failed.","error");setSaving(false);return;}
    localStorage.removeItem("bsc_settings");await refreshSettings();
    addToast("Settings saved.","success");setSaving(false);
  };
  const Toggle=({label,value,onChange,desc})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:"1px solid rgba(30,45,69,0.4)"}}>
      <div style={{flex:1,paddingRight:14}}>
        <div style={{fontSize:13,color:"var(--text)",fontWeight:500}}>{label}</div>
        {desc&&<div style={{fontSize:11,color:"var(--text3)",marginTop:2,lineHeight:1.4}}>{desc}</div>}
      </div>
      <button onClick={()=>onChange(!value)} style={{width:48,height:28,borderRadius:14,border:"none",cursor:"pointer",background:value?"var(--amber)":"var(--border)",position:"relative",transition:"background 0.2s",flexShrink:0,minWidth:48}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:3,transition:"left 0.2s",left:value?23:3,boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
      </button>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.settings} subtitle="Company info, schedule and automation"/>
      <div style={{padding:"12px 14px",borderRadius:10,background:"var(--blue-dim)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",gap:10,alignItems:"flex-start"}}>
        <Icon name="pin" size={15} color="var(--blue)" style={{marginTop:1,flexShrink:0}}/>
        <div style={{fontSize:12,color:"var(--blue)",lineHeight:1.5}}>
          Worksite locations are managed in the <strong>Worksites</strong> section. Each employee can be assigned their own worksite with individual geofence settings.
        </div>
      </div>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Icon name="hard_hat" size={15} color="var(--amber)"/>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Company</h3>
        </div>
        <div>
          <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>Company Name</label>
          <input type="text" ref={companyRef} defaultValue={settings.companyName||""} placeholder="Company name" style={{fontSize:16}} autoCorrect="off"/>
        </div>
      </Card>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Icon name="clock" size={15} color="var(--blue)"/>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Default Work Schedule</h3>
        </div>
        <p style={{fontSize:11,color:"var(--text3)",marginBottom:12}}>Default for all employees. Override individually in the Employees section.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>Start Time</label>
            <input type="time" ref={startRef} defaultValue={settings.workStart||"07:00"} style={{fontSize:16}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>End Time</label>
            <input type="time" ref={endRef} defaultValue={settings.workEnd||"17:00"} style={{fontSize:16}}/>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <Icon name="refresh" size={15} color="var(--green)"/>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Automation Rules</h3>
        </div>
        <Toggle label="Auto Clock-In" value={toggles.autoClockInEnabled} onChange={v=>setToggles(t=>({...t,autoClockInEnabled:v}))} desc="Clock in automatically when entering assigned worksite geofence"/>
        <Toggle label="Auto Break on Exit" value={toggles.autoBreakOnExitEnabled} onChange={v=>setToggles(t=>({...t,autoBreakOnExitEnabled:v}))} desc="Start break when leaving the worksite geofence"/>
        <Toggle label="Auto Punch Correction" value={toggles.autoCorrectionEnabled} onChange={v=>setToggles(t=>({...t,autoCorrectionEnabled:v}))} desc="Fix missing punches automatically"/>
      </Card>
      <Btn onClick={handleSave} loading={saving} size="lg" style={{width:"100%"}}>
        <Icon name="check" size={15} color="#0b0f1a"/>{t.save} Settings
      </Btn>
    </div>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function ExportPage({adminData,addToast,t}){
  const[empFilter,setEmpFilter]=useState("all");
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[loading,setLoading]=useState(false);
  const handleExport=async()=>{
    setLoading(true);
    const p=new URLSearchParams();
    if(empFilter!=="all")p.set("user_id",empFilter);
    if(dateFrom)p.set("date_from",dateFrom);
    if(dateTo)p.set("date_to",dateTo);
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
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.export} subtitle="Download attendance as CSV"/>
      <Card>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
          <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{fontSize:16}}>
            <option value="all">All Employees</option>
            {adminData.employees.map(u=><option key={u.id} value={u.id}>{u.name}{u.user_id?` (${u.user_id})`:""}</option>)}
          </select>
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
function AuditPage({t}){
  const[logs,setLogs]=useState([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{
    authFetch("/api/audit-logs").then(r=>r.json()).then(d=>{setLogs(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));
  },[]);
  const colors={clock_in:"var(--green)",clock_out:"var(--red)",break_start:"var(--amber)",break_end:"var(--amber2)",update_settings:"var(--blue)",auto_clock_in:"var(--purple)"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <SectionHeader title={t.auditLogs} subtitle="All system events"/>
      <Card>
        {loading?<div style={{textAlign:"center",padding:24,color:"var(--text3)"}}>Loading...</div>
        :logs.length===0?<div style={{textAlign:"center",padding:24,color:"var(--text3)"}}>No logs yet.</div>
        :<div style={{display:"flex",flexDirection:"column"}}>
          {logs.map((log,i)=>(
            <div key={log.id} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<logs.length-1?"1px solid rgba(30,45,69,0.35)":"none",alignItems:"flex-start"}}>
              <div style={{width:7,height:7,borderRadius:"50%",flexShrink:0,marginTop:4,background:colors[log.action_type]||"var(--text3)"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:colors[log.action_type]||"var(--text2)",fontWeight:500}}>{(log.action_type||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</div>
                <div style={{fontSize:10,color:"var(--text3)",marginTop:1}}>Entity: {log.entity_type} · IP: {log.ip_address}</div>
              </div>
              <div style={{fontSize:10,color:"var(--text3)",flexShrink:0,textAlign:"right"}}>
                <div>{fmtDate(log.created_at)}</div><div>{fmtTime(log.created_at)}</div>
              </div>
            </div>
          ))}
        </div>}
      </Card>
    </div>
  );
}