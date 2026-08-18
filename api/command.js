import {createClient} from "@supabase/supabase-js";
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  const {command,value=null,device_id="ESP32-CHUTE-01"}=req.body||{};if(!command)return res.status(400).json({error:"command required"});
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(200).json({ok:true,mode:"demo",command,value});
  const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
  const {error}=await s.from("commands").insert({device_id,command,value:value==null?null:String(value),status:"PENDING"});
  if(error)return res.status(500).json({ok:false,error:error.message});return res.status(200).json({ok:true,command,value});
}
