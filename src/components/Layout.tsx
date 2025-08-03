import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { teamService, type Team } from '../services/teamService';
import DashboardHeader from './DashboardHeader';
import TeamActionModal from './TeamActionModal';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences: Map<string, string>;
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<string>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [showTeamActionModal, setShowTeamActionModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Korumalı sayfalar (header gösterilmeyecek sayfalar)
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  const loadUserTeams = useCallback(async () => {
    try {
      const result = await teamService.getUserTeams();
      if (result.success && result.data) {
        const teamsData = result.data;
        setTeams(teamsData);

        // Son seçili takımı kontrol et
        const lastSelectedTeamId = teamService.getLastSelectedTeam();
        if (lastSelectedTeamId && teamsData.length > 0) {
          const lastTeam = teamsData.find(team => team.id === lastSelectedTeamId);
          if (lastTeam) {
            setSelectedTeam(lastTeam);
          } else if (teamsData.length > 0) {
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
    }
  }, []);

  const loadTeamDetailsAndRole = useCallback(async () => {
    if (!selectedTeam || !user) return;

    try {
      const result = await teamService.getTeamDetails(selectedTeam.id);
      if (result.success && result.data) {
        // Kullanıcının bu takımdaki rolünü bul
        const currentUserMember = result.data.members.find(
          (member: any) => member.email === user.email
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
    // Public route ise auth kontrolü yapma
    if (isPublicRoute) return;

    // Kullanıcı giriş yapmış mı kontrol et
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Kullanıcı bilgilerini localStorage'dan al
    const { user: userData } = authService.getAuthData();
    setUser(userData);

    // Kullanıcının takımlarını çek
    loadUserTeams();
  }, [navigate, loadUserTeams, isPublicRoute]);

  // Seçili takım değiştiğinde takım detaylarını ve kullanıcı rolünü yükle
  useEffect(() => {
    if (selectedTeam && user && !isPublicRoute) {
      loadTeamDetailsAndRole();
    }
  }, [selectedTeam, user, loadTeamDetailsAndRole, isPublicRoute]);

  const handleTeamSelect = async (team: Team) => {
    setSelectedTeam(team);
    teamService.setLastSelectedTeam(team.id);
    await loadTeamDetailsAndRole();
  };

  const handleTeamCreated = (newTeam: any) => {
    setTeams(prev => [...prev, newTeam]);
    setSelectedTeam(newTeam);
    teamService.setLastSelectedTeam(newTeam.id);
  };

  const handleTeamJoined = (joinedTeam: any) => {
    setTeams(prev => [...prev, joinedTeam]);
    setSelectedTeam(joinedTeam);
    teamService.setLastSelectedTeam(joinedTeam.id);
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // AuthService'de clearAuthData fonksiyonu yok, manuel temizleme
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // Public route ise sadece children'ı render et
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Auth kontrolü
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - tüm korumalı sayfalarda göster */}
      <DashboardHeader
        user={user}
        teams={teams}
        selectedTeam={selectedTeam}
        userRole={userRole}
        loading={loading}
        onTeamSelect={handleTeamSelect}
        onCreateTeam={() => setShowTeamActionModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Team Action Modal */}
      <TeamActionModal
        isOpen={showTeamActionModal}
        onClose={() => setShowTeamActionModal(false)}
        onTeamCreated={handleTeamCreated}
        onTeamJoined={handleTeamJoined}
      />
    </div>
  );
};

export default Layout;
