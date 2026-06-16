import { useState, useMemo } from 'react';
import { Plus, Download, Trash2, Scale, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { usePetStore, type Pet, type WeightRecord, type FeedingRecommendation } from '@/store';
import {
  getSpeciesEmoji,
  getSpeciesName,
  calculateAge,
  calculateFeedingRecommendation,
  getIdealWeightRange,
  exportWeightReportCSV,
  downloadCSV,
} from '@/utils/helpers';
import { cn } from '@/lib/utils';
import WeightChart from '@/components/WeightChart';
import WeightRecordModal, { type WeightRecordFormData } from '@/components/WeightRecordModal';
import { format, parseISO } from 'date-fns';

export default function WeightTracking() {
  const { pets, weightRecords, addWeightRecord, deleteWeightRecord, getWeightRecordsByPet } = usePetStore();
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const [modalOpen, setModalOpen] = useState(false);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId),
    [pets, selectedPetId]
  );

  const petWeightRecords = useMemo(
    () => (selectedPetId ? getWeightRecordsByPet(selectedPetId) : []),
    [selectedPetId, getWeightRecordsByPet]
  );

  const recommendation = useMemo<FeedingRecommendation | null>(() => {
    if (!selectedPet) return null;
    return calculateFeedingRecommendation(selectedPet, petWeightRecords);
  }, [selectedPet, petWeightRecords]);

  const idealWeightRange = useMemo(
    () => selectedPet ? getIdealWeightRange(selectedPet.species, selectedPet.breed) : null,
    [selectedPet]
  );

  const handleAddRecord = (data: WeightRecordFormData) => {
    addWeightRecord({
      petId: data.petId,
      weight: data.weight,
      recordDate: data.recordDate,
      note: data.note || undefined,
    });
    setModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('确定要删除这条体重记录吗？')) {
      deleteWeightRecord(id);
    }
  };

  const handleExportReport = () => {
    if (!selectedPet) return;
    const csv = exportWeightReportCSV(selectedPet, petWeightRecords);
    const filename = `${selectedPet.name}_体重报告_${format(new Date(), 'yyyyMMdd')}.csv`;
    downloadCSV(csv, filename);
  };

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-10 shadow-md">
          <div className="text-6xl mb-4">🐾</div>
          <h3 className="text-xl font-display font-bold text-gray-800 mb-2">还没有宠物档案</h3>
          <p className="text-gray-500">请先添加宠物档案，再进行体重管理</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-800">
              ⚖️ 体重与食量管理
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              记录宠物体重变化，科学管理每日喂食量
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportReport}
              disabled={!selectedPet}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              导出报告
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-md shadow-primary/20 active:scale-95"
            >
              <Plus size={20} strokeWidth={2.5} />
              记录体重
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-5 mb-6">
          <p className="text-sm font-medium text-gray-600 mb-3">选择宠物</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                  selectedPetId === pet.id
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary ring-2 ring-primary/30 shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                <span className="text-xl">{pet.avatar || getSpeciesEmoji(pet.species)}</span>
                <span>{pet.name}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedPet && recommendation && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <PetInfoCard pet={selectedPet} recommendation={recommendation} idealWeightRange={idealWeightRange!} />
              <FeedingAdviceCard recommendation={recommendation} />
              <WeightSummaryCard records={petWeightRecords} recommendation={recommendation} />
            </div>

            <div className="mb-6">
              <WeightChart records={petWeightRecords} idealWeight={idealWeightRange?.ideal} />
            </div>

            <WeightRecordsList
              records={petWeightRecords}
              onDelete={handleDeleteRecord}
            />
          </>
        )}
      </div>

      <WeightRecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddRecord}
        pets={pets}
        defaultPetId={selectedPetId}
      />
    </div>
  );
}

function PetInfoCard({
  pet,
  recommendation,
  idealWeightRange,
}: {
  pet: Pet;
  recommendation: FeedingRecommendation;
  idealWeightRange: ReturnType<typeof getIdealWeightRange>;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-white to-teal-50 p-5 shadow-md border border-white">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-4xl shadow-sm">
          {pet.avatar || getSpeciesEmoji(pet.species)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl text-gray-800 truncate">{pet.name}</h3>
          <p className="text-sm text-gray-500">
            {getSpeciesName(pet.species)} {pet.breed && `· ${pet.breed}`}
          </p>
          {pet.birthday && (
            <p className="text-xs text-gray-400 mt-1">
              📅 {calculateAge(pet.birthday)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-xs text-gray-500">当前体重</p>
          <p className="mt-1 font-display text-xl text-gray-800">{recommendation.currentWeight} kg</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-xs text-gray-500">理想体重</p>
          <p className="mt-1 font-display text-xl text-success">{recommendation.idealWeight} kg</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        健康范围：{idealWeightRange.min} - {idealWeightRange.max} kg
      </p>
    </div>
  );
}

function FeedingAdviceCard({ recommendation }: { recommendation: FeedingRecommendation }) {
  const statusConfig = {
    overweight: {
      icon: TrendingUp,
      iconBg: 'bg-red-100',
      iconColor: 'text-danger',
      label: '体重偏重',
      badgeBg: 'bg-danger/15',
      badgeText: 'text-danger',
      bgGradient: 'from-red-50 via-white to-red-50',
    },
    underweight: {
      icon: TrendingDown,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-warning',
      label: '体重偏轻',
      badgeBg: 'bg-warning/15',
      badgeText: 'text-warning',
      bgGradient: 'from-yellow-50 via-white to-yellow-50',
    },
    normal: {
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-success',
      label: '体重正常',
      badgeBg: 'bg-success/15',
      badgeText: 'text-success',
      bgGradient: 'from-green-50 via-white to-green-50',
    },
  };

  const config = statusConfig[recommendation.status];
  const StatusIcon = config.icon;

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br p-5 shadow-md border border-white', config.bgGradient)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-gray-800 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          喂食建议
        </h3>
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium', config.badgeBg, config.badgeText)}>
          {config.label}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-4">
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', config.iconBg)}>
          <StatusIcon className={cn('h-5 w-5', config.iconColor)} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">
            {recommendation.weightDiffPercent >= 0 ? '+' : ''}{recommendation.weightDiffPercent}%
          </p>
          <p className="text-xs text-gray-500 mt-0.5">相比理想体重</p>
        </div>
      </div>

      <div className="rounded-xl bg-white/80 p-4 mb-4">
        <p className="text-xs text-gray-500 mb-1">建议每日喂食量</p>
        <p className="font-display text-2xl text-gray-800">
          {recommendation.suggestedDailyAmount}
          <span className="text-sm font-normal text-gray-500 ml-1">g/天</span>
        </p>
      </div>

      <div className="rounded-xl bg-white/60 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className={cn('h-4 w-4 flex-shrink-0 mt-0.5', config.iconColor)} />
          <p className="text-xs leading-relaxed text-gray-600">{recommendation.reason}</p>
        </div>
      </div>
    </div>
  );
}

function WeightSummaryCard({
  records,
  recommendation,
}: {
  records: WeightRecord[];
  recommendation: FeedingRecommendation;
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 p-5 shadow-md border border-white flex flex-col items-center justify-center">
        <Scale className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500 text-center">暂无体重记录</p>
        <p className="text-xs text-gray-400 mt-1 text-center">定期测量体重，跟踪健康状态</p>
      </div>
    );
  }

  const sorted = [...records].sort(
    (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalDiff = last.weight - first.weight;
  const totalDiffPercent = ((totalDiff / first.weight) * 100).toFixed(1);
  const recordsCount = sorted.length;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-50 via-white to-orange-50 p-5 shadow-md border border-white">
      <h3 className="font-display text-lg text-gray-800 mb-4">📊 数据概览</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-xs text-gray-500">记录次数</p>
          <p className="mt-1 font-display text-xl text-gray-800">{recordsCount}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3">
          <p className="text-xs text-gray-500">年龄系数</p>
          <p className="mt-1 font-display text-xl text-gray-800">×{recommendation.ageFactor}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white/80 p-4">
        <p className="text-xs text-gray-500 mb-2">总体重变化</p>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            'font-display text-2xl',
            totalDiff > 0 ? 'text-danger' : totalDiff < 0 ? 'text-success' : 'text-gray-800'
          )}>
            {totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(2)} kg
          </span>
          <span className={cn(
            'text-sm font-medium',
            totalDiff > 0 ? 'text-danger/70' : totalDiff < 0 ? 'text-success/70' : 'text-gray-500'
          )}>
            ({totalDiff > 0 ? '+' : ''}{totalDiffPercent}%)
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {format(parseISO(first.recordDate), 'yyyy-MM-dd')} → {format(parseISO(last.recordDate), 'yyyy-MM-dd')}
        </p>
      </div>
    </div>
  );
}

function WeightRecordsList({
  records,
  onDelete,
}: {
  records: WeightRecord[];
  onDelete: (id: string) => void;
}) {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
  );

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-display text-lg text-gray-800">📝 体重记录</h3>
        <span className="text-xs text-gray-400">{records.length} 条记录</span>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-5xl mb-3 opacity-30">⚖️</div>
          <p className="text-sm text-gray-400">暂无体重记录</p>
          <p className="text-xs text-gray-300 mt-1">点击「记录体重」开始追踪吧</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {sortedRecords.map((record, index) => {
            const nextRecord = sortedRecords[index + 1];
            const diff = nextRecord ? record.weight - nextRecord.weight : null;
            const diffPercent = diff !== null && nextRecord
              ? ((diff / nextRecord.weight) * 100).toFixed(1)
              : null;

            return (
              <div
                key={record.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15">
                  <Scale className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-xl text-gray-800">
                      {record.weight}
                      <span className="text-sm font-normal text-gray-400 ml-0.5">kg</span>
                    </span>
                    {diff !== null && diffPercent !== null && (
                      <span className={cn(
                        'text-xs font-medium',
                        diff > 0 ? 'text-danger' : diff < 0 ? 'text-success' : 'text-gray-400'
                      )}>
                        {diff > 0 ? '↑' : diff < 0 ? '↓' : '→'}
                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}kg
                        ({diff > 0 ? '+' : ''}{diffPercent}%)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {format(parseISO(record.recordDate), 'yyyy-MM-dd')}
                    </span>
                    {record.note && (
                      <span className="text-xs text-gray-500 truncate">· {record.note}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDelete(record.id)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-danger/10 hover:text-danger transition-colors"
                  title="删除记录"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
