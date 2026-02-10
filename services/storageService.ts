import { User, Project } from '../types';

const STORAGE_KEYS = {
  VAULT: 'logify_vault',
  SESSION: 'logify_session', // New key for server session
  PROJECTS: 'logify_projects',
  SERVER_CONFIG: 'logify_server_config'
};

export const storageService = {
  // --- 1. NEW SERVER METHODS (Fixes "Property 'saveUserSession' does not exist") ---
  
  saveUserSession: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
      user,
      expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
  },

  isSessionActive: (): boolean => {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessionStr) return false;
    try {
      const session = JSON.parse(sessionStr);
      if (Date.now() > session.expiry) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr).user;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // --- 2. SERVER CONFIG ---
  getServerConfig: () => {
    const str = localStorage.getItem(STORAGE_KEYS.SERVER_CONFIG);
    return str ? JSON.parse(str) : { url: '', secret: '' };
  },

  saveServerConfig: (url: string, secret: string) => {
    localStorage.setItem(STORAGE_KEYS.SERVER_CONFIG, JSON.stringify({ url, secret }));
  },

  syncWithRemoteDB: async () => {
    return { success: false, message: "Use the direct Server API instead." };
  },

  // --- 3. LEGACY / PLACEHOLDER METHODS (Fixes "Property does not exist") ---
  // These are kept empty just to stop TypeScript from crashing.

  hasVault: (): boolean => false,
  login: async (username: string, password: string): Promise<User | null> => null,
  resetVault: () => localStorage.clear(),
  createBackup: (): string => JSON.stringify({ note: "Server Mode - No Local Data" }),
  
  inspectBackup: (jsonContent: string) => {
    try {
      return { exportedAt: Date.now(), recordCount: 0, note: "Legacy Backup" };
    } catch { return null; }
  },

  restoreBackup: (jsonContent: string): boolean => {
    console.log("Restore not available in Server Mode");
    return false;
  },

  // --- 4. PROJECT METHODS (Keep these working) ---
  getProjects: (): Project[] => {
    const str = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return str ? JSON.parse(str) : [];
  },

  saveProject: (project: Project) => {
    const projects = storageService.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) projects[index] = project;
    else projects.push(project);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  deleteProject: (id: string) => {
    const projects = storageService.getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }
};