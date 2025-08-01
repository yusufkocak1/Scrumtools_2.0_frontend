import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PokerSessionComponent from '../components/PokerSessionComponent';

const ScrumPokerPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  if (!teamId) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PokerSessionComponent
        teamId={teamId}
        onClose={handleClose}
      />
    </div>
  );
};

export default ScrumPokerPage;
