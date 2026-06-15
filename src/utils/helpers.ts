import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  format,
  parseISO,
  isValid,
} from 'date-fns';
import type { InventoryCategory, PetSpecies } from '@/store';

export type StockStatus = 'normal' | 'warning' | 'low';

export function calculateAge(birthday: string): string {
  const birthDate = parseISO(birthday);
  if (!isValid(birthDate)) {
    return '未知';
  }

  const now = new Date();
  const years = differenceInYears(now, birthDate);

  if (years >= 1) {
    const months = differenceInMonths(now, birthDate) % 12;
    if (months === 0) {
      return `${years}岁`;
    }
    return `${years}岁${months}个月`;
  }

  const months = differenceInMonths(now, birthDate);
  if (months >= 1) {
    return `${months}个月`;
  }

  const days = differenceInDays(now, birthDate);
  return `${days}天`;
}

export function getStockStatus(
  current: number,
  threshold: number
): StockStatus {
  if (current <= threshold) {
    return 'low';
  }
  if (current <= threshold * 1.5) {
    return 'warning';
  }
  return 'normal';
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    return '--';
  }
  return format(d, 'yyyy-MM-dd');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    return '--';
  }
  return format(d, 'yyyy-MM-dd HH:mm');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getCategoryIcon(category: InventoryCategory): string {
  const icons: Record<InventoryCategory, string> = {
    food: '🥣',
    can: '🥫',
    snack: '🍖',
    litter: '🧻',
    pad: '🛡️',
    dewormer: '💊',
    other: '📦',
  };
  return icons[category];
}

export function getCategoryName(category: InventoryCategory): string {
  const names: Record<InventoryCategory, string> = {
    food: '主粮',
    can: '罐头',
    snack: '零食',
    litter: '猫砂',
    pad: '尿垫',
    dewormer: '驱虫药',
    other: '其他',
  };
  return names[category];
}

export function getSpeciesName(species: PetSpecies): string {
  const names: Record<PetSpecies, string> = {
    cat: '猫',
    dog: '狗',
    rabbit: '兔子',
    bird: '鸟',
    fish: '鱼',
    other: '其他',
  };
  return names[species];
}

export function getSpeciesEmoji(species: PetSpecies): string {
  const emojis: Record<PetSpecies, string> = {
    cat: '🐱',
    dog: '🐕',
    rabbit: '🐰',
    bird: '🐦',
    fish: '🐟',
    other: '🐾',
  };
  return emojis[species];
}

const unitConversionRates: Record<string, { toBase: number; baseUnit: string }> = {
  'g': { toBase: 1, baseUnit: 'g' },
  'kg': { toBase: 1000, baseUnit: 'g' },
  'mg': { toBase: 0.001, baseUnit: 'g' },
  'ml': { toBase: 1, baseUnit: 'ml' },
  'l': { toBase: 1000, baseUnit: 'ml' },
  '个': { toBase: 1, baseUnit: '个' },
  '袋': { toBase: 1, baseUnit: '袋' },
  '包': { toBase: 1, baseUnit: '包' },
  '盒': { toBase: 1, baseUnit: '盒' },
  '片': { toBase: 1, baseUnit: '片' },
  '支': { toBase: 1, baseUnit: '支' },
  '罐': { toBase: 1, baseUnit: '罐' },
  '次': { toBase: 1, baseUnit: '次' },
};

export function convertToBaseUnit(quantity: number, unit: string): number {
  const lowerUnit = unit.toLowerCase();
  const conversion = unitConversionRates[lowerUnit] || unitConversionRates[unit];
  if (!conversion) return quantity;
  return quantity * conversion.toBase;
}

export function convertFromBaseUnit(baseQuantity: number, targetUnit: string): number {
  const lowerUnit = targetUnit.toLowerCase();
  const conversion = unitConversionRates[lowerUnit] || unitConversionRates[targetUnit];
  if (!conversion) return baseQuantity;
  return baseQuantity / conversion.toBase;
}

export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const lower1 = unit1.toLowerCase();
  const lower2 = unit2.toLowerCase();
  const conv1 = unitConversionRates[lower1] || unitConversionRates[unit1];
  const conv2 = unitConversionRates[lower2] || unitConversionRates[unit2];
  if (!conv1 || !conv2) return unit1 === unit2;
  return conv1.baseUnit === conv2.baseUnit;
}

export function normalizeUnit(unit: string): string {
  const lowerUnit = unit.toLowerCase();
  if (unitConversionRates[lowerUnit]) return lowerUnit;
  return unit;
}

export interface ConsumptionAnalysis {
  dailyConsumption: number;
  unit: string;
  daysRemaining: number;
  shouldRemind: boolean;
  reminderDate: string | null;
  feedingsAnalyzed: number;
  analysisPeriodDays: number;
}

export function calculateDailyConsumption(
  feedings: Array<{ itemName: string; amount: number; unit: string; recordTime: string }>,
  itemName: string,
  targetUnit: string,
  currentQuantity: number,
  reminderDays: number = 3,
  analysisDays: number = 7
): ConsumptionAnalysis {
  const itemFeedings = feedings.filter((f) => f.itemName === itemName);

  if (itemFeedings.length === 0) {
    return {
      dailyConsumption: 0,
      unit: targetUnit,
      daysRemaining: Infinity,
      shouldRemind: false,
      reminderDate: null,
      feedingsAnalyzed: 0,
      analysisPeriodDays: analysisDays,
    };
  }

  const now = new Date();
  const cutoffDate = new Date(now.getTime() - analysisDays * 24 * 60 * 60 * 1000);

  const recentFeedings = itemFeedings.filter((f) => {
    const feedingDate = parseISO(f.recordTime);
    return isValid(feedingDate) && feedingDate >= cutoffDate;
  });

  if (recentFeedings.length === 0) {
    return {
      dailyConsumption: 0,
      unit: targetUnit,
      daysRemaining: Infinity,
      shouldRemind: false,
      reminderDate: null,
      feedingsAnalyzed: 0,
      analysisPeriodDays: analysisDays,
    };
  }

  const firstFeedingDate = recentFeedings.reduce((earliest, f) => {
    const d = parseISO(f.recordTime);
    return d < earliest ? d : earliest;
  }, now);

  const daysCovered = Math.max(1, differenceInDays(now, firstFeedingDate) + 1);

  const totalConsumedBase = recentFeedings.reduce((sum, f) => {
    if (!areUnitsCompatible(f.unit, targetUnit)) return sum;
    const baseAmount = convertToBaseUnit(f.amount, f.unit);
    return sum + baseAmount;
  }, 0);

  const dailyBase = totalConsumedBase / daysCovered;
  const dailyTarget = convertFromBaseUnit(dailyBase, targetUnit);

  const currentBase = convertToBaseUnit(currentQuantity, targetUnit);
  const daysRemaining = dailyBase > 0 ? currentBase / dailyBase : Infinity;

  const shouldRemind = daysRemaining !== Infinity && daysRemaining <= reminderDays;

  let reminderDate: string | null = null;
  if (shouldRemind && daysRemaining !== Infinity) {
    const reminder = new Date(now.getTime() + (daysRemaining - reminderDays) * 24 * 60 * 60 * 1000);
    reminderDate = format(reminder, 'yyyy-MM-dd');
  }

  return {
    dailyConsumption: Math.round(dailyTarget * 100) / 100,
    unit: targetUnit,
    daysRemaining: daysRemaining === Infinity ? Infinity : Math.round(daysRemaining * 10) / 10,
    shouldRemind,
    reminderDate,
    feedingsAnalyzed: recentFeedings.length,
    analysisPeriodDays: daysCovered,
  };
}
