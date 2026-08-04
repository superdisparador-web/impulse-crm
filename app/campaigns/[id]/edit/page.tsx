"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function EditCampaignPage(){const {id}=useParams<{id:string}>(),router=useRouter();useEffect(()=>{router.replace(`/campaigns/new?draft=${encodeURIComponent(id)}`)},[id,router]);return <main>Reabrindo o assistente da campanha...</main>}
