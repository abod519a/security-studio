exports.requireAuth=(req,res,next)=>req.session&&req.session.adminId?next():res.status(401).json({error:'You must be logged in.'});
exports.csrf=(req,res,next)=>{
 if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
 const t=req.get('x-csrf-token');
 if(!t||!req.session.csrf||t!==req.session.csrf)return res.status(403).json({error:'Invalid request token. Refresh the page and try again.'});
 next();
};
