import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';

export interface RemotePeerCursor {
  peerId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  selectedNodeId: string | null;
  activeFile?: string;
  lastUpdate: number;
}

// Module-level dictionary to avoid duplicate connection instances
const activeProviders = new Map<string, any>();

export class P2PCollaborationStudio {
  public ydoc: Y.Doc;
  private provider: any = null;
  private broadcastChannel: BroadcastChannel | null = null;
  public peers: Map<string, RemotePeerCursor> = new Map();
  private roomCode: string;
  private userName: string;
  private userColor: string;
  private onPeersChangeCallbacks: (() => void)[] = [];
  private onNodeSyncCallback: ((nodeId: string, nodeData: any) => void) | null = null;
  private onCodeSyncCallback: ((text: string) => void) | null = null;

  // Customizable network settings
  public networkMode: 'global-p2p' | 'local-lan' | 'custom-server' = 'global-p2p';
  public password = '********';
  public hostIp = '127.0.0.1';
  public port = 1234;
  public customServerUrl = 'wss://demos.yjs.dev';

  // For delayed initialization
  private initTimeout: any = null;

  constructor(roomCode: string, userName: string, userColor: string) {
    this.roomCode = roomCode;
    this.userName = userName;
    this.userColor = userColor;
    this.ydoc = new Y.Doc();

    // Initialize CRDT Observers synchronously so they can receive updates immediately
    try {
      // 1. CRDT Observer on shared state
      const sharedMap = this.getSharedNodes();
      sharedMap.observe((event) => {
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'add' || change.action === 'update') {
            const updatedNode = sharedMap.get(key);
            if (this.onNodeSyncCallback && updatedNode) {
              this.onNodeSyncCallback(key, updatedNode);
            }
          }
        });
      });

      // 2. C# Code Sync Observer
      const sharedText = this.getSharedCode();
      sharedText.observe(() => {
        if (this.onCodeSyncCallback) {
          this.onCodeSyncCallback(sharedText.toString());
        }
      });
    } catch (err) {
      console.warn('Sync observer registration error:', err);
    }

    // Initialize the network provider
    this.initProvider();
  }

  /**
   * Initializes the synchronization provider based on the active networkMode
   */
  private initProvider() {
    // Clear any previous init timeouts
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }

    const roomName = `devos-room-${this.roomCode}`;

    // Clean up any existing provider for this room
    this.cleanupActiveProvider();

    // Set up delayed init to prevent race conditions in React renders
    this.initTimeout = setTimeout(() => {
      try {
        if (this.networkMode === 'global-p2p') {
          // STRATEGY A: Global WebRTC P2P (Direct Connection via STUN/Signaling)
          const prov = new WebrtcProvider(roomName, this.ydoc, {
            signaling: [
              'wss://y-webrtc.as93.net',
              'wss://y-webrtc.schmied.dev',
              'wss://signaling.yjs.dev',
              'wss://y-webrtc-signaling-eu.herokuapp.com',
              'wss://y-webrtc-signaling-us.herokuapp.com'
            ],
            peerOpts: {
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' },
                  { urls: 'stun:stun2.l.google.com:19302' },
                  { urls: 'stun:stun3.l.google.com:19302' },
                  { urls: 'stun:stun4.l.google.com:19302' }
                ]
              }
            }
          });
          this.provider = prov;
          activeProviders.set(roomName, prov);

          // Configure awareness
          prov.awareness.setLocalStateField('user', {
            name: this.userName,
            color: this.userColor,
            cursor: { x: 0, y: 0 },
            selectedNodeId: null,
            activeFile: 'Form1.cs'
          });

          prov.awareness.on('change', () => this.handleAwarenessChange(prov.awareness));

        } else if (this.networkMode === 'custom-server') {
          // STRATEGY B: Centralized WebSocket Relay (100% Reliable Client-Server Sync)
          const wsUrl = `${this.customServerUrl}/${roomName}`;
          const prov = new WebsocketProvider(this.customServerUrl, roomName, this.ydoc);
          this.provider = prov;
          activeProviders.set(roomName, prov);

          // Configure awareness
          prov.awareness.setLocalStateField('user', {
            name: this.userName,
            color: this.userColor,
            cursor: { x: 0, y: 0 },
            selectedNodeId: null,
            activeFile: 'Form1.cs'
          });

          prov.awareness.on('change', () => this.handleAwarenessChange(prov.awareness));

        } else if (this.networkMode === 'local-lan') {
          // STRATEGY C: Local Cross-Tab Sync (Offline local BroadcastChannel sync)
          const channelName = `devos-local-sync-${this.roomCode}`;
          const bc = new BroadcastChannel(channelName);
          this.broadcastChannel = bc;

          // Sync initial document by requesting from other tabs
          bc.postMessage({ type: 'sync_request' });

          bc.onmessage = (event) => {
            if (!event.data) return;
            
            if (event.data.type === 'sync_request') {
              // Send current state to requesting tab
              const state = Y.encodeStateAsUpdate(this.ydoc);
              bc.postMessage({ type: 'sync_response', state });
            } else if (event.data.type === 'sync_response') {
              Y.applyUpdate(this.ydoc, event.data.state, bc);
            } else if (event.data.type === 'document_update') {
              Y.applyUpdate(this.ydoc, event.data.update, bc);
            } else if (event.data.type === 'awareness_update') {
              this.handleLocalAwarenessMessage(event.data.client, event.data.user);
            }
          };

          // Distribute local updates to other tabs
          this.ydoc.on('update', (update, origin) => {
            if (origin !== bc) {
              bc.postMessage({ type: 'document_update', update });
            }
          });

          // Simulate a basic awareness for local cross-tab mode
          this.broadcastLocalCursor(0, 0, null);
        }

        // Trigger peer change update
        this.triggerPeersChange();
      } catch (err) {
        console.error('Error initializing sync provider:', err);
      }
    }, 100);
  }

  /**
   * Cleans up the active network provider
   */
  private cleanupActiveProvider() {
    const roomName = `devos-room-${this.roomCode}`;

    if (this.provider) {
      try {
        if (this.provider.destroy) {
          this.provider.destroy();
        }
      } catch (err) {
        console.warn('Error during provider cleanup:', err);
      }
      this.provider = null;
    }

    if (activeProviders.has(roomName)) {
      const existing = activeProviders.get(roomName);
      if (existing && existing !== this.provider) {
        try {
          existing.destroy();
        } catch (e) {}
      }
      activeProviders.delete(roomName);
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (e) {}
      this.broadcastChannel = null;
    }

    this.peers.clear();
  }

  /**
   * Monitor remote awareness changes for WebRTC / WebSocket
   */
  private handleAwarenessChange(awareness: any) {
    const states = awareness.getStates();
    const currentPeers = new Map<string, RemotePeerCursor>();

    states.forEach((state: any, clientID: number) => {
      if (clientID === this.ydoc.clientID) return;

      if (state.user) {
        currentPeers.set(String(clientID), {
          peerId: String(clientID),
          name: state.user.name,
          color: state.user.color,
          x: state.user.cursor?.x || 0,
          y: state.user.cursor?.y || 0,
          selectedNodeId: state.user.selectedNodeId || null,
          activeFile: state.user.activeFile || 'Form1.cs',
          lastUpdate: Date.now()
        });
      }
    });

    this.peers = currentPeers;
    this.triggerPeersChange();
  }

  /**
   * Handle awareness updates in Local Tab Sync mode
   */
  private handleLocalAwarenessMessage(client: string, user: any) {
    if (client === String(this.ydoc.clientID)) return;

    if (user) {
      this.peers.set(client, {
        peerId: client,
        name: user.name,
        color: user.color,
        x: user.cursor?.x || 0,
        y: user.cursor?.y || 0,
        selectedNodeId: user.selectedNodeId || null,
        activeFile: user.activeFile || 'Form1.cs',
        lastUpdate: Date.now()
      });
    } else {
      this.peers.delete(client);
    }
    this.triggerPeersChange();
  }

  /**
   * Broadcast local state in Local cross-tab mode
   */
  private broadcastLocalCursor(x: number, y: number, selectedId: string | null, activeFile = 'Form1.cs') {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'awareness_update',
        client: String(this.ydoc.clientID),
        user: {
          name: this.userName,
          color: this.userColor,
          cursor: { x, y },
          selectedNodeId: selectedId,
          activeFile
        }
      });
    }
  }

  public registerOnPeersChange(cb: () => void) {
    this.onPeersChangeCallbacks.push(cb);
  }

  public registerOnNodeSync(cb: (nodeId: string, nodeData: any) => void) {
    this.onNodeSyncCallback = cb;
  }

  public registerOnCodeSync(cb: (text: string) => void) {
    this.onCodeSyncCallback = cb;
  }

  public getUserName(): string {
    return this.userName;
  }

  public getUserColor(): string {
    return this.userColor;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public configure(config: {
    mode?: 'global-p2p' | 'local-lan' | 'custom-server';
    password?: string;
    hostIp?: string;
    port?: number;
    customServerUrl?: string;
    userName?: string;
    userColor?: string;
  }) {
    let modeChanged = false;

    if (config.mode !== undefined && config.mode !== this.networkMode) {
      this.networkMode = config.mode;
      modeChanged = true;
    }
    if (config.password !== undefined) this.password = config.password;
    if (config.hostIp !== undefined) this.hostIp = config.hostIp;
    if (config.port !== undefined) this.port = config.port;
    if (config.customServerUrl !== undefined && config.customServerUrl !== this.customServerUrl) {
      this.customServerUrl = config.customServerUrl;
      modeChanged = true;
    }
    if (config.userName !== undefined) this.userName = config.userName;
    if (config.userColor !== undefined) this.userColor = config.userColor;

    if (modeChanged) {
      // Re-initialize provider on strategy switch
      this.initProvider();
    } else {
      // Just update local awareness
      if (this.provider && this.provider.awareness) {
        try {
          const state = this.provider.awareness.getLocalState() || {};
          this.provider.awareness.setLocalStateField('user', {
            name: this.userName,
            color: this.userColor,
            cursor: state.user?.cursor || { x: 0, y: 0 },
            selectedNodeId: state.user?.selectedNodeId || null,
            activeFile: state.user?.activeFile || 'Form1.cs'
          });
        } catch (err) {}
      }
      if (this.networkMode === 'local-lan') {
        this.broadcastLocalCursor(0, 0, null);
      }
    }

    this.triggerPeersChange();
  }

  private triggerPeersChange() {
    this.onPeersChangeCallbacks.forEach(cb => cb());
  }

  // Update position of local cursor to peers
  public broadcastCursor(x: number, y: number, selectedId: string | null, activeFile = 'Form1.cs'): void {
    if (this.provider && this.provider.awareness) {
      try {
        this.provider.awareness.setLocalStateField('user', {
          name: this.userName,
          color: this.userColor,
          cursor: { x, y },
          selectedNodeId: selectedId,
          activeFile
        });
      } catch (err) {
        // Safe awareness catch
      }
    }

    if (this.networkMode === 'local-lan') {
      this.broadcastLocalCursor(x, y, selectedId, activeFile);
    }
  }

  // Sync a modified node across peers using CRDT Maps
  public syncNodeUpdate(nodeId: string, nodeData: any) {
    const map = this.getSharedNodes();
    map.set(nodeId, nodeData);
  }

  // Sync a code change
  public syncCodeChange(code: string) {
    const text = this.getSharedCode();
    this.ydoc.transact(() => {
      text.delete(0, text.length);
      text.insert(0, code);
    });
  }

  // Access the CRDT Designer Node map
  public getSharedNodes(): Y.Map<any> {
    return this.ydoc.getMap('designer_nodes');
  }

  // Access the C# Code Behind text
  public getSharedCode(): Y.Text {
    return this.ydoc.getText('form1_csharp_code');
  }

  public destroy() {
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }
    this.cleanupActiveProvider();
  }
}
