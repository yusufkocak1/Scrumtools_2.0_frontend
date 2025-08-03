import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamService, type Team } from '../services/teamService';

interface RetroItem {
  id: string;
  category: 'start' | 'stop' | 'continue';
  text: string;
  author: string;
  votes: number;
  hasVoted: boolean;
}

const RetrospectivePage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [retroItems, setRetroItems] = useState<RetroItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'start' | 'stop' | 'continue'>('start');
  const [phase, setPhase] = useState<'collecting' | 'discussing' | 'voting' | 'completed'>('collecting');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      if (!teamId) return;

      try {
        const result = await teamService.getTeamDetails(teamId);
        if (result.success && result.data) {
          setTeam(result.data);
        }
      } catch (error) {
        console.error('Error loading team:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [teamId]);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;

    const newItem: RetroItem = {
      id: Date.now().toString(),
      category: selectedCategory,
      text: newItemText,
      author: 'User', // This should be the actual username
      votes: 0,
      hasVoted: false
    };

    setRetroItems([...retroItems, newItem]);
    setNewItemText('');
  };

  const handleVote = (itemId: string) => {
    setRetroItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, votes: item.hasVoted ? item.votes - 1 : item.votes + 1, hasVoted: !item.hasVoted }
          : item
      )
    );
  };

  const getCategoryItems = (category: string) => {
    return retroItems.filter(item => item.category === category);
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'start': return 'Start Doing';
      case 'stop': return 'Stop Doing';
      case 'continue': return 'Continue Doing';
      default: return '';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'start': return 'bg-green-50 border-green-200';
      case 'stop': return 'bg-red-50 border-red-200';
      case 'continue': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPhaseButton = () => {
    switch (phase) {
      case 'collecting':
        return (
          <button
            onClick={() => setPhase('discussing')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Move to Discussion
          </button>
        );
      case 'discussing':
        return (
          <button
            onClick={() => setPhase('voting')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Move to Voting
          </button>
        );
      case 'voting':
        return (
          <button
            onClick={() => setPhase('completed')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Complete Retrospective
          </button>
        );
      case 'completed':
        return (
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Dashboard
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sprint Retrospective
            </h1>
            <p className="text-gray-600">{team?.name} - Sprint Retrospective</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              {phase === 'collecting' && 'Collecting Ideas'}
              {phase === 'discussing' && 'Discussion'}
              {phase === 'voting' && 'Voting'}
              {phase === 'completed' && 'Completed'}
            </span>
            {getPhaseButton()}
          </div>
        </div>

        {/* Add New Item - Only in collecting phase */}
        {phase === 'collecting' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Item</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="start">Start Doing</option>
                <option value="stop">Stop Doing</option>
                <option value="continue">Continue Doing</option>
              </select>
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="Item text..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddItem}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Retrospective Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {['start', 'stop', 'continue'].map((category) => (
            <div key={category} className={`bg-white rounded-lg shadow p-6 ${getCategoryColor(category)}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {category === 'start' && (
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                {category === 'stop' && (
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                )}
                {category === 'continue' && (
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {getCategoryTitle(category)}
              </h3>

              <div className="space-y-3">
                {getCategoryItems(category).map((item) => (
                  <div key={item.id} className="bg-white rounded-md p-3 shadow-sm border">
                    <p className="text-gray-800 mb-2">{item.text}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>by {item.author}</span>
                      {phase === 'voting' && (
                        <button
                          onClick={() => handleVote(item.id)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded ${
                            item.hasVoted
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{item.votes}</span>
                        </button>
                      )}
                      {(phase === 'discussing' || phase === 'completed') && item.votes > 0 && (
                        <span className="flex items-center space-x-1 text-purple-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{item.votes}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {getCategoryItems(category).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No items added yet</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Phase Instructions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {phase === 'collecting' && 'Collecting Ideas Phase'}
            {phase === 'discussing' && 'Discussion Phase'}
            {phase === 'voting' && 'Voting Phase'}
            {phase === 'completed' && 'Retrospective Completed'}
          </h3>
          <p className="text-gray-600">
            {phase === 'collecting' && 'Team members can add their ideas about the sprint.'}
            {phase === 'discussing' && 'Discuss the added items with your team.'}
            {phase === 'voting' && 'Team members vote for the most important items.'}
            {phase === 'completed' && 'Retrospective is completed. Action items have been identified and will be tracked.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetrospectivePage;
