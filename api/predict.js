const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  const x=req.body||{},level=Number(x.level_pct||0)/100,vibration=Number(x.vibration_rms||0),flow=Number(x.flow_rate||0),inlet=x.inlet_flow?1:0,outlet=x.outlet_flow?1:0,weight=Number(x.weight_kg||0);
  const z=-3.2+5.3*level+.45*vibration+.12*Math.max(0,20-flow)+1.55*(inlet-outlet)+.07*Math.max(0,weight-6);
  const probability=Number(clamp(1/(1+Math.exp(-z))).toFixed(4)),state=probability>=.8?"CRITICAL":probability>=.5?"WARNING":"NORMAL";
  return res.status(200).json({probability,state,model:"prototype-logistic-v1",next_action:state==="CRITICAL"?"STOP_CONVEYOR + SERVO_CLEAR + BUZZER":state==="WARNING"?"REDUCE_SPEED + VIBRATION_ON":"CONTINUE"});
}
