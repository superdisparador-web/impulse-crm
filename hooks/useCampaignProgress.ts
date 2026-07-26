"use client";
import { useEffect, useState } from 'react';
import { campaignsService } from '@/services/campaigns.service';
import { CampaignProgressMetrics, CampaignStatus } from '@/types/campaign';
import { shouldPollCampaign } from '@/app/campaigns/campaign-operational-ui.mjs';

export function useCampaignProgress(campaignId:string,status?:CampaignStatus){const[progress,setProgress]=useState<CampaignProgressMetrics|null>(null);const[error,setError]=useState('');useEffect(()=>{let active=true,timer:number|undefined,busy=false;const schedule=()=>{if(active&&shouldPollCampaign(status,document.hidden))timer=window.setTimeout(()=>void refresh(),5000)};const refresh=async()=>{if(!active||busy||!shouldPollCampaign(status,document.hidden))return;busy=true;try{setProgress(await campaignsService.progress(campaignId));setError('')}catch(reason){setError(reason instanceof Error?reason.message:'Erro ao atualizar o progresso.')}finally{busy=false;schedule()}};const visibility=()=>{if(document.hidden){if(timer)clearTimeout(timer)}else if(shouldPollCampaign(status,false)){if(timer)clearTimeout(timer);void refresh()}};document.addEventListener('visibilitychange',visibility);void refresh();return()=>{active=false;if(timer)clearTimeout(timer);document.removeEventListener('visibilitychange',visibility)}},[campaignId,status]);return{progress,error}}
