const r=require('express').Router(),{body,validationResult}=require('express-validator'),pool=require('../database/db');
const TYPES=['Website','Discord Bot','Minecraft Server','Minecraft Plugin','Custom System','Full-Stack Application','Cybersecurity','Other'];
r.get('/projects',async(req,res,next)=>{try{
 const{rows}=await pool.query('SELECT id,name,description,category,image_url,technologies,project_url,created_at FROM projects ORDER BY created_at DESC');res.json(rows);}catch(e){next(e)}});
const s=(n,max)=>body(n).optional({checkFalsy:true}).isString().trim().isLength({max});
r.post('/requests',[
 body('name').isString().trim().isLength({min:2,max:100}),
 body('email').isEmail().isLength({max:200}).normalizeEmail(),
 body('project_type').isIn(TYPES),
 body('description').isString().trim().isLength({min:10,max:3000}),
 s('discord_username',60),s('instagram_username',60),s('budget',60),s('deadline',60),s('additional_information',2000)
],async(req,res,next)=>{try{
 if(!validationResult(req).isEmpty())return res.status(400).json({error:'Please check the highlighted fields.'});
 const b=req.body,seq=(await pool.query("SELECT nextval('request_seq') n")).rows[0].n;
 const code=`SEC-${new Date().getFullYear()}-${String(seq).padStart(4,'0')}`;
 await pool.query('INSERT INTO project_requests(request_code,name,discord_username,instagram_username,email,project_type,description,budget,deadline,additional_information) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
  [code,b.name,b.discord_username||null,b.instagram_username||null,b.email,b.project_type,b.description,b.budget||null,b.deadline||null,b.additional_information||null]);
 res.status(201).json({request_code:code});}catch(e){next(e)}});
module.exports=r;
