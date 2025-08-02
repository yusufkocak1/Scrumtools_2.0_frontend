import React from 'react';
import type {Team} from '../services/teamService';

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface DashboardHeaderProps {
  user: User;
  teams?: Team[];
  selectedTeam?: Team | null;
  userRole?: string;
  loading: boolean;
  onTeamSelect?: (team: Team) => void;
  onCreateTeam: () => void;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  teams = [],
  selectedTeam = null,
  userRole = 'MEMBER',
  loading,
  onTeamSelect,
  onCreateTeam,
  onLogout,
}) => {
  const handleCopyInviteCode = () => {
    if (selectedTeam?.inviteCode) {
      navigator.clipboard.writeText(selectedTeam.inviteCode);
      // TODO: Toast notification yerine alert kullanıyoruz
      alert('Davet kodu kopyalandı!');
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Scrum Tools</h1>

            {/* Team Selector - Only show if teams exist and callback is provided */}
            {teams.length > 0 && onTeamSelect && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select
                    value={selectedTeam?.id || ''}
                    onChange={(e) => {
                      const team = teams.find(t => t.id === e.target.value);
                      if (team && onTeamSelect) onTeamSelect(team);
                    }}
                    className="appearance-none bg-gray-50 border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Invite Code Display - Only for admins */}
                {userRole === 'ADMIN' && selectedTeam && (
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-md">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6c-3 0-5.5-1.5-5.5-4a3.5 3.5 0 117 0A6 6 0 0112 15a6 6 0 01-6-6 2 2 0 012-2m6 0a2 2 0 012 2m4 0a6 6 0 01-6 6c-3 0-5.5-1.5-5.5-4a3.5 3.5 0 117 0A6 6 0 0112 15a6 6 0 01-6-6 2 2 0 012-2" />
                    </svg>
                    <span className="text-sm text-blue-700">Davet Kodu:</span>
                    <span className="text-sm font-mono font-semibold text-blue-800">
                      {selectedTeam.inviteCode}
                    </span>
                    <button
                      onClick={handleCopyInviteCode}
                      className="text-blue-600 hover:text-blue-800"
                      title="Davet kodunu kopyala"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Team Management Button */}
            <button
              onClick={onCreateTeam}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Takım Yönetimi
            </button>

            {/* User Greeting */}
            <span className="text-gray-700">
              Merhaba, {user.firstName} {user.lastName}
            </span>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
