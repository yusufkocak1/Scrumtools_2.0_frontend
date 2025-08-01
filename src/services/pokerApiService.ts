// Poker API Service Implementation

// Environment Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Poker Service Types
export interface PokerSession {
  id: string;
  teamId: string;
  storyTitle: string;
  storyDescription: string;
  status: 'WAITING' | 'VOTING' | 'REVEALED' | 'COMPLETED';
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  votes: PokerVote[];
  finalEstimate?: string;
  createdAt: string;
}

export interface PokerVote {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  voteValue: string;
  isRevealed: boolean;
}

export interface CreateSessionRequest {
  teamId: string;
  storyTitle: string;
  storyDescription: string;
}

export interface CreateSessionResponse {
  success: boolean;
  data?: PokerSession;
  error?: string;
}

export interface JoinSessionResponse {
  success: boolean;
  data?: PokerSession;
  error?: string;
}

export interface CastVoteRequest {
  sessionId: string;
  voteValue: string;
}

export interface CastVoteResponse {
  success: boolean;
  data?: PokerVote;
  error?: string;
}

export interface RevealVotesResponse {
  success: boolean;
  data?: PokerSession;
  error?: string;
}

export interface CompleteSessionResponse {
  success: boolean;
  data?: PokerSession;
  error?: string;
}

export interface GetActiveSessionResponse {
  success: boolean;
  data?: PokerSession;
  error?: string;
}

export interface GetTeamSessionsResponse {
  success: boolean;
  data?: PokerSession[];
  error?: string;
}

export interface StartVotingResponse {
  success: boolean;
  data?: PokerSession;
  error?: string;
}

// API Helper function
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Token varsa Authorization header'ına ekle
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('API Call - Token eklendi:', endpoint);
  } else {
    console.log('API Call - Token bulunamadı:', endpoint);
  }

  const defaultOptions: RequestInit = {
    headers,
    signal: AbortSignal.timeout(API_TIMEOUT),
  };

  const config = { ...defaultOptions, ...options };

  try {
    console.log('API Request:', url, config);
    const response = await fetch(url, config);
    console.log('API Response Status:', response.status, response.statusText);

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

// Poker API Service Implementation
export const pokerApiService = {
  // Poker oturumu oluşturma
  createSession: async (sessionData: CreateSessionRequest): Promise<CreateSessionResponse> => {
    return apiCall('/api/poker/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  // Poker oturumuna katılma
  joinSession: async (sessionId: string): Promise<JoinSessionResponse> => {
    return apiCall(`/api/poker/sessions/${sessionId}/join`, {
      method: 'POST',
    });
  },

  // Oy kullanma
  castVote: async (voteData: CastVoteRequest): Promise<CastVoteResponse> => {
    return apiCall('/api/poker/votes', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  },

  // Oyları açma
  revealVotes: async (sessionId: string): Promise<RevealVotesResponse> => {
    return apiCall(`/api/poker/sessions/${sessionId}/reveal`, {
      method: 'POST',
    });
  },

  // Oturumu tamamlama
  completeSession: async (sessionId: string, finalEstimate: string): Promise<CompleteSessionResponse> => {
    return apiCall(`/api/poker/sessions/${sessionId}/complete?finalEstimate=${finalEstimate}`, {
      method: 'POST',
    });
  },

  // Aktif oturum alma
  getActiveSession: async (teamId: string): Promise<GetActiveSessionResponse> => {
    return apiCall(`/api/poker/teams/${teamId}/active-session`, {
      method: 'GET',
    });
  },

  // Takım oturumları alma
  getTeamSessions: async (teamId: string): Promise<GetTeamSessionsResponse> => {
    return apiCall(`/api/poker/teams/${teamId}/sessions`, {
      method: 'GET',
    });
  },

  // Oylama başlatma
  startVoting: async (sessionId: string): Promise<StartVotingResponse> => {
    return apiCall(`/api/poker/sessions/${sessionId}/start-voting`, {
      method: 'POST',
    });
  },
};
