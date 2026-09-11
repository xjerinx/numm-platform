import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

export interface AiJobProgress {
  jobId: string;
  percent: number;
  message: string;
  timestamp: string;
}

export interface AiJobCompleted {
  jobId: string;
  status: string;
  duplicatesFound: number;
  timestamp: string;
}

interface SocketState {
  socket: Socket | null;
  activeJob: AiJobProgress | null;
  lastCompletedJob: AiJobCompleted | null;
  toasts: Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning' }>;
  initSocket: () => void;
  removeToast: (id: string) => void;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning') => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  activeJob: null,
  lastCompletedJob: null,
  toasts: [],

  initSocket: () => {
    if (get().socket) return;

    const s = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('⚡ Connected to NUMM Real-time Event Hub');
    });

    s.on('ai_job_progress', (data: AiJobProgress) => {
      set({ activeJob: data });
      if (data.percent === 10 || data.percent === 55) {
        get().addToast('AI Engine Working', data.message, 'info');
      }
    });

    s.on('ai_job_completed', (data: AiJobCompleted) => {
      set({ activeJob: null, lastCompletedJob: data });
      get().addToast(
        'AI Matching Completed',
        `Discovered ${data.duplicatesFound} candidate cross-CPSE duplicate pairs.`,
        'success'
      );
    });

    set({ socket: s });
  },

  addToast: (title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString().slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type }],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
