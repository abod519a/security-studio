const {Pool}=require('pg');
module.exports=new Pool({connectionString:process.env.DATABASE_URL,max:10,ssl:process.env.PGSSL==='true'?{rejectUnauthorized:false}:undefined});
