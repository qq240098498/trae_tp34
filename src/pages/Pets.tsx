import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { usePetStore, type Pet, type PetSpecies } from '@/store';
import { calculateAge, getSpeciesName, getSpeciesEmoji } from '@/utils/helpers';
import PetModal, { type PetFormData } from '@/components/PetModal';

type SpeciesFilter = PetSpecies | 'all';

const speciesFilters: { value: SpeciesFilter; label: string; emoji: string }[] = [
  { value: 'all', label: '全部', emoji: '🐾' },
  { value: 'cat', label: '猫', emoji: '🐱' },
  { value: 'dog', label: '狗', emoji: '🐕' },
  { value: 'rabbit', label: '兔', emoji: '🐰' },
  { value: 'bird', label: '鸟', emoji: '🐦' },
  { value: 'fish', label: '鱼', emoji: '🐟' },
  { value: 'other', label: '其他', emoji: '🐾' },
];

export default function Pets() {
  const { pets, addPet, updatePet, deletePet } = usePetStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchSearch =
        !searchTerm || pet.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSpecies =
        speciesFilter === 'all' || pet.species === speciesFilter;
      return matchSearch && matchSpecies;
    });
  }, [pets, searchTerm, speciesFilter]);

  const handleAdd = () => {
    setEditingPet(null);
    setModalOpen(true);
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setModalOpen(true);
  };

  const handleDelete = (pet: Pet) => {
    if (window.confirm(`确定要删除宠物「${pet.name}」吗？此操作不可撤销。`)) {
      deletePet(pet.id);
    }
  };

  const handleSubmit = (data: PetFormData) => {
    if (editingPet) {
      updatePet(editingPet.id, data);
    } else {
      addPet(data);
    }
    setModalOpen(false);
    setEditingPet(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingPet(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-800">
              🐾 宠物档案
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              管理您的毛孩子档案，记录它们的成长点滴
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-md shadow-primary/20 active:scale-95"
          >
            <Plus size={20} strokeWidth={2.5} />
            添加宠物
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索宠物名字..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {speciesFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSpeciesFilter(filter.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  speciesFilter === filter.value
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{filter.emoji}</span>
                <span>{filter.label}</span>
                {filter.value !== 'all' && (
                  <span
                    className={`ml-0.5 text-xs ${
                      speciesFilter === filter.value
                        ? 'text-white/80'
                        : 'text-gray-400'
                    }`}
                  >
                    {pets.filter((p) => p.species === filter.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredPets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4 animate-float">🐾</div>
            <h3 className="text-xl font-display font-bold text-gray-800 mb-2">
              {pets.length === 0 ? '还没有宠物档案' : '没有匹配的宠物'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {pets.length === 0
                ? '点击下方按钮，添加您的第一只毛孩子吧！'
                : '试试调整搜索条件或筛选器'}
            </p>
            {pets.length === 0 && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-md shadow-primary/20 active:scale-95"
              >
                <Plus size={20} strokeWidth={2.5} />
                添加第一只宠物
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onEdit={() => handleEdit(pet)}
                onDelete={() => handleDelete(pet)}
              />
            ))}
          </div>
        )}
      </div>

      <PetModal
        open={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editPet={editingPet}
      />
    </div>
  );
}

interface PetCardProps {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}

function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 text-center border-b border-gray-100">
        <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
          {pet.avatar || getSpeciesEmoji(pet.species)}
        </div>
        <h3 className="text-xl font-display font-bold text-gray-800">
          {pet.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
            {getSpeciesEmoji(pet.species)} {getSpeciesName(pet.species)}
          </span>
          {pet.breed && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {pet.breed}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {pet.birthday && (
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5">📅</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">生日</p>
              <p className="text-sm font-medium text-gray-800 truncate">
                {pet.birthday}
                <span className="text-primary ml-1">({calculateAge(pet.birthday)})</span>
              </p>
            </div>
          </div>
        )}

        {pet.weight > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5">⚖️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">体重</p>
              <p className="text-sm font-medium text-gray-800 truncate">
                {pet.weight} kg
              </p>
            </div>
          </div>
        )}

        {pet.note && (
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5">📝</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">备注</p>
              <p className="text-sm text-gray-700 line-clamp-2">{pet.note}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-t border-gray-100">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
        >
          <Pencil size={16} />
          编辑
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-danger/10 hover:text-danger transition-colors"
        >
          <Trash2 size={16} />
          删除
        </button>
      </div>
    </div>
  );
}
