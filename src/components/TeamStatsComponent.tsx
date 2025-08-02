import React from 'react';
import { type Team } from '../services/teamService';

interface TeamStatsComponentProps {
  team: Team;
  onEditClick: () => void;
}

const TeamStatsComponent: React.FC<TeamStatsComponentProps> = ({ team, onEditClick }) => {
  const copyInviteCode = () => {
    if (team.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      // TODO: Show toast notification
    }
  };

  return (
    <div className="bg-white rounded-lg shadow h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Takım Bilgileri</h3>
          <button
            onClick={onEditClick}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            title="Takım bilgilerini düzenle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Team Info */}
        <div className="space-y-6">
          {/* Team Name & Description */}
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h4>
            {team.description && (
              <p className="text-gray-600 leading-relaxed">{team.description}</p>
            )}
          </div>

          {/* Team Invite Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Takım Davet Kodu
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={team.inviteCode}
                  readOnly
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono text-gray-900 focus:outline-none"
                />
              </div>
              <button
                onClick={copyInviteCode}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Kodu kopyala"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Bu kodu paylaşarak takımınıza yeni üyeler davet edebilirsiniz.
            </p>
          </div>

          {/* Team Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Member Count */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Toplam Üye</p>
                  <p className="text-2xl font-bold text-blue-600">{team.members?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Aktif Oturum</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
              </div>
            </div>

            {/* Completed Sessions */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Tamamlanan</p>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
              </div>
            </div>

            {/* Total Stories */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-900">User Story</p>
                  <p className="text-2xl font-bold text-orange-600">0</p>
                </div>
              </div>
            </div>
          </div>


          {/* Created Date */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Oluşturulma Tarihi: {new Date(team.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatsComponent;
