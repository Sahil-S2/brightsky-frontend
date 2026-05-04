"use client";

export const dynamic = "force-dynamic";
// NOTE: "runtime = edge" removed – it strips browser APIs (localStorage,
// navigator.geolocation, navigator.vibrate) that this page relies on.
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
    dashboard:"Dashboard",employees:"Employees",worksites:"Job Sites",attendance:"Attendance",
    reports:"Reports",settings:"Settings",export:"Export",auditLogs:"Audit Logs",
    myAttendance:"My Attendance",myProfile:"My Profile",signOut:"Sign Out",
    today:"Today",status:"Status",breaks:"Breaks",punches:"Punches",
    active:"Active",onBreak:"On Break",inactive:"Inactive",overtime:"Overtime",
    clockedIn:"Clocked In",clockedOut:"Clocked Out",autoClockIn:"Auto Clock-In",
    noActivity:"No activity yet today.",morning:"Good Morning",afternoon:"Good Afternoon",evening:"Good Evening",
    welcomeBack:"Welcome back",missedClockOutMsg:"You have an active session from yesterday. Please clock out.",
    assignedWorksite:"Assigned Job Site",mySchedule:"My Schedule",workHours:"Work Hours",
    workingDays:"Working Days",grace:"Grace Period",language:"Language",
    updateLocation:"Update My Location",locationUpdated:"Location updated.",
    adminLogin:"Admin login with email",useUserId:"Use Employee ID instead",
    tapToChange:"Change Photo",refresh:"Refresh",save:"Save",cancel:"Cancel",
    add:"Add",edit:"Edit",assign:"Assign",remove:"Remove",close:"Close",tasks: "Tasks",taskHistory: "Task History",
    route: "Route",routeHistory: "Route History",stops: "Stops",stopNumber: "Stop #",startEndTime: "Start → End",travelTime: "Travel",
    distance: "Distance",avgMPH: "Avg MPH",breaks: "Breaks",timeAtStore: "Time @ Store",remarks: "Remarks",addStop: "Add Stop",endStop: "End Stop",
    addDetails: "Add Details",storeName: "Store Name",orderAmount: "Order Amount",deliveryAmount: "Delivery Amount",productPriceRemark: "Product & Price Remark",
    storeRemark: "Store Remark",routeRemark: "Route Remark",nextSchedule: "Next Schedule",startBreak: "Start Break",endBreak: "End Break",
    breakType: "Break Type",lunch: "Lunch",toilet: "Toilet",short: "Short Break",
    startRoute: "Start Route",continueRoute: "Continue Route",viewRoute: "View Route",
    storeName: "Store Name",orderAmount: "Order Amount",deliveryAmount: "Delivery Amount",productPriceRemark: "Product & Price Remark",
    storeRemark: "Store Remark",nextSchedule: "Next Schedule",addDetails: "Add Details",
  },
  es: {
    signIn:"Iniciar Sesión",userId:"ID de Usuario",password:"Contraseña",clockIn:"Registrar Entrada",
    clockOut:"Registrar Salida",startBreak:"Iniciar Descanso",endBreak:"Terminar Descanso",
    onSite:"En Sitio",offSite:"Fuera del Sitio",locating:"Localizando…",
    dashboard:"Panel",employees:"Empleados",worksites:"Sitios de Trabajo",attendance:"Asistencia",
    reports:"Reportes",settings:"Configuración",export:"Exportar",auditLogs:"Auditoría",
    myAttendance:"Mi Asistencia",myProfile:"Mi Perfil",signOut:"Cerrar Sesión",
    today:"Hoy",status:"Estado",breaks:"Descansos",punches:"Registros",
    active:"Activo",onBreak:"En Descanso",inactive:"Inactivo",overtime:"Horas Extra",
    clockedIn:"Entrada Registrada",clockedOut:"Salida Registrada",autoClockIn:"Entrada Automática",
    noActivity:"Sin actividad hoy.",morning:"Buenos Días",afternoon:"Buenas Tardes",evening:"Buenas Noches",
    welcomeBack:"Bienvenido",missedClockOutMsg:"Tienes una sesión activa de ayer. Registra tu salida.",
    assignedWorksite:"Sitio de Trabajo Asignado",mySchedule:"Mi Horario",workHours:"Horario",
    workingDays:"Días de Trabajo",grace:"Período de Gracia",language:"Idioma",
    updateLocation:"Actualizar Ubicación",locationUpdated:"Ubicación actualizada.",
    adminLogin:"Acceso con correo",useUserId:"Usar ID de empleado",
    tapToChange:"Cambiar Foto",refresh:"Actualizar",save:"Guardar",cancel:"Cancelar",
    add:"Agregar",edit:"Editar",assign:"Asignar",remove:"Quitar",close:"Cerrar",tasks: "Tareas",taskHistory: "Historial de tareas",
    route: "Ruta",routeHistory: "Historial de Ruta",stops: "Paradas",stopNumber: "Parada #",startEndTime: "Inicio → Fin",travelTime: "Tiempo de viaje",
    distance: "Distancia",avgMPH: "Velocidad Promedio (MPH)",breaks: "Descansos",timeAtStore: "Tiempo en Tienda",remarks: "Observaciones",
    addStop: "Agregar Parada",endStop: "Finalizar Parada",addDetails: "Agregar Detalles",storeName: "Nombre de la Tienda",
    orderAmount: "Monto del Pedido",deliveryAmount: "Monto de Entrega",productPriceRemark: "Observación de Producto y Precio",storeRemark: "Observación de la Tienda",
    routeRemark: "Observación de la Ruta",nextSchedule: "Próximo Horario",startBreak: "Iniciar Descanso",endBreak: "Finalizar Descanso",
    breakType: "Tipo de Descanso",lunch: "Almuerzo",toilet: "Baño",short: "Descanso Corto",
    startRoute: "Iniciar Ruta",continueRoute: "Continuar Ruta",viewRoute: "Ver Ruta",
    storeName: "Nombre de la Tienda",orderAmount: "Monto del Pedido",deliveryAmount: "Monto de Entrega",productPriceRemark: "Observación de Producto y Precio",
    storeRemark: "Observación de la Tienda",nextSchedule: "Próximo Horario",addDetails: "Agregar Detalles",
  },
};

const authFetch = async (path, opts = {}) => {
  let token = localStorage.getItem("accessToken");
  let res = await fetch(`${API}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
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

// Safe JSON parser — returns null instead of crashing when server sends HTML/empty
const safeJson = async (res) => {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch {
    // Server returned HTML (404 page, crash page, etc.) — extract useful info
    const title = text.match(/<title>(.*?)<\/title>/i)?.[1] || "";
    console.error("[API non-JSON response]", res.status, res.url, text.slice(0, 300));
    return { error: `Server error ${res.status}${title ? `: ${title}` : ""}. Check backend logs.` };
  }
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

    /* ── Splash & Login premium animations ───────────────────── */
    @keyframes splashLogoIn{0%{opacity:0;transform:scale(0.55) rotateY(-25deg) rotateX(10deg);filter:blur(8px);}60%{opacity:1;transform:scale(1.06) rotateY(4deg) rotateX(-2deg);filter:blur(0);}80%{transform:scale(0.97) rotateY(-1deg);}100%{opacity:1;transform:scale(1) rotateY(0deg) rotateX(0deg);filter:blur(0);}}
    @keyframes splashTextIn{0%{opacity:0;transform:translateY(22px) scale(0.96);}100%{opacity:1;transform:translateY(0) scale(1);}}
    @keyframes splashSubIn{0%{opacity:0;transform:translateY(14px);}100%{opacity:1;transform:translateY(0);}}
    @keyframes splashRingPulse{0%{transform:scale(0.7);opacity:0.7;}100%{transform:scale(2.4);opacity:0;}}
    @keyframes splashRingPulse2{0%{transform:scale(0.8);opacity:0.5;}100%{transform:scale(2.0);opacity:0;}}
    @keyframes splashFadeOut{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(1.03);}}
    @keyframes loginCardIn{0%{opacity:0;transform:translateY(28px) scale(0.97);}100%{opacity:1;transform:translateY(0) scale(1);}}
    @keyframes loginBgShift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
    @keyframes loginLogoFloat{0%,100%{transform:translateY(0px) rotate(-1deg);}50%{transform:translateY(-5px) rotate(1deg);}}
    @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(200%);}}
    @keyframes orb1{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-30px) scale(1.1);}66%{transform:translate(-20px,25px) scale(0.92);}}
    @keyframes orb2{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-35px,25px) scale(0.88);}66%{transform:translate(30px,-20px) scale(1.08);}}
    @keyframes loginFadeUp{0%{opacity:0;transform:translateY(18px);}100%{opacity:1;transform:translateY(0);}}
    @keyframes inputGlow{0%{box-shadow:0 0 0 0 rgba(251,191,36,0);}50%{box-shadow:0 0 0 4px rgba(251,191,36,0.2);}100%{box-shadow:0 0 0 0 rgba(251,191,36,0);}}

    .splash-logo-anim{animation:splashLogoIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s both;perspective:1000px;transform-style:preserve-3d;}
    .splash-text-anim{animation:splashTextIn 0.65s cubic-bezier(0.16,1,0.3,1) 0.7s both;}
    .splash-sub-anim{animation:splashSubIn 0.55s cubic-bezier(0.16,1,0.3,1) 1.05s both;}
    .splash-exit{animation:splashFadeOut 0.45s cubic-bezier(0.4,0,1,1) both;}
    .login-card-anim{animation:loginCardIn 0.55s cubic-bezier(0.16,1,0.3,1) 0.08s both;}
    .login-field-1{animation:loginFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.18s both;}
    .login-field-2{animation:loginFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.28s both;}
    .login-field-btn{animation:loginFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.38s both;}
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

// ── Warning Clock-In badge — shown wherever is_outside_geofence=true ────────
const WarnBadge = () => (
  <span title="Clocked in outside assigned job site" style={{
    display:"inline-flex",alignItems:"center",gap:3,
    background:"var(--amber-light)",color:"var(--amber)",
    border:"1px solid rgba(217,119,6,0.3)",borderRadius:5,
    fontSize:10.5,fontWeight:700,padding:"2px 6px",whiteSpace:"nowrap",
    letterSpacing:"0.02em",verticalAlign:"middle"
  }}>⚠ Off-Site</span>
);

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

const LocationIndicator=({onSite,distance,loading,siteSelected})=>{
  if(loading)return(<div style={{display:"flex",alignItems:"center",gap:6,background:"var(--bg3)",border:"1.5px solid var(--border)",borderRadius:"var(--radius)",padding:"6px 12px",fontSize:12,color:"var(--text3)",whiteSpace:"nowrap"}}>
    <span className="spin" style={{width:10,height:10,border:"2px solid var(--text4)",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",flexShrink:0}}/><span style={{fontWeight:500}}>Locating…</span>
  </div>);
  if(!siteSelected)return(<div style={{display:"flex",alignItems:"center",gap:6,background:"var(--bg3)",border:"1.5px solid var(--border)",borderRadius:"var(--radius)",padding:"6px 12px",fontSize:12,color:"var(--text3)",whiteSpace:"nowrap"}}>
    <span style={{width:7,height:7,borderRadius:"50%",background:"var(--text4)",flexShrink:0}}/><span style={{fontWeight:600}}>Site Not Selected</span>
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
    fuel: <><path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4h2a2 2 0 0 1 2 2v6.5a1.5 1.5 0 0 0 3 0V11l-2-2"/><rect x="3" y="10" width="12" height="6" rx="1"/><line x1="9" y1="4" x2="9" y2="10"/></>,
    droplet: <><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></>,
    gauge: <><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="2"/><path d="M22 12h-4"/><path d="M12 6V2"/></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
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
  const[showSplash,setShowSplash]=useState(true);
  const[lang,setLang]=useState("en");
  useEffect(()=>{
    try{const s=localStorage.getItem("bsc_session");if(s)setCurrentUser(JSON.parse(s));}catch{}
    try{const l=localStorage.getItem("bsc_lang");if(l)setLang(l);}catch{}
    localStorage.removeItem("bsc_settings");setMounted(true);
  },[]);
  const t=T[lang]||T.en;
  const[page,setPage]=useState("dashboard");
  const[appTitle,setAppTitle]=useState("BSC Tracker");
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const[toasts,setToasts]=useState([]);
  const[settings,setSettings]=useState(DEFAULT_SETTINGS);
  const[todayData,setTodayData]=useState(null);
  const[adminData,setAdminData]=useState({employees:[],attendance:[],allAttendance:[]});
  const[worksites,setWorksites]=useState([]);
  const[employeeWorksite,setEmployeeWorksite]=useState(null); // legacy single-site (used for geofence in Time Tracker)
  const[employeeJobSites,setEmployeeJobSites]=useState([]); // all assigned job sites (array) — unified
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
  // Explicit site selection from employee's FuelJobSiteSelector (drives top-right badge)
  const[appSelectedSiteId,setAppSelectedSiteId]=useState(null);
  const appSelectedSite=worksites.find(s=>s.id===appSelectedSiteId)||employeeJobSites.find(s=>s.id===appSelectedSiteId)||null;
  const geoTarget=appSelectedSite||(settings.latitude!=null?{latitude:settings.latitude,longitude:settings.longitude,radius_feet:settings.radiusFeet}:null);
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

  const refreshSettings = useCallback(async () => {
  try {
    const res = await authFetch("/api/settings");
    if (res.ok) {
      const d = await res.json();
      if (d) {
        setSettings({
          companyName: d.company_name,
          siteName: d.site_name,
          latitude: parseFloat(d.latitude),
          longitude: parseFloat(d.longitude),
          radiusFeet: parseFloat(d.radius_feet),
          workStart: d.working_hours_start?.slice(0, 5) || "07:00",
          workEnd: d.working_hours_end?.slice(0, 5) || "17:00",
          clockInWithCameraEnabled: d.clockInWithCameraEnabled ?? true, // 👈 add this
        });
      }
    }
  } catch {}
}, []);
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
      const[eR,aR,allR]=await Promise.all([authFetch("/api/admin/employees"),authFetch(`/api/admin/attendance?date_from=${today}&date_to=${today}`),authFetch("/api/admin/attendance")]);
      const[eD,aD,allD]=await Promise.all([eR.ok?eR.json():null,aR.ok?aR.json():null,allR.ok?allR.json():null]);
      setAdminData({employees:eD?.employees||[],attendance:aD?.sessions||[],allAttendance:allD?.sessions||[]});
    }catch{}
  },[currentUser]);
  const refreshWorksites=useCallback(async()=>{if(!currentUser)return;try{const r=await authFetch("/api/worksites");if(r.ok){const d=await r.json();setWorksites(Array.isArray(d)?d:[]);}}catch{}},[currentUser]);
  // Fetch ALL assigned job sites for the employee (multi-assignment support)
  const refreshEmployeeWorksite=useCallback(async()=>{
    if(!currentUser||currentUser.role==="admin"||currentUser.role==="manager")return;
    try{
      // Try multi-assignment endpoint first; fall back to legacy single-assignment
      const r=await authFetch("/api/worksites/my-assignments");
      if(r.ok){
        const d=await r.json();
        const sites=Array.isArray(d)?d:(d?[d]:[]);
        setEmployeeJobSites(sites);
        setEmployeeWorksite(sites[0]||null); // keep legacy for geofence check
      } else {
        // Fallback: try old endpoint
        const r2=await authFetch("/api/worksites/my-assignment");
        if(r2.ok){const d2=await r2.json();if(d2){setEmployeeWorksite(d2);setEmployeeJobSites([d2]);}}
      }
    }catch{}
  },[currentUser]);
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
      body: JSON.stringify({
        latitude:  userLat  !== null ? userLat  : (geoTarget?.latitude  ?? 0),
        longitude: userLon  !== null ? userLon  : (geoTarget?.longitude ?? 0),
      })
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
  const getLocationPayload = useCallback(() => {
    const lat = userLat !== null ? userLat : (employeeWorksite?.latitude ?? settings.latitude ?? 0);
    const lon = userLon !== null ? userLon : (employeeWorksite?.longitude ?? settings.longitude ?? 0);
    return { latitude: lat, longitude: lon };
  }, [userLat, userLon, employeeWorksite, settings]);

  const processClockIn = async (photoData) => {
    setPunchLoading(true);
    try {
      const { latitude, longitude } = getLocationPayload();
      const res = await authFetch("/api/attendance/clock-in", {
        method: "POST",
        body: JSON.stringify({ latitude, longitude, photo: photoData }),
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
    }
  };

  const handleClockInWithPhoto = () => {
    if (!onSite) {
      addToast("You must be at your assigned job site to clock in.", "error");
      return;
    }
    setShowCamera(true);
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
    setPage("dashboard");setTodayData(null);setAdminData({employees:[],attendance:[],allAttendance:[]});addToast("Signed out.","info");
  };

  const isAdmin=currentUser?.role==="admin"||currentUser?.role==="manager";
  const navItems=currentUser?[
    {id:"dashboard",label:isAdmin?t.dashboard:`My ${t.dashboard}`,icon:"home"},
    {id:"fuel",label:"Fuel Entry",icon:"fuel"},
    ...(isAdmin?[{id:"employees",label:t.employees,icon:"users"},{id:"worksites",label:t.worksites,icon:"map"},{ id: "tasks", label: t.tasks, icon: "briefcase" },{id:"attendance",label:t.attendance,icon:"calendar"},{id:"reports",label:t.reports,icon:"bar"},{ id: "project_outings", label: t.projectOutings || "Project Outings", icon: "briefcase" },{id:"settings",label:t.settings,icon:"settings"},{id:"export",label:t.export,icon:"download"},{id:"audit",label:t.auditLogs,icon:"log"}]:[{id:"my_attendance",label:t.myAttendance,icon:"calendar"},{id:"my_profile",label:t.myProfile,icon:"user"}]),
  ]:[];

  if(!mounted)return null;
  if(!currentUser)return(
    <>
      <GlobalStyle/>
      {showSplash
        ? <SplashScreen onDone={()=>setShowSplash(false)}/>
        : <LoginPage onLogin={handleLogin} lang={lang} setLang={setLang}/>
      }
      <Toast toasts={toasts} removeToast={removeToast}/>
    </>
  );

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
    <div style={{width:28,height:28,borderRadius:"var(--radius-sm)",background:appTitle==="BSC Fuel Entry"?"#1e3a5f":"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.25s"}}>
      <Icon name={appTitle==="BSC Fuel Entry"?"fuel":"hard_hat"} size={14} color="white"/>
    </div>
    <div>
      <span style={{fontWeight:700,fontSize:13.5,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160,letterSpacing:"-0.01em",transition:"all 0.2s"}}>{appTitle}</span>
      <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{now.toLocaleDateString()} · {now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
    </div>
  </div>

</header>
          <main style={{flex:1,padding:"20px 16px",maxWidth:900,width:"100%",margin:"0 auto"}}>
            {/* AdminLocationBar removed */}
            {page==="dashboard"&&(isAdmin?<AdminDashboard adminData={adminData} refreshAdminData={refreshAdminData} isOvertime={isOvertime} t={t} addToast={addToast} currentUser={currentUser} worksites={worksites}/>:<EmployeeDashboard user={currentUser} todayData={todayData} empStatus={empStatus} onSite={onSite} settings={settings} punchLoading={punchLoading} gpsLoading={gpsLoading} userLat={userLat} userLon={userLon} isOvertime={isOvertime} overtimeMins={overtimeMins} employeeWorksite={employeeWorksite} employeeJobSites={employeeJobSites} handleClockOut={handleClockOut} handleBreakStart={handleBreakStart} handleBreakEnd={handleBreakEnd} t={t} addToast={addToast} refreshTodayData={refreshTodayData} setAppTitle={setAppTitle} worksites={worksites} onJobSiteSelect={setAppSelectedSiteId}/>)}
            {page==="fuel"&&<FuelEntryPage currentUser={currentUser} t={t} addToast={addToast} assignedJobSites={employeeJobSites} allJobSites={worksites} onMount={()=>setAppTitle("BSC Fuel Entry")} onUnmount={()=>setAppTitle("BSC Tracker")}/>}
            {page==="my_attendance"&&<MyAttendance t={t}/>}
            {page==="my_profile"&&<MyProfile user={currentUser} addToast={addToast} employeeWorksite={employeeWorksite} employeeJobSites={employeeJobSites} t={t} onViewTaskHistory={() => setPage("task_history")}/>}
            {/* task_history and route pages removed — tasks now live in the Tasks workflow tab */}
            {page==="employees"&&isAdmin&&<EmployeeList adminData={adminData} refreshAdminData={refreshAdminData} addToast={addToast} worksites={worksites} t={t}/>}
            {page==="worksites"&&isAdmin&&<WorksitesPage worksites={worksites} refreshWorksites={refreshWorksites} adminData={adminData} addToast={addToast} t={t}/>}
            {page === "tasks" && isAdmin && <TasksPage adminData={adminData} addToast={addToast} t={t} />}
            {page==="attendance"&&isAdmin&&<AttendancePage adminData={adminData} t={t}/>}
            {page==="reports"&&isAdmin&&<ReportsPage t={t}/>}
            {page === "project_outings" && isAdmin && <AdminOutingsPage adminData={adminData} t={t} />}
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


// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2400);
    const doneTimer = setTimeout(() => onDone(), 2850);
    return () => { clearTimeout(exitTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div
      className={exiting ? "splash-exit" : ""}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "linear-gradient(145deg, #080d1a 0%, #0d1424 40%, #111827 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "18%", left: "12%", width: 380, height: 380,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)",
          animation: "orb1 8s ease-in-out infinite",
        }}/>
        <div style={{
          position: "absolute", bottom: "15%", right: "10%", width: 320, height: 320,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)",
          animation: "orb2 10s ease-in-out infinite",
        }}/>
        {/* Grid lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }} preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* Pulse rings behind logo */}
      <div style={{ position: "relative", marginBottom: 36 }}>
        <div style={{
          position: "absolute", inset: -24, borderRadius: "50%",
          border: "1.5px solid rgba(245,158,11,0.3)",
          animation: "splashRingPulse 2.2s cubic-bezier(0.4,0,0.6,1) 1.0s infinite",
        }}/>
        <div style={{
          position: "absolute", inset: -12, borderRadius: "50%",
          border: "1px solid rgba(245,158,11,0.2)",
          animation: "splashRingPulse2 2.2s cubic-bezier(0.4,0,0.6,1) 1.4s infinite",
        }}/>

        {/* Logo block */}
        <div className="splash-logo-anim" style={{ perspective: 1000 }}>
          <div style={{
            width: 110, height: 110, borderRadius: 32,
            background: "linear-gradient(145deg, #f59e0b 0%, #f8a000 50%, #e07b00 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 24px 64px rgba(245,158,11,0.45), 0 8px 24px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
            position: "relative", overflow: "hidden",
            animation: "loginLogoFloat 4s ease-in-out 1.2s infinite",
          }}>
            {/* Inner gloss */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "55%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
              borderRadius: "32px 32px 0 0",
            }}/>
            {/* Shimmer sweep */}
            <div style={{
              position: "absolute", top: 0, bottom: 0, width: "40%",
              background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              animation: "shimmer 3s ease-in-out 1.5s infinite",
            }}/>
            <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "relative", zIndex: 1 }}>
              <path d="M29 8 L49 22 L49 46 L9 46 L9 22 Z" fill="rgba(0,0,0,0.85)" stroke="rgba(0,0,0,0.9)" strokeWidth="1"/>
              <path d="M19 46 L19 30 Q19 24 25 24 L33 24 Q39 24 39 30 L39 46" fill="rgba(0,0,0,0.7)"/>
              <path d="M9 23 L29 9 L49 23" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="29" cy="16" r="3.5" fill="rgba(255,255,255,0.35)"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Company name */}
      <div className="splash-text-anim" style={{ textAlign: "center" }}>
        <h1 style={{
          fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em",
          color: "#ffffff", lineHeight: 1.1, marginBottom: 8,
          textShadow: "0 2px 20px rgba(245,158,11,0.15)",
        }}>
          Bright Sky
          <span style={{ display: "block", color: "#f59e0b" }}>Construction</span>
        </h1>
      </div>

      <div className="splash-sub-anim" style={{ marginTop: 4 }}>
        <p style={{
          fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.38)",
        }}>
          Employee Management System
        </p>
      </div>

      {/* Loading bar */}
      <div style={{
        position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)",
        width: 140, height: 2, borderRadius: 2,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
          animation: "shimmer 1.8s ease-in-out 0.4s 1 forwards",
          width: "100%",
        }}/>
      </div>
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
  const[focusedField,setFocusedField]=useState(null);
  const t=T[lang]||T.en;
  const validate=()=>{
    if(!useEmail){if(!/^[A-Za-z0-9]{4}$/.test(userId)){setError("User ID must be exactly 4 characters.");return false;}if(!/^\d{4}$/.test(password)){setError("Password must be exactly 4 digits.");return false;}}
    setError("");return true;
  };
  const handle=async(e)=>{e.preventDefault();if(!validate())return;setLoading(true);await onLogin(userId,password,useEmail);setLoading(false);};

  const inputStyle = (focused) => ({
    fontSize: 16, width: "100%",
    padding: "13px 16px",
    background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
    border: `1.5px solid ${focused ? "rgba(245,158,11,0.7)" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 12, color: "#ffffff",
    outline: "none",
    transition: "all 0.2s",
    boxShadow: focused ? "0 0 0 4px rgba(245,158,11,0.12)" : "none",
    caretColor: "#f59e0b",
  });

  const pinInputStyle = (focused) => ({
    ...inputStyle(focused),
    fontSize: 28, letterSpacing: "0.45em", textAlign: "center",
    fontWeight: 700, paddingLeft: 14,
  });

  return(
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      background: "linear-gradient(145deg, #080d1a 0%, #0e1526 45%, #111827 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{
          position:"absolute", top:"-10%", right:"-5%", width:500, height:500,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)",
          animation:"orb1 12s ease-in-out infinite",
        }}/>
        <div style={{
          position:"absolute", bottom:"-8%", left:"-5%", width:450, height:450,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 65%)",
          animation:"orb2 14s ease-in-out infinite",
        }}/>
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.025 }} preserveAspectRatio="none">
          <defs>
            <pattern id="lgrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lgrid)"/>
        </svg>
      </div>

      {/* Top bar — language toggle */}
      <div style={{
        position:"relative", zIndex:10,
        padding:"16px 20px", display:"flex", justifyContent:"flex-end", gap:6,
      }}>
        {[["en","EN"],["es","ES"]].map(([code,label])=>(
          <button key={code} onClick={()=>{setLang(code);localStorage.setItem("bsc_lang",code);}} style={{
            padding:"5px 16px", borderRadius:999,
            border:`1.5px solid ${lang===code?"#f59e0b":"rgba(255,255,255,0.15)"}`,
            background:lang===code?"#f59e0b":"rgba(255,255,255,0.06)",
            color:lang===code?"#000":"rgba(255,255,255,0.6)",
            fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:700,
            transition:"all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px 16px 40px", position:"relative", zIndex:5 }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          {/* Brand header */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{
              width:80, height:80, borderRadius:24, margin:"0 auto 20px",
              background:"linear-gradient(145deg, #f59e0b 0%, #f8a000 50%, #e07b00 100%)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 16px 48px rgba(245,158,11,0.4), 0 6px 16px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
              position:"relative", overflow:"hidden",
              animation:"loginLogoFloat 4s ease-in-out infinite",
            }}>
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:"50%",
                background:"linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
                borderRadius:"24px 24px 0 0",
              }}/>
              <Icon name="hard_hat" size={38} color="rgba(0,0,0,0.85)"/>
            </div>
            <h1 style={{
              fontSize:26, fontWeight:800, color:"#ffffff",
              letterSpacing:"-0.025em", lineHeight:1.15, marginBottom:6,
            }}>
              Bright Sky Construction
            </h1>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, fontWeight:400, letterSpacing:"0.04em" }}>
              Employee Management System
            </p>
          </div>

          {/* Login card */}
          <div className="login-card-anim" style={{
            background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:20,
            padding:"28px 28px 24px",
            backdropFilter:"blur(24px)",
            WebkitBackdropFilter:"blur(24px)",
            boxShadow:"0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            {/* Card header */}
            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontSize:17, fontWeight:700, color:"#fff", letterSpacing:"-0.015em", marginBottom:4 }}>
                {useEmail ? "Admin Sign In" : "Employee Sign In"}
              </h2>
              <p style={{ color:"rgba(255,255,255,0.38)", fontSize:13 }}>
                {useEmail ? "Enter your email and password" : `Enter your 4-character ${t.userId}`}
              </p>
            </div>

            <form onSubmit={handle} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* User ID / Email */}
              <div className="login-field-1">
                <label style={{ fontSize:11.5, color:"rgba(255,255,255,0.5)", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                  {useEmail ? "Email Address" : t.userId}
                </label>
                {useEmail ? (
                  <input
                    type="email" value={userId}
                    onChange={e=>{setUserId(e.target.value);setError("");}}
                    onFocus={()=>setFocusedField("id")} onBlur={()=>setFocusedField(null)}
                    placeholder="your@email.com" autoComplete="off"
                    style={inputStyle(focusedField==="id")} required
                  />
                ) : (
                  <>
                    <input
                      type="text" value={userId}
                      onChange={e=>{const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);setUserId(v);setError("");}}
                      onFocus={()=>setFocusedField("id")} onBlur={()=>setFocusedField(null)}
                      placeholder="· · · ·" maxLength={4} autoComplete="off" inputMode="text"
                      style={pinInputStyle(focusedField==="id")} required
                    />
                    <div style={{ display:"flex", justifyContent:"center", gap:10, marginTop:10 }}>
                      {[0,1,2,3].map(i=>(
                        <div key={i} style={{
                          width:10, height:10, borderRadius:"50%",
                          background: userId.length>i ? "#f59e0b" : "transparent",
                          border: userId.length>i ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                          boxShadow: userId.length>i ? "0 0 8px rgba(245,158,11,0.6)" : "none",
                          transition:"all 0.2s",
                        }}/>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Password */}
              <div className="login-field-2">
                <label style={{ fontSize:11.5, color:"rgba(255,255,255,0.5)", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                  {t.password}
                </label>
                <div style={{ position:"relative" }}>
                  <input
                    type={showPass?"text":"password"} value={password}
                    onChange={e=>{const v=useEmail?e.target.value:e.target.value.replace(/\D/g,"").slice(0,4);setPassword(v);setError("");}}
                    onFocus={()=>setFocusedField("pw")} onBlur={()=>setFocusedField(null)}
                    placeholder={useEmail?"••••••••":"· · · ·"} autoComplete="off"
                    inputMode={useEmail?"text":"numeric"} maxLength={useEmail?undefined:4}
                    style={{
                      ...pinInputStyle(focusedField==="pw"),
                      fontSize:useEmail?16:28,
                      letterSpacing:useEmail?"normal":"0.45em",
                      textAlign:useEmail?"left":"center",
                      paddingRight:52,
                      paddingLeft:useEmail?16:52,
                      fontWeight:useEmail?400:700,
                    }} required
                  />
                  <button
                    type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{
                      position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                      background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
                      color:"rgba(255,255,255,0.5)", cursor:"pointer", padding:6,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      borderRadius:8, minWidth:34, minHeight:34,
                      transition:"all 0.15s",
                    }}
                  >
                    <Icon name={showPass?"eyeOff":"eye"} size={16} color="rgba(255,255,255,0.5)"/>
                  </button>
                </div>
                {!useEmail && (
                  <div style={{ display:"flex", justifyContent:"center", gap:10, marginTop:10 }}>
                    {[0,1,2,3].map(i=>(
                      <div key={i} style={{
                        width:10, height:10, borderRadius:"50%",
                        background: password.length>i ? "#f59e0b" : "transparent",
                        border: password.length>i ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                        boxShadow: password.length>i ? "0 0 8px rgba(245,158,11,0.6)" : "none",
                        transition:"all 0.2s",
                      }}/>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="shake" style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"10px 14px", borderRadius:10,
                  background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)",
                }}>
                  <Icon name="alert" size={14} color="#f87171"/>
                  <span style={{ fontSize:13, color:"#f87171", fontWeight:450 }}>{error}</span>
                </div>
              )}

              {/* Sign In button */}
              <div className="login-field-btn" style={{ marginTop:4 }}>
                <button
                  type="submit" disabled={loading}
                  style={{
                    width:"100%", padding:"14px 20px",
                    borderRadius:12, border:"none", cursor:loading?"not-allowed":"pointer",
                    background: loading
                      ? "rgba(245,158,11,0.4)"
                      : "linear-gradient(135deg, #f59e0b 0%, #f8a000 50%, #d97706 100%)",
                    color:"#000", fontSize:15, fontWeight:800,
                    letterSpacing:"0.01em",
                    boxShadow: loading ? "none" : "0 8px 24px rgba(245,158,11,0.4), 0 3px 8px rgba(245,158,11,0.2)",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    transition:"all 0.2s", opacity: loading ? 0.7 : 1,
                    transform: loading ? "scale(0.99)" : "scale(1)",
                    fontFamily:"'Inter',sans-serif",
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{ width:16, height:16, borderRadius:"50%", border:"2.5px solid rgba(0,0,0,0.3)", borderTopColor:"#000", animation:"spin 0.7s linear infinite" }}/>
                      Signing in…
                    </>
                  ) : (
                    <>
                      <Icon name="login" size={16} color="rgba(0,0,0,0.8)"/>
                      {t.signIn}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Toggle admin/employee */}
            <div style={{ marginTop:20, paddingTop:18, borderTop:"1px solid rgba(255,255,255,0.08)", textAlign:"center" }}>
              <button
                onClick={()=>{setUseEmail(e=>!e);setUserId("");setPassword("");setError("");}}
                style={{
                  background:"none", border:"none", color:"rgba(245,158,11,0.85)",
                  fontSize:13, cursor:"pointer", fontWeight:500,
                  fontFamily:"'Inter',sans-serif",
                  transition:"color 0.15s",
                }}
              >
                {useEmail ? t.useUserId : t.adminLogin}
              </button>
            </div>
          </div>

          {/* Helper text */}
          <div style={{
            marginTop:16, padding:"12px 16px", borderRadius:12,
            background:"rgba(37,99,235,0.12)", border:"1px solid rgba(37,99,235,0.2)",
            display:"flex", gap:10, alignItems:"flex-start",
          }}>
            <Icon name="alert" size={13} color="rgba(147,197,253,0.9)" style={{ marginTop:1, flexShrink:0 }}/>
            <div style={{ fontSize:12.5, color:"rgba(147,197,253,0.75)", lineHeight:1.55 }}>
              Use your <strong style={{ color:"rgba(147,197,253,1)" }}>4-character Employee ID</strong> and <strong style={{ color:"rgba(147,197,253,1)" }}>4-digit password</strong>. Contact your admin if you need help.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position:"relative", zIndex:5,
        padding:"14px", textAlign:"center",
        borderTop:"1px solid rgba(255,255,255,0.06)",
      }}>
        <p style={{ fontSize:11.5, color:"rgba(255,255,255,0.2)", letterSpacing:"0.05em" }}>
          Bright Sky Construction · Secure Login · v2.0
        </p>
      </div>
    </div>
  );
}

// ─── EMPLOYEE DASHBOARD ───────────────────────────────────────────────────────
// ─── FREE MAP STACK (Leaflet + OpenStreetMap + Nominatim) ────────────────────
// No API key, no billing. Tiles from openstreetmap.org, geocoding from
// nominatim.openstreetmap.org. Both require attribution (rendered below).

let _leafletPromise = null;
function loadLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.L) return Promise.resolve(window.L);
  if (_leafletPromise) return _leafletPromise;
  _leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet="1"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      css.crossOrigin = "";
      css.dataset.leaflet = "1";
      document.head.appendChild(css);
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    s.crossOrigin = "";
    s.async = true;
    s.onload = () => resolve(window.L);
    s.onerror = () => { _leafletPromise = null; reject(new Error("Failed to load Leaflet")); };
    document.head.appendChild(s);
  });
  return _leafletPromise;
}

// Nominatim has a 1 req/sec usage policy. We cache results forever (per
// page-load) and serialise calls through a tiny in-memory queue.
const _addrCache = new Map();
let _nominatimQueue = Promise.resolve();
function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (_addrCache.has(key)) return Promise.resolve(_addrCache.get(key));
  _nominatimQueue = _nominatimQueue.then(async () => {
    if (_addrCache.has(key)) return _addrCache.get(key);
    await new Promise(r => setTimeout(r, 1100)); // respect rate limit
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("geocoder " + res.status);
      const data = await res.json();
      const addr = data.display_name || "";
      _addrCache.set(key, addr);
      return addr;
    } catch {
      _addrCache.set(key, "");
      return "";
    }
  });
  return _nominatimQueue;
}

function parseLatLng(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.split(",").map(Number);
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

const fmtFullDate = d => d
  ? new Date(d).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  : "—";

// ─── OutingDetailModal ───────────────────────────────────────────────────────
// Single-outing popup with map + reverse-geocoded addresses.
// Reuses the page-level <Modal> (passed in as ModalShell) so styling stays
// consistent with every other modal in the app.
function OutingDetailModal({ outing, onClose, isAdmin = false, ModalShell }) {
  const mapHostRef = useRef(null);
  const mapRef     = useRef(null);
  const [addrIn,  setAddrIn]  = useState(null); // null = loading, "" = unknown
  const [addrOut, setAddrOut] = useState(null);
  const [mapErr,  setMapErr]  = useState(null);
  const [ready,   setReady]   = useState(false);

  const inLoc      = parseLatLng(outing?.clock_in_location);
  const outLoc     = parseLatLng(outing?.clock_out_location);
  const haveAnyLoc = !!(inLoc || outLoc);

  useEffect(() => {
    if (!haveAnyLoc) return;
    let cancelled = false;
    let map;
    loadLeaflet().then(L => {
      if (cancelled || !mapHostRef.current) return;

      map = L.map(mapHostRef.current, { zoomControl: true, attributionControl: true });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const makeIcon = (label, color) => L.divIcon({
        className: "bsk-outing-pin",
        html: `<div style="
                  width:28px;height:28px;border-radius:50%;
                  background:${color};color:#fff;
                  display:flex;align-items:center;justify-content:center;
                  font-weight:700;font-size:13px;font-family:Inter,sans-serif;
                  border:3px solid #fff;
                  box-shadow:0 2px 8px rgba(0,0,0,0.3);">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const markers = [];
      if (inLoc) {
        markers.push(
          L.marker([inLoc.lat, inLoc.lng], { icon: makeIcon("A", "#059669"), title: "Clock In" })
            .addTo(map).bindPopup("<b>Clock In</b>")
        );
      }
      if (outLoc) {
        markers.push(
          L.marker([outLoc.lat, outLoc.lng], { icon: makeIcon("B", "#dc2626"), title: "Clock Out" })
            .addTo(map).bindPopup("<b>Clock Out</b>")
        );
      }

      if (inLoc && outLoc) {
        L.polyline([[inLoc.lat, inLoc.lng], [outLoc.lat, outLoc.lng]], {
          color: "#2563eb", weight: 3, opacity: 0.85, dashArray: "6 6",
        }).addTo(map);
        map.fitBounds(L.latLngBounds([
          [inLoc.lat, inLoc.lng], [outLoc.lat, outLoc.lng]
        ]), { padding: [40, 40], maxZoom: 17 });
      } else {
        const c = inLoc || outLoc;
        map.setView([c.lat, c.lng], 16);
      }

      // Map needs a re-flow after the modal animates in
      setTimeout(() => map && map.invalidateSize(), 80);
      setReady(true);

      // Reverse geocode (queued, cached)
      if (inLoc) reverseGeocode(inLoc.lat, inLoc.lng).then(a => !cancelled && setAddrIn(a));
      else setAddrIn("");
      if (outLoc) reverseGeocode(outLoc.lat, outLoc.lng).then(a => !cancelled && setAddrOut(a));
      else setAddrOut("");
    }).catch(err => {
      if (!cancelled) setMapErr(err.message || "Could not load the map");
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [outing && outing.id, haveAnyLoc]); // eslint-disable-line

  const sectionStyle = {
    background: "var(--bg3)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: 12,
  };

  const Body = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* header */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--blue)", textTransform: "uppercase", marginBottom: 4 }}>
          Project Outing
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
          {fmtFullDate(outing.clock_in_time)}
        </div>
        {isAdmin && (outing.user_name || outing.employee_code) && (
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--text2)" }}>
            {outing.user_name}
            {outing.employee_code && (
              <span style={{ marginLeft: 6, color: "var(--blue)", fontWeight: 600 }}>
                ({outing.employee_code})
              </span>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          <span style={{
            background: outing.clock_out_time ? "var(--green-light)" : "var(--amber-light)",
            color:      outing.clock_out_time ? "var(--green)"        : "var(--amber)",
            fontWeight: 600, fontSize: 12, padding: "4px 10px",
            borderRadius: 999, border: `1px solid ${outing.clock_out_time ? "rgba(5,150,105,0.25)" : "rgba(217,119,6,0.25)"}`,
          }}>
            {outing.clock_out_time ? "Completed" : "In progress"}
          </span>
          {outing.duration_minutes != null && (
            <span style={{
              background: "var(--blue-light)", color: "var(--blue)",
              fontWeight: 600, fontSize: 12, padding: "4px 10px",
              borderRadius: 999, border: "1px solid var(--blue-mid)",
            }}>
              Duration · {fmtMins(outing.duration_minutes)}
            </span>
          )}
        </div>
      </div>

      {/* map */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 4 }}>
          Live Location
        </div>
        <div style={{
          width: "100%", height: 280,
          borderRadius: "var(--radius)", overflow: "hidden",
          border: "1px solid var(--border)", background: "#f1f5f9",
          position: "relative",
        }}>
          {!haveAnyLoc && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text4)", fontSize: 13, padding: 16, textAlign: "center" }}>
              No GPS coordinates were captured for this outing.
            </div>
          )}
          {haveAnyLoc && mapErr && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", fontSize: 13, padding: 16, textAlign: "center" }}>
              {mapErr}
            </div>
          )}
          {haveAnyLoc && !mapErr && !ready && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>
              <span className="spin" style={{ width: 18, height: 18, border: "2.5px solid var(--border2)", borderTopColor: "var(--blue)", borderRadius: "50%", marginRight: 8 }} />
              Loading map…
            </div>
          )}
          <div ref={mapHostRef} style={{ width: "100%", height: "100%", display: haveAnyLoc && !mapErr ? "block" : "none" }} />
        </div>

        {haveAnyLoc && !mapErr && (
          <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap", fontSize: 12, color: "var(--text2)" }}>
            {inLoc && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#059669", border: "2px solid #fff", boxShadow: "0 0 0 1px #059669" }} />
                A · Clock In
              </span>
            )}
            {outLoc && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", border: "2px solid #fff", boxShadow: "0 0 0 1px #dc2626" }} />
                B · Clock Out
              </span>
            )}
            {inLoc && outLoc && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 22, height: 0, borderTop: "3px dashed #2563eb" }} />
                Travelled path
              </span>
            )}
          </div>
        )}
      </div>

      {/* clock-in / clock-out detail cards */}
      <div className="bsk-outing-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        <DetailCard
          accent="#059669" icon="▶" title="Clock In"
          time={fmtTime(outing.clock_in_time)}
          coords={inLoc} rawCoords={outing.clock_in_location}
          address={addrIn}
          remarks={outing.clock_in_remarks} remarksLabel="Purpose"
        />
        <DetailCard
          accent="#dc2626" icon="■" title="Clock Out"
          time={outing.clock_out_time ? fmtTime(outing.clock_out_time) : "Not yet"}
          coords={outLoc} rawCoords={outing.clock_out_location}
          address={addrOut}
          remarks={outing.clock_out_remarks} remarksLabel="Completion"
          dim={!outing.clock_out_time}
        />
      </div>

      <div style={{ fontSize: 10.5, color: "var(--text4)", textAlign: "right" }}>
        Map © OpenStreetMap contributors · Geocoding by Nominatim
      </div>

      <style>{`
        @media (min-width: 640px) {
          .bsk-outing-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .bsk-outing-pin { background: transparent !important; border: none !important; }
        .leaflet-container { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );

  return (
    <ModalShell title="Outing Details" onClose={onClose}>
      {Body}
    </ModalShell>
  );
}

function DetailCard({ accent, icon, title, time, coords, rawCoords, address, remarks, remarksLabel, dim }) {
  return (
    <div style={{
      borderLeft: `4px solid ${accent}`, background: "var(--bg2)",
      border: "1px solid var(--border)", borderLeftWidth: 4,
      borderRadius: "var(--radius)", padding: "12px 14px",
      opacity: dim ? 0.7 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ color: accent, fontSize: 14, fontWeight: 700 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "0.02em" }}>{title}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "var(--text3)" }}>{time}</span>
      </div>

      <DetailField label="Address">
        {address === null
          ? <span aria-hidden="true" style={{ display: "inline-block", height: 14, width: 180, background: "linear-gradient(90deg, var(--bg3), var(--bg2), var(--bg3))", backgroundSize: "200% 100%", animation: "spin 1.4s linear infinite", borderRadius: 4 }} />
          : (address || <span style={{ color: "var(--text4)" }}>Not available</span>)}
      </DetailField>
      <DetailField label="Coordinates">
        {coords ? (
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 }}>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </span>
        ) : (
          <span style={{ color: "var(--text4)" }}>{rawCoords || "Not captured"}</span>
        )}
      </DetailField>
      {remarks && (
        <DetailField label={remarksLabel || "Remarks"}>
          <span style={{ fontStyle: "italic" }}>{remarks}</span>
        </DetailField>
      )}
    </div>
  );
}

function DetailField({ label, children }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.4, wordBreak: "break-word" }}>
        {children}
      </div>
    </div>
  );
}

function EmployeeDashboard({
  user, todayData, empStatus, onSite, settings,
  punchLoading, gpsLoading, userLat, userLon,
  isOvertime, overtimeMins, employeeWorksite,
  employeeJobSites = [],
  handleClockOut, handleBreakStart, handleBreakEnd,
  t, addToast, refreshTodayData, onNavigateToRoute,
  setAppTitle, worksites = [], onJobSiteSelect,
}) {
  // --- existing state declarations (unchanged) ---
  const [now, setNow] = useState(new Date());
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakReason, setBreakReason] = useState("");
  const [breakType, setBreakType] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [selectedBreakId, setSelectedBreakId] = useState(null);
  const [incompleteReason, setIncompleteReason] = useState("");
  const [expandedBreakId, setExpandedBreakId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [directClockInLoading, setDirectClockInLoading] = useState(false);
  // Task state moved to EmployeeTasksTab component
  const [routeStatus, setRouteStatus] = useState("not_started");
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("timecard");
  const [workflowCollapsed, setWorkflowCollapsed] = useState(false);
  const [worksiteExpanded, setWorksiteExpanded] = useState(false);
  // Job Site selector state for Time Tracker (mirrors Fuel Entry's selector)
  const [selectedTimeJobSiteId, setSelectedTimeJobSiteId] = useState(null);
  const [isOnSiteTime, setIsOnSiteTime] = useState(null);
  const [gpsForDistanceTime, setGpsForDistanceTime] = useState(null);

  // Sync app header title when tab changes
  useEffect(() => {
    if (setAppTitle) {
      setAppTitle(selectedTab === "fuel" ? "BSC Fuel Entry" : "BSC Time Tracker");
    }
    return () => { if (setAppTitle) setAppTitle("BSC Tracker"); };
  }, [selectedTab]);

  // --- NEW: Project Outing state ---
  const [activeOuting, setActiveOuting] = useState(null);
  const [outingHistory, setOutingHistory] = useState([]);
  const [outingLoading, setOutingLoading] = useState(false);
  const [showOutingModal, setShowOutingModal] = useState(false);
  const [outingRemarks, setOutingRemarks] = useState("");
  const [outingModalType, setOutingModalType] = useState("start");
  const [outingsPage, setOutingsPage] = useState(1);
  const [outingsTotal, setOutingsTotal] = useState(0);
  const [selectedOuting, setSelectedOuting] = useState(null);

  // --- Warning Clock-In state ---
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnEstHours, setWarnEstHours] = useState("0");
  const [warnEstMins, setWarnEstMins] = useState("0");
  const [warnRemarks, setWarnRemarks] = useState("");
  const [pendingWarn, setPendingWarn] = useState(null); // carries forceOutside data through camera flow

  // --- existing effects (keep all) ---
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // fetchEmployeeTasks moved to EmployeeTasksTab


  const fetchRouteStatus = useCallback(async () => {
    setRouteLoading(true);
    try {
      const res = await authFetch("/api/route/today");
      if (res.ok) {
        const data = await res.json();
        if (data.route) {
          if (data.route.status === "completed") {
            setRouteStatus("completed");
          } else if (data.stops && data.stops.length > 0) {
            setRouteStatus("in_progress");
          } else {
            setRouteStatus("not_started");
          }
        } else {
          setRouteStatus("not_started");
        }
      }
    } catch (err) {
      console.error("Failed to fetch route status", err);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRouteStatus();
  }, [fetchRouteStatus]);

  // --- NEW: Project Outing functions ---
  const fetchActiveOuting = useCallback(async () => {
    try {
      // FIX: use the dedicated /outing/active endpoint instead of guessing
      // from paginated history – far more reliable and efficient.
      console.log("[fetchActiveOuting] Checking for active project outing…");
      const res = await authFetch("/api/attendance/outing/active");
      if (res.ok) {
        const data = await res.json();
        console.log("[fetchActiveOuting] Result:", data.outing ? `id=${data.outing.id}` : "none");
        setActiveOuting(data.outing || null);
      } else {
        console.error("[fetchActiveOuting] Server error", res.status);
      }
    } catch (err) {
      console.error("[fetchActiveOuting] Network error:", err);
    }
  }, []);

  const fetchOutingHistory = useCallback(async (page = 1) => {
    setOutingLoading(true);
    try {
      const res = await authFetch(`/api/attendance/outing/history?page=${page}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setOutingHistory(data.outings);
        setOutingsTotal(data.total);
        setOutingsPage(data.page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOutingLoading(false);
    }
  }, []);

  const startOuting = async () => {
  // FIX: loading state was never set – spinner never appeared, errors crashed silently
  setOutingLoading(true);

  let location = null;
  try {
    if (navigator.geolocation) {
      console.log("[startOuting] Requesting GPS…");
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      console.log("[startOuting] GPS obtained:", location);
    }
  } catch (err) {
    console.warn("[startOuting] Location not available:", err);
    addToast("Location not available – task will be recorded without GPS.", "warning");
  }

  try {
    console.log("[startOuting] Calling /api/attendance/outing/start…");
    const res = await authFetch("/api/attendance/outing/start", {
      method: "POST",
      body: JSON.stringify({
        latitude:  location?.lat  ?? null,
        longitude: location?.lon  ?? null,
        remarks:   outingRemarks,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[startOuting] API error:", data);
      throw new Error(data.error || "Failed to start project task");
    }
    console.log("[startOuting] Success:", data);
    addToast("Project task started ✓", "success");
    setShowOutingModal(false);
    setOutingRemarks("");
    fetchActiveOuting();
    fetchOutingHistory(1);
  } catch (err) {
    console.error("[startOuting] Error:", err);
    addToast(err.message || "Could not start task. Please try again.", "error");
  } finally {
    setOutingLoading(false); // always reset, even on error
  }
};

  const endOuting = async () => {
  // FIX: loading state was never set AND the authFetch call was outside the
  // try/catch – any network error would throw silently with a frozen UI.
  setOutingLoading(true);

  let location = null;
  try {
    if (navigator.geolocation) {
      console.log("[endOuting] Requesting GPS…");
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      console.log("[endOuting] GPS obtained:", location);
    }
  } catch (err) {
    console.warn("[endOuting] Location not available:", err);
    addToast("Location not available – end time will be recorded without GPS.", "warning");
  }

  try {
    console.log("[endOuting] Calling /api/attendance/outing/end…");
    const res = await authFetch("/api/attendance/outing/end", {
      method: "POST",
      body: JSON.stringify({
        latitude:  location?.lat  ?? null,
        longitude: location?.lon  ?? null,
        remarks:   outingRemarks,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[endOuting] API error:", data);
      throw new Error(data.error || "Failed to end project task");
    }
    console.log("[endOuting] Success:", data);
    addToast("Project task ended ✓", "success");
    setShowOutingModal(false);
    setOutingRemarks("");
    fetchActiveOuting();
    fetchOutingHistory(1);
  } catch (err) {
    console.error("[endOuting] Error:", err);
    addToast(err.message || "Could not end task. Please try again.", "error");
  } finally {
    setOutingLoading(false); // always reset, even on error
  }
};

  useEffect(() => {
    fetchActiveOuting();
    fetchOutingHistory(1);
  }, [fetchActiveOuting, fetchOutingHistory]);

  // --- existing functions (keep exactly as they are) ---
  const updateTaskStatus = async (taskId, status, reason = "") => {
    const res = await authFetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, incompleteReason: reason })
    });
    if (res.ok) {
      addToast(`Task marked as ${status}`, "success");
      fetchEmployeeTasks(tasksPage);
    } else {
      addToast("Failed to update task", "error");
    }
  };

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

  const getLocationPayload = useCallback(() => {
    const lat = userLat !== null ? userLat : (employeeWorksite?.latitude ?? settings.latitude ?? 0);
    const lon = userLon !== null ? userLon : (employeeWorksite?.longitude ?? settings.longitude ?? 0);
    return { latitude: lat, longitude: lon };
  }, [userLat, userLon, employeeWorksite, settings]);

  // Accepts optional forceOutside + estimatedMinutes for Warning Clock-In flow
  const processClockIn = async (photoData, forceOutside = false, estimatedMinutes = null, warnNote = "") => {
    setClockInLoading(true);
    try {
      const { latitude, longitude } = getLocationPayload();
      const body = { latitude, longitude, photo: photoData };
      if (forceOutside) {
        body.forceOutside = true;
        body.estimatedMinutes = estimatedMinutes;
        body.remarks = warnNote;
      }
      const res = await authFetch("/api/attendance/clock-in", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast(d.error || "Action failed.", "error");
        vibrate([100, 50, 100]);
        return;
      }
      addToast(forceOutside ? "⚠ Warning Clock-In recorded" : "Clocked in ✓", forceOutside ? "warning" : "success");
      vibrate([50]);
      if (d.data) {
        refreshTodayData(d.data);
      } else {
        await refreshTodayData();
      }
    } catch {
      addToast("Cannot connect to server.", "error");
    } finally {
      setClockInLoading(false);
      setShowCamera(false);
      setPendingWarn(null);
    }
  };

  // Called when employee taps Clock In
  const handleClockIn = async () => {
    if (!onSite) {
      // Outside geofence → open Warning Clock-In modal instead of blocking
      setShowWarnModal(true);
      return;
    }
    const cameraRequired = settings.clockInWithCameraEnabled ?? true;
    if (cameraRequired) {
      setShowCamera(true);
    } else {
      setDirectClockInLoading(true);
      try {
        const { latitude, longitude } = getLocationPayload();
        const res = await authFetch("/api/attendance/clock-in", {
          method: "POST",
          body: JSON.stringify({ latitude, longitude }),
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
        setDirectClockInLoading(false);
      }
    }
  };

  // Warning modal confirmed — carry forceOutside data into camera flow (or clock in directly)
  const handleWarnConfirm = (estimatedMinutes, note) => {
    setShowWarnModal(false);
    setWarnEstHours("0");
    setWarnEstMins("0");
    setWarnRemarks("");
    const cameraRequired = settings.clockInWithCameraEnabled ?? true;
    if (cameraRequired) {
      setPendingWarn({ forceOutside: true, estimatedMinutes, note });
      setShowCamera(true);
    } else {
      processClockIn(null, true, estimatedMinutes, note);
    }
  };

  const clockInButtonLoading = (settings.clockInWithCameraEnabled ?? true) ? clockInLoading : directClockInLoading;

  const session = todayData?.session;
  const punches = todayData?.punches || [];
  let totalWorked = session?.worked_minutes || 0;
  let totalBreak = session?.break_minutes || 0;
  if ((empStatus === "clocked_in" || empStatus === "on_break") && session?.clock_in_time) {
    const elapsed = Math.round((now.getTime() - new Date(session.clock_in_time).getTime()) / 60000);
    totalWorked = Math.max(0, elapsed - (session.break_minutes || 0));
    totalBreak = session?.break_minutes || 0;
    if (empStatus === "on_break") {
      const lastBreakStart = punches.findLast(p => p.punch_type === "break_start")?.punch_time;
      if (lastBreakStart) {
        const ongoing = Math.round((now.getTime() - new Date(lastBreakStart).getTime()) / 60000);
        totalBreak = (session.break_minutes || 0) + ongoing;
      }
    }
  }

  const displayWS = employeeWorksite || { latitude: settings.latitude, longitude: settings.longitude, radius_feet: settings.radiusFeet, name: settings.siteName };
  // Compute local distance for the Warning Clock-In modal (distanceFt is outer-scope only)
  const distanceFt = (userLat != null && userLon != null && displayWS?.latitude != null && displayWS?.longitude != null)
    ? distanceFeet(userLat, userLon, displayWS.latitude, displayWS.longitude)
    : null;

  // --- renderTimeCard (includes the new Project Outing section) ---
  const renderTimeCard = () => (
    <>
      {/* Compact Time Summary */}
      <div style={{ display: "flex", gap: 16, justifyContent: "space-between", background: "var(--bg2)", borderRadius: "var(--radius)", padding: "10px 16px", border: "1px solid var(--border)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>Worked Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: isOvertime ? "var(--orange)" : "var(--green)" }}>
            {fmtMins(totalWorked)}
          </div>
          {overtimeMins > 0 && (
            <div style={{ fontSize: 11, color: "var(--orange)", fontWeight: 500, marginTop: 4 }}>
              <span className="overtime-glow">+{fmtMins(overtimeMins)} overtime</span>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>Break Time</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--amber)" }}>
            {fmtMins(totalBreak)}
          </div>
        </div>
      </div>

      {/* Main Action Card (Clock In/Out/Break) */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {empStatus === "clocked_out" && (
            <>
              <Btn
                onClick={handleClockIn}
                disabled={clockInButtonLoading}
                loading={clockInButtonLoading}
                size="lg"
                style={{ width: "100%", ...(onSite ? {} : { background:"var(--amber)", borderColor:"var(--amber)" }) }}
              >
                <Icon name={onSite ? "camera" : "alert"} size={16} color="white" />
                {onSite ? t.clockIn : "⚠ Warning Clock-In"}
              </Btn>
              {!onSite && displayWS?.latitude != null && userLat != null && (
                <div style={{ fontSize:12, color:"var(--amber)", textAlign:"center", fontWeight:500, marginTop:-4 }}>
                  You are outside your assigned job site — tap to proceed with a warning
                </div>
              )}
            </>
          )}
          {empStatus === "clocked_in" && (
            <>
              {/* Break hidden for off-site employees — they only need Clock In / Clock Out */}
              {user.work_mode !== "offsite" && (
                <Btn onClick={() => setShowBreakModal(true)} disabled={punchLoading} variant="secondary" size="md" style={{ width: "100%" }}>
                  <Icon name="coffee" size={15} color="var(--amber)" />Break
                </Btn>
              )}
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
        {/* Off-site session banner — clocked in via warning, geofence not required */}
        {todayData?.is_outside_geofence && (empStatus === "clocked_in" || empStatus === "on_break") && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--amber-light)", border: "1.5px solid rgba(217,119,6,0.3)", display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="alert" size={14} color="var(--amber)" />
            <span style={{ fontSize: 12.5, color: "var(--amber)", fontWeight: 500 }}>⚠ Off-site session · Clock out and end breaks are available from anywhere.</span>
          </div>
        )}
        {/* Normal geofence warning — only shown for on-site sessions when outside range */}
        {!gpsLoading && !onSite && displayWS?.latitude != null && userLat != null && !todayData?.is_outside_geofence && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--red-light)", border: "1.5px solid rgba(220,38,38,0.2)", display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="alert" size={14} color="var(--red)" />
            <span style={{ fontSize: 12.5, color: "var(--red)", fontWeight: 450 }}>Must be within {displayWS.radius_feet} ft of your assigned job site.</span>
          </div>
        )}
      </Card>

      {/* NEW: Project Work (secondary punch) – only when clocked in and off‑site */}
      {/* Project Work Card – always visible */}
<Card>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
    <div>
      <div style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
        Project Work
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
        {activeOuting ? "Active project task" : "Start a project-related task"}
      </div>
      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
        {activeOuting
          ? `Started at ${fmtTime(activeOuting.clock_in_time)}`
          : "Record location, purpose, and duration for project work"}
      </div>
    </div>
    <Btn
      onClick={() => {
        setOutingModalType(activeOuting ? "end" : "start");
        setOutingRemarks("");
        setShowOutingModal(true);
      }}
      variant={activeOuting ? "danger" : "primary"}
      size="md"
    >
      <Icon name={activeOuting ? "stop" : "play"} size={14} color="white" />
      {activeOuting ? "End Project Task" : "Start Project Task"}
    </Btn>
  </div>
</Card>

      {/* Today's Work Breaks (unchanged) */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Today's Work Breaks</div>
        {(() => {
          const workBreaks = punches.filter(p => p.punch_type === "break_start" && p.break_type === "work" && p.remarks);
          if (workBreaks.length === 0) return <div style={{ textAlign: "center", padding: "12px 0", color: "var(--text4)", fontSize: 13 }}>No work breaks today.</div>;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {workBreaks.map(breakRecord => {
                const isExpanded = expandedBreakId === breakRecord.id;
                return (
                  <div key={breakRecord.id} onClick={() => setExpandedBreakId(isExpanded ? null : breakRecord.id)} style={{ padding: "12px", background: "var(--bg3)", borderRadius: "var(--radius)", border: `1px solid ${isExpanded ? "var(--blue)" : "var(--border)"}`, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{breakRecord.remarks}</div><div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{fmtTime(breakRecord.punch_time)}</div></div>
                      {breakRecord.break_completed === true && <span style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--text3)" }}>✓ Completed</span>}
                      {breakRecord.break_completed === false && breakRecord.break_incomplete_reason && <span style={{ background: "var(--red-light)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--red)" }}>✗ Not Completed</span>}
                    </div>
                    {isExpanded && breakRecord.break_completed !== true && !(breakRecord.break_completed === false && breakRecord.break_incomplete_reason) && (
                      <div style={{ marginTop: 12, display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                        <button onClick={async () => { const res = await authFetch(`/api/attendance/break/${breakRecord.id}/complete`, { method: "PUT" }); const data = await res.json(); if (res.ok) { addToast("Break task marked as completed.", "success"); if (data.data) refreshTodayData(data.data); else await refreshTodayData(); } else addToast(data.error || "Failed to update break status.", "error"); }} style={{ background: "var(--green-light)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--green)", cursor: "pointer", flex: 1 }}>✓ Completed</button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedBreakId(breakRecord.id); setShowIncompleteModal(true); }} style={{ background: "var(--red-light)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--red)", cursor: "pointer", flex: 1 }}>✗ Not Completed</button>
                      </div>
                    )}
                    {breakRecord.break_completed === false && breakRecord.break_incomplete_reason && isExpanded && (
                      <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}><div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Reason for incompletion:</div><div style={{ fontSize: 12, padding: "4px 8px", background: "var(--red-light)", borderRadius: "var(--radius-sm)", color: "var(--red)" }}>{breakRecord.break_incomplete_reason}</div></div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>

      {/* NEW: Recent Project Outings History */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Recent Project Outings</div>
          {outingLoading && <span className="spin" style={{ width: 14, height: 14, border: "2px solid var(--blue)", borderTopColor: "transparent", borderRadius: "50%" }} />}
        </div>
        {outingHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "12px 0", color: "var(--text4)", fontSize: 13 }}>No project outings recorded yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {outingHistory.map(outing => (
              <div
                key={outing.id}
                onClick={() => setSelectedOuting(outing)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedOuting(outing); } }}
                title="View full details"
                style={{
                  padding: "12px",
                  background: "var(--bg3)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(37,99,235,0.10)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {fmtDate(outing.clock_in_time)} · {fmtTime(outing.clock_in_time)} → {outing.clock_out_time ? fmtTime(outing.clock_out_time) : "In progress"}
                    </div>
                    {outing.duration_minutes && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Duration: {fmtMins(outing.duration_minutes)}</div>}
                    {outing.clock_in_location && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>📍 Start: {outing.clock_in_location}</div>}
                    {outing.clock_out_location && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>📍 End: {outing.clock_out_location}</div>}
                    {outing.clock_in_remarks && <div style={{ fontSize: 11, color: "var(--blue)", marginTop: 2, fontStyle: "italic" }}>Purpose: {outing.clock_in_remarks}</div>}
                    {outing.clock_out_remarks && <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2 }}>Completion: {outing.clock_out_remarks}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {outingsTotal > 5 && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <Btn variant="secondary" size="sm" onClick={() => fetchOutingHistory(outingsPage + 1)} disabled={outingsPage * 5 >= outingsTotal}>
              Load More
            </Btn>
          </div>
        )}
      </Card>

      {/* Break Modal (unchanged) */}
      {showBreakModal && (
        <Modal title="Start Break" onClose={() => { setShowBreakModal(false); setBreakType(null); setBreakReason(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: "var(--text3)" }}>Choose break type:</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={handlePersonalBreak} loading={punchLoading} variant="green" style={{ flex: 1 }}><Icon name="coffee" size={14} color="var(--green)" />Personal Break</Btn>
              <Btn onClick={() => setBreakType("work")} variant="blue" style={{ flex: 1 }}><Icon name="briefcase" size={14} color="var(--blue)" />Work‑Related</Btn>
            </div>
            {breakType === "work" && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 8 }}>Reason for work‑related break:</p>
                <textarea rows={3} value={breakReason} onChange={e => setBreakReason(e.target.value)} placeholder="e.g., Inspecting equipment at another site, delivering materials, etc." style={{ fontSize: 14, padding: "10px", borderRadius: "var(--radius)", border: "1.5px solid var(--border)", resize: "vertical", fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}><Btn onClick={handleCustomBreak} loading={punchLoading} style={{ flex: 1 }}><Icon name="check" size={14} color="white" />Start Break</Btn><Btn onClick={() => setBreakType(null)} variant="secondary" style={{ flex: 1 }}>Back</Btn></div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Incomplete Reason Modal (unchanged) */}
      {showIncompleteModal && (
        <Modal title="Why was this task not completed?" onClose={() => { setShowIncompleteModal(false); setIncompleteReason(""); setSelectedBreakId(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <textarea rows={4} value={incompleteReason} onChange={e => setIncompleteReason(e.target.value)} placeholder="e.g., Delayed due to weather, equipment not available, etc." style={{ fontSize: 14, padding: "10px", borderRadius: "var(--radius)", border: "1.5px solid var(--border)", resize: "vertical", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={async () => { if (!incompleteReason.trim()) { addToast("Please enter a reason.", "error"); return; } const res = await authFetch(`/api/attendance/break/${selectedBreakId}/not-complete`, { method: "PUT", body: JSON.stringify({ reason: incompleteReason }) }); const data = await res.json(); if (res.ok) { addToast("Break marked as not completed.", "success"); setShowIncompleteModal(false); setIncompleteReason(""); setSelectedBreakId(null); if (data.data) refreshTodayData(data.data); else await refreshTodayData(); } else addToast(data.error || "Failed to update.", "error"); }} style={{ flex: 1 }}><Icon name="check" size={14} color="white" />Submit</Btn>
              <Btn onClick={() => setShowIncompleteModal(false)} variant="secondary" style={{ flex: 1 }}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Warning Clock-In Confirmation Modal ─────────────────────────── */}
      {showWarnModal && (
        <Modal title="⚠ Warning: Outside Job Site" onClose={() => setShowWarnModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Alert banner */}
            <div style={{ background:"var(--amber-light)", border:"1.5px solid rgba(217,119,6,0.35)", borderRadius:"var(--radius)", padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight:700, color:"var(--amber)", fontSize:14 }}>You are outside your assigned job site</div>
                {distanceFt != null && displayWS?.radius_feet != null && (
                  <div style={{ fontSize:12.5, color:"var(--text2)", marginTop:4 }}>
                    You are <strong>{Math.round(distanceFt)} ft</strong> from <strong>{displayWS?.name || "your job site"}</strong> (allowed radius: {displayWS.radius_feet} ft).
                  </div>
                )}
                <div style={{ fontSize:12.5, color:"var(--text3)", marginTop:4 }}>
                  Clocking in from outside the site will be flagged for manager review.
                </div>
              </div>
            </div>

            {/* Estimated time */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:6 }}>
                Estimated time to complete task <span style={{ color:"var(--text4)", fontWeight:400 }}>(optional)</span>
              </label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <label style={{ fontSize:11.5, color:"var(--text3)", display:"block", marginBottom:4 }}>Hours</label>
                  <select value={warnEstHours} onChange={e => setWarnEstHours(e.target.value)} style={{ fontSize:16 }}>
                    {Array.from({length:13},(_,i)=>i).map(h=><option key={h} value={h}>{h}h</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11.5, color:"var(--text3)", display:"block", marginBottom:4 }}>Minutes</label>
                  <select value={warnEstMins} onChange={e => setWarnEstMins(e.target.value)} style={{ fontSize:16 }}>
                    {[0,15,30,45].map(m=><option key={m} value={m}>{m}m</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:6 }}>
                Remarks <span style={{ color:"var(--text4)", fontWeight:400 }}>(reason for off-site work)</span>
              </label>
              <textarea
                rows={3}
                value={warnRemarks}
                onChange={e => setWarnRemarks(e.target.value)}
                placeholder="e.g. Client meeting at external location, site visit, etc."
                style={{ fontSize:14, resize:"vertical", fontFamily:"inherit" }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:8 }}>
              <Btn
                onClick={() => {
                  const estMins = (parseInt(warnEstHours)||0)*60 + (parseInt(warnEstMins)||0);
                  handleWarnConfirm(estMins || null, warnRemarks.trim());
                }}
                style={{ flex:1, background:"var(--amber)", borderColor:"var(--amber)" }}
              >
                <Icon name="alert" size={14} color="white" /> Confirm Warning Clock-In
              </Btn>
              <Btn onClick={() => setShowWarnModal(false)} variant="secondary" style={{ flex:1 }}>
                Cancel
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Camera Modal (unchanged) */}
      {showCamera && typeof window !== 'undefined' && (
        <CameraModal onClose={() => { setShowCamera(false); setPendingWarn(null); }} onCapture={(photo) => { if (pendingWarn) { processClockIn(photo, pendingWarn.forceOutside, pendingWarn.estimatedMinutes, pendingWarn.note); } else { processClockIn(photo); } }} />
      )}

      {/* NEW: Remarks Modal for Project Outing */}
      {showOutingModal && (
        <Modal
          title={outingModalType === "start" ? "Start Project Task" : "End Project Task"}
          onClose={() => {
            // FIX: prevent modal close while request is in flight
            if (!outingLoading) setShowOutingModal(false);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <textarea
              rows={3}
              value={outingRemarks}
              onChange={e => setOutingRemarks(e.target.value)}
              disabled={outingLoading}
              placeholder={
                outingModalType === "start"
                  ? "Optional: Reason for going out (e.g., Material pickup, Site inspection)"
                  : "Optional: Task completion status / remarks"
              }
              style={{
                fontSize: 14,
                padding: "10px",
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--border)",
                resize: "vertical",
                fontFamily: "inherit",
                opacity: outingLoading ? 0.6 : 1,
              }}
            />
            {/* GPS notice */}
            <div style={{ fontSize: 12, color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="pin" size={12} color="var(--text3)" />
              Your live location will be captured automatically.
            </div>
            {/* FIX: loading prop was missing – spinner never appeared */}
            <Btn
              onClick={outingModalType === "start" ? startOuting : endOuting}
              loading={outingLoading}
              disabled={outingLoading}
              variant={outingModalType === "start" ? "primary" : "danger"}
              style={{ width: "100%" }}
            >
              <Icon name={outingModalType === "start" ? "play" : "stop"} size={14} color="white" />
              {outingModalType === "start" ? "Start Task" : "End Task"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* NEW: Outing details popup with map + reverse-geocoded address */}
      {selectedOuting && (
        <OutingDetailModal
          outing={selectedOuting}
          onClose={() => setSelectedOuting(null)}
          isAdmin={false}
          ModalShell={Modal}
        />
      )}
    </>
  );

  // --- Return JSX (workflow row + greeting + expandable worksite + tab content) ---
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Greeting + Workflow in one compact block ───────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ padding: "0 2px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.01em" }}>Hello, {user?.name?.split(" ")[0] || user?.name || "Employee"}!</h2>
        </div>
        <WorkflowSection selectedTab={selectedTab} setSelectedTab={setSelectedTab} isAdmin={false}/>
      </div>

      {/* Job Site Selector — hidden on Tasks tab */}
      {selectedTab !== "tasks" && <FuelJobSiteSelector
        jobSites={(employeeJobSites.length > 0 ? employeeJobSites : [employeeWorksite].filter(Boolean)).map(s => ({
          ...s,
          geofence_radius_ft: s.geofence_radius_ft || s.radius_feet || 1000,
        }))}
        selectedJobSite={selectedTimeJobSiteId}
        setSelectedJobSite={(id) => { setSelectedTimeJobSiteId(id); if(onJobSiteSelect) onJobSiteSelect(id); }}
        isOnSite={isOnSiteTime}
        setIsOnSite={setIsOnSiteTime}
        gpsForDistance={gpsForDistanceTime}
        setGpsForDistance={setGpsForDistanceTime}
      />}

      {/* Content based on selected tab */}
      {selectedTab === "timecard" && renderTimeCard()}
      {selectedTab === "fuel" && (
        <FuelEntryPage
          currentUser={user} t={t} addToast={addToast}
          assignedJobSites={employeeJobSites.length>0?employeeJobSites:[employeeWorksite].filter(Boolean)}
          allJobSites={worksites}
          preselectedJobSiteId={selectedTimeJobSiteId}
          preselectedIsOnSite={isOnSiteTime}
          preselectedGps={gpsForDistanceTime}
        />
      )}
      {selectedTab === "equipment" && (
        <WorkflowEquipmentTab isAdmin={false} addToast={addToast}/>
      )}
      {selectedTab === "tasks" && (
        <EmployeeTasksTab user={user} t={t} addToast={addToast}/>
      )}
    </div>
  );
}

// ─── EMPLOYEE TASKS TAB ──────────────────────────────────────────────────────
// Shows My Tasks (active/pending) + Task History (all, with status filter).
// Completely self-contained — owns its own API fetching and state.
function EmployeeTasksTab({ user, t, addToast }) {
  const HIST_PER_PAGE = 10;

  // ── Active (pending) tasks ────────────────────────────────────────────────
  const [activeTasks,    setActiveTasks]    = useState([]);
  const [activeLoading,  setActiveLoading]  = useState(true);
  const [expandedId,     setExpandedId]     = useState(null);
  const [loadingId,      setLoadingId]      = useState(null);

  // ── History tasks ─────────────────────────────────────────────────────────
  const [histTasks,   setHistTasks]   = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histPage,    setHistPage]    = useState(1);
  const [histTotal,   setHistTotal]   = useState(0);
  const [histFilter,  setHistFilter]  = useState("all");

  const loadActive = useCallback(async () => {
    setActiveLoading(true);
    try {
      const res = await authFetch(`/api/tasks/employee/${user.id}?page=1&limit=50&status=pending`);
      if (res.ok) { const d = await res.json(); setActiveTasks(d.tasks || []); }
    } catch(e) {}
    setActiveLoading(false);
  }, [user.id]);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const statusQ = histFilter !== "all" ? `&status=${histFilter}` : "";
      const res = await authFetch(`/api/tasks/employee/${user.id}?page=${histPage}&limit=${HIST_PER_PAGE}${statusQ}`);
      if (res.ok) { const d = await res.json(); setHistTasks(d.tasks || []); setHistTotal(d.total || 0); }
    } catch(e) {}
    setHistLoading(false);
  }, [user.id, histPage, histFilter]);

  useEffect(() => { loadActive(); }, [loadActive]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleComplete = async (taskId) => {
    setLoadingId(taskId);
    try {
      const res = await authFetch(`/api/tasks/${taskId}/status`, {
        method: "PUT", body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) { addToast("Task marked as completed", "success"); loadActive(); loadHistory(); }
      else { const d = await safeJson(res); addToast(d?.error || "Failed to update", "error"); }
    } catch(e) { addToast("Network error", "error"); }
    setLoadingId(null);
  };

  const handleIncomplete = async (taskId) => {
    const reason = prompt("Why is this task incomplete?");
    if (!reason) return;
    setLoadingId(taskId);
    try {
      const res = await authFetch(`/api/tasks/${taskId}/status`, {
        method: "PUT", body: JSON.stringify({ status: "incomplete", incompleteReason: reason }),
      });
      if (res.ok) { addToast("Task marked as incomplete", "success"); loadActive(); loadHistory(); }
      else { addToast("Failed to update", "error"); }
    } catch(e) { addToast("Network error", "error"); }
    setLoadingId(null);
  };

  const histPages = Math.ceil(histTotal / HIST_PER_PAGE);
  const statusColor = s => s === "completed" ? "var(--green)" : s === "incomplete" ? "var(--red)" : "var(--amber)";
  const statusBg    = s => s === "completed" ? "var(--green-light)" : s === "incomplete" ? "var(--red-light)" : "var(--amber-light)";
  const statusBdr   = s => s === "completed" ? "rgba(5,150,105,0.2)" : s === "incomplete" ? "rgba(220,38,38,0.2)" : "rgba(217,119,6,0.2)";
  const statusLabel = s => s === "completed" ? "✓ Completed" : s === "incomplete" ? "✗ Incomplete" : "● Pending";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Section 1: My Tasks (Active) ── */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, gap:8 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"var(--text)", letterSpacing:"-0.01em" }}>My Tasks</div>
            <div style={{ fontSize:12.5, color:"var(--text3)", marginTop:2 }}>Active &amp; pending assignments</div>
          </div>
          <Btn onClick={loadActive} variant="secondary" size="sm" loading={activeLoading}>
            <Icon name="refresh" size={13}/> Refresh
          </Btn>
        </div>

        {activeLoading ? (
          <div style={{ textAlign:"center", padding:32, color:"var(--text4)", fontSize:14 }}>Loading…</div>
        ) : activeTasks.length === 0 ? (
          <Card>
            <div style={{ textAlign:"center", padding:"28px 0" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--text2)" }}>All caught up!</div>
              <div style={{ fontSize:12.5, color:"var(--text4)", marginTop:4 }}>No active tasks assigned right now.</div>
            </div>
          </Card>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {activeTasks.map(task => {
              const expanded = expandedId === task.id;
              const busy     = loadingId === task.id;
              const overdue  = task.due_date && new Date(task.due_date) < new Date();
              return (
                <div
                  key={task.id}
                  style={{ background:"var(--card)", border:`1.5px solid ${expanded ? "var(--blue-mid)" : "var(--border)"}`, borderRadius:"var(--radius-lg)", padding:"14px 16px", cursor:"pointer", transition:"all 0.15s", boxShadow: expanded ? "var(--shadow-sm)" : "none" }}
                  onClick={() => setExpandedId(expanded ? null : task.id)}
                >
                  {/* Header row */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:"var(--text)", lineHeight:1.3 }}>{task.title}</span>
                        {overdue && (
                          <span style={{ background:"var(--red-light)", color:"var(--red)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:999, padding:"1px 7px", fontSize:10.5, fontWeight:700 }}>OVERDUE</span>
                        )}
                      </div>
                      {task.description && (
                        <div style={{ fontSize:12.5, color:"var(--text3)", lineHeight:1.45, marginBottom:6 }}>{task.description}</div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        {task.due_date && (
                          <span style={{ fontSize:11.5, color: overdue ? "var(--red)" : "var(--text3)", display:"flex", alignItems:"center", gap:4 }}>
                            <Icon name="calendar" size={11} color={overdue ? "var(--red)" : "var(--text3)"}/>
                            Due {fmtDate(task.due_date)}
                          </span>
                        )}
                        {task.url && (
                          <a href={task.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:11.5, color:"var(--blue)", display:"inline-flex", alignItems:"center", gap:4, textDecoration:"none" }}
                            onClick={e => e.stopPropagation()}>
                            {task.task_type === "youtube" ? <><Icon name="play" size={11}/> YouTube</> :
                             task.task_type === "document" ? "📄 Doc" : "🔗 Link"}
                          </a>
                        )}
                        <span style={{ background:"var(--amber-light)", color:"var(--amber)", border:"1px solid rgba(217,119,6,0.2)", borderRadius:999, padding:"2px 8px", fontSize:11, fontWeight:600 }}>Pending</span>
                      </div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      <Icon name={expanded ? "chevronUp" : "chevronDown"} size={18} color="var(--text4)"/>
                    </div>
                  </div>

                  {/* Expanded action buttons */}
                  {expanded && (
                    <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", gap:8 }}
                      onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleComplete(task.id)}
                        disabled={busy}
                        style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 12px", background:"var(--green-light)", border:"1.5px solid rgba(5,150,105,0.25)", borderRadius:"var(--radius)", fontSize:13, fontWeight:700, color:"var(--green)", cursor:"pointer", opacity:busy?0.6:1, transition:"opacity 0.15s" }}>
                        {busy ? "Updating…" : <><Icon name="check" size={14} color="var(--green)"/> Mark Complete</>}
                      </button>
                      <button
                        onClick={() => handleIncomplete(task.id)}
                        disabled={busy}
                        style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 12px", background:"var(--red-light)", border:"1.5px solid rgba(220,38,38,0.25)", borderRadius:"var(--radius)", fontSize:13, fontWeight:700, color:"var(--red)", cursor:"pointer", opacity:busy?0.6:1, transition:"opacity 0.15s" }}>
                        <Icon name="x" size={14} color="var(--red)"/> Incomplete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Task History ── */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, gap:8 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"var(--text)", letterSpacing:"-0.01em" }}>Task History</div>
            <div style={{ fontSize:12.5, color:"var(--text3)", marginTop:2 }}>{histTotal} total task{histTotal !== 1 ? "s" : ""}</div>
          </div>
          <Btn onClick={loadHistory} variant="secondary" size="sm" loading={histLoading}>
            <Icon name="refresh" size={13}/>
          </Btn>
        </div>

        {/* Filter chips */}
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {["all","pending","completed","incomplete"].map(f => (
            <button key={f}
              onClick={() => { setHistFilter(f); setHistPage(1); }}
              style={{ padding:"5px 13px", borderRadius:999, fontSize:12.5, fontWeight: histFilter===f ? 700 : 500,
                background: histFilter===f ? "var(--blue)" : "var(--bg3)",
                color: histFilter===f ? "white" : "var(--text3)",
                border: histFilter===f ? "1.5px solid transparent" : "1.5px solid var(--border)",
                cursor:"pointer", transition:"all 0.15s" }}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {histLoading ? (
          <div style={{ textAlign:"center", padding:32, color:"var(--text4)", fontSize:14 }}>Loading…</div>
        ) : histTasks.length === 0 ? (
          <Card>
            <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text4)", fontSize:13 }}>No tasks found.</div>
          </Card>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {histTasks.map(task => (
              <div key={task.id} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize:12, color:"var(--text3)", lineHeight:1.4, marginBottom:5 }}>
                        {task.description.length > 80 ? task.description.slice(0,80) + "…" : task.description}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                      {task.due_date && <span style={{ fontSize:11.5, color:"var(--text3)", display:"flex", alignItems:"center", gap:4 }}><Icon name="calendar" size={11} color="var(--text3)"/>Due {fmtDate(task.due_date)}</span>}
                      <span style={{ fontSize:11.5, color:"var(--text4)" }}>Assigned {fmtDate(task.assigned_date)}</span>
                      {task.url && (
                        <a href={task.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:11.5, color:"var(--blue)", textDecoration:"none" }}>
                          {task.task_type === "youtube" ? "▶ YouTube" : task.task_type === "document" ? "📄 Doc" : "🔗 Link"}
                        </a>
                      )}
                    </div>
                    {task.status === "incomplete" && task.incomplete_reason && (
                      <div style={{ marginTop:7, fontSize:12, color:"var(--red)", background:"var(--red-light)", padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid rgba(220,38,38,0.15)" }}>
                        Reason: {task.incomplete_reason}
                      </div>
                    )}
                  </div>
                  <span style={{ background:statusBg(task.status), color:statusColor(task.status), border:`1px solid ${statusBdr(task.status)}`, borderRadius:999, padding:"3px 10px", fontSize:11.5, fontWeight:700, flexShrink:0, whiteSpace:"nowrap" }}>
                    {statusLabel(task.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {histPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, marginTop:16 }}>
            <button onClick={() => setHistPage(p => Math.max(1, p-1))} disabled={histPage===1}
              style={{ padding:"7px 16px", borderRadius:"var(--radius-sm)", background:"var(--bg3)", border:"1px solid var(--border)", cursor:histPage===1?"not-allowed":"pointer", opacity:histPage===1?0.45:1, fontSize:13 }}>
              ← Prev
            </button>
            <span style={{ fontSize:13, color:"var(--text2)", fontWeight:600 }}>{histPage} / {histPages}</span>
            <button onClick={() => setHistPage(p => Math.min(histPages, p+1))} disabled={histPage===histPages}
              style={{ padding:"7px 16px", borderRadius:"var(--radius-sm)", background:"var(--bg3)", border:"1px solid var(--border)", cursor:histPage===histPages?"not-allowed":"pointer", opacity:histPage===histPages?0.45:1, fontSize:13 }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RouteTabContent({ user, t, addToast }) {
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState(null);
  const [activeBreak, setActiveBreak] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [formData, setFormData] = useState({});
  const [breakType, setBreakType] = useState("");
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [stopForm, setStopForm] = useState({ distanceMiles: "", timeAtStoreMinutes: "", routeRemarks: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/route/today");
      if (res.ok) {
        const data = await res.json();
        setRoute(data.route);
        setStops(data.stops);
        const active = data.stops.find(s => !s.end_time);
        setActiveStop(active || null);
        const breakRes = await authFetch("/api/route/active-break");
        if (breakRes.ok) {
          const breakData = await breakRes.json();
          setActiveBreak(breakData.break || null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startStop = async () => {
    try {
      const res = await authFetch("/api/route/start-stop", { method: "POST" });
      if (res.ok) {
        const newStop = await res.json();
        setStops(prev => [...prev, newStop]);
        setActiveStop(newStop);
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to start stop", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    }
  };

  const endStop = async () => {
    if (!activeStop) return;
    const { distanceMiles, timeAtStoreMinutes, routeRemarks } = stopForm;
    if (!distanceMiles || !timeAtStoreMinutes) {
      addToast("Please enter distance and time at store", "error");
      return;
    }
    try {
      const res = await authFetch(`/api/route/stop/${activeStop.id}`, {
        method: "PUT",
        body: JSON.stringify({ distanceMiles, timeAtStoreMinutes, routeRemarks })
      });
      if (res.ok) {
        setActiveStop(null);
        setStopForm({ distanceMiles: "", timeAtStoreMinutes: "", routeRemarks: "" });
        fetchData();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to end stop", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    }
  };

  const openDetails = (stop) => {
    setSelectedStop(stop);
    setFormData({
      storeName: stop.store_name || "",
      orderAmount: stop.order_amount || "",
      deliveryAmount: stop.delivery_amount || "",
      productPriceRemark: stop.product_price_remark || "",
      storeRemark: stop.store_remark || "",
      nextSchedule: stop.next_schedule || "",
    });
    setShowDetailsModal(true);
  };

  const saveDetails = async () => {
    if (!selectedStop) return;
    try {
      const res = await authFetch(`/api/route/stop/${selectedStop.id}/details`, {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowDetailsModal(false);
        fetchData();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to save details", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    }
  };

  const startBreak = async () => {
    if (!breakType) {
      addToast("Please select break type", "error");
      return;
    }
    try {
      const res = await authFetch("/api/route/break/start", {
        method: "POST",
        body: JSON.stringify({ breakType, stopId: activeStop?.id })
      });
      if (res.ok) {
        const breakData = await res.json();
        setActiveBreak(breakData);
        setShowBreakModal(false);
        setBreakType("");
        fetchData();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to start break", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    }
  };

  const endBreak = async () => {
    if (!activeBreak) return;
    try {
      const res = await authFetch("/api/route/break/end", {
        method: "POST",
        body: JSON.stringify({ breakId: activeBreak.id })
      });
      if (res.ok) {
        setActiveBreak(null);
        fetchData();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to end break", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 24 }}>Loading route data...</div>;
  }

  // Route not started (no stops) – show a clear start button
  if (stops.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <Icon name="navigation" size={48} color="var(--blue)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No active route</h3>
          <p style={{ color: "var(--text3)", marginBottom: 24 }}>Click below to start your daily route.</p>
          <Btn onClick={startStop} size="lg" style={{ width: "100%", maxWidth: 300, margin: "0 auto" }}>
            <Icon name="play" size={16} color="white" /> Start Route
          </Btn>
        </div>
      </Card>
    );
  }

  // Route in progress – show full route UI
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Route status bar */}
      <div style={{ background: "var(--bg3)", borderRadius: "var(--radius)", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>Route status: </span>
          <strong style={{ color: "var(--blue)" }}>In Progress</strong>
        </div>
        {stops.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{stops.length} stop{stops.length !== 1 && "s"} completed</span>
        )}
      </div>

      {/* Action buttons for active stop */}
      {activeStop ? (
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Active Stop #{activeStop.stop_number}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn onClick={() => setShowBreakModal(true)} variant="secondary" size="md" style={{ width: "100%" }}>
              <Icon name="coffee" size={14} /> Start Break
            </Btn>
            <input
              type="number"
              placeholder="Distance (miles)"
              value={stopForm.distanceMiles}
              onChange={e => setStopForm({ ...stopForm, distanceMiles: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <input
              type="number"
              placeholder="Time at store (min)"
              value={stopForm.timeAtStoreMinutes}
              onChange={e => setStopForm({ ...stopForm, timeAtStoreMinutes: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Route remarks"
              value={stopForm.routeRemarks}
              onChange={e => setStopForm({ ...stopForm, routeRemarks: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <Btn onClick={endStop} variant="danger" size="md" style={{ width: "100%" }}>
              End Stop
            </Btn>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <Btn onClick={startStop} variant="primary" size="md">
              <Icon name="plus" size={14} color="white" /> Add Next Stop
            </Btn>
          </div>
        </Card>
      )}

      {/* Stops table */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Today's Stops</h3>
        {stops.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text4)" }}>No stops yet. Start a new stop.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Stop #</th>
                  <th>Start → End</th>
                  <th>Travel Time</th>
                  <th>Distance</th>
                  <th>Avg MPH</th>
                  <th>Breaks</th>
                  <th>Time @ Store</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                  </tr>
                </thead>
              <tbody>
                {stops.map(stop => (
                  <tr key={stop.id}>
                    <td>{stop.stop_number}</td>
                    <td>{stop.start_time ? fmtTime(stop.start_time) : "—"} → {stop.end_time ? fmtTime(stop.end_time) : "—"}</td>
                    <td>{stop.travel_time_minutes ? fmtMins(stop.travel_time_minutes) : "—"}</td>
                    <td>{stop.distance_miles ? `${stop.distance_miles} mi` : "—"}</td>
                    <td>{stop.avg_mph ? `${stop.avg_mph} mph` : "—"}</td>
                    <td>{stop.breaks_taken ? "Yes" : "No"}</td>
                    <td>{stop.time_at_store_minutes ? fmtMins(stop.time_at_store_minutes) : "—"}</td>
                    <td>{stop.route_remarks || "—"}</td>
                    <td>
                      <Btn onClick={() => openDetails(stop)} variant="secondary" size="sm">
                        {t.addDetails}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetailsModal && (
        <Modal title="Stop Details" onClose={() => setShowDetailsModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              placeholder={t.storeName}
              value={formData.storeName}
              onChange={e => setFormData({ ...formData, storeName: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <input
              type="number"
              placeholder={t.orderAmount}
              value={formData.orderAmount}
              onChange={e => setFormData({ ...formData, orderAmount: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <input
              type="number"
              placeholder={t.deliveryAmount}
              value={formData.deliveryAmount}
              onChange={e => setFormData({ ...formData, deliveryAmount: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <textarea
              rows={2}
              placeholder={t.productPriceRemark}
              value={formData.productPriceRemark}
              onChange={e => setFormData({ ...formData, productPriceRemark: e.target.value })}
              style={{ fontSize: 14 }}
            />
            <textarea
              rows={2}
              placeholder={t.storeRemark}
              value={formData.storeRemark}
              onChange={e => setFormData({ ...formData, storeRemark: e.target.value })}
              style={{ fontSize: 14 }}
            />
            <input
              type="text"
              placeholder={t.nextSchedule}
              value={formData.nextSchedule}
              onChange={e => setFormData({ ...formData, nextSchedule: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <Btn onClick={saveDetails} style={{ width: "100%" }}>Save Details</Btn>
          </div>
        </Modal>
      )}

      {/* Break Modal */}
      {showBreakModal && (
        <Modal title="Start Break" onClose={() => setShowBreakModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select value={breakType} onChange={e => setBreakType(e.target.value)} style={{ fontSize: 16 }}>
              <option value="">Select break type</option>
              <option value="lunch">Lunch</option>
              <option value="toilet">Toilet</option>
              <option value="short">Short Break</option>
            </select>
            <Btn onClick={startBreak} style={{ width: "100%" }}>Start Break</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
// Workflow-card landing mirrors the Employee Profile layout.
// Four module cards at the top; selected module's content renders below.
const ADMIN_WORKFLOW_CARDS = [
  { id: "timetracker", label: "Time Tracker", icon: "clock",     color: "var(--blue)",   desc: "Staff sessions & attendance"  },
  { id: "fuel",        label: "Fuel Entry",   icon: "fuel",      color: "var(--amber)",  desc: "Logs, dashboard & alerts"     },
  { id: "equipment",   label: "Equipment",    icon: "hard_hat",  color: "var(--green)",  desc: "Fleet management & photos"    },
  { id: "tasks",       label: "Tasks",        icon: "briefcase", color: "var(--purple)", desc: "Assign & track work orders"   },
];

function AdminDashboard({adminData,refreshAdminData,isOvertime,t,addToast=()=>{},currentUser=null,worksites=[]}){
  const{employees,attendance,allAttendance}=adminData;
  const todayActive=attendance.filter(s=>s.status==="active").length;
  const totalMins=attendance.reduce((a,s)=>{if(s.status==="active"&&s.clock_in_time)return a+Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0));return a+(parseInt(s.worked_minutes)||0);},0);

  // Active module (Workflow Card selection)
  const [activeModule, setActiveModule] = useState("timetracker");

  // Compute per-employee totals from individual attendance records (same approach as Reports page)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const empStats = (allAttendance || []).reduce((acc, r) => {
    if (!r.user_id) return acc;
    if (!acc[r.user_id]) acc[r.user_id] = { totalMins: 0, weekMins: 0, personalBreakMins: 0, workBreakMins: 0 };
    let mins = parseInt(r.worked_minutes) || 0;
    if (r.status === "active" && r.clock_in_time) {
      mins = Math.max(0, Math.round((now - new Date(r.clock_in_time).getTime()) / 60000) - (parseInt(r.break_minutes) || 0));
    }
    acc[r.user_id].totalMins += mins;
    if (new Date(r.work_date).getTime() >= weekAgo) acc[r.user_id].weekMins += mins;
    acc[r.user_id].personalBreakMins += parseInt(r.personal_break_minutes) || 0;
    acc[r.user_id].workBreakMins += parseInt(r.work_break_minutes) || 0;
    return acc;
  }, {});

  // Active employees surface first, then alphabetical
  const sortedEmployees = [...employees].sort((a, b) => {
    const aActive = attendance.some(s => s.user_id === a.id && s.status === "active");
    const bActive = attendance.some(s => s.user_id === b.id && s.status === "active");
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <style>{`
        .bsk-adm-active-row td{background:var(--green-dim)!important;}
        .bsk-adm-active-row:hover td{background:rgba(5,150,105,0.12)!important;}
        @media(max-width:599px){
          .bsk-adm-hide-mob{display:none!important;}
          .bsk-adm-tbl th,.bsk-adm-tbl td{padding:9px 10px!important;font-size:12.5px!important;}
          .bsk-adm-name{font-size:13px!important;}
          .bsk-adm-sub{display:none!important;}
        }
      `}</style>

      {/* ── Header ── */}
      <div className="fade-up" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:"var(--text)",letterSpacing:"-0.02em"}}>{t.dashboard}</h1>
          <p style={{color:"var(--text3)",fontSize:13,marginTop:3,fontWeight:400}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>
        </div>
        <Btn onClick={refreshAdminData} variant="secondary" size="sm"><Icon name="refresh" size={13}/>{t.refresh}</Btn>
      </div>

      {/* ── Workflow Cards (mirrors Employee Profile layout) ── */}
      <div className="fade-up-d1" style={{
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6,
        background:"var(--bg3)", borderRadius:"var(--radius-lg)", padding:6, border:"1px solid var(--border)",
      }}>
        {ADMIN_WORKFLOW_CARDS.map(card => {
          const active = activeModule === card.id;
          return (
            <button key={card.id} onClick={() => setActiveModule(card.id)} style={{
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              gap:4, padding:"10px 4px",
              background: active ? "var(--card)" : "transparent",
              border: active ? `1.5px solid ${card.color}30` : "1.5px solid transparent",
              borderRadius:"var(--radius)", cursor:"pointer", transition:"all 0.15s",
              boxShadow: active ? "var(--shadow-sm)" : "none", position:"relative",
            }}>
              {active && <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:card.color, borderRadius:"0 0 2px 2px" }}/>}
              <div style={{
                width:28, height:28, borderRadius:"var(--radius-sm)",
                background: active ? `${card.color}15` : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
              }}>
                <Icon name={card.icon} size={15} color={active ? card.color : "var(--text4)"}/>
              </div>
              <span style={{
                fontSize:10.5, fontWeight: active ? 700 : 500,
                color: active ? card.color : "var(--text3)",
                lineHeight:1.2, textAlign:"center", whiteSpace:"nowrap",
              }}>{card.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Time Tracker module ── */}
      {activeModule === "timetracker" && <>

      {/* ── Stat cards ── */}
      <div className="fade-up-d1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <StatCard label="Total Employees" value={employees.length} icon="users" color="var(--blue)"/>
        <StatCard label="Active Now" value={todayActive} icon="clock" color="var(--green)" sub={`of ${employees.length}`}/>
        <StatCard label="Sessions Today" value={attendance.length} icon="calendar" color="var(--purple)"/>
        <StatCard label="Hours Today" value={`${Math.round(totalMins/60)}h`} icon="trend" color="var(--amber)"/>
      </div>

      {/* ── Today's Sessions (first — prioritises active-shift visibility) ── */}
      <Card className="fade-up-d2">
        <SectionHeader title="Today's Sessions"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table className="bsk-adm-tbl" style={{minWidth:280}}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Clock In</th>
                <th className="bsk-adm-hide-mob">Clock Out</th>
                <th>Worked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length===0
                ?<tr><td colSpan={5} style={{textAlign:"center",color:"var(--text4)",padding:24}}>No sessions today.</td></tr>
                :attendance.slice(0,12).map(s=>(
                  <tr key={s.id} className={s.status==="active"?"bsk-adm-active-row":""}>
                    <td style={{color:"var(--text)",fontWeight:500,fontSize:13}}>{s.name||"—"}{s.is_outside_geofence&&<span style={{marginLeft:5}}><WarnBadge/></span>}</td>
                    <td style={{fontSize:12.5}}>{fmtTime(s.clock_in_time)}</td>
                    <td className="bsk-adm-hide-mob" style={{fontSize:12.5}}>{fmtTime(s.clock_out_time)}</td>
                    <td style={{color:"var(--green)",fontWeight:600,fontSize:13}}>{s.status==="active"&&s.clock_in_time?fmtMins(Math.max(0,Math.round((Date.now()-new Date(s.clock_in_time).getTime())/60000)-(parseInt(s.break_minutes)||0))):fmtMins(s.worked_minutes)}</td>
                    <td><StatusBadge status={s.status==="completed"?"clocked_out":"clocked_in"}/></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Employee Summary ── */}
      <Card className="fade-up-d3">
        <SectionHeader title="Employee Summary"/>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table className="bsk-adm-tbl" style={{minWidth:300}}>
            <thead>
              <tr>
                <th>Employee</th>
                <th className="bsk-adm-hide-mob">ID</th>
                <th className="bsk-adm-hide-mob">Total Hrs</th>
                <th>This Week</th>
                <th className="bsk-adm-hide-mob">Personal Break</th>
                <th className="bsk-adm-hide-mob">Work Break</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:"center",color:"var(--text4)",padding:24}}>No data yet.</td></tr>
              ) : (
                sortedEmployees.map(emp => {
                  const stats = empStats[emp.id] || { totalMins: 0, weekMins: 0, personalBreakMins: 0, workBreakMins: 0 };
                  const active = attendance.find(a => a.user_id === emp.id && a.status === "active");
                  return (
                    <tr key={emp.id} className={active ? "bsk-adm-active-row" : ""}>
                      <td>
                        <div className="bsk-adm-name" style={{fontWeight:600,color:"var(--text)",fontSize:13.5,display:"flex",alignItems:"center",gap:7}}>
                          {active && <span style={{width:7,height:7,borderRadius:"50%",background:"var(--green)",flexShrink:0,boxShadow:"0 0 0 2px var(--green-light)"}}/>}
                          {emp.name}
                          {active && active.is_outside_geofence && <WarnBadge/>}
                        </div>
                        <div className="bsk-adm-sub" style={{fontSize:11.5,color:"var(--text3)",marginTop:2,paddingLeft:active?14:0}}>{emp.designation||emp.department||""}</div>
                      </td>
                      <td className="bsk-adm-hide-mob"><span style={{background:"var(--blue-light)",color:"var(--blue)",padding:"2px 8px",borderRadius:6,fontSize:11.5,fontWeight:700,border:"1px solid var(--blue-mid)"}}>{emp.user_id||"—"}</span></td>
                      <td className="bsk-adm-hide-mob" style={{color:"var(--text2)",fontWeight:600}}>{Math.round(stats.totalMins/60)}h</td>
                      <td style={{color:"var(--text2)",fontWeight:600}}>{Math.round(stats.weekMins/60)}h</td>
                      <td className="bsk-adm-hide-mob" style={{fontSize:12,color:"var(--text3)"}}>{fmtMins(stats.personalBreakMins)}</td>
                      <td className="bsk-adm-hide-mob" style={{fontSize:12,color:"var(--text3)"}}>{fmtMins(stats.workBreakMins)}</td>
                      <td>{active?<StatusBadge status="clocked_in"/>:<StatusBadge status="clocked_out"/>}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      </> /* end timetracker module */}

      {/* ── Fuel Entry module (History / Dashboard / Alerts / Reports) ── */}
      {activeModule === "fuel" && (
        <div className="fade-up">
          <FuelEntryPage
            currentUser={currentUser}
            t={t}
            addToast={addToast}
            allJobSites={worksites}
            assignedJobSites={worksites}
          />
        </div>
      )}

      {/* ── Equipment module ── */}
      {activeModule === "equipment" && (
        <div className="fade-up">
          <WorkflowEquipmentTab isAdmin={true} addToast={addToast}/>
        </div>
      )}

      {/* ── Tasks module ── */}
      {activeModule === "tasks" && (
        <div className="fade-up">
          <TasksPage adminData={adminData} addToast={addToast} t={t}/>
        </div>
      )}

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
    // Map search state
    const[searchQuery,setSearchQuery]=useState(initial?.name||"");
    const[searching,setSearching]=useState(false);
    const[searchResults,setSearchResults]=useState([]);
    const[leafletReady,setLeafletReady]=useState(false);
    const searchTimerRef=useRef(null);
    const mapContainerRef=useRef(null);
    const mapRef=useRef(null);
    const markerRef=useRef(null);
    const circleRef=useRef(null);

    // Load Leaflet from CDN once
    useEffect(()=>{
      if(window.L){setLeafletReady(true);return;}
      const link=document.createElement("link");link.rel="stylesheet";
      link.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
      const script=document.createElement("script");
      script.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload=()=>setLeafletReady(true);
      document.head.appendChild(script);
    },[]);

    // Initialize map when Leaflet is ready
    useEffect(()=>{
      if(!leafletReady||!mapContainerRef.current)return;
      if(mapRef.current){mapRef.current.remove();mapRef.current=null;}
      const L=window.L;
      const initLat=lat?parseFloat(lat):39.8283;
      const initLon=lon?parseFloat(lon):-98.5795;
      const initZoom=lat?15:4;
      const map=L.map(mapContainerRef.current,{zoomControl:true}).setView([initLat,initLon],initZoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        attribution:'&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom:19,
      }).addTo(map);
      mapRef.current=map;
      map.on("click",e=>{
        const{lat:la,lng:lo}=e.latlng;
        setLat(la.toFixed(7));setLon(lo.toFixed(7));
        placePinWF(la,lo);
      });
      if(lat&&lon)placePinWF(parseFloat(lat),parseFloat(lon));
      return()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null;}};
    },[leafletReady]);

    // Update circle when radius changes
    useEffect(()=>{
      if(lat&&lon&&mapRef.current)placePinWF(parseFloat(lat),parseFloat(lon));
    },[radius]);

    const placePinWF=(la,lo)=>{
      if(!mapRef.current||!window.L)return;
      const L=window.L;
      if(markerRef.current){markerRef.current.remove();markerRef.current=null;}
      if(circleRef.current){circleRef.current.remove();circleRef.current=null;}
      const r=parseInt(radius)||200;
      markerRef.current=L.marker([la,lo],{icon:L.divIcon({html:`<div style="width:18px;height:18px;background:#1e3a5f;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.45)"></div>`,iconSize:[18,18],iconAnchor:[9,9],className:""})}).addTo(mapRef.current);
      circleRef.current=L.circle([la,lo],{radius:r*0.3048,color:"#2563eb",fillColor:"#3b82f6",fillOpacity:0.12,weight:2,dashArray:"5,5"}).addTo(mapRef.current);
      mapRef.current.setView([la,lo],Math.max(mapRef.current.getZoom(),15));
    };

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
      const a=r.address||{};
      const parts=[a.road,a.house_number,a.city||a.town||a.village,a.state,a.country].filter(Boolean);
      const cleanAddr=parts.length>0?parts.join(", "):r.display_name;
      setLat(plat.toFixed(7));setLon(plon.toFixed(7));
      setAddress(cleanAddr);
      setSearchQuery(cleanAddr);
      setSearchResults([]);
      placePinWF(plat,plon);
    };

    const handleSave=async()=>{
      if(!name){addToast("Job site name is required.","error");return;}
      if(!lat||!lon){addToast("Coordinates are required. Use the map search to find a location.","error");return;}
      const parsedLat=parseFloat(lat),parsedLon=parseFloat(lon);
      if(isNaN(parsedLat)||isNaN(parsedLon)){addToast("Invalid coordinates.","error");return;}
      setSaving(true);
      const body={name,projectName:projectName||name,address,latitude:parsedLat,longitude:parsedLon,radiusFeet:parseFloat(radius)||200,notes};
      const url=initial?`/api/worksites/${initial.id}`:"/api/worksites";
      const res=await authFetch(url,{method:initial?"PUT":"POST",body:JSON.stringify(body)});
      if(!res.ok){
        let errMsg="Failed to save job site.";
        try{const e=await res.json();if(e?.error)errMsg=e.error;}catch{}
        addToast(errMsg,"error");setSaving(false);return;
      }
      addToast(initial?"Job site updated.":"Job site created.","success");
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
          {/* Interactive Leaflet map — always visible, click to reposition pin */}
          <div style={{marginTop:8,borderRadius:"var(--radius)",overflow:"hidden",border:"1px solid var(--border)",position:"relative"}}>
            <div ref={mapContainerRef} style={{width:"100%",height:200}}/>
            {!leafletReady&&(
              <div style={{position:"absolute",inset:0,background:"var(--bg3)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:13,color:"var(--text3)"}}>
                <span className="spin" style={{width:14,height:14,border:"2px solid var(--blue)",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block"}}/>
                Loading map…
              </div>
            )}
            <div style={{padding:"7px 12px",background:"var(--bg3)",borderTop:"1px solid var(--border)",fontSize:12,color:"var(--text3)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>Click map to place / reposition pin</span>
              {lat&&lon&&!isNaN(parseFloat(lat))&&<strong style={{color:"var(--blue)"}}>{parseFloat(lat).toFixed(5)}°, {parseFloat(lon).toFixed(5)}°</strong>}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{borderTop:"1px dashed var(--border)",paddingTop:14}}>
          <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Job Site Details</div>

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
          <Icon name="check" size={15} color="white"/>{initial?"Update Job Site":"Create Job Site"}
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
  const[searchEmp,setSearchEmp]=useState("");

  const loadAssignments=useCallback(async()=>{
    try{const r=await authFetch("/api/worksites/assignments");if(r.ok){const d=await r.json();setAssignments(Array.isArray(d)?d:[]);}}catch{}
  },[]);

  useEffect(()=>{loadAssignments();},[loadAssignments,worksites.length]);

  const getAssigned=(wsId)=>assignments.filter(a=>a.worksite_id===wsId);
  const getAllSitesForEmp=(empId)=>assignments.filter(a=>a.employee_id===empId);
  const employees=adminData.employees.filter(e=>e.role==="employee");

  const handleDelete=async(id)=>{
    if(!confirm("Delete this job site?"))return;
    await authFetch(`/api/worksites/${id}`,{method:"DELETE"});
    addToast("Deleted.","info");setExpandedId(null);await refreshWorksites();await loadAssignments();
  };
  const handleAssign=async(wsId,empId)=>{
    const alreadyAssigned=assignments.some(a=>a.worksite_id===wsId&&a.employee_id===empId);
    if(alreadyAssigned){
      // Remove if already assigned (toggle)
      await authFetch(`/api/worksites/${wsId}/remove/${empId}`,{method:"DELETE"});
      addToast("Removed from site.","info");
    } else {
      const res=await authFetch(`/api/worksites/${wsId}/assign`,{method:"POST",body:JSON.stringify({employeeId:empId,isDefault:true})});
      if(!res.ok){addToast("Failed to assign.","error");return;}
      addToast("Assigned to site.","success");
    }
    await refreshWorksites();await loadAssignments();
  };
  const handleRemove=async(wsId,empId)=>{
    await authFetch(`/api/worksites/${wsId}/remove/${empId}`,{method:"DELETE"});
    addToast("Removed.","info");await refreshWorksites();await loadAssignments();
  };

  const filteredEmps=employees.filter(e=>{
    if(!searchEmp)return true;
    const q=searchEmp.toLowerCase();
    return(e.name||e.full_name||"").toLowerCase().includes(q)||(e.user_id||"").toLowerCase().includes(q);
  });

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800,color:"var(--text)",letterSpacing:"-0.02em",margin:0}}>Job Sites</h2>
          <p style={{fontSize:13,color:"var(--text3)",marginTop:3}}>{worksites.length} site{worksites.length!==1?"s":""} configured · {employees.length} employee{employees.length!==1?"s":""}</p>
        </div>
        <Btn onClick={()=>{setShowAddModal(true);setEditingWS(null);}} size="sm">
          <Icon name="plus" size={13} color="white"/>New Site
        </Btn>
      </div>

      {/* Summary chips */}
      {worksites.length>0&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <div style={{padding:"6px 12px",background:"var(--blue-light)",border:"1px solid var(--blue-mid)",borderRadius:999,fontSize:12,color:"var(--blue)",fontWeight:600}}>
            🏗️ {worksites.length} Active Sites
          </div>
          <div style={{padding:"6px 12px",background:"var(--green-light)",border:"1px solid rgba(5,150,105,0.2)",borderRadius:999,fontSize:12,color:"var(--green)",fontWeight:600}}>
            👥 {assignments.length} Total Assignments
          </div>
          <div style={{padding:"6px 12px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:999,fontSize:12,color:"var(--text3)",fontWeight:500}}>
            {employees.filter(e=>getAllSitesForEmp(e.id).length===0).length} unassigned
          </div>
        </div>
      )}

      {/* Site cards */}
      {worksites.length===0?(
        <Card style={{textAlign:"center",padding:48}}>
          <Icon name="map" size={40} color="var(--text4)" style={{marginBottom:14}}/>
          <p style={{color:"var(--text3)",fontSize:15,fontWeight:500}}>No job sites configured yet.</p>
          <p style={{color:"var(--text4)",fontSize:13,marginTop:6,marginBottom:20}}>Add your first job site to start tracking attendance by location.</p>
          <Btn onClick={()=>{setShowAddModal(true);setEditingWS(null);}} size="md"><Icon name="plus" size={14} color="white"/>Add First Job Site</Btn>
        </Card>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {worksites.map(w=>{
            const assigned=getAssigned(w.id);
            const isExpanded=expandedId===w.id;
            return(
              <div key={w.id} style={{borderRadius:"var(--radius-lg)",overflow:"hidden",boxShadow:isExpanded?"var(--shadow-md)":"var(--shadow-sm)",border:isExpanded?"1.5px solid var(--blue)":"1px solid var(--border)",transition:"all 0.2s",background:"var(--card)"}}>
                {/* Card header — clickable */}
                <button onClick={()=>setExpandedId(isExpanded?null:w.id)}
                  style={{width:"100%",textAlign:"left",background:"none",border:"none",padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:42,height:42,borderRadius:"var(--radius-lg)",background:isExpanded?"var(--blue)":"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",boxShadow:isExpanded?"0 3px 10px rgba(37,99,235,0.3)":"none"}}>
                    <Icon name="pin" size={19} color={isExpanded?"white":"var(--blue)"}/>
                  </div>
                  <div style={{flex:1,minWidth:0,textAlign:"left"}}>
                    <div style={{fontSize:14.5,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.project_name||w.name}</div>
                    {w.address&&<div style={{fontSize:12,color:"var(--text3)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.address}</div>}
                    <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                      <span style={{background:"var(--bg3)",border:"1px solid var(--border)",padding:"2px 7px",borderRadius:999,fontSize:11,color:"var(--text3)",fontWeight:500}}>🎯 {w.radius_feet}ft</span>
                      <span style={{background:parseInt(w.assigned_count)>0?"var(--blue-light)":"var(--bg3)",border:`1px solid ${parseInt(w.assigned_count)>0?"var(--blue-mid)":"var(--border)"}`,padding:"2px 7px",borderRadius:999,fontSize:11,color:parseInt(w.assigned_count)>0?"var(--blue)":"var(--text3)",fontWeight:parseInt(w.assigned_count)>0?600:400}}>
                        👥 {w.assigned_count||0} assigned
                      </span>
                    </div>
                  </div>
                  <Icon name={isExpanded?"chevronUp":"chevronDown"} size={17} color="var(--text3)"/>
                </button>

                {/* Expanded panel */}
                {isExpanded&&(
                  <div style={{borderTop:"1px solid var(--border)",background:"var(--bg2)"}}>
                    {/* Coordinates row */}
                    <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"var(--text3)",display:"flex",alignItems:"center",gap:5}}>
                        <Icon name="pin" size={11} color="var(--text4)"/>
                        {w.latitude&&w.longitude?`${parseFloat(w.latitude).toFixed(5)}°, ${parseFloat(w.longitude).toFixed(5)}°`:"No coordinates"}
                      </span>
                      {w.notes&&<span style={{fontSize:12,color:"var(--text3)"}}>· {w.notes}</span>}
                    </div>

                    {/* Assigned employees section */}
                    <div style={{padding:"14px 16px"}}>
                      <div style={{fontSize:11,color:"var(--text3)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span>Assigned Employees ({assigned.length})</span>
                        <Btn onClick={()=>{setSearchEmp("");setAssigningTo(w);}} size="sm" variant="blue">
                          <Icon name="plus" size={12}/>Assign
                        </Btn>
                      </div>

                      {assigned.length===0?(
                        <div style={{padding:"16px 0 8px",textAlign:"center"}}>
                          <Icon name="users" size={24} color="var(--text4)" style={{marginBottom:8}}/>
                          <p style={{fontSize:13,color:"var(--text4)"}}>No employees assigned yet.</p>
                        </div>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                          {assigned.map(a=>{
                            const empSites=getAllSitesForEmp(a.employee_id);
                            return(
                              <div key={a.employee_id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)"}}>
                                <div style={{width:32,height:32,borderRadius:"50%",background:"var(--green-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1.5px solid rgba(5,150,105,0.25)"}}>
                                  <Icon name="user" size={14} color="var(--green)"/>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13.5,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.employee_name||a.full_name}</div>
                                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap"}}>
                                    {a.user_id&&<span style={{fontSize:11,fontWeight:700,color:"var(--blue)",background:"var(--blue-light)",padding:"0 5px",borderRadius:4,border:"1px solid var(--blue-mid)"}}>{a.user_id}</span>}
                                    <span style={{fontSize:11,color:"var(--text4)"}}>{empSites.length} site{empSites.length!==1?"s":""} total</span>
                                  </div>
                                </div>
                                <button onClick={()=>handleRemove(w.id,a.employee_id)} style={{width:28,height:28,borderRadius:"var(--radius-sm)",background:"var(--red-light)",border:"1px solid rgba(220,38,38,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}} title="Remove from this site">
                                  <Icon name="x" size={12} color="var(--red)"/>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,paddingTop:4}}>
                        <Btn onClick={()=>{setEditingWS(w);setShowAddModal(true);}} variant="secondary" size="sm"><Icon name="edit" size={13}/>Edit Site</Btn>
                        <Btn onClick={()=>handleDelete(w.id)} variant="danger" size="sm"><Icon name="x" size={13} color="var(--red)"/>Delete</Btn>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal||editingWS)&&(
        <Modal title={editingWS?"Edit Job Site":"Add New Job Site"} onClose={()=>{setShowAddModal(false);setEditingWS(null);}}>
          <WorksiteForm initial={editingWS} addToast={addToast}
            onSave={async()=>{setShowAddModal(false);setEditingWS(null);await refreshWorksites();await loadAssignments();}}
            onClose={()=>{setShowAddModal(false);setEditingWS(null);}}/>
        </Modal>
      )}

      {/* Multi-Assign Modal */}
      {assigningTo&&(
        <Modal title={`Assign Employees — ${assigningTo.project_name||assigningTo.name}`} onClose={()=>setAssigningTo(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Site info */}
            <div style={{padding:"10px 14px",background:"var(--blue-light)",borderRadius:"var(--radius)",border:"1px solid var(--blue-mid)",display:"flex",alignItems:"center",gap:10}}>
              <Icon name="pin" size={15} color="var(--blue)" style={{flexShrink:0}}/>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--blue)"}}>{assigningTo.project_name||assigningTo.name}</div>
                {assigningTo.address&&<div style={{fontSize:12,color:"var(--text3)",marginTop:1}}>{assigningTo.address}</div>}
              </div>
            </div>
            <p style={{fontSize:13,color:"var(--text3)"}}>Tap an employee to toggle assignment. Assigned employees are highlighted in green.</p>
            {/* Search */}
            <div style={{position:"relative"}}>
              <Icon name="search" size={13} color="var(--text4)" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
              <input type="text" value={searchEmp} onChange={e=>setSearchEmp(e.target.value)} placeholder="Search employees…" style={{paddingLeft:30,fontSize:14}}/>
            </div>
            {/* Employee list */}
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:320,overflowY:"auto"}}>
              {filteredEmps.map(emp=>{
                const isAssigned=assignments.some(a=>a.worksite_id===assigningTo.id&&a.employee_id===emp.id);
                const empSites=getAllSitesForEmp(emp.id);
                return(
                  <button key={emp.id} onClick={()=>handleAssign(assigningTo.id,emp.id)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:"var(--radius-lg)",border:`1.5px solid ${isAssigned?"rgba(5,150,105,0.35)":"var(--border)"}`,background:isAssigned?"var(--green-light)":"var(--bg3)",cursor:"pointer",textAlign:"left",width:"100%",minHeight:56,transition:"all 0.12s"}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:isAssigned?"rgba(5,150,105,0.15)":"var(--blue-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`2px solid ${isAssigned?"rgba(5,150,105,0.3)":"var(--blue-mid)"}`}}>
                      <Icon name="user" size={17} color={isAssigned?"var(--green)":"var(--blue)"}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:isAssigned?"var(--green)":"var(--text)",display:"flex",alignItems:"center",gap:6}}>
                        {emp.name||emp.full_name}
                        {isAssigned&&<span style={{fontSize:11,fontWeight:700,background:"rgba(5,150,105,0.15)",color:"var(--green)",padding:"1px 7px",borderRadius:999,border:"1px solid rgba(5,150,105,0.25)"}}>✓ Assigned</span>}
                      </div>
                      <div style={{fontSize:12,color:"var(--text3)",marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                        {emp.user_id&&<span style={{color:"var(--blue)",fontWeight:700}}>{emp.user_id}</span>}
                        <span>{empSites.length>0?`${empSites.length} site${empSites.length!==1?"s":""} assigned`:"No sites yet"}</span>
                      </div>
                    </div>
                    <div style={{width:28,height:28,borderRadius:"50%",background:isAssigned?"var(--green)":"var(--border)",border:`2px solid ${isAssigned?"rgba(5,150,105,0.3)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                      {isAssigned?<Icon name="check" size={13} color="white"/>:<Icon name="plus" size={13} color="var(--text3)"/>}
                    </div>
                  </button>
                );
              })}
              {filteredEmps.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"var(--text4)",fontSize:13}}>No employees match your search.</div>}
            </div>
            <div style={{fontSize:12,color:"var(--text3)",paddingTop:4,borderTop:"1px solid var(--border)",textAlign:"center"}}>
              {assignments.filter(a=>a.worksite_id===assigningTo.id).length} of {employees.length} employees assigned to this site
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TasksPage({ adminData, addToast, t }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const TASKS_PER_PAGE = 12;

  const [form, setForm] = useState({
    title: "",
    description: "",
    taskType: "link",
    url: "",
    assignedTo: "",
    dueDate: "",
  });

  const employees = adminData.employees.filter(e => e.role === "employee");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async () => {
    if (!form.title || !form.assignedTo) {
      addToast("Title and employee are required", "error");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      taskType: form.taskType,
      url: form.url,
      assignedTo: form.assignedTo,
      dueDate: form.dueDate || null,
    };
    const res = await authFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      addToast("Task created", "success");
      setShowCreateModal(false);
      setForm({ title: "", description: "", taskType: "link", url: "", assignedTo: "", dueDate: "" });
      fetchTasks();
    } else {
      addToast("Failed to create task", "error");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this task?")) {
      const res = await authFetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Task deleted", "info");
        fetchTasks();
      } else {
        addToast("Delete failed", "error");
      }
    }
  };

  // Filtered + paginated tasks
  const filtered = tasks.filter(tk => {
    const empMatch = filterEmployee === "all" || String(tk.assigned_to) === String(filterEmployee);
    const statusMatch = filterStatus === "all" || tk.status === filterStatus;
    return empMatch && statusMatch;
  });
  const totalPages = Math.ceil(filtered.length / TASKS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * TASKS_PER_PAGE, page * TASKS_PER_PAGE);

  // Status badge style helper
  const statusStyle = (status) => {
    if (status === "completed") return { bg: "rgba(5,150,105,0.12)", color: "var(--green)", border: "rgba(5,150,105,0.25)", label: "Completed" };
    if (status === "incomplete") return { bg: "rgba(220,38,38,0.10)", color: "var(--red)",   border: "rgba(220,38,38,0.22)",  label: "Incomplete" };
    return { bg: "rgba(245,158,11,0.12)", color: "var(--amber)", border: "rgba(245,158,11,0.25)", label: "Pending" };
  };

  const chipStyle = (active) => ({
    padding: "5px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: `1.5px solid ${active ? "var(--blue)" : "var(--border)"}`,
    background: active ? "var(--blue)" : "var(--bg2)",
    color: active ? "#fff" : "var(--text3)",
    transition: "all 0.15s",
  });

  const STATUS_CHIPS = [
    { id: "all",        label: "All"        },
    { id: "pending",    label: "Pending"    },
    { id: "completed",  label: "Completed"  },
    { id: "incomplete", label: "Incomplete" },
  ];

  // Counts for chips
  const countFor = (s) => s === "all" ? tasks.length : tasks.filter(tk => {
    const empMatch = filterEmployee === "all" || String(tk.assigned_to) === String(filterEmployee);
    return empMatch && tk.status === s;
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader
        title={t.tasks || "Tasks"}
        subtitle={`${filtered.length} of ${tasks.length} tasks`}
        action={
          <Btn onClick={() => setShowCreateModal(true)} size="sm">
            <Icon name="plus" size={13} color="white" /> New Task
          </Btn>
        }
      />

      {/* Filters Row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {/* Employee dropdown */}
        <select
          value={filterEmployee}
          onChange={e => { setFilterEmployee(e.target.value); setPage(1); }}
          style={{ fontSize: 13, padding: "6px 10px", width: "auto", minWidth: 180, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg2)", color: "var(--text1)" }}
        >
          <option value="all">All Employees</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name} ({emp.user_id})</option>
          ))}
        </select>

        {/* Status chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_CHIPS.map(chip => (
            <button
              key={chip.id}
              style={chipStyle(filterStatus === chip.id)}
              onClick={() => { setFilterStatus(chip.id); setPage(1); }}
            >
              {chip.label}
              <span style={{ marginLeft: 5, opacity: 0.75, fontSize: 11 }}>({countFor(chip.id)})</span>
            </button>
          ))}
        </div>

        {(filterEmployee !== "all" || filterStatus !== "all") && (
          <button
            onClick={() => { setFilterEmployee("all"); setFilterStatus("all"); setPage(1); }}
            style={{ fontSize: 12, color: "var(--text4)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task Cards */}
      {loading ? (
        <Card><div style={{ textAlign: "center", padding: 32, color: "var(--text4)" }}>Loading tasks…</div></Card>
      ) : paginated.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: 36, color: "var(--text4)" }}>
            {filtered.length === 0 && tasks.length > 0
              ? "No tasks match the selected filters."
              : tasks.length === 0
              ? 'No tasks yet. Click "New Task" to assign.'
              : "No tasks on this page."}
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {paginated.map(task => {
            const ss = statusStyle(task.status);
            const isExpanded = expandedId === task.id;
            return (
              <div
                key={task.id}
                style={{
                  background: "var(--bg2)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "box-shadow 0.15s",
                  boxShadow: isExpanded ? "0 4px 18px rgba(0,0,0,0.10)" : "none",
                }}
              >
                {/* Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text1)", lineHeight: 1.3, wordBreak: "break-word" }}>
                      {task.title}
                    </div>
                  </div>
                  {/* Status badge */}
                  <span style={{
                    flexShrink: 0,
                    background: ss.bg,
                    color: ss.color,
                    border: `1px solid ${ss.border}`,
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.3px",
                  }}>
                    {ss.label}
                  </span>
                </div>

                {/* Employee row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="user" size={14} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)" }}>{task.assigned_to_name}</div>
                    <div style={{ fontSize: 11, color: "var(--blue)", fontFamily: "monospace" }}>{task.assigned_to_user_id}</div>
                  </div>
                </div>

                {/* Meta row: due date + type */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--text3)" }}>
                  {task.due_date && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="calendar" size={12} color="var(--text4)" />
                      Due: <strong style={{ color: "var(--text2)" }}>{fmtDate(task.due_date)}</strong>
                    </span>
                  )}
                  {task.url && (
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Icon name="external" size={12} color="var(--blue)" />
                      {task.task_type === "youtube" ? "YouTube" : task.task_type === "document" ? "Document" : "Link"}
                    </a>
                  )}
                  {task.completed_at && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="check" size={12} color="var(--green)" />
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>{fmtDate(task.completed_at)}</span>
                    </span>
                  )}
                </div>

                {/* Description (collapsed by default) */}
                {task.description && (
                  <div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      style={{ fontSize: 12, color: "var(--blue)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={12} color="var(--blue)" />
                      {isExpanded ? "Hide details" : "Show details"}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text2)", background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: "10px 12px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                        {task.description}
                      </div>
                    )}
                    {!isExpanded && (
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.description.slice(0, 80)}{task.description.length > 80 ? "…" : ""}
                      </div>
                    )}
                  </div>
                )}

                {/* Incomplete reason */}
                {task.status === "incomplete" && task.incomplete_reason && (
                  <div style={{ fontSize: 12, color: "var(--red)", background: "rgba(220,38,38,0.07)", borderRadius: "var(--radius-sm)", padding: "7px 10px", borderLeft: "3px solid var(--red)" }}>
                    <strong>Reason:</strong> {task.incomplete_reason}
                  </div>
                )}

                {/* Delete button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{ background: "rgba(220,38,38,0.09)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "var(--radius-sm)", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--red)", fontWeight: 600 }}
                  >
                    <Icon name="x" size={13} color="var(--red)" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 4 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "5px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg2)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}
          >
            ‹ Prev
          </button>
          <span style={{ fontSize: 13, color: "var(--text3)" }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: "5px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg2)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next ›
          </button>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <Modal title="New Task" onClose={() => setShowCreateModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ fontSize: 16 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Task Type</label>
              <select
                value={form.taskType}
                onChange={e => setForm({ ...form, taskType: e.target.value })}
                style={{ fontSize: 16 }}
              >
                <option value="link">Link (URL)</option>
                <option value="document">Document (URL)</option>
                <option value="youtube">YouTube Video</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>URL</label>
              <input
                type="text"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                style={{ fontSize: 16 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Assign to Employee *</label>
              <select
                value={form.assignedTo}
                onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                style={{ fontSize: 16 }}
              >
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.user_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Due Date (optional)</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                style={{ fontSize: 16 }}
              />
            </div>
            <Btn onClick={handleCreate} style={{ width: "100%" }}>
              Create Task
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskHistoryPage({ user, t }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const tasksPerPage = 10;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await authFetch(`/api/tasks/employee/${user.id}?page=${page}&limit=${tasksPerPage}${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, user.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader title={t.taskHistory || "Task History"} subtitle={`${total} tasks`} />

      <Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ fontSize: 14, padding: "6px 10px", width: "auto" }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <Btn onClick={() => fetchTasks()} variant="secondary" size="sm" loading={loading}>
            <Icon name="refresh" size={13} /> Refresh
          </Btn>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}>Loading...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text4)" }}>No tasks found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td style={{ verticalAlign: "middle" }}>
                      <strong>{task.title}</strong>
                      {task.description && (
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                          {task.description.slice(0, 60)}
                        </div>
                      )}
                      {task.url && (
                        <div style={{ marginTop: 6 }}>
                          {task.task_type === "youtube" ? (
                            <a href={task.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--blue)" }}>
                              Watch on YouTube
                            </a>
                          ) : (
                            <a href={task.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--blue)" }}>
                              {task.task_type === "document" ? "📄 View Document" : "🔗 Open Link"}
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ verticalAlign: "middle" }}>{task.task_type}</td>
                    <td style={{ verticalAlign: "middle" }}>{task.due_date ? fmtDate(task.due_date) : "—"}</td>
                    <td style={{ verticalAlign: "middle" }}>
                      <span
                        style={{
                          background: task.status === "completed" ? "var(--green-light)" : task.status === "incomplete" ? "var(--red-light)" : "var(--bg3)",
                          color: task.status === "completed" ? "var(--green)" : task.status === "incomplete" ? "var(--red)" : "var(--text3)",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          border: `1px solid ${
                            task.status === "completed" ? "rgba(5,150,105,0.2)" : task.status === "incomplete" ? "rgba(220,38,38,0.2)" : "var(--border)"
                          }`,
                          display: "inline-block",
                        }}
                      >
                        {task.status === "completed" ? "Completed" : task.status === "incomplete" ? "Incomplete" : "Pending"}
                      </span>
                    </td>
                    <td style={{ verticalAlign: "middle" }}>{fmtDate(task.assigned_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > tasksPerPage && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", background: "var(--bg3)", border: "1px solid var(--border)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ fontSize: 13, padding: "6px 12px" }}>Page {page} of {Math.ceil(total / tasksPerPage)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * tasksPerPage >= total}
              style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", background: "var(--bg3)", border: "1px solid var(--border)", cursor: page * tasksPerPage >= total ? "not-allowed" : "pointer", opacity: page * tasksPerPage >= total ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function RoutePage({ user, t }) {
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState(null);
  const [activeBreak, setActiveBreak] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [formData, setFormData] = useState({});
  const [breakType, setBreakType] = useState("");
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [stopForm, setStopForm] = useState({ distanceMiles: "", timeAtStoreMinutes: "", routeRemarks: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/route/today");
      if (res.ok) {
        const data = await res.json();
        setRoute(data.route);
        setStops(data.stops);
        const active = data.stops.find(s => !s.end_time);
        setActiveStop(active || null);
        const breakRes = await authFetch("/api/route/active-break");
        if (breakRes.ok) {
          const breakData = await breakRes.json();
          setActiveBreak(breakData.break || null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startStop = async () => {
    try {
      const res = await authFetch("/api/route/start-stop", { method: "POST" });
      if (res.ok) {
        const newStop = await res.json();
        setStops(prev => [...prev, newStop]);
        setActiveStop(newStop);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to start stop");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const endStop = async () => {
    if (!activeStop) return;
    const { distanceMiles, timeAtStoreMinutes, routeRemarks } = stopForm;
    if (!distanceMiles || !timeAtStoreMinutes) {
      alert("Please enter distance and time at store");
      return;
    }
    try {
      const res = await authFetch(`/api/route/stop/${activeStop.id}`, {
        method: "PUT",
        body: JSON.stringify({ distanceMiles, timeAtStoreMinutes, routeRemarks })
      });
      if (res.ok) {
        setActiveStop(null);
        setStopForm({ distanceMiles: "", timeAtStoreMinutes: "", routeRemarks: "" });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to end stop");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const openDetails = (stop) => {
    setSelectedStop(stop);
    setFormData({
      storeName: stop.store_name || "",
      orderAmount: stop.order_amount || "",
      deliveryAmount: stop.delivery_amount || "",
      productPriceRemark: stop.product_price_remark || "",
      storeRemark: stop.store_remark || "",
      nextSchedule: stop.next_schedule || "",
    });
    setShowDetailsModal(true);
  };

  const saveDetails = async () => {
    if (!selectedStop) return;
    try {
      const res = await authFetch(`/api/route/stop/${selectedStop.id}/details`, {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowDetailsModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save details");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const startBreak = async () => {
    if (!breakType) {
      alert("Please select break type");
      return;
    }
    try {
      const res = await authFetch("/api/route/break/start", {
        method: "POST",
        body: JSON.stringify({ breakType, stopId: activeStop?.id })
      });
      if (res.ok) {
        const breakData = await res.json();
        setActiveBreak(breakData);
        setShowBreakModal(false);
        setBreakType("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to start break");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const endBreak = async () => {
    if (!activeBreak) return;
    try {
      const res = await authFetch("/api/route/break/end", {
        method: "POST",
        body: JSON.stringify({ breakId: activeBreak.id })
      });
      if (res.ok) {
        setActiveBreak(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to end break");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader title={t.route} subtitle="Manage your daily route stops" />

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!activeStop && (
          <Btn onClick={startStop} variant="primary">
            <Icon name="plus" size={14} color="white" /> Start Stop
          </Btn>
        )}
        {activeStop && (
          <>
            <Btn onClick={() => setShowBreakModal(true)} variant="secondary">
              <Icon name="coffee" size={14} /> Start Break
            </Btn>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                placeholder="Distance (miles)"
                value={stopForm.distanceMiles}
                onChange={e => setStopForm({ ...stopForm, distanceMiles: e.target.value })}
                style={{ width: "100%", marginBottom: 5 }}
              />
              <input
                type="number"
                placeholder="Time at store (min)"
                value={stopForm.timeAtStoreMinutes}
                onChange={e => setStopForm({ ...stopForm, timeAtStoreMinutes: e.target.value })}
                style={{ width: "100%", marginBottom: 5 }}
              />
              <input
                type="text"
                placeholder="Route remarks"
                value={stopForm.routeRemarks}
                onChange={e => setStopForm({ ...stopForm, routeRemarks: e.target.value })}
                style={{ width: "100%", marginBottom: 5 }}
              />
              <Btn onClick={endStop} variant="danger" style={{ width: "100%" }}>
                End Stop
              </Btn>
            </div>
          </>
        )}
        {activeBreak && (
          <Btn onClick={endBreak} variant="orange">
            <Icon name="stop" size={14} /> End Break
          </Btn>
        )}
      </div>

      {/* Stops Table / Cards */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Today's Stops</h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}>Loading...</div>
        ) : stops.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text4)" }}>No stops yet. Start a new stop.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>{t.stopNumber}</th>
                  <th>{t.startEndTime}</th>
                  <th>{t.travelTime}</th>
                  <th>{t.distance}</th>
                  <th>{t.avgMPH}</th>
                  <th>{t.breaks}</th>
                  <th>{t.timeAtStore}</th>
                  <th>{t.remarks}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stops.map(stop => (
                  <tr key={stop.id}>
                    <td>{stop.stop_number}</td>
                    <td>{stop.start_time ? fmtTime(stop.start_time) : "—"} → {stop.end_time ? fmtTime(stop.end_time) : "—"}</td>
                    <td>{stop.travel_time_minutes ? fmtMins(stop.travel_time_minutes) : "—"}</td>
                    <td>{stop.distance_miles ? `${stop.distance_miles} mi` : "—"}</td>
                    <td>{stop.avg_mph ? `${stop.avg_mph} mph` : "—"}</td>
                    <td>{stop.breaks_taken ? "Yes" : "No"}</td>
                    <td>{stop.time_at_store_minutes ? fmtMins(stop.time_at_store_minutes) : "—"}</td>
                    <td>{stop.route_remarks || "—"}</td>
                    <td>
                      <Btn onClick={() => openDetails(stop)} variant="secondary" size="sm">
                        {t.addDetails}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetailsModal && (
        <Modal title="Stop Details" onClose={() => setShowDetailsModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              placeholder={t.storeName}
              value={formData.storeName}
              onChange={e => setFormData({ ...formData, storeName: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <input
              type="number"
              placeholder={t.orderAmount}
              value={formData.orderAmount}
              onChange={e => setFormData({ ...formData, orderAmount: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <input
              type="number"
              placeholder={t.deliveryAmount}
              value={formData.deliveryAmount}
              onChange={e => setFormData({ ...formData, deliveryAmount: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <textarea
              rows={2}
              placeholder={t.productPriceRemark}
              value={formData.productPriceRemark}
              onChange={e => setFormData({ ...formData, productPriceRemark: e.target.value })}
              style={{ fontSize: 14 }}
            />
            <textarea
              rows={2}
              placeholder={t.storeRemark}
              value={formData.storeRemark}
              onChange={e => setFormData({ ...formData, storeRemark: e.target.value })}
              style={{ fontSize: 14 }}
            />
            <input
              type="text"
              placeholder={t.nextSchedule}
              value={formData.nextSchedule}
              onChange={e => setFormData({ ...formData, nextSchedule: e.target.value })}
              style={{ fontSize: 16 }}
            />
            <Btn onClick={saveDetails} style={{ width: "100%" }}>Save Details</Btn>
          </div>
        </Modal>
      )}

      {/* Break Modal */}
      {showBreakModal && (
        <Modal title="Start Break" onClose={() => setShowBreakModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select value={breakType} onChange={e => setBreakType(e.target.value)} style={{ fontSize: 16 }}>
              <option value="">Select break type</option>
              <option value="lunch">{t.lunch || "Lunch"}</option>
              <option value="toilet">{t.toilet || "Toilet"}</option>
              <option value="short">{t.short || "Short Break"}</option>
            </select>
            <Btn onClick={startBreak} style={{ width: "100%" }}>Start Break</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RouteHistoryPage({ adminData, t }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterUser !== "all") params.set("user_id", filterUser);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    try {
      const res = await authFetch(`/api/route/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterUser, dateFrom, dateTo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader title={t.routeHistory || "Route History"} subtitle="Overview of all routes" />
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ fontSize: 16 }}>
            <option value="all">All Employees</option>
            {adminData.employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <Btn onClick={fetchHistory} variant="secondary" size="sm">Refresh</Btn>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}>Loading...</div>
        ) : routes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text4)" }}>No routes found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Stops</th>
                  <th>Travel Time</th>
                  <th>Store Time</th>
                  <th>Distance</th>
                  <th>Breaks</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(route => (
                  <tr key={route.id}>
                    <td>{route.user_name}</td>
                    <td>{fmtDate(route.route_date)}</td>
                    <td><StatusBadge status={route.status === "active" ? "clocked_in" : "clocked_out"} /></td>
                    <td>{route.total_stops}</td>
                    <td>{fmtMins(route.total_travel)}</td>
                    <td>{fmtMins(route.total_store_time)}</td>
                    <td>{route.total_distance ? `${route.total_distance} mi` : "—"}</td>
                    <td>{route.total_breaks}</td>
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

function AdminOutingsPage({ adminData, t }) {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterUser, setFilterUser] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 15;
  const [selectedOuting, setSelectedOuting] = useState(null);

  const fetchOutings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterUser !== "all") params.set("user_id", filterUser);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    params.set("page", page);
    params.set("limit", itemsPerPage);
    try {
      const res = await authFetch(`/api/attendance/outing/admin/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOutings(data.outings);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterUser, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchOutings();
  }, [fetchOutings]);

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader title="Project Outings" subtitle="Monitor employee project tasks" />
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ fontSize: 16 }}>
            <option value="all">All Employees</option>
            {adminData.employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.user_id})</option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <Btn onClick={fetchOutings} variant="secondary" size="sm">Filter</Btn>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}>Loading...</div>
        ) : outings.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text4)" }}>No project outings found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
              Click any row to view full details and a map of the clock-in / clock-out locations.
            </div>
            <table style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Start Location</th>
                  <th>End Location</th>
                  <th>Purpose</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {outings.map(o => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOuting(o)}
                    style={{ cursor: "pointer" }}
                    title="Click to view full details"
                  >
                    <td>{o.user_name}<br/><span style={{ fontSize: 11, color: "var(--blue)" }}>{o.employee_code}</span></td>
                    <td>{fmtDate(o.clock_in_time)}<br/>{fmtTime(o.clock_in_time)}</td>
                    <td>{o.clock_out_time ? fmtDate(o.clock_out_time) + "<br/>" + fmtTime(o.clock_out_time) : "—"}</td>
                    <td>{o.duration_minutes ? fmtMins(o.duration_minutes) : "—"}</td>
                    <td>{o.clock_in_location || "—"}</td>
                    <td>{o.clock_out_location || "—"}</td>
                    <td>{o.clock_in_remarks || "—"}</td>
                    <td>{o.clock_out_remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </Card>

      {/* NEW: Outing details popup */}
      {selectedOuting && (
        <OutingDetailModal
          outing={selectedOuting}
          onClose={() => setSelectedOuting(null)}
          isAdmin={true}
          ModalShell={Modal}
        />
      )}
    </div>
  );
}


// ─── SESSION DETAIL PANEL (shared by MyAttendance + AttendancePage) ──────────

// Module-level geocode cache — persists across renders, avoids duplicate calls
const _geocodeCache = {};

// Reverse-geocode a lat/lon to a human-readable address via OpenStreetMap Nominatim.
// Returns null while loading, and the address string once resolved.
function useReverseGeocode(lat, lon) {
  const [address, setAddress] = useState(null);
  useEffect(() => {
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (isNaN(latN) || isNaN(lonN)) return;
    const key = `${latN.toFixed(4)},${lonN.toFixed(4)}`;
    if (_geocodeCache[key]) { setAddress(_geocodeCache[key]); return; }
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latN}&lon=${lonN}&format=json`, {
      headers: { "Accept-Language": "en" }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d) return;
        const addr = d.display_name || null;
        if (addr) { _geocodeCache[key] = addr; setAddress(addr); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lat, lon]);
  return address;
}

// Standalone location block — must be a top-level component so hooks work correctly.
function PunchLocationBlock({ punch }) {
  // Support both "latitude"/"longitude" (DB column names) and "lat"/"lon" (legacy)
  const rawLat = punch?.latitude ?? punch?.lat;
  const rawLon = punch?.longitude ?? punch?.lon;
  const lat = rawLat != null ? parseFloat(rawLat) : NaN;
  const lon = rawLon != null ? parseFloat(rawLon) : NaN;
  const hasValidCoords = !isNaN(lat) && !isNaN(lon);

  // Only attempt geocoding when BOTH coordinates are valid numbers
  const address = useReverseGeocode(hasValidCoords ? lat : null, hasValidCoords ? lon : null);

  if (!punch || isNaN(lat)) return null;   // nothing at all to show

  const latStr = lat.toFixed(6);
  const lonStr = !isNaN(lon) ? lon.toFixed(6) : null;
  const mapsUrl = hasValidCoords
    ? `https://www.google.com/maps?q=${latStr},${lonStr}`
    : `https://www.google.com/maps/search/?api=1&query=${latStr}`;

  return (
    <div style={{ marginTop: 6 }}>
      {/* Address line */}
      {hasValidCoords ? (
        address ? (
          <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, lineHeight: 1.5, marginBottom: 4,
            background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: "5px 8px",
            border: "1px solid var(--border)" }}>
            📍 {address}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "var(--text4)", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <span className="spin" style={{ width: 9, height: 9, border: "2px solid var(--text4)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
            Fetching address…
          </div>
        )
      ) : (
        <div style={{ fontSize: 11, color: "var(--amber)", marginBottom: 3, fontWeight: 600,
          background: "var(--amber-light)", borderRadius: "var(--radius-sm)", padding: "4px 7px",
          border: "1px solid rgba(217,119,6,0.25)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          ⚠ Partial location — longitude not captured
        </div>
      )}
      {/* Coordinates + map link */}
      <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginTop: hasValidCoords && address ? 4 : 2 }}>
        <span style={{ fontFamily: "monospace", fontSize: 10.5 }}>Lat: {latStr}</span>
        {lonStr
          ? <><span style={{ color: "var(--border2)" }}>·</span><span style={{ fontFamily: "monospace", fontSize: 10.5 }}>Lon: {lonStr}</span></>
          : <span style={{ color: "var(--amber)" }}>· Lon: not available</span>
        }
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          style={{ color: "var(--blue)", textDecoration: "none", fontSize: 10.5, fontWeight: 600,
            background: "var(--blue-light)", padding: "1px 6px", borderRadius: 4,
            border: "1px solid var(--blue-mid)" }}>
          View on Map ↗
        </a>
      </div>
    </div>
  );
}

function SessionDetailPanel({ session, punches, isAdmin = false }) {
  const clockInPunch  = punches.find(p => p.punch_type === "clock_in"  || p.punch_type === "auto_clock_in");
  const clockOutPunch = punches.find(p => p.punch_type === "clock_out" || p.punch_type === "auto_clock_out");
  const breakPunches  = punches.filter(p => p.punch_type === "break_start");

  // Compute total worked duration for the duration summary row
  const workedMins = session.worked_minutes
    || (session.status === "active" && session.clock_in_time
        ? Math.max(0, Math.round((Date.now() - new Date(session.clock_in_time).getTime()) / 60000) - (parseInt(session.break_minutes) || 0))
        : 0);

  const sectionLabel = { fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 };
  const card = { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Duration summary row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Duration</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: workedMins > 0 ? "var(--green)" : "var(--text3)" }}>
            {workedMins > 0 ? fmtMins(workedMins) : "—"}
          </div>
          {session.status === "active" && <div style={{ fontSize: 10, color: "var(--amber)", marginTop: 2 }}>● Live</div>}
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Break Time</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text2)" }}>{fmtMins(session.break_minutes || 0)}</div>
        </div>
        {session.estimated_minutes != null && (
          <div style={{ ...card, textAlign: "center", background: session.is_outside_geofence ? "var(--amber-light)" : "var(--bg2)", border: session.is_outside_geofence ? "1px solid rgba(217,119,6,0.3)" : "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: session.is_outside_geofence ? "var(--amber)" : "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              {session.is_outside_geofence ? "⚠ Est. (Off-Site)" : "Estimated"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: session.is_outside_geofence ? "var(--amber)" : "var(--text2)" }}>
              {fmtMins(session.estimated_minutes)}
            </div>
            {session.is_outside_geofence && workedMins > 0 && (
              <div style={{ fontSize: 10, marginTop: 2, color: workedMins > session.estimated_minutes ? "var(--red)" : "var(--green)" }}>
                {workedMins > session.estimated_minutes
                  ? `▲ +${fmtMins(workedMins - session.estimated_minutes)}`
                  : `✓ within`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Off-site warning banner ── */}
      {session.is_outside_geofence && (
        <div style={{ padding: "8px 12px", background: "var(--amber-light)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: "var(--radius)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--amber)" }}>⚠ Off-Site Clock-In</span>
          <span style={{ color: "var(--text3)" }}>Employee confirmed they were outside the geofence at clock-in.</span>
        </div>
      )}

      {/* ── Clock-In / Clock-Out grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

        {/* Clock-In */}
        <div style={card}>
          <div style={sectionLabel}>🟢 Clock In</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
            {fmtTime(clockInPunch?.punch_time || session.clock_in_time)}
          </div>
          {clockInPunch?.source === "auto" && (
            <div style={{ fontSize: 10, color: "var(--amber)", marginBottom: 2 }}>Auto clock-in</div>
          )}
          {session.is_outside_geofence && (
            <div style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600, marginBottom: 2 }}>⚠ Off-Site</div>
          )}
          {clockInPunch?.remarks && (
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Note: {clockInPunch.remarks}</div>
          )}
          <PunchLocationBlock punch={clockInPunch} />
          {clockInPunch?.photo_data && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Photo</div>
              <img src={clockInPunch.photo_data} alt="Clock-in"
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "2px solid var(--border)", display: "block" }} />
            </div>
          )}
        </div>

        {/* Clock-Out */}
        <div style={card}>
          <div style={sectionLabel}>🔴 Clock Out</div>
          {(clockOutPunch || session.clock_out_time) ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                {fmtTime(clockOutPunch?.punch_time || session.clock_out_time)}
              </div>
              {clockOutPunch?.source === "auto" && (
                <div style={{ fontSize: 10, color: "var(--amber)", marginBottom: 2 }}>Auto clock-out</div>
              )}
              {session.is_outside_geofence && (
                <div style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600, marginBottom: 2 }}>⚠ Off-Site</div>
              )}
              {clockOutPunch?.remarks && (
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Note: {clockOutPunch.remarks}</div>
              )}
              <PunchLocationBlock punch={clockOutPunch} />
              {clockOutPunch?.photo_data && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Photo</div>
                  <img src={clockOutPunch.photo_data} alt="Clock-out"
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "2px solid var(--border)", display: "block" }} />
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text4)" }}>Still clocked in</div>
          )}
        </div>
      </div>

      {/* ── Breaks ── */}
      <div style={card}>
        <div style={sectionLabel}>☕ Breaks ({breakPunches.length})</div>
        {breakPunches.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text4)" }}>No breaks recorded.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {breakPunches.map((p, idx) => {
              const endPunch = punches.find(ep =>
                ep.punch_type === "break_end" && new Date(ep.punch_time) > new Date(p.punch_time)
              );
              const duration = endPunch
                ? Math.round((new Date(endPunch.punch_time) - new Date(p.punch_time)) / 60000)
                : session.status === "on_break" && idx === breakPunches.length - 1
                  ? Math.round((Date.now() - new Date(p.punch_time).getTime()) / 60000)
                  : null;
              return (
                <div key={p.id} style={{
                  borderLeft: "3px solid",
                  borderColor: p.break_type === "work" ? "var(--blue)" : "var(--amber)",
                  paddingLeft: 10, paddingTop: 4, paddingBottom: 4,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                    {p.break_type === "work" ? "🔧 Work-Related" : "☕ Personal"} Break
                    {duration !== null && (
                      <span style={{ fontWeight: 400, color: "var(--text3)", marginLeft: 6 }}>{fmtMins(duration)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    {fmtTime(p.punch_time)}{endPunch ? ` → ${fmtTime(endPunch.punch_time)}` : session.status === "on_break" && idx === breakPunches.length - 1 ? " (ongoing)" : ""}
                  </div>
                  {p.remarks && (
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>Reason: {p.remarks}</div>
                  )}
                  {p.break_type === "work" && (
                    <div style={{ marginTop: 3 }}>
                      {p.break_completed === true
                        ? <span style={{ fontSize: 10, color: "var(--green)" }}>✓ Completed</span>
                        : p.break_completed === false && p.break_incomplete_reason
                          ? <span style={{ fontSize: 10, color: "var(--red)" }}>✗ Not Completed – {p.break_incomplete_reason}</span>
                          : <span style={{ fontSize: 10, color: "var(--amber)" }}>⏳ Pending</span>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
    <th>Total Hours</th>
    <th>Regular Hours</th>
    <th>Overtime Hours</th>
    <th>Status</th>
    <th>More Details</th>
  </tr>
</thead>
<tbody>
  {filtered.length === 0 ? (
    <tr>
      <td colSpan={9} style={{ textAlign: "center", color: "var(--text4)", padding: 24 }}>
        No records found.
      </td>
    </tr>
  ) : (
    filtered.map(s => (
      <>
        <tr key={s.id}>
          <td style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>
            {fmtDate(s.work_date)}
          </td>
          <td style={{ fontSize: 12.5 }}>{fmtTime(s.clock_in_time)}</td>
          <td style={{ fontSize: 12.5 }}>{fmtTime(s.clock_out_time)}</td>
          <td style={{ fontSize: 12.5 }}>{fmtMins(s.break_minutes)}</td>
          <td style={{ color: s.is_overtime ? "var(--orange)" : "var(--green)", fontWeight: 600, fontSize: 13 }}>
            {s.status === "active" && s.clock_in_time
              ? fmtMins(Math.max(0, Math.round((Date.now() - new Date(s.clock_in_time).getTime()) / 60000) - (parseInt(s.break_minutes) || 0)))
              : fmtMins(s.worked_minutes)}
            {s.is_overtime && " 🔥"}
          </td>
          <td style={{ fontSize: 12.5 }}>{fmtMins(s.regular_minutes || 0)}</td>
          <td style={{ fontSize: 12.5, color: (s.overtime_minutes || 0) > 0 ? "var(--orange)" : "var(--text3)" }}>
            {fmtMins(s.overtime_minutes || 0)}
          </td>
          <td>
            <StatusBadge
              status={
                s.status === "completed"
                  ? "clocked_out"
                  : s.is_overtime
                  ? "overtime"
                  : "clocked_in"
              }
            />
            {s.is_outside_geofence && <div style={{marginTop:4}}><WarnBadge/></div>}
            {s.is_outside_geofence && s.estimated_minutes != null && (
              <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 3, whiteSpace: "nowrap" }}>
                Est: {fmtMins(s.estimated_minutes)}
                {(s.worked_minutes || 0) > s.estimated_minutes &&
                  <span style={{ color: "var(--red)", marginLeft: 4 }}>▲{fmtMins((s.worked_minutes || 0) - s.estimated_minutes)}</span>
                }
              </div>
            )}
          </td>
          <td>
            <button
              onClick={() => toggleSession(s.id)}
              style={{
                background: expandedSessionId === s.id ? "var(--blue)" : "var(--blue-light)",
                color: expandedSessionId === s.id ? "#fff" : "var(--blue)",
                border: "1px solid var(--blue-mid)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {expandedSessionId === s.id ? "Hide" : "More Details"}
            </button>
          </td>
        </tr>
        {expandedSessionId === s.id && sessionPunches[s.id] && (
          <tr>
            <td colSpan={9} style={{ padding: "14px 16px", background: "var(--bg3)", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span>🧾 Full Record</span>
                <span style={{ fontWeight: 400, color: "var(--text3)" }}>· {fmtDate(s.work_date)}</span>
                {s.is_outside_geofence && <WarnBadge />}
              </div>
              <SessionDetailPanel session={s} punches={sessionPunches[s.id]} />
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
function MyProfile({user,addToast,employeeWorksite,employeeJobSites=[],t,onViewTaskHistory}){
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
            {user.timezone && (
  <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, background: "var(--blue-light)", padding: "3px 10px", borderRadius: 999, border: "1px solid var(--blue-mid)" }}>
    <Icon name="globe" size={11} color="var(--blue)" />
    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>
      {user.timezone === "America/New_York" ? "🇺🇸 Atlanta (UTC-4/5)" : "🇮🇳 Kolkata (UTC+5:30)"}
    </span>
  </div>
)}
            {user.userId&&<div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:5,background:"var(--blue-light)",padding:"3px 10px",borderRadius:999,border:"1px solid var(--blue-mid)"}}><Icon name="key" size={11} color="var(--blue)"/><span style={{fontSize:12,fontWeight:700,color:"var(--blue)"}}>{user.userId}</span></div>}
            {/* On-site / Off-site work-mode badge */}
            {user.work_mode && (
              <div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:5,
                background: user.work_mode==="offsite" ? "var(--amber-light)" : "var(--green-light)",
                padding:"3px 10px",borderRadius:999,
                border: `1px solid ${user.work_mode==="offsite" ? "rgba(217,119,6,0.3)" : "rgba(5,150,105,0.25)"}`
              }}>
                <span style={{fontSize:11}}>{user.work_mode==="offsite" ? "📍" : "🏗️"}</span>
                <span style={{fontSize:12,fontWeight:700,
                  color: user.work_mode==="offsite" ? "var(--amber)" : "var(--green)"
                }}>{user.work_mode==="offsite" ? "Off-Site" : "On-Site"}</span>
              </div>
            )}
          </div>
        </div>
        {[["Email",user.email||"—"],["Role",user.role]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:13.5,color:"var(--text3)",fontWeight:500}}>{k}</span>
            <span style={{fontSize:13.5,color:"var(--text)",fontWeight:500,textAlign:"right",maxWidth:"60%",wordBreak:"break-all"}}>{v}</span>
          </div>
        ))}
      </Card>
      {/* Assigned Job Sites — all sites shown as individual cards */}
      {(employeeJobSites.length>0||employeeWorksite)&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <Icon name="pin" size={15} color="var(--blue)"/>
            <h3 style={{fontSize:14,fontWeight:700,color:"var(--text)",margin:0}}>Assigned Job Sites</h3>
            <span style={{background:"var(--green-light)",color:"var(--green)",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:700,border:"1px solid rgba(5,150,105,0.2)",marginLeft:"auto"}}>{(employeeJobSites.length||1)} Active</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(employeeJobSites.length>0?employeeJobSites:[employeeWorksite]).map((site,i)=>(
              <Card key={i} style={{border:"1.5px solid var(--blue-mid)",background:"var(--blue-light)",padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:"var(--radius)",background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 6px rgba(37,99,235,0.25)"}}>
                    <Icon name="pin" size={15} color="white"/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{site.project_name||site.name}</div>
                    {site.address&&<div style={{fontSize:12.5,color:"var(--text3)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{site.address}</div>}
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      {site.latitude&&site.longitude&&(
                        <span style={{fontSize:11,color:"var(--text4)",background:"rgba(255,255,255,0.6)",padding:"1px 6px",borderRadius:4,border:"1px solid var(--border)"}}>
                          📍 {parseFloat(site.latitude).toFixed(4)}°, {parseFloat(site.longitude).toFixed(4)}°
                        </span>
                      )}
                      {(site.radius_feet||site.geofence_radius_ft)&&(
                        <span style={{fontSize:11,color:"var(--blue)",background:"rgba(37,99,235,0.08)",padding:"1px 6px",borderRadius:4,border:"1px solid var(--blue-mid)",fontWeight:600}}>
                          🎯 {site.radius_feet||site.geofence_radius_ft}ft radius
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
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
      <Card>
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
    <Icon name="briefcase" size={15} color="var(--blue)" />
    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Task History</h3>
  </div>
  <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12 }}>
    View all your assigned tasks and their statuses.
  </p>
  <Btn onClick={onViewTaskHistory} variant="secondary" size="sm">
    <Icon name="calendar" size={13} /> View Full History
  </Btn>
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

// ─── ADD EMPLOYEE FORM (moved outside to prevent keyboard dismissal) ──────────
function AddEmployeeForm({ onDone, addToast, refreshAdminData }) {
  const [fname, setFname] = useState("");
  const [femail, setFemail] = useState("");
  const [fpass, setFpass] = useState("");
  const [fuid, setFuid] = useState("");
  const [fdept, setFdept] = useState("");
  const [fdesig, setFdesig] = useState("");
  const [fcode, setFcode] = useState("");
  const [frole, setFrole] = useState("employee");
  const [ftz, setFtz] = useState("America/New_York");
  const [fworkMode, setFworkMode] = useState("onsite");
  const [fshowPass, setFshowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!fname || !fpass) {
      addToast("Name and password required.", "error");
      return;
    }
    setSaving(true);
    const res = await authFetch("/api/admin/employees", {
      method: "POST",
      body: JSON.stringify({
        name: fname,
        email: femail || null,
        password: fpass,
        role: frole,
        department: fdept,
        designation: fdesig,
        employeeCode: fcode,
        userId: fuid || null,
        timezone: ftz,
        workMode: fworkMode,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      addToast(d.error || "Failed.", "error");
      setSaving(false);
      return;
    }
    addToast(`Employee added. User ID: ${d.userId}`, "success");
    setSaving(false);
    onDone(); // closes the form and refreshes list
  };

  return (
    <Card style={{ border: "1.5px solid var(--blue-mid)", background: "var(--blue-light)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>New Employee</h3>
        <button onClick={onDone} style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text3)", width: 28, height: 28, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="close" size={14} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Full Name *</label>
          <input type="text" value={fname} onChange={e => setFname(e.target.value)} placeholder="Full name" style={{ fontSize: 16 }} autoCorrect="off" autoComplete="off" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>User ID (4-char)</label>
            <input
              type="text"
              value={fuid}
              onChange={e => setFuid(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="Auto"
              maxLength={4}
              style={{ fontSize: 16, textAlign: "center", letterSpacing: "0.15em", width: "100%" }}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Password *</label>
            <div style={{ position: "relative" }}>
              <input
                type={fshowPass ? "text" : "password"}
                value={fpass}
                onChange={e => setFpass(e.target.value.slice(0, 4))}
                placeholder="4-digit PIN"
                maxLength={4}
                inputMode="numeric"
                style={{
                  fontSize: 16,
                  textAlign: "center",
                  letterSpacing: "0.15em",
                  width: "100%",
                  padding: "10px 14px",
                  paddingRight: 52,
                }}
                required
              />
              <button
                type="button"
                onClick={() => setFshowPass(s => !s)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--text3)",
                  cursor: "pointer",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-sm)",
                  minWidth: 34,
                  minHeight: 34,
                }}
              >
                <Icon name={fshowPass ? "eyeOff" : "eye"} size={16} color="var(--text3)" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Email (optional)</label>
          <input type="email" value={femail} onChange={e => setFemail(e.target.value)} placeholder="email@brightsky.com" style={{ fontSize: 16 }} autoCorrect="off" autoCapitalize="off" autoComplete="off" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Department</label>
            <input type="text" value={fdept} onChange={e => setFdept(e.target.value)} placeholder="Construction" style={{ fontSize: 16 }} autoCorrect="off" autoComplete="off" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Designation</label>
            <input type="text" value={fdesig} onChange={e => setFdesig(e.target.value)} placeholder="Site Worker" style={{ fontSize: 16 }} autoCorrect="off" autoComplete="off" />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Employee Code</label>
          <input type="text" value={fcode} onChange={e => setFcode(e.target.value)} placeholder="BSC-012" style={{ fontSize: 16 }} autoCorrect="off" autoCapitalize="characters" autoComplete="off" />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Role</label>
          <select value={frole} onChange={e => setFrole(e.target.value)} style={{ fontSize: 16 }}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Timezone</label>
          <select value={ftz} onChange={e => setFtz(e.target.value)} style={{ fontSize: 16 }}>
            <option value="America/New_York">🇺🇸 Atlanta (UTC-4/5)</option>
            <option value="Asia/Kolkata">🇮🇳 Kolkata (UTC+5:30)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Work Mode</label>
          <select value={fworkMode} onChange={e => setFworkMode(e.target.value)} style={{ fontSize: 16 }}>
            <option value="onsite">🏗️ On-Site</option>
            <option value="offsite">📍 Off-Site</option>
          </select>
        </div>
      </div>

      <Btn onClick={handleAdd} loading={saving} style={{ width: "100%" }}>
        <Icon name="check" size={14} color="white" />Add Employee
      </Btn>
    </Card>
  );
}


  // ─── EMPLOYEE LIST ────────────────────────────────────────────────────────────
function EmployeeList({ adminData, refreshAdminData, addToast, worksites, t }) {
  const [search, setSearch] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("all"); // "all" | "onsite" | "offsite"
  const [adding, setAdding] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);

  const startRef = useRef(null), endRef = useRef(null), graceRef = useRef(null);
  const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
  if (scheduleData && scheduleData.working_days) {
    setSelectedDays(scheduleData.working_days);
  } else if (scheduleData && !scheduleData.working_days) {
    setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]); // fallback
  }
}, [scheduleData]);

  const employees = adminData.employees.filter(u => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id?.includes(search);
    const matchMode =
      workModeFilter === "all" ||
      (workModeFilter === "onsite"  && (u.work_mode || "onsite") === "onsite") ||
      (workModeFilter === "offsite" && u.work_mode === "offsite");
    return matchSearch && matchMode;
  });

  const handleDelete = async (uid) => {
    if (!confirm("Deactivate this employee?")) return;
    await authFetch(`/api/admin/employees/${uid}`, { method: "DELETE" });
    addToast("Deactivated.", "info");
    refreshAdminData();
  };

  const openSchedule = async (emp) => {
  setLoadingSchedule(true);
  setEditingSchedule(emp);
  try {
    const r = await authFetch(`/api/employees/${emp.id}/schedule`);
    if (r.ok) {
      const d = await r.json();
      setScheduleData(d);
    } else {
      setScheduleData(null);
    }
  } catch {
    setScheduleData(null);
  }
  setLoadingSchedule(false);
};

const saveSchedule = async () => {
  if (!editingSchedule) return;
  setSavingSchedule(true);
  try {
    const res = await authFetch(`/api/employees/${editingSchedule.id}/schedule`, {
      method: "PUT",
      body: JSON.stringify({
        scheduledStartTime: startRef.current?.value || "07:00",
        scheduledEndTime: endRef.current?.value || "17:00",
        graceMinutes: parseInt(graceRef.current?.value) || 15,
        workingDays: selectedDays,
      })
    });
    if (!res.ok) {
      addToast("Failed to save schedule.", "error");
      return;
    }
    addToast("Schedule saved.", "success");
    setEditingSchedule(null);
  } catch (err) {
    addToast("Network error", "error");
  } finally {
    setSavingSchedule(false);
  }
};

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setEditForm({
      name: emp.name,
      email: emp.email || "",
      role: emp.role,
      department: emp.department || "",
      designation: emp.designation || "",
      employeeCode: emp.employee_code || "",
      phone: emp.phone || "",
      joinedAt: emp.joined_at?.slice(0,10) || "",
      userId: emp.user_id || "",
      workMode: emp.work_mode || "onsite",
    });
  };

  const saveEmployeeDetails = async () => {
    const res = await authFetch(`/api/admin/employees/${editingEmployee.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...editForm, workMode: editForm.workMode || "onsite" })
    });
    if (res.ok) {
      addToast("Employee details updated", "success");
      setEditingEmployee(null);
      refreshAdminData();
    } else {
      addToast("Failed to update", "error");
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      addToast("Password must be at least 4 characters", "error");
      return;
    }
    const res = await authFetch(`/api/admin/employees/${editingEmployee.id}/password`, {
      method: "PUT",
      body: JSON.stringify({ newPassword })
    });
    if (res.ok) {
      addToast("Password changed", "success");
      setShowPasswordModal(false);
      setNewPassword("");
    } else {
      addToast("Failed to change password", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader
        title={t.employees}
        subtitle={`${employees.length} team members`}
        action={
          <Btn onClick={() => setAdding(a => !a)} variant={adding ? "secondary" : "primary"} size="sm">
            {adding ? t.cancel : <><Icon name="plus" size={13} color="white" />{t.add}</>}
          </Btn>
        }
      />
      {adding && <AddEmployeeForm onDone={() => { setAdding(false); refreshAdminData(); }} addToast={addToast} refreshAdminData={refreshAdminData} />}
      <Card>
        {/* Work-mode filter pills */}
        <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
          {[["all","All"],["onsite","🏗️ On-Site"],["offsite","📍 Off-Site"]].map(([v,l])=>(
            <button key={v} onClick={() => setWorkModeFilter(v)} style={{
              padding:"5px 12px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer",
              border: workModeFilter===v ? "none" : "1px solid var(--border)",
              background: workModeFilter===v
                ? (v==="offsite" ? "var(--amber)" : v==="onsite" ? "var(--green)" : "var(--blue)")
                : "var(--bg3)",
              color: workModeFilter===v ? "#fff" : "var(--text3)",
              transition:"all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, code, or User ID…"
          style={{ marginBottom: 14, fontSize: 16 }}
          autoCorrect="off"
          autoComplete="off"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {employees.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text4)", padding: 24, fontSize: 13.5 }}>No employees found.</div>
          ) : (
            employees.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "var(--bg3)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid var(--blue-mid)" }}>
                  <Icon name="user" size={17} color="var(--blue)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{u.name || u.full_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>{u.email || ""}{u.department ? ` · ${u.department}` : ""}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5, alignItems: "center" }}>
                    {u.user_id && <span style={{ background: "var(--blue-light)", color: "var(--blue)", padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, border: "1px solid var(--blue-mid)" }}>ID: {u.user_id}</span>}
                    <span style={{ background: "var(--bg2)", color: "var(--text3)", padding: "2px 8px", borderRadius: 999, fontSize: 11.5, textTransform: "capitalize", border: "1px solid var(--border)" }}>{u.role}</span>
                    {/* Work mode badge */}
                    <span style={{
                      padding:"2px 8px", borderRadius:999, fontSize:11.5, fontWeight:600,
                      background: u.work_mode==="offsite" ? "var(--amber-light)" : "var(--green-light)",
                      color: u.work_mode==="offsite" ? "var(--amber)" : "var(--green)",
                      border: `1px solid ${u.work_mode==="offsite" ? "rgba(217,119,6,0.3)" : "rgba(5,150,105,0.25)"}`,
                    }}>{u.work_mode==="offsite" ? "📍 Off-Site" : "🏗️ On-Site"}</span>
                    <select
                      value={u.timezone || "America/New_York"}
                      onChange={async (e) => {
                        const newTz = e.target.value;
                        const res = await authFetch(`/api/admin/users/${u.id}/timezone`, {
                          method: "PUT",
                          body: JSON.stringify({ timezone: newTz })
                        });
                        if (res.ok) {
                          addToast("Timezone updated", "success");
                          refreshAdminData();
                        } else {
                          addToast("Failed to update timezone", "error");
                        }
                      }}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid var(--border)",
                        background: "var(--bg2)",
                        color: "var(--text)",
                        cursor: "pointer",
                        height: "28px",
                      }}
                    >
                      <option value="America/New_York">🇺🇸 Atlanta</option>
                      <option value="Asia/Kolkata">🇮🇳 Kolkata</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEditModal(u)} style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--blue-light)", border: "1px solid var(--blue-mid)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Icon name="edit" size={14} color="var(--blue)" />
                  </button>
                  <button onClick={() => openSchedule(u)} style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--blue-light)", border: "1px solid var(--blue-mid)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Icon name="clock" size={14} color="var(--blue)" />
                  </button>
                  <button onClick={() => handleDelete(u.id)} style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--red-light)", border: "1px solid rgba(220,38,38,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Icon name="x" size={14} color="var(--red)" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Schedule Modal */}
      {editingSchedule && (
  <Modal title={`Schedule for ${editingSchedule.name}`} onClose={() => setEditingSchedule(null)}>
    {loadingSchedule ? (
      <div style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>Loading schedule…</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Time inputs */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Start Time</label>
          <input
            type="time"
            ref={startRef}
            defaultValue={scheduleData?.scheduled_start_time?.slice(0,5) || "07:00"}
            style={{ fontSize: 16 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>End Time</label>
          <input
            type="time"
            ref={endRef}
            defaultValue={scheduleData?.scheduled_end_time?.slice(0,5) || "17:00"}
            style={{ fontSize: 16 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Grace Period (minutes)</label>
          <input
            type="number"
            ref={graceRef}
            defaultValue={scheduleData?.grace_minutes || 15}
            min={0}
            step={1}
            style={{ fontSize: 16 }}
          />
        </div>
        {/* Working days checkboxes */}
        <div>
  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Working Days</label>
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
      <label
        key={day}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          userSelect: "none",
          minWidth: 60,
          padding: "4px 8px",
          borderRadius: "var(--radius-sm)",
          background: selectedDays.includes(day) ? "var(--blue-light)" : "var(--bg3)",
          border: `1px solid ${selectedDays.includes(day) ? "var(--blue-mid)" : "var(--border)"}`,
          transition: "all 0.2s",
        }}
      >
        <input
          type="checkbox"
          checked={selectedDays.includes(day)}
          onChange={() => {
            if (selectedDays.includes(day)) {
              setSelectedDays(selectedDays.filter(d => d !== day));
            } else {
              setSelectedDays([...selectedDays, day]);
            }
          }}
          style={{
            width: 16,
            height: 16,
            margin: 0,
            cursor: "pointer",
            accentColor: "var(--blue)",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 500, color: selectedDays.includes(day) ? "var(--blue)" : "var(--text2)" }}>
          {day}
        </span>
      </label>
    ))}
  </div>
</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn onClick={saveSchedule} loading={savingSchedule} style={{ flex: 1 }}>
            <Icon name="check" size={14} color="white" /> Save
          </Btn>
          <Btn onClick={() => setEditingSchedule(null)} variant="secondary" style={{ flex: 1 }}>
            Cancel
          </Btn>
        </div>
      </div>
    )}
  </Modal>
)}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <Modal title={`Edit ${editingEmployee.name}`} onClose={() => setEditingEmployee(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Full Name</label><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ fontSize: 16 }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>User ID (4-char)</label>
              <input type="text" value={editForm.userId} onChange={e => setEditForm({...editForm, userId: e.target.value.toUpperCase().slice(0,4)})} placeholder="Auto" maxLength={4} style={{ fontSize: 16, textAlign: "center", letterSpacing: "0.15em" }} autoCorrect="off" autoCapitalize="off" autoComplete="off" />
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={{ fontSize: 16 }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Role</label>
              <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ fontSize: 16 }}>
                <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Department</label><input type="text" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} style={{ fontSize: 16 }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Designation</label><input type="text" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} style={{ fontSize: 16 }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Employee Code</label><input type="text" value={editForm.employeeCode} onChange={e => setEditForm({...editForm, employeeCode: e.target.value})} style={{ fontSize: 16 }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Phone</label><input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ fontSize: 16 }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Joined At</label><input type="date" value={editForm.joinedAt} onChange={e => setEditForm({...editForm, joinedAt: e.target.value})} style={{ fontSize: 16 }} /></div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display:"block", marginBottom:5 }}>Work Mode</label>
              <select value={editForm.workMode || "onsite"} onChange={e => setEditForm({...editForm, workMode: e.target.value})} style={{ fontSize: 16 }}>
                <option value="onsite">🏗️ On-Site</option>
                <option value="offsite">📍 Off-Site</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={saveEmployeeDetails} variant="primary" style={{ flex: 1 }}>Save Changes</Btn>
              <Btn onClick={() => setShowPasswordModal(true)} variant="secondary" style={{ flex: 1 }}>Change Password</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <Modal title="Change Password" onClose={() => { setShowPasswordModal(false); setNewPassword(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="password" placeholder="New password (min 4 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ fontSize: 16 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={changePassword} variant="primary" style={{ flex: 1 }}>Update Password</Btn>
              <Btn onClick={() => setShowPasswordModal(false)} variant="secondary" style={{ flex: 1 }}>Cancel</Btn>
            </div>
          </div>
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
    <Modal title="Take a photo at your job site" onClose={onClose}>
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
function AttendancePage({ adminData, t }) {
  const [empFilter, setEmpFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [sessionPunches, setSessionPunches] = useState({});

  const fetch_ = useCallback(async () => {
    const p = new URLSearchParams();
    if (empFilter !== "all") p.set("user_id", empFilter);
    if (dateFrom) p.set("date_from", dateFrom);
    if (dateTo) p.set("date_to", dateTo);
    setLoading(true);
    try {
      const r = await authFetch(`/api/admin/attendance?${p}`);
      const d = await r.json();
      setRecords(Array.isArray(d?.sessions) ? d.sessions : []);
    } catch {}
    setLoading(false);
  }, [empFilter, dateFrom, dateTo]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => { const iv = setInterval(fetch_, 30000); return () => clearInterval(iv); }, [fetch_]);

  const toggleSession = async (sessionId) => {
    if (expandedSessionId === sessionId) { setExpandedSessionId(null); return; }
    setExpandedSessionId(sessionId);
    if (!sessionPunches[sessionId]) {
      try {
        const res = await authFetch(`/api/admin/attendance/session/${sessionId}/punches`);
        const data = await res.json();
        setSessionPunches(prev => ({ ...prev, [sessionId]: Array.isArray(data) ? data : [] }));
      } catch (err) {
        console.error("Failed to fetch punches", err);
        setSessionPunches(prev => ({ ...prev, [sessionId]: [] }));
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader
        title={t.attendance}
        subtitle={`${records.length} records`}
        action={<Btn onClick={fetch_} variant="secondary" size="sm" loading={loading}><Icon name="refresh" size={13} />{t.refresh}</Btn>}
      />
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ fontSize: 16 }}>
            <option value="all">All Employees</option>
            {adminData.employees.map(u => (
              <option key={u.id} value={u.id}>{u.name}{u.user_id ? ` (${u.user_id})` : ""}</option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ fontSize: 16 }} />
            <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ fontSize: 16 }} />
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>Loading...</div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Hours</th>
                  <th>Regular Hours</th>
                  <th>Overtime Hours</th>
                  <th>Status</th>
                  <th>More Details</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--text4)", padding: 24 }}>No records found.</td>
                  </tr>
                ) : (
                  records.map(s => (
                    <>
                      <tr key={s.id}>
                        <td style={{ color: "var(--text)", fontWeight: 600, fontSize: 13.5 }}>
                          {s.name || "—"}
                          {s.work_mode === "offsite" && (
                            <span style={{ marginLeft: 5, fontSize: 10, background: "var(--amber-light)", color: "var(--amber)", padding: "1px 5px", borderRadius: 999, border: "1px solid rgba(217,119,6,0.25)", verticalAlign: "middle" }}>📍 Off-Site</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12.5 }}>{fmtDate(s.work_date)}</td>
                        <td style={{ fontSize: 12.5 }}>{fmtTime(s.clock_in_time)}</td>
                        <td style={{ fontSize: 12.5 }}>{fmtTime(s.clock_out_time)}</td>
                        <td style={{ color: s.is_overtime ? "var(--orange)" : "var(--green)", fontWeight: 600, fontSize: 13 }}>
                          {s.status === "active" && s.clock_in_time
                            ? fmtMins(Math.max(0, Math.round((Date.now() - new Date(s.clock_in_time).getTime()) / 60000) - (parseInt(s.break_minutes) || 0)))
                            : fmtMins(s.worked_minutes)}
                          {s.is_overtime && " 🔥"}
                        </td>
                        <td style={{ fontSize: 12.5 }}>{fmtMins(s.regular_minutes || 0)}</td>
                        <td style={{ fontSize: 12.5, color: (s.overtime_minutes || 0) > 0 ? "var(--orange)" : "var(--text3)" }}>
                          {fmtMins(s.overtime_minutes || 0)}
                        </td>
                        <td>
                          <StatusBadge status={s.status === "completed" ? "clocked_out" : s.is_overtime ? "overtime" : "clocked_in"} />
                          {s.is_outside_geofence && <div style={{ marginTop: 4 }}><WarnBadge /></div>}
                          {s.is_outside_geofence && s.estimated_minutes != null && (
                            <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 3, whiteSpace: "nowrap" }}>
                              Est: {fmtMins(s.estimated_minutes)}
                              {(s.worked_minutes || 0) > s.estimated_minutes &&
                                <span style={{ color: "var(--red)", marginLeft: 4 }}>▲{fmtMins((s.worked_minutes || 0) - s.estimated_minutes)}</span>
                              }
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => toggleSession(s.id)}
                            style={{
                              background: expandedSessionId === s.id ? "var(--blue)" : "var(--blue-light)",
                              color: expandedSessionId === s.id ? "#fff" : "var(--blue)",
                              border: "1px solid var(--blue-mid)",
                              borderRadius: "var(--radius-sm)",
                              padding: "4px 10px",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {expandedSessionId === s.id ? "Hide" : "Show Details"}
                          </button>
                        </td>
                      </tr>
                      {expandedSessionId === s.id && sessionPunches[s.id] && (
                        <tr>
                          <td colSpan={9} style={{ padding: "14px 16px", background: "var(--bg3)", borderTop: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                              <span>🧾 Full Record — {s.name}</span>
                              {s.employee_code && <span style={{ fontWeight: 400, color: "var(--text3)" }}>({s.employee_code})</span>}
                              <span style={{ fontWeight: 400, color: "var(--text3)" }}>· {fmtDate(s.work_date)}</span>
                            </div>
                            <SessionDetailPanel session={s} punches={sessionPunches[s.id]} isAdmin={true} />
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


// ─── REPORTS PAGE (Interactive Charts) ───────────────────────────────────────
function ReportsPage({t}){
  const[summary,setSummary]=useState([]);
  const[allRecords,setAllRecords]=useState([]);
  const[loading,setLoading]=useState(true);
  const[period,setPeriod]=useState("month"); // week | month | all
  const[chartView,setChartView]=useState("employees"); // employees | weekdays | month

  const fetchAll = useCallback(async () => {
  setLoading(true);
  try {
    const timestamp = Date.now();
    const [sumRes, recRes] = await Promise.all([
      authFetch(`/api/admin/reports/summary?_=${timestamp}`),
      authFetch(`/api/admin/attendance?_=${timestamp}`),
    ]);
      if(sumRes.ok){const d=await sumRes.json();setSummary(Array.isArray(d?.summary)?d.summary:[]);}
      if(recRes.ok){const d=await recRes.json();setAllRecords(Array.isArray(d?.sessions)?d.sessions:[]);}
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
  regularMins: 0,
  overtimeMins: 0,
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
  acc[r.user_id].regularMins += parseInt(r.regular_minutes) || 0;
  acc[r.user_id].overtimeMins += parseInt(r.overtime_minutes) || 0;
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
  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
    Employee Breakdown
  </h3>
  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
    <table style={{ minWidth: 600 }}>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Sessions</th>
          <th>Total Hrs</th>
          <th>Regular Hrs</th>
          <th>Overtime Hrs</th>
          <th>Avg/Session</th>
          <th>Personal Break</th>
          <th>Work Break</th>
        </tr>
      </thead>
      <tbody>
        {empData.map((s, i) => (
          <tr key={i}>
            <td>
              <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13.5 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 1 }}>{s.userId}</div>
            </td>
            <td style={{ fontWeight: 600, color: "var(--text2)" }}>{s.sessions}</td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden", minWidth: 40 }}>
                  <div
                    style={{
                      height: "100%",
                      background: "var(--blue)",
                      borderRadius: 3,
                      width: `${Math.min(100, (s.minutes / (empData[0]?.minutes || 1)) * 100)}%`,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: 13, minWidth: 32 }}>
                  {Math.round(s.minutes / 60)}h
                </span>
              </div>
            </td>
            <td style={{ color: "var(--green)", fontWeight: 600 }}>
              {Math.round(s.regularMins / 60)}h
            </td>
            <td style={{ color: s.overtimeMins > 0 ? "var(--orange)" : "var(--text3)", fontWeight: 600 }}>
              {Math.round(s.overtimeMins / 60)}h
            </td>
            <td style={{ color: "var(--text2)", fontWeight: 500 }}>
              {fmtMins(s.sessions > 0 ? Math.round(s.minutes / s.sessions) : 0)}
            </td>
            <td style={{ color: "var(--text3)", fontSize: 12 }}>
              {fmtMins(s.personalBreakMins)}
            </td>
            <td style={{ color: "var(--text3)", fontSize: 12 }}>
              {fmtMins(s.workBreakMins)}
            </td>
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
function SettingsPage({ settings, addToast, refreshSettings, t }) {
  const [saving, setSaving] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(settings.clockInWithCameraEnabled ?? true);

  useEffect(() => {
  setCameraEnabled(settings.clockInWithCameraEnabled ?? true);
}, [settings]);

  const companyRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);

  const handleSave = async () => {
    setSaving(true);
    const res = await authFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        companyName: companyRef.current?.value,
        siteName: settings.siteName,
        latitude: settings.latitude,
        longitude: settings.longitude,
        radiusFeet: settings.radiusFeet,
        workingHoursStart: startRef.current?.value,
        workingHoursEnd: endRef.current?.value,
        clockInWithCameraEnabled: cameraEnabled, // new field
        // remove other automation booleans
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      addToast(d.error || "Failed.", "error");
      setSaving(false);
      return;
    }
    localStorage.removeItem("bsc_settings");
    await refreshSettings();
    addToast("Settings saved.", "success");
    setSaving(false);
  };

  const Toggle = ({ label, value, onChange, desc }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 3, lineHeight: 1.5, fontWeight: 400 }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
          background: value ? "var(--blue)" : "var(--border2)", position: "relative",
          transition: "background 0.2s", flexShrink: 0, minWidth: 48,
          boxShadow: value ? "0 1px 4px rgba(37,99,235,0.3)" : "none"
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3,
          left: value ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)"
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader title={t.settings} subtitle="Company information and automation rules" />
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-lg)", background: "var(--blue-light)", border: "1.5px solid var(--blue-mid)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Icon name="pin" size={15} color="var(--blue)" style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "var(--blue)", lineHeight: 1.5, fontWeight: 450 }}>
          Job site locations are managed in the <strong>Job Sites</strong> section. Each employee can be assigned to one or more job sites with individual geofence settings.
        </div>
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--blue-mid)" }}>
            <Icon name="building" size={15} color="var(--blue)" />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Company</h3>
        </div>
        <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Company Name</label>
        <input type="text" ref={companyRef} defaultValue={settings.companyName || ""} placeholder="Company name" style={{ fontSize: 16 }} autoCorrect="off" />
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--blue-mid)" }}>
            <Icon name="clock" size={15} color="var(--blue)" />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Default Work Schedule</h3>
        </div>
        <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 14, fontWeight: 400 }}>Default for all employees. Override individually in the Employees section.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Start Time</label>
            <input type="time" ref={startRef} defaultValue={settings.workStart || "07:00"} style={{ fontSize: 16 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>End Time</label>
            <input type="time" ref={endRef} defaultValue={settings.workEnd || "17:00"} style={{ fontSize: 16 }} />
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(5,150,105,0.2)" }}>
            <Icon name="camera" size={15} color="var(--green)" />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Clock‑in Requirements</h3>
        </div>
        <Toggle
  label="Clock In with Camera"
  value={cameraEnabled}
  onChange={setCameraEnabled}
  desc="Require employees to take a selfie when clocking in at the job site."
/>
      </Card>

      <Btn onClick={handleSave} loading={saving} size="lg" style={{ width: "100%" }}>
        <Icon name="check" size={15} color="white" /> {t.save} Settings
      </Btn>
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
    try{
      const p=new URLSearchParams();
      if(empFilter!=="all")p.set("user_id",empFilter);
      if(dateFrom)p.set("date_from",dateFrom);
      if(dateTo)p.set("date_to",dateTo);
      const res=await authFetch(`/api/export/csv?${p}`);
      if(!res.ok)throw new Error("Export failed");
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`attendance_export_${new Date().toISOString().slice(0,10)}.csv`;a.click();
      URL.revokeObjectURL(url);addToast("Export downloaded.","success");
    }catch(e){addToast(e.message||"Export failed.","error");}
    setLoading(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHeader title={t.export} subtitle="Download attendance records as CSV"/>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>Employee</label>
            <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} style={{fontSize:14}}>
              <option value="all">All Employees</option>
              {adminData.employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div/>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>From</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{fontSize:14}}/>
          </div>
          <div><label style={{fontSize:12,color:"var(--text2)",display:"block",marginBottom:6,fontWeight:600}}>To</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{fontSize:14}}/>
          </div>
        </div>
        <Btn onClick={handleExport} loading={loading} size="lg" style={{width:"100%"}}>
          <Icon name="download" size={15} color="white"/> Download CSV
        </Btn>
      </Card>
    </div>
  );
}

// ─── FUEL ENTRY MODULE ────────────────────────────────────────────────────────
// Equipment master list (source of truth from company reference image)
const EQUIPMENT_LIST = [
  { id:"eq1",  brand:"Muller",      model:"VAP-70pt",  year:null,  type:"vac_excavator",   emoji:"🚛", color:"#f59e0b" },
  { id:"eq2",  brand:"Caterpillar", model:"289D",      year:2018,  type:"compact_track",   emoji:"🟡", color:"#f59e0b" },
  { id:"eq3",  brand:"John Deere",  model:"26G",       year:2016,  type:"mini_excavator",  emoji:"🟢", color:"#16a34a" },
  { id:"eq4",  brand:"Komatsu",     model:"PC 360",    year:2014,  type:"excavator",       emoji:"🔵", color:"#2563eb" },
  { id:"eq5",  brand:"Caterpillar", model:"953C",      year:2002,  type:"track_loader",    emoji:"🟡", color:"#f59e0b" },
  { id:"eq6",  brand:"Ditch Witch", model:"4010 DD",   year:2016,  type:"directional_drill",emoji:"🔴",color:"#dc2626" },
  { id:"eq7",  brand:"Utility",     model:"Trailer",   year:null,  type:"trailer",         emoji:"🔲", color:"#6b7280" },
  { id:"eq8",  brand:"Enclosed",    model:"Trailer",   year:null,  type:"trailer",         emoji:"🔲", color:"#6b7280" },
  { id:"eq9",  brand:"Dump Truck",  model:"",          year:null,  type:"truck",           emoji:"🚚", color:"#7c3aed" },
  { id:"eq10", brand:"International",model:"",         year:null,  type:"truck",           emoji:"🚚", color:"#7c3aed" },
];

// Equipment SVG thumbnails
function EquipmentThumb({ type, color, size = 56 }) {
  const thumbs = {
    excavator: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="4" y="30" width="30" height="14" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <rect x="8" y="22" width="20" height="12" rx="2" fill={color} opacity="0.25" stroke={color} strokeWidth="1.2"/>
        <rect x="10" y="14" width="8" height="10" rx="1.5" fill={color} opacity="0.4"/>
        <path d="M18 18 Q30 10 44 16 L46 24 Q34 18 20 26Z" fill={color} opacity="0.5"/>
        <path d="M44 16 L54 22 L52 28 L42 22Z" fill={color} opacity="0.6"/>
        <circle cx="10" cy="44" r="5" fill={color} opacity="0.7"/>
        <circle cx="28" cy="44" r="5" fill={color} opacity="0.7"/>
        <rect x="4" y="40" width="30" height="4" rx="2" fill={color} opacity="0.3"/>
      </svg>
    ),
    compact_track: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="6" y="26" width="52" height="14" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <rect x="14" y="14" width="24" height="14" rx="2" fill={color} opacity="0.3" stroke={color} strokeWidth="1.2"/>
        <rect x="16" y="10" width="16" height="8" rx="2" fill={color} opacity="0.5"/>
        <path d="M36 20 L52 18 L54 26 L36 26Z" fill={color} opacity="0.5"/>
        <circle cx="12" cy="40" r="5" fill={color} opacity="0.7"/>
        <circle cx="52" cy="40" r="5" fill={color} opacity="0.7"/>
        <rect x="6" y="38" width="52" height="4" rx="2" fill={color} opacity="0.25"/>
      </svg>
    ),
    mini_excavator: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="8" y="28" width="28" height="12" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <rect x="12" y="18" width="16" height="12" rx="2" fill={color} opacity="0.3"/>
        <rect x="14" y="12" width="10" height="8" rx="1.5" fill={color} opacity="0.5"/>
        <path d="M20 16 Q32 8 42 14 L44 22 Q32 16 22 24Z" fill={color} opacity="0.5"/>
        <path d="M42 14 L52 20 L50 26 L40 20Z" fill={color} opacity="0.6"/>
        <circle cx="12" cy="40" r="4" fill={color} opacity="0.7"/>
        <circle cx="28" cy="40" r="4" fill={color} opacity="0.7"/>
        <rect x="8" y="38" width="28" height="3" rx="1.5" fill={color} opacity="0.3"/>
      </svg>
    ),
    track_loader: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="4" y="28" width="40" height="14" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <rect x="10" y="16" width="22" height="14" rx="2" fill={color} opacity="0.3"/>
        <path d="M4 28 L4 20 L10 16 L10 28Z" fill={color} opacity="0.4"/>
        <path d="M4 20 Q0 16 0 12 L8 10 L10 16Z" fill={color} opacity="0.5"/>
        <circle cx="10" cy="42" r="5" fill={color} opacity="0.7"/>
        <circle cx="34" cy="42" r="5" fill={color} opacity="0.7"/>
        <rect x="4" y="39" width="36" height="4" rx="2" fill={color} opacity="0.25"/>
      </svg>
    ),
    directional_drill: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="8" y="24" width="40" height="14" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <rect x="14" y="14" width="20" height="12" rx="2" fill={color} opacity="0.3"/>
        <path d="M48 28 L60 26 L62 32 L48 34Z" fill={color} opacity="0.5"/>
        <path d="M60 29 L64 28 L64 30Z" fill={color} opacity="0.7"/>
        <circle cx="14" cy="38" r="5" fill={color} opacity="0.7"/>
        <circle cx="42" cy="38" r="5" fill={color} opacity="0.7"/>
        <rect x="8" y="36" width="40" height="4" rx="2" fill={color} opacity="0.25"/>
      </svg>
    ),
    truck: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="2" y="22" width="42" height="18" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <rect x="4" y="14" width="22" height="10" rx="2" fill={color} opacity="0.35"/>
        <rect x="44" y="26" width="18" height="12" rx="2" fill={color} opacity="0.2" stroke={color} strokeWidth="1.2"/>
        <path d="M44 26 L40 20 L44 18 L62 20 L62 26Z" fill={color} opacity="0.35"/>
        <rect x="6" y="16" width="8" height="6" rx="1" fill="#bfdbfe" opacity="0.7"/>
        <circle cx="12" cy="40" r="6" fill={color} opacity="0.7"/>
        <circle cx="36" cy="40" r="6" fill={color} opacity="0.7"/>
        <circle cx="54" cy="40" r="6" fill={color} opacity="0.7"/>
      </svg>
    ),
    trailer: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="6" y="20" width="52" height="18" rx="3" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5"/>
        <rect x="8" y="22" width="48" height="14" rx="2" fill={color} opacity="0.15"/>
        <line x1="20" y1="22" x2="20" y2="36" stroke={color} strokeWidth="1" opacity="0.4"/>
        <line x1="34" y1="22" x2="34" y2="36" stroke={color} strokeWidth="1" opacity="0.4"/>
        <line x1="48" y1="22" x2="48" y2="36" stroke={color} strokeWidth="1" opacity="0.4"/>
        <circle cx="16" cy="42" r="5" fill={color} opacity="0.6"/>
        <circle cx="48" cy="42" r="5" fill={color} opacity="0.6"/>
        <rect x="2" y="30" width="8" height="4" rx="1" fill={color} opacity="0.4"/>
      </svg>
    ),
    vac_excavator: (
      <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size * 0.75}>
        <rect x="4" y="24" width="44" height="16" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <rect x="10" y="12" width="24" height="14" rx="2" fill={color} opacity="0.25"/>
        <ellipse cx="34" cy="16" rx="8" ry="10" fill={color} opacity="0.2" stroke={color} strokeWidth="1.2"/>
        <rect x="32" y="6" width="4" height="6" rx="1" fill={color} opacity="0.5"/>
        <path d="M48 26 L58 24 L60 30 L48 32Z" fill={color} opacity="0.4"/>
        <circle cx="12" cy="42" r="5" fill={color} opacity="0.7"/>
        <circle cx="36" cy="42" r="5" fill={color} opacity="0.7"/>
        <rect x="4" y="40" width="40" height="4" rx="2" fill={color} opacity="0.25"/>
      </svg>
    ),
  };
  return thumbs[type] || thumbs["truck"];
}

// Fuel gauge visual
function FuelGauge({ level, size = 80 }) {
  const pct = Math.max(0, Math.min(100, level || 0));
  const angle = -135 + (pct / 100) * 270;
  const rad = angle * Math.PI / 180;
  const cx = 50, cy = 54, r = 36;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);
  const color = pct > 50 ? "#059669" : pct > 25 ? "#d97706" : "#dc2626";
  const bgArc = `M ${cx + r * Math.cos(-135 * Math.PI/180)} ${cy + r * Math.sin(-135 * Math.PI/180)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(135 * Math.PI/180)} ${cy + r * Math.sin(135 * Math.PI/180)}`;
  const fillAngle = -135 + (pct / 100) * 270;
  const fillRad = fillAngle * Math.PI / 180;
  const large = pct > 50 ? 1 : 0;
  const fillArc = `M ${cx + r * Math.cos(-135 * Math.PI/180)} ${cy + r * Math.sin(-135 * Math.PI/180)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(fillRad)} ${cy + r * Math.sin(fillRad)}`;
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 100 72">
      <path d={bgArc} fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round"/>
      {pct > 0 && <path d={fillArc} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"/>}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="4" fill="#374151"/>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
      <text x={cx - r - 2} y={cy + 4} textAnchor="middle" fontSize="7" fill="#9ca3af">E</text>
      <text x={cx + r + 2} y={cy + 4} textAnchor="middle" fontSize="7" fill="#9ca3af">F</text>
    </svg>
  );
}

// Bar chart for fuel dashboard — with value labels above bars
function FuelBarChart({ data, height = 140, color = "var(--blue)" }) {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length === 0 || data.every(d => d.value === 0)) return (
    <div style={{ height, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text4)", fontSize:13, gap:6 }}>
      <span style={{ fontSize:22, opacity:0.4 }}>📊</span>
      <span>No data yet</span>
    </div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  const LABEL_H = 18; // px reserved for value label above bar
  const XAXIS_H = 20; // px reserved for x-axis label below
  const barAreaH = height - LABEL_H - XAXIS_H;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, paddingTop: 0, position: "relative" }}>
      {data.map((d, i) => {
        const barH = d.value > 0 ? Math.max(4, (d.value / max) * barAreaH) : 0;
        const isHov = hovered === i;
        const label = d.value >= 1000 ? `${(d.value/1000).toFixed(1)}k` : d.value > 0 ? String(d.value) : "";
        return (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", cursor: "default", position: "relative" }}>
            {/* Tooltip on hover */}
            {isHov && (
              <div style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", background: "rgba(15,20,30,0.88)", color: "white", fontSize: 11.5, fontWeight: 700, padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>
                {d.label}: {d.value}
              </div>
            )}
            {/* Value label area */}
            <div style={{ height: LABEL_H, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: d.value > 0 ? color : "transparent", transition: "color 0.2s" }}>{label}</span>
            </div>
            {/* Bar */}
            <div style={{ height: barAreaH, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div style={{ width: "100%", background: isHov ? color : color, borderRadius: "4px 4px 0 0", height: barH, opacity: isHov ? 1 : 0.75, transition: "all 0.3s ease", boxShadow: isHov ? `0 2px 8px ${color}55` : "none" }}/>
            </div>
            {/* X-axis label */}
            <div style={{ height: XAXIS_H, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", fontWeight: isHov ? 700 : 400 }}>{d.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// =============================================================================
// fuel_v2_appendix.jsx
// New / replaced components for the Fuel Entry module v2
//
// Components:
//   1. FuelJobSiteSelector  (full replacement — adds live distance display)
//   2. FuelJobSitesAdmin    (new — Leaflet map, address search, CRUD)
//   3. FuelHistoryView      (new — rich history with on/off-site badges + details)
// =============================================================================

// ─── 1. UPDATED JOB SITE SELECTOR ─────────────────────────────────────────────
// Adds live distance display (ft / mi) in top-right of the card.
function FuelJobSiteSelector({ jobSites, selectedJobSite, setSelectedJobSite, isOnSite, setIsOnSite, gpsForDistance, setGpsForDistance }) {
  const [checking, setChecking] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [distanceDisplay, setDistanceDisplay] = useState(null); // e.g. "328 ft" or "1.2 mi"

  const selectedSite = jobSites.find(s => s.id === selectedJobSite);

  // Haversine distance in feet
  const distanceFeet = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8 * 5280;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const formatDist = (ft) => ft < 1000 ? `${Math.round(ft)} ft` : `${(ft/5280).toFixed(1)} mi`;

  // Recompute distance when site or GPS changes
  useEffect(() => {
    if (gpsForDistance && selectedSite && selectedSite.latitude && selectedSite.longitude) {
      const d = distanceFeet(gpsForDistance.lat, gpsForDistance.lon, parseFloat(selectedSite.latitude), parseFloat(selectedSite.longitude));
      setDistanceDisplay(formatDist(d));
      const radius = selectedSite.geofence_radius_ft || 1000;
      setIsOnSite(d <= radius);
    } else {
      setDistanceDisplay(null);
    }
  }, [gpsForDistance, selectedJobSite]);

  const checkGps = () => {
    setGpsError(null);
    setChecking(true);
    if (!navigator.geolocation) { setGpsError("GPS not supported on this device."); setChecking(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const gps = { lat: latitude, lon: longitude };
        if (setGpsForDistance) setGpsForDistance(gps);
        if (selectedSite && selectedSite.latitude && selectedSite.longitude) {
          const radius = selectedSite.geofence_radius_ft || 1000;
          const dist = distanceFeet(latitude, longitude, parseFloat(selectedSite.latitude), parseFloat(selectedSite.longitude));
          setDistanceDisplay(formatDist(dist));
          setIsOnSite(dist <= radius);
        } else {
          setIsOnSite(null);
        }
        setChecking(false);
      },
      err => { setGpsError("Could not get location. " + err.message); setChecking(false); },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSiteChange = (siteId) => {
    setSelectedJobSite(siteId);
    setIsOnSite(null);
    setDistanceDisplay(null);
    setGpsError(null);
    if (!siteId || siteId === "__other__") return;
    const site = jobSites.find(s => s.id === siteId);
    if (!site) return;
    // If we already have GPS, compute immediately
    if (gpsForDistance && site.latitude && site.longitude) {
      const d = distanceFeet(gpsForDistance.lat, gpsForDistance.lon, parseFloat(site.latitude), parseFloat(site.longitude));
      setDistanceDisplay(formatDist(d));
      setIsOnSite(d <= (site.geofence_radius_ft || 1000));
      return;
    }
    // Auto-request GPS silently (no button needed)
    if (!navigator.geolocation) return;
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const gps = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        if (setGpsForDistance) setGpsForDistance(gps);
        if (site.latitude && site.longitude) {
          const d = distanceFeet(gps.lat, gps.lon, parseFloat(site.latitude), parseFloat(site.longitude));
          setDistanceDisplay(formatDist(d));
          setIsOnSite(d <= (site.geofence_radius_ft || 1000));
        }
        setChecking(false);
      },
      () => setChecking(false),
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <Card style={{ border: "1.5px solid var(--border2)", padding: 16 }}>
        {/* Header label */}
        <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="pin" size={12} color="var(--blue)"/> Job Site
        </div>

        {/* Site dropdown */}
        <select
          value={selectedJobSite || ""}
          onChange={e => handleSiteChange(e.target.value)}
          style={{ fontSize: 15, fontWeight: selectedJobSite ? 600 : 400 }}
        >
          <option value="">— Select job site —</option>
          {jobSites.map(s => <option key={s.id} value={s.id}>{s.name}{s.address ? ` · ${s.address}` : ""}</option>)}
          <option value="__other__">Other / Not Listed</option>
        </select>

        {/* GPS status — spinner while checking, On-Site/Off-Site badge after */}
        {selectedJobSite && selectedJobSite !== "__other__" && (
          <div style={{ marginTop: 8 }}>
            {checking ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)" }}>
                <span className="spin" style={{ width: 11, height: 11, border: "2px solid var(--blue)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }}/>
                Checking location…
              </div>
            ) : isOnSite !== null && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: isOnSite ? "var(--green-light)" : "var(--red-light)", color: isOnSite ? "var(--green)" : "var(--red)", border: `1px solid ${isOnSite ? "var(--green-mid, #86efac)" : "var(--red-mid, #fca5a5)"}` }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOnSite ? "var(--green)" : "var(--red)", flexShrink: 0 }}/>
                {isOnSite ? "On Site" : "Off Site"}
                {distanceDisplay && <span style={{ opacity: 0.75, fontWeight: 500 }}>· {distanceDisplay}</span>}
              </div>
            )}
            {gpsError && (
              <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 2 }}>{gpsError}</div>
            )}
          </div>
        )}
        {selectedJobSite === "__other__" && (
          <div style={{ fontSize: 13, color: "var(--text3)", padding: "6px 0", marginTop: 8 }}>Entry will be logged without a specific site. Contact your manager to add a new site.</div>
        )}
        {!selectedJobSite && jobSites.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--amber)", marginTop: 4 }}>No job sites configured yet. Ask your manager to set one up.</div>
        )}
      </Card>
    </div>
  );
}

// ─── 2. ADMIN JOB SITE MANAGEMENT ─────────────────────────────────────────────
// Full CRUD for job sites with Leaflet map, Nominatim address search, geofence.
function FuelJobSitesAdmin({ jobSites, setJobSites, addToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editSite, setEditSite] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [radius, setRadius] = useState(500);
  const [projectName, setProjectName] = useState("");
  const [siteManager, setSiteManager] = useState("");

  // Map / search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // ── Load Leaflet from CDN ──────────────────────────────────────────────────
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // ── Initialize map when form opens ────────────────────────────────────────
  useEffect(() => {
    if (!showForm || !leafletReady || !mapContainerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const L = window.L;
    const initLat = lat ? parseFloat(lat) : 39.8283;
    const initLon = lon ? parseFloat(lon) : -98.5795;
    const initZoom = lat ? 15 : 4;

    const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([initLat, initLon], initZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    map.on("click", e => {
      const { lat: la, lng: lo } = e.latlng;
      setLat(la.toFixed(7));
      setLon(lo.toFixed(7));
      placePin(la, lo);
    });

    if (lat && lon) placePin(parseFloat(lat), parseFloat(lon));

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [showForm, leafletReady]);

  // ── Update circle when radius changes ─────────────────────────────────────
  useEffect(() => {
    if (lat && lon && mapRef.current) placePin(parseFloat(lat), parseFloat(lon));
  }, [radius]);

  const placePin = (la, lo) => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }
    const r = parseInt(radius) || 500;
    markerRef.current = L.marker([la, lo], {
      icon: L.divIcon({
        html: `<div style="width:18px;height:18px;background:#1e3a5f;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.45)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], className: "",
      })
    }).addTo(mapRef.current);
    circleRef.current = L.circle([la, lo], {
      radius: r * 0.3048,
      color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 2, dashArray: "5,5",
    }).addTo(mapRef.current);
    mapRef.current.setView([la, lo], Math.max(mapRef.current.getZoom(), 15));
  };

  // ── Address search via Nominatim ───────────────────────────────────────────
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en-US,en" } }
      );
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 0) addToast("No results found. Try a different address.", "info");
    } catch { addToast("Address search failed. Check your connection.", "error"); }
    setSearching(false);
  };

  const pickResult = (r) => {
    const la = parseFloat(r.lat), lo = parseFloat(r.lon);
    setLat(la.toFixed(7));
    setLon(lo.toFixed(7));
    const parts = r.display_name.split(",");
    setAddress(r.display_name);
    setSearchQuery(parts.slice(0, 2).join(",").trim());
    setSearchResults([]);
    placePin(la, lo);
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setName(""); setAddress(""); setLat(""); setLon(""); setRadius(500);
    setProjectName(""); setSiteManager("");
    setSearchQuery(""); setSearchResults([]);
    setEditSite(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (site) => {
    setEditSite(site);
    setName(site.name || ""); setAddress(site.address || "");
    setLat(site.latitude ? String(site.latitude) : "");
    setLon(site.longitude ? String(site.longitude) : "");
    setRadius(site.geofence_radius_ft || 500);
    setProjectName(site.project_name || ""); setSiteManager(site.site_manager || "");
    setSearchQuery(site.name || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { addToast("Site name is required.", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(), address: address.trim() || null,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lon ? parseFloat(lon) : null,
        geofence_radius_ft: parseInt(radius) || 500,
        project_name: projectName.trim() || null,
        site_manager: siteManager.trim() || null, active: true,
      };
      const url = editSite ? `/api/fuel/job-sites/${editSite.id}` : "/api/fuel/job-sites";
      const method = editSite ? "PUT" : "POST";
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed."); }
      const data = await res.json();
      if (editSite) {
        setJobSites(prev => prev.map(s => s.id === editSite.id ? data.site : s));
        addToast("Job site updated.", "success");
      } else {
        setJobSites(prev => [...prev, data.site]);
        addToast("Job site created! It will appear in employee dropdowns immediately.", "success");
      }
      setShowForm(false); resetForm();
    } catch (e) { addToast(e.message || "Error saving site.", "error"); }
    setSaving(false);
  };

  const handleDelete = async (site) => {
    if (!window.confirm(`Deactivate "${site.name}"? Employees will no longer see this site in the dropdown.`)) return;
    try {
      const res = await authFetch(`/api/fuel/job-sites/${site.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setJobSites(prev => prev.filter(s => s.id !== site.id));
      addToast("Job site removed.", "success");
    } catch { addToast("Failed to remove site.", "error"); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Job Sites</div>
          <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 2 }}>
            {jobSites.length} site{jobSites.length !== 1 ? "s" : ""} · Sites appear instantly in employee dropdowns
          </div>
        </div>
        {!showForm && (
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#1e3a5f", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(30,58,95,0.3)", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Job Site
          </button>
        )}
      </div>

      {/* ── Create / Edit Form ───────────────────────────────────────────────── */}
      {showForm && (
        <Card style={{ border: "2px solid #1e3a5f", padding: 20, marginBottom: 20, borderRadius: "var(--radius-lg)" }}>
          {/* Form header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "#1e3a5f", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="pin" size={16} color="white"/>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a5f" }}>{editSite ? "Edit Job Site" : "New Job Site"}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>Search an address or click the map to place the pin</div>
              </div>
            </div>
            <button onClick={() => { setShowForm(false); resetForm(); }} style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text2)", width: 32, height: 32, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="x" size={14} color="var(--text2)"/>
            </button>
          </div>

          {/* Address search */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
              Address Search
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchAddress()}
                placeholder="Search address, city, or place name…"
                style={{ flex: 1, fontSize: 14 }}
              />
              <button onClick={searchAddress} disabled={searching} style={{ padding: "0 18px", background: "#1e3a5f", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 13, cursor: searching ? "default" : "pointer", opacity: searching ? 0.7 : 1, flexShrink: 0, height: 42 }}>
                {searching ? "…" : "Search"}
              </button>
            </div>
            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginTop: 4, background: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 200, overflowY: "auto", position: "relative", zIndex: 200 }}>
                {searchResults.map((r, i) => (
                  <div key={i} onClick={() => pickResult(r)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: i < searchResults.length-1 ? "1px solid var(--border)" : "none", fontSize: 13, color: "var(--text2)", display: "flex", gap: 10, alignItems: "flex-start" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Icon name="pin" size={13} color="var(--blue)" style={{ marginTop: 2, flexShrink: 0 }}/>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.display_name.split(",")[0]}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 1 }}>{r.display_name.split(",").slice(1, 4).join(",").trim()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaflet map */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
              Map <span style={{ fontWeight: 400, color: "var(--text4)", fontSize: 12 }}>— click anywhere to drop pin · blue ring = geofence</span>
            </label>
            <div style={{ position: "relative", borderRadius: "var(--radius)", overflow: "hidden", border: "1.5px solid var(--border2)", boxShadow: "var(--shadow-sm)" }}>
              <div ref={mapContainerRef} style={{ width: "100%", height: 280, background: "#e8eaed" }}/>
              {!leafletReady && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(248,250,252,0.9)", fontSize: 13, color: "var(--text3)", gap: 8 }}>
                  <span className="spin" style={{ width: 16, height: 16, border: "2px solid var(--border2)", borderTopColor: "var(--blue)", borderRadius: "50%", display: "inline-block" }}/>
                  Loading map…
                </div>
              )}
            </div>
          </div>

          {/* Coordinates + geofence row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Latitude</label>
              <input type="number" step="0.0000001" value={lat}
                onChange={e => { setLat(e.target.value); if (e.target.value && lon) placePin(parseFloat(e.target.value), parseFloat(lon)); }}
                placeholder="e.g. 39.8283" style={{ fontSize: 13 }}/>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Longitude</label>
              <input type="number" step="0.0000001" value={lon}
                onChange={e => { setLon(e.target.value); if (lat && e.target.value) placePin(parseFloat(lat), parseFloat(e.target.value)); }}
                placeholder="e.g. -98.5795" style={{ fontSize: 13 }}/>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Geofence Radius (ft)</label>
              <input type="number" min="50" max="10000" step="50" value={radius}
                onChange={e => setRadius(e.target.value)} placeholder="500" style={{ fontSize: 13 }}/>
            </div>
          </div>

          {/* Site name, address, project, manager */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Site Name <span style={{ color: "var(--red)" }}>*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. North Valley Site" style={{ fontSize: 13 }}/>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Full Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address (auto-filled by search)" style={{ fontSize: 13 }}/>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Project Name</label>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Optional" style={{ fontSize: 13 }}/>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Site Manager</label>
              <input value={siteManager} onChange={e => setSiteManager(e.target.value)} placeholder="Optional" style={{ fontSize: 13 }}/>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", background: "#1e3a5f", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : editSite ? "Save Changes" : "Create Job Site"}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: "12px 22px", background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* ── Site list ─────────────────────────────────────────────────────────── */}
      {jobSites.length === 0 && !showForm ? (
        <Card style={{ textAlign: "center", padding: 36 }}>
          <div style={{ width: 52, height: 52, background: "var(--bg3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Icon name="pin" size={22} color="var(--text4)"/>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)" }}>No job sites yet</div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>Add a site above — employees will see it in their dropdown immediately.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {jobSites.map(site => (
            <Card key={site.id} style={{ padding: "14px 16px", border: "1.5px solid var(--border2)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "linear-gradient(135deg, #1e3a5f, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(30,58,95,0.25)" }}>
                  <Icon name="pin" size={18} color="white"/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{site.name}</span>
                    {site.project_name && <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg3)", padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border)" }}>{site.project_name}</span>}
                  </div>
                  {site.address && <div style={{ fontSize: 12.5, color: "var(--text3)", marginBottom: 4 }}>{site.address}</div>}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {site.latitude && site.longitude ? (
                      <span style={{ fontSize: 11.5, color: "var(--text4)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="pin" size={11} color="var(--text4)"/>
                        {parseFloat(site.latitude).toFixed(5)}, {parseFloat(site.longitude).toFixed(5)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11.5, color: "var(--amber)", fontWeight: 600 }}>⚠ No coordinates set</span>
                    )}
                    <span style={{ fontSize: 11.5, color: "var(--blue)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      ⭕ {site.geofence_radius_ft || 500} ft radius
                    </span>
                    {site.site_manager && <span style={{ fontSize: 11.5, color: "var(--text4)" }}>👤 {site.site_manager}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(site)} style={{ padding: "6px 12px", background: "var(--blue-light)", color: "var(--blue)", border: "1px solid var(--blue-mid)", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(site)} style={{ padding: "6px 12px", background: "rgba(220,38,38,0.07)", color: "var(--red)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 3. FUEL HISTORY VIEW ─────────────────────────────────────────────────────
// Replaces FuelMyLogs. Works for both admin (all logs) and employee (own logs).
// Features: on/off-site badge, More Details expandable card, filter by type.
function FuelHistoryView({ logs, loadingLogs, currentUser, isAdmin, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch]  = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [photoCache, setPhotoCache] = useState({}); // id → { photo_before, photo_after }
  const [loadingPhoto, setLoadingPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null); // modal src
  const PER_PAGE = 20;

  const myLogs = isAdmin ? logs : logs.filter(l => l.operator_id === currentUser?.id);
  const filtered = myLogs.filter(l => {
    if (filter !== "all" && l.entry_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${l.equipment_brand||""} ${l.equipment_model||""} ${l.job_site_name||""} ${l.operator_name||""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const paged = filtered.slice(0, page * PER_PAGE);
  const hasMore = filtered.length > paged.length;

  const fmtDate = d => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); } catch { return d; }
  };
  const fmtTime = d => {
    if (!d) return "";
    try { return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
  };

  const toggleExpand = async (l) => {
    const id = l.id;
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    // Lazy-load photos if this log has them and we haven't fetched yet
    if ((l.has_photo_before || l.has_photo_after) && !photoCache[id]) {
      setLoadingPhoto(id);
      try {
        const res = await authFetch(`/api/fuel/logs/${id}`);
        if (res.ok) {
          const d = await res.json();
          setPhotoCache(prev => ({ ...prev, [id]: { photo_before: d.photo_before, photo_after: d.photo_after } }));
        }
      } catch {}
      setLoadingPhoto(null);
    }
  };

  const OnSiteBadge = ({ val }) => {
    if (val === true)  return <span style={{ background:"rgba(5,150,105,0.1)", color:"#047857", border:"1px solid rgba(5,150,105,0.3)", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>● On-Site</span>;
    if (val === false) return <span style={{ background:"rgba(220,38,38,0.08)", color:"#b91c1c",  border:"1px solid rgba(220,38,38,0.25)", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>● Off-Site</span>;
    return <span style={{ background:"var(--bg3)", color:"var(--text4)", border:"1px solid var(--border)", padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:500 }}>— Location N/A</span>;
  };

  return (
    <div>
      {/* Photo preview modal */}
      {previewPhoto && (
        <div onClick={() => setPreviewPhoto(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ position:"relative", maxWidth:"90vw", maxHeight:"85vh" }}>
            <img src={previewPhoto} alt="meter" style={{ maxWidth:"100%", maxHeight:"80vh", objectFit:"contain", borderRadius:8, display:"block" }}/>
            <button onClick={() => setPreviewPhoto(null)} style={{ position:"absolute", top:-12, right:-12, width:32, height:32, borderRadius:"50%", background:"white", border:"2px solid var(--border)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"var(--text)" }}>×</button>
          </div>
        </div>
      )}

      {/* Header + filters */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{isAdmin ? "All Fuel Entries" : "My Fuel Log"}</div>
            <div style={{ fontSize:12.5, color:"var(--text3)", marginTop:2 }}>{filtered.length} record{filtered.length!==1?"s":""}</div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {onRefresh && <button onClick={onRefresh} style={{ padding:"6px 10px", background:"var(--bg3)", color:"var(--text3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:12, cursor:"pointer" }}>↻ Refresh</button>}
            {[["all","All"],["fill","Fills"],["eod","EOD"]].map(([v,l]) => (
              <button key={v} onClick={() => { setFilter(v); setPage(1); }} style={{ padding:"6px 14px", background:filter===v?"#1e3a5f":"var(--bg3)", color:filter===v?"white":"var(--text3)", border:`1px solid ${filter===v?"#1e3a5f":"var(--border)"}`, borderRadius:999, fontSize:12.5, fontWeight:filter===v?700:450, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        {/* Search bar */}
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search equipment, job site, operator…"
          style={{ fontSize:13.5, padding:"8px 12px", borderRadius:"var(--radius-sm)", border:"1.5px solid var(--border2)", background:"var(--bg2)", color:"var(--text)", width:"100%", boxSizing:"border-box" }}/>
      </div>

      {loadingLogs && (
        <div style={{ textAlign:"center", padding:32, color:"var(--text3)", fontSize:13 }}>
          <span className="spin" style={{ width:18, height:18, border:"2px solid var(--border2)", borderTopColor:"var(--blue)", borderRadius:"50%", display:"inline-block", marginBottom:8 }}/>
          <div>Loading fuel history…</div>
        </div>
      )}

      {!loadingLogs && filtered.length === 0 && (
        <Card style={{ textAlign:"center", padding:32 }}>
          <Icon name="droplet" size={32} color="var(--text4)" style={{ marginBottom:12 }}/>
          <div style={{ fontSize:14, color:"var(--text3)" }}>No fuel entries found.</div>
        </Card>
      )}

      {!loadingLogs && paged.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {paged.map((l, i) => {
            const isExpanded = expandedId === l.id;
            const isFill = l.entry_type === "fill";
            const photos = photoCache[l.id];

            return (
              <Card key={l.id||i} style={{ padding:0, overflow:"hidden", border:"1.5px solid var(--border2)" }}>
                {/* ── Main row ── */}
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                    {/* Type badge */}
                    <div style={{ flexShrink:0, paddingTop:2 }}>
                      <span style={{ background:isFill?"var(--blue-light)":"var(--green-light)", color:isFill?"var(--blue)":"var(--green)", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, display:"inline-block" }}>
                        {isFill ? "⛽ Fill" : "🏁 EOD"}
                      </span>
                    </div>

                    {/* Core info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Equipment name */}
                      <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text)", marginBottom:2 }}>
                        {l.equipment_brand} {l.equipment_model}
                      </div>

                      {/* Fuel data line */}
                      <div style={{ fontSize:12.5, color:"var(--text2)", marginBottom:3 }}>
                        {isFill
                          ? <>{l.fuel_level_before??'—'}% → {l.fuel_level_after??'—'}%{l.gallons_added ? <strong style={{ color:"var(--blue)" }}> · {l.gallons_added} gal</strong> : null}</>
                          : <>Remaining: <strong style={{ color:"var(--green)" }}>{l.fuel_level_remaining??'—'}%</strong></>
                        }
                      </div>

                      {/* Meta row: job site + operator + hours */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px", alignItems:"center" }}>
                        {l.job_site_name && (
                          <span style={{ fontSize:11.5, color:"var(--text3)", display:"flex", alignItems:"center", gap:3 }}>
                            <Icon name="pin" size={11} color="var(--text4)"/>{l.job_site_name}
                          </span>
                        )}
                        {isAdmin && l.operator_name && (
                          <span style={{ fontSize:11.5, color:"var(--text3)", display:"flex", alignItems:"center", gap:3 }}>
                            <Icon name="user" size={11} color="var(--text4)"/>{l.operator_name}
                          </span>
                        )}
                        {l.hours_reading && (
                          <span style={{ fontSize:11.5, color:"var(--text3)" }}>⏱ {l.hours_reading} hrs</span>
                        )}
                        <OnSiteBadge val={l.is_on_site}/>
                        {(l.has_photo_before || l.has_photo_after) && (
                          <span style={{ fontSize:11, color:"var(--blue)", fontWeight:600 }}>📷 Photo</span>
                        )}
                      </div>
                    </div>

                    {/* Right: date + expand */}
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:12, color:"var(--text3)", fontWeight:600 }}>{fmtDate(l.logged_at || l.log_date)}</div>
                      <div style={{ fontSize:11, color:"var(--text4)", marginTop:1 }}>{fmtTime(l.logged_at)}</div>
                      <button
                        onClick={() => toggleExpand(l)}
                        style={{ marginTop:6, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"4px 10px", fontSize:11, color:"var(--text3)", cursor:"pointer", fontWeight:600 }}>
                        {isExpanded ? "Less ▲" : "Details ▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div style={{ borderTop:"1px solid var(--border)", background:"var(--bg3)", padding:"14px 14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12 }}>

                      <div>
                        <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Submitted At</div>
                        <div style={{ fontSize:13, color:"var(--text2)", fontWeight:600 }}>{l.logged_at ? new Date(l.logged_at).toLocaleString() : l.log_date}</div>
                      </div>

                      <div>
                        <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Location Status</div>
                        <OnSiteBadge val={l.is_on_site}/>
                      </div>

                      {l.gps_lat && l.gps_lon && (
                        <div>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>GPS</div>
                          <div style={{ fontSize:11.5, color:"var(--text2)", fontFamily:"monospace" }}>{parseFloat(l.gps_lat).toFixed(5)}, {parseFloat(l.gps_lon).toFixed(5)}</div>
                        </div>
                      )}

                      {l.job_site_name && (
                        <div>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Job Site</div>
                          <div style={{ fontSize:13, color:"var(--text2)", fontWeight:600 }}>{l.job_site_name}</div>
                        </div>
                      )}

                      {l.operator_name && (
                        <div>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Operator</div>
                          <div style={{ fontSize:13, color:"var(--text2)" }}>{l.operator_name}</div>
                        </div>
                      )}

                      {l.hours_reading && (
                        <div>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Machine Hours</div>
                          <div style={{ fontSize:13, color:"var(--text2)", fontWeight:700 }}>{l.hours_reading} hrs</div>
                        </div>
                      )}

                      {isFill && l.gallons_added && (
                        <div>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Gallons Added</div>
                          <div style={{ fontSize:14, color:"var(--blue)", fontWeight:700 }}>{l.gallons_added} gal</div>
                        </div>
                      )}

                      {l.remarks && (
                        <div style={{ gridColumn:"1/-1" }}>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Remarks</div>
                          <div style={{ fontSize:13, color:"var(--text2)", fontStyle:"italic" }}>{l.remarks}</div>
                        </div>
                      )}

                      {l.supervisor_note && (
                        <div style={{ gridColumn:"1/-1" }}>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Supervisor Note</div>
                          <div style={{ fontSize:13, color:"var(--text2)" }}>{l.supervisor_note}</div>
                        </div>
                      )}

                      {/* Photos */}
                      {(l.has_photo_before || l.has_photo_after) && (
                        <div style={{ gridColumn:"1/-1" }}>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Meter Photo</div>
                          {loadingPhoto === l.id ? (
                            <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--text3)", fontSize:12 }}>
                              <span className="spin" style={{ width:14, height:14, border:"2px solid var(--blue)", borderTopColor:"transparent", borderRadius:"50%", display:"inline-block" }}/>
                              Loading photo…
                            </div>
                          ) : photos ? (
                            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                              {photos.photo_before && (
                                <div>
                                  <div style={{ fontSize:11, color:"var(--text3)", marginBottom:5, fontWeight:600 }}>Before Fill</div>
                                  <div onClick={() => setPreviewPhoto(photos.photo_before)} style={{ cursor:"pointer" }}>
                                    <img src={photos.photo_before} alt="before" style={{ width:140, height:105, objectFit:"cover", borderRadius:"var(--radius)", border:"2px solid var(--blue)", display:"block", cursor:"pointer" }} title="Click to enlarge"/>
                                    <div style={{ fontSize:10, color:"var(--blue)", textAlign:"center", marginTop:3 }}>🔍 Click to enlarge</div>
                                  </div>
                                </div>
                              )}
                              {photos.photo_after && (
                                <div>
                                  <div style={{ fontSize:11, color:"var(--text3)", marginBottom:5, fontWeight:600 }}>After Fill</div>
                                  <div onClick={() => setPreviewPhoto(photos.photo_after)} style={{ cursor:"pointer" }}>
                                    <img src={photos.photo_after} alt="after" style={{ width:140, height:105, objectFit:"cover", borderRadius:"var(--radius)", border:"2px solid var(--green)", display:"block", cursor:"pointer" }} title="Click to enlarge"/>
                                    <div style={{ fontSize:10, color:"var(--green)", textAlign:"center", marginTop:3 }}>🔍 Click to enlarge</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize:12, color:"var(--text3)" }}>Photo available — expand to load</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign:"center", marginTop:14 }}>
          <Btn onClick={() => setPage(p => p + 1)} variant="ghost">Load More</Btn>
        </div>
      )}
    </div>
  );
}
function FuelDashboard({ dashData, logs, alerts, onViewAlerts }) {
  const [equipFilter, setEquipFilter] = useState("all");
  const today = new Date().toISOString().slice(0, 10);

  const filteredLogs = equipFilter === "all" ? logs : logs.filter(l => l.equipment_id === equipFilter);
  const fillLogs  = filteredLogs.filter(l => l.entry_type === "fill");
  const eodLogs   = filteredLogs.filter(l => l.entry_type === "eod");

  const totalGallons  = fillLogs.reduce((s, l) => s + (Number(l.gallons_added) || 0), 0);
  const todayLogs     = filteredLogs.filter(l => (l.log_date||"").slice(0,10) === today);
  // Prefer server-side aggregated KPIs from dashData, fallback to client-computed
  const todayGallons  = equipFilter === "all"
    ? (dashData?.today_summary?.today_gallons ?? fillLogs.filter(l => (l.log_date||"").slice(0,10) === today).reduce((s,l) => s+(Number(l.gallons_added)||0), 0))
    : fillLogs.filter(l => (l.log_date||"").slice(0,10) === today).reduce((s,l) => s+(Number(l.gallons_added)||0), 0);
  const eodToday      = new Set(eodLogs.filter(l => (l.log_date||"").slice(0,10) === today).map(l => l.equipment_id)).size;
  const motorEquip    = EQUIPMENT_LIST.filter(e => e.type !== "trailer");
  const missingEod    = motorEquip.length - eodToday;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;
  const offSiteCount  = (dashData?.off_site_count ?? filteredLogs.filter(l => l.is_on_site === false).length);

  // Equipment list for filter dropdown (from logs, deduplicated)
  const equipOptions = [{ id:"all", label:"All Equipment" },
    ...Object.values(logs.reduce((acc, l) => {
      if (!acc[l.equipment_id]) acc[l.equipment_id] = { id:l.equipment_id, label:`${l.equipment_brand} ${l.equipment_model}`.trim() };
      return acc;
    }, {}))
  ];

  // Last 7 days chart data — prefer dashData.daily_totals (aggregated by DB), fallback to logs
  const days7 = Array.from({ length:7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const ds = d.toISOString().slice(0, 10);
    // Try dashData first (authoritative DB aggregation)
    const dbEntry = (dashData?.daily_totals || []).find(r => (r.log_date||"").slice(0,10) === ds);
    const gal = dbEntry != null
      ? Math.round(Number(dbEntry.gallons)||0)
      : fillLogs.filter(l => (l.log_date||"").slice(0,10) === ds).reduce((s, l) => s + (Number(l.gallons_added)||0), 0);
    return { label:d.toLocaleDateString([], { weekday:"short" }), value:Math.round(gal) };
  });

  // Per-equipment totals — from dashData (authoritative DB aggregation)
  const byEquipChart = (dashData?.by_equipment || [])
    .filter(e => (equipFilter === "all" || e.equipment_id === equipFilter) && Number(e.total_gallons||0) > 0)
    .slice(0, 8)
    .map(e => ({ label:`${e.equipment_brand||""} ${e.equipment_model||""}`.trim().slice(0, 10), value:Math.round(Number(e.total_gallons)||0) }));

  // By site — use dashData from backend (authoritative)
  const bySiteChart = (dashData?.by_site || [])
    .filter(s => s.site_name && s.total_gallons > 0)
    .slice(0, 8)
    .map(s => ({ label:(s.site_name||"").slice(0, 12), value:Math.round(Number(s.total_gallons)||0) }));

  // Operator table
  const operatorData = dashData?.by_operator || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <SectionHeader title="Fuel Analytics" subtitle="Fleet-wide consumption overview"/>
        {/* Equipment filter */}
        <select
          value={equipFilter}
          onChange={e => setEquipFilter(e.target.value)}
          style={{ fontSize:13, padding:"6px 10px", minWidth:160, borderRadius:"var(--radius-sm)", border:"1.5px solid var(--border2)", background:"var(--bg2)", color:"var(--text)", fontWeight:500 }}>
          {equipOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(100%,130px),1fr))", gap:8 }}>
        <StatCard label="Total Fuel Added" value={`${totalGallons.toFixed(0)} gal`} icon="droplet" color="var(--blue)"   sub="All-time fills"/>
        <StatCard label="Today's Fuel"     value={`${todayGallons.toFixed(0)} gal`} icon="droplet" color="var(--green)"  sub="Filled today"/>
        <StatCard label="Today's Entries"  value={todayLogs.length}                 icon="clock"   color="var(--blue)"   sub="Logs today"/>
        <StatCard label="EOD Missing"      value={missingEod} icon="alert" color={missingEod>0?"var(--red)":"var(--green)"} sub="Not filed today" flash={missingEod>0}/>
        <StatCard label="Off-Site Entries" value={offSiteCount} icon="pin"  color={offSiteCount>0?"var(--amber)":"var(--green)"} sub="Last 30 days"/>
        <StatCard label="Active Alerts"    value={unresolvedAlerts} icon="flag" color={unresolvedAlerts>0?"var(--amber)":"var(--green)"} sub="Unresolved" flash={unresolvedAlerts>0}/>
      </div>

      {/* Missing EOD warning */}
      {missingEod > 0 && (
        <div style={{ background:"var(--red-light)", border:"1.5px solid rgba(220,38,38,0.2)", borderRadius:"var(--radius)", padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
          <Icon name="alert" size={15} color="var(--red)" style={{ flexShrink:0 }}/>
          <div style={{ fontSize:13.5, color:"var(--red)", fontWeight:500 }}>
            <strong>{missingEod} equipment unit{missingEod!==1?"s":""}</strong> missing today's end-of-day fuel record.
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(100%,260px),1fr))", gap:12 }}>
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Daily Fuel — Last 7 Days</div>
          <FuelBarChart data={days7} color="var(--blue)" height={130}/>
        </Card>
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>By Equipment</div>
          {byEquipChart.length > 0 ? <FuelBarChart data={byEquipChart} color="var(--amber)" height={130}/> : <div style={{ color:"var(--text4)", fontSize:13, textAlign:"center", padding:20 }}>No data</div>}
        </Card>
        {bySiteChart.length > 0 && (
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>By Job Site</div>
            <FuelBarChart data={bySiteChart} color="var(--green)" height={130}/>
          </Card>
        )}
      </div>

      {/* EOD status table */}
      <Card>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Today's EOD Status</div>
        <div style={{ overflowX:"auto" }}>
          <table>
            <thead><tr><th>Equipment</th><th>Model</th><th>EOD</th><th>Last Level</th><th>Operator</th></tr></thead>
            <tbody>
              {motorEquip.map(eq => {
                const eodEntry = eodLogs.find(l => l.equipment_id === eq.id && (l.log_date||"").slice(0,10) === today);
                const lastLog  = [...logs].find(l => l.equipment_id === eq.id);
                return (
                  <tr key={eq.id}>
                    <td style={{ fontWeight:600 }}>{eq.brand}</td>
                    <td style={{ color:"var(--text3)", fontSize:12 }}>{eq.model}</td>
                    <td>
                      {eodEntry
                        ? <span style={{ background:"var(--green-light)", color:"var(--green)", padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, border:"1px solid rgba(5,150,105,0.2)" }}>✓ Filed</span>
                        : <span style={{ background:"var(--red-light)", color:"var(--red)", padding:"2px 8px", borderRadius:999, fontSize:11, fontWeight:700, border:"1px solid rgba(220,38,38,0.2)" }}>Missing</span>
                      }
                    </td>
                    <td style={{ fontWeight:600 }}>
                      {eodEntry ? `${eodEntry.fuel_level_remaining}%` : lastLog ? `${lastLog.fuel_level_after ?? lastLog.fuel_level_remaining ?? "—"}%` : "—"}
                    </td>
                    <td style={{ color:"var(--text3)", fontSize:12 }}>{eodEntry?.operator_name || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Operator activity */}
      {operatorData.length > 0 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:12 }}>Operator Activity</div>
          <div style={{ overflowX:"auto" }}>
            <table>
              <thead><tr><th>Operator</th><th>Total Fuel</th><th>Fills</th><th>EODs</th></tr></thead>
              <tbody>
                {operatorData.map((o, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:600 }}>{o.operator_name||"—"}</td>
                    <td><span style={{ color:"var(--blue)", fontWeight:700 }}>{Number(o.total_gallons||0).toFixed(1)} gal</span></td>
                    <td style={{ color:"var(--text3)" }}>{o.fill_count||0}</td>
                    <td style={{ color:"var(--text3)" }}>{o.eod_count||0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Alerts preview */}
      {unresolvedAlerts > 0 && (
        <Card style={{ border:"1.5px solid rgba(217,119,6,0.25)", background:"var(--amber-light)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#92400e" }}>⚠ {unresolvedAlerts} Active Alert{unresolvedAlerts!==1?"s":""}</div>
            <Btn onClick={onViewAlerts} variant="orange" size="sm">View All</Btn>
          </div>
          {alerts.filter(a => !a.resolved).slice(0, 3).map((a, i) => (
            <div key={i} style={{ padding:"8px 0", borderBottom:i<2?"1px solid rgba(217,119,6,0.15)":"none", fontSize:13, color:"#92400e" }}>
              <strong>{(a.alert_type||"").replace(/_/g," ")}</strong> · {a.equipment_brand} · {a.operator_name||"—"}
              <div style={{ fontSize:11.5, color:"#b45309", marginTop:2 }}>{a.reason}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── ALERTS VIEW (Admin) ───────────────────────────────────────────────────────
function FuelAlertsView({ alerts, onRefresh, addToast }) {
  const [resolving, setResolving] = useState(null);
  const [showResolved, setShowResolved] = useState(false);

  const resolveAlert = async (id) => {
    setResolving(id);
    try {
      const res = await authFetch(`/api/fuel/alerts/${id}/resolve`, { method:"PUT" });
      if (res.ok) { addToast("Alert resolved.", "success"); onRefresh(); }
      else addToast("Failed to resolve alert.", "error");
    } catch { addToast("Error.", "error"); }
    setResolving(null);
  };

  const ALERT_CFG = {
    high_consumption:     { bg:"var(--red-light)",    c:"var(--red)",    label:"High Consumption",      icon:"⛽" },
    low_hours_high_fuel:  { bg:"#fff7ed",             c:"#c2410c",       label:"Low Hours / High Fuel", icon:"⚠" },
    rapid_repeat_entry:   { bg:"var(--amber-light)",  c:"var(--amber)",  label:"Rapid Repeat Entry",    icon:"⏱" },
    off_site_entry:       { bg:"#f5f3ff",             c:"#7c3aed",       label:"Off-Site Entry",        icon:"📍" },
    missing_eod:          { bg:"var(--red-light)",    c:"var(--red)",    label:"Missing EOD",           icon:"🏁" },
    meter_inconsistency:  { bg:"#fff7ed",             c:"#c2410c",       label:"Meter Inconsistency",   icon:"🔢" },
  };

  const fmtDt = d => { try { return new Date(d).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }); } catch { return d||"—"; } };

  const unresolved = alerts.filter(a => !a.resolved);
  const resolved   = alerts.filter(a => a.resolved);

  const AlertCard = ({ a }) => {
    const cfg = ALERT_CFG[a.alert_type] || { bg:"var(--amber-light)", c:"var(--amber)", label:a.alert_type||"Alert", icon:"⚠" };
    return (
      <Card style={{ border:`1.5px solid ${cfg.c}28`, background:cfg.bg, padding:"14px 14px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
          {/* Icon */}
          <div style={{ width:36, height:36, borderRadius:"var(--radius-sm)", background:`${cfg.c}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>
            {cfg.icon}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:cfg.c, marginBottom:3 }}>{cfg.label}</div>
            <div style={{ fontSize:12.5, color:"var(--text2)", lineHeight:1.5 }}>{a.reason}</div>
          </div>
          {!a.resolved && (
            <Btn onClick={() => resolveAlert(a.id)} loading={resolving===a.id} variant="ghost" size="sm" style={{ flexShrink:0 }}>Resolve</Btn>
          )}
        </div>
        {/* Detail pills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {a.equipment_brand && (
            <span style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:999, padding:"3px 10px", fontSize:11.5, color:"var(--text2)", fontWeight:600 }}>
              ⚙ {a.equipment_brand} {a.equipment_model||""}
            </span>
          )}
          {a.operator_name && (
            <span style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:999, padding:"3px 10px", fontSize:11.5, color:"var(--text2)" }}>
              👤 {a.operator_name}
            </span>
          )}
          {a.job_site_name && (
            <span style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:999, padding:"3px 10px", fontSize:11.5, color:"var(--text2)" }}>
              📍 {a.job_site_name}
            </span>
          )}
          <span style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:999, padding:"3px 10px", fontSize:11.5, color:"var(--text3)" }}>
            🕐 {fmtDt(a.created_at)}
          </span>
          {a.resolved && (
            <span style={{ background:"var(--green-light)", border:"1px solid rgba(5,150,105,0.2)", borderRadius:999, padding:"3px 10px", fontSize:11, color:"var(--green)", fontWeight:700 }}>
              ✓ Resolved
            </span>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <SectionHeader title="Fuel Alerts" subtitle="Flagged suspicious or abnormal activity"/>
        <Btn onClick={onRefresh} variant="ghost" size="sm">↻ Refresh</Btn>
      </div>

      {alerts.length === 0 && (
        <Card style={{ textAlign:"center", padding:32 }}>
          <Icon name="shield" size={36} color="var(--green)" style={{ marginBottom:10 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"var(--green)", marginBottom:4 }}>All Clear</div>
          <div style={{ fontSize:13, color:"var(--text3)" }}>No suspicious fuel activity detected.</div>
        </Card>
      )}

      {unresolved.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--red)", marginBottom:10, display:"flex", alignItems:"center", gap:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
            <Icon name="alert" size={13} color="var(--red)"/> {unresolved.length} Unresolved
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {unresolved.map(a => <AlertCard key={a.id} a={a}/>)}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <button
            onClick={() => setShowResolved(v => !v)}
            style={{ fontSize:12.5, fontWeight:600, color:"var(--text3)", background:"none", border:"none", cursor:"pointer", padding:"4px 0", display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
            {showResolved ? "▲" : "▼"} {resolved.length} Resolved Alert{resolved.length!==1?"s":""}
          </button>
          {showResolved && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, opacity:0.75 }}>
              {resolved.map(a => <AlertCard key={a.id} a={a}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── REPORTS PAGE (Admin) ──────────────────────────────────────────────────────
function FuelReportsPage({ logs, addToast }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [equipFilter, setEquipFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  const filtered = logs.filter(l => {
    if (equipFilter !== "all" && l.equipment_id !== equipFilter) return false;
    if (dateFrom && l.log_date < dateFrom) return false;
    if (dateTo && l.log_date > dateTo) return false;
    return true;
  });

  const totalGallons = filtered.filter(l => l.entry_type === "fill").reduce((s, l) => s + (Number(l.gallons_added) || 0), 0);
  const uniqueOps = new Set(filtered.map(l => l.operator_id)).size;

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      const p = new URLSearchParams();
      if (equipFilter !== "all") p.set("equipment_id", equipFilter);
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo) p.set("date_to", dateTo);
      p.set("format", fmt);
      const res = await authFetch(`/api/fuel/export?${p}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fuel_report_${new Date().toISOString().slice(0, 10)}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Report downloaded.", "success");
    } catch (e) { addToast(e.message || "Export failed.", "error"); }
    setExporting(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader title="Fuel Reports" subtitle="Filter and export fuel data"/>

      {/* Filters */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>Equipment</label>
            <select value={equipFilter} onChange={e => setEquipFilter(e.target.value)} style={{ fontSize: 14 }}>
              <option value="all">All Equipment</option>
              {EQUIPMENT_LIST.map(eq => <option key={eq.id} value={eq.id}>{eq.brand} {eq.model}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ fontSize: 14 }}/>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 600 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ fontSize: 14 }}/>
          </div>
        </div>
        {/* Summary */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { label: "Entries", value: filtered.length },
            { label: "Total Fuel Added", value: `${totalGallons.toFixed(1)} gal` },
            { label: "Operators", value: uniqueOps },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: "8px 14px", border: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "var(--text3)" }}>{s.label}: </span>
              <strong style={{ color: "var(--text)" }}>{s.value}</strong>
            </div>
          ))}
        </div>
        {/* Export buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => handleExport("csv")} loading={exporting} variant="blue" size="md">
            <Icon name="download" size={14} color="var(--blue)"/> Export CSV
          </Btn>
          <Btn onClick={() => handleExport("json")} loading={exporting} variant="ghost" size="md">
            <Icon name="download" size={14}/> Export JSON
          </Btn>
        </div>
      </Card>

      {/* Data table */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
          Fuel Log — {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </div>
        {filtered.length === 0
          ? <div style={{ color: "var(--text4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No records match filters.</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr><th>Date</th><th>Equipment</th><th>Type</th><th>Fuel Level</th><th>Gallons</th><th>Hours</th><th>Job Site</th><th>Operator</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{l.log_date}</td>
                      <td style={{ fontWeight: 600 }}>{l.equipment_brand} {l.equipment_model}</td>
                      <td>
                        <span style={{ background: l.entry_type === "fill" ? "var(--blue-light)" : "var(--green-light)", color: l.entry_type === "fill" ? "var(--blue)" : "var(--green)", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {l.entry_type === "fill" ? "Fill" : "EOD"}
                        </span>
                      </td>
                      <td>{l.entry_type === "fill" ? `${l.fuel_level_before ?? "—"}→${l.fuel_level_after ?? "—"}%` : `${l.fuel_level_remaining ?? "—"}%`}</td>
                      <td>{l.gallons_added ? `${l.gallons_added}g` : "—"}</td>
                      <td style={{ color: "var(--text3)" }}>{l.hours_reading ?? "—"}</td>
                      <td style={{ color: "var(--text3)", fontSize: 12 }}>{l.job_site_name || "—"}</td>
                      <td style={{ fontSize: 12 }}>{l.operator_name}</td>
                      <td style={{ color: "var(--text3)", fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", paddingTop: 10 }}>Showing first 100 of {filtered.length} records. Export for full data.</div>}
            </div>
          )
        }
      </Card>
    </div>
  );
}

// ─── MY LOGS (Employee) ────────────────────────────────────────────────────────
function FuelMyLogs({ logs, loadingLogs, currentUser, onRefresh }) {
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage]           = useState(1);
  const [photoCache, setPhotoCache] = useState({});
  const [loadingPhoto, setLoadingPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const PER_PAGE = 20;

  const fmtDate = d => { try { return d ? new Date(d).toLocaleDateString([], { month:"short", day:"numeric", year:"numeric" }) : "—"; } catch { return d||"—"; } };
  const fmtTime = d => { try { return d ? new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : ""; } catch { return ""; } };

  const myLogs = logs.filter(l => l.operator_id === currentUser?.id);
  const filtered = myLogs.filter(l => {
    if (filter !== "all" && l.entry_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${l.equipment_brand||""} ${l.equipment_model||""} ${l.job_site_name||""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const paged = filtered.slice(0, page * PER_PAGE);

  const OnSiteBadge = ({ val }) => {
    if (val === true)  return <span style={{ background:"rgba(5,150,105,0.1)", color:"#047857", border:"1px solid rgba(5,150,105,0.3)", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>● On-Site</span>;
    if (val === false) return <span style={{ background:"rgba(220,38,38,0.08)", color:"#b91c1c", border:"1px solid rgba(220,38,38,0.25)", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>● Off-Site</span>;
    return <span style={{ background:"var(--bg3)", color:"var(--text4)", border:"1px solid var(--border)", padding:"2px 8px", borderRadius:999, fontSize:11 }}>— Location N/A</span>;
  };

  const toggleExpand = async (l) => {
    if (expandedId === l.id) { setExpandedId(null); return; }
    setExpandedId(l.id);
    if ((l.has_photo_before || l.has_photo_after) && !photoCache[l.id]) {
      setLoadingPhoto(l.id);
      try {
        const res = await authFetch(`/api/fuel/logs/${l.id}`);
        if (res.ok) { const d = await res.json(); setPhotoCache(prev => ({ ...prev, [l.id]: { photo_before: d.photo_before, photo_after: d.photo_after } })); }
      } catch {}
      setLoadingPhoto(null);
    }
  };

  return (
    <div>
      {/* Photo preview modal */}
      {previewPhoto && (
        <div onClick={() => setPreviewPhoto(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ position:"relative", maxWidth:"90vw", maxHeight:"85vh" }}>
            <img src={previewPhoto} alt="meter" style={{ maxWidth:"100%", maxHeight:"80vh", objectFit:"contain", borderRadius:8, display:"block" }}/>
            <button onClick={() => setPreviewPhoto(null)} style={{ position:"absolute", top:-12, right:-12, width:32, height:32, borderRadius:"50%", background:"white", border:"2px solid var(--border)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>My Fuel Log</div>
            <div style={{ fontSize:12.5, color:"var(--text3)", marginTop:2 }}>{filtered.length} record{filtered.length!==1?"s":""}</div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            {onRefresh && <button onClick={onRefresh} style={{ padding:"6px 10px", background:"var(--bg3)", color:"var(--text3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:12, cursor:"pointer" }}>↻</button>}
            {[["all","All"],["fill","Fills"],["eod","EOD"]].map(([v,l]) => (
              <button key={v} onClick={() => { setFilter(v); setPage(1); }} style={{ padding:"6px 12px", background:filter===v?"#1e3a5f":"var(--bg3)", color:filter===v?"white":"var(--text3)", border:`1px solid ${filter===v?"#1e3a5f":"var(--border)"}`, borderRadius:999, fontSize:12, fontWeight:filter===v?700:450, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
        </div>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search equipment, job site…" style={{ fontSize:13.5, padding:"8px 12px", borderRadius:"var(--radius-sm)", border:"1.5px solid var(--border2)", background:"var(--bg2)", color:"var(--text)", width:"100%", boxSizing:"border-box" }}/>
      </div>

      {loadingLogs && <div style={{ textAlign:"center", padding:32, color:"var(--text3)", fontSize:13 }}>Loading fuel history…</div>}

      {!loadingLogs && filtered.length === 0 && (
        <Card style={{ textAlign:"center", padding:32 }}>
          <Icon name="droplet" size={32} color="var(--text4)" style={{ marginBottom:10 }}/>
          <div style={{ fontSize:14, color:"var(--text3)" }}>{myLogs.length === 0 ? "No fuel entries yet. Tap Equipment to log fuel." : "No entries match your filter."}</div>
        </Card>
      )}

      {!loadingLogs && paged.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {paged.map((l, i) => {
            const isExpanded = expandedId === l.id;
            const isFill = l.entry_type === "fill";
            const photos = photoCache[l.id];
            return (
              <Card key={l.id||i} style={{ padding:0, overflow:"hidden", border:"1.5px solid var(--border2)" }}>
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                    <div style={{ flexShrink:0, paddingTop:2 }}>
                      <span style={{ background:isFill?"var(--blue-light)":"var(--green-light)", color:isFill?"var(--blue)":"var(--green)", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, display:"inline-block" }}>
                        {isFill ? "⛽ Fill" : "🏁 EOD"}
                      </span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text)", marginBottom:2 }}>{l.equipment_brand} {l.equipment_model}</div>
                      <div style={{ fontSize:12.5, color:"var(--text2)", marginBottom:3 }}>
                        {isFill
                          ? <>{l.fuel_level_before??'—'}% → {l.fuel_level_after??'—'}%{l.gallons_added ? <strong style={{ color:"var(--blue)" }}> · {l.gallons_added} gal</strong> : null}</>
                          : <>Remaining: <strong style={{ color:"var(--green)" }}>{l.fuel_level_remaining??'—'}%</strong></>}
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px", alignItems:"center" }}>
                        {l.job_site_name && <span style={{ fontSize:11.5, color:"var(--text3)", display:"flex", alignItems:"center", gap:3 }}><Icon name="pin" size={11} color="var(--text4)"/>{l.job_site_name}</span>}
                        {l.hours_reading && <span style={{ fontSize:11.5, color:"var(--text3)" }}>⏱ {l.hours_reading} hrs</span>}
                        <OnSiteBadge val={l.is_on_site}/>
                        {(l.has_photo_before || l.has_photo_after) && <span style={{ fontSize:11, color:"var(--blue)", fontWeight:600 }}>📷 Photo</span>}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:12, color:"var(--text3)", fontWeight:600 }}>{fmtDate(l.logged_at||l.log_date)}</div>
                      <div style={{ fontSize:11, color:"var(--text4)", marginTop:1 }}>{fmtTime(l.logged_at)}</div>
                      <button onClick={() => toggleExpand(l)} style={{ marginTop:6, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"4px 10px", fontSize:11, color:"var(--text3)", cursor:"pointer", fontWeight:600 }}>
                        {isExpanded ? "Less ▲" : "Details ▼"}
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop:"1px solid var(--border)", background:"var(--bg3)", padding:"14px 14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px, 1fr))", gap:12 }}>
                      <div><div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Submitted At</div><div style={{ fontSize:13, color:"var(--text2)", fontWeight:600 }}>{l.logged_at ? new Date(l.logged_at).toLocaleString() : l.log_date}</div></div>
                      <div><div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Location</div><OnSiteBadge val={l.is_on_site}/></div>
                      {l.gps_lat && l.gps_lon && <div><div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>GPS</div><div style={{ fontSize:11.5, color:"var(--text2)", fontFamily:"monospace" }}>{parseFloat(l.gps_lat).toFixed(5)}, {parseFloat(l.gps_lon).toFixed(5)}</div></div>}
                      {l.job_site_name && <div><div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Job Site</div><div style={{ fontSize:13, color:"var(--text2)", fontWeight:600 }}>{l.job_site_name}</div></div>}
                      {l.hours_reading && <div><div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Machine Hours</div><div style={{ fontSize:13, color:"var(--text2)", fontWeight:700 }}>{l.hours_reading} hrs</div></div>}
                      {isFill && l.gallons_added && <div><div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Gallons Added</div><div style={{ fontSize:14, color:"var(--blue)", fontWeight:700 }}>{l.gallons_added} gal</div></div>}
                      {l.remarks && <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Remarks</div><div style={{ fontSize:13, color:"var(--text2)", fontStyle:"italic" }}>{l.remarks}</div></div>}
                      {(l.has_photo_before || l.has_photo_after) && (
                        <div style={{ gridColumn:"1/-1" }}>
                          <div style={{ fontSize:10.5, color:"var(--text4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Meter Photo</div>
                          {loadingPhoto === l.id ? (
                            <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--text3)", fontSize:12 }}><span className="spin" style={{ width:14, height:14, border:"2px solid var(--blue)", borderTopColor:"transparent", borderRadius:"50%", display:"inline-block" }}/>Loading photo…</div>
                          ) : photos ? (
                            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                              {photos.photo_before && <div><div style={{ fontSize:11, color:"var(--text3)", marginBottom:5, fontWeight:600 }}>Before Fill</div><div onClick={() => setPreviewPhoto(photos.photo_before)} style={{ cursor:"pointer" }}><img src={photos.photo_before} alt="before" style={{ width:140, height:105, objectFit:"cover", borderRadius:"var(--radius)", border:"2px solid var(--blue)", display:"block" }}/><div style={{ fontSize:10, color:"var(--blue)", textAlign:"center", marginTop:3 }}>🔍 Enlarge</div></div></div>}
                              {photos.photo_after  && <div><div style={{ fontSize:11, color:"var(--text3)", marginBottom:5, fontWeight:600 }}>After Fill</div><div onClick={() => setPreviewPhoto(photos.photo_after)} style={{ cursor:"pointer" }}><img src={photos.photo_after} alt="after" style={{ width:140, height:105, objectFit:"cover", borderRadius:"var(--radius)", border:"2px solid var(--green)", display:"block" }}/><div style={{ fontSize:10, color:"var(--green)", textAlign:"center", marginTop:3 }}>🔍 Enlarge</div></div></div>}
                            </div>
                          ) : <div style={{ fontSize:12, color:"var(--text3)" }}>Expand to load photo</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {paged.length < filtered.length && (
        <div style={{ textAlign:"center", marginTop:14 }}>
          <Btn onClick={() => setPage(p => p+1)} variant="ghost">Load More ({filtered.length - paged.length} remaining)</Btn>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// WORKFLOW COMPONENTS
// WorkflowSection        — shared tab bar used inside EmployeeDashboard
// AdminWorkflowSection   — REMOVED (replaced by Workflow Cards inside AdminDashboard)
// WorkflowEquipmentTab   — equipment grid with custom image upload
// useEquipmentImages     — localStorage hook for custom equipment thumbnails
// =============================================================================

// ─── EQUIPMENT IMAGE HOOK ────────────────────────────────────────────────────
// Persists custom equipment images in localStorage so they survive refreshes.
// Key per equipment: "bsc_eq_img_<id>"
function useEquipmentImages() {
  const [images, setImages] = useState(() => {
    const result = {};
    try {
      EQUIPMENT_LIST.forEach(eq => {
        const stored = localStorage.getItem(`bsc_eq_img_${eq.id}`);
        if (stored) result[eq.id] = stored;
      });
    } catch {}
    return result;
  });

  const setImage = (eqId, dataUrl) => {
    try { localStorage.setItem(`bsc_eq_img_${eqId}`, dataUrl); } catch {}
    setImages(prev => ({ ...prev, [eqId]: dataUrl }));
  };

  const removeImage = (eqId) => {
    try { localStorage.removeItem(`bsc_eq_img_${eqId}`); } catch {}
    setImages(prev => { const next = { ...prev }; delete next[eqId]; return next; });
  };

  return { images, setImage, removeImage };
}

// ─── WORKFLOW SECTION (Employee) ─────────────────────────────────────────────
// A redesigned, professional tab bar replacing the old plain-button row.
// Accepts selectedTab + setSelectedTab from the parent EmployeeDashboard.

const WORKFLOW_TABS = [
  { id: "timecard",  label: "Time Card",   icon: "clock",    color: "var(--blue)"   },
  { id: "fuel",      label: "Fuel Entry",  icon: "fuel",     color: "var(--amber)"  },
  { id: "equipment", label: "Equipment",   icon: "hard_hat", color: "var(--green)"  },
  { id: "tasks",     label: "Tasks",       icon: "briefcase",color: "var(--purple)" },
];

function WorkflowSection({ selectedTab, setSelectedTab }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 6,
      background: "var(--bg3)",
      borderRadius: "var(--radius-lg)",
      padding: 6,
      border: "1px solid var(--border)",
    }}>
      {WORKFLOW_TABS.map(tab => {
        const active = selectedTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "10px 4px",
              background: active ? "var(--card)" : "transparent",
              border: active ? `1.5px solid ${tab.color}30` : "1.5px solid transparent",
              borderRadius: "var(--radius)",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              position: "relative",
            }}
          >
            {active && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: tab.color, borderRadius: "0 0 2px 2px" }}/>}
            <div style={{
              width: 28, height: 28, borderRadius: "var(--radius-sm)",
              background: active ? `${tab.color}15` : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              <Icon name={tab.icon} size={15} color={active ? tab.color : "var(--text4)"}/>
            </div>
            <span style={{
              fontSize: 10.5, fontWeight: active ? 700 : 500,
              color: active ? tab.color : "var(--text3)",
              lineHeight: 1.2, textAlign: "center",
              whiteSpace: "nowrap",
            }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ADMIN WORKFLOW SECTION ───────────────────────────────────────────────────
// Standalone panel added to the bottom of AdminDashboard.
// Has its own tab state, no dependency on parent.


// ─── WORKFLOW EQUIPMENT TAB ───────────────────────────────────────────────────
// Displays the full fleet with custom thumbnail upload (admin) or read-only (employee).
// Images are persisted in localStorage per-device and shared across sessions on same browser.

function WorkflowEquipmentTab({ isAdmin, addToast }) {
  const { images, setImage, removeImage } = useEquipmentImages();
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const uploadRefs = useRef({});

  const filtered = EQUIPMENT_LIST.filter(eq =>
    !search ||
    eq.brand.toLowerCase().includes(search.toLowerCase()) ||
    eq.model.toLowerCase().includes(search.toLowerCase()) ||
    eq.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleImageFile = (eqId, file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { addToast("Image must be under 8MB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 400; let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        setImage(eqId, canvas.toDataURL("image/jpeg", 0.82));
        addToast("Equipment image updated.", "success");
        setEditingId(null);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const typeLabel = t => t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Equipment Fleet</div>
          <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 2 }}>
            {EQUIPMENT_LIST.length} units · {Object.keys(images).length} with custom photos
          </div>
        </div>
        {isAdmin && (
          <div style={{ fontSize: 12, color: "var(--blue)", background: "var(--blue-light)", padding: "5px 10px", borderRadius: 999, border: "1px solid var(--blue-mid)", fontWeight: 600 }}>
            ✏ Tap any card to upload a photo
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Icon name="search" size={14} color="var(--text4)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}/>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search equipment…"
          style={{ paddingLeft: 34, fontSize: 14 }}
        />
      </div>

      {/* Equipment grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
        {filtered.map(eq => {
          const customImg = images[eq.id];
          const isEditing = editingId === eq.id;

          return (
            <div
              key={eq.id}
              className="fade-up"
              style={{
                background: "var(--card)",
                border: `1.5px solid ${isEditing ? "var(--blue)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: isEditing ? "0 0 0 3px var(--blue-dim)" : "var(--shadow-sm)",
                transition: "all 0.15s",
              }}
            >
              {/* Thumbnail area */}
              <div
                style={{
                  height: 110, background: customImg ? "transparent" : `${eq.color}0d`,
                  borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", cursor: isAdmin ? "pointer" : "default",
                  overflow: "hidden",
                }}
                onClick={() => isAdmin && setEditingId(isEditing ? null : eq.id)}
              >
                {customImg ? (
                  <img
                    src={customImg} alt={eq.brand}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <EquipmentThumb type={eq.type} color={eq.color} size={72}/>
                )}

                {/* Admin overlay on hover/edit */}
                {isAdmin && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: isEditing ? "rgba(37,99,235,0.18)" : "rgba(0,0,0,0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, transition: "all 0.2s",
                    opacity: isEditing ? 1 : 0,
                  }}
                  onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = "rgba(0,0,0,0.25)"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { if (!isEditing) { e.currentTarget.style.background = "rgba(0,0,0,0)"; e.currentTarget.style.opacity = "0"; } }}
                  >
                    {/* Upload button */}
                    <label style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "var(--shadow-md)", flexShrink: 0,
                    }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Icon name="camera" size={16} color="var(--blue)"/>
                      <input
                        ref={r => uploadRefs.current[eq.id] = r}
                        type="file" accept="image/*"
                        style={{ display: "none" }}
                        onChange={e => { handleImageFile(eq.id, e.target.files?.[0]); e.target.value = ""; }}
                      />
                    </label>
                    {/* Remove button */}
                    {customImg && (
                      <button
                        onClick={e => { e.stopPropagation(); removeImage(eq.id); setEditingId(null); addToast("Image removed.", "info"); }}
                        style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "white", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "var(--shadow-md)", flexShrink: 0,
                        }}
                      >
                        <Icon name="x" size={14} color="var(--red)"/>
                      </button>
                    )}
                  </div>
                )}

                {/* "Custom photo" badge */}
                {customImg && (
                  <div style={{
                    position: "absolute", top: 6, left: 6,
                    background: "rgba(5,150,105,0.85)", color: "white",
                    fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
                    letterSpacing: "0.03em",
                  }}>📷 Custom</div>
                )}

                {/* Type badge */}
                <div style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                }}>
                  {typeLabel(eq.type)}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{eq.brand}</div>
                    {eq.model && (
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ background: `${eq.color}18`, color: eq.color, padding: "1px 6px", borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                          {eq.model}
                        </span>
                        {eq.year && <span style={{ color: "var(--text4)", fontSize: 11 }}>{eq.year}</span>}
                      </div>
                    )}
                  </div>
                  {/* Equipment ID chip */}
                  <div style={{
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    borderRadius: 5, padding: "2px 7px", fontSize: 10.5,
                    fontWeight: 700, color: "var(--text3)", flexShrink: 0, fontFamily: "monospace",
                  }}>
                    {eq.id.toUpperCase()}
                  </div>
                </div>

                {/* Admin upload hint */}
                {isAdmin && !customImg && (
                  <button
                    onClick={() => setEditingId(isEditing ? null : eq.id)}
                    style={{
                      marginTop: 10, width: "100%", padding: "7px 10px",
                      border: "1.5px dashed var(--border2)", borderRadius: "var(--radius-sm)",
                      background: isEditing ? "var(--blue-light)" : "var(--bg3)",
                      color: isEditing ? "var(--blue)" : "var(--text4)",
                      fontSize: 12, fontWeight: 500, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon name="camera" size={13} color={isEditing ? "var(--blue)" : "var(--text4)"}/>
                    {isEditing ? "Hover thumbnail to upload" : "Upload equipment photo"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin tip */}
      {isAdmin && (
        <div style={{
          marginTop: 16, padding: "10px 14px",
          background: "var(--blue-light)", border: "1px solid var(--blue-mid)",
          borderRadius: "var(--radius)", fontSize: 12.5, color: "var(--blue)",
          display: "flex", alignItems: "center", gap: 8, lineHeight: 1.5,
        }}>
          <Icon name="shield" size={14} color="var(--blue)" style={{ flexShrink: 0 }}/>
          Equipment photos are saved to this device's browser storage and instantly reflected in the Fuel Entry module. For company-wide sharing, ask your developer to add an image upload API.
        </div>
      )}
    </div>
  );
}

function AuditPage({t}){
  const[logs,setLogs]=useState([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{authFetch("/api/audit-logs").then(r=>r.json()).then(d=>{setLogs(Array.isArray(d?.logs)?d.logs:[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
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

function FuelEntryPage({ currentUser, t, addToast, assignedJobSites = [], allJobSites = [], onMount, onUnmount,
  preselectedJobSiteId = "", preselectedIsOnSite = null, preselectedGps = null }) {
  const isAdmin = ["admin", "manager", "owner"].includes(currentUser?.role);
  // Admins land on History (no equipment grid); employees land on Equipment grid
  const [view, setView] = useState(() =>
    ["admin", "manager", "owner"].includes(currentUser?.role) ? "history" : "equipment"
  );
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [entryType, setEntryType] = useState("eod"); // "fill" | "eod"
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [eodStatus, setEodStatus] = useState({}); // { eq_id: true/false } today's EOD submitted
  const [jobSites, setJobSites] = useState([]);
  // For admins: internal site selection. For employees: driven by preselectedJobSiteId from parent.
  const [adminJobSiteId, setAdminJobSiteId] = useState("");
  const globalJobSiteId = isAdmin ? adminJobSiteId : preselectedJobSiteId;


  // Page title lifecycle
  useEffect(()=>{
    if(onMount) onMount();
    return ()=>{ if(onUnmount) onUnmount(); };
  },[]);

  // Load today's EOD status + logs on mount
  useEffect(() => {
    loadLogs();
    loadAlerts();
    if (isAdmin) loadDashboard();
    loadJobSites();
  }, []);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await authFetch("/api/fuel/logs?limit=200");
      if (res.ok) {
        const data = await safeJson(res);
        setLogs(data?.logs || []);
        // Build EOD status map for today
        const today = new Date().toISOString().slice(0, 10);
        const status = {};
        (data.logs || []).forEach(l => {
          if (l.entry_type === "eod" && (l.log_date||"").slice(0,10) === today) status[l.equipment_id] = true;
        });
        setEodStatus(status);
      }
    } catch {}
    setLoadingLogs(false);
  };

  const loadAlerts = async () => {
    try {
      const res = await authFetch("/api/fuel/alerts");
      if (res.ok) { const d = await safeJson(res); setAlerts(d?.alerts || []); }
    } catch {}
  };

  const loadDashboard = async () => {
    try {
      const res = await authFetch("/api/fuel/dashboard");
      if (res.ok) { const d = await safeJson(res); if(d && !d.error) setDashData(d); }
    } catch {}
  };

  const loadJobSites = async () => {
    try {
      const res = await authFetch("/api/fuel/job-sites");
      if (res.ok) { const d = await safeJson(res); setJobSites(d?.sites || []); }
    } catch {}
  };

  const openEntry = (eq, type) => {
    setSelectedEquipment(eq);
    setEntryType(type);
    setView("form");
  };

  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  // ── Tab bar — admin sees History/Dashboard/Alerts/Reports (no Equipment grid)
  //             employee sees Equipment grid + My Logs
  const tabs = isAdmin ? [
    { id: "history",   label: "History",   icon: "log"   },
    { id: "dashboard", label: "Dashboard", icon: "gauge" },
    { id: "alerts",    label: `Alerts${unresolvedAlerts ? ` (${unresolvedAlerts})` : ""}`, icon: "alert" },
    { id: "reports",   label: "Reports",   icon: "bar"   },
  ] : [
    { id: "equipment", label: "Equipment", icon: "hard_hat" },
    { id: "my_logs",   label: "My Logs",   icon: "log"   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, minHeight: 0 }}>
      {/* Alert badge (for admins — compact, no full card) */}
      {unresolvedAlerts > 0 && isAdmin && (
        <div onClick={() => setView("alerts")} style={{ background:"var(--red-light)", border:"1.5px solid rgba(220,38,38,0.2)", borderRadius:"var(--radius)", padding:"9px 14px", marginBottom:4, display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
          <Icon name="alert" size={14} color="var(--red)" style={{ flexShrink:0 }}/>
          <div style={{ fontSize:13, color:"var(--red)", fontWeight:600, flex:1 }}>{unresolvedAlerts} unresolved fuel alert{unresolvedAlerts!==1?"s":""}</div>
          <span style={{ fontSize:12, color:"var(--red)", opacity:0.7 }}>View →</span>
        </div>
      )}

      {/* Admin no longer has a job site dropdown here — site context is in History/Dashboard views */}

      {/* Employee: gate access until a job site is selected */}
      {!isAdmin && !preselectedJobSiteId && view !== "form" && (
        <div style={{ background:"var(--amber-light)", border:"1.5px solid rgba(217,119,6,0.25)", borderRadius:"var(--radius)", padding:"16px 16px", marginBottom:4, display:"flex", alignItems:"center", gap:12 }}>
          <Icon name="pin" size={18} color="var(--amber)" style={{ flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#92400e" }}>Select a Job Site to continue</div>
            <div style={{ fontSize:12.5, color:"#b45309", marginTop:2 }}>Use the Job Site selector above to choose your work location before logging fuel.</div>
          </div>
        </div>
      )}

      {/* Sub-navigation tabs */}
      {view !== "form" && (
        <div style={{ display: "flex", gap: 4, background: "var(--bg3)", borderRadius: "var(--radius)", padding: 4, marginBottom: 16, overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{ flex: 1, minWidth: "fit-content", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 12px", borderRadius: "var(--radius-sm)", background: view === tab.id ? "white" : "transparent", color: view === tab.id ? "var(--blue)" : "var(--text3)", fontWeight: view === tab.id ? 600 : 450, fontSize: 13, border: view === tab.id ? "1px solid var(--blue-mid)" : "1px solid transparent", cursor: "pointer", boxShadow: view === tab.id ? "var(--shadow-sm)" : "none", whiteSpace: "nowrap", transition: "all 0.15s" }}>
              <Icon name={tab.icon} size={13} color={view === tab.id ? "var(--blue)" : "var(--text3)"}/>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {view === "equipment" && !isAdmin && <FuelEquipmentGrid eodStatus={eodStatus} openEntry={openEntry} isAdmin={false} logs={logs} loadingLogs={loadingLogs} siteRequired={!preselectedJobSiteId}/>}
      {view === "form" && selectedEquipment && (
        <FuelEntryForm
          equipment={selectedEquipment}
          entryType={entryType}
          currentUser={currentUser}
          jobSites={jobSites.length > 0 ? jobSites : (isAdmin ? allJobSites : assignedJobSites).map(w => ({ id: w.id, name: w.name }))}
          defaultJobSiteId={globalJobSiteId}
          preselectedIsOnSite={isAdmin ? null : preselectedIsOnSite}
          preselectedGps={isAdmin ? null : preselectedGps}
          addToast={addToast}
          onBack={() => { setView("equipment"); setSelectedEquipment(null); }}
          onSuccess={() => { loadLogs(); loadAlerts(); if (isAdmin) loadDashboard(); setView("equipment"); }}
        />
      )}
      {view === "history"   && isAdmin && <FuelHistoryView logs={logs} loadingLogs={loadingLogs} currentUser={currentUser} isAdmin={true} onRefresh={loadLogs}/>}
      {view === "dashboard" && isAdmin && <FuelDashboard dashData={dashData} logs={logs} alerts={alerts} onViewAlerts={() => setView("alerts")}/>}
      {view === "alerts" && isAdmin && <FuelAlertsView alerts={alerts} onRefresh={loadAlerts} addToast={addToast}/>}
      {view === "reports" && isAdmin && <FuelReportsPage logs={logs} addToast={addToast}/>}
      {view === "my_logs" && !isAdmin && <FuelMyLogs logs={logs} loadingLogs={loadingLogs} currentUser={currentUser} onRefresh={loadLogs}/>}
    </div>
  );
}

function FuelEquipmentGrid({ eodStatus, openEntry, isAdmin, logs, loadingLogs, siteRequired }) {
  const today = new Date().toISOString().slice(0, 10);

  // Custom equipment images (same localStorage store as WorkflowEquipmentTab)
  const { images: eqImages } = useEquipmentImages();

  // Last known fuel level per equipment from logs
  const lastLevel = {};
  [...logs].reverse().forEach(l => {
    if (!lastLevel[l.equipment_id]) lastLevel[l.equipment_id] = l.fuel_level_after ?? l.fuel_level_remaining;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Equipment Fleet</div>
          <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 2 }}>Tap an equipment card to log fuel</div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text3)", background: "var(--bg3)", padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
          {EQUIPMENT_LIST.length} units
        </div>
      </div>

      {/* EOD reminder */}
      <div style={{ background: "var(--amber-light)", border: "1.5px solid rgba(217,119,6,0.25)", borderRadius: "var(--radius)", padding: "11px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Icon name="alert" size={15} color="var(--amber)" style={{ marginTop: 1, flexShrink: 0 }}/>
        <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
          <strong>End-of-Day Reminder:</strong> Each operator must record remaining fuel levels for all assigned equipment before end of shift.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 12 }}>
        {EQUIPMENT_LIST.map(eq => {
          const eodDone = eodStatus[eq.id];
          const level = lastLevel[eq.id];
          const hasTrailer = eq.type === "trailer";
          return (
            <div key={eq.id} className="fade-up" style={{ background: "var(--card)", border: `1.5px solid ${eodDone ? "rgba(5,150,105,0.25)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: 16, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
              {/* EOD status ribbon */}
              {eodDone && (
                <div style={{ position: "absolute", top: 0, right: 0, background: "var(--green)", color: "white", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: "0 var(--radius-lg) 0 var(--radius-sm)", letterSpacing: "0.05em" }}>EOD ✓</div>
              )}

              {/* Equipment thumbnail + info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 64, height: 48, borderRadius: "var(--radius)", background: eqImages[eq.id] ? "transparent" : `${eq.color}10`, border: `1.5px solid ${eqImages[eq.id] ? eq.color + "30" : eq.color + "30"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {eqImages[eq.id]
                    ? <img src={eqImages[eq.id]} alt={eq.brand} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius)" }}/>
                    : <EquipmentThumb type={eq.type} color={eq.color} size={50}/>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{eq.brand}</div>
                  {eq.model && <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 1 }}>{eq.model}{eq.year ? ` · ${eq.year}` : ""}</div>}
                  <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2, textTransform: "capitalize" }}>{eq.type.replace(/_/g, " ")}</div>
                </div>
              </div>

              {/* Fuel level gauge */}
              {!hasTrailer && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: "8px 12px" }}>
                  <FuelGauge level={level ?? 50} size={52}/>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Last Recorded</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
                      {level != null ? `${level}%` : "—"}
                    </div>
                    {level == null && <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 2 }}>No record today</div>}
                  </div>
                </div>
              )}

              {/* Action buttons — disabled until job site is selected (employees) */}
              <div style={{ display: "flex", gap: 8 }}>
                {!hasTrailer && (
                  <button
                    onClick={() => { if (!siteRequired) openEntry(eq, "fill"); }}
                    disabled={!!siteRequired}
                    title={siteRequired ? "Select a job site above first" : ""}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", borderRadius: "var(--radius-sm)", background: siteRequired ? "var(--bg3)" : "var(--blue-light)", color: siteRequired ? "var(--text4)" : "var(--blue)", border: `1.5px solid ${siteRequired ? "var(--border)" : "var(--blue-mid)"}`, fontSize: 12.5, fontWeight: 600, cursor: siteRequired ? "not-allowed" : "pointer", opacity: siteRequired ? 0.45 : 1, minHeight: 38 }}>
                    <Icon name="droplet" size={13} color={siteRequired ? "var(--text4)" : "var(--blue)"}/>
                    Fuel Fill
                  </button>
                )}
                <button
                  onClick={() => { if (!siteRequired) openEntry(eq, "eod"); }}
                  disabled={!!siteRequired}
                  title={siteRequired ? "Select a job site above first" : ""}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", borderRadius: "var(--radius-sm)", background: siteRequired ? "var(--bg3)" : (eodDone ? "var(--green-light)" : "var(--bg3)"), color: siteRequired ? "var(--text4)" : (eodDone ? "var(--green)" : "var(--text2)"), border: `1.5px solid ${siteRequired ? "var(--border)" : (eodDone ? "rgba(5,150,105,0.2)" : "var(--border)")}`, fontSize: 12.5, fontWeight: 600, cursor: siteRequired ? "not-allowed" : "pointer", opacity: siteRequired ? 0.45 : 1, minHeight: 38 }}>
                  <Icon name="flag" size={13} color={siteRequired ? "var(--text4)" : (eodDone ? "var(--green)" : "var(--text3)")}/>
                  {eodDone ? "EOD ✓" : "End of Day"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FuelEntryForm({ equipment, entryType, currentUser, jobSites, defaultJobSiteId = "",
  preselectedIsOnSite = null, preselectedGps = null, addToast, onBack, onSuccess }) {
  const [type, setType] = useState(entryType);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gps, setGps] = useState(preselectedGps || null); // seed with parent GPS if available
  const [photo1, setPhoto1] = useState(null);
  const [photo2, setPhoto2] = useState(null);
  const fileRef1 = useRef(null);
  const fileRef2 = useRef(null);

  // Form fields — pre-fill jobSite from parent-level selection
  const [jobSite, setJobSite] = useState(defaultJobSiteId || "");
  const [fuelBefore, setFuelBefore] = useState("");
  const [fuelAfter, setFuelAfter] = useState("");
  const [fuelRemaining, setFuelRemaining] = useState("");
  const [gallonsAdded, setGallonsAdded] = useState("");
  const [hoursReading, setHoursReading] = useState("");
  const [remarks, setRemarks] = useState("");
  const [supervisorNote, setSupervisorNote] = useState("");

  // Capture GPS on open — skip if parent already provided it
  useEffect(() => {
    if (preselectedGps) { setLocating(false); return; } // already have GPS from job site check
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocating(false); },
        () => setLocating(false),
        { timeout: 8000, maximumAge: 30000 }
      );
    } else { setLocating(false); }
  }, []);

  const handlePhoto = (file, setter) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { addToast("Photo must be under 10MB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800; let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } } else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        setter(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!jobSite) { addToast("Please select a job site.", "error"); return false; }
    if (type === "fill") {
      if (fuelBefore === "") { addToast("Please enter before-fill fuel level.", "error"); return false; }
      if (!gallonsAdded) { addToast("Please enter gallons added.", "error"); return false; }
    } else {
      if (fuelRemaining === "") { addToast("Please enter remaining fuel level.", "error"); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // ── Compute is_on_site ──────────────────────────────────────────────
      let isOnSite = preselectedIsOnSite; // use parent-verified value when available
      if (isOnSite === null && gps && jobSite && jobSite !== "__other__") {
        const site = jobSites.find(s => String(s.id) === String(jobSite));
        if (site?.latitude && site?.longitude) {
          const R = 6371000;
          const dLat = (site.latitude - gps.lat) * Math.PI / 180;
          const dLon = (site.longitude - gps.lon) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(gps.lat*Math.PI/180)*Math.cos(site.latitude*Math.PI/180)*Math.sin(dLon/2)**2;
          const distFt = R * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a)) * 3.28084;
          isOnSite = distFt <= (site.geofence_radius_ft || 500);
        }
      }

      // ── Build payload — strip undefined/null photos to reduce payload size ──
      const payload = {
        equipment_id:          equipment.id,
        equipment_brand:       equipment.brand,
        equipment_model:       equipment.model,
        entry_type:            type,
        job_site_id:           (jobSite && jobSite !== "__other__") ? jobSite : null,
        is_on_site:            isOnSite,
        fuel_level_before:     type === "fill" ? Number(fuelBefore)     : null,
        fuel_level_after:      type === "fill" ? Number(fuelAfter)      : null,
        fuel_level_remaining:  type === "eod"  ? Number(fuelRemaining)  : null,
        gallons_added:         type === "fill" ? Number(gallonsAdded)   : null,
        hours_reading:         hoursReading ? Number(hoursReading)      : null,
        remarks:               remarks.trim()        || null,
        supervisor_note:       supervisorNote.trim() || null,
        photo_before:          photo1 || null,
        photo_after:           photo2 || null,
        gps_lat:               gps?.lat ?? null,
        gps_lon:               gps?.lon ?? null,
        device_info:           navigator.userAgent.slice(0, 200),
        logged_at:             new Date().toISOString(),
      };

      console.log("[fuel/entry] submitting", { entry_type: payload.entry_type, equipment_id: payload.equipment_id, job_site_id: payload.job_site_id });

      // ── POST to backend ─────────────────────────────────────────────────
      let res;
      try {
        res = await authFetch("/api/fuel/entry", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (networkErr) {
        throw new Error("Network error — check your internet connection and try again.");
      }

      // ── Parse response safely (server may return HTML on 404/crash) ─────
      const data = await safeJson(res);

      if (!res.ok) {
        const msg = data?.error || data?.message || `Server returned ${res.status}`;
        console.error("[fuel/entry] server error", res.status, data);
        throw new Error(msg);
      }

      console.log("[fuel/entry] success", data);
      addToast(
        type === "eod" ? "End-of-day fuel recorded successfully!" : "Fuel fill logged successfully!",
        "success"
      );
      onSuccess();
    } catch (err) {
      console.error("[fuel/entry] submit error", err);
      addToast(err?.message || "Unexpected error submitting entry. Please try again.", "error");
    }
    setSubmitting(false);
  };

  const fuelPct = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

  return (
    <div>
      {/* Back header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text2)", width: 36, height: 36, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{equipment.brand}{equipment.model ? ` · ${equipment.model}` : ""}</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>
            {equipment.year ? `${equipment.year} · ` : ""}{equipment.type.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Entry type toggle */}
      <div style={{ display: "grid", gridTemplateColumns: equipment.type === "trailer" ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 20, background: "var(--bg3)", borderRadius: "var(--radius)", padding: 4 }}>
        {equipment.type !== "trailer" && (
          <button onClick={() => setType("fill")} style={{ padding: "10px", borderRadius: "var(--radius-sm)", background: type === "fill" ? "white" : "transparent", color: type === "fill" ? "var(--blue)" : "var(--text3)", fontWeight: type === "fill" ? 700 : 450, fontSize: 13.5, border: type === "fill" ? "1px solid var(--blue-mid)" : "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: type === "fill" ? "var(--shadow-sm)" : "none" }}>
            <Icon name="droplet" size={14} color={type === "fill" ? "var(--blue)" : "var(--text3)"}/>
            Fuel Fill Entry
          </button>
        )}
        <button onClick={() => setType("eod")} style={{ padding: "10px", borderRadius: "var(--radius-sm)", background: type === "eod" ? "white" : "transparent", color: type === "eod" ? "var(--green)" : "var(--text3)", fontWeight: type === "eod" ? 700 : 450, fontSize: 13.5, border: type === "eod" ? "1px solid rgba(5,150,105,0.3)" : "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: type === "eod" ? "var(--shadow-sm)" : "none" }}>
          <Icon name="flag" size={14} color={type === "eod" ? "var(--green)" : "var(--text3)"}/>
          End-of-Day Remaining
        </button>
      </div>

      {/* Operator info bar */}
      <div style={{ background: "var(--blue-light)", border: "1px solid var(--blue-mid)", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="user" size={14} color="var(--blue)"/>
        <div style={{ flex: 1, fontSize: 13, color: "var(--blue)", fontWeight: 500 }}>
          <strong>{currentUser?.name}</strong> · {currentUser?.userId || currentUser?.id?.slice(0, 8)} · {currentUser?.role}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: locating ? "var(--text3)" : (gps ? "var(--green)" : "var(--red)") }}>
          {locating ? <span className="spin" style={{ width: 10, height: 10, border: "2px solid var(--text4)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }}/> : <Icon name="pin" size={12} color={gps ? "var(--green)" : "var(--red)"}/>}
          {locating ? "Locating…" : gps ? "GPS captured" : "No GPS"}
        </div>
      </div>

      {/* Auto-captured timestamp */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "var(--text3)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="clock" size={12} color="var(--text3)"/>
        Entry timestamp: <strong style={{ color: "var(--text2)" }}>{new Date().toLocaleString()}</strong>
        {gps && <span style={{ marginLeft: "auto" }}>📍 {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}</span>}
      </div>

      {/* Form fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Job site — shows pre-selected site or dropdown if none chosen */}
        <div>
          <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Job Site <span style={{ color: "var(--red)" }}>*</span></label>
          {defaultJobSiteId && jobSite === defaultJobSiteId ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"var(--blue-light)", border:"1.5px solid var(--blue-mid)", borderRadius:"var(--radius-sm)" }}>
              <Icon name="pin" size={13} color="var(--blue)"/>
              <span style={{ fontSize:14, fontWeight:600, color:"var(--blue)", flex:1 }}>
                {jobSites.find(s => String(s.id) === String(jobSite))?.name || jobSite}
              </span>
              <button onClick={() => setJobSite("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--blue)", fontSize:12, fontWeight:600, padding:"0 2px" }}>Change</button>
            </div>
          ) : (
            <select value={jobSite} onChange={e => setJobSite(e.target.value)} style={{ fontSize: 15 }}>
              <option value="">Select job site…</option>
              {jobSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="__other__">Other / Not Listed</option>
            </select>
          )}
        </div>

        {/* Hours reading */}
        <div>
          <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Machine Hours / Meter Reading</label>
          <input type="number" min="0" value={hoursReading} onChange={e => setHoursReading(e.target.value)} placeholder="e.g. 3452" style={{ fontSize: 15 }}/>
        </div>

        {/* Fuel Fill fields */}
        {type === "fill" && equipment.type !== "trailer" && (<>
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Fuel Level Before Fill (%) <span style={{ color: "var(--red)" }}>*</span></label>
            <select value={fuelBefore} onChange={e => setFuelBefore(e.target.value)} style={{ fontSize: 15 }}>
              <option value="">Select level…</option>
              {fuelPct.map(p => <option key={p} value={p}>{p}% {p === 0 ? "(Empty)" : p === 100 ? "(Full)" : p === 25 ? "(¼ Tank)" : p === 50 ? "(½ Tank)" : p === 75 ? "(¾ Tank)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Gallons / Liters Added <span style={{ color: "var(--red)" }}>*</span></label>
            <input type="number" min="0" step="0.1" value={gallonsAdded} onChange={e => setGallonsAdded(e.target.value)} placeholder="e.g. 45.5" style={{ fontSize: 15 }}/>
          </div>
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Fuel Level After Fill (%)</label>
            <select value={fuelAfter} onChange={e => setFuelAfter(e.target.value)} style={{ fontSize: 15 }}>
              <option value="">Select level…</option>
              {fuelPct.map(p => <option key={p} value={p}>{p}% {p === 100 ? "(Full)" : p === 75 ? "(¾ Tank)" : ""}</option>)}
            </select>
          </div>
          {/* Photo — before fill meter */}
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Meter Photo (Before Fill)</label>
            <input ref={fileRef1} type="file" accept="image/*" capture="environment" onChange={e => handlePhoto(e.target.files?.[0], setPhoto1)} style={{ display: "none" }}/>
            {photo1 ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img src={photo1} alt="meter" style={{ width: "100%", maxWidth: 260, borderRadius: "var(--radius)", border: "1.5px solid var(--border)", display: "block" }}/>
                <button onClick={() => setPhoto1(null)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", border: "none", color: "white", borderRadius: 999, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={12} color="white"/></button>
              </div>
            ) : (
              <button onClick={() => fileRef1.current?.click()} style={{ width: "100%", padding: "16px", border: "2px dashed var(--border2)", borderRadius: "var(--radius)", background: "var(--bg3)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5 }}>
                <Icon name="camera" size={16} color="var(--text3)"/> Tap to capture meter photo
              </button>
            )}
          </div>
          {/* Photo — after fill */}
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Meter Photo (After Fill)</label>
            <input ref={fileRef2} type="file" accept="image/*" capture="environment" onChange={e => handlePhoto(e.target.files?.[0], setPhoto2)} style={{ display: "none" }}/>
            {photo2 ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img src={photo2} alt="meter after" style={{ width: "100%", maxWidth: 260, borderRadius: "var(--radius)", border: "1.5px solid var(--border)", display: "block" }}/>
                <button onClick={() => setPhoto2(null)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", border: "none", color: "white", borderRadius: 999, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={12} color="white"/></button>
              </div>
            ) : (
              <button onClick={() => fileRef2.current?.click()} style={{ width: "100%", padding: "16px", border: "2px dashed var(--border2)", borderRadius: "var(--radius)", background: "var(--bg3)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5 }}>
                <Icon name="camera" size={16} color="var(--text3)"/> Tap to capture post-fill photo
              </button>
            )}
          </div>
        </>)}

        {/* EOD fields */}
        {type === "eod" && (<>
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Remaining Fuel Level (%) <span style={{ color: "var(--red)" }}>*</span></label>
            <select value={fuelRemaining} onChange={e => setFuelRemaining(e.target.value)} style={{ fontSize: 15 }}>
              <option value="">Select remaining level…</option>
              {fuelPct.map(p => <option key={p} value={p}>{p}% {p === 0 ? "(Empty)" : p === 100 ? "(Full)" : p === 25 ? "(¼ Tank)" : p === 50 ? "(½ Tank)" : p === 75 ? "(¾ Tank)" : ""}</option>)}
            </select>
            {fuelRemaining !== "" && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
                <FuelGauge level={Number(fuelRemaining)} size={100}/>
              </div>
            )}
          </div>
          {/* EOD photo */}
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Fuel Indicator / Meter Photo <span style={{ color: "var(--red)" }}>*</span></label>
            <input ref={fileRef1} type="file" accept="image/*" capture="environment" onChange={e => handlePhoto(e.target.files?.[0], setPhoto1)} style={{ display: "none" }}/>
            {photo1 ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img src={photo1} alt="fuel proof" style={{ width: "100%", maxWidth: 260, borderRadius: "var(--radius)", border: "1.5px solid var(--green)", display: "block" }}/>
                <button onClick={() => setPhoto1(null)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", border: "none", color: "white", borderRadius: 999, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={12} color="white"/></button>
                <div style={{ background: "var(--green)", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: "0 0 var(--radius-sm) 0", position: "absolute", top: 0, left: 0 }}>Photo captured ✓</div>
              </div>
            ) : (
              <button onClick={() => fileRef1.current?.click()} style={{ width: "100%", padding: "20px 16px", border: "2px dashed rgba(5,150,105,0.4)", borderRadius: "var(--radius)", background: "var(--green-light)", color: "var(--green)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                <Icon name="camera" size={22} color="var(--green)"/>
                <span>Tap to take fuel proof photo</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text3)" }}>Required for end-of-day verification</span>
              </button>
            )}
          </div>
          {/* Supervisor note */}
          <div>
            <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Supervisor Note (optional)</label>
            <textarea value={supervisorNote} onChange={e => setSupervisorNote(e.target.value)} placeholder="Any notes for the supervisor…" rows={2} style={{ fontSize: 14, resize: "vertical", minHeight: 64 }}/>
          </div>
        </>)}

        {/* Common remarks */}
        <div>
          <label style={{ fontSize: 12.5, color: "var(--text2)", display: "block", marginBottom: 6, fontWeight: 600 }}>Remarks / Notes</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes…" rows={2} style={{ fontSize: 14, resize: "vertical", minHeight: 64 }}/>
        </div>

        {/* Submit */}
        <div style={{ paddingTop: 4 }}>
          <Btn onClick={handleSubmit} loading={submitting} size="lg" style={{ width: "100%", background: type === "eod" ? "var(--green)" : "var(--blue)" }} variant="primary">
            <Icon name="check" size={16} color="white"/>
            {submitting ? "Saving…" : type === "eod" ? "Submit End-of-Day Fuel Record" : "Submit Fuel Fill Entry"}
          </Btn>
          <div style={{ fontSize: 11.5, color: "var(--text4)", textAlign: "center", marginTop: 8 }}>
            This entry will be timestamped and GPS-tagged for accountability
          </div>
        </div>
      </div>
    </div>
  );
}

