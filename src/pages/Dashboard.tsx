import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cat,
  Package,
  Utensils,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { usePetStore, type InventoryItem } from '@/store';
import { formatDate, getCategoryIcon } from '@/utils/helpers';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { pets, inventory, feedings, getLowStockItems, getStockStatus } =
    usePetStore();

  const today = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => {
    const petCount = pets.length;
    const categoryCount = new Set(inventory.map((i) => i.category)).size;
    const lowStockItems = getLowStockItems();
    const warningCount = lowStockItems.filter(
      (item) => item.currentQuantity <= item.minThreshold
    ).length;
    const todayFeedingCount = feedings.filter((f) => {
      const feedingDate = formatDate(f.recordTime);
      return feedingDate === today;
    }).length;

    return {
      petCount,
      categoryCount,
      warningCount,
      todayFeedingCount,
    };
  }, [pets, inventory, feedings, getLowStockItems, today]);

  const lowStockItems = useMemo(() => getLowStockItems(), [getLowStockItems]);

  const statCards = [
    {
      label: '宠物总数',
      value: stats.petCount,
      icon: Cat,
      bgColor: 'from-secondary/20',
      iconBg: 'bg-secondary/30',
      textColor: 'text-secondary',
    },
    {
      label: '用品种类',
      value: stats.categoryCount,
      icon: Package,
      bgColor: 'from-primary/20',
      iconBg: 'bg-primary/30',
      textColor: 'text-primary',
    },
    {
      label: '库存预警',
      value: stats.warningCount,
      icon: LayoutDashboard,
      bgColor: 'from-danger/20',
      iconBg: 'bg-danger/30',
      textColor: 'text-danger',
      highlight: true,
    },
    {
      label: '今日喂食',
      value: stats.todayFeedingCount,
      icon: Utensils,
      bgColor: 'from-warning/20',
      iconBg: 'bg-warning/30',
      textColor: 'text-warning',
    },
  ];

  const quickActions = [
    {
      label: '添加宠物',
      icon: Plus,
      gradient: 'from-primary to-orange-400',
      onClick: () => navigate('/pets'),
    },
    {
      label: '录入采购',
      icon: ArrowDownToLine,
      gradient: 'from-secondary to-teal-400',
      onClick: () => navigate('/inventory'),
    },
    {
      label: '消耗出库',
      icon: ArrowUpFromLine,
      gradient: 'from-warning to-yellow-400',
      onClick: () => navigate('/inventory'),
    },
    {
      label: '快速喂食',
      icon: Clock,
      gradient: 'from-success to-green-400',
      onClick: () => navigate('/feedings'),
    },
  ];

  function getWarningCardStyle(item: InventoryItem) {
    const status = getStockStatus(item);
    if (status === 'low') {
      return {
        borderColor: 'border-danger/40',
        bgColor: 'bg-danger/10',
        badgeBg: 'bg-danger',
        badgeText: '需要补货',
        progressColor: 'bg-danger',
        pulse: true,
      };
    }
    return {
      borderColor: 'border-warning/40',
      bgColor: 'bg-warning/10',
      badgeBg: 'bg-warning',
      badgeText: '即将不足',
      progressColor: 'bg-warning',
      pulse: status === 'warning',
    };
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-primary/15 via-orange-50 to-secondary/15 border-2 border-white p-6 md:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-gray-800">
              欢迎回来！🐾
            </h1>
            <p className="mt-2 text-gray-600">
              今天是美好的一天，来看看你的毛孩子们吧～
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-medium text-gray-700">
              {format(new Date(), 'yyyy年MM月dd日 EEEE')}
            </span>
          </div>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={cn(
                'rounded-2xl p-5 shadow-md border-2 border-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300',
                card.highlight
                  ? 'bg-gradient-to-br from-danger/20 via-danger/10 to-danger/5'
                  : `bg-gradient-to-br ${card.bgColor} via-white to-white`
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p
                    className={cn(
                      'mt-2 font-display text-3xl md:text-4xl',
                      card.highlight ? 'text-danger' : card.textColor
                    )}
                  >
                    {card.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl',
                    card.iconBg
                  )}
                >
                  <card.icon className={cn('h-6 w-6', card.textColor)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-xl md:text-2xl text-gray-800">
            ⚠️ 库存预警
          </h2>
          {lowStockItems.length > 0 && (
            <span className="rounded-full bg-danger/20 px-3 py-1 text-xs font-medium text-danger">
              {lowStockItems.length} 项
            </span>
          )}
        </div>

        {lowStockItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-success/30 bg-success/5 p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-gray-500">太棒了，所有物品库存充足！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {lowStockItems.map((item) => {
              const style = getWarningCardStyle(item);
              const progress = Math.min(
                (item.currentQuantity / (item.minThreshold * 2)) * 100,
                100
              );
              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-2xl p-5 shadow-md border-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300',
                    style.bgColor,
                    style.borderColor,
                    style.pulse && 'animate-pulse-slow'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-2xl">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {item.currentQuantity}
                          {item.unit} / 阈值 {item.minThreshold}
                          {item.unit}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm',
                        style.badgeBg
                      )}
                    >
                      {style.badgeText}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-white/60">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          style.progressColor
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>
                        剩余 {item.currentQuantity}
                        {item.unit}
                      </span>
                      <span>
                        建议 ≥ {Math.ceil(item.minThreshold * 1.5)}
                        {item.unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl md:text-2xl text-gray-800">
          ⚡ 快捷操作
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="group flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-white bg-white p-6 md:p-8 shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
            >
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110',
                  action.gradient
                )}
              >
                <action.icon className="h-8 w-8" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-primary transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
