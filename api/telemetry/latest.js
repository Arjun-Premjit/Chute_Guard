import {createClient} from "@supabase/supabase-js";import {mockLatest} from "../_mock.js";
export default async function handler(req,res){
  try{
    if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(200).json(mockLatest());
    const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
    const {data,error}=await s.from("telemetry").select("*").order("timestamp",{ascending:false}).limit(1).maybeSingle();
    if(error||!data)return res.status(200).json(mockLatest()); return res.status(200).json(data);
  }catch{return res.status(200).json(mockLatest())}
}
