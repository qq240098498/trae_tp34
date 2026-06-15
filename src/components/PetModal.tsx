import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Pet, PetSpecies } from '@/store';
import { getSpeciesEmoji, getSpeciesName } from '@/utils/helpers';

interface PetFormData {
  name: string;
  species: PetSpecies;
  breed: string;
  weight: number;
  birthday: string;
  avatar: string;
  note: string;
}

interface PetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PetFormData) => void;
  editPet?: Pet | null;
}

const speciesOptions: PetSpecies[] = ['cat', 'dog', 'rabbit', 'bird', 'fish', 'other'];

const avatarOptions = ['🐱', '🐕', '🐰', '🐦', '🐟', '🐾', '🐶', '🐈', '🦮', '🐩', '🐕‍🦺', '🐇', '🦜', '🦉', '🐠', '🐡', '🐢', '🦎', '🐹', '🐭', '🐰', '🦔'];

const defaultFormData: PetFormData = {
  name: '',
  species: 'cat',
  breed: '',
  weight: 0,
  birthday: '',
  avatar: '🐱',
  note: '',
};

export default function PetModal({ open, onClose, onSubmit, editPet }: PetModalProps) {
  const [formData, setFormData] = useState<PetFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editPet) {
      setFormData({
        name: editPet.name,
        species: editPet.species,
        breed: editPet.breed,
        weight: editPet.weight,
        birthday: editPet.birthday,
        avatar: editPet.avatar,
        note: editPet.note,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [editPet, open]);

  if (!open) return null;

  const handleChange = <K extends keyof PetFormData>(key: K, value: PetFormData[K]) => {
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
    if (!formData.name.trim()) {
      newErrors.name = '请输入宠物名字';
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
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 rounded-t-2xl">
          <h2 className="text-xl font-display font-bold text-gray-800">
            {editPet ? '编辑宠物' : '添加宠物'}
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
              宠物头像
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange('avatar', emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-all ${
                    formData.avatar === emoji
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              名字 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入宠物名字"
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.name ? 'border-danger' : 'border-gray-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              种类
            </label>
            <select
              value={formData.species}
              onChange={(e) => {
                const species = e.target.value as PetSpecies;
                handleChange('species', species);
                handleChange('avatar', getSpeciesEmoji(species));
              }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white"
            >
              {speciesOptions.map((s) => (
                <option key={s} value={s}>
                  {getSpeciesEmoji(s)} {getSpeciesName(s)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              品种
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => handleChange('breed', e.target.value)}
              placeholder="如：橘猫、柴犬等"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight || ''}
                onChange={(e) =>
                  handleChange('weight', parseFloat(e.target.value) || 0)
                }
                placeholder="0.0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                生日
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => handleChange('birthday', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              备注
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="记录一些关于宠物的小信息..."
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
              {editPet ? '保存修改' : '添加宠物'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { PetFormData };
