import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Environment Configuration
const WS_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'ws://localhost:8080';

class PokerWebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.currentTeamId = null;
    this.userId = null;
    this.userName = null;
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
      },
      onDisconnect: () => {
        console.log('WebSocket bağlantısı koptu');
        this.isConnected = false;
        // Bağlantı koptuğunda otomatik olarak leave mesajı gönder
        if (this.currentTeamId && this.userId && this.userName) {
          this.sendLeaveMessage(this.currentTeamId, this.userId, this.userName);
        }
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      // Çıkış mesajını gönder
      if (this.currentTeamId && this.userId && this.userName) {
        this.sendLeaveMessage(this.currentTeamId, this.userId, this.userName);
      }

      this.client.deactivate();
      this.isConnected = false;
      this.subscriptions.clear();
      this.currentTeamId = null;
      this.userId = null;
      this.userName = null;
    }
  }

  // Takım poker odasına abone ol
  subscribeToTeamPoker(teamId, callback) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok');
      return;
    }

    this.currentTeamId = teamId;

    // Takım geneli bildirimler
    const teamDestination = `/topic/poker/team/${teamId}`;
    const teamSubscription = this.client.subscribe(teamDestination, (message) => {
      const data = JSON.parse(message.body);
      console.log('Team poker message received:', data);
      callback(data);
    });

    // Kullanıcıya özel oturum bilgileri
    const sessionDestination = `/queue/poker/session`;
    const sessionSubscription = this.client.subscribe(sessionDestination, (message) => {
      const data = JSON.parse(message.body);
      console.log('Session message received:', data);
      callback(data);
    });

    // Kullanıcıya özel hata mesajları
    const errorDestination = `/queue/poker/error`;
    const errorSubscription = this.client.subscribe(errorDestination, (message) => {
      const data = JSON.parse(message.body);
      console.log('Error message received:', data);
      callback(data);
    });

    this.subscriptions.set(`poker-team-${teamId}`, teamSubscription);
    this.subscriptions.set(`poker-session-${teamId}`, sessionSubscription);
    this.subscriptions.set(`poker-error-${teamId}`, errorSubscription);

    return { teamSubscription, sessionSubscription, errorSubscription };
  }

  // Takım poker odasından çık
  unsubscribeFromTeamPoker(teamId) {
    const teamKey = `poker-team-${teamId}`;
    const sessionKey = `poker-session-${teamId}`;
    const errorKey = `poker-error-${teamId}`;

    [teamKey, sessionKey, errorKey].forEach(key => {
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(key);
      }
    });

    this.currentTeamId = null;
  }

  // Poker odasına katılım
  sendJoinMessage(teamId, userId, userName) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok - join mesajı gönderilemedi');
      return;
    }

    this.userId = userId;
    this.userName = userName;
    this.currentTeamId = teamId;

    console.log(`Poker odasına katılım mesajı gönderiliyor: ${teamId}`);

    this.client.publish({
      destination: `/app/poker/team/${teamId}/join`,
      body: JSON.stringify({
        type: 'JOIN_ROOM',
        userId: userId,
        userName: userName,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Poker odasından çıkış
  sendLeaveMessage(teamId, userId, userName) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok - leave mesajı gönderilemedi');
      return;
    }

    console.log(`Poker odasından çıkış mesajı gönderiliyor: ${teamId}`);

    this.client.publish({
      destination: `/app/poker/team/${teamId}/leave`,
      body: JSON.stringify({
        type: 'LEAVE_ROOM',
        userId: userId,
        userName: userName,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Oy kullanma
  sendVoteMessage(teamId, sessionId, voteValue) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok - vote mesajı gönderilemedi');
      return;
    }

    console.log(`Oy mesajı gönderiliyor: ${teamId}, ${sessionId}, ${voteValue}`);

    this.client.publish({
      destination: `/app/poker/team/${teamId}/vote`,
      body: JSON.stringify({
        type: 'CAST_VOTE',
        sessionId: sessionId,
        voteValue: voteValue,
        userId: this.userId,
        userName: this.userName,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Oyları açma
  sendRevealMessage(teamId, sessionId) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok - reveal mesajı gönderilemedi');
      return;
    }

    console.log(`Oyları açma mesajı gönderiliyor: ${teamId}, ${sessionId}`);

    this.client.publish({
      destination: `/app/poker/team/${teamId}/reveal`,
      body: JSON.stringify({
        type: 'REVEAL_VOTES',
        sessionId: sessionId,
        userId: this.userId,
        userName: this.userName,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Oylama başlatma
  sendStartVotingMessage(teamId, sessionId) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok - start voting mesajı gönderilemedi');
      return;
    }

    console.log(`Oylama başlatma mesajı gönderiliyor: ${teamId}, ${sessionId}`);

    this.client.publish({
      destination: `/app/poker/team/${teamId}/start-voting`,
      body: JSON.stringify({
        type: 'START_VOTING',
        sessionId: sessionId,
        userId: this.userId,
        userName: this.userName,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Oturum tamamlama
  sendCompleteSessionMessage(teamId, sessionId, finalEstimate) {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı yok - complete session mesajı gönderilemedi');
      return;
    }

    console.log(`Oturum tamamlama mesajı gönderiliyor: ${teamId}, ${sessionId}, ${finalEstimate}`);

    this.client.publish({
      destination: `/app/poker/team/${teamId}/complete`,
      body: JSON.stringify({
        type: 'COMPLETE_SESSION',
        sessionId: sessionId,
        finalEstimate: finalEstimate,
        userId: this.userId,
        userName: this.userName,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Bağlantı durumunu kontrol et
  isConnectionActive() {
    return this.isConnected && this.client && this.client.connected;
  }

  // Mevcut takım ID'sini al
  getCurrentTeamId() {
    return this.currentTeamId;
  }

  // Kullanıcı bilgilerini al
  getCurrentUser() {
    return {
      userId: this.userId,
      userName: this.userName
    };
  }
}

export default new PokerWebSocketService();
