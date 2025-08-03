import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { teamService, type Team, type TeamDetails, type TeamMember } from '../services/teamService';
import TeamMembersComponent from '../components/TeamMembersComponent';
import TeamStatsComponent from '../components/TeamStatsComponent';
import TeamManagementPanel from '../components/TeamManagementPanel';

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamDetails | null>(null);
  const [userRole, setUserRole] = useState<string>('MEMBER');
  const [teamsLoading, setTeamsLoading] = useState(true);
  const navigate = useNavigate();

  const loadUserTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const result = await teamService.getUserTeams();
      if (result.success && result.data) {
        const teamsData = result.data;
        setTeams(teamsData);

        // Check last selected team
        const lastSelectedTeamId = teamService.getLastSelectedTeam();
        if (lastSelectedTeamId && teamsData.length > 0) {
          const lastTeam = teamsData.find(team => team.id === lastSelectedTeamId);
          if (lastTeam) {
            setSelectedTeam(lastTeam);
          } else {
            setSelectedTeam(teamsData[0]);
            teamService.setLastSelectedTeam(teamsData[0].id);
          }
        } else if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0]);
          teamService.setLastSelectedTeam(teamsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  const loadTeamDetailsAndRole = useCallback(async () => {
    if (!selectedTeam || !user) return;

    try {
      const result = await teamService.getTeamDetails(selectedTeam.id);
      if (result.success && result.data) {
        setSelectedTeamDetails(result.data);

        // Find user's role in this team
        const currentUserMember = result.data.members.find(
          (member: TeamMember) => member.email === user.email
        );
        if (currentUserMember) {
          setUserRole(currentUserMember.role);
        } else {
          setUserRole('MEMBER');
        }
      }
    } catch (error) {
      console.error('Error loading team details:', error);
    }
  }, [selectedTeam, user]);

  useEffect(() => {
    // Get user info from localStorage
    const { user: userData } = authService.getAuthData();
    setUser(userData);

    // Load user teams
    loadUserTeams();
  }, [loadUserTeams]);

  // Load team details and user role when selected team changes
  useEffect(() => {
    if (selectedTeam && user) {
      loadTeamDetailsAndRole();
    }
  }, [selectedTeam, user, loadTeamDetailsAndRole]);

  // Navigate to poker page
  const handleStartPoker = () => {
    if (!selectedTeam) return;
    navigate(`/poker/${selectedTeam.id}`);
  };

  // Navigate to retrospective page
  const handleStartRetrospective = () => {
    if (!selectedTeam) return;
    navigate(`/retrospective/${selectedTeam.id}`);
  };

  // Edit handlers (placeholder functions for now)
  const handleEditTeamMembers = () => {
    console.log('Edit team members clicked');
  };

  const handleEditTeamInfo = () => {
    console.log('Edit team info clicked');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // No teams view
  if (!teamsLoading && teams.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">You don't have any teams yet</h2>
          <p className="mt-4 text-lg text-gray-500">
            You need to join a team to use Scrum tools.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Team
            </button>
            <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal dashboard when teams exist
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedTeam ? `${selectedTeam.name} Dashboard` : 'Dashboard'}
          </h2>
          <p className="text-gray-600">Manage your Scrum tools and optimize your team workflow.</p>
        </div>

        {/* Feature Cards - Only show if team is selected */}
        {selectedTeam && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Scrum Board</h3>
                    <p className="text-sm text-gray-500">View backlog and manage sprint work</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Start
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Scrum Poker</h3>
                    <p className="text-sm text-gray-500">Planning poker for story point estimation</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleStartPoker}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Retrospective</h3>
                    <p className="text-sm text-gray-500">Organize sprint retrospective meetings</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleStartRetrospective}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Sprint Review</h3>
                    <p className="text-sm text-gray-500">Sprint review presentations and feedback</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Loading */}
        {teamsLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading teams...</div>
          </div>
        )}

        {/* Team Members and Stats - Two Column Layout */}
        {selectedTeam && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1">
              <TeamMembersComponent
                teamId={selectedTeam.id}
                onEditClick={handleEditTeamMembers}
              />
            </div>
            <div className="lg:col-span-1">
              <TeamStatsComponent
                team={selectedTeam}
                onEditClick={handleEditTeamInfo}
              />
            </div>
          </div>
        )}

        {/* Team Management Panel - Only visible if a team is selected */}
        {selectedTeam && (
          <div className="mt-8">
            <TeamManagementPanel
              team={selectedTeamDetails || selectedTeam}
              onTeamUpdated={setSelectedTeamDetails}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
