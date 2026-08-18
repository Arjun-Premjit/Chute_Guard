import {createClient} from "@supabase/supabase-js";import {mockHistory} from "../_mock.js";
export default async function handler(req,res){
  const hours=Number(req.query.hours||6);
  try{
    if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(200).json({rows:mockHistory(hours),source:"demo"});
    const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY),since=new Date(Date.now()-hours*3600*1000).toISOString();
    const {data,error}=await s.from("telemetry").select("timestamp,flow_rate,level_pct,vibration_rms,blockage_probability").gte("timestamp",since).order("timestamp",{ascending:true}).limit(3000);
    if(error||!data?.length)return res.status(200).json({rows:mockHistory(hours),source:"demo"});
    return res.status(200).json({rows:data.map(x=>({...x,ts:new Date(x.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),flow:x.flow_rate,level:x.level_pct,risk:Math.round((x.blockage_probability||0)*100)})),source:"supabase"});
  }catch{return res.status(200).json({rows:mockHistory(hours),source:"demo"})}
}
