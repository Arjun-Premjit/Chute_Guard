import {createClient} from "@supabase/supabase-js";
export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"GET only"});
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(200).json({command:"NONE"});
  const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
  const {data}=await s.from("commands").select("*").eq("status","PENDING").order("created_at",{ascending:true}).limit(1).maybeSingle();
  if(!data)return res.status(200).json({command:"NONE"});
  await s.from("commands").update({status:"SENT",sent_at:new Date().toISOString()}).eq("id",data.id);return res.status(200).json(data);
}
