// 可調整的原型規則；不是兒童發展標準，不以食量或吃完為條件。
export const EXPLORATION_RULES = {
  version: 1,
  levelThresholds: [0, 2, 4, 8, 12],
  unlockLevel: 3,
  pointsPerAction: 1,
  perFoodActionDailyLimit: 1,
  includeDemoEvents: true,
} as const;
export const EXPLORATION_ACTIONS = ['觀察', '聞一聞', '碰觸', '嘗試'] as const;
export type ExplorationAction = typeof EXPLORATION_ACTIONS[number];
export interface ChefDefinition {
  key: string; name: string; aliases: string[]; sprite?: number;
  vector?: 'tomato' | 'broccoli' | 'carrot' | 'generic'; clue: string;
}
export const FOOD_CHEFS: ChefDefinition[] = [
  {key:'tomato',name:'番茄',aliases:['小番茄','聖女番茄','西紅柿'],vector:'tomato',clue:'紅紅的身體，頭上藏著綠色小星星。'},
  {key:'broccoli',name:'花椰菜',aliases:['綠花椰菜','青花菜','西蘭花'],vector:'broccoli',clue:'像一棵小樹，藏著好多綠色小捲捲。'},
  {key:'carrot',name:'胡蘿蔔',aliases:['紅蘿蔔'],vector:'carrot',clue:'橘橘的身體，越往下越細。'},
  {key:'strawberry',name:'草莓',aliases:[],sprite:0,clue:'紅色小外套上，有好多小種子。'},
  {key:'pear',name:'西洋梨',aliases:['洋梨'],sprite:1,clue:'圓圓的肚子，帶著淡淡果香。'},
  {key:'orange',name:'橘子',aliases:['桔子'],sprite:2,clue:'圓滾滾的橘色星球，剝開會聞到什麼呢？'},
  {key:'grape',name:'葡萄',aliases:[],sprite:3,clue:'一顆連一顆，每顆都有自己的樣子。'},
  {key:'peach',name:'水蜜桃',aliases:[],sprite:4,clue:'粉粉的臉頰，表面有什麼不一樣？'},
  {key:'blueberry',name:'藍莓',aliases:[],sprite:5,clue:'小小藍色朋友，戴著一頂小皇冠。'},
];
export const LEVEL_INVITATIONS = [
  '先一起看看顏色與形狀，不用急著吃。',
  '下次可以再觀察，或聞一聞它的氣味。',
  '願意的話，輕輕碰一碰；繼續觀察也很好。',
  '讓小廚師陪你換個角度看看，沒有一定要完成的任務。',
  '熟悉的食物，也可以有新的發現。照自己的步調繼續探索。',
];
