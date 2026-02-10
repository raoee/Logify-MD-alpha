
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';

export type UserRole = 'admin' | 'entry' | 'auditor';

export interface User {
  username: string;
  role: UserRole;
}

export interface EncryptedData {
  cipherText: string;
  iv: string;
  salt: string;
}

export interface ValidationConfig {
  min?: number;
  max?: number;
  pattern?: string; // Regex string
  customErrorMessage?: string;
}

export interface FieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For 'select' type
  required?: boolean;
  validation?: ValidationConfig;
  enableScanning?: boolean; // New flag for barcode scanning
}

export interface ProjectSchema {
  fields: FieldDefinition[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  schema: ProjectSchema;
  createdAt: number;
  updatedAt: number;
}

export interface RecordData {
  [key: string]: any;
}

export interface PatientRecord {
  id: string;
  projectId: string;
  data: RecordData; 
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

// For storage, the data field is an EncryptedData object stringified
export interface StoredPatientRecord extends Omit<PatientRecord, 'data'> {
  data: EncryptedData;
}

export type AppView = 'login' | 'dashboard' | 'project-settings' | 'data-entry' | 'data-view' | 'data-sync';

export interface NavigationState {
  view: AppView;
  activeProjectId?: string;
  editingRecordId?: string;
}
