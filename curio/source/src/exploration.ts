import type {Event, Meal, State} from './domain';
import {EXPLORATION_RULES as RULES, FOOD_CHEFS, type ChefDefinition, type ExplorationAction} from './exploration-config';

export interface SavedExplorationEvent extends Event {mealId:string; foodKey:string; foodName:string; localDate:string; action:ExplorationAction}
export interface ScoredExplorationEvent extends SavedExplorationEvent {points:number; reason:string}
export interface FoodProgress {key:string; name:string; points:number; level:number; events:ScoredExplorationEvent[]}
export interface UnlockGrant {id:string; childId:string; foodKey:string; foodName:string; unlockedAt:number; mealId:string; announcedAt:number}
export interface ExplorationData {
  schemaVersion:1; rulesVersion:number;
  meals:Record<string,{childId:string; events:SavedExplorationEvent[]}>;
  progress:Record<string,Record<string,FoodProgress>>;
  unlocks:UnlockGrant[];
  companions:Record<string,string>; // 'auto'、'guide' 或已解鎖 foodKey
}
const normalized=(name:string)=>name.normalize('NFKC').trim().replace(/\s+/g,'').toLowerCase();
export function foodIdentity(name:string){const n=normalized(name);const chef=FOOD_CHEFS.find(c=>[c.name,...c.aliases].some(a=>normalized(a)===n));return {key:chef?.key??`food:${n}`,name:chef?.name??name.trim()};}
export function chefDefinition(key:string,name?:string):ChefDefinition{return FOOD_CHEFS.find(c=>c.key===key)??{key,name:name??key.replace(/^food:/,''),aliases:[],vector:'generic',clue:'餐桌上有一位新朋友，等你慢慢認識。'};}
export function actionIdentity(type:string):ExplorationAction|null {return ({'觀察':'觀察','看一看':'觀察','聞一聞':'聞一聞','接觸':'碰觸','碰觸':'碰觸','嘗試':'嘗試'} as Record<string,ExplorationAction>)[type]??null;}
const freshData=():ExplorationData=>({schemaVersion:1,rulesVersion:RULES.version,meals:{},progress:{},unlocks:[],companions:{}});
function snapshot(meal:Meal):SavedExplorationEvent[]{return (meal.session?.events??[]).flatMap(event=>{const food=meal.foods.find(f=>f.id===event.foodId);const action=actionIdentity(event.type);if(!food?.name.trim()||!event.confirmed||!action||!Number.isFinite(event.timestamp))return [];const identity=foodIdentity(food.name);return [{...event,mealId:meal.id,foodKey:identity.key,foodName:identity.name,localDate:meal.localDate,action}];});}
// 由已儲存的餐後快照重算，不讀取用餐中或正在編輯的暫存事件。
function recalculate(data:ExplorationData):ExplorationData {
  const progress:ExplorationData['progress']={};const eventIds=new Set<string>();const daily=new Map<string,number>();
  const all=Object.values(data.meals).flatMap(m=>m.events.map(e=>({...e,childId:m.childId}))).sort((a,b)=>a.timestamp-b.timestamp||a.mealId.localeCompare(b.mealId)||a.id.localeCompare(b.id));
  for(const event of all){const id=`${event.childId}|${event.id}`;if(eventIds.has(id))continue;eventIds.add(id);
    const foods=progress[event.childId]??(progress[event.childId]={});const p=foods[event.foodKey]??(foods[event.foodKey]={key:event.foodKey,name:event.foodName,points:0,level:1,events:[]});
    const key=JSON.stringify([event.childId,event.foodKey,event.localDate,event.action]);const used=daily.get(key)??0;
    const allowed=event.source!=='demo'||RULES.includeDemoEvents;
    const points=allowed&&used<RULES.perFoodActionDailyLimit?RULES.pointsPerAction:0;
    if(points)daily.set(key,used+1);
    p.points+=points;p.events.push({...event,points,reason:points?'已累積探索經驗':!allowed?'示範事件不計分':'同食物、同行為每天僅累積一次'});
    p.level=RULES.levelThresholds.filter(t=>p.points>=t).length;
  }
  return {...data,progress,rulesVersion:RULES.version};
}
function grantUnlocks(data:ExplorationData,mealId:string,now:number){const unlocks=[...data.unlocks];const added:UnlockGrant[]=[];
  for(const [childId,foods] of Object.entries(data.progress))for(const p of Object.values(foods))if(p.level>=RULES.unlockLevel&&!unlocks.some(g=>g.childId===childId&&g.foodKey===p.key)){
    const grant={id:JSON.stringify([childId,p.key]),childId,foodKey:p.key,foodName:p.name,unlockedAt:now,mealId,announcedAt:now};unlocks.push(grant);added.push(grant);
  }
  return {data:{...data,unlocks},added};
}
export function migrateExploration(state:State):State {
  const saved=state.exploration;
  const valid=saved?.schemaVersion===1&&saved.meals&&typeof saved.meals==='object'&&Array.isArray(saved.unlocks)&&saved.companions&&typeof saved.companions==='object'&&Object.values(saved.meals).every(m=>m&&typeof m.childId==='string'&&Array.isArray(m.events));
  if(valid)return {...state,exploration:recalculate(saved!)};
  const data=freshData();for(const meal of state.meals)if(meal.status==='complete')data.meals[meal.id]={childId:meal.childId,events:snapshot(meal)};
  // 舊資料只移入已完成回顧；既有解鎖安靜加入收藏，不在開啟 App 時播獎勵。
  return {...state,exploration:grantUnlocks(recalculate(data),'migration',Date.now()).data};
}
export function explorationData(state:State):ExplorationData{return state.exploration??migrateExploration(state).exploration!;}
export function commitMealExploration(state:State,meal:Meal,now=Date.now()) {
  const previous=explorationData(state);const complete:Meal={...meal,status:'complete'};
  const next=recalculate({...previous,meals:{...previous.meals,[meal.id]:{childId:meal.childId,events:snapshot(complete)}}});
  const {data,added}=grantUnlocks(next,meal.id,now);
  const changes=Object.values(data.progress[meal.childId]??{}).filter(p=>complete.foods.some(f=>foodIdentity(f.name).key===p.key)).map(p=>({food:p.name,key:p.key,points:p.points,level:p.level,delta:p.points-(previous.progress[meal.childId]?.[p.key]?.points??0)}));
  return {state:{...state,meals:[...state.meals.filter(m=>m.id!==meal.id),complete],exploration:data},newUnlocks:added.filter(g=>g.childId===meal.childId),changes};
}
export function deleteMealExploration(state:State,mealId:string):State {
  const old=explorationData(state);const meals={...old.meals};delete meals[mealId];
  // 修正或刪除紀錄會重算進度；已加入收藏的廚師保留，不重複觸發解鎖。
  return {...state,meals:state.meals.filter(m=>m.id!==mealId),exploration:recalculate({...old,meals})};
}
export function progressFor(state:State,childId:string,key:string,name?:string):FoodProgress {return explorationData(state).progress[childId]?.[key]??{key,name:chefDefinition(key,name).name,points:0,level:1,events:[]};}
export function unlockedChefs(state:State,childId:string){return explorationData(state).unlocks.filter(g=>g.childId===childId);}
export function isChefUnlocked(state:State,childId:string,key:string){return unlockedChefs(state,childId).some(g=>g.foodKey===key);}
export function companionChoice(state:State,meal:Meal):string{return meal.companionChoice??explorationData(state).companions[meal.childId]??'auto';}
export function selectCompanion(state:State,meal:Meal):string|null {
  const choice=companionChoice(state,meal),unlocked=unlockedChefs(state,meal.childId);if(choice==='guide')return null;
  if(choice!=='auto'&&unlocked.some(g=>g.foodKey===choice))return choice;
  return meal.foods.map(f=>foodIdentity(f.name).key).find(k=>unlocked.some(g=>g.foodKey===k))??unlocked[0]?.foodKey??null;
}
export function setCompanion(state:State,childId:string,choice:string):State {
  if(!['auto','guide'].includes(choice)&&!isChefUnlocked(state,childId,choice))return state;
  const data=explorationData(state);return {...state,exploration:{...data,companions:{...data.companions,[childId]:choice}}};
}
export function canRecordAction(meal:Meal,foodId:string,type:string){const food=meal.foods.find(f=>f.id===foodId);const action=actionIdentity(type);return !!food&&!!action&&!(meal.session?.events??[]).some(e=>e.confirmed&&actionIdentity(e.type)===action&&meal.foods.some(f=>f.id===e.foodId&&foodIdentity(f.name).key===foodIdentity(food.name).key));}
export function recordAction(meal:Meal,foodId:string,type:string,source:Event['source']='parent',now=Date.now()):Meal {
  if(!canRecordAction(meal,foodId,type))return meal;
  const session=meal.session??{id:crypto.randomUUID(),duration:0,startedAt:now,endedAt:now,pausedAt:null,accumulatedPause:0,status:'ended' as const,mode:'demo' as const,characterId:0,companionChefId:null,events:[]};
  return {...meal,session:{...session,events:[...session.events,{id:crypto.randomUUID(),foodId,type:actionIdentity(type)!,timestamp:now,source,confirmed:true}]}};
}
export function collectionFoods(state:State,childId:string){const foods=new Map(FOOD_CHEFS.map(c=>[c.key,{key:c.key,name:c.name}]));for(const meal of state.meals.filter(m=>m.childId===childId))for(const food of meal.foods)if(food.name.trim()){const f=foodIdentity(food.name);foods.set(f.key,f);}for(const p of Object.values(explorationData(state).progress[childId]??{}))foods.set(p.key,{key:p.key,name:p.name});for(const grant of unlockedChefs(state,childId))foods.set(grant.foodKey,{key:grant.foodKey,name:grant.foodName});return [...foods.values()];}
