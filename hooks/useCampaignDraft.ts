"use client";
import { useEffect } from 'react';
export function useCampaignDraft({dirty,onSave,delay=1200}:{dirty:boolean;onSave:()=>Promise<unknown>;delay?:number}){useEffect(()=>{if(!dirty)return;const timer=window.setTimeout(()=>void onSave(),delay);return()=>window.clearTimeout(timer)},[dirty,onSave,delay]);useEffect(()=>{const leave=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue=''}};addEventListener('beforeunload',leave);return()=>removeEventListener('beforeunload',leave)},[dirty])}
