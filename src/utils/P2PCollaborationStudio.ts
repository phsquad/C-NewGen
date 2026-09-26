import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

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

// Module-level dictionary to avoid duplicate WebRTC connection instances
const activeProviders = new Map<string, any>();

export class P2PCollaborationStudio {
  public ydoc: Y.Doc;
  private provider: any = null;
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
  public hostIp = '192.168.1.105';
  public port = 8080;
  public customServerUrl = 'wss://signaling.yjs.dev';

  // For simulation and delayed init
  private simInterval: any = null;
  private initTimeout: any = null;

  constructor(roomCode: string, userName: string, userColor: string) {
    this.roomCode = roomCode;
    this.userName = userName;
    this.userColor = userColor;
    this.ydoc = new Y.Doc();

    const roomName = `devos-room-${roomCode}`;

    // Safely check and destroy existing provider for this room to prevent duplicate connection error
    if (activeProviders.has(roomName)) {
      const existing = activeProviders.get(roomName);
      if (existing) {
        try {
          if (existing.room) {
            existing.destroy();
          }
        } catch (err) {
          console.warn('Silent cleanup of existing provider:', err);
        }
      }
      activeProviders.delete(roomName);
    }

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

    // Delay the actual WebRTC provider creation to the next tick (100ms) to allow
    // the asynchronous rooms.delete(roomName) of any destroyed provider to complete!
    this.initTimeout = setTimeout(() => {
      try {
        // Initialize WebRTC P2P DataChannel provider
        const prov = new WebrtcProvider(roomName, this.ydoc, {
          signaling: [
            'wss://signaling.yjs.dev',
            'wss://y-webrtc-signaling-eu.herokuapp.com',
            'wss://y-webrtc-signaling-us.herokuapp.com',
            'wss://y-webrtc.schmied.dev'
          ]
        });
        this.provider = prov;
        activeProviders.set(roomName, prov);

        // Set Local awareness state
        this.provider.awareness.setLocalStateField('user', {
          name: userName,
          color: userColor,
          cursor: { x: 0, y: 0 },
          selectedNodeId: null,
          activeFile: 'Form1.cs'
        });

        // Monitor remote awareness changes
        this.provider.awareness.on('change', () => {
          if (!this.provider) return;
          const states = this.provider.awareness.getStates();
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
        });
      } catch (e) {
        console.warn('WebRTC signal setup delayed init caught:', e);
      }
    }, 100);
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
    if (config.mode !== undefined) this.networkMode = config.mode;
    if (config.password !== undefined) this.password = config.password;
    if (config.hostIp !== undefined) this.hostIp = config.hostIp;
    if (config.port !== undefined) this.port = config.port;
    if (config.customServerUrl !== undefined) this.customServerUrl = config.customServerUrl;
    if (config.userName !== undefined) this.userName = config.userName;
    if (config.userColor !== undefined) this.userColor = config.userColor;

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
    if (this.simInterval) {
      clearInterval(this.simInterval);
    }
    const roomName = `devos-room-${this.roomCode}`;
    if (this.provider) {
      try {
        // Prevent calling destroy() when this.room is null to fix:
        // "can't access property 'destroy', this.room is null"
        if (this.provider.room) {
          this.provider.destroy();
        }
      } catch (err) {
        console.warn('Provider destroy caught:', err);
      }
      activeProviders.delete(roomName);
      this.provider = null;
    }
  }
}
