import React, { useState, useEffect, useCallback } from 'react';
import { teamService, type TeamMember, type TeamDetails } from '../services/teamService';

interface TeamManagementPanelProps {
  team: TeamDetails;
  onTeamUpdated: (team: TeamDetails) => void;
  userRole?: string;
}

const TeamManagementPanel: React.FC<TeamManagementPanelProps> = ({
  team,
  onTeamUpdated,
  userRole = 'MEMBER'
}) => {
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteCodeVisible, setInviteCodeVisible] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const loadPendingMembers = useCallback(async () => {
    // Only load pending members if user is admin
    if (userRole !== 'ADMIN') return;

    try {
      const result = await teamService.getPendingMembers(team.id);
      if (result.success && result.data) {
        setPendingMembers(result.data);
      }
    } catch (error) {
      console.error('Error loading pending members:', error);
    }
  }, [team.id, userRole]);

  useEffect(() => {
    loadPendingMembers();
  }, [loadPendingMembers]);

  // Don't show this panel if user is not admin
  if (userRole !== 'ADMIN') {
    return null;
  }

  const handleApproveMember = async (memberId: string, role: string) => {
    setLoading(true);
    try {
      const result = await teamService.approveMember(team.id, { memberId, role });
      if (result.success) {
        // Refresh pending members
        await loadPendingMembers();
        // Refresh team details
        const teamDetails = await teamService.getTeamDetails(team.id);
        if (teamDetails.success && teamDetails.data) {
          onTeamUpdated(teamDetails.data);
        }
      }
    } catch (error) {
      console.error('Error approving member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMember = async (memberId: string) => {
    setLoading(true);
    try {
      const result = await teamService.rejectMember(team.id, memberId);
      if (result.success) {
        // Refresh pending members
        await loadPendingMembers();
        // Refresh team details
        const teamDetails = await teamService.getTeamDetails(team.id);
        if (teamDetails.success && teamDetails.data) {
          onTeamUpdated(teamDetails.data);
        }
      }
    } catch (error) {
      console.error('Error rejecting member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    setGeneratingCode(true);
    try {
      const result = await teamService.generateInviteCode(team.id);
      if (result.success && result.data) {
        onTeamUpdated({ ...team, inviteCode: result.data.inviteCode });
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyInviteCode = () => {
    if (team.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      alert('Invite code copied!');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Team Management</h3>

      {/* Invite Code Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-md font-medium text-gray-700">Invite Code</h4>
          <button
            onClick={() => setInviteCodeVisible(!inviteCodeVisible)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {inviteCodeVisible ? 'Hide' : 'Show'}
          </button>
        </div>

        {inviteCodeVisible && (
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current invite code:</p>
                <p className="text-lg font-mono font-bold text-gray-900">
                  {team.inviteCode}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={copyInviteCode}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                >
                  Copy
                </button>
                <button
                  onClick={handleGenerateInviteCode}
                  disabled={generatingCode}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  {generatingCode ? 'Generating...' : 'New Code'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Members */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">
          Pending Members ({pendingMembers.length})
        </h4>

        {pendingMembers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No pending members</p>
        ) : (
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    defaultValue="OBSERVER"
                    id={`role-${member.id}`}
                  >
                    <option value="OBSERVER">Observer</option>
                    <option value="ADMIN">Admin</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="TESTER">Tester</option>
                    <option value="TECHNICAL_LEAD">Technical Lead</option>
                    <option value="SCRUM_MASTER">Scrum Master</option>
                    <option value="PRODUCT_OWNER">Product Owner</option>
                  </select>

                  <button
                    onClick={() => {
                      const select = document.getElementById(`role-${member.id}`) as HTMLSelectElement;
                      handleApproveMember(member.id, select.value);
                    }}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleRejectMember(member.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagementPanel;
