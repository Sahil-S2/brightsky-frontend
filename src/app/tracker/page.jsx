"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://brightsky-api.sahilswarajjena456.workers.dev";

const getDeviceFingerprint = () => {
  try {
    const fp = [navigator.userAgent,navigator.language,screen.width,screen.height,screen.colorDepth,new Date().getTimezoneOffset(),navigator.hardwareConcurrency||""].join("|");
    let hash = 0;
    for (let i = 0; i < fp.length; i++) { hash = ((hash << 5) - hash) + fp.charCodeAt(i); hash |= 0; }
    return Math.abs(hash).toString(36);
  } catch { return "unknown"; }
};

const vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };

const T = {
  en: {
    signIn:"Sign In",userId:"User ID",password:"Password",clockIn:"Clock In",clockOut:"Clock Out",
    startBreak:"Start Break",endBreak:"End Break",onSite:"On Site",offSite:"Off Site",locating:"Locating…",
    dashboard:"Dashboard",employees:"Employees",worksites:"Worksites",attendance:"Attendance",
    reports:"Reports",settings:"Settings",export:"Export",auditLogs:"Audit Logs",
    myAttendance:"My Attendance",myProfile:"My Profile",signOut:"Sign Out",
    today:"Today",status:"Status",breaks:"Breaks",punches:"Punches",
    active:"Active",onBreak:"On Break",inactive:"Inactive",overtime:"Overtime",
    clockedIn:"Clocked In",clockedOut:"Clocked Out",autoClockIn:"Auto Clock-In",
    noActivity:"No activity yet today.",morning:"Good Morning",afternoon:"Good Afternoon",evening:"Good Evening",
    welcomeBack:"Welcome back",missedClockOutMsg:"You have an active session from yesterday. Please clock out.",
    assignedWorksite:"Assigned Worksite",mySchedule:"My Schedule",workHours:"Work Hours",
    workingDays:"Working Days",grace:"Grace Period",language:"Language",
    updateLocation:"Update My Location",locationUpdated:"Location updated.",
    adminLogin:"Admin login with email",useUserId:"Use Employee ID instead",
    tapToChange:"Change Photo",refresh:"Refresh",save:"Save",cancel:"Cancel",
    add:"Add",edit:"Edit",assign:"Assign",remove:"Remove",close:"Close",
  },
  es: {
    signIn:"Iniciar Sesión",userId:"ID de Usuario",password:"Contraseña",clockIn:"Registrar Entrada",
    clockOut:"Registrar Salida",startBreak:"Iniciar Descanso",endBreak:"Terminar Descanso",
    onSite:"En Sitio",offSite:"Fuera del Sitio",locating:"Localizando…",
    dashboard:"Panel",employees:"Empleados",worksites:"Sitios",attendance:"Asistencia",
    reports:"Reportes",settings:"Configuración",export:"Exportar",auditLogs:"Auditoría",
    myAttendance:"Mi Asistencia",myProfile:"Mi Perfil",signOut:"Cerrar Sesión",
    today:"Hoy",status:"Estado",breaks:"Descansos",punches:"Registros",
    active:"Activo",onBreak:"En Descanso",inactive:"Inactivo",overtime:"Horas Extra",
    clockedIn:"Entrada Registrada",clockedOut:"Salida Registrada",autoClockIn:"Entrada Automática",
    noActivity:"Sin actividad hoy.",morning:"Buenos Días",afternoon:"Buenas Tardes",evening:"Buenas Noches",
    welcomeBack:"Bienvenido",missedClockOutMsg:"Tienes una sesión activa de ayer. Registra tu salida.",
    assignedWorksite:"Sitio Asignado",mySchedule:"Mi Horario",workHours:"Horario",
    workingDays:"Días de Trabajo",grace:"Período de Gracia",language:"Idioma",
    updateLocation:"Actualizar Ubicación",locationUpdated:"Ubicación actualizada.",
    adminLogin:"Acceso con correo",useUserId:"Usar ID de empleado",
    tapToChange:"Cambiar Foto",refresh:"Actualizar",save:"Guardar",cancel:"Cancelar",
    add:"Agregar",edit:"Editar",assign:"Asignar",remove:"Quitar",close:"Cerrar",
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
        const d = await r.json(); localStorage.setItem("accessToken",d.accessToken); token=d.accessToken;
        res = await fetch(`${API}${path}`,{...opts,credentials:"include",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...opts.headers}});
      } else { localStorage.removeItem("accessToken"); localStorage.removeItem("bsc_session"); window.location.reload(); }
    } catch { localStorage.removeItem("accessToken"); localStorage.removeItem("bsc_session"); window.location.reload(); }
  }
  return res;
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:#f5f7fa; --bg2:#ffffff; --bg3:#f0f2f5; --card:#ffffff; --border:#e4e8ee; --border2:#d0d7e3;
      --blue:#2563eb; --blue-light:#eff4ff; --blue-mid:#dbeafe; --blue-dim:rgba(37,99,235,0.08); --blue-hover:#1d4ed8;
      --green:#059669; --green-light:#ecfdf5; --green-dim:rgba(5,150,105,0.08);
      --amber:#d97706; --amber-light:#fffbeb; --amber-dim:rgba(217,119,6,0.08);
      --red:#dc2626; --red-light:#fef2f2; --red-dim:rgba(220,38,38,0.08);
      --orange:#ea580c; --orange-light:#fff7ed; --orange-dim:rgba(234,88,12,0.08);
      --purple:#7c3aed; --purple-dim:rgba(124,58,237,0.08);
      --text:#111827; --text2:#374151; --text3:#6b7280; --text4:#9ca3af;
      --shadow-sm:0 1px 2px rgba(0,0,0,0.04),0 1px 3px rgba(0,0,0,0.06);
      --shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);
      --shadow-md:0 4px 16px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.05);
      --shadow-lg:0 8px 32px rgba(0,0,0,0.1),0 4px 12px rgba(0,0,0,0.06);
      --radius-sm:6px; --radius:10px; --radius-lg:14px; --radius-xl:20px;
    }
    html,body{height:100%;-webkit-text-size-adjust:100%;}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
    ::-webkit-scrollbar{width:5px;height:5px;} ::-webkit-scrollbar-track{background:var(--bg3);} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    @keyframes pulse-ring{0%{transform:scale(1);opacity:0.5;}100%{transform:scale(2.2);opacity:0;}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes badge-in{from{transform:scale(0.8);opacity:0;}to{transform:scale(1);opacity:1;}}
    @keyframes shake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-5px);}40%,80%{transform:translateX(5px);}}
    @keyframes overtime-glow{0%,100%{opacity:1;}50%{opacity:0.65;}}
    @keyframes slide-down{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
    .fade-up{animation:fadeUp 0.3s ease both;} .fade-up-d1{animation:fadeUp 0.3s 0.04s ease both;}
    .fade-up-d2{animation:fadeUp 0.3s 0.08s ease both;} .fade-up-d3{animation:fadeUp 0.3s 0.12s ease both;}
    .fade-up-d4{animation:fadeUp 0.3s 0.16s ease both;} .spin{animation:spin 0.8s linear infinite;}
    .shake{animation:shake 0.4s ease;} .overtime-glow{animation:overtime-glow 2s ease infinite;}
    .slide-down{animation:slide-down 0.2s ease both;}
    input,select,textarea{
      font-family:'Inter',sans-serif;background:var(--bg3);border:1.5px solid var(--border);
      color:var(--text);border-radius:var(--radius);padding:10px 14px;font-size:16px;
      width:100%;outline:none;transition:border-color 0.15s,box-shadow 0.15s,background 0.15s;
      -webkit-appearance:none;appearance:none;
    }
    input:focus,select:focus,textarea:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px var(--blue-dim);}
    input::placeholder{color:var(--text4);}
    select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:38px;cursor:pointer;}
    button{font-family:'Inter',sans-serif;cursor:pointer;border:none;outline:none;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}
    button:disabled{opacity:0.5;cursor:not-allowed;}
    table{border-collapse:collapse;width:100%;}
    th{font-family:'Inter',sans-serif;font-weight:600;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);padding:10px 14px;text-align:left;border-bottom:1.5px solid var(--border);background:var(--bg3);}
    td{padding:11px 14px;font-size:13.5px;color:var(--text2);border-bottom:1px solid var(--border);}
    tr:last-child td{border-bottom:none;} tr:hover td{background:#fafbfc;}
    .pin-dot{width:13px;height:13px;border-radius:50%;background:var(--blue);display:inline-block;flex-shrink:0;transition:all 0.2s;box-shadow:0 0 0 3px var(--blue-mid);}
    .pin-dot.empty{background:transparent;border:2px solid var(--border2);box-shadow:none;}
  `}</style>
);

const fmtTime=(d)=>d?new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—";
const fmtDate=(d)=>d?new Date(d).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}):"—";
const fmtMins=(m)=>{if(!m&&m!==0)return"—";const h=Math.floor(m/60),min=m%60;return h?`${h}h ${min}m`:`${min}m`;};
const dayName=(dateStr)=>{const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];return days[new Date(dateStr).getDay()];};

function distanceFeet(lat1,lon1,lat2,lon2){
  const R=20902231,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const DEFAULT_SETTINGS={companyName:"Bright Sky Construction",siteName:"",latitude:null,longitude:null,radiusFeet:null,workStart:"07:00",workEnd:"17:00",autoClockInEnabled:true,autoBreakOnExitEnabled:true,autoCorrectionEnabled:true};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const StatusBadge=({status})=>{
  const cfg={
    clocked_in:{label:"Clocked In",bg:"var(--green-light)",c:"var(--green)",b:"rgba(5,150,105,0.2)",dot:true},
    on_break:{label:"On Break",bg:"var(--amber-light)",c:"var(--amber)",b:"rgba(217,119,6,0.2)",dot:true},
    clocked_out:{label:"Clocked Out",bg:"var(--bg3)",c:"var(--text3)",b:"var(--border)",dot:false},
    overtime:{label:"Overtime",bg:"var(--orange-light)",c:"var(--orange)",b:"rgba(234,88,12,0.2)",dot:true},
    auto_corrected:{label:"Auto Fixed",bg:"var(--blue-light)",c:"var(--blue)",b:"var(--blue-mid)",dot:false},
  }[status]||{label:status||"Unknown",bg:"var(--bg3)",c:"var(--text3)",b:"var(--border)",dot:false};
  return(<span style={{display:"inline-flex",alignItems:"center",gap:5,background:cfg.bg,color:cfg.c,padding:"3px 10px",borderRadius:999,fontSize:11.5,fontWeight:600,border:`1px solid ${cfg.b}`,animation:"badge-in 0.2s ease both",whiteSpace:"nowrap"}}>
    {cfg.dot&&<span style={{width:6,height:6,borderRadius:"50%",background:cfg.c,display:"inline-block",flexShrink:0}}/>}
    {cfg.label}
  </span>);
};

const Card=({children,style={},className=""})=>(
  <div className={className} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:20,boxShadow:"var(--shadow-sm)",...style}}>{children}</div>
);

const StatCard=({label,value,icon,color="var(--blue)",sub,flash})=>(
  <Card style={{display:"flex",flexDirection:"column",gap:10,padding:16,...(flash?{border:"1.5px solid rgba(234,88,12,0.3)",background:"var(--orange-light)"}:{})}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <span style={{fontSize:11,color:"var(--text3)",letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:600,lineHeight:1.3}}>{label}</span>
      <span style={{color,background:`${color}14`,padding:"7px",borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name={icon} size={14} color={color}/>
      </span>
    </div>
    <div style={{fontSize:24,fontWeight:700,color:flash?"var(--orange)":"var(--text)",lineHeight:1.2,wordBreak:"break-word"}}>{value}</div>
    {sub&&<div style={{fontSize:11.5,color:"var(--text3)",fontWeight:400}}>{sub}</div>}
  </Card>
);

const SectionHeader=({title,subtitle,action})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
    <div>
      <h2 style={{fontSize:17,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em"}}>{title}</h2>
      {subtitle&&<p style={{color:"var(--text3)",fontSize:13,marginTop:3,fontWeight:400}}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Btn=({children,onClick,variant="primary",size="md",disabled,style:s={},loading})=>{
  const sizes={sm:{padding:"6px 14px",fontSize:13,height:34},md:{padding:"9px 18px",fontSize:14,height:40},lg:{padding:"12px 24px",fontSize:15,height:48}};
  const variants={
    primary:{background:"var(--blue)",color:"#fff",fontWeight:600,boxShadow:"0 1px 3px rgba(37,99,235,0.3)"},
    secondary:{background:"var(--bg3)",color:"var(--text2)",border:"1.5px solid var(--border)",fontWeight:500},
    danger:{background:"var(--red-light)",color:"var(--red)",border:"1.5px solid rgba(220,38,38,0.2)",fontWeight:500},
    ghost:{background:"transparent",color:"var(--text2)",border:"1.5px solid var(--border)",fontWeight:500},
    green:{background:"var(--green-light)",color:"var(--green)",border:"1.5px solid rgba(5,150,105,0.2)",fontWeight:600},
    blue:{background:"var(--blue-light)",color:"var(--blue)",border:"1.5px solid var(--blue-mid)",fontWeight:600},
    orange:{background:"var(--orange-light)",color:"var(--orange)",border:"1.5px solid rgba(234,88,12,0.2)",fontWeight:600},
  };
  return(<button onClick={onClick} disabled={disabled||loading}
    style={{...sizes[size],...variants[variant],borderRadius:"var(--radius)",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'Inter',sans-serif",transition:"all 0.15s",minHeight:sizes[size].height,...s}}
    onMouseEnter={e=>{if(!disabled){e.currentTarget.style.filter="brightness(0.95)";e.currentTarget.style.transform="translateY(-1px)";}}}
    onMouseLeave={e=>{e.currentTarget.style.filter="";e.currentTarget.style.transform="";}}>
    {loading&&<span className="spin" style={{width:13,height:13,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",flexShrink:0}}/>}
    {children}
  </button>);
};

const Toast=({toasts,removeToast})=>(
  <div style={{position:"fixed",bottom:16,left:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none",maxWidth:420,margin:"0 auto"}}>
    {toasts.map(t=>(
      <div key={t.id} className="fade-up" style={{background:"#fff",border:`1.5px solid ${t.type==="error"?"#fecaca":t.type==="success"?"#bbf7d0":t.type==="warning"?"#fde68a":"#bfdbfe"}`,borderRadius:"var(--radius-lg)",padding:"12px 16px",display:"flex",gap:10,alignItems:"center",color:t.type==="error"?"var(--red)":t.type==="success"?"var(--green)":t.type==="warning"?"var(--amber)":"var(--blue)",boxShadow:"var(--shadow-md)",pointerEvents:"all"}}>
        <Icon name={t.type==="error"?"x":"check"} size={15}/>
        <span style={{fontSize:13.5,color:"var(--text2)",flex:1,fontWeight:450}}>{t.message}</span>
        <button onClick={()=>removeToast(t.id)} style={{background:"none",color:"var(--text3)",fontSize:18,lineHeight:1,padding:"0 2px"}}>×</button>
      </div>
    ))}
  </div>
);

const LocationIndicator=({onSite,distance,loading})=>{
  if(loading)return(<div style={{display:"flex",alignItems:"center",gap:6,background:"var(--bg3)",border:"1.5px solid var(--border)",borderRadius:"var(--radius)",padding:"6px 12px",fontSize:12,color:"var(--text3)",whiteSpace:"nowrap"}}>
    <span className="spin" style={{width:10,height:10,border:"2px solid var(--text4)",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",flexShrink:0}}/><span style={{fontWeight:500}}>Locating…</span>
  </div>);
  return(<div style={{display:"flex",alignItems:"center",gap:6,background:onSite?"var(--green-light)":"var(--red-light)",border:`1.5px solid ${onSite?"rgba(5,150,105,0.25)":"rgba(220,38,38,0.25)"}`,borderRadius:"var(--radius)",padding:"6px 12px",fontSize:12,color:onSite?"var(--green)":"var(--red)",whiteSpace:"nowrap"}}>
    <span style={{width:7,height:7,borderRadius:"50%",background:onSite?"var(--green)":"var(--red)",flexShrink:0}}/><span style={{fontWeight:600}}>{onSite?"On Site":"Off Site"}</span>
    {distance!=null&&<span style={{opacity:0.7,fontSize:11}}>· {Math.round(distance)}ft</span>}
  </div>);
};

const Icon=({name,size=18,color="currentColor",style={}})=>{
  const icons={
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
    navigation:<><polygon points="3 11 22 2 13 21 11 13 3 11"/></>,
    zap:<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    building:<><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></>,
    chevronDown:<><polyline points="6 9 12 15 18 9"/></>,
    chevronUp:<><polyline points="18 15 12 9 6 15"/></>,
    search:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    globe:<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  };
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",flexShrink:0,...style}}>{icons[name]||null}</svg>);
};

const Modal=({title,onClose,children,fullScreen=false})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.4)",zIndex:500,display:"flex",alignItems:fullScreen?"stretch":"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:"var(--card)",borderRadius:fullScreen?"0":"var(--radius-xl) var(--radius-xl) 0 0",width:"100%",maxWidth:560,maxHeight:fullScreen?"100vh":"92vh",overflowY:"auto",padding:24,boxShadow:"var(--shadow-lg)",...(fullScreen?{height:"100vh"}:{})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em"}}>{title}</h3>
        <button onClick={onClose} style={{background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text3)",width:32,height:32,borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <Icon name="close" size={15}/>
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── SIDEBAR PROFILE ──────────────────────────────────────────────────────────
function SidebarProfile({currentUser,handleLogout,lang,setLang}){
  const[photo,setPhoto]=useState(null);
  const[showMenu,setShowMenu]=useState(false);
  const galleryRef=useRef(null);
  const cameraRef=useRef(null);
  useEffect(()=>{try{const s=localStorage.getItem(`bsc_photo_${currentUser.id}`);if(s)setPhoto(s);}catch{}},[currentUser.id]);
  const processFile=(file)=>{
    if(!file)return;
    if(file.size>5*1024*1024){alert("Photo must be under 5MB.");return;}
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement("canvas");const MAX=300;let w=img.width,h=img.height;
        if(w>h){if(w>MAX){h=h*MAX/w;w=MAX;}}else{if(h>MAX){w=w*MAX/h;h=MAX;}}
        canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL("image/jpeg",0.7);setPhoto(compressed);
        try{localStorage.setItem(`bsc_photo_${currentUser.id}`,compressed);}catch{}
      };img.src=ev.target.result;
    };reader.readAsDataURL(file);
  };
  return(
    <div style={{padding:"16px",borderTop:"1px solid var(--border)"}}>
      <div style={{background:"var(--bg3)",borderRadius:"var(--radius-lg)",padding:"14px",border:"1px solid var(--border)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{position:"relative",flexShrink:0}} onClick={()=>setShowMenu(s=>!s)}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid var(--blue-mid)",overflow:"hidden",cursor:"pointer"}}>
              {photo?<img src={photo} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<Icon name="user" size={20} color="var(--blue)"/>}
            </div>
            <div style={{position:"absolute",bottom:0,right:0,width:17,height:17,borderRadius:"50%",background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid var(--bg3)",pointerEvents:"none"}}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>
          <div style={{overflow:"hidden",flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.name}</div>
            <div style={{fontSize:11.5,color:"var(--text3)",textTransform:"capitalize",marginTop:1}}>{currentUser.role}</div>
            {currentUser.userId&&<div style={{display:"inline-flex",alignItems:"center",gap:4,background:"var(--blue-light)",padding:"2px 7px",borderRadius:999,marginTop:3,border:"1px solid var(--blue-mid)"}}>
              <Icon name="key" size={9} color="var(--blue)"/><span style={{fontSize:10.5,fontWeight:700,color:"var(--blue)"}}>{currentUser.userId}</span>
            </div>}
          </div>
        </div>
        {showMenu&&(
          <div style={{marginBottom:12,background:"var(--bg2)",borderRadius:"var(--radius)",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"var(--shadow)"}}>
            <div style={{padding:"8px 12px",fontSize:11,color:"var(--text3)",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",borderBottom:"1px solid var(--border)",background:"var(--bg3)"}}>Change Photo</div>
            <label style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div><div style={{fontSize:13.5,color:"var(--text)",fontWeight:500}}>Choose from Gallery</div><div style={{fontSize:11.5,color:"var(--text3)"}}>Pick from your photos</div></div>
              <input ref={galleryRef} type="file" accept="image/*" onChange={e=>{processFile(e.target.files?.[0]);setShowMenu(false);e.target.value="";}} style={{display:"none"}}/>
            </label>
            <label style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:"var(--green-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <div><div style={{fontSize:13.5,color:"var(--text)",fontWeight:500}}>Take a Photo</div><div style={{fontSize:11.5,color:"var(--text3)"}}>Open your camera</div></div>
              <input ref={cameraRef} type="file" accept="image/*" capture="user" onChange={e=>{processFile(e.target.files?.[0]);setShowMenu(false);e.target.value="";}} style={{display:"none"}}/>
            </label>
            {photo&&<button onClick={()=>{setPhoto(null);try{localStorage.removeItem(`bsc_photo_${currentUser.id}`);}catch{}setShowMenu(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"none",border:"none",cursor:"pointer",minHeight:48}}>
              <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:"var(--red-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="x" size={15} color="var(--red)"/></div>
              <div style={{textAlign:"left"}}><div style={{fontSize:13.5,color:"var(--red)",fontWeight:500}}>Remove Photo</div></div>
            </button>}
            <button onClick={()=>setShowMenu(false)} style={{width:"100%",padding:"11px 14px",background:"none",border:"none",fontSize:13.5,color:"var(--text3)",cursor:"pointer",minHeight:44}}>Cancel</button>
          </div>
        )}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10.5,color:"var(--text3)",marginBottom:6,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase"}}>Language</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["en","🇺🇸 English"],["es","🇪🇸 Español"]].map(([code,label])=>(
              <button key={code} onClick={async()=>{setLang(code);localStorage.setItem("bsc_lang",code);try{await authFetch("/api/security/language",{method:"PUT",body:JSON.stringify({language:code})});}catch{}}} style={{padding:"7px 6px",borderRadius:"var(--radius-sm)",border:"1.5px solid",borderColor:lang===code?"var(--blue)":"var(--border)",background:lang===code?"var(--blue-light)":"var(--bg2)",color:lang===code?"var(--blue)":"var(--text3)",fontSize:12,cursor:"pointer",fontWeight:lang===code?600:400,minHeight:34}}>{label}</button>
            ))}
          </div>
        </div>
        <button onClick={handleLogout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",borderRadius:"var(--radius)",background:"var(--red-light)",color:"var(--red)",border:"1.5px solid rgba(220,38,38,0.2)",fontSize:13.5,cursor:"pointer",fontFamily:"'Inter',sans-serif",minHeight:42,fontWeight:500}}>
          <Icon name="logout" size={14} color="var(--red)"/>Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const[currentUser,setCurrentUser]=useState(null);
  const[mounted,setMounted]=useState(false);
  const[lang,setLang]=useState("en");
  useEffect(()=>{
    try{const s=localStorage.getItem("bsc_session");if(s)setCurrentUser(JSON.parse(s));}catch{}
    try{const l=localStorage.getItem("bsc_lang");if(l)setLang(l);}catch{}
    localStorage.removeItem("bsc_settings");setMounted(true);
  },[]);
  const t=T[lang]||T.en;
  const[page,setPage]=useState("dashboard");
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const[toasts,setToasts]=useState([]);
  const[settings,setSettings]=useState(DEFAULT_SETTINGS);
  const[todayData,setTodayData]=useState(null);
  const[adminData,setAdminData]=useState({employees:[],attendance:[],summary:[]});
  const[worksites,setWorksites]=useState([]);
  const[employeeWorksite,setEmployeeWorksite]=useState(null);
  const[gpsLoading,setGpsLoading]=useState(true);
  const[punchLoading,setPunchLoading]=useState(false);
  const[isOvertime,setIsOvertime]=useState(false);
  const[overtimeMins,setOvertimeMins]=useState(0);
  const toastCounter=useRef(0);
  const missedWarned=useRef(false);

  const [now, setNow] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(interval);
}, []);

  const addToast=useCallback((message,type="info")=>{
    const id=++toastCounter.current;setToasts(t=>[...t,{id,message,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),5000);
  },[]);
  const removeToast=useCallback((id)=>setToasts(t=>t.filter(x=>x.id!==id)),[]);

  const[userLat,setUserLat]=useState(null);
  const[userLon,setUserLon]=useState(null);
  const geoTarget=employeeWorksite||(settings.latitude!=null?{latitude:settings.latitude,longitude:settings.longitude,radius_feet:settings.radiusFeet}:null);
  let onSite=false,distanceFt=null;
  if(userLat!=null&&geoTarget?.latitude!=null){
    distanceFt=distanceFeet(userLat,userLon,geoTarget.latitude,geoTarget.longitude);
    onSite=geoTarget.radius_feet!=null&&distanceFt<=geoTarget.radius_feet;
  }

  useEffect(()=>{
    if(!navigator.geolocation){setGpsLoading(false);return;}
    navigator.geolocation.getCurrentPosition(pos=>{setUserLat(pos.coords.latitude);setUserLon(pos.coords.longitude);setGpsLoading(false);},(()=>setGpsLoading(false)),{enableHighAccuracy:false,maximumAge:60000,timeout:5000});
    const wid=navigator.geolocation.watchPosition(pos=>{setUserLat(pos.coords.latitude);setUserLon(pos.coords.longitude);setGpsLoading(false);},()=>{},{enableHighAccuracy:true,maximumAge:10000,timeout:30000});
    return()=>navigator.geolocation.clearWatch(wid);
  },[]);

  const refreshSettings=useCallback(async()=>{
    try{const res=await authFetch("/api/settings");if(res.ok){const d=await res.json();if(d)setSettings({companyName:d.company_name,siteName:d.site_name,latitude:parseFloat(d.latitude),longitude:parseFloat(d.longitude),radiusFeet:parseFloat(d.radius_feet),workStart:d.working_hours_start?.slice(0,5)||"07:00",workEnd:d.working_hours_end?.slice(0,5)||"17:00",autoClockInEnabled:d.auto_clock_in_enabled,autoBreakOnExitEnabled:d.auto_break_on_exit_enabled,autoCorrectionEnabled:d.auto_correction_enabled});}}catch{}
  },[]);
  const refreshTodayData = useCallback(async (newData = null) => {
  if (!currentUser) return;
  if (newData) {
    setTodayData(newData);
    return;
  }
  try {
    const r = await authFetch("/api/attendance/me/today");
    if (r.ok) {
      const d = await r.json();
      setTodayData(d);
    }
  } catch { }
}, [currentUser]);
  const refreshAdminData=useCallback(async()=>{
    if(!currentUser||(currentUser.role!=="admin"&&currentUser.role!=="manager"))return;
    try{
      const today=new Date().toISOString().slice(0,10);
      const[eR,aR,sR]=await Promise.all([authFetch("/api/admin/employees"),authFetch(`/api/admin/attendance?date_from=${today}&date_to=${today}`),authFetch("/api/admin/reports/summary")]);
      setAdminData({employees:eR.ok?await eR.json():[],attendance:aR.ok?await aR.json():[],summary:sR.ok?await sR.json():[]});
    }catch{}
  },[currentUser]);
  const refreshWorksites=useCallback(async()=>{if(!currentUser)return;try{const r=await authFetch("/api/worksites");if(r.ok){const d=await r.json();setWorksites(Array.isArray(d)?d:[]);}}catch{}},[currentUser]);
  const refreshEmployeeWorksite=useCallback(async()=>{if(!currentUser||currentUser.role==="admin"||currentUser.role==="manager")return;try{const r=await authFetch("/api/worksites/my-assignment");if(r.ok){const d=await r.json();setEmployeeWorksite(d);}}catch{}},[currentUser]);
  const checkOvertime=useCallback(async()=>{if(!currentUser)return;try{const r=await authFetch(`/api/employees/${currentUser.id}/overtime`);if(r.ok){const d=await r.json();setIsOvertime(d.isOvertime||false);setOvertimeMins(d.overtimeMins||0);}}catch{}},[currentUser]);

  useEffect(()=>{
    if(currentUser){refreshTodayData();refreshSettings();refreshWorksites();refreshEmployeeWorksite();if(currentUser.role==="admin"||currentUser.role==="manager")refreshAdminData();}
  },[currentUser,refreshTodayData,refreshSettings,refreshAdminData,refreshWorksites,refreshEmployeeWorksite]);
  useEffect(()=>{if(!currentUser)return;const iv=setInterval(()=>{refreshTodayData();checkOvertime();if(currentUser.role==="admin"||currentUser.role==="manager")refreshAdminData();},30000);return()=>clearInterval(iv);},[currentUser,refreshTodayData,refreshAdminData,checkOvertime]);
  useEffect(()=>{if(todayData)checkOvertime();},[todayData,checkOvertime]);
  // Missed clock-out check
  useEffect(()=>{
    if(!todayData||missedWarned.current)return;
    const session=todayData?.session;
    if(session&&new Date(session.clock_in_time).toDateString()!==new Date().toDateString()&&session.status==="active"){
      missedWarned.current=true;vibrate([300,100,300,100,300]);addToast(t.missedClockOutMsg,"warning");
    }
  },[todayData,t,addToast]);

  const empStatus=todayData?.status||"clocked_out";
  const doPunch = async (endpoint, msg) => {
  if (punchLoading) return;
  setPunchLoading(true);
  try {
    const res = await authFetch(`/api/attendance/${endpoint}`, {
      method: "POST",
      body: JSON.stringify({ latitude: userLat || geoTarget?.latitude || 0, longitude: userLon || geoTarget?.longitude || 0 })
    });
    const d = await res.json();
    if (!res.ok) {
      addToast(d.error || "Action failed.", "error");
      vibrate([100, 50, 100]);
      return;
    }
    addToast(msg, "success");
    vibrate([50]);
    // Use returned data if present
    if (d.data) {
      refreshTodayData(d.data);
    } else {
      await refreshTodayData(); // fallback to fetch
    }
  } catch {
    addToast("Cannot connect to server.", "error");
  } finally {
    setPunchLoading(false);
  }
};
  const handleClockInWithPhoto = () => {
  // Only show camera if on‑site (already validated)
  if (!onSite) {
    addToast("You must be at your assigned worksite to clock in.", "error");
    return;
  }
  setShowCamera(true);
};

const processClockIn = async (photoData) => {
  setPunchLoading(true);
  try {
    const res = await authFetch("/api/attendance/clock-in", {
      method: "POST",
      body: JSON.stringify({
        latitude: userLat || geoTarget?.latitude || 0,
        longitude: userLon || geoTarget?.longitude || 0,
        photo: photoData,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      addToast(d.error || "Action failed.", "error");
      vibrate([100, 50, 100]);
      return;
    }
    addToast("Clocked in ✓", "success");
    vibrate([50]);
    if (d.data) {
      refreshTodayData(d.data);
    } else {
      await refreshTodayData();
    }
  } catch {
    addToast("Cannot connect to server.", "error");
  } finally {
    setPunchLoading(false);
    setShowCamera(false);
    setPendingPhoto(null);
  }
};
  const handleClockOut=()=>doPunch("clock-out","Clocked out. Have a great day!");
  const handleBreakStart=()=>doPunch("break-start","Break started.");
  const handleBreakEnd=()=>doPunch("break-end","Break ended. Welcome back!");

  const handleLogin=async(userId,password,isEmail=false)=>{
    const deviceFingerprint=getDeviceFingerprint();
    try{
      const checkRes=await fetch(`${API}/api/security/check-device`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,deviceFingerprint})});
      if(checkRes.ok){const check=await checkRes.json();if(!check.allowed){addToast("This device is registered to another account.","error");vibrate([200,100,200,100,200]);return;}}
      const body=isEmail?{email:userId,password}:{userId,password};
      const res=await fetch(`${API}/api/auth/login`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await res.json();
      if(!res.ok){addToast(data.error||"Invalid credentials.","error");vibrate([100,50,100]);return;}
      localStorage.setItem("accessToken",data.accessToken);localStorage.setItem("bsc_session",JSON.stringify(data.user));localStorage.removeItem("bsc_settings");
      setCurrentUser(data.user);addToast(`${t.welcomeBack}, ${data.user.name.split(" ")[0]}!`,"success");vibrate([50]);setPage("dashboard");
    }catch{addToast("Cannot connect to server.","error");}
  };
  const handleLogout=async()=>{
    try{await authFetch("/api/auth/logout",{method:"POST"});}catch{}
    setCurrentUser(null);["accessToken","bsc_session","bsc_settings"].forEach(k=>localStorage.removeItem(k));
    setPage("dashboard");setTodayData(null);setAdminData({employees:[],attendance:[],summary:[]});addToast("Signed out.","info");
  };

  const isAdmin=currentUser?.role==="admin"||currentUser?.role==="manager";
  const navItems=currentUser?[
    {id:"dashboard",label:isAdmin?t.dashboard:`My ${t.dashboard}`,icon:"home"},
    ...(isAdmin?[{id:"employees",label:t.employees,icon:"users"},{id:"worksites",label:t.worksites,icon:"map"},{id:"attendance",label:t.attendance,icon:"calendar"},{id:"reports",label:t.reports,icon:"bar"},{id:"settings",label:t.settings,icon:"settings"},{id:"export",label:t.export,icon:"download"},{id:"audit",label:t.auditLogs,icon:"log"}]:[{id:"my_attendance",label:t.myAttendance,icon:"calendar"},{id:"my_profile",label:t.myProfile,icon:"user"}]),
  ]:[];

  if(!mounted)return null;
  if(!currentUser)return(<><GlobalStyle/><LoginPage onLogin={handleLogin} lang={lang} setLang={setLang}/><Toast toasts={toasts} removeToast={removeToast}/></>);

  return(
    <>
      <GlobalStyle/>
      <div style={{display:"flex",minHeight:"100vh",position:"relative",background:"var(--bg)"}}>
        {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.3)",zIndex:200,backdropFilter:"blur(3px)"}}/>}
        <aside style={{position:"fixed",top:0,left:0,height:"100vh",zIndex:300,width:272,transform:sidebarOpen?"translateX(0)":"translateX(-100%)",background:"var(--bg2)",borderRight:"1px solid var(--border)",transition:"transform 0.25s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column",overflowY:"auto",boxShadow:sidebarOpen?"var(--shadow-lg)":"none"}}>
          <div style={{padding:"20px 16px 16px",borderBottom:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"var(--radius)",background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(37,99,235,0.35)"}}>
                  <Icon name="hard_hat" size={18} color="white"/>
                </div>
                <div><div style={{fontSize:14,fontWeight:700,color:"var(--text)",lineHeight:1.2,letterSpacing:"-0.01em"}}>Bright Sky</div><div style={{fontSize:11,color:"var(--text3)",fontWeight:400}}>Construction</div></div>
              </div>
              <button onClick={()=>setSidebarOpen(false)} style={{background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text3)",width:30,height:30,borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="close" size={15}/></button>
            </div>
          </div>
          <nav style={{flex:1,padding:"10px 10px",overflowY:"auto"}}>
            <div style={{fontSize:10.5,color:"var(--text4)",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",padding:"8px 8px 6px"}}>Navigation</div>
            {navItems.map(item=>(
              <button key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:"var(--radius)",marginBottom:2,background:page===item.id?"var(--blue-light)":"transparent",color:page===item.id?"var(--blue)":"var(--text2)",fontFamily:"'Inter',sans-serif",fontSize:13.5,fontWeight:page===item.id?600:450,border:`1px solid ${page===item.id?"var(--blue-mid)":"transparent"}`,cursor:"pointer",transition:"all 0.12s",minHeight:40,textAlign:"left"}}>
                <Icon name={item.icon} size={16} color={page===item.id?"var(--blue)":"var(--text3)"}/>
                <span style={{flex:1}}>{item.label}</span>
                {item.id==="dashboard"&&isOvertime&&<span className="overtime-glow" style={{background:"var(--orange-light)",color:"var(--orange)",padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:700,border:"1px solid rgba(234,88,12,0.2)"}}>OT</span>}
              </button>
            ))}
          </nav>
          <SidebarProfile currentUser={currentUser} handleLogout={handleLogout} lang={lang} setLang={setLang}/>
        </aside>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,width:"100%"}}>
          <header style={{background:"var(--bg2)",borderBottom:"1px solid var(--border)",padding:"0 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:100,height:56,boxShadow:"var(--shadow-sm)"}}>
  <button onClick={()=>setSidebarOpen(true)} style={{background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text2)",padding:7,borderRadius:"var(--radius-sm)",display:"flex",cursor:"pointer",minWidth:36,minHeight:36,alignItems:"center",justifyContent:"center"}}><Icon name="menu" size={18}/></button>

  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
    <div style={{width:28,height:28,borderRadius:"var(--radius-sm)",background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="hard_hat" size={14} color="white"/></div>
    <div>
      <span style={{fontWeight:700,fontSize:13.5,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130,letterSpacing:"-0.01em"}}>BSC Tracker</span>
      <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{now.toLocaleDateString()} · {now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
    </div>
  </div>

  <LocationIndicator onSite={onSite} distance={distanceFt} loading={gpsLoading&&userLat==null&&geoTarget?.latitude!=null}/>
</header>
          <main style={{flex:1,padding:"20px 16px",maxWidth:900,width:"100%",margin:"0 auto"}}>
            {isAdmin&&<AdminLocationBar userLat={userLat} userLon={userLon} worksites={worksites} distanceFt={distanceFt} addToast={addToast} t={t} onWorksiteSelect={ws=>setEmployeeWorksite(ws)}/>}
            {page==="dashboard"&&(isAdmin?<AdminDashboard adminData={adminData} refreshAdminData={refreshAdminData} isOvertime={isOvertime} t={t}/>:<EmployeeDashboard user={currentUser} todayData={todayData} empStatus={empStatus} onSite={onSite} settings={settings} punchLoading={punchLoading} gpsLoading={gpsLoading} userLat={userLat} isOvertime={isOvertime} overtimeMins={overtimeMins} employeeWorksite={employeeWorksite} handleClockInWithPhoto={handleClockInWithPhoto} handleClockOut={handleClockOut} handleBreakStart={handleBreakStart} handleBreakEnd={handleBreakEnd} t={t} addToast={addToast} refreshTodayData={refreshTodayData}/>)}
            {page==="my_attendance"&&<MyAttendance t={t}/>}
            {page==="my_profile"&&<MyProfile user={currentUser} addToast={addToast} employeeWorksite={employeeWorksite} t={t}/>}
            {page==="employees"&&isAdmin&&<EmployeeList adminData={adminData} refreshAdminData={refreshAdminData} addToast={addToast} worksites={worksites} t={t}/>}
            {page==="worksites"&&isAdmin&&<WorksitesPage worksites={worksites} refreshWorksites={refreshWorksites} adminData={adminData} addToast={addToast} t={t}/>}
            {page==="attendance"&&isAdmin&&<AttendancePage adminData={adminData} t={t}/>}
            {page==="reports"&&isAdmin&&<ReportsPage t={t}/>}
            {page==="settings"&&isAdmin&&<SettingsPage settings={settings} addToast={addToast} refreshSettings={refreshSettings} t={t}/>}
            {page==="export"&&isAdmin&&<ExportPage adminData={adminData} addToast={addToast} t={t}/>}
            {page==="audit"&&isAdmin&&<AuditPage t={t}/>}
          </main>
        </div>
      </div>
      <Toast toasts={toasts} removeToast={removeToast}/>
    </>
  );
}

// ─── ADMIN LOCATION BAR ───────────────────────────────────────────────────────
function AdminLocationBar({userLat,userLon,worksites,distanceFt,addToast,t,onWorksiteSelect}){
  const[show,setShow]=useState(false);
  if(worksites.length===0)return null;
  return(
    <div style={{marginBottom:16}}>
      {show&&(
        <Card style={{marginBottom:10,border:"1.5px solid var(--blue-mid)"}}>
          <div style={{fontSize:11,color:"var(--text3)",marginBottom:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t.updateLocation}</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {worksites.map(w=>{
              let dist=null;if(userLat!=null)dist=distanceFeet(userLat,userLon,w.latitude,w.longitude);
              const isHere=dist!=null&&dist<=w.radius_feet;
              return(<button key={w.id} onClick={()=>{onWorksiteSelect(w);addToast(t.locationUpdated,"success");setShow(false);}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:"var(--radius)",border:`1.5px solid ${isHere?"rgba(5,150,105,0.3)":"var(--border)"}`,background:isHere?"var(--green-light)":"var(--bg3)",cursor:"pointer",textAlign:"left",width:"100%",minHeight:48}}>
                <div style={{width:32,height:32,borderRadius:"var(--radius-sm)",background:isHere?"var(--green-light)":"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${isHere?"rgba(5,150,105,0.2)":"var(--blue-mid)"}`}}>
                  <Icon name="pin" size={14} color={isHere?"var(--green)":"var(--blue)"}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:600,color:isHere?"var(--green)":"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.project_name||w.name}</div>
                  {w.address&&<div style={{fontSize:11.5,color:"var(--text3)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.address}</div>}
                </div>
                {dist!=null&&<span style={{fontSize:11.5,color:isHere?"var(--green)":"var(--text3)",flexShrink:0,fontWeight:600}}>{Math.round(dist)}ft{isHere?" ✓":""}</span>}
              </button>);
            })}
          </div>
          <button onClick={()=>setShow(false)} style={{width:"100%",marginTop:10,padding:"9px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--radius)",color:"var(--text3)",fontSize:13.5,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>{t.cancel}</button>
        </Card>
      )}
      <Btn onClick={()=>setShow(s=>!s)} variant="secondary" size="sm" style={{width:"100%"}}>
        <Icon name="navigation" size={13}/>{t.updateLocation}
        {distanceFt!=null&&<span style={{marginLeft:4,opacity:0.6,fontSize:11}}>{Math.round(distanceFt)}ft</span>}
      </Btn>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({onLogin,lang,setLang}){
  const[userId,setUserId]=useState("");
  const[password,setPassword]=useState("");
  const[showPass,setShowPass]=useState(false);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[useEmail,setUseEmail]=useState(false);
  const t=T[lang]||T.en;
  const validate=()=>{
    if(!useEmail){if(!/^[A-Za-z0-9]{4}$/.test(userId)){setError("User ID must be exactly 4 characters.");return false;}if(!/^\d{4}$/.test(password)){setError("Password must be exactly 4 digits.");return false;}}
    setError("");return true;
  };
  const handle=async(e)=>{e.preventDefault();if(!validate())return;setLoading(true);await onLogin(userId,password,useEmail);setLoading(false);};
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"var(--bg)"}}>
      <div style={{padding:"14px 20px",display:"flex",justifyContent:"flex-end",gap:6,background:"var(--bg2)",borderBottom:"1px solid var(--border)"}}>
        {[["en","EN"],["es","ES"]].map(([code,label])=>(
          <button key={code} onClick={()=>{setLang(code);localStorage.setItem("bsc_lang",code);}} style={{padding:"5px 14px",borderRadius:999,border:"1.5px solid",borderColor:lang===code?"var(--blue)":"var(--border)",background:lang===code?"var(--blue)":"transparent",color:lang===code?"white":"var(--text3)",fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600}}>{label}</button>
        ))}
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
        <div style={{width:"100%",maxWidth:400}}>
          <div style={{textAlign:"center",marginBottom:32}} className="fade-up">
            <div style={{width:64,height:64,borderRadius:18,background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(37,99,235,0.3)"}}><Icon name="hard_hat" size={32} color="white"/></div>
            <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",letterSpacing:"-0.02em",marginBottom:4}}>Bright Sky Construction</h1>
            <p style={{color:"var(--text3)",fontSize:14,fontWeight:400}}>Employee Time Tracking System</p>
          </div>
          <Card style={{padding:28,boxShadow:"var(--shadow-md)"}} className="fade-up">
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em",marginBottom:4}}>{useEmail?"Admin Sign In":"Employee Sign In"}</h2>
              <p style={{color:"var(--text3)",fontSize:13.5,fontWeight:400}}>{useEmail?"Enter your email and password":`Enter your 4-character ${t.userId}`}</p>
            </div>
            <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:18}}>
  <div>
    <label style={{fontSize:12,color:"var(--text2)",fontWeight:600,display:"block",marginBottom:7}}>{useEmail?"Email Address":t.userId}</label>
    {useEmail?(
      <input type="email" value={userId} onChange={e=>{setUserId(e.target.value);setError("");}} placeholder="your@email.com" autoComplete="off" style={{fontSize:16,width:"100%",padding:"12px 14px"}} required/>
    ):(
      <>
        <input type="text" value={userId} onChange={e=>{const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);setUserId(v);setError("");}} placeholder="· · · ·" maxLength={4} autoComplete="off" inputMode="text" style={{fontSize:28,letterSpacing:"0.4em",textAlign:"center",width:"100%",padding:"12px 14px",fontWeight:700}} required/>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:10,height:18}}>
          {[0,1,2,3].map(i=><div key={i} className={`pin-dot${userId.length>i?"":" empty"}`} style={{transform:userId.length>i?"scale(1.1)":"scale(1)"}}/>)}
        </div>
      </>
    )}
  </div>
  <div>
    <label style={{fontSize:12,color:"var(--text2)",fontWeight:600,display:"block",marginBottom:7}}>{t.password}</label>
    <div style={{position:"relative"}}>
      <input type={showPass?"text":"password"} value={password} onChange={e=>{const v=useEmail?e.target.value:e.target.value.replace(/\D/g,"").slice(0,4);setPassword(v);setError("");}} placeholder={useEmail?"••••••••":"· · · ·"} autoComplete="off" inputMode={useEmail?"text":"numeric"} maxLength={useEmail?undefined:4} style={{fontSize:useEmail?16:28,letterSpacing:useEmail?"normal":"0.4em",textAlign:useEmail?"left":"center",width:"100%",padding:"12px 14px",paddingRight:52,paddingLeft:useEmail?14:52,fontWeight:useEmail?400:700}} required/>
      <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text3)",cursor:"pointer",padding:6,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"var(--radius-sm)",minWidth:34,minHeight:34}}><Icon name={showPass?"eyeOff":"eye"} size={16} color="var(--text3)"/></button>
    </div>
    {!useEmail&&<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginTop:10,height:18}}>{[0,1,2,3].map(i=><div key={i} className={`pin-dot${password.length>i?"":" empty"}`} style={{transform:password.length>i?"scale(1.1)":"scale(1)"}}/>)}</div>}
  </div>
  {error&&<div className="shake" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:"var(--radius)",background:"var(--red-light)",border:"1.5px solid rgba(220,38,38,0.2)"}}><Icon name="alert" size={14} color="var(--red)"/><span style={{fontSize:13,color:"var(--red)",fontWeight:450}}>{error}</span></div>}
  <Btn loading={loading} style={{width:"100%",marginTop:2}} size="lg"><Icon name="login" size={16} color="white"/>{t.signIn}</Btn>
</form>
            <div style={{marginTop:16,textAlign:"center",paddingTop:14,borderTop:"1px solid var(--border)"}}>
              <button onClick={()=>{setUseEmail(e=>!e);setUserId("");setPassword("");setError("");}} style={{background:"none",border:"none",color:"var(--blue)",fontSize:13,cursor:"pointer",fontWeight:500,fontFamily:"'Inter',sans-serif"}}>{useEmail?t.useUserId:t.adminLogin}</button>
            </div>
          </Card>
          <div style={{marginTop:12,padding:"12px 16px",borderRadius:"var(--radius)",background:"var(--blue-light)",border:"1.5px solid var(--blue-mid)",display:"flex",gap:10,alignItems:"flex-start"}}>
            <Icon name="alert" size={14} color="var(--blue)" style={{marginTop:1,flexShrink:0}}/>
            <div style={{fontSize:12.5,color:"var(--blue)",lineHeight:1.5,fontWeight:400}}>Use your <strong>4-character Employee ID</strong> and <strong>4-digit password</strong>. Contact your admin if you need help.</div>
          </div>
        </div>
      </div>
      <div style={{padding:"14px",textAlign:"center",borderTop:"1px solid var(--border)",background:"var(--bg2)"}}>
        <p style={{fontSize:12,color:"var(--text4)"}}>Bright Sky Construction · Employee Time Tracking · Secure Login</p>
      </div>
    </div>
  );
}

// ─── EMPLOYEE DASHBOARD ───────────────────────────────────────────────────────
function EmployeeDashboard({
  user, todayData, empStatus, onSite, settings,
  punchLoading, gpsLoading, userLat, userLon,
  isOvertime, overtimeMins, employeeWorksite,
  handleClockInWithPhoto, handleClockOut, handleBreakStart, handleBreakEnd,
  t, addToast, refreshTodayData
}) {
  const [now, setNow] = useState(new Date());
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakReason, setBreakReason] = useState("");
  const [breakType, setBreakType] = useState(null); // 'personal' or 'work'
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [selectedBreakId, setSelectedBreakId] = useState(null);
  const [incompleteReason, setIncompleteReason] = useState("");
  const [expandedBreakId, setExpandedBreakId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tasks for employee
  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const res = await authFetch(`/api/tasks/employee/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoadingTasks(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleMarkComplete = async (taskId) => {
    try {
      const res = await authFetch(`/api/tasks/${taskId}/complete`, { method: "PUT" });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed" } : t));
        addToast("Task marked as complete.", "success");
      } else {
        addToast("Failed to update task", "error");
      }
    } catch (err) {
      addToast("Error updating task", "error");
    }
  };

  const handlePersonalBreak = async () => {
  const res = await authFetch("/api/attendance/break-start", {
    method: "POST",
    body: JSON.stringify({ latitude: userLat || 0, longitude: userLon || 0 })
  });
  const data = await res.json();
  if (!res.ok) {
    addToast(data.error || "Failed to start personal break.", "error");
    return;
  }
  addToast("Personal break started.", "success");
  setShowBreakModal(false);
  setBreakType(null);
  if (data.data) {
    refreshTodayData(data.data);
  } else {
    await refreshTodayData();
  }
};

  const handleCustomBreak = async () => {
  if (!breakReason.trim()) {
    addToast("Please enter a reason for the work-related break.", "error");
    return;
  }
  const res = await authFetch("/api/attendance/custom-break-start", {
    method: "POST",
    body: JSON.stringify({ reason: breakReason, latitude: userLat || 0, longitude: userLon || 0 })
  });
  const data = await res.json();
  if (!res.ok) {
    addToast(data.error || "Failed to start work-related break.", "error");
    return;
  }
  addToast("Work-related break started.", "success");
  setShowBreakModal(false);
  setBreakReason("");
  setBreakType(null);
  if (data.data) {
    refreshTodayData(data.data);
  } else {
    await refreshTodayData();
  }
};

  const session = todayData?.session;
  const punches = todayData?.punches || [];
  // Calculate today's totals from the session (using stored values or live)
  let totalWorked = session?.worked_minutes || 0;
  let totalBreak = session?.break_minutes || 0;
  if ((empStatus === "clocked_in" || empStatus === "on_break") && session?.clock_in_time) {
    const elapsed = Math.round((now.getTime() - new Date(session.clock_in_time).getTime()) / 60000);
    totalWorked = Math.max(0, elapsed - (session.break_minutes || 0));
    totalBreak = session?.break_minutes || 0;
    // For break time, if on break, add ongoing break duration
    if (empStatus === "on_break") {
      const lastBreakStart = punches.findLast(p => p.punch_type === "break_start")?.punch_time;
      if (lastBreakStart) {
        const ongoing = Math.round((now.getTime() - new Date(lastBreakStart).getTime()) / 60000);
        totalBreak = (session.break_minutes || 0) + ongoing;
      }
    }
  }

  const displayWS = employeeWorksite || { latitude: settings.latitude, longitude: settings.longitude, radius_feet: settings.radiusFeet, name: settings.siteName };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Assigned Worksite Card */}
      {employeeWorksite && (
        <Card style={{ border: "1.5px solid var(--blue-mid)", background: "var(--blue-light)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius)", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
              <Icon name="pin" size={18} color="white" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>{t.assignedWorksite}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{employeeWorksite.project_name || employeeWorksite.name}</div>
              {employeeWorksite.address && <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 2, fontWeight: 400 }}>{employeeWorksite.address}</div>}
              <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 2 }}>{parseFloat(employeeWorksite.latitude).toFixed(4)}°, {parseFloat(employeeWorksite.longitude).toFixed(4)}° · {employeeWorksite.radius_feet}ft radius</div>
            </div>
          </div>
        </Card>
      )}

      {/* Compact Time Summary */}
      <div style={{ display: "flex", gap: 16, justifyContent: "space-between", background: "var(--bg2)", borderRadius: "var(--radius)", padding: "10px 16px", border: "1px solid var(--border)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>Worked Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: isOvertime ? "var(--orange)" : "var(--green)" }}>{fmtMins(totalWorked)}</div>
          {isOvertime && (
            <div style={{ fontSize: 10, color: "var(--orange)", fontWeight: 500, marginTop: 2 }}>
              <span className="overtime-glow">+{fmtMins(overtimeMins)} overtime</span>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>Break Time</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--amber)" }}>{fmtMins(totalBreak)}</div>
        </div>
      </div>

      {/* Main Action Card */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {empStatus === "clocked_out" && (
  <Btn onClick={handleClockInWithPhoto} disabled={!onSite || punchLoading} loading={punchLoading} size="lg" style={{ width: "100%" }}>
    <Icon name="camera" size={16} color="white" />{t.clockIn}
  </Btn>
)}
          {empStatus === "clocked_in" && (
            <>
              <Btn onClick={() => setShowBreakModal(true)} disabled={punchLoading} variant="secondary" size="md" style={{ width: "100%" }}>
                <Icon name="coffee" size={15} color="var(--amber)" />Break
              </Btn>
              <Btn onClick={handleClockOut} disabled={punchLoading} loading={punchLoading} variant="danger" size="md" style={{ width: "100%" }}>
                <Icon name="stop" size={15} color="var(--red)" />{t.clockOut}
              </Btn>
            </>
          )}
          {empStatus === "on_break" && (
            <Btn onClick={handleBreakEnd} disabled={punchLoading} loading={punchLoading} variant="green" size="lg" style={{ width: "100%" }}>
              <Icon name="play" size={16} color="var(--green)" />{t.endBreak}
            </Btn>
          )}
        </div>
        {gpsLoading && userLat == null && displayWS?.latitude != null && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: "var(--radius)", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(217,119,6,0.2)", display: "flex", gap: 8, alignItems: "center" }}>
            <span className="spin" style={{ width: 12, height: 12, border: "2px solid var(--amber)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: "var(--amber)", fontWeight: 500 }}>Getting your location…</span>
          </div>
        )}
        {!gpsLoading && !onSite && displayWS?.latitude != null && userLat != null && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--red-light)", border: "1.5px solid rgba(220,38,38,0.2)", display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="alert" size={14} color="var(--red)" />
            <span style={{ fontSize: 12.5, color: "var(--red)", fontWeight: 450 }}>Must be within {displayWS.radius_feet} ft of your assigned worksite.</span>
          </div>
        )}
      </Card>

      {/* Tasks Section */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>My Tasks</div>
          {loadingTasks && <span className="spin" style={{ width: 14, height: 14, border: "2px solid var(--blue)", borderTopColor: "transparent", borderRadius: "50%" }} />}
        </div>
        {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text4)", fontSize: 13 }}>No tasks assigned.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map(task => (
              <div key={task.id} style={{ padding: "12px", background: "var(--bg3)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{task.description}</div>
                  </div>
                  {task.status === "pending" ? (
                    <button
                      onClick={() => handleMarkComplete(task.id)}
                      style={{ background: "var(--green-light)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--green)", cursor: "pointer" }}
                    >
                      Mark Complete
                    </button>
                  ) : (
                    <span style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>✓ Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

{/* Today's Work Breaks */}
<Card>
  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
    Today's Work Breaks
  </div>
  {(() => {
    const workBreaks = punches.filter(p => p.punch_type === "break_start" && p.break_type === "work" && p.remarks);
    if (workBreaks.length === 0) {
      return <div style={{ textAlign: "center", padding: "12px 0", color: "var(--text4)", fontSize: 13 }}>No work breaks today.</div>;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {workBreaks.map(breakRecord => {
          const isExpanded = expandedBreakId === breakRecord.id;
          return (
            <div
              key={breakRecord.id}
              onClick={() => setExpandedBreakId(isExpanded ? null : breakRecord.id)}
              style={{
                padding: "12px",
                background: "var(--bg3)",
                borderRadius: "var(--radius)",
                border: `1px solid ${isExpanded ? "var(--blue)" : "var(--border)"}`,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {/* Header: reason and time */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{breakRecord.remarks}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{fmtTime(breakRecord.punch_time)}</div>
                </div>
                {breakRecord.break_completed === true && (
                  <span style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>✓ Completed</span>
                )}
                {breakRecord.break_completed === false && breakRecord.break_incomplete_reason && (
                  <span style={{ background: "var(--red-light)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--red)" }}>✗ Not Completed</span>
                )}
              </div>

              {/* Expanded content: buttons */}
              {isExpanded && breakRecord.break_completed !== true && !(breakRecord.break_completed === false && breakRecord.break_incomplete_reason) && (
                <div style={{ marginTop: 12, display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <button
                    onClick={async () => {
  const res = await authFetch(`/api/attendance/break/${breakRecord.id}/complete`, { method: "PUT" });
  const data = await res.json();
  if (res.ok) {
    addToast("Break task marked as completed.", "success");
    if (data.data) {
      refreshTodayData(data.data);
    } else {
      await refreshTodayData();
    }
  } else {
    addToast(data.error || "Failed to update break status.", "error");
  }
}}
                    style={{ background: "var(--green-light)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--green)", cursor: "pointer", flex: 1 }}
                  >
                    ✓ Completed
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBreakId(breakRecord.id);
                      setShowIncompleteModal(true);
                    }}
                    style={{ background: "var(--red-light)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--red)", cursor: "pointer", flex: 1 }}
                  >
                    ✗ Not Completed
                  </button>
                </div>
              )}

              {/* Show reason if not completed with a reason */}
              {breakRecord.break_completed === false && breakRecord.break_incomplete_reason && isExpanded && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Reason for incompletion:</div>
                  <div style={{ fontSize: 12, padding: "4px 8px", background: "var(--red-light)", borderRadius: "var(--radius-sm)", color: "var(--red)" }}>
                    {breakRecord.break_incomplete_reason}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  })()}
</Card>


      {/* Break Modal */}
      {/* Break Modal */}
{showBreakModal && (
  <Modal title="Start Break" onClose={() => { setShowBreakModal(false); setBreakType(null); setBreakReason(""); }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: "var(--text3)" }}>Choose break type:</p>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={handlePersonalBreak} loading={punchLoading} variant="green" style={{ flex: 1 }}>
          <Icon name="coffee" size={14} color="var(--green)" />Personal Break
        </Btn>
        <Btn onClick={() => setBreakType("work")} variant="blue" style={{ flex: 1 }}>
          <Icon name="briefcase" size={14} color="var(--blue)" />Work‑Related
        </Btn>
      </div>

      {breakType === "work" && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 8 }}>Reason for work‑related break:</p>
          <textarea
            rows={3}
            value={breakReason}
            onChange={e => setBreakReason(e.target.value)}
            placeholder="e.g., Inspecting equipment at another site, delivering materials, etc."
            style={{ fontSize: 14, padding: "10px", borderRadius: "var(--radius)", border: "1.5px solid var(--border)", resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn onClick={handleCustomBreak} loading={punchLoading} style={{ flex: 1 }}>
              <Icon name="check" size={14} color="white" />Start Break
            </Btn>
            <Btn onClick={() => setBreakType(null)} variant="secondary" style={{ flex: 1 }}>Back</Btn>
          </div>
        </div>
      )}
    </div>
  </Modal>
)}

{/* Incomplete Reason Modal */}
{showIncompleteModal && (
  <Modal title="Why was this task not completed?" onClose={() => { setShowIncompleteModal(false); setIncompleteReason(""); setSelectedBreakId(null); }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <textarea
        rows={4}
        value={incompleteReason}
        onChange={e => setIncompleteReason(e.target.value)}
        placeholder="e.g., Delayed due to weather, equipment not available, etc."
        style={{ fontSize: 14, padding: "10px", borderRadius: "var(--radius)", border: "1.5px solid var(--border)", resize: "vertical", fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn
          onClick={async () => {
  if (!incompleteReason.trim()) {
    addToast("Please enter a reason.", "error");
    return;
  }
  const res = await authFetch(`/api/attendance/break/${selectedBreakId}/not-complete`, {
    method: "PUT",
    body: JSON.stringify({ reason: incompleteReason })
  });
  const data = await res.json();
  if (res.ok) {
    addToast("Break marked as not completed.", "success");
    setShowIncompleteModal(false);
    setIncompleteReason("");
    setSelectedBreakId(null);
    if (data.data) {
      refreshTodayData(data.data);
    } else {
      await refreshTodayData();
    }
  } else {
    addToast(data.error || "Failed to update.", "error");
  }
}}
          style={{ flex: 1 }}
        >
          <Icon name="check" size={14} color="white" />Submit
        </Btn>
        <Btn onClick={() => setShowIncompleteModal(false)} variant="secondary" style={{ flex: 1 }}>Cancel</Btn>
      </div>
    </div>
  </Modal>
)}

{showCamera && (
  <CameraModal
    onClose={() => setShowCamera(false)}
    onCapture={(photo) => processClockIn(photo)}
  />
)}
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({adminData,refreshAdminData,isOvertime,t}){
  const{employees,attendance,summary}=adminData;
  const todayActive=attendance.filter(s=>s.status==="active").length;
  const totalMins=attendance.reduce((a,s)=>{if(s.status==="active"&&s.clock_in_time)return a+Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0));return a+(parseInt(s.worked_minutes)||0);},0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="fade-up" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div><h1 style={{fontSize:22,fontWeight:800,color:"var(--text)",letterSpacing:"-0.02em"}}>{t.dashboard}</h1><p style={{color:"var(--text3)",fontSize:13,marginTop:3,fontWeight:400}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p></div>
        <Btn onClick={refreshAdminData} variant="secondary" size="sm"><Icon name="refresh" size={13}/>{t.refresh}</Btn>
      </div>
      <div className="fade-up-d1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <StatCard label="Total Employees" value={employees.length} icon="users" color="var(--blue)"/>
        <StatCard label="Active Now" value={todayActive} icon="clock" color="var(--green)" sub={`of ${employees.length}`}/>
        <StatCard label="Sessions Today" value={attendance.length} icon="calendar" color="var(--purple)"/>
        <StatCard label="Hours Today" value={`${Math.round(totalMins/60)}h`} icon="trend" color="var(--amber)"/>
      </div>
      <Card className="fade-up-d2">
        <SectionHeader title="Employee Summary"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:500}}>
            <thead>
  <tr>
    <th>Employee</th>
    <th>ID</th>
    <th>Total Hrs</th>
    <th>This Week</th>
    <th>Personal Break</th>
    <th>Work Break</th>
    <th>Status</th>
  </tr>
</thead>
<tbody>
  {summary.length === 0 ? (
    <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text4)", padding: 24 }}>No data yet.</td></tr>
  ) : (
    summary.map(s => {
      const active = attendance.find(a => a.user_id === s.id && a.status === "active");
      return (
        <tr key={s.id}>
          <td><div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13.5 }}>{s.name}</div><div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 1 }}>{s.designation || s.department || ""}</div></td>
          <td><span style={{ background: "var(--blue-light)", color: "var(--blue)", padding: "2px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, border: "1px solid var(--blue-mid)" }}>{s.user_id || "—"}</span></td>
          <td style={{ color: "var(--text2)", fontWeight: 600 }}>{Math.round((s.total_minutes || 0) / 60)}h</td>
          <td style={{ color: "var(--text2)", fontWeight: 600 }}>{Math.round((s.week_minutes || 0) / 60)}h</td>
          <td style={{ fontSize: 12, color: "var(--text3)" }}>{fmtMins(s.personal_break_minutes || 0)}</td>
          <td style={{ fontSize: 12, color: "var(--text3)" }}>{fmtMins(s.work_break_minutes || 0)}</td>
          <td>{active ? <StatusBadge status="clocked_in" /> : <StatusBadge status="clocked_out" />}</td>
        </tr>
      );
    })
  )}
</tbody>
          </table>
        </div>
      </Card>
      <Card className="fade-up-d3">
        <SectionHeader title="Today's Sessions"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:480}}>
            <thead><tr><th>Employee</th><th>Clock In</th><th>Clock Out</th><th>Worked</th><th>Status</th></tr></thead>
            <tbody>
              {attendance.length===0?<tr><td colSpan={5} style={{textAlign:"center",color:"var(--text4)",padding:24}}>No sessions today.</td></tr>
              :attendance.slice(0,12).map(s=>(
                <tr key={s.id}>
                  <td style={{color:"var(--text)",fontWeight:500,fontSize:13}}>{s.name||"—"}</td>
                  <td style={{fontSize:12.5}}>{fmtTime(s.clock_in_time)}</td>
                  <td style={{fontSize:12.5}}>{fmtTime(s.clock_out_time)}</td>
                  <td style={{color:"var(--green)",fontWeight:600,fontSize:13}}>{s.status==="active"&&s.clock_in_time?fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0))):fmtMins(s.worked_minutes)}</td>
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

// ─── WORKSITES PAGE (Flash Cards) ─────────────────────────────────────────────
  // ── Worksite Form — uses controlled state, never resets sibling fields ──────
  function WorksiteForm({ initial, onSave, onClose, addToast }){
    // All state managed here — unaffected by address changes
    const[name,setName]=useState(initial?.name||"");
    const[projectName,setProjectName]=useState(initial?.project_name||initial?.name||"");
    const[address,setAddress]=useState(initial?.address||"");
    const[lat,setLat]=useState(initial?.latitude!=null?String(initial.latitude):"");
    const[lon,setLon]=useState(initial?.longitude!=null?String(initial.longitude):"");
    const[radius,setRadius]=useState(initial?.radius_feet!=null?String(initial.radius_feet):"200");
    const[notes,setNotes]=useState(initial?.notes||"");
    const[saving,setSaving]=useState(false);
    // Map search state — separate from form state
    const[searchQuery,setSearchQuery]=useState("");
    const[searching,setSearching]=useState(false);
    const[searchResults,setSearchResults]=useState([]);
    const[showMap,setShowMap]=useState(false);
    const[pickedLat,setPickedLat]=useState(null);
    const[pickedLon,setPickedLon]=useState(null);
    const searchTimerRef=useRef(null);

    const doSearch=async(q)=>{
      if(!q||q.trim().length<3){setSearchResults([]);return;}
      setSearching(true);
      try{
        const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q.trim())}&format=json&limit=6&addressdetails=1`,{headers:{"Accept-Language":"en","User-Agent":"BrightSkyConstruction/1.0"}});
        if(res.ok){const d=await res.json();setSearchResults(d);}
        else setSearchResults([]);
      }catch{setSearchResults([]);}
      setSearching(false);
    };

    const handleSearchChange=(e)=>{
      const v=e.target.value;
      setSearchQuery(v);
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current=setTimeout(()=>doSearch(v),600);
    };

    const pickResult=(r)=>{
      const plat=parseFloat(r.lat),plon=parseFloat(r.lon);
      // Build a clean address from components
      const a=r.address||{};
      const parts=[a.road,a.house_number,a.city||a.town||a.village,a.state,a.country].filter(Boolean);
      const cleanAddr=parts.length>0?parts.join(", "):r.display_name;
      // Only update coords and address — preserve name, project, radius, notes
      setLat(plat.toFixed(7));
      setLon(plon.toFixed(7));
      setAddress(cleanAddr);
      setPickedLat(plat);setPickedLon(plon);
      setSearchQuery(cleanAddr);
      setSearchResults([]);
    };

    const handleSave=async()=>{
      if(!name){addToast("Worksite name is required.","error");return;}
      if(!lat||!lon){addToast("Coordinates are required. Use the map search to find a location.","error");return;}
      const parsedLat=parseFloat(lat),parsedLon=parseFloat(lon);
      if(isNaN(parsedLat)||isNaN(parsedLon)){addToast("Invalid coordinates.","error");return;}
      setSaving(true);
      const body={name,projectName:projectName||name,address,latitude:parsedLat,longitude:parsedLon,radiusFeet:parseFloat(radius)||200,notes};
      const url=initial?`/api/worksites/${initial.id}`:"/api/worksites";
      const res=await authFetch(url,{method:initial?"PUT":"POST",body:JSON.stringify(body)});
      if(!res.ok){addToast("Failed to save worksite.","error");setSaving(false);return;}
      addToast(initial?"Worksite updated.":"Worksite created.","success");
      setSaving(false);onSave();
    };

    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Address search — completely isolated from form fields */}
        <div>
          <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Find Location on Map</label>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",gap:8}}>
              <input type="text" value={searchQuery} onChange={handleSearchChange}
                placeholder="Search address, city, or place…"
                style={{fontSize:16,flex:1,paddingRight:40}} autoCorrect="off" autoComplete="off"/>
              {searching&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)"}}>
                <span className="spin" style={{width:14,height:14,border:"2px solid var(--blue)",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block"}}/>
              </div>}
            </div>
            {searchResults.length>0&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:"var(--bg2)",borderRadius:"var(--radius-lg)",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"var(--shadow-md)",marginTop:4,maxHeight:280,overflowY:"auto"}}>
                {searchResults.map((r,i)=>(
                  <button key={i} onMouseDown={e=>{e.preventDefault();pickResult(r);}} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:10,padding:"11px 14px",background:"none",border:"none",borderBottom:i<searchResults.length-1?"1px solid var(--border)":"none",cursor:"pointer",textAlign:"left",minHeight:48}}>
                    <Icon name="pin" size={14} color="var(--blue)" style={{marginTop:2,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:13,color:"var(--text)",fontWeight:500,lineHeight:1.4}}>{r.display_name}</div>
                      <div style={{fontSize:11.5,color:"var(--text3)",marginTop:2}}>{parseFloat(r.lat).toFixed(5)}°, {parseFloat(r.lon).toFixed(5)}°</div>
                    </div>
                  </button>
                ))}
                <button onMouseDown={e=>{e.preventDefault();setSearchResults([]);}} style={{width:"100%",padding:"10px 14px",background:"var(--bg3)",border:"none",fontSize:12.5,color:"var(--text3)",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Close</button>
              </div>
            )}
          </div>
          {/* Map preview */}
          {(pickedLat!=null||(lat&&lon&&!isNaN(parseFloat(lat))))&&(
            <div style={{marginTop:8,borderRadius:"var(--radius)",overflow:"hidden",border:"1px solid var(--border)"}}>
              <iframe title="map" width="100%" height="180" style={{border:"none",display:"block"}}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(pickedLon||parseFloat(lon))-0.005}%2C${(pickedLat||parseFloat(lat))-0.005}%2C${(pickedLon||parseFloat(lon))+0.005}%2C${(pickedLat||parseFloat(lat))+0.005}&layer=mapnik&marker=${pickedLat||parseFloat(lat)}%2C${pickedLon||parseFloat(lon)}`}/>
              <div style={{padding:"8px 12px",background:"var(--bg3)",borderTop:"1px solid var(--border)",fontSize:12,color:"var(--text3)"}}>
                Selected: <strong style={{color:"var(--blue)"}}>{(pickedLat||parseFloat(lat))?.toFixed(5)}°, {(pickedLon||parseFloat(lon))?.toFixed(5)}°</strong>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{borderTop:"1px dashed var(--border)",paddingTop:14}}>
          <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Worksite Details</div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Display Name *</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Site A" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
            </div>
            <div>
              <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Project Name</label>
              <input type="text" value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="e.g. Bright Sky Tower Phase 1" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
            </div>
            <div>
              <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Address</label>
              <input type="text" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Full street address (auto-filled by search)" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Latitude *</label>
                <input type="text" inputMode="decimal" value={lat} onChange={e=>setLat(e.target.value)} placeholder="e.g. 33.9495" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
              </div>
              <div>
                <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Longitude *</label>
                <input type="text" inputMode="decimal" value={lon} onChange={e=>setLon(e.target.value)} placeholder="e.g. -83.7656" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
              </div>
            </div>
            <div>
              <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Geofence Radius (feet)</label>
              <input type="text" inputMode="decimal" value={radius} onChange={e=>setRadius(e.target.value)} placeholder="200" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:8}}>
                {[["100","100ft"],["200","200ft"],["500","500ft"],["999999999","All"]].map(([val,label])=>(
                  <button key={val} onClick={()=>setRadius(val)} style={{padding:"7px 4px",borderRadius:"var(--radius-sm)",border:`1.5px solid ${radius===val?"var(--blue)":"var(--border)"}`,background:radius===val?"var(--blue-light)":"var(--bg3)",color:radius===val?"var(--blue)":"var(--text3)",fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:radius===val?600:400}}>{label}</button>
                ))}
              </div>
              <p style={{fontSize:11.5,color:"var(--text3)",marginTop:6}}>200ft for mobile on-site · 999999999 for remote testing</p>
            </div>
            <div>
              <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Notes (optional)</label>
              <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Entrance near gate B" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
            </div>
          </div>
        </div>

        <Btn onClick={handleSave} loading={saving} style={{width:"100%",marginTop:4}} size="lg">
          <Icon name="check" size={15} color="white"/>{initial?"Update Worksite":"Create Worksite"}
        </Btn>
      </div>
    );
  }

  function WorksitesPage({worksites,refreshWorksites,adminData,addToast,t}){
  const[expandedId,setExpandedId]=useState(null);
  const[showAddModal,setShowAddModal]=useState(false);
  const[editingWS,setEditingWS]=useState(null);
  const[assigningTo,setAssigningTo]=useState(null);
  const[assignments,setAssignments]=useState([]);

  const loadAssignments=useCallback(async()=>{
    try{const r=await authFetch("/api/worksites/assignments");if(r.ok){const d=await r.json();setAssignments(Array.isArray(d)?d:[]);}}catch{}
  },[]);

  useEffect(()=>{loadAssignments();},[loadAssignments,worksites.length]);

  const getAssigned=(wsId)=>assignments.filter(a=>a.worksite_id===wsId);
  const getEmpWS=(empId)=>assignments.find(a=>a.employee_id===empId&&a.is_default);
  const employees=adminData.employees.filter(e=>e.role==="employee");

  const handleDelete=async(id)=>{
    if(!confirm("Delete this worksite?"))return;
    await authFetch(`/api/worksites/${id}`,{method:"DELETE"});
    addToast("Deleted.","info");setExpandedId(null);await refreshWorksites();await loadAssignments();
  };
  const handleAssign=async(wsId,empId)=>{
    const res=await authFetch(`/api/worksites/${wsId}/assign`,{method:"POST",body:JSON.stringify({employeeId:empId,isDefault:true})});
    if(!res.ok){addToast("Failed to assign.","error");return;}
    addToast("Assigned.","success");await refreshWorksites();await loadAssignments();
  };
  const handleRemove=async(wsId,empId)=>{
    await authFetch(`/api/worksites/${wsId}/remove/${empId}`,{method:"DELETE"});
    addToast("Removed.","info");await refreshWorksites();await loadAssignments();
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.worksites} subtitle={`${worksites.length} configured`}
        action={<Btn onClick={()=>{setShowAddModal(true);setEditingWS(null);}} size="sm"><Icon name="plus" size={13} color="white"/>New Site</Btn>}/>

      {/* Flash Cards */}
      {worksites.length===0?(
        <Card style={{textAlign:"center",padding:48}}>
          <Icon name="map" size={40} color="var(--text4)" style={{marginBottom:14}}/>
          <p style={{color:"var(--text3)",fontSize:15,fontWeight:500}}>No worksites configured yet.</p>
          <p style={{color:"var(--text4)",fontSize:13,marginTop:6,marginBottom:20}}>Add your first worksite to start tracking attendance by location.</p>
          <Btn onClick={()=>{setShowAddModal(true);setEditingWS(null);}} size="md"><Icon name="plus" size={14} color="white"/>Add First Worksite</Btn>
        </Card>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {worksites.map(w=>{
            const assigned=getAssigned(w.id);
            const isExpanded=expandedId===w.id;
            return(
              <div key={w.id}>
                {/* Flash Card */}
                <button onClick={()=>setExpandedId(isExpanded?null:w.id)} style={{width:"100%",textAlign:"left",background:"none",border:"none",padding:0,cursor:"pointer"}}>
                  <Card style={{
                    padding:0,overflow:"hidden",
                    border:isExpanded?"1.5px solid var(--blue)":"1px solid var(--border)",
                    boxShadow:isExpanded?"var(--shadow-md)":"var(--shadow-sm)",
                    transition:"all 0.2s",
                  }}>
                    {/* Card header */}
                    <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
                      {/* Status dot + icon */}
                      <div style={{width:44,height:44,borderRadius:"var(--radius-lg)",background:isExpanded?"var(--blue)":"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",boxShadow:isExpanded?"0 3px 10px rgba(37,99,235,0.3)":"none"}}>
                        <Icon name="pin" size={20} color={isExpanded?"white":"var(--blue)"}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.project_name||w.name}</div>
                        {w.address&&<div style={{fontSize:12,color:"var(--text3)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.address}</div>}
                        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                          <span style={{background:"var(--bg3)",border:"1px solid var(--border)",padding:"2px 8px",borderRadius:999,fontSize:11,color:"var(--text3)"}}>🎯 {w.radius_feet}ft</span>
                          <span style={{background:parseInt(w.assigned_count)>0?"var(--blue-light)":"var(--bg3)",border:`1px solid ${parseInt(w.assigned_count)>0?"var(--blue-mid)":"var(--border)"}`,padding:"2px 8px",borderRadius:999,fontSize:11,color:parseInt(w.assigned_count)>0?"var(--blue)":"var(--text3)",fontWeight:parseInt(w.assigned_count)>0?600:400}}>👥 {w.assigned_count||0} assigned</span>
                        </div>
                      </div>
                      <Icon name={isExpanded?"chevronUp":"chevronDown"} size={18} color="var(--text3)"/>
                    </div>
                  </Card>
                </button>

                {/* Expanded detail panel */}
                {isExpanded&&(
                  <div className="slide-down" style={{background:"var(--bg2)",border:"1.5px solid var(--blue)",borderTop:"none",borderRadius:"0 0 var(--radius-lg) var(--radius-lg)",padding:"0 18px 18px",boxShadow:"var(--shadow-md)"}}>
                    {/* Coordinates */}
                    <div style={{display:"flex",gap:8,padding:"12px 0",borderBottom:"1px solid var(--border)",flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"var(--text3)"}}>📍 {parseFloat(w.latitude).toFixed(5)}°, {parseFloat(w.longitude).toFixed(5)}°</span>
                      {w.notes&&<span style={{fontSize:12,color:"var(--text3)"}}>· {w.notes}</span>}
                    </div>

                    {/* Assigned employees */}
                    <div style={{paddingTop:12}}>
                      <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Assigned Employees ({assigned.length})</div>
                      {assigned.length===0?(
                        <div style={{fontSize:13,color:"var(--text4)",marginBottom:12}}>No employees assigned to this site yet.</div>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                          {assigned.map(a=>(
                            <div key={a.employee_id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"var(--bg3)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}>
                              <div style={{width:28,height:28,borderRadius:"50%",background:"var(--green-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid rgba(5,150,105,0.2)"}}><Icon name="user" size={13} color="var(--green)"/></div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13.5,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.employee_name||a.full_name}</div>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                                  {a.user_id&&<span style={{fontSize:11,fontWeight:700,color:"var(--blue)",background:"var(--blue-light)",padding:"0 6px",borderRadius:4,border:"1px solid var(--blue-mid)"}}>{a.user_id}</span>}
                                  <span style={{fontSize:11.5,color:"var(--text3)"}}>{a.designation||a.department||""}</span>
                                  {a.is_default&&<span style={{fontSize:10.5,color:"var(--green)",background:"var(--green-light)",padding:"1px 6px",borderRadius:999,fontWeight:600,border:"1px solid rgba(5,150,105,0.2)"}}>✓ Default</span>}
                                </div>
                              </div>
                              <button onClick={()=>handleRemove(w.id,a.employee_id)} style={{width:28,height:28,borderRadius:"var(--radius-sm)",background:"var(--red-light)",border:"1px solid rgba(220,38,38,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Icon name="x" size={12} color="var(--red)"/></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
                      <Btn onClick={()=>setAssigningTo(w)} variant="blue" size="sm"><Icon name="plus" size={13}/>Assign Employee</Btn>
                      <Btn onClick={()=>{setEditingWS(w);setShowAddModal(true);}} variant="secondary" size="sm"><Icon name="edit" size={13}/>Edit Worksite</Btn>
                    </div>
                    <Btn onClick={()=>handleDelete(w.id)} variant="danger" size="sm" style={{width:"100%",marginTop:8}}>
                      <Icon name="x" size={13} color="var(--red)"/>Delete Worksite
                    </Btn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingWS) && (
  <Modal title={editingWS ? "Edit Worksite" : "Add New Worksite"} onClose={() => { setShowAddModal(false); setEditingWS(null); }}>
    <WorksiteForm
      initial={editingWS}
      addToast={addToast}
      onSave={async () => { setShowAddModal(false); setEditingWS(null); await refreshWorksites(); await loadAssignments(); }}
      onClose={() => { setShowAddModal(false); setEditingWS(null); }}
    />
  </Modal>
)}

      {/* Assign Modal */}
      {assigningTo&&(
        <Modal title={`Assign to: ${assigningTo.project_name||assigningTo.name}`} onClose={()=>setAssigningTo(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {assigningTo.address&&<div style={{fontSize:13,color:"var(--text3)",padding:"10px 12px",background:"var(--bg3)",borderRadius:"var(--radius)",border:"1px solid var(--border)",marginBottom:4}}>{assigningTo.address}</div>}
            <p style={{fontSize:13,color:"var(--text3)",fontWeight:400}}>Select an employee to assign to this worksite:</p>
            {employees.map(emp=>{
              const current=getEmpWS(emp.id);
              const isHere=assignments.some(a=>a.worksite_id===assigningTo.id&&a.employee_id===emp.id&&a.is_default);
              return(
                <button key={emp.id} onClick={()=>{handleAssign(assigningTo.id,emp.id);setAssigningTo(null);}} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:"var(--radius-lg)",border:`1.5px solid ${isHere?"rgba(5,150,105,0.3)":"var(--border)"}`,background:isHere?"var(--green-light)":"var(--bg3)",cursor:"pointer",textAlign:"left",width:"100%",minHeight:56,transition:"all 0.12s"}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:isHere?"var(--green-light)":"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`2px solid ${isHere?"rgba(5,150,105,0.2)":"var(--blue-mid)"}`}}><Icon name="user" size={17} color={isHere?"var(--green)":"var(--blue)"}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:isHere?"var(--green)":"var(--text)"}}>{emp.name||emp.full_name}{isHere&&" ✓"}</div>
                    <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>
                      {emp.user_id&&<span style={{color:"var(--blue)",fontWeight:700,marginRight:6}}>{emp.user_id}</span>}
                      {current?<span>Currently: <strong style={{color:"var(--text)"}}>{current.worksite_name}</strong></span>:<span style={{color:"var(--red)"}}>Not assigned</span>}
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

// ─── MY ATTENDANCE ────────────────────────────────────────────────────────────
function MyAttendance({ t }) {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("week");
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [sessionPunches, setSessionPunches] = useState({});

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const r = await authFetch("/api/attendance/me");
      const d = await r.json();
      setSessions(Array.isArray(d) ? d : []);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const iv = setInterval(fetchSessions, 30000);
    return () => clearInterval(iv);
  }, [fetchSessions]);

  const filtered = sessions
    .filter(s => {
      const diff = Math.floor((Date.now() - new Date(s.work_date).getTime()) / 86400000);
      if (filter === "week") return diff < 7;
      if (filter === "month") return diff < 30;
      return true;
    })
    .sort((a, b) => b.work_date.localeCompare(a.work_date));

  const totalMins = filtered.reduce((a, s) => a + (s.worked_minutes || 0), 0);

  const toggleSession = async (sessionId) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (!sessionPunches[sessionId]) {
      try {
        const res = await authFetch(`/api/attendance/session/${sessionId}/punches`);
        const data = await res.json();
        setSessionPunches(prev => ({ ...prev, [sessionId]: data }));
      } catch (err) {
        console.error("Failed to fetch punches", err);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader title={t.myAttendance} subtitle="Your attendance history" action={<Btn onClick={fetchSessions} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13} />{t.refresh}</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StatCard label="Sessions" value={filtered.length} icon="calendar" color="var(--blue)" />
        <StatCard label="Total Hrs" value={`${Math.round(totalMins / 60)}h`} icon="clock" color="var(--green)" />
        <StatCard label="Daily Avg" value={fmtMins(filtered.length ? Math.round(totalMins / filtered.length) : 0)} icon="trend" color="var(--purple)" />
      </div>
      <Card>
        <div style={{ display: "flex", gap: 0, background: "var(--bg3)", borderRadius: "var(--radius)", padding: 3, border: "1px solid var(--border)", marginBottom: 16 }}>
          {[["week", "7 Days"], ["month", "30 Days"], ["all", "All Time"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ flex: 1, padding: "7px", borderRadius: "var(--radius-sm)", border: "none", background: filter === v ? "var(--bg2)" : "transparent", color: filter === v ? "var(--blue)" : "var(--text3)", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: filter === v ? 600 : 450, boxShadow: filter === v ? "var(--shadow-sm)" : "none", minHeight: 34, transition: "all 0.12s" }}>
              {l}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>Loading...</div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ minWidth: 420 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Break</th>
                  <th>Worked</th>
                  <th>Status</th>
                  <th>Breaks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text4)", padding: 24 }}>No records found.</td></tr>
                ) : (
                  filtered.map(s => (
                    <>
                      <tr key={s.id}>
                        <td style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>{fmtDate(s.work_date)}</td>
                        <td style={{ fontSize: 12.5 }}>{fmtTime(s.clock_in_time)}</td>
                        <td style={{ fontSize: 12.5 }}>{fmtTime(s.clock_out_time)}</td>
                        <td style={{ fontSize: 12.5 }}>{fmtMins(s.break_minutes)}</td>
                        <td style={{ color: s.is_overtime ? "var(--orange)" : "var(--green)", fontWeight: 600, fontSize: 13 }}>
                          {s.status === "active" && s.clock_in_time
                            ? fmtMins(Math.max(0, Math.round((Date.now() - new Date(s.clock_in_time).getTime()) / 60000) - (parseInt(s.break_minutes) || 0)))
                            : fmtMins(s.worked_minutes)}
                          {s.is_overtime && " 🔥"}
                        </td>
                        <td><StatusBadge status={s.status === "completed" ? "clocked_out" : s.is_overtime ? "overtime" : "clocked_in"} /></td>
                        <td>
                          <button onClick={() => toggleSession(s.id)} style={{ background: "var(--blue-light)", border: "1px solid var(--blue-mid)", borderRadius: "var(--radius-sm)", padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>
                            {expandedSessionId === s.id ? "Hide" : "Show"} Breaks
                          </button>
                        </td>
                      </tr>
                      {expandedSessionId === s.id && sessionPunches[s.id] && (
                        <tr>
                          <td colSpan={7} style={{ padding: "12px 16px", background: "var(--bg3)" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Break Details</div>
                            {sessionPunches[s.id].filter(p => p.punch_type === "break_start").length === 0 ? (
                              <div style={{ color: "var(--text4)", fontSize: 12 }}>No breaks recorded.</div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {sessionPunches[s.id].filter(p => p.punch_type === "break_start").map((p, idx) => {
                                  const endPunch = sessionPunches[s.id].find(
                                    ep => ep.punch_type === "break_end" && new Date(ep.punch_time) > new Date(p.punch_time)
                                  );
                                  const duration = endPunch
                                    ? Math.round((new Date(endPunch.punch_time) - new Date(p.punch_time)) / 60000)
                                    : (s.status === "on_break" && idx === sessionPunches[s.id].filter(p => p.punch_type === "break_start").length - 1)
                                      ? Math.round((Date.now() - new Date(p.punch_time).getTime()) / 60000)
                                      : null;
                                  return (
                                    <div key={p.id} style={{ borderLeft: "3px solid", borderColor: p.break_type === "work" ? "var(--blue)" : "var(--amber)", paddingLeft: 12 }}>
  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
    {p.break_type === "work" ? "Work‑Related" : "Personal"} Break
  </div>
  {p.remarks && (
    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
      Reason: {p.remarks}
    </div>
  )}
  <div style={{ fontSize: 11, color: "var(--text3)" }}>
    {fmtTime(p.punch_time)} {duration !== null && `· Duration: ${fmtMins(duration)}`}
  </div>
  {p.break_type === "work" && (
    <div style={{ marginTop: 4 }}>
      {p.break_completed === true ? (
        <span style={{ fontSize: 10, color: "var(--green)" }}>✓ Completed</span>
      ) : p.break_completed === false && p.break_incomplete_reason ? (
        <span style={{ fontSize: 10, color: "var(--red)" }}>✗ Not Completed – {p.break_incomplete_reason}</span>
      ) : (
        <span style={{ fontSize: 10, color: "var(--amber)" }}>⏳ Pending</span>
      )}
    </div>
  )}
</div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── MY PROFILE ───────────────────────────────────────────────────────────────
function MyProfile({user,addToast,employeeWorksite,t}){
  const[summary,setSummary]=useState(null);
  const[schedule,setSchedule]=useState(null);
  const[loadingSchedule,setLoadingSchedule]=useState(true);
  useEffect(()=>{
    authFetch("/api/attendance/me/summary").then(r=>r.json()).then(d=>setSummary(d)).catch(()=>{});
    authFetch(`/api/employees/${user.id}/schedule`).then(r=>r.json()).then(d=>{setSchedule(d);setLoadingSchedule(false);}).catch(()=>setLoadingSchedule(false));
  },[user.id]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.myProfile}/>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
          <div style={{width:54,height:54,borderRadius:"50%",background:"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid var(--blue-mid)",flexShrink:0}}><Icon name="user" size={26} color="var(--blue)"/></div>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:"var(--text)",letterSpacing:"-0.02em"}}>{user.name}</h2>
            <p style={{color:"var(--text3)",fontSize:13,textTransform:"capitalize",marginTop:2}}>{user.role}</p>
            {user.userId&&<div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:5,background:"var(--blue-light)",padding:"3px 10px",borderRadius:999,border:"1px solid var(--blue-mid)"}}><Icon name="key" size={11} color="var(--blue)"/><span style={{fontSize:12,fontWeight:700,color:"var(--blue)"}}>{user.userId}</span></div>}
          </div>
        </div>
        {[["Email",user.email||"—"],["Role",user.role]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:13.5,color:"var(--text3)",fontWeight:500}}>{k}</span>
            <span style={{fontSize:13.5,color:"var(--text)",fontWeight:500,textAlign:"right",maxWidth:"60%",wordBreak:"break-all"}}>{v}</span>
          </div>
        ))}
      </Card>
      {employeeWorksite&&<Card style={{border:"1.5px solid var(--blue-mid)",background:"var(--blue-light)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="pin" size={15} color="var(--blue)"/><h3 style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{t.assignedWorksite}</h3><span style={{background:"var(--green-light)",color:"var(--green)",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:600,border:"1px solid rgba(5,150,105,0.2)"}}>Active</span></div>
        <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:3,letterSpacing:"-0.01em"}}>{employeeWorksite.project_name||employeeWorksite.name}</div>
        {employeeWorksite.address&&<div style={{fontSize:13,color:"var(--text3)",marginBottom:4}}>{employeeWorksite.address}</div>}
        <div style={{fontSize:12,color:"var(--text3)"}}>{parseFloat(employeeWorksite.latitude).toFixed(4)}°, {parseFloat(employeeWorksite.longitude).toFixed(4)}° · {employeeWorksite.radius_feet}ft</div>
      </Card>}
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Icon name="clock" size={15} color="var(--blue)"/><h3 style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{t.mySchedule}</h3></div>
        {loadingSchedule?<div style={{color:"var(--text3)",fontSize:13}}>Loading schedule…</div>
        :!schedule?<div style={{color:"var(--text4)",fontSize:13}}>No schedule assigned yet. Contact your manager.</div>
        :[
          [t.workHours, `${schedule.scheduled_start_time?.slice?.(0,5)||schedule.scheduled_start_time||"07:00"} – ${schedule.scheduled_end_time?.slice?.(0,5)||schedule.scheduled_end_time||"17:00"}`],
          [t.workingDays, Array.isArray(schedule.working_days)?schedule.working_days.join(", "):String(schedule.working_days||"Mon–Fri")],
          [t.grace, `${schedule.grace_minutes||15} minutes`],
        ].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:13.5,color:"var(--text3)",fontWeight:450}}>{k}</span>
            <span style={{fontSize:13.5,fontWeight:600,color:"var(--text)"}}>{v}</span>
          </div>
        ))}
      </Card>
      {summary&&<Card>
        <h3 style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14}}>Work Summary</h3>
        {[["Total Sessions",summary.total_sessions],["Total Hours",`${Math.round((summary.total_minutes||0)/60)}h`],["Daily Average",fmtMins(Math.round(summary.avg_daily_minutes||0))],["This Week",`${Math.round((summary.week_minutes||0)/60)}h`]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:13.5,color:"var(--text3)",fontWeight:450}}>{k}</span>
            <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{v}</span>
          </div>
        ))}
      </Card>}
    </div>
  );
}

// ─── EMPLOYEE LIST ────────────────────────────────────────────────────────────
function EmployeeList({adminData,refreshAdminData,addToast,worksites,t}){
  const[search,setSearch]=useState("");
  const[adding,setAdding]=useState(false);
  const[editingSchedule,setEditingSchedule]=useState(null);
  const[scheduleData,setScheduleData]=useState(null);
  const[loadingSchedule,setLoadingSchedule]=useState(false);
  // Use separate state for each field (not refs) for controlled inputs
  // but wrap in a sub-component to avoid keyboard-close on parent re-render
  const[role,setRole]=useState("employee");
  const[showPass,setShowPass]=useState(false);
  // Schedule refs (modal only — no parent re-render issues)
  const startRef=useRef(null),endRef=useRef(null),graceRef=useRef(null);

  const employees=adminData.employees.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase())||u.employee_code?.toLowerCase().includes(search.toLowerCase())||u.user_id?.includes(search));

  const handleDelete=async(uid)=>{if(!confirm("Deactivate this employee?"))return;await authFetch(`/api/admin/employees/${uid}`,{method:"DELETE"});addToast("Deactivated.","info");refreshAdminData();};

  const openSchedule=async(emp)=>{
    setLoadingSchedule(true);setEditingSchedule(emp);
    try{const r=await authFetch(`/api/employees/${emp.id}/schedule`);if(r.ok){const d=await r.json();setScheduleData(d);}else setScheduleData(null);}catch{setScheduleData(null);}
    setLoadingSchedule(false);
  };

  const saveSchedule=async()=>{
    if(!editingSchedule)return;
    const res=await authFetch(`/api/employees/${editingSchedule.id}/schedule`,{method:"PUT",body:JSON.stringify({scheduledStartTime:startRef.current?.value||"07:00",scheduledEndTime:endRef.current?.value||"17:00",graceMinutes:parseInt(graceRef.current?.value)||15,workingDays:["Mon","Tue","Wed","Thu","Fri"]})});
    if(!res.ok){addToast("Failed to save schedule.","error");return;}
    addToast("Schedule saved.","success");setEditingSchedule(null);
  };

  // AddEmployeeForm is isolated — parent state changes don't affect it
  function AddEmployeeForm({onDone}){
    const[fname,setFname]=useState("");
    const[femail,setFemail]=useState("");
    const[fpass,setFpass]=useState("");
    const[fuid,setFuid]=useState("");
    const[fdept,setFdept]=useState("");
    const[fdesig,setFdesig]=useState("");
    const[fcode,setFcode]=useState("");
    const[frole,setFrole]=useState("employee");
    const[fshowPass,setFshowPass]=useState(false);
    const[saving,setSaving]=useState(false);
    const handleAdd=async()=>{
      if(!fname||!fpass){addToast("Name and password required.","error");return;}
      setSaving(true);
      const res=await authFetch("/api/admin/employees",{method:"POST",body:JSON.stringify({name:fname,email:femail||null,password:fpass,role:frole,department:fdept,designation:fdesig,employeeCode:fcode,userId:fuid||null})});
      const d=await res.json();
      if(!res.ok){addToast(d.error||"Failed.","error");setSaving(false);return;}
      addToast(`Employee added. User ID: ${d.userId}`,"success");setSaving(false);onDone();
    };
    return(
      <Card style={{border:"1.5px solid var(--blue-mid)",background:"var(--blue-light)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>New Employee</h3>
          <button onClick={onDone} style={{background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text3)",width:28,height:28,borderRadius:"var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="close" size={14}/></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>Full Name *</label><input type="text" value={fname} onChange={e=>setFname(e.target.value)} placeholder="Full name" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>User ID (4-char)</label><input type="text" value={fuid} onChange={e=>setFuid(e.target.value.toUpperCase().slice(0,4))} placeholder="Auto" maxLength={4} style={{fontSize:16,textAlign:"center",letterSpacing:"0.15em"}} autoCorrect="off" autoCapitalize="off" autoComplete="off"/></div>
            <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>Password *</label>
              <div style={{position:"relative"}}>
                <input type={fshowPass?"text":"password"} value={fpass} onChange={e=>setFpass(e.target.value)} placeholder="Password" style={{fontSize:16,paddingRight:44}} autoCorrect="off" autoComplete="new-password"/>
                <button type="button" onClick={()=>setFshowPass(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text3)",cursor:"pointer",padding:5,display:"flex",minWidth:30,minHeight:30,alignItems:"center",justifyContent:"center",borderRadius:"var(--radius-sm)"}}><Icon name={fshowPass?"eyeOff":"eye"} size={15}/></button>
              </div>
            </div>
          </div>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>Email (optional)</label><input type="email" value={femail} onChange={e=>setFemail(e.target.value)} placeholder="email@brightsky.com" style={{fontSize:16}} autoCorrect="off" autoCapitalize="off" autoComplete="off"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>Department</label><input type="text" value={fdept} onChange={e=>setFdept(e.target.value)} placeholder="Construction" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/></div>
            <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>Designation</label><input type="text" value={fdesig} onChange={e=>setFdesig(e.target.value)} placeholder="Site Worker" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/></div>
          </div>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>Employee Code</label><input type="text" value={fcode} onChange={e=>setFcode(e.target.value)} placeholder="BSC-012" style={{fontSize:16}} autoCorrect="off" autoCapitalize="characters" autoComplete="off"/></div>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:5,fontWeight:600}}>Role</label>
            <select value={frole} onChange={e=>setFrole(e.target.value)} style={{fontSize:16}}>
              <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <Btn onClick={handleAdd} loading={saving} style={{width:"100%"}}><Icon name="check" size={14} color="white"/>Add Employee</Btn>
      </Card>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.employees} subtitle={`${employees.length} team members`} action={<Btn onClick={()=>setAdding(a=>!a)} variant={adding?"secondary":"primary"} size="sm">{adding?t.cancel:<><Icon name="plus" size={13} color="white"/>{t.add}</>}</Btn>}/>
      {adding&&<AddEmployeeForm onDone={()=>{setAdding(false);refreshAdminData();}}/>}
      <Card>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, code, or User ID…" style={{marginBottom:14,fontSize:16}} autoCorrect="off" autoComplete="off"/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {employees.length===0?<div style={{textAlign:"center",color:"var(--text4)",padding:24,fontSize:13.5}}>No employees found.</div>
          :employees.map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:"var(--bg3)",borderRadius:"var(--radius-lg)",border:"1px solid var(--border)"}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid var(--blue-mid)"}}><Icon name="user" size={17} color="var(--blue)"/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:"var(--text)",fontSize:14}}>{u.name||u.full_name}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:1}}>{u.email||""}{u.department?` · ${u.department}`:""}</div>
                <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                  {u.user_id&&<span style={{background:"var(--blue-light)",color:"var(--blue)",padding:"2px 8px",borderRadius:999,fontSize:11.5,fontWeight:700,border:"1px solid var(--blue-mid)"}}>ID: {u.user_id}</span>}
                  <span style={{background:"var(--bg2)",color:"var(--text3)",padding:"2px 8px",borderRadius:999,fontSize:11.5,textTransform:"capitalize",border:"1px solid var(--border)"}}>{u.role}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>openSchedule(u)} style={{width:34,height:34,borderRadius:"var(--radius-sm)",background:"var(--blue-light)",border:"1px solid var(--blue-mid)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="clock" size={14} color="var(--blue)"/></button>
                <button onClick={()=>handleDelete(u.id)} style={{width:34,height:34,borderRadius:"var(--radius-sm)",background:"var(--red-light)",border:"1px solid rgba(220,38,38,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="x" size={14} color="var(--red)"/></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {/* Schedule modal */}
      {editingSchedule&&(
        <Modal title={`Schedule — ${editingSchedule.name}`} onClose={()=>setEditingSchedule(null)}>
          {loadingSchedule?<div style={{textAlign:"center",padding:24,color:"var(--text3)"}}>Loading…</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{padding:"10px 14px",borderRadius:"var(--radius)",background:"var(--blue-light)",border:"1.5px solid var(--blue-mid)",fontSize:13,color:"var(--blue)",fontWeight:450}}>
                This schedule controls auto clock-in/out and overtime detection.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Start Time</label>
                  <input type="time" ref={startRef} defaultValue={scheduleData?.scheduled_start_time?.toString().slice(0,5)||"07:00"} style={{fontSize:16}}/></div>
                <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>End Time</label>
                  <input type="time" ref={endRef} defaultValue={scheduleData?.scheduled_end_time?.toString().slice(0,5)||"17:00"} style={{fontSize:16}}/></div>
              </div>
              <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Grace Period (minutes)</label>
                <input type="text" inputMode="numeric" ref={graceRef} defaultValue={scheduleData?.grace_minutes||15} placeholder="15" style={{fontSize:16}} autoCorrect="off" autoComplete="off"/>
              </div>
              {scheduleData&&<div style={{padding:"10px 14px",background:"var(--bg3)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}>
                <div style={{fontSize:12,color:"var(--text3)",marginBottom:3,fontWeight:500}}>Current Schedule</div>
                <div style={{fontSize:13.5,color:"var(--text)",fontWeight:500}}>
                  {scheduleData.scheduled_start_time?.toString().slice(0,5)||"07:00"} – {scheduleData.scheduled_end_time?.toString().slice(0,5)||"17:00"} · Grace: {scheduleData.grace_minutes||15}min
                </div>
              </div>}
              <Btn onClick={saveSchedule} style={{width:"100%"}} size="md"><Icon name="check" size={14} color="white"/>Save Schedule</Btn>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function CameraModal({ onClose, onCapture }) {
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        onClose();
      }
    }
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.8); // base64
    setPhoto(imageData);
  };

  const confirmPhoto = () => {
    if (photo) {
      onCapture(photo);
    } else {
      // If no photo taken, capture now
      takePhoto();
      setTimeout(() => {
        if (photo) onCapture(photo);
      }, 100);
    }
  };

  return (
    <Modal title="Take a photo at your worksite" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!photo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", borderRadius: "var(--radius)", background: "black" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <Btn onClick={takePhoto} variant="primary" style={{ width: "100%" }}>
              <Icon name="camera" size={16} color="white" /> Take Photo
            </Btn>
          </>
        ) : (
          <>
            <img src={photo} alt="preview" style={{ width: "100%", borderRadius: "var(--radius)" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setPhoto(null)} variant="secondary" style={{ flex: 1 }}>
                <Icon name="refresh" size={14} /> Retake
              </Btn>
              <Btn onClick={confirmPhoto} variant="green" style={{ flex: 1 }}>
                <Icon name="check" size={14} color="white" /> Use Photo & Clock In
              </Btn>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── ATTENDANCE PAGE ──────────────────────────────────────────────────────────
function AttendancePage({adminData,t}){
  const[empFilter,setEmpFilter]=useState("all");
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[records,setRecords]=useState([]);
  const[loading,setLoading]=useState(true);
  const fetch_=useCallback(async()=>{
    const p=new URLSearchParams();if(empFilter!=="all")p.set("user_id",empFilter);if(dateFrom)p.set("date_from",dateFrom);if(dateTo)p.set("date_to",dateTo);
    setLoading(true);try{const r=await authFetch(`/api/admin/attendance?${p}`);const d=await r.json();setRecords(Array.isArray(d)?d:[]);}catch{}setLoading(false);
  },[empFilter,dateFrom,dateTo]);
  useEffect(()=>{fetch_();},[fetch_]);
  useEffect(()=>{const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[fetch_]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.attendance} subtitle={`${records.length} records`} action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>{t.refresh}</Btn>}/>
      <Card>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{fontSize:16}}>
            <option value="all">All Employees</option>
            {adminData.employees.map(u=><option key={u.id} value={u.id}>{u.name}{u.user_id?` (${u.user_id})`:""}</option>)}
          </select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{fontSize:16}}/>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{fontSize:16}}/>
          </div>
        </div>
        {loading?<div style={{textAlign:"center",padding:24,color:"var(--text3)"}}>Loading...</div>:(
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{minWidth:500}}>
              <thead><tr><th>Employee</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Worked</th><th>Status</th></tr></thead>
              <tbody>
                {records.length===0?<tr><td colSpan={6} style={{textAlign:"center",color:"var(--text4)",padding:24}}>No records found.</td></tr>
                :records.map(s=>(
                  <tr key={s.id}>
                    <td style={{color:"var(--text)",fontWeight:600,fontSize:13.5}}>{s.name||"—"}</td>
                    <td style={{fontSize:12.5}}>{fmtDate(s.work_date)}</td>
                    <td style={{fontSize:12.5}}>{fmtTime(s.clock_in_time)}</td>
                    <td style={{fontSize:12.5}}>{fmtTime(s.clock_out_time)}</td>
                    <td style={{color:s.is_overtime?"var(--orange)":"var(--green)",fontWeight:600,fontSize:13}}>{s.status==="active"&&s.clock_in_time?fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0))):fmtMins(s.worked_minutes)}{s.is_overtime&&" 🔥"}</td>
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

// ─── REPORTS PAGE (Interactive Charts) ───────────────────────────────────────
function ReportsPage({t}){
  const[summary,setSummary]=useState([]);
  const[allRecords,setAllRecords]=useState([]);
  const[loading,setLoading]=useState(true);
  const[period,setPeriod]=useState("month"); // week | month | all
  const[chartView,setChartView]=useState("employees"); // employees | weekdays | month

  const fetchAll=useCallback(async()=>{
    setLoading(true);
    try{
      const[sumRes,recRes]=await Promise.all([
        authFetch("/api/admin/reports/summary"),
        authFetch("/api/admin/attendance"),
      ]);
      if(sumRes.ok){const d=await sumRes.json();setSummary(Array.isArray(d)?d:[]);}
      if(recRes.ok){const d=await recRes.json();setAllRecords(Array.isArray(d)?d:[]);}
    }catch{}
    setLoading(false);
  },[]);

  useEffect(()=>{fetchAll();},[fetchAll]);
  useEffect(()=>{const iv=setInterval(fetchAll,60000);return()=>clearInterval(iv);},[fetchAll]);

  // Filter records by period
  const filteredRecords=allRecords.filter(r=>{
    const diff=Math.floor((Date.now()-new Date(r.work_date).getTime())/86400000);
    if(period==="week")return diff<7;
    if(period==="month")return diff<30;
    return true;
  });

  // === ACCURATE CALCULATIONS ===
  // Per-employee totals from filtered records
  const employeeTotals = filteredRecords.reduce((acc, r) => {
  if (!r.user_id) return acc;
  if (!acc[r.user_id]) {
    acc[r.user_id] = {
  name: r.name || "Unknown",
  userId: r.employee_code || r.user_id?.slice(0,8),
  minutes: 0,
  sessions: 0,
  breaks: 0,
  breakMins: 0,
  personalBreakMins: 0,
  workBreakMins: 0
};
  }
  // Use actual worked_minutes for completed, live calc for active
  let mins = r.worked_minutes || 0;
  if (r.status === "active" && r.clock_in_time) {
    mins = Math.max(0, Math.round((Date.now() - new Date(r.clock_in_time).getTime()) / 60000) - (parseInt(r.break_minutes) || 0));
  }
  acc[r.user_id].minutes += mins;
  acc[r.user_id].sessions += 1;
  acc[r.user_id].breaks += (r.break_count || 0);
  acc[r.user_id].breakMins += parseInt(r.break_minutes) || 0;
  acc[r.user_id].personalBreakMins += parseInt(r.personal_break_minutes) || 0;
  acc[r.user_id].workBreakMins += parseInt(r.work_break_minutes) || 0;
  return acc;
}, {});
  const empData=Object.values(employeeTotals).sort((a,b)=>b.minutes-a.minutes);

  // Per-weekday totals
  const weekdayTotals={"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0};
  const weekdayCount={"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0};
  filteredRecords.forEach(r=>{
    const day=dayName(r.work_date);
    let mins=r.worked_minutes||0;
    if(r.status==="active"&&r.clock_in_time)mins=Math.max(0,Math.round((Date.now()-new Date(r.clock_in_time).getTime())/60000)-(parseInt(r.break_minutes)||0));
    weekdayTotals[day]=(weekdayTotals[day]||0)+mins;
    weekdayCount[day]=(weekdayCount[day]||0)+1;
  });

  // Per-month totals (last 6 months)
  const monthTotals={};
  allRecords.forEach(r=>{
    const d=new Date(r.work_date);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label=d.toLocaleDateString("en-US",{month:"short",year:"numeric"});
    if(!monthTotals[key])monthTotals[key]={label,minutes:0,sessions:0};
    let mins=r.worked_minutes||0;
    if(r.status==="active"&&r.clock_in_time)mins=Math.max(0,Math.round((Date.now()-new Date(r.clock_in_time).getTime())/60000)-(parseInt(r.break_minutes)||0));
    monthTotals[key].minutes+=mins;monthTotals[key].sessions+=1;
  });
  const monthData=Object.entries(monthTotals).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6).map(([k,v])=>v);

  const totalHrs=empData.reduce((a,e)=>a+e.minutes,0);
  const totalSessions=filteredRecords.length;
  const avgDaily=totalSessions>0?Math.round(totalHrs/totalSessions):0;

  // Bar chart component
  const BarChart=({data,maxVal,getLabel,getValue,getColor,height=100})=>{
    if(data.length===0)return<div style={{textAlign:"center",padding:"24px 0",color:"var(--text4)",fontSize:13}}>No data for this period</div>;
    return(
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height,paddingBottom:24,position:"relative"}}>
        {data.map((item,i)=>{
          const val=getValue(item);
          const pct=maxVal>0?Math.min(100,(val/maxVal)*100):0;
          const barH=Math.max(pct*((height-24)/100),val>0?4:2);
          const color=getColor(item,i);
          return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,gap:3,position:"relative"}}>
              <div style={{fontSize:9.5,color:color||"var(--blue)",fontWeight:700,whiteSpace:"nowrap"}}>{val>0?`${Math.round(val/60)}h`:""}</div>
              <div style={{width:"100%",height:barH,borderRadius:"4px 4px 0 0",background:color||"var(--blue)",opacity:0.85,transition:"height 0.5s ease",minHeight:val>0?4:2}}/>
              <div style={{position:"absolute",bottom:0,fontSize:9,color:"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",textAlign:"center"}}>{getLabel(item,i)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const COLORS=["var(--blue)","var(--green)","var(--amber)","var(--purple)","var(--orange)","#06b6d4","#84cc16","#f43f5e","#8b5cf6","#0ea5e9","#10b981","#f59e0b"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.reports} subtitle="Accurate attendance analytics" action={<Btn onClick={fetchAll} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13}/>{t.refresh}</Btn>}/>

      {/* Period selector */}
      <div style={{display:"flex",gap:0,background:"var(--bg3)",borderRadius:"var(--radius)",padding:3,border:"1px solid var(--border)"}}>
        {[["week","7 Days"],["month","30 Days"],["all","All Time"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{flex:1,padding:"7px",borderRadius:"var(--radius-sm)",border:"none",background:period===v?"var(--bg2)":"transparent",color:period===v?"var(--blue)":"var(--text3)",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:period===v?600:450,boxShadow:period===v?"var(--shadow-sm)":"none",minHeight:34,transition:"all 0.12s"}}>{l}</button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <StatCard label="Total Hours" value={`${Math.round(totalHrs/60)}h`} icon="clock" color="var(--blue)"/>
        <StatCard label="Sessions" value={totalSessions} icon="calendar" color="var(--green)"/>
        <StatCard label="Avg/Session" value={fmtMins(avgDaily)} icon="trend" color="var(--amber)"/>
      </div>

      {/* Chart selector */}
      <Card>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {[["employees","By Employee","users"],["weekdays","By Weekday","calendar"],["monthly","By Month","bar"]].map(([v,l,icon])=>(
            <button key={v} onClick={()=>setChartView(v)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:"var(--radius)",border:`1.5px solid ${chartView===v?"var(--blue)":"var(--border)"}`,background:chartView===v?"var(--blue-light)":"var(--bg3)",color:chartView===v?"var(--blue)":"var(--text3)",fontSize:12.5,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:chartView===v?600:400,minHeight:34}}>
              <Icon name={icon} size={13} color={chartView===v?"var(--blue)":"var(--text3)"}/>
              {l}
            </button>
          ))}
        </div>

        {loading?<div style={{textAlign:"center",padding:32,color:"var(--text3)"}}>Loading…</div>:(
          <>
            {chartView==="employees"&&(
              <>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:12}}>Hours Worked by Employee</div>
                <BarChart
                  data={empData}
                  maxVal={Math.max(...empData.map(e=>e.minutes),1)}
                  getLabel={(e)=>e.name.split(" ")[0]}
                  getValue={(e)=>e.minutes}
                  getColor={(e,i)=>COLORS[i%COLORS.length]}
                  height={120}
                />
              </>
            )}
            {chartView==="weekdays"&&(
              <>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:12}}>Hours Worked by Weekday</div>
                <BarChart
                  data={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}
                  maxVal={Math.max(...Object.values(weekdayTotals),1)}
                  getLabel={(d)=>d}
                  getValue={(d)=>weekdayTotals[d]||0}
                  getColor={()=>"var(--blue)"}
                  height={120}
                />
              </>
            )}
            {chartView==="monthly"&&(
              <>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:12}}>Hours Worked by Month</div>
                <BarChart
                  data={monthData}
                  maxVal={Math.max(...monthData.map(m=>m.minutes),1)}
                  getLabel={(m)=>m.label}
                  getValue={(m)=>m.minutes}
                  getColor={(m,i)=>COLORS[i%COLORS.length]}
                  height={120}
                />
              </>
            )}
          </>
        )}
      </Card>

      {/* Employee detail table */}
      <Card>
        <h3 style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:16}}>Employee Breakdown</h3>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{minWidth:500}}>
            <thead>
  <tr>
    <th>Employee</th>
    <th>Sessions</th>
    <th>Total Hrs</th>
    <th>Avg/Session</th>
    <th>Personal Break</th>
    <th>Work Break</th>
    <th>Break Time</th>
  </tr>
</thead>
<tbody>
  {empData.map((e, i) => (
    <tr key={i}>
      <td>
        <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13.5 }}>{e.name}</div>
        <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 1 }}>{e.userId}</div>
      </td>
      <td style={{ fontWeight: 600, color: "var(--text2)" }}>{e.sessions}</td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden", minWidth: 40 }}>
            <div style={{ height: "100%", background: "var(--blue)", borderRadius: 3, width: `${Math.min(100, (e.minutes / (empData[0]?.minutes || 1)) * 100)}%`, transition: "width 0.5s ease" }} />
          </div>
          <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: 13, minWidth: 32 }}>{Math.round(e.minutes / 60)}h</span>
        </div>
      </td>
      <td style={{ color: "var(--text2)", fontWeight: 500 }}>{fmtMins(e.sessions > 0 ? Math.round(e.minutes / e.sessions) : 0)}</td>
      <td style={{ color: "var(--text3)", fontSize: 12 }}>{fmtMins(e.personalBreakMins || 0)}</td>
      <td style={{ color: "var(--text3)", fontSize: 12 }}>{fmtMins(e.workBreakMins || 0)}</td>
      <td style={{ color: "var(--text3)" }}>{fmtMins(e.breakMins)}</td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </Card>

      {/* Weekday breakdown table */}
      {chartView==="weekdays"&&(
        <Card>
          <h3 style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:16}}>Weekday Totals</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>{
              const mins=weekdayTotals[day]||0;
              const count=weekdayCount[day]||0;
              return(
                <div key={day} style={{textAlign:"center",padding:"10px 4px",background:mins>0?"var(--blue-light)":"var(--bg3)",borderRadius:"var(--radius)",border:`1px solid ${mins>0?"var(--blue-mid)":"var(--border)"}`}}>
                  <div style={{fontSize:11,fontWeight:600,color:mins>0?"var(--blue)":"var(--text3)"}}>{day}</div>
                  <div style={{fontSize:14,fontWeight:700,color:mins>0?"var(--blue)":"var(--text4)",marginTop:4}}>{Math.round(mins/60)}h</div>
                  <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{count} sess.</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsPage({settings,addToast,refreshSettings,t}){
  const[saving,setSaving]=useState(false);
  const[toggles,setToggles]=useState({autoClockInEnabled:settings.autoClockInEnabled??true,autoBreakOnExitEnabled:settings.autoBreakOnExitEnabled??true,autoCorrectionEnabled:settings.autoCorrectionEnabled??true});
  useEffect(()=>{setToggles({autoClockInEnabled:settings.autoClockInEnabled??true,autoBreakOnExitEnabled:settings.autoBreakOnExitEnabled??true,autoCorrectionEnabled:settings.autoCorrectionEnabled??true});},[settings]);
  const companyRef=useRef(null),startRef=useRef(null),endRef=useRef(null);
  const handleSave=async()=>{
    setSaving(true);
    const res=await authFetch("/api/settings",{method:"PUT",body:JSON.stringify({companyName:companyRef.current?.value,siteName:settings.siteName,latitude:settings.latitude,longitude:settings.longitude,radiusFeet:settings.radiusFeet,workingHoursStart:startRef.current?.value,workingHoursEnd:endRef.current?.value,autoClockInEnabled:toggles.autoClockInEnabled,autoBreakOnExitEnabled:toggles.autoBreakOnExitEnabled,autoCorrectionEnabled:toggles.autoCorrectionEnabled})});
    const d=await res.json();if(!res.ok){addToast(d.error||"Failed.","error");setSaving(false);return;}
    localStorage.removeItem("bsc_settings");await refreshSettings();addToast("Settings saved.","success");setSaving(false);
  };
  const Toggle=({label,value,onChange,desc})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
      <div style={{flex:1,paddingRight:16}}>
        <div style={{fontSize:14,color:"var(--text)",fontWeight:500}}>{label}</div>
        {desc&&<div style={{fontSize:12.5,color:"var(--text3)",marginTop:3,lineHeight:1.5,fontWeight:400}}>{desc}</div>}
      </div>
      <button onClick={()=>onChange(!value)} style={{width:48,height:28,borderRadius:14,border:"none",cursor:"pointer",background:value?"var(--blue)":"var(--border2)",position:"relative",transition:"background 0.2s",flexShrink:0,minWidth:48,boxShadow:value?"0 1px 4px rgba(37,99,235,0.3)":"none"}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:3,transition:"left 0.2s",left:value?23:3,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/>
      </button>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.settings} subtitle="Company information and automation rules"/>
      <div style={{padding:"12px 16px",borderRadius:"var(--radius-lg)",background:"var(--blue-light)",border:"1.5px solid var(--blue-mid)",display:"flex",gap:10,alignItems:"flex-start"}}>
        <Icon name="pin" size={15} color="var(--blue)" style={{marginTop:1,flexShrink:0}}/>
        <div style={{fontSize:13,color:"var(--blue)",lineHeight:1.5,fontWeight:450}}>Worksite locations are managed in the <strong>Worksites</strong> section. Each employee can be assigned their own worksite with individual geofence settings.</div>
      </div>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:30,height:30,borderRadius:"var(--radius-sm)",background:"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--blue-mid)"}}><Icon name="building" size={15} color="var(--blue)"/></div><h3 style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Company</h3></div>
        <label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Company Name</label>
        <input type="text" ref={companyRef} defaultValue={settings.companyName||""} placeholder="Company name" style={{fontSize:16}} autoCorrect="off"/>
      </Card>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:30,height:30,borderRadius:"var(--radius-sm)",background:"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--blue-mid)"}}><Icon name="clock" size={15} color="var(--blue)"/></div><h3 style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Default Work Schedule</h3></div>
        <p style={{fontSize:13,color:"var(--text3)",marginBottom:14,fontWeight:400}}>Default for all employees. Override individually in the Employees section.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Start Time</label><input type="time" ref={startRef} defaultValue={settings.workStart||"07:00"} style={{fontSize:16}}/></div>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>End Time</label><input type="time" ref={endRef} defaultValue={settings.workEnd||"17:00"} style={{fontSize:16}}/></div>
        </div>
      </Card>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><div style={{width:30,height:30,borderRadius:"var(--radius-sm)",background:"var(--green-light)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(5,150,105,0.2)"}}><Icon name="refresh" size={15} color="var(--green)"/></div><h3 style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Automation Rules</h3></div>
        <Toggle label="Auto Clock-In" value={toggles.autoClockInEnabled} onChange={v=>setToggles(t=>({...t,autoClockInEnabled:v}))} desc="Automatically clock in employees when they enter their assigned worksite geofence"/>
        <Toggle label="Auto Break on Exit" value={toggles.autoBreakOnExitEnabled} onChange={v=>setToggles(t=>({...t,autoBreakOnExitEnabled:v}))} desc="Start break automatically when an employee leaves the worksite geofence"/>
        <Toggle label="Auto Punch Correction" value={toggles.autoCorrectionEnabled} onChange={v=>setToggles(t=>({...t,autoCorrectionEnabled:v}))} desc="Fix missing punches automatically based on schedule and location"/>
      </Card>
      <Btn onClick={handleSave} loading={saving} size="lg" style={{width:"100%"}}><Icon name="check" size={15} color="white"/>{t.save} Settings</Btn>
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function ExportPage({adminData,addToast,t}){
  const[empFilter,setEmpFilter]=useState("all");
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[loading,setLoading]=useState(false);
  const handleExport=async()=>{
    setLoading(true);
    const p=new URLSearchParams();if(empFilter!=="all")p.set("user_id",empFilter);if(dateFrom)p.set("date_from",dateFrom);if(dateTo)p.set("date_to",dateTo);
    const token=localStorage.getItem("accessToken");
    const res=await fetch(`${API}/api/export/csv?${p}`,{credentials:"include",headers:{Authorization:`Bearer ${token}`}});
    if(!res.ok){addToast("Export failed.","error");setLoading(false);return;}
    const blob=await res.blob();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`bsc_attendance_${new Date().toISOString().slice(0,10)}.csv`;a.click();
    addToast("CSV downloaded.","success");setLoading(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.export} subtitle="Download attendance data as CSV"/>
      <Card>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Employee</label>
            <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{fontSize:16}}>
              <option value="all">All Employees</option>
              {adminData.employees.map(u=><option key={u.id} value={u.id}>{u.name}{u.user_id?` (${u.user_id})`:""}</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>From Date</label><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{fontSize:16}}/></div>
            <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>To Date</label><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{fontSize:16}}/></div>
          </div>
        </div>
        <Btn onClick={handleExport} loading={loading} style={{width:"100%"}} size="lg"><Icon name="download" size={15} color="white"/>Export to CSV</Btn>
      </Card>
    </div>
  );
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
function AuditPage({t}){
  const[logs,setLogs]=useState([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{authFetch("/api/audit-logs").then(r=>r.json()).then(d=>{setLogs(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  const dotColor={clock_in:"var(--green)",clock_out:"var(--red)",break_start:"var(--amber)",break_end:"var(--amber)",update_settings:"var(--blue)",auto_clock_in:"var(--purple)"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.auditLogs} subtitle="Complete trail of all system events"/>
      <Card>
        {loading?<div style={{textAlign:"center",padding:28,color:"var(--text3)"}}>Loading...</div>
        :logs.length===0?<div style={{textAlign:"center",padding:28,color:"var(--text4)"}}>No audit logs yet.</div>
        :<div style={{display:"flex",flexDirection:"column"}}>
          {logs.map((log,i)=>(
            <div key={log.id} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:i<logs.length-1?"1px solid var(--border)":"none",alignItems:"flex-start"}}>
              <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:5,background:dotColor[log.action_type]||"var(--text4)"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,color:"var(--text)",fontWeight:500}}>{(log.action_type||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>Entity: {log.entity_type} · IP: {log.ip_address}</div>
              </div>
              <div style={{fontSize:12,color:"var(--text3)",flexShrink:0,textAlign:"right"}}>
                <div>{fmtDate(log.created_at)}</div><div>{fmtTime(log.created_at)}</div>
              </div>
            </div>
          ))}
        </div>}
      </Card>
    </div>
  );
}