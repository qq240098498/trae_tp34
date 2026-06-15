import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  generateId,
  getStockStatus as getStockStatusHelper,
  calculateDailyConsumption,
  type StockStatus,
  type ConsumptionAnalysis,
} from '@/utils/helpers';

export type PetSpecies = 'cat' | 'dog' | 'rabbit' | 'bird' | 'fish' | 'other';

export type InventoryCategory =
  | 'food'
  | 'can'
  | 'snack'
  | 'litter'
  | 'pad'
  | 'dewormer'
  | 'other';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  weight: number;
  birthday: string;
  avatar: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  currentQuantity: number;
  unit: string;
  minThreshold: number;
  lastPurchaseAmount: number;
  lastPurchaseDate: string;
  unitPrice: number;
  note: string;
  dailyConsumption: number;
  reminderDays: number;
  autoCalculateConsumption: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRecord {
  id: string;
  inventoryId: string;
  quantity: number;
  unitPrice: number;
  purchaseDate: string;
  note?: string;
  createdAt: string;
}

export interface UsageRecord {
  id: string;
  inventoryId: string;
  quantity: number;
  usageDate: string;
  note?: string;
  createdAt: string;
}

export type FeedingType = 'feeding' | 'medicine' | 'other';

export interface FeedingRecord {
  id: string;
  petId?: string;
  type: FeedingType;
  itemName: string;
  amount: number;
  unit: string;
  recordTime: string;
  note: string;
  createdAt: string;
}

export type TransitionReaction = 'normal' | 'soft_stool' | 'vomit';

export interface FoodTransitionDay {
  day: number;
  newFoodPercent: number;
  oldFoodPercent: number;
  reaction?: TransitionReaction;
  note?: string;
  recordedAt?: string;
}

export interface FoodTransitionPlan {
  id: string;
  petId: string;
  oldFoodName: string;
  newFoodName: string;
  dailyAmount: number;
  unit: string;
  startDate: string;
  days: FoodTransitionDay[];
  status: 'active' | 'completed' | 'cancelled';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface PetStoreState {
  pets: Pet[];
  inventory: InventoryItem[];
  purchases: PurchaseRecord[];
  usages: UsageRecord[];
  feedings: FeedingRecord[];
  foodTransitionPlans: FoodTransitionPlan[];

  addPet: (pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePet: (id: string, data: Partial<Pet>) => void;
  deletePet: (id: string) => void;

  addInventory: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateInventory: (id: string, data: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  recordPurchase: (
    inventoryId: string,
    quantity: number,
    unitPrice: number,
    note?: string
  ) => void;
  recordUsage: (
    inventoryId: string,
    quantity: number,
    note?: string
  ) => void;

  addFeeding: (
    record: Omit<FeedingRecord, 'id' | 'createdAt'>
  ) => void;
  deleteFeeding: (id: string) => void;

  getLowStockItems: () => InventoryItem[];
  getInventoryByCategory: (category: InventoryCategory) => InventoryItem[];
  getStockStatus: (item: InventoryItem) => StockStatus;

  analyzeConsumption: (itemId: string) => ConsumptionAnalysis;
  getItemsNeedingReminder: () => Array<{ item: InventoryItem; analysis: ConsumptionAnalysis }>;
  updateDailyConsumption: (itemId: string, dailyConsumption: number) => void;
  updateReminderDays: (itemId: string, reminderDays: number) => void;
  toggleAutoCalculate: (itemId: string) => void;

  createFoodTransitionPlan: (
    plan: Omit<FoodTransitionPlan, 'id' | 'days' | 'status' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateFoodTransitionPlan: (id: string, data: Partial<FoodTransitionPlan>) => void;
  recordTransitionReaction: (
    planId: string,
    day: number,
    reaction: TransitionReaction,
    note?: string
  ) => void;
  cancelFoodTransitionPlan: (id: string) => void;
  completeFoodTransitionPlan: (id: string) => void;
  deleteFoodTransitionPlan: (id: string) => void;
  getActiveTransitionPlan: (petId: string) => FoodTransitionPlan | undefined;
  getCurrentTransitionDay: (plan: FoodTransitionPlan) => number;
}

const now = () => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
const today = () => format(new Date(), 'yyyy-MM-dd');

const initialPets: Pet[] = [
  {
    id: generateId(),
    name: '小橘',
    species: 'cat',
    breed: '橘猫',
    weight: 5.2,
    birthday: '2022-03-15',
    avatar: '🐱',
    note: '爱吃罐头，性格温顺',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: generateId(),
    name: '豆豆',
    species: 'dog',
    breed: '柴犬',
    weight: 12.5,
    birthday: '2021-08-20',
    avatar: '🐕',
    note: '活泼好动，需要每天遛弯',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: generateId(),
    name: '兔兔',
    species: 'rabbit',
    breed: '荷兰垂耳兔',
    weight: 2.1,
    birthday: '2023-11-01',
    avatar: '🐰',
    note: '喜欢吃干草和胡萝卜',
    createdAt: now(),
    updatedAt: now(),
  },
];

const initialInventory: InventoryItem[] = [
  {
    id: generateId(),
    name: '皇家猫粮',
    category: 'food',
    currentQuantity: 3.5,
    unit: 'kg',
    minThreshold: 2,
    lastPurchaseAmount: 5,
    lastPurchaseDate: '2026-05-10',
    unitPrice: 128,
    note: '小橘的主粮',
    dailyConsumption: 0.1,
    reminderDays: 3,
    autoCalculateConsumption: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: generateId(),
    name: '希宝罐头',
    category: 'can',
    currentQuantity: 6,
    unit: '个',
    minThreshold: 8,
    lastPurchaseAmount: 24,
    lastPurchaseDate: '2026-05-01',
    unitPrice: 8.5,
    note: '金枪鱼味，小橘最爱',
    dailyConsumption: 1,
    reminderDays: 3,
    autoCalculateConsumption: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: generateId(),
    name: '豆腐猫砂',
    category: 'litter',
    currentQuantity: 1,
    unit: '袋',
    minThreshold: 2,
    lastPurchaseAmount: 4,
    lastPurchaseDate: '2026-04-20',
    unitPrice: 35,
    note: '6L装，绿茶味',
    dailyConsumption: 0.25,
    reminderDays: 5,
    autoCalculateConsumption: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: generateId(),
    name: '宠物驱虫药',
    category: 'dewormer',
    currentQuantity: 3,
    unit: '支',
    minThreshold: 2,
    lastPurchaseAmount: 6,
    lastPurchaseDate: '2026-03-15',
    unitPrice: 45,
    note: '体内外同驱',
    dailyConsumption: 0.033,
    reminderDays: 7,
    autoCalculateConsumption: false,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: generateId(),
    name: '狗狗零食',
    category: 'snack',
    currentQuantity: 15,
    unit: '个',
    minThreshold: 10,
    lastPurchaseAmount: 30,
    lastPurchaseDate: '2026-05-20',
    unitPrice: 3,
    note: '鸡肉干，训练用',
    dailyConsumption: 2,
    reminderDays: 3,
    autoCalculateConsumption: false,
    createdAt: now(),
    updatedAt: now(),
  },
];

const initialPurchases: PurchaseRecord[] = [
  {
    id: generateId(),
    inventoryId: initialInventory[0].id,
    quantity: 5,
    unitPrice: 128,
    purchaseDate: '2026-05-10',
    note: '京东购买',
    createdAt: now(),
  },
  {
    id: generateId(),
    inventoryId: initialInventory[1].id,
    quantity: 24,
    unitPrice: 8.5,
    purchaseDate: '2026-05-01',
    createdAt: now(),
  },
];

const initialUsages: UsageRecord[] = [
  {
    id: generateId(),
    inventoryId: initialInventory[0].id,
    quantity: 1.5,
    usageDate: '2026-06-01',
    note: '日常消耗',
    createdAt: now(),
  },
  {
    id: generateId(),
    inventoryId: initialInventory[1].id,
    quantity: 18,
    usageDate: '2026-06-10',
    createdAt: now(),
  },
];

const initialFeedings: FeedingRecord[] = [
  {
    id: generateId(),
    petId: initialPets[0].id,
    type: 'feeding',
    itemName: '皇家猫粮',
    amount: 50,
    unit: 'g',
    recordTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    note: '早餐',
    createdAt: now(),
  },
  {
    id: generateId(),
    petId: initialPets[1].id,
    type: 'medicine',
    itemName: '宠物驱虫药',
    amount: 1,
    unit: '支',
    recordTime: format(new Date(Date.now() - 86400000), "yyyy-MM-dd'T'HH:mm:ss"),
    note: '月度驱虫',
    createdAt: now(),
  },
];

const initialFoodTransitionPlans: FoodTransitionPlan[] = [];

function generate7DayTransitionPlan(): FoodTransitionDay[] {
  const percentages = [20, 30, 40, 50, 60, 80, 100];
  return percentages.map((newPercent, index) => ({
    day: index + 1,
    newFoodPercent: newPercent,
    oldFoodPercent: 100 - newPercent,
  }));
}

export const usePetStore = create<PetStoreState>()(
  persist(
    (set, get) => ({
      pets: initialPets,
      inventory: initialInventory,
      purchases: initialPurchases,
      usages: initialUsages,
      feedings: initialFeedings,
      foodTransitionPlans: initialFoodTransitionPlans,

      addPet: (pet) => {
        const newPet: Pet = {
          ...pet,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({ pets: [...state.pets, newPet] }));
      },

      updatePet: (id, data) => {
        set((state) => ({
          pets: state.pets.map((pet) =>
            pet.id === id ? { ...pet, ...data, updatedAt: now() } : pet
          ),
        }));
      },

      deletePet: (id) => {
        set((state) => ({
          pets: state.pets.filter((pet) => pet.id !== id),
          feedings: state.feedings.filter((f) => f.petId !== id),
        }));
      },

      addInventory: (item) => {
        const newItem: InventoryItem = {
          ...item,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({ inventory: [...state.inventory, newItem] }));
      },

      updateInventory: (id, data) => {
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === id ? { ...item, ...data, updatedAt: now() } : item
          ),
        }));
      },

      deleteInventory: (id) => {
        set((state) => ({
          inventory: state.inventory.filter((item) => item.id !== id),
          purchases: state.purchases.filter((p) => p.inventoryId !== id),
          usages: state.usages.filter((u) => u.inventoryId !== id),
        }));
      },

      recordPurchase: (inventoryId, quantity, unitPrice, note) => {
        const purchaseRecord: PurchaseRecord = {
          id: generateId(),
          inventoryId,
          quantity,
          unitPrice,
          purchaseDate: today(),
          note,
          createdAt: now(),
        };
        set((state) => ({
          purchases: [...state.purchases, purchaseRecord],
          inventory: state.inventory.map((item) =>
            item.id === inventoryId
              ? {
                  ...item,
                  currentQuantity: item.currentQuantity + quantity,
                  lastPurchaseAmount: quantity,
                  lastPurchaseDate: today(),
                  unitPrice,
                  updatedAt: now(),
                }
              : item
          ),
        }));
      },

      recordUsage: (inventoryId, quantity, note) => {
        const usageRecord: UsageRecord = {
          id: generateId(),
          inventoryId,
          quantity,
          usageDate: today(),
          note,
          createdAt: now(),
        };
        set((state) => ({
          usages: [...state.usages, usageRecord],
          inventory: state.inventory.map((item) =>
            item.id === inventoryId
              ? {
                  ...item,
                  currentQuantity: Math.max(
                    0,
                    item.currentQuantity - quantity
                  ),
                  updatedAt: now(),
                }
              : item
          ),
        }));
      },

      addFeeding: (record) => {
        const newRecord: FeedingRecord = {
          ...record,
          id: generateId(),
          createdAt: now(),
        };
        set((state) => ({ feedings: [...state.feedings, newRecord] }));
      },

      deleteFeeding: (id) => {
        set((state) => ({
          feedings: state.feedings.filter((f) => f.id !== id),
        }));
      },

      getLowStockItems: () => {
        const { inventory } = get();
        return inventory.filter(
          (item) => item.currentQuantity <= item.minThreshold * 1.5
        );
      },

      getInventoryByCategory: (category) => {
        const { inventory } = get();
        return inventory.filter((item) => item.category === category);
      },

      getStockStatus: (item) => {
        return getStockStatusHelper(item.currentQuantity, item.minThreshold);
      },

      analyzeConsumption: (itemId) => {
        const { inventory, feedings } = get();
        const item = inventory.find((i) => i.id === itemId);
        if (!item) {
          return {
            dailyConsumption: 0,
            unit: '',
            daysRemaining: Infinity,
            shouldRemind: false,
            reminderDate: null,
            feedingsAnalyzed: 0,
            analysisPeriodDays: 7,
          };
        }

        if (item.autoCalculateConsumption) {
          const analysis = calculateDailyConsumption(
            feedings,
            item.name,
            item.unit,
            item.currentQuantity,
            item.reminderDays
          );
          if (analysis.feedingsAnalyzed > 0) {
            return analysis;
          }
        }

        const daily = item.dailyConsumption;
        const daysRemaining = daily > 0 ? item.currentQuantity / daily : Infinity;
        const shouldRemind = daysRemaining !== Infinity && daysRemaining <= item.reminderDays;

        let reminderDate: string | null = null;
        if (shouldRemind && daysRemaining !== Infinity) {
          const reminder = new Date(Date.now() + (daysRemaining - item.reminderDays) * 24 * 60 * 60 * 1000);
          reminderDate = format(reminder, 'yyyy-MM-dd');
        }

        return {
          dailyConsumption: daily,
          unit: item.unit,
          daysRemaining: daysRemaining === Infinity ? Infinity : Math.round(daysRemaining * 10) / 10,
          shouldRemind,
          reminderDate,
          feedingsAnalyzed: 0,
          analysisPeriodDays: 0,
        };
      },

      getItemsNeedingReminder: () => {
        const { inventory, analyzeConsumption } = get();
        return inventory
          .map((item) => ({
            item,
            analysis: analyzeConsumption(item.id),
          }))
          .filter(({ analysis }) => analysis.shouldRemind);
      },

      updateDailyConsumption: (itemId, dailyConsumption) => {
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === itemId
              ? { ...item, dailyConsumption, autoCalculateConsumption: false, updatedAt: now() }
              : item
          ),
        }));
      },

      updateReminderDays: (itemId, reminderDays) => {
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === itemId
              ? { ...item, reminderDays, updatedAt: now() }
              : item
          ),
        }));
      },

      toggleAutoCalculate: (itemId) => {
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === itemId
              ? { ...item, autoCalculateConsumption: !item.autoCalculateConsumption, updatedAt: now() }
              : item
          ),
        }));
      },

      createFoodTransitionPlan: (plan) => {
        const existingActivePlan = get().getActiveTransitionPlan(plan.petId);
        if (existingActivePlan) {
          alert('该宠物已有进行中的换粮计划，请先完成或取消当前计划');
          return;
        }

        const newPlan: FoodTransitionPlan = {
          ...plan,
          id: generateId(),
          days: generate7DayTransitionPlan(),
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({
          foodTransitionPlans: [...state.foodTransitionPlans, newPlan],
        }));
      },

      updateFoodTransitionPlan: (id, data) => {
        set((state) => ({
          foodTransitionPlans: state.foodTransitionPlans.map((plan) =>
            plan.id === id ? { ...plan, ...data, updatedAt: now() } : plan
          ),
        }));
      },

      recordTransitionReaction: (planId, day, reaction, note) => {
        set((state) => ({
          foodTransitionPlans: state.foodTransitionPlans.map((plan) => {
            if (plan.id !== planId) return plan;
            return {
              ...plan,
              days: plan.days.map((d) =>
                d.day === day
                  ? { ...d, reaction, note, recordedAt: now() }
                  : d
              ),
              updatedAt: now(),
            };
          }),
        }));
      },

      cancelFoodTransitionPlan: (id) => {
        set((state) => ({
          foodTransitionPlans: state.foodTransitionPlans.map((plan) =>
            plan.id === id
              ? { ...plan, status: 'cancelled', updatedAt: now() }
              : plan
          ),
        }));
      },

      completeFoodTransitionPlan: (id) => {
        set((state) => ({
          foodTransitionPlans: state.foodTransitionPlans.map((plan) =>
            plan.id === id
              ? { ...plan, status: 'completed', updatedAt: now() }
              : plan
          ),
        }));
      },

      deleteFoodTransitionPlan: (id) => {
        set((state) => ({
          foodTransitionPlans: state.foodTransitionPlans.filter((p) => p.id !== id),
        }));
      },

      getActiveTransitionPlan: (petId) => {
        return get().foodTransitionPlans.find(
          (p) => p.petId === petId && p.status === 'active'
        );
      },

      getCurrentTransitionDay: (plan) => {
        const startDate = parseISO(plan.startDate);
        const today = new Date();
        const diffDays = differenceInDays(today, startDate) + 1;
        return Math.max(1, Math.min(diffDays, 7));
      },
    }),
    {
      name: 'pet-manager-store',
    }
  )
);
