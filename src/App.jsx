import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { getHistory, getLatest, getPrediction, sendCommand, askChatbot } from "./lib/api";
import { supabase } from "./lib/supabase";

const demoTelemetry = {
  timestamp: new Date().toISOString(),
  flow_rate: 24.8, level_pct: 35, vibration_rms: 1.2, weight_kg: 6.4,
  inlet_flow: 1, outlet_flow: 1, temperature_c: 31.2,
  blockage_probability: 0.06, state: "NORMAL"
};

function useDemoSeries() {
  return useMemo(() => Array.from({length:36},(_,i)=>{
    const now=Date.now(), t=new Date(now-(35-i)*10*60*1000);
    const risk=8+Math.sin(i/4)*5+(i>27?(i-27)*2.1:0);
    return {ts:t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      flow:Math.max(10,25-(i>28?(i-28)*.9:0)+Math.sin(i)*1.8),
      level:Math.min(95,30+(i>28?(i-28)*5:0)+Math.cos(i/2)*4),
      risk:Math.min(99,Math.max(1,risk))};
  }),[]);
}
function Metric({label,value,unit}) {
  return <div className="metric-card"><span className="metric-label">{label}</span>
    <span className="metric-value">{value}<small>{unit}</small></span></div>;
}

export default function App() {
  const [data,setData]=useState(demoTelemetry);
  const [history,setHistory]=useState([]);
  const [alerts,setAlerts]=useState([]);
  const [cameraOpen,setCameraOpen]=useState(false);
  const [chat,setChat]=useState([{role:"assistant",text:"ChuteGuard is online. Ask about flow, level, blockage risk, or the last alert."}]);
  const [chatInput,setChatInput]=useState("");
  const [busy,setBusy]=useState(false);
  const demo=useDemoSeries();

  useEffect(()=>{
    let live=true;
    (async()=>{
      try{const x=await getLatest();if(live&&x)setData(x);}catch{}
      try{const x=await getHistory(6);if(live&&Array.isArray(x?.rows))setHistory(x.rows);}
      catch{if(live)setHistory(demo);}
    })();
    const timer=setInterval(async()=>{
      try{const x=await getLatest();if(live&&x){
        setData(x);
        if(x.state!=="NORMAL")setAlerts(a=>[{time:new Date(x.timestamp).toLocaleTimeString(),state:x.state,risk:x.blockage_probability},...a].slice(0,8));
      }}catch{}
    },3000);
    return()=>{live=false;clearInterval(timer);}
  },[demo]);

  useEffect(()=>{
    if(!supabase)return;
    const c=supabase.channel("telemetry-live")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"telemetry"},p=>setData(p.new))
      .subscribe();
    return()=>supabase.removeChannel(c);
  },[]);

  const riskPct=Math.round((data.blockage_probability??0)*100);
  const tone=riskPct>=80?"danger":riskPct>=50?"warn":"ok";

  async function command(name,value=null){setBusy(true);try{await sendCommand(name,value)}finally{setBusy(false)}}
  async function predict(){
    setBusy(true);try{const r=await getPrediction(data);setData(d=>({...d,blockage_probability:r.probability,state:r.state}))}finally{setBusy(false)}
  }
  async function sendChat(){
    const msg=chatInput.trim(); if(!msg)return;
    setChat(c=>[...c,{role:"user",text:msg}]);setChatInput("");
    try{const r=await askChatbot(msg,data);setChat(c=>[...c,{role:"assistant",text:r.reply}])}
    catch{setChat(c=>[...c,{role:"assistant",text:"Chat service is unavailable. Check the API deployment."}])}
  }

  return <div className="app-shell">
    <header className="topbar">
      <div><div className="eyebrow">SIH 2026 | Smart Automation | IoT</div>
        <h1>ChuteGuard AIoT</h1><p>Automated detection, prediction and prevention of material chute blockages.</p></div>
      <div className={`status-pill ${tone}`}><span className="dot"></span>{data.state||"NORMAL"} | Risk {riskPct}%</div>
    </header>
    <main className="content">
      <section className="hero-grid">
        <div className="hero-card">
          <div className="section-head"><div><h2>Live process state</h2><p>Sensor fusion across inlet, chute and outlet.</p></div>
            <button className="btn primary" onClick={predict} disabled={busy}>Run prediction</button></div>
          <div className="metric-grid">
            <Metric label="Flow rate" value={Number(data.flow_rate??0).toFixed(1)} unit="kg/s"/>
            <Metric label="Chute level" value={Math.round(data.level_pct??0)} unit="%"/>
            <Metric label="Vibration RMS" value={Number(data.vibration_rms??0).toFixed(2)} unit="g"/>
            <Metric label="Captured mass" value={Number(data.weight_kg??0).toFixed(2)} unit="kg"/>
            <Metric label="Inlet flow" value={data.inlet_flow?"ON":"OFF"} unit=""/>
            <Metric label="Outlet flow" value={data.outlet_flow?"ON":"OFF"} unit=""/>
          </div>
        </div>
        <div className={`risk-card ${tone}`}><span>Blockage probability</span><strong>{riskPct}%</strong>
          <div className="risk-meter"><span style={{width:`${riskPct}%`}}></span></div>
          <p>{riskPct<50?"Normal operation. Continue monitoring.":riskPct<80?"Early warning. Consider reducing feed.":"Critical risk. Stop feed and clear the chute."}</p>
        </div>
      </section>

      <section className="panel"><div className="section-head"><div><h2>Historical trends</h2>
        <p>Last 6 hours or demo series if database is not connected.</p></div>
        <button className="btn ghost" onClick={()=>setHistory(demo)}>Load demo</button></div>
        <div className="chart-grid">
          <div className="chart-box"><h3>Flow and level</h3>
            <ResponsiveContainer width="100%" height={300}><AreaChart data={history.length?history:demo}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15}/><XAxis dataKey="ts"/><YAxis/><Tooltip/><Legend/>
              <Area type="monotone" dataKey="flow" strokeWidth={2.5} fillOpacity={0.15}/><Area type="monotone" dataKey="level" strokeWidth={2.5} fillOpacity={0.04}/>
            </AreaChart></ResponsiveContainer>
          </div>
          <div className="chart-box"><h3>Risk trend</h3>
            <ResponsiveContainer width="100%" height={300}><BarChart data={history.length?history:demo}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15}/><XAxis dataKey="ts"/><YAxis domain={[0,100]}/><Tooltip/>
              <Bar dataKey="risk"/><Legend/>
            </BarChart></ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="control-grid">
        <div className="panel"><div className="section-head"><div><h2>Hardware control</h2><p>Commands are queued for the ESP32 polling endpoint.</p></div></div>
          <div className="control-buttons">
            <button className="btn danger" onClick={()=>command("STOP_CONVEYOR")}>Stop conveyor</button>
            <button className="btn warn" onClick={()=>command("REDUCE_SPEED",0.5)}>Reduce to 50%</button>
            <button className="btn" onClick={()=>command("VIBRATION_ON")}>Vibration ON</button>
            <button className="btn" onClick={()=>command("SERVO_CLEAR")}>Servo clear</button>
            <button className="btn" onClick={()=>command("RESET")}>Reset system</button>
            <button className="btn ok" onClick={()=>command("RESUME")}>Resume</button>
          </div>
        </div>
        <div className="panel"><div className="section-head"><div><h2>Computer vision</h2>
          <p>OpenCV.js can compute simple occupancy and contour features.</p></div>
          <button className="btn primary" onClick={()=>setCameraOpen(v=>!v)}>{cameraOpen?"Close camera":"Open camera"}</button></div>
          {cameraOpen&&<CameraView/>}
        </div>
      </section>

      <section className="two-col">
        <div className="panel"><h2>Alerts</h2>
          {alerts.length===0?<div className="empty">No critical alerts in this session.</div>:
          alerts.map((a,i)=><div className="alert-row" key={i}><span>{a.time}</span><b>{a.state}</b><strong>{Math.round(a.risk*100)}%</strong></div>)}
        </div>
        <div className="panel"><h2>Operator chatbot</h2>
          <div className="chat-window">{chat.map((m,i)=><div className={`chat ${m.role}`} key={i}>{m.text}</div>)}</div>
          <div className="chat-input"><input value={chatInput} onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Ask: why is risk rising?"/>
            <button className="btn primary" onClick={sendChat}>Send</button></div>
        </div>
      </section>
    </main>
    <footer className="footer"><span>ChuteGuard AIoT</span><span>Vercel + Supabase + ESP32 + OpenCV.js</span></footer>
  </div>;
}

function CameraView(){
  const [videoReady,setVideoReady]=useState(false),[score,setScore]=useState(null);
  useEffect(()=>{
    let stream;const start=async()=>{try{const video=document.getElementById("cv-video");stream=await navigator.mediaDevices.getUserMedia({video:true});
      video.srcObject=stream;video.onloadedmetadata=()=>setVideoReady(true);}catch{}};
    start();return()=>stream?.getTracks?.().forEach(t=>t.stop());
  },[]);
  const analyze=()=>{
    const cv=window.cv,video=document.getElementById("cv-video"),canvas=document.getElementById("cv-canvas");
    if(!cv||!videoReady)return;const cap=new cv.VideoCapture(video);
    const frame=new cv.Mat(video.videoHeight,video.videoWidth,cv.CV_8UC4);cap.read(frame);
    const gray=new cv.Mat();cv.cvtColor(frame,gray,cv.COLOR_RGBA2GRAY);
    const mean=cv.mean(gray)[0];const occupancy=Math.max(0,Math.min(100,Math.round((255-mean)/2.55)));
    setScore(occupancy);cv.imshow(canvas,frame);frame.delete();gray.delete();
  };
  return <div><div className="camera-wrap"><video id="cv-video" autoPlay playsInline muted/><canvas id="cv-canvas"/></div>
    <div className="camera-actions"><button className="btn" onClick={analyze}>Analyze frame</button><span className="badge">Vision occupancy proxy: {score==null?"--":`${score}%`}</span></div>
    <p className="tiny">Production upgrade: replace the proxy with a trained segmentation/object-detection model and calibrate it against chute geometry.</p></div>;
}
