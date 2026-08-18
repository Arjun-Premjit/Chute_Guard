export async function getLatest() {
  const r = await fetch("/api/telemetry/latest"); if (!r.ok) throw new Error("latest failed"); return r.json();
}
export async function getHistory(hours=6) {
  const r = await fetch(`/api/telemetry/history?hours=${hours}`); if (!r.ok) throw new Error("history failed"); return r.json();
}
export async function getPrediction(payload) {
  const r = await fetch("/api/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!r.ok) throw new Error("prediction failed"); return r.json();
}
export async function sendCommand(command,value=null) {
  const r = await fetch("/api/command",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({command,value})});
  if(!r.ok) throw new Error("command failed"); return r.json();
}
export async function askChatbot(message,context) {
  const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,context})});
  if(!r.ok) throw new Error("chat failed"); return r.json();
}