import React, { useState } from 'react';
import { teamService, type CreateTeamRequest } from '../services/teamService';

interface TeamActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (team: any) => void;
  onTeamJoined: (team: any) => void;
}

type ActionType = 'create' | 'join';

const TeamActionModal: React.FC<TeamActionModalProps> = ({
  isOpen,
  onClose,
  onTeamCreated,
  onTeamJoined
}) => {
  const [actionType, setActionType] = useState<ActionType>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create team form data
  const [createFormData, setCreateFormData] = useState<CreateTeamRequest>({
    name: '',
    description: '',
    members: []
  });

  // Join team form data
  const [inviteCode, setInviteCode] = useState('');

  const handleClose = () => {
    setCreateFormData({ name: '', description: '', members: [] });
    setInviteCode('');
    setError('');
    setActionType('create');
    onClose();
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await teamService.createTeam(createFormData);

      if (result.success && result.data) {
        onTeamCreated(result.data);
        handleClose();
      } else {
        setError(result.error || 'An error occurred while creating the team');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Create team error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await teamService.joinTeamByCode({ inviteCode: inviteCode.trim() });

      if (result.success && result.data) {
        onTeamJoined(result.data);
        handleClose();
      } else {
        setError(result.error || 'An error occurred while joining the team');
      }
    } catch (error) {
      console.error('Join team error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {actionType === 'create' ? 'Create New Team' : 'Join Team'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action Type Selector */}
          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setActionType('create');
                  setError('');
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  actionType === 'create'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Create New Team
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('join');
                  setError('');
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  actionType === 'join'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Join Team
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Create Team Form */}
          {actionType === 'create' && (
            <form onSubmit={handleCreateSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter team name"
                  value={createFormData.name}
                  onChange={handleCreateInputChange}
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter team description"
                  value={createFormData.description}
                  onChange={handleCreateInputChange}
                  disabled={loading}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* Join Team Form */}
          {actionType === 'join' && (
            <form onSubmit={handleJoinSubmit}>
              <div className="mb-4">
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter 8-character invite code"
                  maxLength={8}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading || !inviteCode.trim()}
                >
                  {loading ? 'Joining...' : 'Join'}
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Your request to join with the invite code will remain pending until approved by the team administrator.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamActionModal;
