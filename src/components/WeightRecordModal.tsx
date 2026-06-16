import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import type { Pet } from '@/store';
import { getSpeciesEmoji, getSpeciesName } from '@/utils/helpers';

export interface WeightRecordFormData {
  petId: string;
  weight: number;
  recordDate: string;
  note: string;
}

interface WeightRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WeightRecordFormData) => void;
  pets: Pet[];
  defaultPetId?: string;
}

export default function WeightRecordModal({
  open,
  onClose,
  onSubmit,
  pets,
  defaultPetId,
}: WeightRecordModalProps) {
  const [formData, setFormData] = useState<WeightRecordFormData>({
    petId: defaultPetId || (pets.length > 0 ? pets[0].id : ''),
    weight: 0,
    recordDate: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        petId: defaultPetId || (pets.length > 0 ? pets[0].id : ''),
        weight: 0,
        recordDate: format(new Date(), 'yyyy-MM-dd'),
        note: '',
      });
      setErrors({});
    }
  }, [open, pets, defaultPetId]);

  if (!open) return null;

  const handleChange = <K extends keyof WeightRecordFormData>(
    key: K,
    value: WeightRecordFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.petId) {
      newErrors.petId = '请选择宠物';
    }
    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = '请输入有效的体重';
    }
    if (!formData.recordDate) {
      newErrors.recordDate = '请选择日期';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 rounded-t-2xl">
          <h2 className="text-xl font-display font-bold text-gray-800">
            ⚖️ 记录体重
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              选择宠物 <span className="text-danger">*</span>
            </label>
            <select
              value={formData.petId}
              onChange={(e) => handleChange('petId', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white ${
                errors.petId ? 'border-danger' : 'border-gray-200'
              }`}
            >
              <option value="">请选择宠物</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {getSpeciesEmoji(pet.species)} {pet.name} ({getSpeciesName(pet.species)})
                </option>
              ))}
            </select>
            {errors.petId && (
              <p className="mt-1 text-xs text-danger">{errors.petId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              体重 (kg) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="例如：5.2"
              value={formData.weight || ''}
              onChange={(e) =>
                handleChange('weight', parseFloat(e.target.value) || 0)
              }
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.weight ? 'border-danger' : 'border-gray-200'
              }`}
            />
            {errors.weight && (
              <p className="mt-1 text-xs text-danger">{errors.weight}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              测量日期 <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={formData.recordDate}
              onChange={(e) => handleChange('recordDate', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.recordDate ? 'border-danger' : 'border-gray-200'
              }`}
            />
            {errors.recordDate && (
              <p className="mt-1 text-xs text-danger">{errors.recordDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              备注
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="例如：体检时测量、早上空腹称重等"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-md shadow-primary/20"
            >
              保存记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
