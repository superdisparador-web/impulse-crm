"use client";
import { useState } from 'react';
export function useCampaignWizard(totalSteps=7,initialStep=1){const[step,setStep]=useState(Math.min(totalSteps,Math.max(1,initialStep)));return{step,setStep,next:()=>setStep(value=>Math.min(totalSteps,value+1)),back:()=>setStep(value=>Math.max(1,value-1)),isFirst:step===1,isLast:step===totalSteps}}
