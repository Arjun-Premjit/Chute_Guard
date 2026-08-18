import {createClient} from "@supabase/supabase-js";
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(200).json({ok:true,mode:"demo"});
  try{
    const b=req.body||{},s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
    const row={device_id:b.device_id||"ESP32-CHUTE-01",timestamp:b.timestamp||new Date().toISOString(),flow_rate:Number(b.flow_rate||0),level_pct:Number(b.level_pct||0),vibration_rms:Number(b.vibration_rms||0),weight_kg:Number(b.weight_kg||0),inlet_flow:Boolean(b.inlet_flow),outlet_flow:Boolean(b.outlet_flow),temperature_c:Number(b.temperature_c||0),blockage_probability:Number(b.blockage_probability||0),state:b.state||"NORMAL",cv_score:Number(b.cv_score||0)};
    const {error}=await s.from("telemetry").insert(row);if(error)return res.status(500).json({ok:false,error:error.message});return res.status(200).json({ok:true});
  }catch(e){return res.status(400).json({ok:false,error:e.message})}
}
