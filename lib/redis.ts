import { createClient } from 'redis';
let connection:ReturnType<typeof createClient> | null=null;
let pending:Promise<ReturnType<typeof createClient>> | null=null;
let retryAfter=0;
export async function getRedis() {
 if(!process.env.REDIS_URL) throw new Error('Redis is not configured');
 if(connection?.isReady) return connection;
 if(Date.now()<retryAfter) throw new Error('Redis temporarily unavailable');
 if(!pending) {
  const client=createClient({url:process.env.REDIS_URL,socket:{connectTimeout:300,reconnectStrategy:false},disableOfflineQueue:true});
  client.on('error',()=>{retryAfter=Date.now()+2000;});
  pending=client.connect().then(()=>{connection=client;return client;}).catch(err=>{retryAfter=Date.now()+2000;throw err;}).finally(()=>{pending=null;});
 }
 return pending;
}
