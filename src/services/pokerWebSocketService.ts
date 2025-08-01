import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Environment Configuration
const WS_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'ws://localhost:8080';

class PokerWebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
  }

  connect(token) {
    const wsUrl = `${WS_BASE_URL}/ws`;
    console.log('WebSocket bağlantısı kuruluyor:', wsUrl);

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      onConnect: (frame) => {
        console.log('WebSocket bağlantısı kuruldu:', frame);
        this.isConnected = true;
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
      this.subscriptions.clear();
    }
  }

  subscribeToTeamPoker(teamId, callback) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok');
      return;
    }

    const destination = `/topic/poker/team/${teamId}`;
    const subscription = this.client.subscribe(destination, (message) => {
      const data = JSON.parse(message.body);
      callback(data);
    });

    this.subscriptions.set(`poker-${teamId}`, subscription);
    return subscription;
  }

  unsubscribeFromTeamPoker(teamId) {
    const key = `poker-${teamId}`;
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  sendJoinMessage(teamId, userId, userName) {
    if (!this.isConnected) return;

    this.client.publish({
      destination: `/app/poker/team/${teamId}/join`,
      body: JSON.stringify({
        type: 'USER_JOINED',
        userId: userId,
        userName: userName
      })
    });
  }

  sendLeaveMessage(teamId, userId, userName) {
    if (!this.isConnected) return;

    this.client.publish({
      destination: `/app/poker/team/${teamId}/leave`,
      body: JSON.stringify({
        type: 'USER_LEFT',
        userId: userId,
        userName: userName
      })
    });
  }
}

export default new PokerWebSocketService();
