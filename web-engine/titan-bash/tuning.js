




export const HZ = 60;
export const DT = 1 / HZ;
export const secs = (s) => Math.round(s * HZ);

export const TUNING = Object.freeze({
  radius: 1.6,              
  dashTime: 0.22,           
  dashDistance: 9,
  runSpeedMul: 1.45,        
  turnLerp: 0.35,           

  
  heatDash: 16,
  heatRunPerSec: 22,
  coolIdlePerSec: 30,
  coolBusyPerSec: 8,
  coolIdleDelay: 0.6,       
  redLine: 70,
  redLineMul: 1.25,         
  stallTime: 1.6,
  stallHeatAfter: 40,
  stalledDamageMul: 1.2,
  ventMarkAt: 1.2,          
  ventWindow: 0.18,         
  ventWindowRookie: 0.30,
  roughVentCut: 0.4,
  overdriveTime: 1.5,
  overdriveSpeedMul: 1.4,

  
  slamDamage: 5,
  slamKnock: 12,            
  clangWindow: 0.12,        
  clangHitstop: 0.25,
  clangKnock: 12,
  counterWindow: 0.5,
  counterDamage: 8,
  rattlePerDamage: 2.4,
  rattleDrainPerSec: 25,
  rattleDrainDelay: 1.0,
  rattledTime: 1.0,
  rattledDamageMul: 1.2,
  rookieRattleMul: 1.3,     

  
  knockMissingArmourMul: 0.3, 
  knockDrag: 6,             
  creditWindow: 4,          
  respawnTime: 3.0,
  spawnShield: 1.5,
  bountyLead: 2,
  bountyValue: 2,

  
  roundTime: 150,
  stormTime: 40,
  stormBellMul: 2,
  stormWallTime: 30,        
  stormWallMin: 0.6,        
  stormWallDamage: 6,
  stormWallKnock: 12,       
  stormWallEvery: 0.5,      

  crystalRegrow: 20,        
  tideEvery: 30,            
  tideWarn: 3,              
  tideKnock: 26,            
  tideDamage: 4,

  
  lumenEvery: 12,           
  lumenCap: 1,
  lumenCapStorm: 2,
  lumenToOverdrive: 3,
  lumenTime: 6,             
  lumenDamageMul: 1.15,     
  lumenPickup: 0.8,         
  lumenClear: 4,            

  
  sleeperWakeAfter: 4,      
  sleeperWarn: 3,           
  sleeperTelegraph: 1.2,    
  sleeperRecover: 2.2,      
  sleeperReach: 15,         
  sleeperArc: 100,          
  sleeperDamage: 25,
  sleeperKnock: 30,         
  sleeperCoreR: 2.2,        
  sleeperCoreHits: 6,       
  sleeperBell: 1,

  
  autoAimCone: 50,          
  autoAimConeRookie: 80,
  autoAimRange: 30,
});
