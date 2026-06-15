import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  usePetStore,
  type Pet,
  type TransitionReaction,
  type FoodTransitionPlan,
} from '@/store';
import { getSpeciesEmoji } from '@/utils/helpers';

interface FoodTransitionModalProps {
  open: boolean;
  onClose: () => void;
}

const reactionOptions: { value: TransitionReaction; label: string; emoji: string; color: string }[] = [
  { value: 'normal', label: '正常', emoji: '✅', color: 'bg-green-100 text-green-700 ring-green-200' },
  { value: 'soft_stool', label: '软便', emoji: '💩', color: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  { value: 'vomit', label: '呕吐', emoji: '🤮', color: 'bg-red-100 text-red-700 ring-red-200' },
];

const reactionBgColors: Record<TransitionReaction, string> = {
  normal: 'bg-green-50',
  soft_stool: 'bg-yellow-50',
  vomit: 'bg-red-50',
};

const reactionDotColors: Record<TransitionReaction, string> = {
  normal: 'bg-green-500',
  soft_stool: 'bg-yellow-500',
  vomit: 'bg-red-500',
};

export default function FoodTransitionModal({ open, onClose }: FoodTransitionModalProps) {
  const {
    pets,
    inventory,
    foodTransitionPlans,
    createFoodTransitionPlan,
    recordTransitionReaction,
    cancelFoodTransitionPlan,
    completeFoodTransitionPlan,
    deleteFoodTransitionPlan,
    getActiveTransitionPlan,
    getCurrentTransitionDay,
  } = usePetStore();

  const [mode, setMode] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedPlan, setSelectedPlan] = useState<FoodTransitionPlan | null>(null);

  const [petId, setPetId] = useState<string>(pets[0]?.id || '');
  const [oldFoodName, setOldFoodName] = useState('');
  const [newFoodName, setNewFoodName] = useState('');
  const [dailyAmount, setDailyAmount] = useState<string>('');
  const [unit, setUnit] = useState('g');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const foodItems = useMemo(
    () => inventory.filter((i) => i.category === 'food'),
    [inventory]
  );

  const activePlans = useMemo(
    () => foodTransitionPlans.filter((p) => p.status === 'active'),
    [foodTransitionPlans]
  );

  const historyPlans = useMemo(
    () =>
      foodTransitionPlans
        .filter((p) => p.status !== 'active')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [foodTransitionPlans]
  );

  useEffect(() => {
    if (open) {
      setMode('list');
      setSelectedPlan(null);
      setPetId(pets[0]?.id || '');
      setOldFoodName('');
      setNewFoodName('');
      setDailyAmount('');
      setUnit('g');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setNote('');
    }
  }, [open, pets]);

  if (!open) return null;

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldFoodName.trim() || !newFoodName.trim() || !dailyAmount) return;

    createFoodTransitionPlan({
      petId,
      oldFoodName: oldFoodName.trim(),
      newFoodName: newFoodName.trim(),
      dailyAmount: parseFloat(dailyAmount),
      unit,
      startDate,
      note: note.trim(),
    });

    setMode('list');
  };

  const handleRecordReaction = (
    planId: string,
    day: number,
    reaction: TransitionReaction,
    reactionNote?: string
  ) => {
    recordTransitionReaction(planId, day, reaction, reactionNote);
    const updatedPlans = usePetStore.getState().foodTransitionPlans;
    const updated = updatedPlans.find((p) => p.id === planId);
    if (updated) {
      setSelectedPlan(updated);
    }
  };

  const handleComplete = (planId: string) => {
    if (confirm('确定要标记此换粮计划为完成吗？')) {
      completeFoodTransitionPlan(planId);
      setMode('list');
      setSelectedPlan(null);
    }
  };

  const handleCancel = (planId: string) => {
    if (confirm('确定要取消此换粮计划吗？')) {
      cancelFoodTransitionPlan(planId);
      setMode('list');
      setSelectedPlan(null);
    }
  };

  const handleDelete = (planId: string) => {
    if (confirm('确定要删除此换粮计划吗？此操作不可恢复。')) {
      deleteFoodTransitionPlan(planId);
    }
  };

  const getPet = (petId: string) => pets.find((p) => p.id === petId);

  const petName = (pet: Pet) => (
    <span className="flex items-center gap-1">
      <span>{getSpeciesEmoji(pet.species)}</span>
      <span>{pet.name}</span>
    </span>
  );

  const renderHeader = () => {
    if (mode === 'create') {
      return (
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => setMode('list')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-gray-800">创建换粮计划</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      );
    }

    if (mode === 'detail' && selectedPlan) {
      return (
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => {
              setMode('list');
              setSelectedPlan(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-gray-800">换粮详情</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">🔄 换粮过渡计划</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    );
  };

  const renderList = () => (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <h3 className="font-semibold text-gray-800">为什么需要7日换粮法？</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          宠物肠胃敏感，突然换粮容易引起腹泻、呕吐等不适。
          科学的7日渐进式换粮可以帮助宠物肠胃逐步适应新粮，
          最大限度减少肠胃应激反应。
        </p>
      </div>

      <button
        onClick={() => setMode('create')}
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-orange-400 py-4 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5"
      >
        ✨ 开始新的换粮计划
      </button>

      {activePlans.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">进行中</h3>
          <div className="space-y-3">
            {activePlans.map((plan) => {
              const pet = getPet(plan.petId);
              const currentDay = getCurrentTransitionDay(plan);
              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setMode('detail');
                  }}
                  className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm ring-1 ring-orange-100 transition hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pet && <span className="text-xl">{getSpeciesEmoji(pet.species)}</span>}
                      <span className="font-semibold text-gray-800">{pet?.name || '未知宠物'}</span>
                    </div>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600">
                      第 {currentDay} 天
                    </span>
                  </div>
                  <div className="mb-2 text-sm text-gray-600">
                    <span className="text-gray-400">{plan.oldFoodName}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium text-gray-700">{plan.newFoodName}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all"
                      style={{ width: `${(currentDay / 7) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {format(parseISO(plan.startDate), 'MM月dd日')} 开始
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {historyPlans.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">历史记录</h3>
          <div className="space-y-3">
            {historyPlans.map((plan) => {
              const pet = getPet(plan.petId);
              const hasProblem = plan.days.some(
                (d) => d.reaction === 'soft_stool' || d.reaction === 'vomit'
              );
              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setMode('detail');
                  }}
                  className="cursor-pointer rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100 transition hover:bg-gray-100"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pet && <span className="text-lg">{getSpeciesEmoji(pet.species)}</span>}
                      <span className="font-medium text-gray-700">{pet?.name || '未知宠物'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasProblem && (
                        <span className="text-xs text-yellow-600" title="曾出现不良反应">
                          ⚠️
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          plan.status === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-200 text-gray-600'
                        )}
                      >
                        {plan.status === 'completed' ? '已完成' : '已取消'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {plan.oldFoodName} → {plan.newFoodName}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {format(parseISO(plan.startDate), 'yyyy年MM月dd日')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activePlans.length === 0 && historyPlans.length === 0 && (
        <div className="rounded-2xl bg-white py-12 text-center shadow-sm">
          <div className="mb-3 text-5xl opacity-40">🔄</div>
          <p className="mb-1 text-base font-medium text-gray-600">暂无换粮记录</p>
          <p className="text-sm text-gray-400">点击上方按钮开始科学换粮</p>
        </div>
      )}
    </div>
  );

  const renderCreateForm = () => (
    <form onSubmit={handleCreatePlan} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          选择宠物
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
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          旧粮名称
        </label>
        <div className="relative">
          <input
            type="text"
            value={oldFoodName}
            onChange={(e) => setOldFoodName(e.target.value)}
            placeholder="例如：皇家猫粮"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-24 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white"
            list="old-food-list"
          />
          <datalist id="old-food-list">
            {foodItems.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
          {foodItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (foodItems[0]) setOldFoodName(foodItems[0].name);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-white px-3 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              选择库存
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          新粮名称
        </label>
        <div className="relative">
          <input
            type="text"
            value={newFoodName}
            onChange={(e) => setNewFoodName(e.target.value)}
            placeholder="例如：渴望六种鱼"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-24 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white"
            list="new-food-list"
          />
          <datalist id="new-food-list">
            {foodItems.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
          {foodItems.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (foodItems[1]) setNewFoodName(foodItems[1].name);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-white px-3 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              选择库存
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            每日总喂食量
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={dailyAmount}
            onChange={(e) => setDailyAmount(e.target.value)}
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
          开始日期
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
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
          placeholder="可选，例如：肠胃敏感，注意观察..."
          rows={2}
          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary focus:bg-white"
        />
      </div>

      <div className="rounded-2xl bg-blue-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h4 className="font-semibold text-gray-800">7日换粮计划预览</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>第1天</span>
            <span>新粮20% + 旧粮80%</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>第2天</span>
            <span>新粮30% + 旧粮70%</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>第3天</span>
            <span>新粮40% + 旧粮60%</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>第4天</span>
            <span>新粮50% + 旧粮50%</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>第5天</span>
            <span>新粮60% + 旧粮40%</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>第6天</span>
            <span>新粮80% + 旧粮20%</span>
          </div>
          <div className="flex justify-between font-medium text-gray-800">
            <span>第7天</span>
            <span>新粮100%</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!oldFoodName.trim() || !newFoodName.trim() || !dailyAmount}
        className={cn(
          'mt-2 w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-all',
          'bg-gradient-to-r from-primary to-orange-400 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5',
          'disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0'
        )}
      >
        ✨ 确认创建计划
      </button>
    </form>
  );

  const renderDetail = () => {
    if (!selectedPlan) return null;

    const pet = getPet(selectedPlan.petId);
    const currentDay =
      selectedPlan.status === 'active' ? getCurrentTransitionDay(selectedPlan) : 7;
    const isTodayRecorded = selectedPlan.days[currentDay - 1]?.reaction !== undefined;

    const getDayAmount = (percent: number) => {
      return ((selectedPlan.dailyAmount * percent) / 100).toFixed(1);
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4">
          <div className="mb-3 flex items-center gap-3">
            {pet && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                {getSpeciesEmoji(pet.species)}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-800">{pet?.name || '未知宠物'}</h3>
              <p className="text-sm text-gray-500">
                {selectedPlan.oldFoodName} → {selectedPlan.newFoodName}
              </p>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">每日总喂食量</span>
            <span className="font-medium text-gray-700">
              {selectedPlan.dailyAmount} {selectedPlan.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">开始日期</span>
            <span className="font-medium text-gray-700">
              {format(parseISO(selectedPlan.startDate), 'yyyy年MM月dd日')}
            </span>
          </div>
          {selectedPlan.note && (
            <div className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-gray-600">
              📝 {selectedPlan.note}
            </div>
          )}
        </div>

        {selectedPlan.status === 'active' && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-orange-100">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">📅 今日进度</h4>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                第 {currentDay} 天
              </span>
            </div>
            <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all"
                style={{ width: `${(currentDay / 7) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-orange-50 p-3 text-center">
                <div className="text-xs text-gray-500">新粮</div>
                <div className="text-lg font-bold text-orange-600">
                  {selectedPlan.days[currentDay - 1]?.newFoodPercent}%
                </div>
                <div className="text-xs text-gray-500">
                  {getDayAmount(selectedPlan.days[currentDay - 1]?.newFoodPercent || 0)}{' '}
                  {selectedPlan.unit}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <div className="text-xs text-gray-500">旧粮</div>
                <div className="text-lg font-bold text-gray-600">
                  {selectedPlan.days[currentDay - 1]?.oldFoodPercent}%
                </div>
                <div className="text-xs text-gray-500">
                  {getDayAmount(selectedPlan.days[currentDay - 1]?.oldFoodPercent || 0)}{' '}
                  {selectedPlan.unit}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-3 font-semibold text-gray-800">📊 7日换粮进度</h4>
          <div className="space-y-2">
            {selectedPlan.days.map((day, index) => {
              const isPastOrToday =
                selectedPlan.status !== 'active'
                  ? true
                  : index + 1 <= currentDay;
              const isCurrent = index + 1 === currentDay;
              const isRecorded = day.reaction !== undefined;
              const dayDate = addDays(parseISO(selectedPlan.startDate), index);

              return (
                <div
                  key={day.day}
                  className={cn(
                    'rounded-xl p-4 transition-all',
                    isRecorded && day.reaction
                      ? reactionBgColors[day.reaction]
                      : isCurrent
                        ? 'bg-orange-50 ring-2 ring-orange-200'
                        : 'bg-white shadow-sm'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                          isRecorded
                            ? day.reaction
                              ? `${reactionDotColors[day.reaction]} text-white`
                              : 'bg-gray-200 text-gray-600'
                            : isCurrent
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {day.day}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          新粮{day.newFoodPercent}% + 旧粮{day.oldFoodPercent}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(dayDate, 'MM月dd日')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {getDayAmount(day.newFoodPercent)} +{' '}
                        {getDayAmount(day.oldFoodPercent)} {selectedPlan.unit}
                      </div>
                    </div>
                  </div>

                  {isPastOrToday && (
                    <div className="mt-3">
                      {isRecorded && day.reaction ? (
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
                                reactionOptions.find(
                                  (o) => o.value === day.reaction
                                )?.color
                              )}
                            >
                              {reactionOptions.find((o) => o.value === day.reaction)?.emoji}{' '}
                              {reactionOptions.find((o) => o.value === day.reaction)?.label}
                            </span>
                            {day.recordedAt && (
                              <span className="text-xs text-gray-400">
                                {format(parseISO(day.recordedAt), 'HH:mm')} 记录
                              </span>
                            )}
                          </div>
                          {day.note && (
                            <p className="text-sm text-gray-600">📝 {day.note}</p>
                          )}
                        </div>
                      ) : selectedPlan.status === 'active' ? (
                        <ReactionRecorder
                          planId={selectedPlan.id}
                          day={day.day}
                          onRecord={handleRecordReaction}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedPlan.status === 'active' && (
          <div className="space-y-3 pt-2">
            {currentDay >= 7 && isTodayRecorded && (
              <button
                onClick={() => handleComplete(selectedPlan.id)}
                className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-500/30 transition hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5"
              >
                🎉 换粮完成，标记结束
              </button>
            )}
            <button
              onClick={() => handleCancel(selectedPlan.id)}
              className="w-full rounded-2xl bg-gray-100 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
            >
              取消换粮计划
            </button>
          </div>
        )}

        {selectedPlan.status !== 'active' && (
          <div className="space-y-3 pt-2">
            <div
              className={cn(
                'rounded-2xl p-4 text-center',
                selectedPlan.status === 'completed'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-600'
              )}
            >
              {selectedPlan.status === 'completed' ? (
                <div>
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="font-semibold">换粮完成！</div>
                  <div className="text-sm opacity-80">恭喜成功过渡到新粮</div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="font-semibold">换粮已取消</div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h5 className="mb-3 font-semibold text-gray-700">📈 本次换粮反应总结</h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                {reactionOptions.map((opt) => {
                  const count = selectedPlan.days.filter(
                    (d) => d.reaction === opt.value
                  ).length;
                  return (
                    <div key={opt.value} className="rounded-xl bg-gray-50 p-3">
                      <div className="text-2xl mb-1">{opt.emoji}</div>
                      <div className="text-lg font-bold text-gray-800">{count}</div>
                      <div className="text-xs text-gray-500">{opt.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handleDelete(selectedPlan.id)}
              className="w-full rounded-2xl bg-red-50 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              删除此记录
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 sm:h-[80vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {renderHeader()}
        {mode === 'list' && renderList()}
        {mode === 'create' && renderCreateForm()}
        {mode === 'detail' && renderDetail()}
      </div>
    </div>
  );
}

interface ReactionRecorderProps {
  planId: string;
  day: number;
  onRecord: (
    planId: string,
    day: number,
    reaction: TransitionReaction,
    note?: string
  ) => void;
}

function ReactionRecorder({ planId, day, onRecord }: ReactionRecorderProps) {
  const [selectedReaction, setSelectedReaction] = useState<TransitionReaction | null>(null);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!selectedReaction) return;
    onRecord(planId, day, selectedReaction, note.trim() || undefined);
    setSelectedReaction(null);
    setNote('');
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-500">记录今日反应</div>
      <div className="flex gap-2">
        {reactionOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelectedReaction(opt.value)}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-medium transition-all ring-1',
              selectedReaction === opt.value
                ? opt.color + ' ring-2'
                : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100'
            )}
          >
            <span className="mr-1">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
      {selectedReaction && (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="可选，记录详细情况..."
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-primary"
          />
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            确认记录
          </button>
        </div>
      )}
    </div>
  );
}
