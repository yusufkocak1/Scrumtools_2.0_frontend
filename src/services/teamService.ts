// Team Service API Implementation
import { apiService } from './apiService';

// Team Service Types
export interface Team {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  inviteCode: string;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  role: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

// TeamDetails artık Team ile aynı olduğu için type alias olarak tanımlayalım
export type TeamDetails = Team;

export interface CreateTeamRequest {
  name: string;
  description: string;
  members?: string[];
}

export interface CreateTeamResponse {
  success: boolean;
  data?: TeamDetails;
  error?: string;
}

export interface GetTeamsResponse {
  success: boolean;
  data?: Team[];
  error?: string;
}

export interface GetTeamDetailsResponse {
  success: boolean;
  data?: TeamDetails;
  error?: string;
}

export interface AddTeamMemberRequest {
  email: string;
  role: string;
}

export interface AddTeamMemberResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface JoinTeamRequest {
  inviteCode: string;
}

export interface JoinTeamResponse {
  success: boolean;
  data?: TeamDetails;
  error?: string;
}

export interface GenerateInviteCodeResponse {
  success: boolean;
  data?: { inviteCode: string };
  error?: string;
}

export interface PendingMembersResponse {
  success: boolean;
  data?: TeamMember[];
  error?: string;
}

export interface ApproveMemberRequest {
  memberId: string;
  role: string;
}

export interface ApproveMemberResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Team Service Implementation
export const teamService = {
  // Kullanıcının üyesi olduğu takımları getir
  getUserTeams: async (): Promise<GetTeamsResponse> => {
    return apiService.get<Team[]>('/api/teams');
  },

  // Takım detaylarını getir
  getTeamDetails: async (teamId: string): Promise<GetTeamDetailsResponse> => {
    return apiService.get<TeamDetails>(`/api/teams/${teamId}`);
  },

  // Yeni takım oluştur
  createTeam: async (teamData: CreateTeamRequest): Promise<CreateTeamResponse> => {
    return apiService.post<TeamDetails>('/api/teams', teamData);
  },

  // Takıma üye ekle
  addTeamMember: async (teamId: string, memberData: AddTeamMemberRequest): Promise<AddTeamMemberResponse> => {
    return apiService.post(`/api/teams/${teamId}/members`, memberData);
  },

  // Takımdan üye çıkar
  removeTeamMember: async (teamId: string, memberId: string): Promise<AddTeamMemberResponse> => {
    return apiService.delete(`/api/teams/${teamId}/members/${memberId}`);
  },

  // Takım koduna katıl
  joinTeamByCode: async (joinData: JoinTeamRequest): Promise<JoinTeamResponse> => {
    return apiService.post<TeamDetails>('/api/teams/join', joinData);
  },

  // Davet kodu oluştur
  generateInviteCode: async (teamId: string): Promise<GenerateInviteCodeResponse> => {
    return apiService.post<{ inviteCode: string }>(`/api/teams/${teamId}/invite-code`);
  },

  // Bekleyen üyeleri getir
  getPendingMembers: async (teamId: string): Promise<PendingMembersResponse> => {
    return apiService.get<TeamMember[]>(`/api/teams/${teamId}/pending-members`);
  },

  // Üyeyi onayla
  approveMember: async (teamId: string, memberData: ApproveMemberRequest): Promise<ApproveMemberResponse> => {
    return apiService.post(`/api/teams/${teamId}/approve-member`, memberData);
  },

  // Üyeyi reddet
  rejectMember: async (teamId: string, memberId: string): Promise<ApproveMemberResponse> => {
    return apiService.post(`/api/teams/${teamId}/reject-member/${memberId}`);
  },

  // Son seçili takımı kaydet
  setLastSelectedTeam: (teamId: string) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      user.preferences = user.preferences || {};
      user.preferences.lastSelectedTeam = teamId;
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  // Son seçili takımı getir
  getLastSelectedTeam: (): string | null => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.preferences?.lastSelectedTeam || null;
    }
    return null;
  }
};
