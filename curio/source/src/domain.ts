export const categories = ['全穀雜糧','豆魚蛋肉','蔬菜','水果','乳品','油脂與堅果種子'];
export const uid = () => crypto.randomUUID();
export const localDate = (date=new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export interface Profile {id:string;nickname:string;birthMonth:string;avatar:number;preferredFoods:string;unfamiliarFoods:string;allergies:string;dailyEnergyReference:number|null;referenceSource:string;isDemo:boolean}
export interface Food {id:string;name:string;category:string;servingAmount:number;unit:string;energyPerUnit:number;energySource:string;intakeConfirmed:boolean;consumedFraction:number|null}
export interface Event {id:string;foodId:string;type:string;timestamp:number;source:'parent'|'demo'|'device';confirmed:boolean}
export interface Session {id:string;duration:number;startedAt:number;pausedAt:number|null;accumulatedPause:number;endedAt:number|null;status:'running'|'paused'|'ended';mode:'demo';characterId:number;events:Event[]}
export interface Meal {id:string;childId:string;localDate:string;mealType:string;time:string;photo?:string;foods:Food[];status:'draft'|'ready'|'active'|'review'|'complete';notes:string;exploreFoodId:string;session?:Session}
export interface State {profile:Profile|null;meals:Meal[]}
export const offered = (m:Meal) => m.foods.reduce((n,f)=>n+f.servingAmount*f.energyPerUnit,0);
export const intake = (m:Meal) => m.foods.reduce((n,f)=>n+(f.intakeConfirmed?f.servingAmount*f.energyPerUnit*(f.consumedFraction??0):0),0);
export const total = (meals:Meal[],childId:string,date:string) => meals.filter(m=>m.childId===childId && m.localDate===date).reduce((n,m)=>n+intake(m),0);
export const upsert = (meals:Meal[],meal:Meal) => [...meals.filter(m=>m.id!==meal.id),meal];
export const elapsed = (s:Session,now=Date.now()) => Math.max(0,(s.endedAt??s.pausedAt??now)-s.startedAt-s.accumulatedPause);
export const pause = (s:Session,now=Date.now()):Session => s.status==='running'?{...s,status:'paused',pausedAt:now}:s;
export const resume = (s:Session,now=Date.now()):Session => s.status==='paused'?{...s,status:'running',accumulatedPause:s.accumulatedPause+now-s.pausedAt!,pausedAt:null}:s;
export const finish = (s:Session,now=Date.now()):Session => ({...s,status:'ended',endedAt:s.pausedAt??now,pausedAt:null});
export const newFood = ():Food => ({id:uid(),name:'',category:'蔬菜',servingAmount:50,unit:'g',energyPerUnit:0.3,energySource:'家長輸入／原型近似值，請確認',intakeConfirmed:false,consumedFraction:null});
export const FoodAnalysisService = {async analyze():Promise<Food[]>{return [['糙米飯','全穀雜糧',100,1.12],['雞胸肉','豆魚蛋肉',50,1.65],['花椰菜','蔬菜',60,0.34],['草莓','水果',60,0.32]].map(([name,category,servingAmount,energyPerUnit])=>({...newFood(),name:String(name),category:String(category),servingAmount:Number(servingAmount),energyPerUnit:Number(energyPerUnit),energySource:'示範數值，非正式營養資料庫'}))}};
export const NutritionEstimateService = {offered,intake,total};
export const DeviceAdapter = {connectionStatus:'未連線',mode:'demo',capabilities:['示範光圈','家長記錄事件']};
export const MealSuggestionService = {suggest(meals:Meal[],profile:Profile,date:string){const ms=meals.filter(m=>m.childId===profile.id&&m.localDate===date);const seen=new Set(ms.flatMap(m=>m.foods.filter(f=>f.intakeConfirmed&&(f.consumedFraction??0)>0).map(f=>f.category)));const examples:[string,string[]][]=[['蔬菜',['花椰菜','紅蘿蔔','南瓜']],['水果',['草莓','西洋梨','橘子']],['豆魚蛋肉',['豆腐','雞肉','雞蛋']],['全穀雜糧',['糙米飯','地瓜']],['乳品',['優格','牛奶']]];const excluded=profile.allergies.split(/[,，、\s]+/).filter(Boolean);return {reason:!seen.size?'目前已確認紀錄不足，先從熟悉的食物搭配開始。':'今天尚未記錄'+examples.filter(([c])=>!seen.has(c)).map(([c])=>c).join('、')+'的攝取，可作為下餐靈感。',items:examples.filter(([c])=>!seen.has(c)).map(([category,foods])=>({category,foods:foods.filter(f=>!excluded.some(a=>f.includes(a)||a.includes(f)))})).filter(x=>x.foods.length)}}};
export const storageKey='curio-parent-v1';
export function readState(storage:Pick<Storage,'getItem'>):State {try{const s=JSON.parse(storage.getItem(storageKey)??'null');return s&&Array.isArray(s.meals)?s:{profile:null,meals:[]}}catch{return {profile:null,meals:[]}}}
export function saveState(storage:Pick<Storage,'setItem'>,state:State){storage.setItem(storageKey,JSON.stringify(state))}
