import { useState, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const API_URL = "https://script.google.com/macros/s/AKfycbx1JYHoGNkr0DCuzOZtExFhDWLCd3T8DMwtn3lgmE6osMPTDFIOjZUec04PbCP2t4rikA/exec";
const PALETTE = {
  bg:"#0f0f13",surface:"#16161d",card:"#1c1c26",border:"#2a2a3a",
  accent:"#7c6af7",accentLight:"#a594f9",green:"#3dd68c",red:"#f76a6a",
  yellow:"#f7c948",blue:"#4db8ff",text:"#e8e6f0",muted:"#8884a0",
};
const CAT_COLORS=["#7c6af7","#3dd68c","#f76a6a","#f7c948","#4db8ff","#f97316","#ec4899","#14b8a6","#a3e635","#fb7185"];
const months=["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

async function apiRead(sheet){
  try{const r=await fetch(`${API_URL}?action=read&sheet=${encodeURIComponent(sheet)}`);return r.json();}catch{return[];}
}
async function apiPost(body){
  try{const r=await fetch(API_URL,{method:"POST",body:JSON.stringify(body),headers:{"Content-Type":"text/plain"}});return r.json();}catch{return{error:"network"};}
}
function fmt(n){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(Number(n)||0);}
function today(){return new Date().toISOString().split("T")[0];}

function ProgressBar({value,max,color=PALETTE.accent,danger=false,showPct=true}){
  const pct=max>0?Math.min((value/max)*100,100):0;
  const bc=danger&&pct>=90?PALETTE.red:danger&&pct>=70?PALETTE.yellow:color;
  return(
    <div style={{width:"100%"}}>
      {showPct&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:bc,fontWeight:700}}>{pct.toFixed(0)}%</span>
        <span style={{fontSize:12,color:PALETTE.muted}}>€{Number(value).toFixed(0)} / €{Number(max).toFixed(0)}</span>
      </div>}
      <div style={{background:PALETTE.border,borderRadius:99,height:8,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,background:bc,height:"100%",borderRadius:99,transition:"width 0.6s ease"}}/>
      </div>
    </div>
  );
}
function Spinner(){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,flexDirection:"column",gap:12}}>
    <div style={{width:36,height:36,border:`3px solid ${PALETTE.border}`,borderTop:`3px solid ${PALETTE.accent}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    <span style={{color:PALETTE.muted,fontSize:13}}>Caricamento...</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
function Modal({onClose,children,maxWidth=440}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:PALETTE.card,border:`1px solid ${PALETTE.border}`,borderRadius:20,padding:28,width:"100%",maxWidth,maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [remember,setRemember]=useState(true);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const inp={background:PALETTE.surface,border:`1px solid ${PALETTE.border}`,color:PALETTE.text,borderRadius:10,padding:"12px 16px",width:"100%",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

  async function handleLogin(){
    if(!username||!password){setError("Inserisci username e password");return;}
    setLoading(true);setError("");
    try{
      const users=await apiRead("users");
      if(!Array.isArray(users)){setError("Errore connessione");setLoading(false);return;}
      const user=users.find(u=>String(u.username).toLowerCase()===username.toLowerCase()&&String(u.password)===password);
      if(user){
        if(remember){localStorage.setItem("fintrack_user",JSON.stringify(user));}
        else{sessionStorage.setItem("fintrack_user",JSON.stringify(user));}
        onLogin(user);
      }else{setError("Credenziali errate");}
    }catch(e){setError("Errore connessione");}
    setLoading(false);
  }

  return(
    <div style={{background:PALETTE.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:36,fontWeight:800,letterSpacing:-1,color:PALETTE.text}}>fintrack<span style={{color:PALETTE.accent}}>.</span></div>
          <div style={{fontSize:14,color:PALETTE.muted,marginTop:8}}>Gestione finanze personali</div>
        </div>
        <div style={{background:PALETTE.card,border:`1px solid ${PALETTE.border}`,borderRadius:20,padding:32}}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:24}}>Accedi</div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div><div style={{fontSize:12,color:PALETTE.muted,marginBottom:6}}>Username</div><input style={inp} value={username} onChange={e=>setUsername(e.target.value)} placeholder="es. Arca" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
            <div><div style={{fontSize:12,color:PALETTE.muted,marginBottom:6}}>Password</div><input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,color:PALETTE.muted}}>
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{accentColor:PALETTE.accent,width:16,height:16}}/>
              Rimani connesso
            </label>
            {error&&<div style={{fontSize:13,color:PALETTE.red,background:PALETTE.red+"22",borderRadius:8,padding:"8px 12px"}}>{error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{background:PALETTE.accent,color:"white",border:"none",borderRadius:10,padding:13,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"inherit",opacity:loading?0.7:1}}>
              {loading?"Accesso...":"Accedi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function ExportModal({transactions,accounts,categories,onClose}){
  const [dateFrom,setDateFrom]=useState(()=>{const d=new Date();d.setDate(1);return d.toISOString().split("T")[0];});
  const [dateTo,setDateTo]=useState(today);
  const [format,setFormat]=useState("csv");
  const inp={background:PALETTE.surface,border:`1px solid ${PALETTE.border}`,color:PALETTE.text,borderRadius:8,padding:"8px 12px",width:"100%",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const lbl={fontSize:12,color:PALETTE.muted,marginBottom:4,display:"block"};
  const filtered=transactions.filter(t=>String(t.date)>=dateFrom&&String(t.date)<=dateTo);

  function exportCSV(){
    const rows=[["Data","Descrizione","Importo","Tipo","Categoria","Sottocategoria","Conto"]];
    filtered.forEach(t=>{
      const cat=categories.find(c=>String(c.id)===String(t.catId));
      const acc=accounts.find(a=>String(a.id)===String(t.accountId));
      rows.push([t.date,t.desc,t.amount,t.type==="income"?"Entrata":"Uscita",cat?.name||"",t.subcat||"",acc?.name||""]);
    });
    const csv=rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`fintrack_${dateFrom}_${dateTo}.csv`;a.click();
  }

  function exportPDF(){
    const inc=filtered.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
    const exp=filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+Math.abs(Number(t.amount)),0);
    const catMap={};filtered.filter(t=>t.type==="expense").forEach(t=>{const c=categories.find(x=>String(x.id)===String(t.catId));const n=c?.name||"Altro";catMap[n]=(catMap[n]||0)+Math.abs(Number(t.amount));});
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fintrack Report</title><style>body{font-family:Arial;padding:40px;max-width:900px;margin:0 auto}h1{color:#7c6af7}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#7c6af7;color:white;padding:8px}td{padding:8px;border-bottom:1px solid #eee}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}.kpi{background:#f8f9fa;border-radius:10px;padding:16px;text-align:center}.kv{font-size:24px;font-weight:800}.g{color:#3dd68c}.r{color:#f76a6a}.p{color:#7c6af7}</style></head><body>
    <h1>📊 Fintrack Report</h1><p>Periodo: ${dateFrom} → ${dateTo} | ${filtered.length} transazioni</p>
    <div class="kpis"><div class="kpi"><div>Entrate</div><div class="kv g">${fmt(inc)}</div></div><div class="kpi"><div>Uscite</div><div class="kv r">${fmt(exp)}</div></div><div class="kpi"><div>Saldo</div><div class="kv p">${fmt(inc-exp)}</div></div></div>
    <h2>Per Categoria</h2><table><tr><th>Categoria</th><th>Totale</th></tr>${Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${k}</td><td>${fmt(v)}</td></tr>`).join("")}</table>
    <h2 style="margin-top:24px">Transazioni</h2><table><tr><th>Data</th><th>Descrizione</th><th>Categoria</th><th>Conto</th><th>Importo</th></tr>${filtered.map(t=>{const c=categories.find(x=>String(x.id)===String(t.catId));const a=accounts.find(x=>String(x.id)===String(t.accountId));return`<tr><td>${t.date}</td><td>${t.desc}</td><td>${c?.name||""}</td><td>${a?.name||""}</td><td style="color:${t.type==="income"?"#3dd68c":"#f76a6a"};font-weight:700">${t.type==="income"?"+":""}${fmt(t.amount)}</td></tr>`;}).join("")}</table>
    <script>window.print()</script></body></html>`;
    window.open(URL.createObjectURL(new Blob([html],{type:"text/html"})),"_blank");
  }

  return(
    <Modal onClose={onClose}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>📤 Esporta Report</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={lbl}>Dal</label><input style={inp} type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></div>
          <div><label style={lbl}>Al</label><input style={inp} type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></div>
        </div>
        <div style={{background:PALETTE.surface,borderRadius:10,padding:12,fontSize:13,color:PALETTE.muted}}>{filtered.length} transazioni nel periodo</div>
        <div style={{display:"flex",gap:8}}>
          {[{id:"csv",label:"📊 Excel/CSV"},{id:"pdf",label:"🖨️ PDF"}].map(f=>(
            <button key={f.id} onClick={()=>setFormat(f.id)} style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${format===f.id?PALETTE.accent:PALETTE.border}`,background:format===f.id?PALETTE.accent+"22":"transparent",color:format===f.id?PALETTE.accent:PALETTE.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>{f.label}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button className="btn-ghost" style={{flex:1}} onClick={onClose}>Annulla</button>
          <button className="btn" style={{flex:1}} onClick={format==="csv"?exportCSV:exportPDF}>{format==="csv"?"Scarica CSV":"Apri PDF"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── TRICOUNT ─────────────────────────────────────────────────────────────────
function TricountTab({accounts,categories,transactions,setTransactions,setAccounts,budgets,setBudgets,currentUser,allUsers}){
  const [groups,setGroups]=useState([]);
  const [expenses,setExpenses]=useState([]);
  const [activeGroup,setActiveGroup]=useState(null);
  const [viewMode,setViewMode]=useState("list"); // list | analytics | closed
  const [modal,setModal]=useState(null);
  const [editExp,setEditExp]=useState(null);
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [loadingTC,setLoadingTC]=useState(true);
  const [analyticsRange,setAnalyticsRange]=useState({from:"",to:today()});

  const inp={background:PALETTE.surface,border:`1px solid ${PALETTE.border}`,color:PALETTE.text,borderRadius:8,padding:"8px 12px",width:"100%",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const lbl={fontSize:12,color:PALETTE.muted,marginBottom:4,display:"block"};

  async function loadTC(){
    setLoadingTC(true);
    const [grps,exps]=await Promise.all([apiRead("tricount_groups"),apiRead("tricount_expenses")]);
    const allG=Array.isArray(grps)?grps:[];
    const allE=Array.isArray(exps)?exps:[];
    const myG=allG.filter(g=>String(g.members||"").split(",").map(m=>m.trim()).includes(currentUser.name));
    setGroups(myG);setExpenses(allE);
    setLoadingTC(false);
  }
  useEffect(()=>{loadTC();},[]);

  const activeGroups=groups.filter(g=>String(g.status||"active")==="active");
  const closedGroups=groups.filter(g=>String(g.status||"active")==="closed");
  const memberOptions=allUsers.map(u=>u.name);

  function openNewGroup(){setForm({name:"",members:[]});setModal("newgroup");}

  async function createGroup(){
    if(!form.name||!form.members?.length)return;
    setSaving(true);
    const allM=[currentUser.name,...form.members.filter(m=>m!==currentUser.name)];
    const id=Date.now();
    await apiPost({action:"write",sheet:"tricount_groups",data:{id,name:form.name,members:allM.join(","),createdBy:currentUser.name,status:"active"}});
    await loadTC();setSaving(false);setModal(null);setActiveGroup(id);
  }

  async function closeGroup(gid){
    if(!confirm("Segnare questo gruppo come terminato?"))return;
    const g=groups.find(x=>String(x.id)===String(gid));
    await apiPost({action:"update",sheet:"tricount_groups",id:gid,data:{...g,status:"closed"}});
    await loadTC();setActiveGroup(null);
  }

  async function deleteGroup(gid){
    if(!confirm("Eliminare definitivamente questo gruppo e tutte le sue spese?"))return;
    await apiPost({action:"delete",sheet:"tricount_groups",id:gid});
    const ge=expenses.filter(e=>String(e.groupId)===String(gid));
    for(const e of ge)await apiPost({action:"delete",sheet:"tricount_expenses",id:e.id});
    await loadTC();setActiveGroup(null);
  }

  function openAddExpense(exp=null){
    const g=groups.find(g=>String(g.id)===String(activeGroup));if(!g)return;
    const members=String(g.members).split(",").map(m=>m.trim());
    if(exp){
      let splits={};try{splits=JSON.parse(exp.splits||"{}");}catch{}
      setEditExp(exp);
      setForm({desc:exp.desc,amount:exp.amount,paidBy:exp.paidBy,splitType:exp.splitType||"equal",splits,catId:String(exp.catId||""),subcat:exp.subcat||"",date:exp.date,accountId:exp.accountId||"",addToBudget:exp.addToBudget==="true"||exp.addToBudget===true});
    }else{
      setEditExp(null);
      const splits={};members.forEach(m=>splits[m]="");
      setForm({desc:"",amount:"",paidBy:currentUser.name,splitType:"equal",splits,catId:"",subcat:"",date:today(),accountId:"",addToBudget:false});
    }
    setModal("expense");
  }

  function getSplits(g){
    const members=String(g.members).split(",").map(m=>m.trim());
    if(form.splitType==="equal"){const each=(Number(form.amount)||0)/members.length;const s={};members.forEach(m=>s[m]=each.toFixed(2));return s;}
    return form.splits||{};
  }

  async function saveExpense(){
    const g=groups.find(g=>String(g.id)===String(activeGroup));if(!g)return;
    setSaving(true);
    const splits=getSplits(g);
    const id=editExp?editExp.id:Date.now();
    const expData={id,groupId:activeGroup,desc:form.desc,amount:Number(form.amount),paidBy:form.paidBy,splitType:form.splitType,splits:JSON.stringify(splits),catId:form.catId,subcat:form.subcat||"",date:form.date,accountId:form.accountId||"",addToBudget:form.addToBudget?"true":"false"};

    if(editExp){
      await apiPost({action:"update",sheet:"tricount_expenses",id,data:expData});
    }else{
      await apiPost({action:"write",sheet:"tricount_expenses",data:expData});
      if(form.paidBy===currentUser.name&&form.accountId){
        const cat=categories.find(c=>String(c.id)===String(form.catId));
        const txData={id:id+1,date:form.date,desc:`[Gruppo: ${g.name}] ${form.desc}`,amount:-Math.abs(Number(form.amount)),type:"expense",catId:form.catId,subcat:form.subcat||cat?.name||"",accountId:form.accountId,addToBudget:form.addToBudget?"true":"false"};
        await apiPost({action:"write",sheet:`${currentUser.prefix}_transactions`,data:txData});
        setTransactions(prev=>[txData,...prev]);
        const acc=accounts.find(a=>String(a.id)===String(form.accountId));
        if(acc){const nb=Number(acc.balance)-Math.abs(Number(form.amount));await apiPost({action:"update",sheet:`${currentUser.prefix}_accounts`,id:acc.id,data:{...acc,balance:nb}});setAccounts(prev=>prev.map(a=>String(a.id)===String(acc.id)?{...a,balance:nb}:a));}
      }
    }
    await loadTC();setSaving(false);setModal(null);setEditExp(null);
  }

  async function deleteExpense(expId){
    if(!confirm("Eliminare questa spesa?"))return;
    await apiPost({action:"delete",sheet:"tricount_expenses",id:expId});
    await loadTC();
  }

  function getGroupExpenses(groupId,onlyActive=false){
    let exps=expenses.filter(e=>String(e.groupId)===String(groupId));
    if(onlyActive&&analyticsRange.from)exps=exps.filter(e=>String(e.date)>=analyticsRange.from&&String(e.date)<=analyticsRange.to);
    return exps.map(e=>{let splits={};try{splits=JSON.parse(e.splits||"{}");}catch{}return{...e,splits,amount:Number(e.amount)};});
  }

  function calcBalances(groupId){
    const g=groups.find(g=>String(g.id)===String(groupId));if(!g)return{};
    const members=String(g.members).split(",").map(m=>m.trim());
    const paid={};const owed={};members.forEach(m=>{paid[m]=0;owed[m]=0;});
    getGroupExpenses(groupId).forEach(exp=>{
      paid[exp.paidBy]=(paid[exp.paidBy]||0)+exp.amount;
      Object.entries(exp.splits).forEach(([m,v])=>{owed[m]=(owed[m]||0)+Number(v);});
    });
    const net={};members.forEach(m=>net[m]=(paid[m]||0)-(owed[m]||0));
    return net;
  }

  function calcDebts(groupId){
    const net=calcBalances(groupId);
    const debts=[];
    const p=[...Object.entries(net).filter(([,v])=>v>0.01).sort((a,b)=>b[1]-a[1])];
    const n=[...Object.entries(net).filter(([,v])=>v<-0.01).sort((a,b)=>a[1]-b[1])];
    let pi=0,ni=0;
    while(pi<p.length&&ni<n.length){
      const[pm,pv]=p[pi];const[nm,nv]=n[ni];const amt=Math.min(pv,-nv);
      debts.push({from:nm,to:pm,amount:amt});
      p[pi]=[pm,pv-amt];n[ni]=[nm,nv+amt];
      if(p[pi][1]<0.01)pi++;if(n[ni][1]>-0.01)ni++;
    }
    return debts;
  }

  const currentGroup=groups.find(g=>String(g.id)===String(activeGroup));
  const currentGroupMembers=currentGroup?String(currentGroup.members).split(",").map(m=>m.trim()):[];
  const catSubs=(catId)=>{const cat=categories.find(c=>String(c.id)===String(catId));if(!cat||!cat.subs)return[];return String(cat.subs).split(",").map(s=>s.trim()).filter(Boolean);};

  // Analytics per gruppo
  function buildAnalytics(groupId){
    const exps=getGroupExpenses(groupId,true);
    const catMap={};
    exps.forEach(e=>{
      const cat=categories.find(c=>String(c.id)===String(e.catId));
      const name=cat?.name||"Altro";
      catMap[name]=(catMap[name]||0)+e.amount;
    });
    const byDate={};
    exps.forEach(e=>{const d=String(e.date).substring(0,7);byDate[d]=(byDate[d]||0)+e.amount;});
    const trend=Object.entries(byDate).sort((a,b)=>a[0]>b[0]?1:-1).map(([k,v])=>({name:months[parseInt(k.split("-")[1])-1],total:v}));
    return{catData:Object.entries(catMap).map(([name,value])=>({name,value})),trend,total:exps.reduce((s,e)=>s+e.amount,0)};
  }

  if(loadingTC)return <Spinner/>;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:700}}>Spese Condivise</h2>
          <div style={{fontSize:12,color:PALETTE.muted,marginTop:2}}>Sincronizzate in tempo reale</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-ghost" onClick={()=>setViewMode(viewMode==="closed"?"list":"closed")} style={{fontSize:12,padding:"6px 12px"}}>
            {viewMode==="closed"?"← Attivi":"📁 Passati"}
          </button>
          <button className="btn-ghost" onClick={loadTC} style={{fontSize:12,padding:"6px 12px"}}>↻</button>
          <button className="btn" onClick={openNewGroup}>+ Nuovo Gruppo</button>
        </div>
      </div>

      {/* Lista gruppi */}
      {!activeGroup&&viewMode!=="closed"&&(
        activeGroups.length===0?(
          <div className="card" style={{textAlign:"center",padding:48}}>
            <div style={{fontSize:40,marginBottom:12}}>👥</div>
            <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Nessun gruppo attivo</div>
            <button className="btn" onClick={openNewGroup}>+ Crea il primo gruppo</button>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
            {activeGroups.map(g=>{
              const net=calcBalances(g.id);const myNet=net[currentUser.name]||0;
              const members=String(g.members).split(",").map(m=>m.trim());
              return(
                <div key={g.id} className="card" style={{cursor:"pointer",borderLeft:`3px solid ${myNet>=0?PALETTE.green:PALETTE.red}`}} onClick={()=>setActiveGroup(g.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>👥 {g.name}</div>
                      <div style={{fontSize:12,color:PALETTE.muted}}>{members.join(", ")}</div>
                      <div style={{fontSize:12,color:PALETTE.muted,marginTop:4}}>{getGroupExpenses(g.id).length} spese</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:PALETTE.muted}}>{myNet>=0?"ti devono":"devi"}</div>
                      <div style={{fontSize:20,fontWeight:800,color:myNet>=0?PALETTE.green:PALETTE.red,fontFamily:"monospace"}}>{fmt(Math.abs(myNet))}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Gruppi chiusi */}
      {!activeGroup&&viewMode==="closed"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontSize:14,fontWeight:600,color:PALETTE.muted}}>📁 Tricount Passati ({closedGroups.length})</div>
          {closedGroups.length===0?<div className="card" style={{textAlign:"center",padding:32,color:PALETTE.muted}}>Nessun gruppo terminato</div>:
          closedGroups.map(g=>{
            const net=calcBalances(g.id);const myNet=net[currentUser.name]||0;
            return(
              <div key={g.id} className="card" style={{opacity:0.7,cursor:"pointer"}} onClick={()=>{setActiveGroup(g.id);setViewMode("list");}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:600}}>📁 {g.name}</div>
                    <div style={{fontSize:12,color:PALETTE.muted}}>{String(g.members).split(",").join(", ")} · {getGroupExpenses(g.id).length} spese</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:14,fontWeight:700,color:myNet>=0?PALETTE.green:PALETTE.red}}>{fmt(Math.abs(myNet))}</span>
                    <button className="btn-red" style={{fontSize:11}} onClick={e=>{e.stopPropagation();deleteGroup(g.id);}}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dettaglio gruppo */}
      {activeGroup&&currentGroup&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <button className="btn-ghost" onClick={()=>{setActiveGroup(null);setViewMode("list");}}>← Gruppi</button>
            <h3 style={{fontSize:16,fontWeight:700}}>👥 {currentGroup.name}</h3>
            <span style={{fontSize:12,color:PALETTE.muted,background:PALETTE.surface,padding:"3px 10px",borderRadius:20}}>{currentGroupMembers.join(", ")}</span>
            {String(currentGroup.status||"active")==="active"&&(
              <button onClick={()=>closeGroup(activeGroup)} style={{marginLeft:"auto",background:PALETTE.yellow+"22",color:PALETTE.yellow,border:`1px solid ${PALETTE.yellow}`,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✓ Termina gruppo</button>
            )}
            {String(currentGroup.status||"active")==="closed"&&<span style={{fontSize:12,background:PALETTE.muted+"22",color:PALETTE.muted,padding:"3px 10px",borderRadius:20}}>📁 Terminato</span>}
          </div>

          {/* Tab analytics/spese */}
          <div style={{display:"flex",gap:8}}>
            {["spese","analytics"].map(v=>(
              <button key={v} onClick={()=>setViewMode(v)} style={{padding:"6px 16px",borderRadius:8,border:`1px solid ${viewMode===v?PALETTE.accent:PALETTE.border}`,background:viewMode===v?PALETTE.accent+"22":"transparent",color:viewMode===v?PALETTE.accent:PALETTE.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>
                {v==="spese"?"💸 Spese":"📊 Analytics"}
              </button>
            ))}
          </div>

          {viewMode==="analytics"&&(()=>{
            const a=buildAnalytics(activeGroup);
            return(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div><div style={{fontSize:11,color:PALETTE.muted,marginBottom:4}}>Dal</div><input style={{...inp,width:160}} type="date" value={analyticsRange.from} onChange={e=>setAnalyticsRange(p=>({...p,from:e.target.value}))}/></div>
                  <div><div style={{fontSize:11,color:PALETTE.muted,marginBottom:4}}>Al</div><input style={{...inp,width:160}} type="date" value={analyticsRange.to} onChange={e=>setAnalyticsRange(p=>({...p,to:e.target.value}))}/></div>
                  <div style={{marginTop:16,fontSize:20,fontWeight:800,color:PALETTE.accentLight,fontFamily:"monospace"}}>{fmt(a.total)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div className="card">
                    <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Per Categoria</div>
                    {a.catData.length===0?<div style={{color:PALETTE.muted,fontSize:13}}>Nessuna spesa</div>:
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart><Pie data={a.catData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {a.catData.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]}/>)}
                      </Pie><Tooltip contentStyle={{background:PALETTE.card,border:`1px solid ${PALETTE.border}`,borderRadius:8}} formatter={v=>fmt(v)}/></PieChart>
                    </ResponsiveContainer>}
                    <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8}}>
                      {a.catData.map((e,i)=>(<div key={e.name} style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:2,background:CAT_COLORS[i%CAT_COLORS.length],display:"inline-block"}}/>{e.name}</span><span style={{color:PALETTE.muted}}>{fmt(e.value)}</span></div>))}
                    </div>
                  </div>
                  <div className="card">
                    <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Andamento Mensile</div>
                    {a.trend.length===0?<div style={{color:PALETTE.muted,fontSize:13}}>Nessun dato</div>:
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={a.trend}><XAxis dataKey="name" tick={{fill:PALETTE.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:PALETTE.muted,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:PALETTE.card,border:`1px solid ${PALETTE.border}`,borderRadius:8}} formatter={v=>fmt(v)}/><Bar dataKey="total" fill={PALETTE.accent} radius={[4,4,0,0]}/></BarChart>
                    </ResponsiveContainer>}
                  </div>
                </div>
              </div>
            );
          })()}

          {viewMode==="spese"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div className="card">
                  <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>💰 Riepilogo</div>
                  {Object.entries(calcBalances(activeGroup)).map(([m,v])=>(
                    <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${PALETTE.border}`}}>
                      <span style={{fontSize:13,fontWeight:m===currentUser.name?700:400}}>{m===currentUser.name?`👤 ${m}`:m}</span>
                      <span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:v>=0?PALETTE.green:PALETTE.red}}>{v>=0?"+":""}{fmt(v)}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>🔄 Rimborsi</div>
                  {calcDebts(activeGroup).length===0?(
                    <div style={{color:PALETTE.green,fontSize:13,display:"flex",alignItems:"center",gap:8}}><span>✓</span> Tutti in pari!</div>
                  ):calcDebts(activeGroup).map((d,i)=>(
                    <div key={i} style={{padding:"8px 0",borderBottom:`1px solid ${PALETTE.border}`,fontSize:13}}>
                      <span style={{color:PALETTE.red,fontWeight:600}}>{d.from}</span><span style={{color:PALETTE.muted}}> deve </span>
                      <span style={{fontFamily:"monospace",fontWeight:700,color:PALETTE.yellow}}>{fmt(d.amount)}</span>
                      <span style={{color:PALETTE.muted}}> a </span><span style={{color:PALETTE.green,fontWeight:600}}>{d.to}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontSize:14,fontWeight:600}}>Spese ({getGroupExpenses(activeGroup).length})</div>
                  {String(currentGroup.status||"active")==="active"&&<button className="btn" onClick={()=>openAddExpense()}>+ Aggiungi</button>}
                </div>
                {getGroupExpenses(activeGroup).length===0?<div style={{textAlign:"center",padding:32,color:PALETTE.muted}}>Nessuna spesa ancora</div>:
                getGroupExpenses(activeGroup).slice().reverse().map(exp=>{
                  const cat=categories.find(c=>String(c.id)===String(exp.catId));
                  return(
                    <div key={exp.id} className="row" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 8px",borderRadius:10}}>
                      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                        <div style={{width:36,height:36,borderRadius:10,background:PALETTE.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat?.icon||"💸"}</div>
                        <div>
                          <div style={{fontSize:14,fontWeight:600}}>{exp.desc}</div>
                          <div style={{fontSize:12,color:PALETTE.muted}}>
                            Pagato da <span style={{color:exp.paidBy===currentUser.name?PALETTE.accent:PALETTE.text,fontWeight:600}}>{exp.paidBy}</span>
                            {exp.subcat&&<span> · {exp.subcat}</span>}
                            {exp.addToBudget==="true"&&<span style={{color:PALETTE.green}}> · 📊 Budget</span>}
                            <span> · {exp.date}</span>
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                            {Object.entries(exp.splits).map(([m,v])=>(<span key={m} style={{fontSize:11,background:PALETTE.surface,border:`1px solid ${PALETTE.border}`,borderRadius:6,padding:"2px 8px"}}>{m}: {fmt(v)}</span>))}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                        <span style={{fontFamily:"monospace",fontSize:14,fontWeight:700}}>{fmt(exp.amount)}</span>
                        {String(currentGroup.status||"active")==="active"&&<>
                          <button className="btn-edit" onClick={()=>openAddExpense(exp)}>✎</button>
                          <button className="btn-red" onClick={()=>deleteExpense(exp.id)}>✕</button>
                        </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal nuovo gruppo */}
      {modal==="newgroup"&&(
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>Nuovo Gruppo</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={lbl}>Nome del gruppo</label><input style={inp} value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="es. Vacanza Barcellona"/></div>
            <div>
              <label style={lbl}>Partecipanti</label>
              {memberOptions.filter(m=>m!==currentUser.name).map(m=>(
                <label key={m} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"8px 12px",borderRadius:8,background:PALETTE.surface,border:`1px solid ${(form.members||[]).includes(m)?PALETTE.accent:PALETTE.border}`,marginBottom:6}}>
                  <input type="checkbox" checked={(form.members||[]).includes(m)} onChange={e=>setForm(p=>({...p,members:e.target.checked?[...(p.members||[]),m]:(p.members||[]).filter(x=>x!==m)}))} style={{accentColor:PALETTE.accent}}/>
                  <span style={{fontSize:14}}>{m}</span>
                </label>
              ))}
              <div style={{fontSize:11,color:PALETTE.muted,marginTop:4}}>Tu ({currentUser.name}) sei già incluso</div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button className="btn-ghost" style={{flex:1}} onClick={()=>setModal(null)}>Annulla</button>
              <button className="btn" style={{flex:1}} onClick={createGroup}>{saving?"Salvo...":"Crea Gruppo"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal spesa */}
      {modal==="expense"&&currentGroup&&(
        <Modal onClose={()=>{setModal(null);setEditExp(null);}} maxWidth={500}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{editExp?"Modifica":"Nuova"} Spesa</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={lbl}>Descrizione</label><input style={inp} value={form.desc||""} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} placeholder="es. Cena al ristorante"/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lbl}>Importo (€)</label><input style={inp} type="number" value={form.amount||""} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0.00"/></div>
              <div><label style={lbl}>Data</label><input style={inp} type="date" value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lbl}>Categoria</label>
                <select style={inp} value={form.catId||""} onChange={e=>setForm(p=>({...p,catId:e.target.value,subcat:""}))}>
                  <option value="">Nessuna</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Sottocategoria</label>
                <select style={inp} value={form.subcat||""} onChange={e=>setForm(p=>({...p,subcat:e.target.value}))}>
                  <option value="">Nessuna</option>
                  {catSubs(form.catId).map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label style={lbl}>Pagato da</label>
              <select style={inp} value={form.paidBy||currentUser.name} onChange={e=>setForm(p=>({...p,paidBy:e.target.value}))}>
                {currentGroupMembers.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {form.paidBy===currentUser.name&&(
              <div style={{background:PALETTE.surface,border:`1px solid ${PALETTE.accent}`,borderRadius:12,padding:14}}>
                <div style={{fontSize:12,color:PALETTE.accent,fontWeight:600,marginBottom:10}}>💳 Pagamento dal tuo conto</div>
                <select style={inp} value={form.accountId||""} onChange={e=>setForm(p=>({...p,accountId:e.target.value}))}>
                  <option value="">Seleziona conto...</option>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name} — {fmt(a.balance)}</option>)}
                </select>
              </div>
            )}
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:10,background:PALETTE.surface,border:`1px solid ${form.addToBudget?PALETTE.green:PALETTE.border}`}}>
              <input type="checkbox" checked={!!form.addToBudget} onChange={e=>setForm(p=>({...p,addToBudget:e.target.checked}))} style={{accentColor:PALETTE.green,width:16,height:16}}/>
              <span style={{fontSize:13,color:form.addToBudget?PALETTE.green:PALETTE.muted}}>📊 Conta nel Budget mensile</span>
            </label>
            <div>
              <label style={lbl}>Come dividere?</label>
              <div style={{display:"flex",gap:8}}>
                {["equal","custom"].map(t=>(
                  <button key={t} onClick={()=>setForm(p=>({...p,splitType:t}))} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${form.splitType===t?PALETTE.accent:PALETTE.border}`,background:form.splitType===t?PALETTE.accent+"22":"transparent",color:form.splitType===t?PALETTE.accent:PALETTE.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>
                    {t==="equal"?"⚖️ Equa":"✏️ Personalizzata"}
                  </button>
                ))}
              </div>
            </div>
            {form.splitType==="custom"&&(
              <div style={{background:PALETTE.surface,borderRadius:12,padding:14}}>
                {currentGroupMembers.map(m=>(
                  <div key={m} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:13,width:80,flexShrink:0}}>{m}</span>
                    <input style={{...inp,flex:1}} type="number" placeholder="0.00" value={form.splits?.[m]||""} onChange={e=>setForm(p=>({...p,splits:{...p.splits,[m]:e.target.value}}))}/>
                  </div>
                ))}
                <div style={{fontSize:12,color:PALETTE.muted,marginTop:8}}>
                  Totale: <span style={{color:Math.abs(Object.values(form.splits||{}).reduce((s,v)=>s+Number(v),0)-(Number(form.amount)||0))<0.01?PALETTE.green:PALETTE.red,fontWeight:700}}>{fmt(Object.values(form.splits||{}).reduce((s,v)=>s+Number(v),0))}</span> / {fmt(form.amount||0)}
                </div>
              </div>
            )}
            {form.splitType==="equal"&&form.amount&&(
              <div style={{background:PALETTE.surface,borderRadius:12,padding:12,display:"flex",flexWrap:"wrap",gap:6}}>
                {currentGroupMembers.map(m=>(<span key={m} style={{fontSize:12,background:PALETTE.card,border:`1px solid ${PALETTE.border}`,borderRadius:8,padding:"4px 10px"}}>{m}: {fmt((Number(form.amount)||0)/currentGroupMembers.length)}</span>))}
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button className="btn-ghost" style={{flex:1}} onClick={()=>{setModal(null);setEditExp(null);}}>Annulla</button>
              <button className="btn" style={{flex:1}} onClick={saveExpense}>{saving?"Salvo...":editExp?"Aggiorna":"Aggiungi"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [currentUser,setCurrentUser]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("fintrack_user")||sessionStorage.getItem("fintrack_user")||"null");}catch{return null;}
  });
  const [allUsers,setAllUsers]=useState([]);
  const [accounts,setAccounts]=useState([]);
  const [categories,setCategories]=useState([]);
  const [budgets,setBudgets]=useState([]);
  const [goals,setGoals]=useState([]);
  const [transactions,setTransactions]=useState([]);
  const [recurring,setRecurring]=useState([]);
  const [budgetHistory,setBudgetHistory]=useState([]);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [showExport,setShowExport]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState({});

  const p=currentUser?.prefix;
  const emptyTx={desc:"",amount:"",type:"expense",catId:"",subcat:"",accountId:"",date:today(),isTransfer:false,transferToAccountId:"",isRecurring:false,recurringDay:"",recurringFreq:"monthly",addToGoal:false,goalId:"",addToBudget:true};
  const emptyGoal={name:"",target:"",current:"0",icon:"🎯",deadline:"",color:CAT_COLORS[0]};
  const emptyBudget={catId:"",subcat:"",useFullCat:false,limit:"",period:"mensile",savingDay:"",savingFreq:""};
  const emptyAccount={name:"",bank:"",balance:"",color:"#7c6af7"};
  const emptyCat={name:"",icon:"💰",subs:""};

  function handleLogin(user){setCurrentUser(user);}
  function handleLogout(){
    localStorage.removeItem("fintrack_user");sessionStorage.removeItem("fintrack_user");
    setCurrentUser(null);setAccounts([]);setTransactions([]);setCategories([]);setBudgets([]);setGoals([]);setRecurring([]);
  }

  useEffect(()=>{if(currentUser)loadAll();},[currentUser]);

  // Processo transazioni ricorrenti
  useEffect(()=>{
    if(!recurring.length||!accounts.length)return;
    const todayStr=today();
    const todayDay=new Date().getDate();
    recurring.forEach(async r=>{
      if(String(r.active||"true")==="false")return;
      const day=parseInt(r.recurringDay||1);
      if(todayDay!==day)return;
      // Controlla se già eseguita oggi
      const alreadyDone=transactions.some(t=>t.recurringId===String(r.id)&&String(t.date)===todayStr);
      if(alreadyDone)return;
      const amount=r.type==="expense"?-Math.abs(Number(r.amount)):Math.abs(Number(r.amount));
      const txData={id:Date.now(),date:todayStr,desc:`[Ricorrente] ${r.desc}`,amount,type:r.type,catId:r.catId,subcat:r.subcat||"",accountId:r.accountId,recurringId:String(r.id),addToBudget:r.addToBudget||"true"};
      await apiPost({action:"write",sheet:`${p}_transactions`,data:txData});
      setTransactions(prev=>[txData,...prev]);
      const acc=accounts.find(a=>String(a.id)===String(r.accountId));
      if(acc){const nb=Number(acc.balance)+amount;await apiPost({action:"update",sheet:`${p}_accounts`,id:acc.id,data:{...acc,balance:nb}});setAccounts(prev=>prev.map(a=>String(a.id)===String(acc.id)?{...a,balance:nb}:a));}
    });
  },[recurring,accounts]);

  async function loadAll(){
    setLoading(true);
    try{
      const[acc,tx,cat,bud,gol,users,rec,bh]=await Promise.all([
        apiRead(`${p}_accounts`),apiRead(`${p}_transactions`),apiRead(`${p}_categories`),
        apiRead(`${p}_budgets`),apiRead(`${p}_goals`),apiRead("users"),
        apiRead(`${p}_recurring`),apiRead(`${p}_budget_history`)
      ]);
      setAccounts(Array.isArray(acc)?acc:[]);
      setTransactions(Array.isArray(tx)?tx:[]);
      setCategories(Array.isArray(cat)?cat:[]);
      setBudgets(Array.isArray(bud)?bud:[]);
      setGoals(Array.isArray(gol)?gol:[]);
      setAllUsers(Array.isArray(users)?users:[]);
      setRecurring(Array.isArray(rec)?rec:[]);
      setBudgetHistory(Array.isArray(bh)?bh:[]);
    }catch(e){console.error(e);}
    setLoading(false);
  }

  const now=new Date();
  const currentMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthlyTx=useMemo(()=>transactions.filter(t=>String(t.date).startsWith(currentMonth)&&!t.isTransfer&&String(t.addToBudget||"true")!=="false"),[transactions,currentMonth]);
  const monthlyExpenses=monthlyTx.filter(t=>t.type==="expense").reduce((s,t)=>s+Math.abs(Number(t.amount)),0);
  const monthlyIncome=monthlyTx.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const totalBalance=accounts.reduce((s,a)=>s+Number(a.balance),0);

  const expByCategory=useMemo(()=>{
    const map={};
    monthlyTx.filter(t=>t.type==="expense").forEach(t=>{const cat=categories.find(c=>String(c.id)===String(t.catId));map[cat?.name||"Altro"]=(map[cat?.name||"Altro"]||0)+Math.abs(Number(t.amount));});
    return Object.entries(map).map(([name,value])=>({name,value}));
  },[monthlyTx,categories]);

  const last6Months=useMemo(()=>{
    return Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const txs=transactions.filter(t=>String(t.date).startsWith(key)&&!t.isTransfer&&String(t.addToBudget||"true")!=="false");
      return{name:months[d.getMonth()],entrate:txs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0),uscite:txs.filter(t=>t.type==="expense").reduce((s,t)=>s+Math.abs(Number(t.amount)),0)};
    });
  },[transactions]);

  function getBudgetSpent(b){
    const txs=monthlyTx.filter(t=>String(t.addToBudget||"true")!=="false");
    if(b.useFullCat==="true"||b.useFullCat===true){
      return txs.filter(t=>String(t.catId)===String(b.catId)).reduce((s,t)=>{
        const amt=Math.abs(Number(t.amount));
        return t.type==="expense"?s+amt:s-amt;
      },0);
    }
    return txs.filter(t=>String(t.catId)===String(b.catId)&&t.subcat===b.subcat).reduce((s,t)=>{
      const amt=Math.abs(Number(t.amount));
      return t.type==="expense"?s+amt:s-amt;
    },0);
  }

  function openModal(type,item=null){
    setModal(type);
    if(item){setEditItem(item);setForm({...item,useFullCat:item.useFullCat==="true"||item.useFullCat===true});}
    else{setEditItem(null);if(type==="tx")setForm({...emptyTx});if(type==="goal")setForm({...emptyGoal});if(type==="budget")setForm({...emptyBudget});if(type==="account")setForm({...emptyAccount});if(type==="category")setForm({...emptyCat});}
  }

  async function saveTx(){
    setSaving(true);
    const id=editItem?editItem.id:Date.now();

    if(form.isTransfer){
      // Trasferimento tra conti
      const fromAcc=accounts.find(a=>String(a.id)===String(form.accountId));
      const toAcc=accounts.find(a=>String(a.id)===String(form.transferToAccountId));
      const amt=Math.abs(Number(form.amount));
      if(fromAcc){
        const nb=Number(fromAcc.balance)-amt;
        const txOut={id:Date.now(),date:form.date,desc:`[Trasf→${toAcc?.name}] ${form.desc||"Trasferimento"}`,amount:-amt,type:"expense",catId:"",subcat:"",accountId:form.accountId,isTransfer:"true",addToBudget:"false"};
        if(editItem){await apiPost({action:"update",sheet:`${p}_transactions`,id:editItem.id,data:txOut});}
        else{await apiPost({action:"write",sheet:`${p}_transactions`,data:txOut});setTransactions(prev=>[txOut,...prev]);}
        await apiPost({action:"update",sheet:`${p}_accounts`,id:fromAcc.id,data:{...fromAcc,balance:nb}});
        setAccounts(prev=>prev.map(a=>String(a.id)===String(fromAcc.id)?{...a,balance:nb}:a));
      }
      if(toAcc){
        const nb=Number(toAcc.balance)+amt;
        const txIn={id:Date.now()+1,date:form.date,desc:`[Trasf←${fromAcc?.name}] ${form.desc||"Trasferimento"}`,amount:amt,type:"income",catId:"",subcat:"",accountId:form.transferToAccountId,isTransfer:"true",addToBudget:"false"};
        if(!editItem){await apiPost({action:"write",sheet:`${p}_transactions`,data:txIn});setTransactions(prev=>[txIn,...prev]);}
        await apiPost({action:"update",sheet:`${p}_accounts`,id:toAcc.id,data:{...toAcc,balance:nb}});
        setAccounts(prev=>prev.map(a=>String(a.id)===String(toAcc.id)?{...a,balance:nb}:a));
      }
      setSaving(false);setModal(null);return;
    }

    const amount=form.type==="expense"?-Math.abs(Number(form.amount)):Math.abs(Number(form.amount));
    const data={...form,id,amount,isTransfer:"false",addToBudget:form.addToBudget?"true":"false"};

    if(editItem){
      // Ripristina saldo precedente
      const prevTx=transactions.find(t=>String(t.id)===String(editItem.id));
      if(prevTx){
        const acc=accounts.find(a=>String(a.id)===String(prevTx.accountId));
        if(acc){const restored=Number(acc.balance)-Number(prevTx.amount);await apiPost({action:"update",sheet:`${p}_accounts`,id:acc.id,data:{...acc,balance:restored}});setAccounts(prev=>prev.map(a=>String(a.id)===String(acc.id)?{...a,balance:restored}:a));}
      }
      await apiPost({action:"update",sheet:`${p}_transactions`,id,data});
      setTransactions(prev=>prev.map(t=>String(t.id)===String(id)?data:t));
    }else{
      await apiPost({action:"write",sheet:`${p}_transactions`,data});
      setTransactions(prev=>[data,...prev]);
      // Se ricorrente, salva anche in recurring
      if(form.isRecurring){
        const recData={id:Date.now()+2,desc:form.desc,amount:Math.abs(Number(form.amount)),type:form.type,catId:form.catId,subcat:form.subcat,accountId:form.accountId,recurringDay:form.recurringDay,recurringFreq:form.recurringFreq||"monthly",active:"true",addToBudget:form.addToBudget?"true":"false"};
        await apiPost({action:"write",sheet:`${p}_recurring`,data:recData});
        setRecurring(prev=>[...prev,recData]);
      }
    }
    // Aggiorna saldo conto
    const acc=accounts.find(a=>String(a.id)===String(form.accountId));
    if(acc){const nb=Number(acc.balance)+amount;await apiPost({action:"update",sheet:`${p}_accounts`,id:acc.id,data:{...acc,balance:nb}});setAccounts(prev=>prev.map(a=>String(a.id)===String(acc.id)?{...a,balance:nb}:a));}
    // Aggiorna obiettivo se richiesto
    if(form.addToGoal&&form.goalId){
      const goal=goals.find(g=>String(g.id)===String(form.goalId));
      if(goal){
        const newCurrent=Number(goal.current)+(form.type==="income"?Math.abs(Number(form.amount)):-Math.abs(Number(form.amount)));
        const updGoal={...goal,current:Math.max(0,newCurrent)};
        await apiPost({action:"update",sheet:`${p}_goals`,id:goal.id,data:updGoal});
        setGoals(prev=>prev.map(g=>String(g.id)===String(goal.id)?updGoal:g));
      }
    }
    setSaving(false);setModal(null);
  }

  async function deleteTx(tx){
    if(!confirm("Eliminare questa transazione? Il saldo del conto verrà ripristinato."))return;
    // Ripristina saldo
    if(!tx.isTransfer||tx.isTransfer==="false"){
      const acc=accounts.find(a=>String(a.id)===String(tx.accountId));
      if(acc){const nb=Number(acc.balance)-Number(tx.amount);await apiPost({action:"update",sheet:`${p}_accounts`,id:acc.id,data:{...acc,balance:nb}});setAccounts(prev=>prev.map(a=>String(a.id)===String(acc.id)?{...a,balance:nb}:a));}
    }
    await apiPost({action:"delete",sheet:`${p}_transactions`,id:tx.id});
    setTransactions(prev=>prev.filter(t=>String(t.id)!==String(tx.id)));
  }

  async function saveAccount(){
    setSaving(true);const id=editItem?editItem.id:Date.now();const data={...form,id,balance:Number(form.balance)};
    if(editItem){await apiPost({action:"update",sheet:`${p}_accounts`,id,data});setAccounts(prev=>prev.map(a=>String(a.id)===String(id)?data:a));}
    else{await apiPost({action:"write",sheet:`${p}_accounts`,data});setAccounts(prev=>[...prev,data]);}
    setSaving(false);setModal(null);
  }

  async function saveGoal(){
    setSaving(true);const id=editItem?editItem.id:Date.now();const data={...form,id,target:Number(form.target),current:Number(form.current)};
    if(editItem){await apiPost({action:"update",sheet:`${p}_goals`,id,data});setGoals(prev=>prev.map(g=>String(g.id)===String(id)?data:g));}
    else{await apiPost({action:"write",sheet:`${p}_goals`,data});setGoals(prev=>[...prev,data]);}
    setSaving(false);setModal(null);
  }

  async function saveBudget(){
    setSaving(true);const id=editItem?editItem.id:Date.now();
    const data={...form,id,limit:Number(form.limit),useFullCat:form.useFullCat?"true":"false"};
    if(editItem){await apiPost({action:"update",sheet:`${p}_budgets`,id,data});setBudgets(prev=>prev.map(b=>String(b.id)===String(id)?data:b));}
    else{await apiPost({action:"write",sheet:`${p}_budgets`,data});setBudgets(prev=>[...prev,data]);}
    setSaving(false);setModal(null);
  }

  async function saveCat(){
    setSaving(true);const id=editItem?editItem.id:Date.now();const data={...form,id};
    if(editItem){await apiPost({action:"update",sheet:`${p}_categories`,id,data});setCategories(prev=>prev.map(c=>String(c.id)===String(id)?data:c));}
    else{await apiPost({action:"write",sheet:`${p}_categories`,data});setCategories(prev=>[...prev,data]);}
    setSaving(false);setModal(null);
  }

  async function deleteItem(sheet,id,setter){
    if(!confirm("Eliminare questo elemento?"))return;
    await apiPost({action:"delete",sheet:`${p}_${sheet}`,id});
    setter(prev=>prev.filter(i=>String(i.id)!==String(id)));
  }

  // Salvataggio periodico budget
  async function saveBudgetSnapshot(b){
    const spent=getBudgetSpent(b);
    const snapshot={id:Date.now(),budgetId:b.id,date:today(),month:currentMonth,spent,limit:b.limit};
    await apiPost({action:"write",sheet:`${p}_budget_history`,data:snapshot});
    setBudgetHistory(prev=>[...prev,snapshot]);
    alert("Snapshot budget salvato!");
  }

  const catSubs=(catId)=>{const cat=categories.find(c=>String(c.id)===String(catId));if(!cat||!cat.subs)return[];return String(cat.subs).split(",").map(s=>s.trim()).filter(Boolean);};

  const inp={background:PALETTE.surface,border:`1px solid ${PALETTE.border}`,color:PALETTE.text,borderRadius:8,padding:"8px 12px",width:"100%",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  const lbl={fontSize:12,color:PALETTE.muted,marginBottom:4,display:"block"};

  const navItems=[
    {id:"dashboard",label:"Dashboard",icon:"◈"},
    {id:"transactions",label:"Transazioni",icon:"↕"},
    {id:"budgets",label:"Budget",icon:"⊡"},
    {id:"goals",label:"Obiettivi",icon:"◎"},
    {id:"accounts",label:"Conti",icon:"⬡"},
    {id:"categories",label:"Categorie",icon:"⊞"},
    {id:"tricount",label:"Spese Condivise",icon:"👥"},
  ];

  if(!currentUser)return <LoginScreen onLogin={handleLogin}/>;

  return(
    <div style={{background:PALETTE.bg,minHeight:"100vh",color:PALETTE.text,fontFamily:"'DM Sans','Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${PALETTE.bg}}::-webkit-scrollbar-thumb{background:${PALETTE.border};border-radius:2px}
        select option{background:${PALETTE.card}}
        .card{background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:16px;padding:20px}
        .btn{background:${PALETTE.accent};color:white;border:none;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:opacity 0.2s}
        .btn:hover{opacity:0.85}
        .btn-ghost{background:transparent;color:${PALETTE.muted};border:1px solid ${PALETTE.border};border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;font-family:inherit;transition:all 0.2s}
        .btn-ghost:hover{border-color:${PALETTE.accent};color:${PALETTE.accent}}
        .btn-red{background:${PALETTE.red};color:white;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px;font-family:inherit}
        .btn-edit{background:${PALETTE.surface};color:${PALETTE.muted};border:1px solid ${PALETTE.border};border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px;font-family:inherit}
        .row:hover{background:${PALETTE.surface};border-radius:10px}
      `}</style>

      {/* Header */}
      <div style={{padding:"14px 24px",borderBottom:`1px solid ${PALETTE.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:PALETTE.surface}}>
        <div><span style={{fontSize:20,fontWeight:700,letterSpacing:-0.5}}>fintrack</span><span style={{color:PALETTE.accent,fontSize:20,fontWeight:700}}>.</span></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:13,color:PALETTE.muted}}>👤 {currentUser.name}</span>
          {saving&&<span style={{fontSize:12,color:PALETTE.muted}}>Salvataggio...</span>}
          <button className="btn-ghost" onClick={()=>setShowExport(true)} style={{padding:"6px 12px",fontSize:12}}>📤</button>
          <button className="btn-ghost" onClick={loadAll} style={{padding:"6px 12px",fontSize:12}}>↻</button>
          <button className="btn" onClick={()=>openModal("tx")}>+ Transazione</button>
          <button className="btn-ghost" onClick={handleLogout} style={{padding:"6px 12px",fontSize:12,color:PALETTE.red,borderColor:PALETTE.red}}>Esci</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:4,padding:"8px 24px",background:PALETTE.surface,borderBottom:`1px solid ${PALETTE.border}`,overflowX:"auto"}}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{background:tab===n.id?PALETTE.accent:"transparent",color:tab===n.id?"white":PALETTE.muted,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap",transition:"all 0.2s"}}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:24}}>
        {loading?<Spinner/>:<>

        {tab==="tricount"&&<TricountTab accounts={accounts} categories={categories} transactions={transactions} setTransactions={setTransactions} setAccounts={setAccounts} budgets={budgets} setBudgets={setBudgets} currentUser={currentUser} allUsers={allUsers}/>}

        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
              {[{label:"Patrimonio Totale",value:totalBalance,color:PALETTE.accentLight},{label:`Entrate ${months[now.getMonth()]}`,value:monthlyIncome,color:PALETTE.green},{label:`Uscite ${months[now.getMonth()]}`,value:monthlyExpenses,color:PALETTE.red},{label:"Saldo Mese",value:monthlyIncome-monthlyExpenses,color:monthlyIncome-monthlyExpenses>=0?PALETTE.green:PALETTE.red}].map(k=>(
                <div key={k.label} className="card"><div style={{fontSize:12,color:PALETTE.muted,marginBottom:8}}>{k.label}</div><div style={{fontSize:24,fontWeight:700,color:k.color,fontFamily:"monospace"}}>{fmt(k.value)}</div></div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div className="card">
                <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Entrate vs Uscite (6 mesi)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={last6Months}><XAxis dataKey="name" tick={{fill:PALETTE.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:PALETTE.muted,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:PALETTE.card,border:`1px solid ${PALETTE.border}`,borderRadius:8}}/><Bar dataKey="entrate" fill={PALETTE.green} radius={[4,4,0,0]}/><Bar dataKey="uscite" fill={PALETTE.red} radius={[4,4,0,0]}/></BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Spese per Categoria</div>
                {expByCategory.length===0?<div style={{color:PALETTE.muted,fontSize:13,marginTop:20}}>Nessuna spesa questo mese</div>:
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <ResponsiveContainer width={160} height={160}><PieChart><Pie data={expByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{expByCategory.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]}/>)}</Pie></PieChart></ResponsiveContainer>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>{expByCategory.map((e,i)=>(<div key={e.name} style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:2,background:CAT_COLORS[i%CAT_COLORS.length],display:"inline-block"}}/>{e.name}</span><span style={{color:PALETTE.muted}}>{fmt(e.value)}</span></div>))}</div>
                </div>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div className="card">
                <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>⚠️ Soglie Budget</div>
                {budgets.length===0?<div style={{color:PALETTE.muted,fontSize:13}}>Nessun budget</div>:
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {budgets.map(b=>{const cat=categories.find(c=>String(c.id)===String(b.catId));const label=b.useFullCat==="true"?cat?.name:b.subcat;return<div key={b.id}><div style={{fontSize:13,fontWeight:500,marginBottom:6}}>{cat?.icon} {label}</div><ProgressBar value={Math.max(0,getBudgetSpent(b))} max={Number(b.limit)} danger/></div>;})}
                </div>}
              </div>
              <div className="card">
                <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Ultime Transazioni</div>
                {transactions.slice(0,6).map(t=>{const cat=categories.find(c=>String(c.id)===String(t.catId));return<div key={t.id} className="row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 6px"}}><div><div style={{fontSize:13,fontWeight:500}}>{t.isTransfer==="true"?"↔️ ":""}{t.desc}</div><div style={{fontSize:11,color:PALETTE.muted}}>{cat?.icon} {cat?.name||""} · {t.date}</div></div><span style={{fontFamily:"monospace",fontSize:14,fontWeight:600,color:t.type==="income"?PALETTE.green:PALETTE.red}}>{t.type==="income"?"+":""}{fmt(t.amount)}</span></div>;})}
              </div>
            </div>
          </div>
        )}

        {tab==="transactions"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:16,fontWeight:600}}>Transazioni ({transactions.length})</div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn" onClick={()=>openModal("tx")}>+ Aggiungi</button>
              </div>
            </div>
            {/* Ricorrenti attive */}
            {recurring.length>0&&(
              <div className="card">
                <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>🔄 Transazioni Ricorrenti ({recurring.filter(r=>String(r.active||"true")==="true").length} attive)</div>
                {recurring.filter(r=>String(r.active||"true")==="true").map(r=>{
                  const cat=categories.find(c=>String(c.id)===String(r.catId));
                  return<div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${PALETTE.border}`}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>🔄 {r.desc}</div>
                      <div style={{fontSize:11,color:PALETTE.muted}}>{cat?.name||""} · Ogni mese il giorno {r.recurringDay}</div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:r.type==="income"?PALETTE.green:PALETTE.red}}>{r.type==="income"?"+":"-"}{fmt(r.amount)}</span>
                      <button className="btn-red" style={{fontSize:11}} onClick={async()=>{if(!confirm("Disattivare?"))return;await apiPost({action:"update",sheet:`${p}_recurring`,id:r.id,data:{...r,active:"false"}});setRecurring(prev=>prev.map(x=>String(x.id)===String(r.id)?{...x,active:"false"}:x));}}>⏸</button>
                    </div>
                  </div>;
                })}
              </div>
            )}
            <div className="card">
              {transactions.map(t=>{
                const cat=categories.find(c=>String(c.id)===String(t.catId));
                const acc=accounts.find(a=>String(a.id)===String(t.accountId));
                const isTransfer=t.isTransfer==="true";
                return<div key={t.id} className="row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:PALETTE.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{isTransfer?"↔️":cat?.icon||"💸"}</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:500}}>{t.desc}</div>
                      <div style={{fontSize:12,color:PALETTE.muted}}>
                        {isTransfer?"Trasferimento":cat?.name||""} · {t.subcat||""} · {acc?.name||""} · {t.date}
                        {t.recurringId&&<span style={{color:PALETTE.blue}}> · 🔄</span>}
                        {t.addToBudget==="false"&&<span style={{color:PALETTE.muted}}> · escluso budget</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:t.type==="income"?PALETTE.green:PALETTE.red}}>{t.type==="income"?"+":""}{fmt(t.amount)}</span>
                    {!isTransfer&&<button className="btn-edit" onClick={()=>openModal("tx",t)}>✎</button>}
                    <button className="btn-red" onClick={()=>deleteTx(t)}>✕</button>
                  </div>
                </div>;
              })}
            </div>
          </div>
        )}

        {tab==="budgets"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{fontSize:18,fontWeight:700}}>Budget</h2><button className="btn" onClick={()=>openModal("budget")}>+ Aggiungi</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
              {budgets.map(b=>{
                const cat=categories.find(c=>String(c.id)===String(b.catId));
                const spent=Math.max(0,getBudgetSpent(b));
                const pct=Math.min((spent/Number(b.limit))*100,100);
                const status=pct>=90?{label:"⚠️ Critico",color:PALETTE.red}:pct>=70?{label:"⚡ Attenzione",color:PALETTE.yellow}:{label:"✓ Ok",color:PALETTE.green};
                const label=b.useFullCat==="true"?cat?.name:b.subcat;
                const history=budgetHistory.filter(h=>String(h.budgetId)===String(b.id)).slice(-6);
                return<div key={b.id} className="card">
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:600}}>{cat?.icon} {label}</div>
                      <div style={{fontSize:12,color:PALETTE.muted}}>{cat?.name}{b.useFullCat!=="true"&&b.subcat?` · ${b.subcat}`:""} · {b.period}</div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                      <span style={{fontSize:12,color:status.color,fontWeight:600}}>{status.label}</span>
                      <button className="btn-edit" onClick={()=>openModal("budget",b)}>✎</button>
                      <button className="btn-red" onClick={()=>deleteItem("budgets",b.id,setBudgets)}>✕</button>
                    </div>
                  </div>
                  <ProgressBar value={spent} max={Number(b.limit)} danger/>
                  <div style={{marginTop:10,display:"flex",justifyContent:"space-between",fontSize:12}}>
                    <span style={{color:PALETTE.muted}}>Speso: <span style={{color:PALETTE.text,fontWeight:600}}>{fmt(spent)}</span></span>
                    <span style={{color:PALETTE.muted}}>Rimasti: <span style={{color:PALETTE.green,fontWeight:600}}>{fmt(Math.max(0,Number(b.limit)-spent))}</span></span>
                  </div>
                  {history.length>0&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:11,color:PALETTE.muted,marginBottom:6}}>Storico</div>
                      <ResponsiveContainer width="100%" height={60}>
                        <LineChart data={history.map(h=>({name:h.month,speso:Number(h.spent),limite:Number(h.limit)}))}>
                          <Line type="monotone" dataKey="speso" stroke={PALETTE.accent} strokeWidth={2} dot={false}/>
                          <Line type="monotone" dataKey="limite" stroke={PALETTE.border} strokeWidth={1} dot={false} strokeDasharray="4 4"/>
                          <Tooltip contentStyle={{background:PALETTE.card,border:`1px solid ${PALETTE.border}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <button onClick={()=>saveBudgetSnapshot(b)} style={{marginTop:10,background:"transparent",color:PALETTE.muted,border:`1px solid ${PALETTE.border}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>💾 Salva snapshot</button>
                </div>;
              })}
            </div>
          </div>
        )}

        {tab==="goals"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{fontSize:18,fontWeight:700}}>Obiettivi</h2><button className="btn" onClick={()=>openModal("goal")}>+ Nuovo</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
              {goals.map(g=>{const pct=Math.min((Number(g.current)/Number(g.target))*100,100);return<div key={g.id} className="card" style={{borderLeft:`3px solid ${g.color||PALETTE.accent}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}><div><div style={{fontSize:28,marginBottom:4}}>{g.icon}</div><div style={{fontSize:16,fontWeight:700}}>{g.name}</div>{g.deadline&&<div style={{fontSize:12,color:PALETTE.muted}}>Scadenza: {g.deadline}</div>}</div><div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:800,color:g.color||PALETTE.accent,fontFamily:"monospace"}}>{pct.toFixed(0)}%</div><div style={{display:"flex",gap:4,marginTop:4}}><button className="btn-edit" onClick={()=>openModal("goal",g)}>✎</button><button className="btn-red" onClick={()=>deleteItem("goals",g.id,setGoals)}>✕</button></div></div></div><ProgressBar value={Number(g.current)} max={Number(g.target)} color={g.color||PALETTE.accent} showPct={false}/><div style={{marginTop:12,display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:PALETTE.muted}}>Accumulato</span><span style={{fontWeight:700}}>{fmt(g.current)}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:PALETTE.muted}}>Mancano</span><span style={{fontWeight:700,color:g.color||PALETTE.accent}}>{fmt(Number(g.target)-Number(g.current))}</span></div></div>;})}
            </div>
          </div>
        )}

        {tab==="accounts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{fontSize:18,fontWeight:700}}>Conti</h2><button className="btn" onClick={()=>openModal("account")}>+ Aggiungi</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
              {accounts.map(a=>(<div key={a.id} className="card" style={{borderTop:`3px solid ${a.color||PALETTE.accent}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:12,color:PALETTE.muted,marginBottom:4}}>{a.bank}</div><div style={{fontSize:16,fontWeight:700,marginBottom:12}}>{a.name}</div><div style={{fontSize:28,fontWeight:800,color:Number(a.balance)>=0?PALETTE.text:PALETTE.red,fontFamily:"monospace"}}>{fmt(a.balance)}</div></div><div style={{display:"flex",gap:4}}><button className="btn-edit" onClick={()=>openModal("account",a)}>✎</button><button className="btn-red" onClick={()=>deleteItem("accounts",a.id,setAccounts)}>✕</button></div></div></div>))}
            </div>
            <div className="card"><div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Patrimonio totale</div><div style={{fontSize:36,fontWeight:800,color:PALETTE.accentLight,fontFamily:"monospace"}}>{fmt(totalBalance)}</div></div>
          </div>
        )}

        {tab==="categories"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{fontSize:18,fontWeight:700}}>Categorie</h2><button className="btn" onClick={()=>openModal("category")}>+ Aggiungi</button></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
              {categories.map(c=>(<div key={c.id} className="card"><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:24,marginBottom:6}}>{c.icon}</div><div style={{fontSize:15,fontWeight:700}}>{c.name}</div><div style={{fontSize:12,color:PALETTE.muted,marginTop:6}}>{String(c.subs||"").split(",").filter(Boolean).map(s=>(<span key={s} style={{background:PALETTE.surface,border:`1px solid ${PALETTE.border}`,borderRadius:6,padding:"2px 8px",marginRight:4,marginBottom:4,display:"inline-block"}}>{s.trim()}</span>))}</div></div><div style={{display:"flex",gap:4}}><button className="btn-edit" onClick={()=>openModal("category",c)}>✎</button><button className="btn-red" onClick={()=>deleteItem("categories",c.id,setCategories)}>✕</button></div></div></div>))}
            </div>
          </div>
        )}
        </>}
      </div>

      {showExport&&<ExportModal transactions={transactions} accounts={accounts} categories={categories} onClose={()=>setShowExport(false)}/>}

      {/* MODALS */}
      {modal&&(
        <Modal onClose={()=>setModal(null)}>
          {modal==="tx"&&(
            <>
              <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{editItem?"Modifica":"Nuova"} Transazione</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Toggle trasferimento */}
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:10,background:PALETTE.surface,border:`1px solid ${form.isTransfer?PALETTE.blue:PALETTE.border}`}}>
                  <input type="checkbox" checked={!!form.isTransfer} onChange={e=>setForm(p=>({...p,isTransfer:e.target.checked}))} style={{accentColor:PALETTE.blue,width:16,height:16}}/>
                  <span style={{fontSize:13,color:form.isTransfer?PALETTE.blue:PALETTE.muted}}>↔️ Trasferimento tra conti</span>
                </label>

                <div><label style={lbl}>Descrizione</label><input style={inp} value={form.desc||""} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} placeholder={form.isTransfer?"es. Ricarica carte":"es. Spesa Esselunga"}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><label style={lbl}>Importo (€)</label><input style={inp} type="number" value={form.amount||""} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0.00"/></div>
                  <div><label style={lbl}>Data</label><input style={inp} type="date" value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
                </div>

                {!form.isTransfer&&(
                  <div><label style={lbl}>Tipo</label>
                    <div style={{display:"flex",gap:8}}>
                      {["expense","income"].map(t=>(
                        <button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{flex:1,padding:8,borderRadius:8,border:`1px solid ${form.type===t?(t==="expense"?PALETTE.red:PALETTE.green):PALETTE.border}`,background:form.type===t?(t==="expense"?PALETTE.red+"22":PALETTE.green+"22"):"transparent",color:form.type===t?(t==="expense"?PALETTE.red:PALETTE.green):PALETTE.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>
                          {t==="expense"?"↓ Uscita":"↑ Entrata"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div><label style={lbl}>{form.isTransfer?"Conto di origine":"Conto"}</label>
                  <select style={inp} value={form.accountId||""} onChange={e=>setForm(p=>({...p,accountId:e.target.value}))}>
                    <option value="">Seleziona...</option>
                    {accounts.map(a=><option key={a.id} value={a.id}>{a.name} ({fmt(a.balance)})</option>)}
                  </select>
                </div>

                {form.isTransfer&&(
                  <div><label style={lbl}>Conto di destinazione</label>
                    <select style={inp} value={form.transferToAccountId||""} onChange={e=>setForm(p=>({...p,transferToAccountId:e.target.value}))}>
                      <option value="">Seleziona...</option>
                      {accounts.filter(a=>String(a.id)!==String(form.accountId)).map(a=><option key={a.id} value={a.id}>{a.name} ({fmt(a.balance)})</option>)}
                    </select>
                  </div>
                )}

                {!form.isTransfer&&(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div><label style={lbl}>Categoria</label>
                        <select style={inp} value={form.catId||""} onChange={e=>setForm(p=>({...p,catId:e.target.value,subcat:""}))}>
                          <option value="">Seleziona...</option>
                          {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Sottocategoria</label>
                        <select style={inp} value={form.subcat||""} onChange={e=>setForm(p=>({...p,subcat:e.target.value}))}>
                          <option value="">Nessuna</option>
                          {catSubs(form.catId).map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Conta nel budget */}
                    <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:10,background:PALETTE.surface,border:`1px solid ${form.addToBudget!==false&&form.addToBudget!=="false"?PALETTE.accent:PALETTE.border}`}}>
                      <input type="checkbox" checked={form.addToBudget!==false&&form.addToBudget!=="false"} onChange={e=>setForm(p=>({...p,addToBudget:e.target.checked}))} style={{accentColor:PALETTE.accent,width:16,height:16}}/>
                      <span style={{fontSize:13,color:PALETTE.muted}}>📊 Conta nel Budget mensile</span>
                    </label>

                    {/* Conta nell'obiettivo */}
                    <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:10,background:PALETTE.surface,border:`1px solid ${form.addToGoal?PALETTE.yellow:PALETTE.border}`}}>
                      <input type="checkbox" checked={!!form.addToGoal} onChange={e=>setForm(p=>({...p,addToGoal:e.target.checked,goalId:""}))} style={{accentColor:PALETTE.yellow,width:16,height:16}}/>
                      <span style={{fontSize:13,color:form.addToGoal?PALETTE.yellow:PALETTE.muted}}>🎯 Aggiungi a un Obiettivo</span>
                    </label>
                    {form.addToGoal&&(
                      <select style={inp} value={form.goalId||""} onChange={e=>setForm(p=>({...p,goalId:e.target.value}))}>
                        <option value="">Seleziona obiettivo...</option>
                        {goals.map(g=><option key={g.id} value={g.id}>{g.icon} {g.name} ({fmt(g.current)}/{fmt(g.target)})</option>)}
                      </select>
                    )}

                    {/* Ricorrente */}
                    {!editItem&&(
                      <>
                        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:10,background:PALETTE.surface,border:`1px solid ${form.isRecurring?PALETTE.blue:PALETTE.border}`}}>
                          <input type="checkbox" checked={!!form.isRecurring} onChange={e=>setForm(p=>({...p,isRecurring:e.target.checked}))} style={{accentColor:PALETTE.blue,width:16,height:16}}/>
                          <span style={{fontSize:13,color:form.isRecurring?PALETTE.blue:PALETTE.muted}}>🔄 Transazione ricorrente</span>
                        </label>
                        {form.isRecurring&&(
                          <div style={{background:PALETTE.surface,borderRadius:10,padding:12}}>
                            <div style={{fontSize:12,color:PALETTE.muted,marginBottom:8}}>Si ripete ogni mese il giorno:</div>
                            <input style={{...inp,width:100}} type="number" min="1" max="31" value={form.recurringDay||""} onChange={e=>setForm(p=>({...p,recurringDay:e.target.value}))} placeholder="es. 1"/>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <div style={{display:"flex",gap:10,marginTop:8}}>
                  <button className="btn-ghost" style={{flex:1}} onClick={()=>setModal(null)}>Annulla</button>
                  <button className="btn" style={{flex:1}} onClick={saveTx}>{saving?"Salvo...":"Salva"}</button>
                </div>
              </div>
            </>
          )}

          {modal==="account"&&(
            <>
              <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{editItem?"Modifica":"Nuovo"} Conto</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div><label style={lbl}>Nome</label><input style={inp} value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="es. Conto Corrente"/></div>
                <div><label style={lbl}>Banca</label><input style={inp} value={form.bank||""} onChange={e=>setForm(p=>({...p,bank:e.target.value}))} placeholder="es. Fideuram"/></div>
                <div><label style={lbl}>Saldo (€)</label><input style={inp} type="number" value={form.balance||""} onChange={e=>setForm(p=>({...p,balance:e.target.value}))} placeholder="0.00"/></div>
                <div><label style={lbl}>Colore</label><input style={{...inp,height:44,padding:4}} type="color" value={form.color||"#7c6af7"} onChange={e=>setForm(p=>({...p,color:e.target.value}))}/></div>
                <div style={{display:"flex",gap:10,marginTop:8}}><button className="btn-ghost" style={{flex:1}} onClick={()=>setModal(null)}>Annulla</button><button className="btn" style={{flex:1}} onClick={saveAccount}>{saving?"Salvo...":"Salva"}</button></div>
              </div>
            </>
          )}

          {modal==="goal"&&(
            <>
              <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{editItem?"Modifica":"Nuovo"} Obiettivo</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"60px 1fr",gap:12}}>
                  <div><label style={lbl}>Icona</label><input style={inp} value={form.icon||""} onChange={e=>setForm(p=>({...p,icon:e.target.value}))}/></div>
                  <div><label style={lbl}>Nome</label><input style={inp} value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="es. Vacanza Giappone"/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><label style={lbl}>Obiettivo (€)</label><input style={inp} type="number" value={form.target||""} onChange={e=>setForm(p=>({...p,target:e.target.value}))} placeholder="5000"/></div>
                  <div><label style={lbl}>Accumulato (€)</label><input style={inp} type="number" value={form.current||""} onChange={e=>setForm(p=>({...p,current:e.target.value}))} placeholder="0"/></div>
                </div>
                <div><label style={lbl}>Colore</label><input style={{...inp,height:44,padding:4}} type="color" value={form.color||"#7c6af7"} onChange={e=>setForm(p=>({...p,color:e.target.value}))}/></div>
                <div><label style={lbl}>Scadenza</label><input style={inp} type="month" value={form.deadline||""} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/></div>
                <div style={{display:"flex",gap:10,marginTop:8}}><button className="btn-ghost" style={{flex:1}} onClick={()=>setModal(null)}>Annulla</button><button className="btn" style={{flex:1}} onClick={saveGoal}>{saving?"Salvo...":"Salva"}</button></div>
              </div>
            </>
          )}

          {modal==="budget"&&(
            <>
              <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{editItem?"Modifica":"Nuovo"} Budget</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div><label style={lbl}>Categoria</label>
                  <select style={inp} value={form.catId||""} onChange={e=>setForm(p=>({...p,catId:e.target.value,subcat:""}))}>
                    <option value="">Seleziona...</option>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:10,background:PALETTE.surface,border:`1px solid ${form.useFullCat?PALETTE.accent:PALETTE.border}`}}>
                  <input type="checkbox" checked={!!form.useFullCat} onChange={e=>setForm(p=>({...p,useFullCat:e.target.checked,subcat:""}))} style={{accentColor:PALETTE.accent,width:16,height:16}}/>
                  <span style={{fontSize:13,color:form.useFullCat?PALETTE.accent:PALETTE.muted}}>Usa intera categoria (senza sottocategoria)</span>
                </label>
                {!form.useFullCat&&(
                  <div><label style={lbl}>Sottocategoria</label>
                    <select style={inp} value={form.subcat||""} onChange={e=>setForm(p=>({...p,subcat:e.target.value}))}>
                      <option value="">Nessuna</option>
                      {catSubs(form.catId).map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><label style={lbl}>Limite (€)</label><input style={inp} type="number" value={form.limit||""} onChange={e=>setForm(p=>({...p,limit:e.target.value}))} placeholder="200"/></div>
                  <div><label style={lbl}>Periodo</label>
                    <select style={inp} value={form.period||"mensile"} onChange={e=>setForm(p=>({...p,period:e.target.value}))}>
                      <option value="mensile">Mensile</option><option value="annuale">Annuale</option>
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:8}}><button className="btn-ghost" style={{flex:1}} onClick={()=>setModal(null)}>Annulla</button><button className="btn" style={{flex:1}} onClick={saveBudget}>{saving?"Salvo...":"Salva"}</button></div>
              </div>
            </>
          )}

          {modal==="category"&&(
            <>
              <div style={{fontSize:18,fontWeight:700,marginBottom:20}}>{editItem?"Modifica":"Nuova"} Categoria</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"60px 1fr",gap:12}}>
                  <div><label style={lbl}>Icona</label><input style={inp} value={form.icon||""} onChange={e=>setForm(p=>({...p,icon:e.target.value}))}/></div>
                  <div><label style={lbl}>Nome</label><input style={inp} value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="es. Abbigliamento"/></div>
                </div>
                <div><label style={lbl}>Sottocategorie (separate da virgola)</label><input style={inp} value={form.subs||""} onChange={e=>setForm(p=>({...p,subs:e.target.value}))} placeholder="es. Scarpe,Vestiti,Accessori"/></div>
                <div style={{display:"flex",gap:10,marginTop:8}}><button className="btn-ghost" style={{flex:1}} onClick={()=>setModal(null)}>Annulla</button><button className="btn" style={{flex:1}} onClick={saveCat}>{saving?"Salvo...":"Salva"}</button></div>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
