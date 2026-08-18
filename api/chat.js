export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  const {message="",context={}}=req.body||{},q=message.toLowerCase(),risk=Math.round(Number(context.blockage_probability||0)*100),level=Number(context.level_pct||0),flow=Number(context.flow_rate||0);
  let reply;
  if(q.includes("risk")||q.includes("blockage"))reply=`Current estimated blockage risk is ${risk}%. Level is ${Math.round(level)}% and flow is ${flow.toFixed(1)} kg/s.`;
  else if(q.includes("level"))reply=`The latest chute fill level is ${Math.round(level)}%. A sustained rise together with falling outlet flow is an early-warning pattern.`;
  else if(q.includes("what should")||q.includes("action"))reply=risk>=80?"Recommended action: stop feed, enable vibration, command servo clearance, and keep the operator alarm active.":risk>=50?"Recommended action: reduce conveyor speed, enable vibration, and watch whether outlet flow recovers.":"Recommended action: continue monitoring and log the current operating point for model learning.";
  else if(q.includes("why"))reply="The system fuses level, flow imbalance, vibration and load features. Rising level plus falling outlet flow is weighted strongly because it indicates accumulation.";
  else reply="I can explain blockage risk, sensor trends, recommended actions, recent alerts, or the purpose of each hardware sensor.";
  return res.status(200).json({reply});
}
