const r=require('express').Router(),crypto=require('crypto'),bcrypt=require('bcrypt'),{body,param,validationResult}=require('express-validator'),rateLimit=require('express-rate-limit'),pool=require('../database/db'),{requireAuth}=require('../middleware/auth');
const bad=req=>!validationResult(req).isEmpty();
const loginLimiter=rateLimit({windowMs:15*60*1000,max:10,standardHeaders:true,legacyHeaders:false,message:{error:'Too many attempts. Try again later.'}});
const GENERIC={error:'Invalid username or password.'};
const DUMMY=bcrypt.hashSync(crypto.randomBytes(16).toString('hex'),12);
const ST=['pending','in_progress','completed','cancelled'];
r.post('/login',loginLimiter,[body('username').isString().isLength({min:1,max:100}),body('password').isString().isLength({min:1,max:200})],async(req,res,next)=>{try{
 if(bad(req))return res.status(401).json(GENERIC);
 const{rows}=await pool.query('SELECT * FROM admins WHERE username=$1',[req.body.username]),a=rows[0];
 if(a&&a.locked_until&&a.locked_until>new Date())return res.status(429).json({error:'Too many attempts. Try again later.'});
 const ok=await bcrypt.compare(req.body.password,a?a.password_hash:DUMMY);
 if(!a||!ok){if(a){const f=a.failed_attempts+1;await pool.query('UPDATE admins SET failed_attempts=$2,locked_until=$3 WHERE id=$1',[a.id,f>=5?0:f,f>=5?new Date(Date.now()+15*60*1000):null])}return res.status(401).json(GENERIC)}
 await pool.query('UPDATE admins SET failed_attempts=0,locked_until=NULL WHERE id=$1',[a.id]);
 req.session.regenerate(err=>{if(err)return next(err);req.session.adminId=a.id;req.session.csrf=crypto.randomBytes(32).toString('hex');req.session.save(e=>e?next(e):res.json({ok:true,csrf:req.session.csrf}))});
}catch(e){next(e)}});
r.post('/logout',(req,res)=>req.session.destroy(()=>{res.clearCookie('ss.sid');res.json({ok:true})}));
r.use(requireAuth);
r.get('/me',async(req,res,next)=>{try{const{rows}=await pool.query('SELECT username FROM admins WHERE id=$1',[req.session.adminId]);res.json({username:rows[0]&&rows[0].username,csrf:req.session.csrf})}catch(e){next(e)}});
r.get('/stats',async(req,res,next)=>{try{
 const q=await pool.query("SELECT count(*)::int total,count(*) FILTER(WHERE status='pending')::int pending,count(*) FILTER(WHERE status='in_progress')::int in_progress,count(*) FILTER(WHERE status='completed')::int completed,count(*) FILTER(WHERE status='cancelled')::int cancelled,(SELECT count(*)::int FROM projects) projects FROM project_requests");res.json(q.rows[0]);}catch(e){next(e)}});
r.get('/requests',async(req,res,next)=>{try{
 const page=Math.max(1,parseInt(req.query.page)||1),size=10,st=ST.includes(req.query.status)?req.query.status:null,q=`%${String(req.query.q||'').slice(0,100)}%`;
 const w='WHERE ($1::text IS NULL OR status=$1) AND (name ILIKE $2 OR email ILIKE $2 OR request_code ILIKE $2)';
 const[l,c]=await Promise.all([pool.query(`SELECT * FROM project_requests ${w} ORDER BY created_at DESC LIMIT ${size} OFFSET $3`,[st,q,(page-1)*size]),pool.query(`SELECT count(*)::int n FROM project_requests ${w}`,[st,q])]);
 res.json({items:l.rows,total:c.rows[0].n,page,pages:Math.max(1,Math.ceil(c.rows[0].n/size))});}catch(e){next(e)}});
const id=param('id').isInt({min:1});
r.get('/requests/:id',id,async(req,res,next)=>{try{if(bad(req))return res.status(400).json({error:'Invalid request.'});const{rows}=await pool.query('SELECT * FROM project_requests WHERE id=$1',[req.params.id]);rows[0]?res.json(rows[0]):res.status(404).json({error:'Not found.'})}catch(e){next(e)}});
r.patch('/requests/:id',id,body('status').isIn(ST),async(req,res,next)=>{try{if(bad(req))return res.status(400).json({error:'Invalid request.'});const{rows}=await pool.query('UPDATE project_requests SET status=$2,updated_at=now() WHERE id=$1 RETURNING *',[req.params.id,req.body.status]);rows[0]?res.json(rows[0]):res.status(404).json({error:'Not found.'})}catch(e){next(e)}});
r.delete('/requests/:id',id,async(req,res,next)=>{try{if(bad(req))return res.status(400).json({error:'Invalid request.'});await pool.query('DELETE FROM project_requests WHERE id=$1',[req.params.id]);res.json({ok:true})}catch(e){next(e)}});
const url=n=>body(n).optional({checkFalsy:true}).isURL({protocols:['http','https'],require_protocol:true});
const pv=[body('name').isString().trim().isLength({min:2,max:120}),body('description').isString().trim().isLength({min:5,max:2000}),body('category').isString().trim().isLength({min:2,max:60}),body('technologies').isArray({max:20}),body('technologies.*').isString().trim().isLength({min:1,max:40}),url('project_url'),url('image_url')];
const vals=b=>[b.name,b.description,b.category,b.technologies,b.image_url||null,b.project_url||null];
r.post('/projects',pv,async(req,res,next)=>{try{if(bad(req))return res.status(400).json({error:'Please check the project fields.'});const{rows}=await pool.query('INSERT INTO projects(name,description,category,technologies,image_url,project_url) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',vals(req.body));res.status(201).json(rows[0])}catch(e){next(e)}});
r.get('/projects',async(req,res,next)=>{try{res.json((await pool.query('SELECT * FROM projects ORDER BY created_at DESC')).rows)}catch(e){next(e)}});
r.patch('/projects/:id',id,pv,async(req,res,next)=>{try{if(bad(req))return res.status(400).json({error:'Please check the project fields.'});const{rows}=await pool.query('UPDATE projects SET name=$2,description=$3,category=$4,technologies=$5,image_url=$6,project_url=$7,updated_at=now() WHERE id=$1 RETURNING *',[req.params.id,...vals(req.body)]);rows[0]?res.json(rows[0]):res.status(404).json({error:'Not found.'})}catch(e){next(e)}});
r.delete('/projects/:id',id,async(req,res,next)=>{try{if(bad(req))return res.status(400).json({error:'Invalid request.'});await pool.query('DELETE FROM projects WHERE id=$1',[req.params.id]);res.json({ok:true})}catch(e){next(e)}});
module.exports=r;
