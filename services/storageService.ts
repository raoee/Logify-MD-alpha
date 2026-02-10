import { Project, PatientRecord, StoredPatientRecord, User, UserRole } from '../types';
import { encryptionService } from './encryptionService';

const PROJECTS_KEY = 'medicollect_projects';
const RECORDS_KEY = 'medicollect_records';
const VAULT_META_KEY = 'medicollect_vault_meta';
const SERVER_CONFIG_KEY = 'medicollect_server_config';

/**
 * The Session Key exists ONLY in memory (RAM).
 * If the page refreshes, this is lost, and the user must login again.
 * This is the primary defense against device compromise.
 */
let _sessionKey: CryptoKey | null = null;
let _currentUser: User | null = null;

export const storageService = {
  
  /**
   * Checks if a vault already exists on this device.
   */
  hasVault: (): boolean => {
    return !!localStorage.getItem(VAULT_META_KEY);
  },

  /**
   * Attempts to "Unlock" the vault with the password.
   * Or creates a new vault if one doesn't exist.
   */
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const vaultMetaStr = localStorage.getItem(VAULT_META_KEY);

      if (!vaultMetaStr) {
        // --- FIRST RUN: CREATE VAULT ---
        const salt = encryptionService.generateSalt();
        const key = await encryptionService.deriveKey(password, salt);
        
        // Encrypt a "validation token" to verify password later
        const validation = await encryptionService.encrypt({ check: 'VALID' }, key);
        
        // Store the Salt and the Validation token publically
        const meta = {
          salt: arrayBufferToBase64(salt.buffer),
          validation: validation,
          username: username // In this simplified offline mode, we bind the vault to this username
        };
        
        localStorage.setItem(VAULT_META_KEY, JSON.stringify(meta));
        
        // Set Session
        _sessionKey = key;
        _currentUser = { username, role: 'admin' };
        return _currentUser;

      } else {
        // --- LOGIN: UNLOCK VAULT ---
        const meta = JSON.parse(vaultMetaStr);
        const salt = base64ToArrayBuffer(meta.salt);
        
        // 1. Derive key from input password
        const key = await encryptionService.deriveKey(password, salt);
        
        // 2. Attempt to decrypt the validation token
        // If password is wrong, AES-GCM will throw an error here.
        try {
          const checkObj = await encryptionService.decrypt(meta.validation, key);
          if (checkObj.check === 'VALID') {
            _sessionKey = key;
            _currentUser = { username: meta.username, role: 'admin' };
            return _currentUser;
          }
        } catch (e) {
          // Suppress the console error for wrong passwords to avoid confusion
          // console.error("Wrong password"); 
          return null;
        }
      }
      return null;
    } catch (err) {
      console.error("Login Error", err);
      return null;
    }
  },

  logout: () => {
    _sessionKey = null;
    _currentUser = null;
    // We do NOT remove localStorage, we just lose the key to read it.
  },

  /**
   * DANGER: Wipes all local data. Used when password is lost or data is corrupted.
   */
  resetVault: () => {
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(RECORDS_KEY);
    localStorage.removeItem(VAULT_META_KEY);
    localStorage.removeItem(SERVER_CONFIG_KEY);
    _sessionKey = null;
    _currentUser = null;
  },

  getCurrentUser: (): User | null => {
    return _currentUser;
  },

  isSessionActive: (): boolean => {
    return !!_sessionKey;
  },

  // --- Projects (Stored as Plain Text for schema visibility, but could be encrypted too) ---
  getProjects: (): Project[] => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveProject: (project: Project): void => {
    const projects = storageService.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  deleteProject: (id: string): void => {
    const projects = storageService.getProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  // --- Records (Encrypted) ---
  
  getRecords: async (projectId: string): Promise<PatientRecord[]> => {
    if (!_sessionKey) throw new Error("Vault locked");

    const stored = localStorage.getItem(RECORDS_KEY);
    const allStoredRecords: StoredPatientRecord[] = stored ? JSON.parse(stored) : [];
    
    const projectRecords = allStoredRecords.filter(r => r.projectId === projectId);
    
    const decryptedRecords: PatientRecord[] = [];

    for (const r of projectRecords) {
      try {
        const decryptedData = await encryptionService.decrypt(r.data, _sessionKey);
        decryptedRecords.push({
          ...r,
          data: decryptedData
        });
      } catch (e) {
        console.error(`Failed to decrypt record ${r.id}`, e);
        // We skip corrupted records rather than crashing
      }
    }
    
    return decryptedRecords;
  },

  saveRecord: async (record: PatientRecord): Promise<void> => {
    if (!_sessionKey) throw new Error("Vault locked");

    const stored = localStorage.getItem(RECORDS_KEY);
    let allRecords: StoredPatientRecord[] = stored ? JSON.parse(stored) : [];
    
    // Encrypt the sensitive data payload
    const encryptedData = await encryptionService.encrypt(record.data, _sessionKey);

    const secureRecord: StoredPatientRecord = {
      ...record,
      data: encryptedData // Replace plain object with { cipherText, iv }
    };

    const existingIndex = allRecords.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      allRecords[existingIndex] = secureRecord;
    } else {
      allRecords.push(secureRecord);
    }
    
    localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
  },

  deleteRecord: (id: string): void => {
    const stored = localStorage.getItem(RECORDS_KEY);
    let allRecords: any[] = stored ? JSON.parse(stored) : [];
    allRecords = allRecords.filter(r => r.id !== id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
  },

  // --- Backup & Restore ---
  createBackup: (): string => {
    const backup = {
      projects: JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'),
      records: JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'),
      vaultMeta: JSON.parse(localStorage.getItem(VAULT_META_KEY) || 'null'),
      metadata: {
        version: 2,
        exportedAt: new Date().toISOString(),
        app: 'Logify MD',
        note: 'Encrypted with User Password',
        recordCount: (JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]')).length
      }
    };
    return JSON.stringify(backup, null, 2);
  },

  /**
   * Peeks at a backup file string to return metadata without restoring it yet.
   */
  inspectBackup: (jsonContent: string): any | null => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data.metadata || data.metadata.app !== 'Logify MD') {
        return null;
      }
      return data.metadata;
    } catch (e) {
      return null;
    }
  },

  restoreBackup: (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      
      if (!data.metadata || data.metadata.app !== 'Logify MD') {
        throw new Error("Invalid backup file");
      }

      localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects || []));
      localStorage.setItem(RECORDS_KEY, JSON.stringify(data.records || []));
      if (data.vaultMeta) {
        localStorage.setItem(VAULT_META_KEY, JSON.stringify(data.vaultMeta));
      }
      
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  },

  // --- Remote Database Sync (MariaDB/MySQL) ---
  
  saveServerConfig: (url: string, secret: string) => {
    localStorage.setItem(SERVER_CONFIG_KEY, JSON.stringify({ url, secret }));
  },

  getServerConfig: () => {
    const data = localStorage.getItem(SERVER_CONFIG_KEY);
    return data ? JSON.parse(data) : { url: '', secret: '' };
  },

  /**
   * Syncs ALL local encrypted records to the configured remote server.
   * We send the encrypted blobs, so the server never sees plain patient data.
   */
  syncWithRemoteDB: async (): Promise<{ success: boolean; message: string }> => {
    const config = storageService.getServerConfig();
    if (!config.url) return { success: false, message: 'Server URL not configured' };

    const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');

    try {
      // Normalize URL
      const baseUrl = config.url.replace(/\/$/, ''); 
      
      const response = await fetch(`${baseUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: config.secret,
          records: records,
          projects: projects
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Server error');
      }

      return { success: true, message: result.message };
    } catch (err: any) {
      console.error("Sync Failed", err);
      return { success: false, message: err.message || 'Connection failed' };
    }
  }
};

// --- Utils ---
function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}