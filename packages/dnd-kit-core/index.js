import React, {createContext, useContext} from 'react';
import {createPortal} from 'react-dom';
const Context=createContext(null);
export function DndContext({children}){return React.createElement(React.Fragment,null,children)}
export function useDraggable({id,data}){const ctx=useContext(Context);return{attributes:{role:'button','aria-roledescription':'item arrastável','aria-pressed':ctx?.active?.id===id},listeners:{onPointerDown:e=>{if(e.button!==0)return;e.preventDefault();ctx.start(id,data,e)},onPointerMove:e=>ctx.move(e),onPointerUp:()=>ctx.end(),onPointerCancel:()=>ctx.cancel()},setNodeRef:()=>{},transform:ctx?.active?.id===id&&ctx.point?{x:ctx.point.x,y:ctx.point.y}:null,isDragging:ctx?.active?.id===id}}
export function useDroppable({id,data}){const ctx=useContext(Context);return{setNodeRef:()=>{},isOver:ctx?.over?.id===id,active:ctx?.active,attributes:{'data-dnd-drop':id,'data-stage-id':data?.stageId,'data-index':data?.index}}}
export function DragOverlay({children}){const ctx=useContext(Context);if(!ctx?.active||!ctx.point||typeof document==='undefined')return null;return createPortal(React.createElement('div',{style:{position:'fixed',left:ctx.point.x+12,top:ctx.point.y+12,zIndex:9999,pointerEvents:'none',width:320,transform:'rotate(2deg)',transition:'transform 120ms ease'}},children),document.body)}
export const PointerSensor=class{};export const TouchSensor=class{};export const KeyboardSensor=class{};export function useSensor(sensor,options){return{sensor,options}}export function useSensors(...sensors){return sensors}export const closestCenter=()=>null;
