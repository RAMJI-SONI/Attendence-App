import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { query, initDb } from "./db.js";
import { signUser, auth } from "./auth.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 10000);
const threshold = Number(process.env.ATTENDANCE_THRESHOLD || 75);

app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(x=>x.trim()) : true,
  credentials: true
}));
app.use(express.json());

app.get("/", (_req,res)=>res.json({
  name:"AttendX Smart Attendance API",
  status:"running",
  attendanceThreshold:`${threshold}%`
}));

app.get("/api/health", async (_req,res)=>{
  try {
    await query("SELECT 1");
    res.json({ok:true, database:"connected", threshold});
  } catch (e) {
    res.status(503).json({ok:false, database:"unavailable", error:e.message});
  }
});

app.post("/api/auth/login", async (req,res)=>{
  try {
    const {email,password}=req.body;
    if(!email || !password) return res.status(400).json({message:"Email and password are required"});
    const result=await query("SELECT id,name,email,password_hash,role FROM users WHERE LOWER(email)=LOWER($1)",[email]);
    const user=result.rows[0];
    if(!user || !(await bcrypt.compare(password,user.password_hash))) {
      return res.status(401).json({message:"Invalid email or password"});
    }
    const token=signUser(user);
    res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});
  } catch(e){res.status(500).json({message:"Login failed",error:e.message});}
});

app.get("/api/student/me",auth("student"),async(req,res)=>{
  const r=await query(`
    SELECT u.id,u.name,u.email,c.name AS class_name,c.semester,c.section,c.department
    FROM users u
    LEFT JOIN enrollments e ON e.student_id=u.id
    LEFT JOIN subjects s ON s.id=e.subject_id
    LEFT JOIN classes c ON c.id=s.class_id
    WHERE u.id=$1
    LIMIT 1
  `,[req.user.id]);
  res.json(r.rows[0] || req.user);
});

app.get("/api/student/attendance",auth("student"),async(req,res)=>{
  const r=await query(`
    SELECT s.id,s.code,s.name,s.room,
      COUNT(DISTINCT a.session_id) FILTER (WHERE a.status='present')::int AS attended,
      COUNT(DISTINCT ses.id)::int AS conducted
    FROM enrollments e
    JOIN subjects s ON s.id=e.subject_id
    LEFT JOIN attendance_sessions ses ON ses.subject_id=s.id
    LEFT JOIN attendance a ON a.session_id=ses.id AND a.student_id=e.student_id
    WHERE e.student_id=$1
    GROUP BY s.id,s.code,s.name,s.room
    ORDER BY s.code
  `,[req.user.id]);

  const subjects=r.rows.map(x=>{
    const attended=Number(x.attended||0), conducted=Number(x.conducted||0);
    const percentage=conducted?Math.round(attended/conducted*1000)/10:0;
    return {...x,attended,conducted,percentage,status:percentage>=threshold?"safe":percentage>=65?"warning":"critical"};
  });
  const totalA=subjects.reduce((n,x)=>n+x.attended,0);
  const totalC=subjects.reduce((n,x)=>n+x.conducted,0);
  const overall=totalC?Math.round(totalA/totalC*1000)/10:0;
  let plan;
  if(overall>=threshold){
    plan={type:"safe",value:Math.max(0,Math.floor(totalA/(threshold/100)-totalC))};
  } else {
    plan={type:"need",value:Math.ceil(((threshold/100)*totalC-totalA)/(1-threshold/100))};
  }
  res.json({threshold,overall,attended:totalA,conducted:totalC,plan,subjects});
});

app.get("/api/student/history",auth("student"),async(req,res)=>{
  const r=await query(`
    SELECT a.id,a.status,a.marked_at,s.code,s.name,ses.room
    FROM attendance a
    JOIN attendance_sessions ses ON ses.id=a.session_id
    JOIN subjects s ON s.id=ses.subject_id
    WHERE a.student_id=$1
    ORDER BY a.marked_at DESC
    LIMIT 100
  `,[req.user.id]);
  res.json(r.rows);
});

app.post("/api/teacher/sessions",auth("teacher"),async(req,res)=>{
  try {
    const {subjectId,room,minutes=5,latitude=null,longitude=null,radiusM=100}=req.body;
    if(!subjectId) return res.status(400).json({message:"subjectId is required"});
    const token=crypto.randomBytes(24).toString("hex");
    const r=await query(`
      INSERT INTO attendance_sessions(subject_id,teacher_id,room,ends_at,qr_token,latitude,longitude,radius_m)
      VALUES($1,$2,$3,NOW()+($4 || ' minutes')::interval,$5,$6,$7,$8)
      RETURNING id,subject_id,room,starts_at,ends_at,qr_token,latitude,longitude,radius_m
    `,[subjectId,req.user.id,room,minutes,token,latitude,longitude,radiusM]);
    res.status(201).json(r.rows[0]);
  } catch(e){res.status(500).json({message:"Could not start attendance",error:e.message});}
});

app.post("/api/attendance/mark",auth("student"),async(req,res)=>{
  try {
    const {qrToken,latitude=null,longitude=null}=req.body;
    if(!qrToken) return res.status(400).json({message:"QR token is required"});
    const session=await query(`
      SELECT ses.*,s.name AS subject_name
      FROM attendance_sessions ses
      JOIN subjects s ON s.id=ses.subject_id
      WHERE ses.qr_token=$1 AND ses.ends_at>NOW()
    `,[qrToken]);
    const ses=session.rows[0];
    if(!ses) return res.status(400).json({message:"QR expired or invalid"});

    const enrolled=await query("SELECT 1 FROM enrollments WHERE student_id=$1 AND subject_id=$2",[req.user.id,ses.subject_id]);
    if(!enrolled.rowCount) return res.status(403).json({message:"You are not enrolled in this subject"});

    const already=await query("SELECT id FROM attendance WHERE session_id=$1 AND student_id=$2",[ses.id,req.user.id]);
    if(already.rowCount) return res.status(409).json({message:"Attendance already marked"});

    // Location is recorded here. A production version should enforce a verified
    // geofence using a proper distance calculation and anti-spoofing strategy.
    await query(`
      INSERT INTO attendance(session_id,student_id,status,latitude,longitude)
      VALUES($1,$2,'present',$3,$4)
    `,[ses.id,req.user.id,latitude,longitude]);

    res.status(201).json({message:"Attendance marked successfully",subject:ses.subject_name,sessionId:ses.id});
  } catch(e){res.status(500).json({message:"Could not mark attendance",error:e.message});}
});

app.get("/api/teacher/sessions/:id",auth("teacher"),async(req,res)=>{
  const r=await query(`
    SELECT a.id,u.name,u.email,a.status,a.marked_at
    FROM attendance a
    JOIN users u ON u.id=a.student_id
    WHERE a.session_id=$1
    ORDER BY a.marked_at
  `,[req.params.id]);
  res.json(r.rows);
});

async function seed(){
  const count=await query("SELECT COUNT(*)::int AS n FROM users");
  if(count.rows[0].n>0) return;

  const pass=await bcrypt.hash("password123",10);
  const student=(await query(
    "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'student') RETURNING id",
    ["Ramji Soni","ramji@student.college.edu",pass]
  )).rows[0].id;
  const teacher=(await query(
    "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'teacher') RETURNING id",
    ["Demo Faculty","faculty@college.edu",pass]
  )).rows[0].id;

  const cls=(await query(
    "INSERT INTO classes(name,semester,section,department) VALUES($1,3,'CSE-A','Computer Science & Engineering') RETURNING id",
    ["B.Tech CSE"]
  )).rows[0].id;

  const names=[
    ["BCS301","Data Structures","CSE Lab 1"],
    ["BCS302","Database Management","Room 204"],
    ["BCS303","Operating Systems","Room 301"],
    ["BCS304","Computer Networks","Room 205"],
    ["BCS305","Software Engineering","Room 202"]
  ];

  for(const [code,name,room] of names){
    const sid=(await query(
      "INSERT INTO subjects(code,name,class_id,room) VALUES($1,$2,$3,$4) RETURNING id",
      [code,name,cls,room]
    )).rows[0].id;
    await query("INSERT INTO enrollments(student_id,subject_id) VALUES($1,$2)",[student,sid]);
  }

  console.log("Demo account created:");
  console.log("Student: ramji@student.college.edu / password123");
  console.log("Teacher: faculty@college.edu / password123");
  console.log("Teacher ID:",teacher);
}

initDb().then(seed).then(()=>{
  app.listen(PORT,"0.0.0.0",()=>console.log(`AttendX API running on port ${PORT}`));
}).catch(err=>{
  console.error("Startup failed:",err);
  process.exit(1);
});