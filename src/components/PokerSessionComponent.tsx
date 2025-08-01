import React, { useState, useEffect } from 'react';
import {
  type PokerSession,
  type PokerVote,
  pokerApiService
} from '../services/pokerApiService';
import PokerWebSocketService from '../services/pokerWebSocketService';
import CreatePokerSessionModal from './CreatePokerSessionModal';

interface PokerSessionComponentProps {
  teamId: string;
  onClose: () => void;
}

const PokerSessionComponent: React.FC<PokerSessionComponentProps> = ({ teamId, onClose }) => {
  const [session, setSession] = useState<PokerSession | null>(null);
  const [votes, setVotes] = useState<PokerVote[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [finalEstimate, setFinalEstimate] = useState('');
  const [error, setError] = useState('');

  const fibonacciNumbers = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'];

  // Kullanıcı bilgilerini al
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData.id;
  const userName = `${userData.firstName} ${userData.lastName}`;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    // WebSocket bağlantısını kur
    PokerWebSocketService.connect(token);

    // Takım poker odasına abone ol
    PokerWebSocketService.subscribeToTeamPoker(teamId, handlePokerMessage);

    // Odaya katıl
    PokerWebSocketService.sendJoinMessage(teamId, userId, userName);

    // Aktif oturumu getir
    loadActiveSession();

    return () => {
      // Temizlik
      PokerWebSocketService.sendLeaveMessage(teamId, userId, userName);
      PokerWebSocketService.unsubscribeFromTeamPoker(teamId);
      PokerWebSocketService.disconnect();
    };
  }, [teamId, token, userId, userName]);

  const handlePokerMessage = (message: any) => {
    console.log('Poker message received:', message);

    switch (message.type) {
      case 'SESSION_CREATED':
      case 'SESSION_UPDATED':
        setSession(message.data);
        setVotes(message.data.votes || []);
        break;
      case 'VOTE_CAST':
        updateVotes(message.data);
        break;
      case 'VOTES_REVEALED':
        setSession(message.data);
        setVotes(message.data.votes || []);
        break;
      case 'SESSION_COMPLETED':
        setSession(message.data);
        break;
      case 'USER_JOINED':
        console.log(`${message.userName} poker odasına katıldı`);
        break;
      case 'USER_LEFT':
        console.log(`${message.userName} poker odasından ayrıldı`);
        break;
      case 'ERROR':
        setError(message.message || 'Bir hata oluştu');
        break;
    }
  };

  const loadActiveSession = async () => {
    try {
      const response = await pokerApiService.getActiveSession(teamId);
      if (response.success && response.data) {
        setSession(response.data);
        const votesData = response.data.votes || [];
        setVotes(votesData);

        // Kullanıcının oyunu var mı kontrol et
        if (votesData.length > 0) {
          const existingVote = votesData.find(v => v?.user?.id === userId);
          if (existingVote) {
            setUserVote(existingVote.voteValue);
          }
        }
      }
    } catch (error) {
      console.error('Aktif oturum yüklenemedi:', error);
    }
  };

  const createSession = async (sessionData: any) => {
    setLoading(true);
    setError('');

    try {
      const response = await pokerApiService.createSession({
        ...sessionData,
        teamId
      });

      if (response.success && response.data) {
        setSession(response.data);
        setVotes([]);
        setUserVote(null);
      } else {
        setError(response.error || 'Oturum oluşturulamadı');
      }
    } catch (error) {
      setError('Oturum oluşturulurken bir hata oluştu');
      console.error('Oturum oluşturulamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (voteValue: string) => {
    if (!session || session.status !== 'VOTING') return;

    setLoading(true);
    setError('');

    try {
      const response = await pokerApiService.castVote({
        sessionId: session.id,
        voteValue
      });

      if (response.success) {
        setUserVote(voteValue);
      } else {
        setError(response.error || 'Oy kullanılamadı');
      }
    } catch (error) {
      setError('Oy kullanılırken bir hata oluştu');
      console.error('Oy kullanılamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const revealVotes = async () => {
    if (!session) return;

    setLoading(true);
    setError('');

    try {
      const response = await pokerApiService.revealVotes(session.id);
      if (response.success && response.data) {
        setSession(response.data);
        setVotes(response.data.votes || []);
      } else {
        setError(response.error || 'Oylar açılamadı');
      }
    } catch (error) {
      setError('Oylar açılırken bir hata oluştu');
      console.error('Oylar açılamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async () => {
    if (!session || !finalEstimate) return;

    setLoading(true);
    setError('');

    try {
      const response = await pokerApiService.completeSession(session.id, finalEstimate);
      if (response.success && response.data) {
        setSession(response.data);
      } else {
        setError(response.error || 'Oturum tamamlanamadı');
      }
    } catch (error) {
      setError('Oturum tamamlanırken bir hata oluştu');
      console.error('Oturum tamamlanamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVoting = async () => {
    if (!session) return;

    // Token kontrolü ekle
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('StartVoting - Token:', token ? `Token var (${token.length} karakter)` : 'Token yok');
    console.log('StartVoting - User:', user);
    console.log('StartVoting - Session ID:', session.id);

    if (!token) {
      setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      return;
    }

    // Token'ı kontrol et - JWT formatında mı?
    if (!token.includes('.')) {
      setError('Token formatı geçersiz. Lütfen tekrar giriş yapın.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await pokerApiService.startVoting(session.id);
      console.log('StartVoting Response:', response);

      if (response.success && response.data) {
        setSession(response.data);
      } else {
        // Token geçersizse localStorage'ı temizle
        if (response.error?.includes('token') || response.error?.includes('authentication')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('Oturum süresi dolmuş. Lütfen sayfayı yenileyip tekrar giriş yapın.');
        } else {
          setError(response.error || 'Oylama başlatılamadı');
        }
      }
    } catch (error) {
      console.error('StartVoting Error:', error);
      setError('Oylama başlatılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateVotes = (newVote: PokerVote) => {
    setVotes(prevVotes => {
      const existingVoteIndex = prevVotes.findIndex(v => v.user.id === newVote.user.id);
      if (existingVoteIndex >= 0) {
        const updatedVotes = [...prevVotes];
        updatedVotes[existingVoteIndex] = newVote;
        return updatedVotes;
      } else {
        return [...prevVotes, newVote];
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'WAITING': { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
      'VOTING': { label: 'Oylama', color: 'bg-blue-100 text-blue-800' },
      'REVEALED': { label: 'Açıldı', color: 'bg-green-100 text-green-800' },
      'COMPLETED': { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-800' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const calculateAverage = () => {
    const numericVotes = votes
      .filter(vote => vote.voteValue !== '?' && !isNaN(Number(vote.voteValue)))
      .map(vote => Number(vote.voteValue));

    if (numericVotes.length === 0) return 0;

    const sum = numericVotes.reduce((acc, val) => acc + val, 0);
    return (sum / numericVotes.length).toFixed(1);
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Scrum Poker</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center py-12">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-6 text-xl font-medium text-gray-900">Aktif Poker Oturumu Yok</h3>
          <p className="mt-2 text-gray-500">
            Story point tahminlemesi için yeni bir poker oturumu başlatın.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Poker Oturumu Başlat
          </button>
        </div>

        <CreatePokerSessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSessionCreated={createSession}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Scrum Poker</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Session Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{session.storyTitle}</h3>
            <p className="text-gray-600 mt-1">{session.storyDescription}</p>
          </div>
          {getStatusBadge(session.status)}
        </div>

        {session.status === 'REVEALED' && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Ortalama: <span className="font-semibold">{calculateAverage()}</span> point
            </p>
          </div>
        )}
      </div>

      {/* Voting Cards */}
      {(session.status === 'VOTING' || session.status === 'WAITING') && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Fibonacci Kartları</h4>
          <div className="grid grid-cols-6 md:grid-cols-11 gap-3">
            {fibonacciNumbers.map(number => (
              <button
                key={number}
                onClick={() => castVote(number)}
                disabled={loading || session.status !== 'VOTING'}
                className={`
                  aspect-[3/4] border-2 rounded-lg font-bold text-lg transition-all
                  ${userVote === number 
                    ? 'border-green-500 bg-green-500 text-white shadow-lg transform scale-105' 
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                  }
                  ${loading || session.status !== 'VOTING' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
                `}
              >
                {number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Votes Display */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Oylar ({votes.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {votes.map(vote => (
            <div key={vote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">
                {vote.user.firstName} {vote.user.lastName}
              </span>
              <span className={`
                px-3 py-1 rounded-full text-sm font-bold
                ${vote.isRevealed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
                }
              `}>
                {vote.isRevealed ? vote.voteValue : '?'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {session.createdBy?.id === userId && session.status === 'WAITING' && (
          <button
            onClick={startVoting}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Başlatılıyor...' : 'Oylama Başlat'}
          </button>
        )}

        {session.createdBy?.id === userId && session.status === 'VOTING' && votes.length > 0 && (
          <button
            onClick={revealVotes}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Açılıyor...' : 'Oyları Aç'}
          </button>
        )}

        {session.createdBy?.id === userId && session.status === 'REVEALED' && (
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Final tahmin (örn: 8)"
              value={finalEstimate}
              onChange={(e) => setFinalEstimate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={completeSession}
              disabled={loading || !finalEstimate}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Tamamlanıyor...' : 'Oturumu Tamamla'}
            </button>
          </div>
        )}

        {session.status === 'COMPLETED' && (
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              Oturum tamamlandı! Final tahmin: {session.finalEstimate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokerSessionComponent;
