import { ReactNode, HTMLAttributes, PointerEventHandler } from 'react';
export interface DragData { current?: Record<string, unknown> }
export interface DragItem { id: string; data: DragData }
export interface DragEndEvent { active: DragItem; over: DragItem | null }
export function DndContext(props:{children:ReactNode;autoScroll?:boolean;onDragStart?:(event:{active:DragItem})=>void;onDragEnd?:(event:DragEndEvent)=>void;onDragCancel?:()=>void}):ReactNode;
export function useDraggable(args:{id:string;data?:Record<string,unknown>}):{attributes:HTMLAttributes<HTMLElement>;listeners:{onPointerDown:PointerEventHandler;onPointerMove:PointerEventHandler;onPointerUp:PointerEventHandler;onPointerCancel:PointerEventHandler};setNodeRef:(node:HTMLElement|null)=>void;transform:{x:number;y:number}|null;isDragging:boolean};
export function useDroppable(args:{id:string;data?:{stageId?:string;index?:number}}):{attributes:Record<string,unknown>;setNodeRef:(node:HTMLElement|null)=>void;isOver:boolean;active:DragItem|null};
export function DragOverlay(props:{children:ReactNode}):ReactNode;
export const PointerSensor:unknown; export const TouchSensor:unknown; export const KeyboardSensor:unknown; export function useSensor(sensor:unknown,options?:unknown):unknown; export function useSensors(...sensors:unknown[]):unknown[]; export const closestCenter:unknown;
