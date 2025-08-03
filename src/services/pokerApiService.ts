// Poker API Service Implementation
import { apiService } from './apiService';

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

// Poker API Service Implementation
export const pokerApiService = {
  // Poker oturumu oluşturma
  createSession: async (sessionData: CreateSessionRequest): Promise<CreateSessionResponse> => {
    return apiService.post<PokerSession>('/api/poker/sessions', sessionData);
  },

  // Poker oturumuna katılma
  joinSession: async (sessionId: string): Promise<JoinSessionResponse> => {
    return apiService.post<PokerSession>(`/api/poker/sessions/${sessionId}/join`);
  },

  // Oy kullanma
  castVote: async (voteData: CastVoteRequest): Promise<CastVoteResponse> => {
    return apiService.post<PokerVote>('/api/poker/votes', voteData);
  },

  // Oyları açma
  revealVotes: async (sessionId: string): Promise<RevealVotesResponse> => {
    return apiService.post<PokerSession>(`/api/poker/sessions/${sessionId}/reveal`);
  },

  // Oturumu tamamlama
  completeSession: async (sessionId: string, finalEstimate: string): Promise<CompleteSessionResponse> => {
    return apiService.post<PokerSession>(`/api/poker/sessions/${sessionId}/complete?finalEstimate=${finalEstimate}`);
  },

  // Aktif oturum alma
  getActiveSession: async (teamId: string): Promise<GetActiveSessionResponse> => {
    return apiService.get<PokerSession>(`/api/poker/teams/${teamId}/active-session`);
  },

  // Takım oturumları alma
  getTeamSessions: async (teamId: string): Promise<GetTeamSessionsResponse> => {
    return apiService.get<PokerSession[]>(`/api/poker/teams/${teamId}/sessions`);
  },

  // Oylama başlatma
  startVoting: async (sessionId: string): Promise<StartVotingResponse> => {
    return apiService.post<PokerSession>(`/api/poker/sessions/${sessionId}/start-voting`);
  },
};
