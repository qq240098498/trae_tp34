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
