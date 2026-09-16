import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { petService } from '../../services/petService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import PetModal from './PetModal';
import { useAuth } from '../../hooks/useAuth';
import { Dog, Plus, Eye, Edit2, Trash2, User, Sparkles } from 'lucide-react';

export const PetList = () => {
  const { isStaff, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const data = await petService.getAll({
        species: speciesFilter || undefined,
      });
      setPets(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch pets directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [speciesFilter]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name}'s record?`)) {
      try {
        await petService.delete(id);
        addToast(`${name}'s profile removed`, 'info');
        fetchPets();
      } catch (err) {
        addToast('Failed to delete pet', 'error');
      }
    }
  };

  const columns = [
    {
      header: 'Pet Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.photo ? (
            <img
              src={row.photo}
              alt={row.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-base shadow-sm">
              🐾
            </div>
          )}
          <div>
            <Link
              to={`/pets/${row.id}`}
              className="font-bold text-slate-900 hover:text-brand-600 transition-colors"
            >
              {row.name}
            </Link>
            <p className="text-[11px] text-slate-400 font-mono">{row.pet_id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Species & Breed',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.species}</span>
          <p className="text-slate-500 text-[11px]">{row.breed || 'Mixed / Unknown'}</p>
        </div>
      ),
    },
    {
      header: 'Owner',
      render: (row) => (
        <div className="text-xs">
          <Link
            to={`/customers/${row.owner}`}
            className="font-semibold text-brand-700 hover:underline flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5" />
            <span>{row.owner_name}</span>
          </Link>
          <p className="text-slate-400 text-[11px]">{row.owner_phone}</p>
        </div>
      ),
    },
    {
      header: 'Age & Gender',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{row.age}</span>
          <p className="text-slate-500 text-[11px]">{row.gender}</p>
        </div>
      ),
    },
    {
      header: 'Weight',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.weight ? `${row.weight} kg` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/pets/${row.id}`}
            title="View 360 Health Profile"
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {!isAdmin && (
            <>
              <button
                onClick={() => {
                  setEditingPet(row);
                  setIsModalOpen(true);
                }}
                title="Edit Pet"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row.id, row.name)}
                title="Delete Pet"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Dog className="w-6 h-6 text-brand-600" />
            <span>Pet Management Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, veterinary records, dietary instructions, and health trackers
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => {
              setEditingPet(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Pet</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={pets}
        loading={loading}
        searchPlaceholder="Search pets by name, breed, microchip, or owner..."
        filterComponent={
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Species</option>
            <option value="DOG">Dogs</option>
            <option value="CAT">Cats</option>
            <option value="BIRD">Birds</option>
            <option value="RABBIT">Rabbits</option>
            <option value="OTHER">Other</option>
          </select>
        }
      />

      {isModalOpen && (
        <PetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pet={editingPet}
          onSaved={fetchPets}
        />
      )}
    </div>
  );
};

export default PetList;
