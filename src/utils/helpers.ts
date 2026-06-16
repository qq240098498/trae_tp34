import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  format,
  parseISO,
  isValid,
} from 'date-fns';
import type { InventoryCategory, PetSpecies, Pet, WeightRecord, FeedingRecommendation } from '@/store';

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

export interface IdealWeightRange {
  min: number;
  max: number;
  ideal: number;
}

export function getIdealWeightRange(species: PetSpecies, breed?: string): IdealWeightRange {
  const ranges: Record<PetSpecies, IdealWeightRange> = {
    cat: { min: 3.5, max: 5.5, ideal: 4.5 },
    dog: { min: 8, max: 25, ideal: 15 },
    rabbit: { min: 1.5, max: 3, ideal: 2.2 },
    bird: { min: 0.03, max: 0.5, ideal: 0.1 },
    fish: { min: 0.05, max: 0.5, ideal: 0.15 },
    other: { min: 1, max: 10, ideal: 5 },
  };

  const base = ranges[species] || ranges.other;

  if (species === 'dog' && breed) {
    const breedLower = breed.toLowerCase();
    if (breedLower.includes('吉娃娃') || breedLower.includes('chihuahua') || breedLower.includes('茶杯')) {
      return { min: 1.5, max: 3, ideal: 2 };
    }
    if (breedLower.includes('柴犬') || breedLower.includes('shiba') || breedLower.includes('柯基') || breedLower.includes('corgi')) {
      return { min: 8, max: 14, ideal: 11 };
    }
    if (breedLower.includes('金毛') || breedLower.includes('golden') || breedLower.includes('拉布拉多') || breedLower.includes('labrador')) {
      return { min: 25, max: 35, ideal: 30 };
    }
    if (breedLower.includes('阿拉斯加') || breedLower.includes('阿拉') || breedLower.includes('哈士奇') || breedLower.includes('husky')) {
      return { min: 20, max: 30, ideal: 25 };
    }
  }

  if (species === 'cat' && breed) {
    const breedLower = breed.toLowerCase();
    if (breedLower.includes('橘猫') || breedLower.includes('加菲')) {
      return { min: 4, max: 7, ideal: 5.5 };
    }
    if (breedLower.includes('布偶') || breedLower.includes('ragdoll') || breedLower.includes('缅因')) {
      return { min: 4.5, max: 9, ideal: 6.5 };
    }
  }

  return base;
}

export function getAgeFactor(species: PetSpecies, birthday: string): number {
  const birthDate = parseISO(birthday);
  if (!isValid(birthDate)) return 1;

  const ageYears = differenceInYears(new Date(), birthDate);
  const ageMonths = differenceInMonths(new Date(), birthDate);

  if (species === 'cat') {
    if (ageMonths < 12) return 1.5;
    if (ageYears >= 7) return 0.9;
    if (ageYears >= 10) return 0.8;
    return 1;
  }
  if (species === 'dog') {
    if (ageMonths < 18) return 1.4;
    if (ageYears >= 7) return 0.85;
    if (ageYears >= 10) return 0.75;
    return 1;
  }
  if (species === 'rabbit') {
    if (ageMonths < 8) return 1.3;
    if (ageYears >= 5) return 0.85;
    return 1;
  }
  return 1;
}

export function calculateFeedingRecommendation(
  pet: Pet,
  weightRecords: WeightRecord[],
  currentDailyAmount?: number
): FeedingRecommendation {
  const idealWeightRange = getIdealWeightRange(pet.species, pet.breed);
  const latestRecord = weightRecords.length > 0
    ? weightRecords[weightRecords.length - 1]
    : null;
  const currentWeight = latestRecord?.weight ?? pet.weight ?? idealWeightRange.ideal;
  const ageFactor = getAgeFactor(pet.species, pet.birthday);

  const idealWeight = idealWeightRange.ideal;
  const weightDiff = currentWeight - idealWeight;
  const weightDiffPercent = (weightDiff / idealWeight) * 100;

  let status: 'underweight' | 'normal' | 'overweight';
  if (weightDiffPercent > 10) {
    status = 'overweight';
  } else if (weightDiffPercent < -10) {
    status = 'underweight';
  } else {
    status = 'normal';
  }

  const baseDailyGramsPerKg = 30;
  const baseDailyAmount = idealWeight * baseDailyGramsPerKg * ageFactor;

  let adjustmentPercent = 0;
  if (status === 'overweight') {
    adjustmentPercent = Math.min(-15, weightDiffPercent / 2);
  } else if (status === 'underweight') {
    adjustmentPercent = Math.max(15, -weightDiffPercent / 2);
  }

  const suggestedDailyAmount = baseDailyAmount * (1 + adjustmentPercent / 100);

  let reason = '体重处于健康范围，建议保持当前喂食量';
  if (status === 'overweight') {
    reason = `体重偏重${Math.abs(weightDiffPercent).toFixed(1)}%，建议减少${Math.abs(adjustmentPercent).toFixed(0)}%粮食`;
  } else if (status === 'underweight') {
    reason = `体重偏轻${Math.abs(weightDiffPercent).toFixed(1)}%，建议增加${Math.abs(adjustmentPercent).toFixed(0)}%粮食`;
  }

  if (ageFactor > 1) {
    reason += `（幼年宠物，需要更多营养）`;
  } else if (ageFactor < 1) {
    reason += `（老年宠物，代谢较慢）`;
  }

  return {
    currentWeight,
    idealWeight,
    weightDiffPercent: Math.round(weightDiffPercent * 10) / 10,
    status,
    suggestedDailyAmount: Math.round(suggestedDailyAmount),
    currentDailyAmount,
    adjustmentPercent: Math.round(adjustmentPercent * 10) / 10,
    ageFactor,
    reason,
  };
}

export function exportWeightReportCSV(
  pet: Pet,
  weightRecords: WeightRecord[]
): string {
  const BOM = '\uFEFF';
  const lines: string[] = [];

  lines.push(`宠物体重健康报告`);
  lines.push(`生成时间: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  lines.push(``);
  lines.push(`宠物信息`);
  lines.push(`姓名,${pet.name}`);
  lines.push(`种类,${getSpeciesName(pet.species)}`);
  lines.push(`品种,${pet.breed || '-'}`);
  lines.push(`生日,${pet.birthday || '-'}`);
  lines.push(`年龄,${calculateAge(pet.birthday)}`);
  lines.push(``);
  lines.push(`体重记录`);
  lines.push(`日期,体重(kg),备注`);

  const sortedRecords = [...weightRecords].sort(
    (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
  );

  sortedRecords.forEach((record) => {
    lines.push(`${record.recordDate},${record.weight},${record.note || ''}`);
  });

  lines.push(``);
  lines.push(`体重趋势分析`);
  if (sortedRecords.length >= 2) {
    const first = sortedRecords[0];
    const last = sortedRecords[sortedRecords.length - 1];
    const diff = last.weight - first.weight;
    const diffPercent = ((diff / first.weight) * 100).toFixed(2);
    const days = differenceInDays(parseISO(last.recordDate), parseISO(first.recordDate));
    lines.push(`起始体重,${first.weight}kg (${first.recordDate})`);
    lines.push(`当前体重,${last.weight}kg (${last.recordDate})`);
    lines.push(`体重变化,${diff >= 0 ? '+' : ''}${diff.toFixed(2)}kg (${diffPercent}%)`);
    lines.push(`记录周期,${days}天`);
  } else if (sortedRecords.length === 1) {
    lines.push(`当前体重,${sortedRecords[0].weight}kg (${sortedRecords[0].recordDate})`);
    lines.push(`提示,记录数据不足，无法进行趋势分析`);
  } else {
    lines.push(`提示,暂无体重记录`);
  }

  const recommendation = calculateFeedingRecommendation(pet, sortedRecords);
  lines.push(``);
  lines.push(`喂食建议`);
  lines.push(`理想体重,${recommendation.idealWeight}kg`);
  lines.push(`体重状态,${recommendation.status === 'normal' ? '正常' : recommendation.status === 'overweight' ? '偏重' : '偏轻'}`);
  lines.push(`体重差异,${recommendation.weightDiffPercent >= 0 ? '+' : ''}${recommendation.weightDiffPercent}%`);
  lines.push(`建议每日喂食量,${recommendation.suggestedDailyAmount}g`);
  lines.push(`建议说明,${recommendation.reason}`);

  lines.push(``);
  lines.push(`--- 本报告由宠管家自动生成 ---`);

  return BOM + lines.join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
