import React, { useState } from 'react';
import { type CreateSessionRequest } from '../services/pokerApiService';

interface CreatePokerSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (sessionData: CreateSessionRequest) => void;
}

const CreatePokerSessionModal: React.FC<CreatePokerSessionModalProps> = ({
  isOpen,
  onClose,
  onSessionCreated
}) => {
  const [formData, setFormData] = useState<CreateSessionRequest>({
    teamId: '',
    storyTitle: '',
    storyDescription: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      onSessionCreated(formData);
      setFormData({ teamId: '', storyTitle: '', storyDescription: '' });
      onClose();
    } catch (err) {
      console.error('Create poker session error:', err);
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
            <h3 className="text-lg font-medium text-gray-900">Yeni Poker Oturumu</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="storyTitle" className="block text-sm font-medium text-gray-700 mb-2">
                User Story Başlığı
              </label>
              <input
                type="text"
                id="storyTitle"
                name="storyTitle"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Örn: Kullanıcı giriş özelliği"
                value={formData.storyTitle}
                onChange={handleInputChange}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="storyDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                id="storyDescription"
                name="storyDescription"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="User story'nin detaylı açıklaması..."
                value={formData.storyDescription}
                onChange={handleInputChange}
              />
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Oluşturuluyor...' : 'Oturum Başlat'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePokerSessionModal;
