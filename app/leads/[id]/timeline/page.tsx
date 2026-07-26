"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function LegacyLeadTimelinePage(){const{id}=useParams<{id:string}>(),router=useRouter();useEffect(()=>router.replace(`/leads/${id}`),[id,router]);return <main aria-busy="true" className="h-48 animate-pulse rounded-2xl bg-slate-100"/>}
