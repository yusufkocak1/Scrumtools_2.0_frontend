import React, { useState, useEffect } from 'react';
import {
  type PokerSession,
  type PokerVote,
  pokerApiService
} from '../services/pokerApiService';
import PokerWebSocketService from '../services/pokerWebSocketService';

interface PokerSessionComponentProps {
  teamId: string;
  onClose: () => void;
}

const PokerSessionComponent: React.FC<PokerSessionComponentProps> = ({ teamId }) => {
  const [session, setSession] = useState<PokerSession | null>(null);
  const [votes, setVotes] = useState<PokerVote[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalEstimate, setFinalEstimate] = useState('');
  const [error, setError] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  const fibonacciNumbers = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'];

  // Get user information
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData.id;
  const userName = `${userData.firstName} ${userData.lastName}`;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    // Establish WebSocket connection
    PokerWebSocketService.connect(token);

    // Wait for the connection to be established
    const checkConnection = setInterval(() => {
      if (PokerWebSocketService.isConnectionActive()) {
        clearInterval(checkConnection);

        // Subscribe to team poker room
        PokerWebSocketService.subscribeToTeamPoker(teamId, handlePokerMessage);

        // Join the room
        PokerWebSocketService.sendJoinMessage(teamId, userId, userName);

        // Load active session
        loadActiveSession();
      }
    }, 100);

    return () => {
      clearInterval(checkConnection);
      // Cleanup
      if (PokerWebSocketService.isConnectionActive()) {
        PokerWebSocketService.sendLeaveMessage(teamId, userId, userName);
        PokerWebSocketService.unsubscribeFromTeamPoker(teamId);
        PokerWebSocketService.disconnect();
      }
    };
  }, [teamId, token, userId, userName]);

  const handlePokerMessage = (message: any) => {
    console.log('Poker message received:', message);

    switch (message.type) {
      case 'SESSION_CREATED':
      case 'SESSION_UPDATED':
        setSession(message.data || message.session);
        setVotes(message.data?.votes || message.session?.votes || []);
        setError('');
        break;

      case 'VOTE_CAST':
      case 'VOTE_UPDATED':
        if (message.data) {
          updateVotes(message.data);
        }
        setError('');
        break;

      case 'VOTES_REVEALED':
        if (message.data || message.session) {
          const sessionData = message.data || message.session;
          setSession(sessionData);
          setVotes(sessionData.votes || []);
        }
        setError('');
        break;

      case 'SESSION_COMPLETED':
        if (message.data || message.session) {
          setSession(message.data || message.session);
        }
        setError('');
        break;

      case 'VOTING_STARTED':
        if (message.data || message.session) {
          const sessionData = message.data || message.session;
          setSession(sessionData);
          setVotes(sessionData.votes || []);
          setUserVote(null); // Clear current vote when a new voting starts
        }
        setError('');
        break;

      case 'USER_JOINED':
      case 'JOIN_ROOM':
        console.log(`${message.userName} joined the poker room`);
        if (message.userName && !connectedUsers.includes(message.userName)) {
          setConnectedUsers(prev => [...prev, message.userName]);
        }
        break;

      case 'USER_LEFT':
      case 'LEAVE_ROOM':
        console.log(`${message.userName} left the poker room`);
        if (message.userName) {
          setConnectedUsers(prev => prev.filter(user => user !== message.userName));
        }
        break;

      case 'ERROR':
        setError(message.message || message.error || 'An error occurred');
        setLoading(false);
        break;

      case 'CONNECTION_STATUS':
        if (message.connectedUsers) {
          setConnectedUsers(message.connectedUsers);
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const loadActiveSession = async () => {
    try {
      const response = await pokerApiService.getActiveSession(teamId);
      if (response.success && response.data) {
        setSession(response.data);
        const votesData = response.data.votes || [];
        setVotes(votesData);

        // Check if the user has already voted
        if (votesData.length > 0) {
          const existingVote = votesData.find(v => v?.user?.id === userId);
          if (existingVote) {
            setUserVote(existingVote.voteValue);
          }
        }
      }
    } catch (error) {
      console.error('Active session could not be loaded:', error);
    }
  };

  const castVote = async (voteValue: string) => {
    if (!session || session.status !== 'VOTING') return;

    setLoading(true);
    setError('');

    try {
      // Send vote message via WebSocket
      PokerWebSocketService.sendVoteMessage(teamId, session.id, voteValue);

      // API call (backend supports both HTTP and WebSocket)
      const response = await pokerApiService.castVote({
        sessionId: session.id,
        voteValue
      });

      if (response.success) {
        setUserVote(voteValue);
      } else {
        setError(response.error || 'Vote could not be cast');
      }
    } catch (error) {
      setError('An error occurred while casting vote');
      console.error('Vote failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const revealVotes = async () => {
    if (!session) return;

    setLoading(true);
    setError('');

    try {
      // Send reveal message via WebSocket
      PokerWebSocketService.sendRevealMessage(teamId, session.id);

      // API call
      const response = await pokerApiService.revealVotes(session.id);
      if (!response.success) {
        setError(response.error || 'Votes could not be revealed');
      } else {
        // When votes are revealed, automatically set the closest Fibonacci value as final estimate
        const average = calculateAverageNumber();
        if (average > 0) {
          const closestFibonacci = getClosestFibonacci(average);
          setFinalEstimate(closestFibonacci.toString());
        }
      }
    } catch (error) {
      setError('An error occurred while revealing votes');
      console.error('Reveal votes failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async () => {
    if (!session || !finalEstimate) return;

    setLoading(true);
    setError('');

    try {
      // Send complete message via WebSocket
      PokerWebSocketService.sendCompleteSessionMessage(teamId, session.id, finalEstimate);

      // API call
      const response = await pokerApiService.completeSession(session.id, finalEstimate);
      if (!response.success) {
        setError(response.error || 'Session could not be completed');
      }
    } catch (error) {
      setError('An error occurred while completing session');
      console.error('Complete session failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVoting = async () => {
    if (!session) return;

    // Add token validation
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('StartVoting - Token:', token ? `Token exists (${token.length} characters)` : 'No token');
    console.log('StartVoting - User:', user);
    console.log('StartVoting - Session ID:', session.id);

    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    // Check token format - is it JWT?
    if (!token.includes('.')) {
      setError('Invalid token format. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send start voting message via WebSocket
      PokerWebSocketService.sendStartVotingMessage(teamId, session.id);

      // API call
      const response = await pokerApiService.startVoting(session.id);
      console.log('StartVoting Response:', response);

      if (!response.success) {
        // Clear localStorage if token is invalid
        if (response.error?.includes('token') || response.error?.includes('authentication')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('Session expired. Please refresh the page and log in again.');
        } else {
          setError(response.error || 'Voting could not be started');
        }
      }
    } catch (error) {
      console.error('StartVoting Error:', error);
      setError('An error occurred while starting voting');
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    console.log('Starting new session...');

    setLoading(true);
    setError('');

    try {
      // Create new session with automatic unique values
      const currentDate = new Date();
      const sessionNumber = Math.floor(Math.random() * 1000) + 1;

      const newSessionData = {
        teamId: teamId,
        storyTitle: `Poker Session #${sessionNumber}`,
        storyDescription: `Poker session started on ${currentDate.toLocaleDateString('en-US')} - ${currentDate.toLocaleTimeString('en-US')}`
      };

      const response = await pokerApiService.createSession(newSessionData);

      if (response.success && response.data) {
        setSession(response.data);
        setVotes([]);
        setUserVote(null);
        setFinalEstimate('');
        console.log('New session created successfully:', response.data);
      } else {
        setError(response.error || 'New session could not be created');
      }
    } catch (error) {
      setError('An error occurred while creating new session');
      console.error('New session creation failed:', error);
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
      'WAITING': { label: 'Waiting', color: 'bg-yellow-100 text-yellow-800' },
      'VOTING': { label: 'Voting', color: 'bg-blue-100 text-blue-800' },
      'REVEALED': { label: 'Revealed', color: 'bg-green-100 text-green-800' },
      'COMPLETED': { label: 'Completed', color: 'bg-gray-100 text-gray-800' }
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

  // Calculate the average as a number (for getClosestFibonacci)
  const calculateAverageNumber = () => {
    const numericVotes = votes
      .filter(vote => vote.voteValue !== '?' && !isNaN(Number(vote.voteValue)))
      .map(vote => Number(vote.voteValue));

    if (numericVotes.length === 0) return 0;

    const sum = numericVotes.reduce((acc, val) => acc + val, 0);
    return sum / numericVotes.length;
  };

  // Find the Fibonacci number closest to the average
  const getClosestFibonacci = (average: number) => {
    const fibNumbers = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

    return fibNumbers.reduce((closest, current) => {
      return Math.abs(current - average) < Math.abs(closest - average) ? current : closest;
    });
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Connected users */}
        {connectedUsers.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Users in Poker Room ({connectedUsers.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {connectedUsers.map((user, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  {user}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-center py-12">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-6 text-xl font-medium text-gray-900">No Active Poker Session</h3>
          <p className="mt-2 text-gray-500">
            Start a new poker session for story point estimation.
          </p>
          <button
            onClick={startNewSession}
            disabled={loading}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {loading ? 'Starting session...' : 'Start Poker Session'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Connected users */}
      {connectedUsers.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Users in Poker Room ({connectedUsers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {connectedUsers.map((user, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                {user}
              </span>
            ))}
          </div>
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
              Average: <span className="font-semibold">{calculateAverage()}</span> points
            </p>
          </div>
        )}
      </div>

      {/* Voting Cards */}
      {(session.status === 'VOTING' || session.status === 'WAITING') && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Fibonacci Cards</h4>
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
          Votes ({votes.length})
        </h4>
        
        {session.status === 'REVEALED' ? (
          // When votes are revealed - detailed view
          <div className="space-y-3">
            {votes.map(vote => (
              <div key={vote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-800 font-semibold text-sm">
                      {vote.user.firstName.charAt(0)}{vote.user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {vote.user.firstName} {vote.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Voted</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">
                    {vote.voteValue}
                  </span>
                  <span className="text-sm text-gray-500">points</span>
                </div>
              </div>
            ))}
            
            {/* Voting statistics */}
            {votes.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-3">Voting Statistics</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{calculateAverage()}</p>
                    <p className="text-xs text-blue-800">Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.min(...votes.filter(v => v.voteValue !== '?' && !isNaN(Number(v.voteValue))).map(v => Number(v.voteValue))) || 0}
                    </p>
                    <p className="text-xs text-blue-800">Lowest</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.max(...votes.filter(v => v.voteValue !== '?' && !isNaN(Number(v.voteValue))).map(v => Number(v.voteValue))) || 0}
                    </p>
                    <p className="text-xs text-blue-800">Highest</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // When votes are not revealed - simple view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {votes.map(vote => (
              <div key={vote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">
                  {vote.user.firstName} {vote.user.lastName}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                  ?
                </span>
              </div>
            ))}
          </div>
        )}

        {votes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2">No votes cast yet</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {session.createdBy?.id === userId && session.status === 'WAITING' && (
          <button
            onClick={startVoting}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : 'Start Voting'}
          </button>
        )}

        {session.createdBy?.id === userId && session.status === 'VOTING' && votes.length > 0 && (
          <button
            onClick={revealVotes}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Revealing...' : 'Reveal Votes'}
          </button>
        )}

        {session.createdBy?.id === userId && session.status === 'REVEALED' && (
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Final estimate (e.g: 8)"
              value={finalEstimate}
              onChange={(e) => setFinalEstimate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={completeSession}
              disabled={loading || !finalEstimate}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completing...' : 'Complete Session'}
            </button>
          </div>
        )}

        {session.createdBy?.id === userId && session.status === 'COMPLETED' && (
          <button
            onClick={startNewSession}
            disabled={loading}
            className="px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting new round...' : 'Start New Round'}
          </button>
        )}

        {session.status === 'COMPLETED' && (
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              Session completed! Final estimate: {session.finalEstimate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokerSessionComponent;
