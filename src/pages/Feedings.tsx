import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePetStore, type FeedingType, type FeedingRecord } from '@/store';
import { formatDateTime, getSpeciesEmoji } from '@/utils/helpers';
import QuickFeedModal from '@/components/QuickFeedModal';

const typeFilterOptions: { value: 'all' | FeedingType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'feeding', label: '🍚 喂食' },
  { value: 'medicine', label: '💊 喂药' },
  { value: 'other', label: '📝 其他' },
];

const typeColors: Record<FeedingType, string> = {
  feeding: '#FF8C42',
  medicine: '#4ECDC4',
  other: '#9CA3AF',
};

const typeBgColors: Record<FeedingType, string> = {
  feeding: 'bg-orange-50',
  medicine: 'bg-teal-50',
  other: 'bg-gray-50',
};

const typeEmojis: Record<FeedingType, string> = {
  feeding: '🍚',
  medicine: '💊',
  other: '📝',
};

const typeLabels: Record<FeedingType, string> = {
  feeding: '喂食',
  medicine: '喂药',
  other: '其他',
};

export default function Feedings() {
  const { feedings, pets, deleteFeeding } = usePetStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | FeedingType>('all');
  const [petFilter, setPetFilter] = useState<string>('all');

  const filteredFeedings = useMemo(() => {
    return feedings
      .filter((f) => {
        if (typeFilter !== 'all' && f.type !== typeFilter) return false;
        if (petFilter !== 'all' && f.petId !== petFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime());
  }, [feedings, typeFilter, petFilter]);

  const getPet = (petId?: string) => pets.find((p) => p.id === petId);

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteFeeding(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-md px-5 py-4">
          <h1 className="text-center text-xl font-bold text-gray-800">
            🍽️ 喂食喂药记录
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-28 pt-5">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30 opacity-75" />
            <button
              onClick={() => setModalOpen(true)}
              className="group relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-400 text-white shadow-xl shadow-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 active:scale-95"
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl">🍽️</span>
                <span className="mt-0.5 text-sm font-bold">立即打卡</span>
              </div>
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-gray-400">
            点击快速记录喂食、喂药等日常护理
          </p>
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {typeFilterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  typeFilter === opt.value
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setPetFilter('all')}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                petFilter === 'all'
                  ? 'bg-secondary text-white shadow-md shadow-secondary/30'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              )}
            >
              🐾 全部宠物
            </button>
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setPetFilter(pet.id)}
                className={cn(
                  'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  petFilter === pet.id
                    ? 'bg-secondary text-white shadow-md shadow-secondary/30'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                )}
              >
                {getSpeciesEmoji(pet.species)} {pet.name}
              </button>
            ))}
          </div>
        </div>

        {filteredFeedings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-16 shadow-sm">
            <div className="mb-4 text-6xl opacity-40">📭</div>
            <p className="mb-1 text-base font-medium text-gray-600">暂无记录</p>
            <p className="mb-5 text-sm text-gray-400">
              点击上方「立即打卡」开始记录吧
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-full bg-gradient-to-r from-primary to-orange-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              ✨ 去打卡
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[22px] top-2 h-[calc(100%-16px)] w-px border-l-2 border-dashed border-gray-200" />

            <div className="space-y-4">
              {filteredFeedings.map((record, index) => (
                <TimelineItem
                  key={record.id}
                  record={record}
                  pet={getPet(record.petId)}
                  index={index}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <QuickFeedModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

interface TimelineItemProps {
  record: FeedingRecord;
  pet: ReturnType<typeof usePetStore.getState>['pets'][number] | undefined;
  index: number;
  onDelete: (id: string) => void;
}

function TimelineItem({ record, pet, index, onDelete }: TimelineItemProps) {
  const dotColor = typeColors[record.type];
  const isEven = index % 2 === 0;

  return (
    <div className="relative flex items-start gap-4 pl-12">
      <div
        className="absolute left-[14px] top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white shadow-md"
        style={{ backgroundColor: dotColor }}
      >
        <span className="text-[10px]">{typeEmojis[record.type]}</span>
      </div>

      <div
        className={cn(
          'relative flex-1 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md',
          typeBgColors[record.type]
        )}
      >
        <button
          onClick={() => onDelete(record.id)}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/80 hover:text-danger"
          title="删除"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>

        <div className="mb-2 flex flex-wrap items-center gap-2 pr-8">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: dotColor }}
          >
            {typeEmojis[record.type]} {typeLabels[record.type]}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {formatDateTime(record.recordTime)}
          </span>
          {pet && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-gray-600">
              {getSpeciesEmoji(pet.species)} {pet.name}
            </span>
          )}
        </div>

        <div className="mb-1.5 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-gray-800">
            {record.itemName}
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {record.amount}
            <span className="ml-0.5 text-xs text-gray-500">{record.unit}</span>
          </span>
        </div>

        {record.note && (
          <p className="text-xs leading-relaxed text-gray-500">{record.note}</p>
        )}
      </div>
    </div>
  );
}
