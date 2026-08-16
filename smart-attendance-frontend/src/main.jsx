import React, {useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

const subjects = [
  {name:"Data Structures", code:"BCS301", attended:18, conducted:22, classes:"Mon • 10:00 AM", room:"CSE Lab 1"},
  {name:"Database Management", code:"BCS302", attended:20, conducted:24, classes:"Tue • 11:00 AM", room:"Room 204"},
  {name:"Operating Systems", code:"BCS303", attended:16, conducted:20, classes:"Wed • 9:00 AM", room:"Room 301"},
  {name:"Computer Networks", code:"BCS304", attended:19, conducted:23, classes:"Thu • 12:00 PM", room:"Room 205"},
  {name:"Software Engineering", code:"BCS305", attended:17, conducted:20, classes:"Fri • 2:00 PM", room:"Room 202"},
];

const threshold = 75;

function pct(a,b){ return b ? Math.round((a/b)*1000)/10 : 0; }

function statusFor(p){
  if(p >= 85) return ["Excellent","good"];
  if(p >= threshold) return ["Safe","good"];
  if(p >= 65) return ["Warning","warn"];
  return ["Critical","danger"];
}

function requiredClasses(a,b){
  // Minimum future classes x such that (a+x)/(b+x) >= .75
  if (pct(a,b) >= threshold) {
    const canMiss = Math.floor((a/0.75)-b);
    return {type:"safe", value:Math.max(0,canMiss)};
  }
  const x = Math.ceil((0.75*b-a)/0.25);
  return {type:"need", value:Math.max(0,x)};
}

function Logo(){
  return <div className="brand"><div className="brandMark">A</div><div><b>AttendX</b><span>Smart Campus</span></div></div>
}

function Sidebar({page,setPage}){
  const items = [["dashboard","Dashboard","⌂"],["attendance","Attendance","✓"],["timetable","Timetable","▦"],["history","History","◷"],["profile","Profile","◉"]];
  return <aside className="sidebar">
    <Logo/>
    <nav>{items.map(([id,label,icon])=>
      <button key={id} className={page===id?"navItem active":"navItem"} onClick={()=>setPage(id)}><span>{icon}</span>{label}</button>
    )}</nav>
    <div className="sideBottom">
      <div className="collegeMini"><span>AK</span><div><b>College Portal</b><small>B.Tech • CSE</small></div></div>
      <button className="logout">↪ Sign out</button>
    </div>
  </aside>
}

function Header({page,onScan}){
  const title = {dashboard:"Good evening, Ramji 👋",attendance:"Attendance",timetable:"My Timetable",history:"Attendance History",profile:"My Profile"}[page];
  return <header className="topbar">
    <div><h1>{title}</h1><p>{page==="dashboard"?"Keep your attendance above the 75% eligibility threshold.":"Academic Year 2026–27 • B.Tech CSE"}</p></div>
    <div className="topActions">
      <button className="iconBtn" title="Notifications">♢<i>2</i></button>
      <button className="scanBtn" onClick={onScan}>▣ Scan QR</button>
      <div className="avatar">RS</div>
    </div>
  </header>
}

function Ring({value}){
  return <div className="ring" style={{"--p":`${Math.min(value,100)*3.6}deg`}}>
    <div><strong>{value}%</strong><span>overall</span></div>
  </div>
}

function Dashboard({onScan}){
  const totalA = subjects.reduce((s,x)=>s+x.attended,0);
  const totalC = subjects.reduce((s,x)=>s+x.conducted,0);
  const overall = pct(totalA,totalC);
  const safe = requiredClasses(totalA,totalC);
  return <main className="content">
    <section className="heroGrid">
      <div className="card overview">
        <div><p className="eyebrow">OVERALL ATTENDANCE</p><h2>{overall}%</h2><div className="progress"><span style={{width:`${overall}%`}}/></div>
        <div className="thresholdLine"><span>0%</span><span className="threshold">75% required</span><span>100%</span></div></div>
        <Ring value={overall}/>
      </div>
      <div className="card eligibility">
        <div className="statusIcon">{overall>=75?"✓":"!"}</div>
        <div><p className="eyebrow">ELIGIBILITY STATUS</p><h3>{overall>=75?"Eligible":"Shortage Risk"}</h3>
        <p>{safe.type==="safe"?`You can miss up to ${safe.value} more class${safe.value===1?"":"es"} and remain at 75%.`:`Attend the next ${safe.value} classes continuously to reach 75%.`}</p></div>
      </div>
    </section>

    <section className="sectionHead"><div><h2>Subject-wise attendance</h2><p>Attendance is calculated as classes attended ÷ classes conducted.</p></div><button className="linkBtn">View all →</button></section>
    <div className="subjectGrid">{subjects.map(s=><SubjectCard key={s.code} subject={s}/>)}</div>

    <section className="lowerGrid">
      <div className="card">
        <div className="cardHead"><div><h3>Today's classes</h3><p>Sunday • 16 Aug 2026</p></div><span className="live">● LIVE</span></div>
        <ClassRow time="10:00 AM" name="Data Structures" room="CSE Lab 1" state="Upcoming"/>
        <ClassRow time="12:00 PM" name="Database Management" room="Room 204" state="Upcoming"/>
        <ClassRow time="02:00 PM" name="Software Engineering" room="Room 202" state="Completed"/>
      </div>
      <div className="card alertCard">
        <div className="cardHead"><div><h3>Attendance insight</h3><p>Based on your current record</p></div><span>✦</span></div>
        <div className="insight"><b>DBMS is your strongest subject</b><span>83.3% • 20/24 classes</span></div>
        <div className="insight warning"><b>Operating Systems needs attention</b><span>80.0% • 16/20 classes</span></div>
        <button className="fullBtn" onClick={onScan}>Mark next class with QR →</button>
      </div>
    </section>
  </main>
}

function SubjectCard({subject:s}){
  const p=pct(s.attended,s.conducted); const [label,cls]=statusFor(p); const req=requiredClasses(s.attended,s.conducted);
  return <div className="card subject">
    <div className="subjectTop"><div className="subjectIcon">{s.code.slice(-1)}</div><span className={`pill ${cls}`}>{label}</span></div>
    <h3>{s.name}</h3><small>{s.code} • {s.room}</small>
    <div className="subjectPct"><b>{p}%</b><span>{s.attended}/{s.conducted}</span></div>
    <div className="progress thin"><span style={{width:`${p}%`}}/></div>
    <p className="micro">{req.type==="safe"?`Can miss ${req.value} more`: `Need ${req.value} consecutive`} class{req.value===1?"":"es"} for 75%</p>
  </div>
}

function ClassRow({time,name,room,state}){
  return <div className="classRow"><div className="time">{time}</div><div className="classDot"/><div className="classInfo"><b>{name}</b><span>{room}</span></div><span className={`classState ${state==="Completed"?"done":""}`}>{state}</span></div>
}

function Attendance({onScan}){
 return <main className="content">
  <section className="sectionHead"><div><h2>Attendance overview</h2><p>75% is the configured minimum eligibility threshold.</p></div><button className="scanBtn" onClick={onScan}>▣ Scan QR</button></section>
  <div className="card tableCard"><table><thead><tr><th>Subject</th><th>Attended</th><th>Conducted</th><th>Attendance</th><th>Status</th><th>75% plan</th></tr></thead><tbody>{subjects.map(s=>{let p=pct(s.attended,s.conducted);let [lab,cl]=statusFor(p);let r=requiredClasses(s.attended,s.conducted);return <tr key={s.code}><td><b>{s.name}</b><small>{s.code}</small></td><td>{s.attended}</td><td>{s.conducted}</td><td><div className="tablePct"><span>{p}%</span><div className="progress thin"><span style={{width:`${p}%`}}/></div></div></td><td><span className={`pill ${cl}`}>{lab}</span></td><td>{r.type==="safe"?`Miss ${r.value}`:`Attend ${r.value}`}</td></tr>})}</tbody></table></div>
  <div className="note">ⓘ <span><b>How colleges usually calculate attendance:</b> each subject is tracked from actual classes conducted. Attendance % = classes attended ÷ classes conducted × 100. The 75% threshold here is configurable by the institution; final eligibility rules can include college/university-specific condonation and examination rules.</span></div>
 </main>
}

function Timetable(){
 const rows=[["09:00 AM","Operating Systems","Room 301"],["10:00 AM","Data Structures","CSE Lab 1"],["11:00 AM","Database Management","Room 204"],["12:00 PM","Computer Networks","Room 205"],["02:00 PM","Software Engineering","Room 202"]];
 return <main className="content"><section className="sectionHead"><div><h2>Weekly timetable</h2><p>B.Tech CSE • Semester 3</p></div></section><div className="week">{["Mon","Tue","Wed","Thu","Fri"].map((d,i)=><div className="day card" key={d}><h3>{d}</h3><p className="date">{17+i} Aug</p>{rows.slice(i%2, i%2+3).map((r,j)=><div className="slot" key={j}><b>{r[0]}</b><span>{r[1]}</span><small>{r[2]}</small></div>)}</div>)}</div></main>
}

function History(){
 const entries=[["16 Aug","Data Structures","Present","10:02 AM"],["15 Aug","Database Management","Present","11:01 AM"],["14 Aug","Operating Systems","Absent","09:00 AM"],["13 Aug","Computer Networks","Present","12:04 PM"],["12 Aug","Software Engineering","Present","02:01 PM"],["11 Aug","Data Structures","Present","10:03 AM"]];
 return <main className="content"><section className="sectionHead"><div><h2>Attendance history</h2><p>Recent attendance events recorded by the college system.</p></div><button className="outlineBtn">Export CSV</button></section><div className="card historyList">{entries.map((e,i)=><div className="historyRow" key={i}><div className="dateBox"><b>{e[0].split(" ")[0]}</b><span>{e[0].split(" ")[1]}</span></div><div><b>{e[1]}</b><span>QR verification • {e[3]}</span></div><span className={`historyStatus ${e[2]==="Present"?"present":"absent"}`}>{e[2]}</span></div>)}</div></main>
}

function Profile(){
 return <main className="content"><div className="profileHero card"><div className="bigAvatar">RS</div><div><p className="eyebrow">STUDENT PROFILE</p><h2>Ramji Soni</h2><p>B.Tech Computer Science & Engineering • Semester 3</p></div><span className="pill good">Active</span></div><div className="profileGrid"><div className="card infoCard"><h3>Academic details</h3><Info k="Roll Number" v="CSE/2026/042"/><Info k="Section" v="CSE-A"/><Info k="Academic Year" v="2026–27"/><Info k="Attendance rule" v="75% minimum"/></div><div className="card infoCard"><h3>Account security</h3><Info k="Email" v="ramji@student.college.edu"/><Info k="Phone" v="+91 ••••• ••214"/><button className="fullBtn">Manage account</button></div></div></main>
}
function Info({k,v}){return <div className="infoLine"><span>{k}</span><b>{v}</b></div>}

function QRModal({close}){
 return <div className="modalBackdrop" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}>×</button><div className="qrFake"><div className="qrGrid">{Array.from({length:64},(_,i)=><i key={i} className={(i*17+i%5)%3===0?"on":""}/>)}</div></div><h2>Scan classroom QR</h2><p>Point your camera at the temporary attendance QR displayed by your teacher.</p><div className="verify"><span>✓</span><div><b>Verification</b><small>Account + time + classroom location</small></div></div><button className="fullBtn" onClick={close}>Open Camera</button></div></div>
}

function App(){
 const [page,setPage]=useState("dashboard"); const [qr,setQr]=useState(false);
 return <div className="app"><Sidebar page={page} setPage={setPage}/><div className="main"><Header page={page} onScan={()=>setQr(true)}/>{page==="dashboard"&&<Dashboard onScan={()=>setQr(true)}/>} {page==="attendance"&&<Attendance onScan={()=>setQr(true)}/>} {page==="timetable"&&<Timetable/>}{page==="history"&&<History/>}{page==="profile"&&<Profile/>}</div>{qr&&<QRModal close={()=>setQr(false)}/>}</div>
}
createRoot(document.getElementById("root")).render(<App/>);