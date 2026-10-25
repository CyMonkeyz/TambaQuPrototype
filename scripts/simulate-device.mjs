// Node 22+. Secrets come from environment, never command-line arguments.
import { randomUUID } from 'node:crypto';
const endpoint=process.env.TAMBAQU_DEVICE_ENDPOINT;
const token=process.env.TAMBAQU_DEVICE_TOKEN;
if(!endpoint||!token)throw new Error('Set TAMBAQU_DEVICE_ENDPOINT and TAMBAQU_DEVICE_TOKEN.');
const url=new URL(endpoint);
if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Use HTTPS for device credentials.');
async function send(body){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-device-token':token},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`Device API returned ${r.status}`);return r.json();}
let stopping=false;process.on('SIGINT',()=>{stopping=true;});
while(!stopping){
 const packet={operation:'telemetry',schemaVersion:1,messageId:randomUUID(),measuredAt:new Date().toISOString(),quality:'valid',values:{temperature:29,ph:7.8,dissolvedOxygen:5.2,salinity:20}};
 try{
  await send(packet);
  if(process.env.TAMBAQU_REPLAY==='true')await send(packet);
  const result=await send({operation:'poll'});
  for(const command of result.commands??[]){if(!command.payload?.simulation)continue;await send({operation:'ack',commandId:command.id,status:'acknowledged'});await send({operation:'ack',commandId:command.id,status:'succeeded',feedback:{outputVerified:true,observedState:'on',simulation:true}});}
  console.log(`${new Date().toISOString()} Telemetry accepted; simulator commands checked.`);
 }catch(error){console.error(error.message);}
 if(process.env.TAMBAQU_ONCE==='true')break;
 await new Promise(resolve=>setTimeout(resolve,Math.min(60000,Math.max(1000,Number(process.env.TAMBAQU_INTERVAL_MS)||60000))));
}
