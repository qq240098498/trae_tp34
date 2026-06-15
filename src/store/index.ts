import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import {
  generateId,
  getStockStatus as getStockStatusHelper,
  type StockStatus,
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

interface PetStoreState {
  pets: Pet[];
  inventory: InventoryItem[];
  purchases: PurchaseRecord[];
  usages: UsageRecord[];
  feedings: FeedingRecord[];

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

export const usePetStore = create<PetStoreState>()(
  persist(
    (set, get) => ({
      pets: initialPets,
      inventory: initialInventory,
      purchases: initialPurchases,
      usages: initialUsages,
      feedings: initialFeedings,

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
    }),
    {
      name: 'pet-manager-store',
    }
  )
);
