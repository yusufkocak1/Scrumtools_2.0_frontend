import React, { useState, useEffect } from 'react';
import { teamService, type TeamDetails } from '../services/teamService';

interface TeamMembersComponentProps {
  teamId: string;
  onEditClick: () => void;
}

const TeamMembersComponent: React.FC<TeamMembersComponentProps> = ({ teamId, onEditClick }) => {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeamDetails();
  }, [teamId]);

  const loadTeamDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await teamService.getTeamDetails(teamId);
      if (result.success && result.data) {
        setTeamDetails(result.data);
      } else {
        setError(result.error || 'Takım detayları yüklenemedi');
      }
    } catch (error) {
      setError('Takım detayları yüklenirken bir hata oluştu');
      console.error('Error loading team details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'SCRUM_MASTER': 'bg-blue-100 text-blue-800',
      'PRODUCT_OWNER': 'bg-indigo-100 text-indigo-800',
      'DEVELOPER': 'bg-green-100 text-green-800',
      'TESTER': 'bg-yellow-100 text-yellow-800',
      'ANALYST': 'bg-pink-100 text-pink-800',
      'TECHNICAL_LEAD': 'bg-red-100 text-red-800',
      'OBSERVER': 'bg-gray-100 text-gray-800',
      'MEMBER': 'bg-gray-100 text-gray-800'
    };

    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      'OBSERVER': 'Gözlemci',
      'ADMIN': 'Yönetici',
      'SCRUM_MASTER': 'Scrum Master',
      'DEVELOPER': 'Geliştirici',
      'TESTER': 'Test Uzmanı',
      'ANALYST': 'Analist',
      'TECHNICAL_LEAD': 'Teknik Lider',
      'MEMBER': 'Üye'
    };

    return roleLabels[role as keyof typeof roleLabels] || 'Üye';
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };

    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      'ACTIVE': 'Aktif',
      'PENDING': 'Beklemede',
      'REJECTED': 'Reddedildi'
    };

    return statusLabels[status as keyof typeof statusLabels] || 'Bilinmiyor';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow h-full">
        <div className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-gray-500">Takım üyeleri yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow h-full">
        <div className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Takım Üyeleri</h3>
          <button
            onClick={onEditClick}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            title="Takım üyelerini düzenle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {teamDetails && teamDetails.members && teamDetails.members.length > 0 ? (
          <div className="space-y-4">
            {teamDetails.members.map((member) => (
              <div key={member.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </span>
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {getStatusLabel(member.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.email}</p>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    member.status === 'ACTIVE' ? 'bg-green-400' : 
                    member.status === 'PENDING' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} title={getStatusLabel(member.status)}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Takım üyesi bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Bu takımda henüz üye bulunmuyor.</p>
          </div>
        )}

        {/* Footer Stats */}
        {teamDetails && teamDetails.members && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Toplam {teamDetails.members.length} üye
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMembersComponent;
