import { normalizeBrazilianPhone } from './campaign-preparation';
import { CampaignSegmentationDto } from './dto/campaign-segmentation.dto';

export type SegmentableLead = { id:string; phone:string|null; normalizedPhone:string|null; assignedUserId:string|null; managerUserId:string|null; source:string; status:string; temperature:string; createdAt:Date; metadata:unknown };
const text=(value:unknown)=>String(value??'').trim().toLocaleLowerCase('pt-BR');
const number=(value:unknown)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:null};
const boolean=(value:unknown)=>value===true||value==='true'||value===1||value==='1'||text(value)==='sim';
const metadata=(lead:SegmentableLead)=>(lead.metadata&&typeof lead.metadata==='object'&&!Array.isArray(lead.metadata)?lead.metadata:{}) as Record<string,unknown>;

export function matchesSaoPauloSegmentation(lead:SegmentableLead, filters:CampaignSegmentationDto){
  const data=metadata(lead), city=text(data.city||data.cidade||'São Paulo');
  if(city&&!['são paulo','sao paulo'].includes(city))return false;
  if(filters.region&&text(data.region||data.regiao)!==text(filters.region))return false;
  if(filters.neighborhood&&!text(data.neighborhood||data.bairro).includes(text(filters.neighborhood)))return false;
  if(filters.development&&!text(data.development||data.empreendimento).includes(text(filters.development)))return false;
  const price=number(data.propertyPrice??data.price??data.preco),income=number(data.monthlyIncome??data.income??data.renda),bedrooms=number(data.bedrooms??data.dormitorios);
  if(filters.minPrice!==undefined&&(price===null||price<filters.minPrice))return false;
  if(filters.maxPrice!==undefined&&(price===null||price>filters.maxPrice))return false;
  if(filters.minIncome!==undefined&&(income===null||income<filters.minIncome))return false;
  if(filters.maxIncome!==undefined&&(income===null||income>filters.maxIncome))return false;
  if(filters.bedrooms!==undefined&&bedrooms!==filters.bedrooms)return false;
  if(filters.hasParking!==undefined&&boolean(data.hasParking??data.possuiVaga)!==filters.hasParking)return false;
  if(filters.hasBalcony!==undefined&&boolean(data.hasBalcony??data.possuiVaranda)!==filters.hasBalcony)return false;
  if(filters.mcmv!==undefined&&boolean(data.mcmv??data.minhaCasaMinhaVida)!==filters.mcmv)return false;
  if(filters.managerId&&lead.managerUserId!==filters.managerId)return false;
  if(filters.brokerId&&lead.assignedUserId!==filters.brokerId)return false;
  if(filters.source&&lead.source!==filters.source)return false;
  if(filters.status&&lead.status!==filters.status)return false;
  if(filters.temperature&&lead.temperature!==filters.temperature)return false;
  if(filters.dateFrom&&lead.createdAt<new Date(filters.dateFrom))return false;
  if(filters.dateTo&&lead.createdAt>new Date(filters.dateTo))return false;
  return true;
}

export function classifySegmentedLeads(leads:SegmentableLead[],filters:CampaignSegmentationDto){
  const found=leads.filter(lead=>matchesSaoPauloSegmentation(lead,filters)),seenPhones=new Set<string>(),seenLeads=new Set<string>();let duplicates=0,invalid=0,withoutPhone=0;
  const eligible=found.flatMap(lead=>{if(!lead.phone&&!lead.normalizedPhone){withoutPhone++;return[]};const normalized=normalizeBrazilianPhone(lead.normalizedPhone||lead.phone);if(!normalized.phone){invalid++;return[]};if(seenLeads.has(lead.id)||seenPhones.has(normalized.phone)){duplicates++;return[]};seenLeads.add(lead.id);seenPhones.add(normalized.phone);return[{lead,phone:normalized.phone}]});
  return{found,eligible,duplicates,invalid,withoutPhone};
}
