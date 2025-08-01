import React, { useState } from 'react';
import { teamService, type JoinTeamRequest } from '../services/teamService';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamJoined: (team: any) => void;
}

const JoinTeamModal: React.FC<JoinTeamModalProps> = ({ isOpen, onClose, onTeamJoined }) => {
  const [formData, setFormData] = useState<JoinTeamRequest>({
    teamCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await teamService.joinTeamByCode(formData);

      if (result.success && result.data) {
        onTeamJoined(result.data);
        setFormData({ teamCode: '' });
        onClose();
      } else {
        setError(result.error || 'Takıma katılırken bir hata oluştu');
      }
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu');
      console.error('Join team error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Takıma Katıl</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="teamCode" className="block text-sm font-medium text-gray-700 mb-2">
                Takım Kodu
              </label>
              <input
                type="text"
                id="teamCode"
                name="teamCode"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Takım kodunu girin"
                value={formData.teamCode}
                onChange={handleInputChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Takım lideri tarafından paylaşılan kodu girin
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Katılıyor...' : 'Katıl'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinTeamModal;
