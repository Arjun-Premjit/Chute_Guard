export const mockHistory=(hours=6)=>{
  const rows=[],n=Math.max(12,Math.round(hours*6)),now=Date.now();
  for(let i=0;i<n;i++){const risk=Math.max(0,Math.min(.98,.08+.02*Math.sin(i/2)+(i>n*.77?(i-n*.77)/n*1.2:0)));
    const ts=new Date(now-(n-1-i)*10*60*1000);
    rows.push({timestamp:ts.toISOString(),ts:ts.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      flow:Math.max(12,25-(risk>.5?(risk-.5)*18:0)+Math.sin(i)*1.4),level:Math.min(96,30+risk*58+Math.cos(i/2)*3),
      risk:Math.round(risk*100),vibration_rms:1.1+risk*2});
  } return rows;
};
export const mockLatest=()=>({timestamp:new Date().toISOString(),flow_rate:24.8,level_pct:35,vibration_rms:1.2,weight_kg:6.4,inlet_flow:1,outlet_flow:1,temperature_c:31.2,blockage_probability:.06,state:"NORMAL"});
