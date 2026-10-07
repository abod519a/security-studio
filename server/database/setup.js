require('dotenv').config();
const fs=require('fs'),path=require('path'),bcrypt=require('bcrypt'),pool=require('./db');
(async()=>{
 const{ADMIN_USERNAME:u,ADMIN_PASSWORD:p}=process.env;
 if(!u||!p){console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD in .env');process.exit(1)}
 await pool.query(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
 const hash=await bcrypt.hash(p,12);
 await pool.query('INSERT INTO admins(username,password_hash) VALUES($1,$2) ON CONFLICT(username) DO UPDATE SET password_hash=$2,failed_attempts=0,locked_until=NULL',[u,hash]);
 console.log('Database ready. Admin account created. Remove ADMIN_PASSWORD from .env now.');
 await pool.end();
})().catch(e=>{console.error(e.message);process.exit(1)});
