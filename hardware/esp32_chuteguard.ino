/*
 ChuteGuard ESP32 firmware prototype.
 Adapt pins and calibration values to the actual hardware.
 The firmware posts telemetry to Vercel and polls queued commands.
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "HX711.h"
#include <ESP32Servo.h>

const char* WIFI_SSID="YOUR_WIFI";
const char* WIFI_PASSWORD="YOUR_PASSWORD";
const char* BASE_URL="https://YOUR-VERCEL-APP.vercel.app";
const char* DEVICE_TOKEN="replace-me";

const int TRIG=5,ECHO=18,IR_IN=19,IR_OUT=21,VIB=23,SERVO_PIN=22,BUZZ=17,LED_R=16,LED_G=4,CONV_RELAY=27;
const int HX_DOUT=32,HX_SCK=33;
HX711 scale; Servo servoFlap;

float readDistanceCm(){digitalWrite(TRIG,LOW);delayMicroseconds(2);digitalWrite(TRIG,HIGH);delayMicroseconds(10);digitalWrite(TRIG,LOW);long us=pulseIn(ECHO,HIGH,30000);return us>0?us*.0343f/2.0f:NAN;}
float levelPct(float d){const float EMPTY=22,FULL=4;return constrain((EMPTY-d)/(EMPTY-FULL)*100,0,100);}
float vibRms(){int hits=0;unsigned long t=millis();while(millis()-t<200){hits+=digitalRead(VIB)?1:0;delay(2);}return min(5.0f,hits/40.0f);}
void outputs(bool alarm,bool green){digitalWrite(LED_R,alarm);digitalWrite(LED_G,green);digitalWrite(BUZZ,alarm);}

void sendTelemetry(){
  float level=levelPct(readDistanceCm()); bool in=digitalRead(IR_IN)==LOW, out=digitalRead(IR_OUT)==LOW;
  float vib=vibRms(),weight=scale.is_ready()?max(0.0f,scale.get_units(3)):0.0f;
  float mismatch=(in&&!out)?1.0f:0.0f;
  float p=min(0.98f,max(0.01f,0.01f+0.010f*level+0.12f*vib+0.30f*mismatch));
  String state=p>=.8?"CRITICAL":p>=.5?"WARNING":"NORMAL";
  outputs(state=="CRITICAL",state=="NORMAL");
  if(WiFi.status()!=WL_CONNECTED)return;
  HTTPClient http;http.begin(String(BASE_URL)+"/api/telemetry/ingest");
  http.addHeader("Content-Type","application/json");http.addHeader("Authorization",String("Bearer ")+DEVICE_TOKEN);
  StaticJsonDocument<512>d;d["device_id"]="ESP32-CHUTE-01";d["timestamp"]=millis();d["flow_rate"]=in?25.0:5.0;
  d["level_pct"]=level;d["vibration_rms"]=vib;d["weight_kg"]=weight;d["inlet_flow"]=in;d["outlet_flow"]=out;
  d["temperature_c"]=30.0;d["blockage_probability"]=p;d["state"]=state;
  String body;serializeJson(d,body);http.POST(body);http.end();
}

void pollCommand(){
  if(WiFi.status()!=WL_CONNECTED)return;
  HTTPClient http;http.begin(String(BASE_URL)+"/api/commands/next");http.addHeader("Authorization",String("Bearer ")+DEVICE_TOKEN);
  int code=http.GET();if(code!=200){http.end();return;}String payload=http.getString();http.end();
  StaticJsonDocument<256>d;if(deserializeJson(d,payload))return;const char*cmd=d["command"]|"NONE";
  if(!strcmp(cmd,"STOP_CONVEYOR")){digitalWrite(CONV_RELAY,LOW);outputs(true,false);}
  else if(!strcmp(cmd,"RESUME")){digitalWrite(CONV_RELAY,HIGH);outputs(false,true);}
  else if(!strcmp(cmd,"VIBRATION_ON")){digitalWrite(VIB,HIGH);}
  else if(!strcmp(cmd,"SERVO_CLEAR")){servoFlap.write(120);delay(800);servoFlap.write(45);}
  else if(!strcmp(cmd,"RESET")){outputs(false,true);}
  else if(!strcmp(cmd,"REDUCE_SPEED")){/* replace with PWM motor driver control */}
}

void setup(){
  Serial.begin(115200);pinMode(TRIG,OUTPUT);pinMode(ECHO,INPUT);pinMode(IR_IN,INPUT_PULLUP);pinMode(IR_OUT,INPUT_PULLUP);
  pinMode(VIB,INPUT);pinMode(BUZZ,OUTPUT);pinMode(LED_R,OUTPUT);pinMode(LED_G,OUTPUT);pinMode(CONV_RELAY,OUTPUT);
  digitalWrite(CONV_RELAY,HIGH);outputs(false,true);servoFlap.attach(SERVO_PIN);servoFlap.write(45);
  scale.begin(HX_DOUT,HX_SCK);WiFi.begin(WIFI_SSID,WIFI_PASSWORD);while(WiFi.status()!=WL_CONNECTED)delay(250);
}
unsigned long lastSend=0,lastPoll=0;
void loop(){
  if(millis()-lastSend>1000){lastSend=millis();sendTelemetry();}
  if(millis()-lastPoll>1200){lastPoll=millis();pollCommand();}
}
