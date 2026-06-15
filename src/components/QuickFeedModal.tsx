import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePetStore, type FeedingType, type Pet } from '@/store';
import { getSpeciesEmoji } from '@/utils/helpers';

interface QuickFeedModalProps {
  open: boolean;
  onClose: () => void;
}

const typeOptions: { value: FeedingType; label: string; emoji: string }[] = [
  { value: 'feeding', label: '喂食', emoji: '🍚' },
  { value: 'medicine', label: '喂药', emoji: '💊' },
  { value: 'other', label: '其他', emoji: '📝' },
];

const defaultUnits: Record<FeedingType, string> = {
  feeding: 'g',
  medicine: '片',
  other: '次',
};

export default function QuickFeedModal({ open, onClose }: QuickFeedModalProps) {
  const { pets, addFeeding } = usePetStore();

  const [type, setType] = useState<FeedingType>('feeding');
  const [petId, setPetId] = useState<string>(pets[0]?.id || '');
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState(defaultUnits.feeding);
  const [recordTime, setRecordTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setType('feeding');
      setPetId(pets[0]?.id || '');
      setItemName('');
      setAmount('');
      setUnit(defaultUnits.feeding);
      setRecordTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setNote('');
    }
  }, [open, pets]);

  useEffect(() => {
    setUnit(defaultUnits[type]);
  }, [type]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !amount) return;

    addFeeding({
      petId: petId || undefined,
      type,
      itemName: itemName.trim(),
      amount: parseFloat(amount),
      unit,
      recordTime: format(new Date(recordTime), "yyyy-MM-dd'T'HH:mm:ss"),
      note: note.trim(),
    });

    onClose();
  };

  const petName = (pet: Pet) => (
    <span className="flex items-center gap-1">
      <span>{getSpeciesEmoji(pet.species)}</span>
      <span>{pet.name}</span>
    </span>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">快速打卡</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 rounded-2xl bg-gray-50 p-1.5">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  'flex-1 rounded-xl py-2.5 text-sm font-medium transition-all',
                  type === opt.value
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <span className="mr-1">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              关联宠物
            </label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:bg-white"
            >
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {getSpeciesEmoji(pet.species)} {pet.name}
                </option>
              ))}
            </select>
            {pets.length > 0 && petId && (
              <div className="mt-2 px-1 text-xs text-gray-400">
                {petName(pets.find((p) => p.id === petId)!)}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              物品名称
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="例如：皇家猫粮"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                用量
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                单位
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="g"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              记录时间
            </label>
            <input
              type="datetime-local"
              value={recordTime}
              onChange={(e) => setRecordTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              备注
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选，例如：早餐 / 有点挑食..."
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={!itemName.trim() || !amount}
            className={cn(
              'mt-2 w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-all',
              'bg-gradient-to-r from-primary to-orange-400 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5',
              'disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0'
            )}
          >
            ✨ 确认打卡
          </button>
        </form>
      </div>
    </div>
  );
}
