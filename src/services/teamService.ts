// Team Service API Implementation

// Environment Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

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

// API Helper function
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Token varsa Authorization header'ına ekle
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const defaultOptions: RequestInit = {
    headers,
    signal: AbortSignal.timeout(API_TIMEOUT),
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Bir hata oluştu'
      };
    }

    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('API çağrısı hatası:', error);

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return {
          success: false,
          error: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
        };
      }
      if (error.name === 'TypeError') {
        return {
          success: false,
          error: 'Sunucuya bağlanılamıyor. Backend servisinin çalıştığından emin olun.'
        };
      }
    }

    return {
      success: false,
      error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
    };
  }
};

// Team Service Implementation
export const teamService = {
  // Kullanıcının üyesi olduğu takımları getir
  getUserTeams: async (): Promise<GetTeamsResponse> => {
    return apiCall('/api/teams');
  },

  // Takım detaylarını getir
  getTeamDetails: async (teamId: string): Promise<GetTeamDetailsResponse> => {
    return apiCall(`/api/teams/${teamId}`);
  },

  // Yeni takım oluştur
  createTeam: async (teamData: CreateTeamRequest): Promise<CreateTeamResponse> => {
    return apiCall('/api/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  // Takıma üye ekle
  addTeamMember: async (teamId: string, memberData: AddTeamMemberRequest): Promise<AddTeamMemberResponse> => {
    return apiCall(`/api/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Takımdan üye çıkar
  removeTeamMember: async (teamId: string, memberId: string): Promise<AddTeamMemberResponse> => {
    return apiCall(`/api/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // Takım koduna katıl
  joinTeamByCode: async (joinData: JoinTeamRequest): Promise<JoinTeamResponse> => {
    return apiCall('/api/teams/join', {
      method: 'POST',
      body: JSON.stringify(joinData),
    });
  },

  // Davet kodu oluştur
  generateInviteCode: async (teamId: string): Promise<GenerateInviteCodeResponse> => {
    return apiCall(`/api/teams/${teamId}/invite-code`, {
      method: 'POST',
    });
  },

  // Bekleyen üyeleri getir
  getPendingMembers: async (teamId: string): Promise<PendingMembersResponse> => {
    return apiCall(`/api/teams/${teamId}/pending-members`);
  },

  // Üyeyi onayla
  approveMember: async (teamId: string, memberData: ApproveMemberRequest): Promise<ApproveMemberResponse> => {
    return apiCall(`/api/teams/${teamId}/approve-member`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Üyeyi reddet
  rejectMember: async (teamId: string, memberId: string): Promise<ApproveMemberResponse> => {
    return apiCall(`/api/teams/${teamId}/reject-member/${memberId}`, {
      method: 'POST',
    });
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
