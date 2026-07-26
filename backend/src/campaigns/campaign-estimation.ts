export type CampaignCategory='MARKETING'|'UTILITY'|'AUTHENTICATION';
const costEnvironment:Record<CampaignCategory,string>={MARKETING:'CAMPAIGN_COST_MARKETING',UTILITY:'CAMPAIGN_COST_UTILITY',AUTHENTICATION:'CAMPAIGN_COST_AUTHENTICATION'};
export function estimateCampaignOperation(messages:number,speed:number,concurrency:number,category:CampaignCategory,now=new Date()){
  const safeMessages=Math.max(0,Number.isFinite(messages)?Math.floor(messages):0),safeSpeed=Math.max(1,Number.isFinite(speed)?speed:1),safeConcurrency=Math.max(1,Number.isFinite(concurrency)?concurrency:1);
  const effectivePerMinute=safeSpeed*safeConcurrency,durationMinutes=safeMessages?Math.ceil(safeMessages/effectivePerMinute):0,estimatedEndAt=new Date(now.getTime()+durationMinutes*60_000);
  const configured=process.env[costEnvironment[category]],unitCost=configured==null||configured===''?null:Number(configured),validUnitCost=unitCost!==null&&Number.isFinite(unitCost)&&unitCost>=0?unitCost:null;
  return{messages:safeMessages,speedPerMinute:safeSpeed,concurrency:safeConcurrency,effectivePerMinute,durationMinutes,estimatedEndAt:estimatedEndAt.toISOString(),category,costPerMessage:validUnitCost,estimatedCost:validUnitCost===null?null:Number((validUnitCost*safeMessages).toFixed(4)),costConfigured:validUnitCost!==null};
}
