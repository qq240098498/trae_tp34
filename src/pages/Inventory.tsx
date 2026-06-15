import { useState, useMemo } from 'react';
import {
  Plus,
  Package,
  LogIn,
  LogOut,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
} from 'lucide-react';
import {
  usePetStore,
  type InventoryItem,
  type InventoryCategory,
} from '@/types';
import {
  getCategoryIcon,
  getCategoryName,
  getStockStatus,
  formatDate,
  type StockStatus,
} from '@/utils/helpers';
import { cn } from '@/lib/utils';

const categories: { value: InventoryCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📦' },
  { value: 'food', label: '主粮', icon: '🥣' },
  { value: 'can', label: '罐头', icon: '🥫' },
  { value: 'snack', label: '零食', icon: '🍖' },
  { value: 'litter', label: '猫砂', icon: '🧻' },
  { value: 'pad', label: '尿垫', icon: '🛡️' },
  { value: 'dewormer', label: '驱虫药', icon: '💊' },
  { value: 'other', label: '其他', icon: '📦' },
];

type ModalType =
  | null
  | 'add'
  | 'edit'
  | 'purchase'
  | 'usage';

interface ModalState {
  type: ModalType;
  item?: InventoryItem;
}

interface AddFormData {
  name: string;
  category: InventoryCategory;
  currentQuantity: number;
  unit: string;
  minThreshold: number;
  lastPurchaseAmount: number;
  unitPrice: number;
  note: string;
}

const emptyAddForm: AddFormData = {
  name: '',
  category: 'food',
  currentQuantity: 0,
  unit: '袋',
  minThreshold: 0,
  lastPurchaseAmount: 0,
  unitPrice: 0,
  note: '',
};

function getStatusConfig(status: StockStatus) {
  switch (status) {
    case 'normal':
      return {
        label: '🟢库存充足',
        labelClass: 'text-success',
        barClass: 'bg-success',
        borderClass: '',
        badgeClass: 'bg-success/10 text-success',
      };
    case 'warning':
      return {
        label: '🟡即将不足',
        labelClass: 'text-warning',
        barClass: 'bg-warning',
        borderClass: '',
        badgeClass: 'bg-warning/10 text-warning',
      };
    case 'low':
      return {
        label: '🔴需要补货',
        labelClass: 'text-danger',
        barClass: 'bg-danger',
        borderClass: 'border-danger',
        badgeClass: 'bg-danger/10 text-danger',
      };
  }
}

function calculateProgressWidth(item: InventoryItem, status: StockStatus) {
  if (status === 'normal') return 100;
  const ratio = item.currentQuantity / Math.max(1, item.minThreshold);
  return Math.min(100, Math.max(5, ratio * 66.67));
}

export default function Inventory() {
  const {
    inventory,
    addInventory,
    updateInventory,
    deleteInventory,
    recordPurchase,
    recordUsage,
    getStockStatus: getStoreStockStatus,
  } = usePetStore();

  const [activeCategory, setActiveCategory] = useState<InventoryCategory | 'all'>('all');

  const [modal, setModal] = useState<ModalState>({ type: null });
  const [addForm, setAddForm] = useState<AddFormData>({ ...emptyAddForm });

  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseNote, setPurchaseNote] = useState<string>('');

  const [usageQuantity, setUsageQuantity] = useState<number>(1);
  const [usageNote, setUsageNote] = useState<string>('');

  const filteredInventory = useMemo(() => {
    if (activeCategory === 'all') return inventory;
    return inventory.filter((item) => item.category === activeCategory);
  }, [inventory, activeCategory]);

  const openAddModal = () => {
    setAddForm({ ...emptyAddForm });
    setModal({ type: 'add' });
  };

  const openEditModal = (item: InventoryItem) => {
    setAddForm({
      name: item.name,
      category: item.category,
      currentQuantity: item.currentQuantity,
      unit: item.unit,
      minThreshold: item.minThreshold,
      lastPurchaseAmount: item.lastPurchaseAmount,
      unitPrice: item.unitPrice,
      note: item.note,
    });
    setModal({ type: 'edit', item });
  };

  const openPurchaseModal = (item: InventoryItem) => {
    setPurchaseQuantity(1);
    setPurchasePrice(item.unitPrice || 0);
    setPurchaseNote('');
    setModal({ type: 'purchase', item });
  };

  const openUsageModal = (item: InventoryItem) => {
    setUsageQuantity(1);
    setUsageNote('');
    setModal({ type: 'usage', item });
  };

  const closeModal = () => {
    setModal({ type: null });
  };

  const handleAddSubmit = () => {
    if (!addForm.name.trim()) return;
    const now = new Date().toISOString().split('T')[0];
    addInventory({
      name: addForm.name.trim(),
      category: addForm.category,
      currentQuantity: addForm.currentQuantity,
      unit: addForm.unit,
      minThreshold: addForm.minThreshold,
      lastPurchaseAmount: addForm.lastPurchaseAmount,
      lastPurchaseDate: now,
      unitPrice: addForm.unitPrice,
      note: addForm.note,
    });
    closeModal();
  };

  const handleEditSubmit = () => {
    if (!modal.item || !addForm.name.trim()) return;
    updateInventory(modal.item.id, {
      name: addForm.name.trim(),
      category: addForm.category,
      currentQuantity: addForm.currentQuantity,
      unit: addForm.unit,
      minThreshold: addForm.minThreshold,
      lastPurchaseAmount: addForm.lastPurchaseAmount,
      unitPrice: addForm.unitPrice,
      note: addForm.note,
    });
    closeModal();
  };

  const handlePurchaseSubmit = () => {
    if (!modal.item || purchaseQuantity <= 0) return;
    recordPurchase(modal.item.id, purchaseQuantity, purchasePrice, purchaseNote || undefined);
    closeModal();
  };

  const handleUsageSubmit = () => {
    if (!modal.item || usageQuantity <= 0) return;
    recordUsage(modal.item.id, usageQuantity, usageNote || undefined);
    closeModal();
  };

  const handleDelete = (item: InventoryItem) => {
    if (window.confirm(`确定要删除「${item.name}」吗？`)) {
      deleteInventory(item.id);
    }
  };

  const renderModal = () => {
    if (!modal.type) return null;

    const titleMap = {
      add: '添加用品',
      edit: '编辑用品',
      purchase: modal.item ? `入库 - ${modal.item.name}` : '入库',
      usage: modal.item ? `出库 - ${modal.item.name}` : '出库',
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={closeModal}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl text-gray-800">
              {titleMap[modal.type]}
            </h2>
            <button
              onClick={closeModal}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {(modal.type === 'add' || modal.type === 'edit') && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  用品名称 *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="例如：皇家猫粮"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  分类
                </label>
                <select
                  value={addForm.category}
                  onChange={(e) =>
                    setAddForm({ ...addForm, category: e.target.value as InventoryCategory })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                >
                  {categories.slice(1).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    当前数量
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={addForm.currentQuantity}
                    onChange={(e) =>
                      setAddForm({ ...addForm, currentQuantity: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    单位
                  </label>
                  <input
                    type="text"
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    placeholder="袋/kg/个"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    最低阈值
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={addForm.minThreshold}
                    onChange={(e) =>
                      setAddForm({ ...addForm, minThreshold: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    上次购买量
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={addForm.lastPurchaseAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, lastPurchaseAmount: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  单价 (元)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={addForm.unitPrice}
                  onChange={(e) =>
                    setAddForm({ ...addForm, unitPrice: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  备注
                </label>
                <textarea
                  value={addForm.note}
                  onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                  rows={2}
                  placeholder="选填"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={modal.type === 'add' ? handleAddSubmit : handleEditSubmit}
                  className="flex-1 rounded-xl bg-primary py-2.5 font-medium text-white transition-colors hover:bg-primary/90"
                >
                  {modal.type === 'add' ? '添加' : '保存'}
                </button>
              </div>
            </div>
          )}

          {modal.type === 'purchase' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  入库数量 *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPurchaseQuantity(Math.max(0, purchaseQuantity - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    <MinusCircle size={18} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(Number(e.target.value) || 0)}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-center outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                  <button
                    onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    <Plus size={18} />
                  </button>
                  <span className="text-sm text-gray-500">{modal.item?.unit}</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  单价 (元)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                />
                {purchaseQuantity > 0 && purchasePrice > 0 && (
                  <p className="mt-1.5 text-sm text-gray-500">
                    合计：¥{(purchaseQuantity * purchasePrice).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  备注
                </label>
                <textarea
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  rows={2}
                  placeholder="选填，例如：京东618活动购买"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handlePurchaseSubmit}
                  className="flex-1 rounded-xl bg-secondary py-2.5 font-medium text-white transition-colors hover:bg-secondary/90"
                >
                  确认入库
                </button>
              </div>
            </div>
          )}

          {modal.type === 'usage' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  出库数量 *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsageQuantity(Math.max(0, usageQuantity - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    <MinusCircle size={18} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={usageQuantity}
                    onChange={(e) => setUsageQuantity(Number(e.target.value) || 0)}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-center outline-none transition-colors focus:border-primary focus:bg-white"
                  />
                  <button
                    onClick={() => setUsageQuantity(usageQuantity + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    <Plus size={18} />
                  </button>
                  <span className="text-sm text-gray-500">{modal.item?.unit}</span>
                </div>
                {modal.item && usageQuantity > modal.item.currentQuantity && (
                  <p className="mt-1.5 text-sm text-danger">
                    ⚠️ 出库数量超过当前库存 ({modal.item.currentQuantity} {modal.item.unit})
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  备注
                </label>
                <textarea
                  value={usageNote}
                  onChange={(e) => setUsageNote(e.target.value)}
                  rows={2}
                  placeholder="选填，例如：日常消耗"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-colors focus:border-primary focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleUsageSubmit}
                  className="flex-1 rounded-xl bg-primary py-2.5 font-medium text-white transition-colors hover:bg-primary/90"
                >
                  确认出库
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-30 -mx-4 mb-6 bg-background/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl text-gray-800">
                  用品库存
                </h1>
                <p className="text-sm text-gray-500">
                  管理宠物的各种用品库存
                </p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0"
            >
              <Plus size={18} />
              <span>添加用品</span>
            </button>
          </div>
        </div>

        <div className="mb-6 -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-white text-gray-600 hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20">
            <div className="mb-4 text-6xl">📦</div>
            <p className="font-display text-xl text-gray-400">
              {activeCategory === 'all' ? '还没有添加任何用品' : '该分类暂无用品'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 rounded-xl bg-primary/10 px-4 py-2 text-primary transition-colors hover:bg-primary/20"
            >
              点击添加
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredInventory.map((item) => {
              const status = getStoreStockStatus(item);
              const statusConfig = getStatusConfig(status);
              const progressWidth = calculateProgressWidth(item, status);
              const isLow = status === 'low';

              return (
                <div
                  key={item.id}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border-2 bg-white p-5 transition-all card-shadow',
                    'hover:-translate-y-1',
                    isLow && 'border-danger animate-shake'
                  )}
                  style={
                    isLow
                      ? {
                          borderColor: isLow ? undefined : undefined,
                        }
                      : undefined
                  }
                >
                  {isLow && (
                    <div className="absolute -right-8 top-4 rotate-45 bg-danger px-10 py-1 text-xs font-medium text-white">
                      该补货了
                    </div>
                  )}

                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                      <div>
                        <h3 className="font-display text-lg leading-tight text-gray-800">
                          {item.name}
                        </h3>
                        <span
                          className={cn(
                            'mt-0.5 inline-flex items-center text-xs',
                            statusConfig.labelClass
                          )}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                      <span>库存进度</span>
                      <span className="font-medium text-gray-700">
                        {item.currentQuantity} {item.unit} / 阈值 {item.minThreshold}{' '}
                        {item.unit}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          statusConfig.barClass,
                          isLow && 'animate-pulse-slow'
                        )}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-gray-50 p-2.5">
                      <div className="text-xs text-gray-400">当前剩余</div>
                      <div className="font-display text-lg text-gray-800">
                        {item.currentQuantity}
                        <span className="ml-0.5 text-sm text-gray-500">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2.5">
                      <div className="text-xs text-gray-400">最低阈值</div>
                      <div className="font-display text-lg text-gray-800">
                        {item.minThreshold}
                        <span className="ml-0.5 text-sm text-gray-500">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl bg-primary/5 p-2.5 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500">上次购买</span>
                      <CheckCircle
                        size={14}
                        className="text-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span>{formatDate(item.lastPurchaseDate)}</span>
                      <span className="font-medium">
                        {item.lastPurchaseAmount} {item.unit}
                      </span>
                    </div>
                    {item.unitPrice > 0 && (
                      <div className="mt-0.5 text-xs text-gray-500">
                        单价 ¥{item.unitPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {item.note && (
                    <div className="mb-4 text-xs text-gray-500">
                      💬 {item.note}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openPurchaseModal(item)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary/10 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20"
                      title="入库"
                    >
                      <LogIn size={16} />
                      <span>入库</span>
                    </button>
                    <button
                      onClick={() => openUsageModal(item)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                      title="出库"
                    >
                      <LogOut size={16} />
                      <span>出库</span>
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                      title="编辑"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-danger/10 hover:text-danger"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {renderModal()}
    </div>
  );
}
