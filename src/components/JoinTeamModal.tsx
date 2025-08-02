import React, { useState } from 'react';
import { teamService } from '../services/teamService';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamJoined: (team: any) => void;
}

const JoinTeamModal: React.FC<JoinTeamModalProps> = ({ isOpen, onClose, onTeamJoined }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Davet kodu zorunludur');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await teamService.joinTeamByCode({ inviteCode: inviteCode.trim() });

      if (result.success && result.data) {
        onTeamJoined(result.data);
        onClose();
        setInviteCode('');
      } else {
        setError(result.error || 'Takıma katılırken bir hata oluştu');
      }
    } catch (error) {
      console.error('Join team error:', error);
      setError('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Takıma Katıl</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Davet Kodu
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="8 karakterli davet kodunu girin"
                maxLength={8}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? 'Katılıyor...' : 'Katıl'}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Not:</strong> Davet kodu ile katılım talebiniz takım yöneticisi tarafından onaylanana kadar beklemede kalacaktır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinTeamModal;
