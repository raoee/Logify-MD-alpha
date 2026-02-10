import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Project, 
  AppView, 
  FieldDefinition, 
  PatientRecord, 
  User, 
  UserRole, 
  FieldType, 
  RecordData 
} from './types';
import { storageService } from './services/storageService';
import { validationService } from './services/validationService';
import { Html5Qrcode } from 'html5-qrcode';

// --- Icons ---
const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  LogOut: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Pencil: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Cloud: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  DevicePhone: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Install: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Share: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  WifiOff: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M12 12a3 3 0 00-2.121.879m5.657-5.657A8 8 0 008.343 5.657m11.314 5.657a8 8 0 00-11.314 0" /></svg>,
  Shield: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Barcode: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Server: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
};

// --- Custom Logo Component (Embedded SVG) ---
const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
    {/* Glass Rim */}
    <circle cx="42" cy="42" r="28" stroke="url(#logoGradient)" strokeWidth="8" />
    {/* Handle */}
    <path d="M64 64 L88 88" stroke="url(#logoGradient)" strokeWidth="10" strokeLinecap="round" />
    {/* Medical Cross */}
    <path d="M42 24 V60 M24 42 H60" stroke="url(#logoGradient)" strokeWidth="8" strokeLinecap="round" />
  </svg>
);

// --- Helper Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-gray-500 hover:bg-gray-100"
  };
  return <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} onClick={onClick} {...props}>{children}</button>;
};

const Input = ({ label, error, type = "text", options, onScan, ...props }: any) => {
  return (
    <div className="flex flex-col gap-1 mb-4">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {type === 'select' ? (
           <>
             <select 
               className={`w-full px-3 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 outline-none ${error ? 'border-red-500' : 'border-gray-300'}`} 
               {...props}
             >
               <option value="">Select an option</option>
               {options?.map((opt: string) => (
                 <option key={opt} value={opt}>{opt}</option>
               ))}
             </select>
             <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
               <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
           </>
        ) : type === 'textarea' ? (
          <textarea
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}
            rows={3}
            {...props}
          />
        ) : (
          <>
            <input 
              type={type}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white ${error ? 'border-red-500' : 'border-gray-300'} ${onScan ? 'pr-10' : ''}`} 
              {...props} 
            />
            {onScan && (
              <button 
                type="button" 
                onClick={onScan} 
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-blue-600 transition-colors"
                title="Scan Barcode"
              >
                <Icons.Barcode />
              </button>
            )}
          </>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

// --- Scanner Component ---

const ScannerModal = ({ onClose, onScanSuccess }: { onClose: () => void, onScanSuccess: (res: string) => void }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;
    
    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Success
            if (mountedRef.current) {
              // Pause the scanner to prevent more scans while we process
              html5QrCode.pause(true);
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Processing/Waiting for code - can ignore
          }
        );
      } catch (err) {
        if (mountedRef.current) {
          console.error("Error starting scanner", err);
          alert("Could not start camera. Please ensure you have granted camera permissions.");
          onClose();
        }
      }
    };

    startScanner();

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        try {
          // Attempt to stop the scanner carefully
          scannerRef.current.stop().then(() => {
             scannerRef.current?.clear();
          }).catch(err => {
             // Ignore errors if it was already stopped or never started
             console.warn("Scanner stop warning:", err);
          });
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative">
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold">Scan Barcode / QR</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full">
            <Icons.Close />
          </button>
        </div>
        <div id="reader" className="w-full h-64 bg-gray-100"></div>
        <div className="p-4 text-center text-sm text-gray-600">
          Point camera at a barcode or QR code.
        </div>
      </div>
    </div>
  );
};

// --- Feature Components ---

const InstallPrompt = ({ deferredPrompt, onInstall }: { deferredPrompt: any, onInstall: () => void }) => {
  if (!deferredPrompt) return null;

  return (
    <Button onClick={onInstall} variant="primary" className="bg-green-600 hover:bg-green-700 text-white shadow-md">
      <Icons.Install /> Install App
    </Button>
  );
};

const LoginScreen = ({ onLogin, installButton }: { onLogin: (u: User) => void, installButton?: React.ReactNode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{ meta: any, content: string } | null>(null);

  useEffect(() => {
    // Check if we need to set up the vault or just login
    setIsFirstRun(!storageService.hasVault());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const user = await storageService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials / Wrong Password');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("⚠️ CAUTION: This will DELETE ALL DATA on this device permanently.\n\nOnly do this if you have lost your password or the data is corrupted.\n\nAre you sure you want to reset the vault?")) {
      storageService.resetVault();
      window.location.reload();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const meta = storageService.inspectBackup(jsonContent);
        if (meta) {
          setPendingRestore({ meta, content: jsonContent });
          setError('');
        } else {
          setError('Invalid or incompatible backup file.');
        }
      } catch (err) {
        setError('Error reading backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmRestore = () => {
    if (!pendingRestore) return;
    const success = storageService.restoreBackup(pendingRestore.content);
    if (success) {
      alert("Backup restored successfully! Please log in with the password for that vault.");
      window.location.reload();
    } else {
      setError("Failed to restore backup.");
    }
  };

  if (pendingRestore) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Confirm Restore</h2>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 border border-blue-100">
             <h4 className="font-bold mb-2">Backup Details:</h4>
             <ul className="space-y-1 list-disc pl-4">
               <li>Date: {new Date(pendingRestore.meta.exportedAt).toLocaleDateString()}</li>
               <li>Records: {pendingRestore.meta.recordCount}</li>
               <li>Note: {pendingRestore.meta.note}</li>
             </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-xs text-yellow-800 border border-yellow-100">
            <strong>⚠️ WARNING:</strong> This will overwrite any existing data on this device. You will need the original Master Password of this backup to log in.
          </div>

          <div className="flex gap-3">
             <Button variant="secondary" onClick={() => setPendingRestore(null)} className="flex-1">Cancel</Button>
             <Button onClick={confirmRestore} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">Restore Data</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 px-4 relative">
      {installButton && (
        <div className="absolute top-4 right-4 z-10">
          {installButton}
        </div>
      )}
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full">
             <Logo className="w-20 h-20" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {isFirstRun ? "Setup Safe Vault" : "Unlock Vault"}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {isFirstRun 
            ? "Create a Master Password. Your data will be encrypted with military-grade AES-GCM." 
            : "Enter your Master Password to decrypt your data."}
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4 mb-4">
          <Input 
            label="Username" 
            placeholder="e.g. Dr. Smith" 
            value={username} 
            onChange={(e: any) => setUsername(e.target.value)} 
          />
          <Input 
            label="Master Password" 
            type="password" 
            placeholder="••••••••"
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)} 
          />
          
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isFirstRun ? 'Encrypting Vault...' : 'Decrypting...') : (isFirstRun ? 'Create Secure Vault' : 'Unlock')}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 items-center">
           <div className="relative w-full">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="secondary" className="w-full text-sm text-gray-600">
                <Icons.Upload /> Import Vault Backup
              </Button>
           </div>
           
           {!isFirstRun && (
              <button type="button" onClick={handleReset} className="text-xs text-red-400 hover:text-red-600 underline mt-2">
                Reset Vault & Delete All Data
              </button>
           )}
        </div>
      </div>
    </div>
  );
};

const DataEntryForm = ({ project, onSave, onCancel }: { project: Project, onSave: (data: any) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [scanningFieldId, setScanningFieldId] = useState<string | null>(null);

  const handleSubmit = async () => {
    const validationErrors = validationService.validateRecord(formData, project.schema.fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const handleScanSuccess = (result: string) => {
    if (scanningFieldId) {
      setFormData({ ...formData, [scanningFieldId]: result });
      setScanningFieldId(null);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-500 mb-6 border-b pb-4">New Entry for <strong>{project.name}</strong></p>
        
        <div className="space-y-4">
          {project.schema.fields.map(f => (
            <Input 
                key={f.id} 
                label={f.label} 
                placeholder={`Enter ${f.label}`}
                type={f.type}
                options={f.options}
                value={formData[f.id] || ''}
                onChange={(e: any) => setFormData({...formData, [f.id]: e.target.value})}
                error={errors[f.id]}
                onScan={f.enableScanning ? () => setScanningFieldId(f.id) : undefined}
            />
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Processing...
              </>
            ) : 'Save Securely'}
          </Button>
        </div>
      </div>
      
      {scanningFieldId && (
        <ScannerModal 
          onClose={() => setScanningFieldId(null)} 
          onScanSuccess={handleScanSuccess} 
        />
      )}
    </>
  );
};

const DataView = ({ project, onBack }: { project: Project, onBack: () => void }) => {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data from Server
  useEffect(() => {
    const fetchRecords = async () => {
       try {
         const response = await fetch(`http://localhost:3000/api/records/${project.id}`);
         const sqlRows = await response.json();

         const mappedData = sqlRows.map((row: any) => ({
           id: row.id,
           projectId: row.project_id,
           data: row.data_payload,
           createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
         }));

         setRecords(mappedData);
       } catch (e) {
         console.error("Failed to load records", e);
         alert("Could not load data from server.");
       } finally {
         setLoading(false);
       }
    };
    fetchRecords();
  }, [project.id]);

  // 2. The Export Function (Makes the Excel File)
  const handleExport = () => {
    if (records.length === 0) return alert("No data to export!");

    // A. Create the Headers (Row 1)
    // We use the Project Schema to ensure columns are in the right order
    const headers = ["Record ID", "Date Created", ...project.schema.fields.map(f => f.label)];
    
    // B. Create the Data (Rows 2+)
    const csvRows = records.map(r => {
      const createdDate = new Date(r.createdAt).toLocaleDateString();
      
      // Get data for each column defined in the schema
      const fieldValues = project.schema.fields.map(f => {
        const val = r.data[f.id] ? r.data[f.id].toString() : "";
        // Escape quotes so they don't break the CSV format
        return `"${val.replace(/"/g, '""')}"`;
      });

      return [r.id, createdDate, ...fieldValues].join(",");
    });

    // C. Combine and Download
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${project.name.replace(/\s+/g, "_")}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[50vh]">
       <div className="mb-6 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <h3 className="font-bold text-gray-800">Recorded Data ({records.length})</h3>
            {loading && <span className="text-sm text-blue-600 animate-pulse">Loading...</span>}
         </div>
         
         {/* THE NEW EXPORT BUTTON */}
         <Button onClick={handleExport} variant="secondary" className="text-sm">
           <Icons.Download /> Export to Excel
         </Button>
       </div>

       {records.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-400">
            No records found.
          </div>
       ) : (
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
               <tr>
                 {project.schema.fields.map(f => (
                   <th key={f.id} className="px-4 py-3 whitespace-nowrap">{f.label}</th>
                 ))}
                 <th className="px-4 py-3 whitespace-nowrap">Created</th>
               </tr>
             </thead>
             <tbody>
               {records.map(r => (
                 <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {project.schema.fields.map(f => (
                      <td key={f.id} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {r.data[f.id]?.toString() || '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
    </div>
  );
};

const DataSync = ({ onBack, onRestoreComplete }: { onBack: () => void, onRestoreComplete: () => void }) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pendingBackup, setPendingBackup] = useState<{ meta: any, content: string } | null>(null);
  
  // --- Server Sync State ---
  const [serverUrl, setServerUrl] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const config = storageService.getServerConfig();
    if (config.url) setServerUrl(config.url);
    if (config.secret) setApiSecret(config.secret);
  }, []);

  const handleSyncToDatabase = async () => {
    if (!serverUrl) {
      setSyncStatus('error');
      setSyncMessage('Please enter a server URL');
      return;
    }
    
    // Save config for next time
    storageService.saveServerConfig(serverUrl, apiSecret);
    
    setSyncStatus('syncing');
    setSyncMessage('');

    try {
      const result = await storageService.syncWithRemoteDB();
      if (result.success) {
        setSyncStatus('success');
        setSyncMessage(result.message);
      } else {
        setSyncStatus('error');
        setSyncMessage(result.message);
      }
    } catch (e) {
      setSyncStatus('error');
      setSyncMessage('Connection failed');
    }
  };

  const handleShareBackup = async () => {
    const backupData = storageService.createBackup();
    const fileName = `logify_secure_backup_${new Date().toISOString().split('T')[0]}.json`;
    const file = new File([backupData], fileName, { type: 'application/json' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Logify MD Encrypted Backup',
          text: 'Encrypted backup of clinical data records.',
          files: [file]
        });
      } catch (err) {
        console.error('Share failed:', err);
        downloadBackup(backupData, fileName);
      }
    } else {
      downloadBackup(backupData, fileName);
    }
  };

  const downloadBackup = (data: string, fileName: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        // Step 1: Inspect first
        const meta = storageService.inspectBackup(jsonContent);
        if (meta) {
          setPendingBackup({ meta, content: jsonContent });
          setImportStatus('idle');
        } else {
          setImportStatus('error');
        }
      } catch (err) {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!pendingBackup) return;
    
    const success = storageService.restoreBackup(pendingBackup.content);
    if (success) {
      setImportStatus('success');
      setTimeout(() => {
        onRestoreComplete();
      }, 2000);
    } else {
      setImportStatus('error');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack}><Icons.ChevronLeft /> Back</Button>
        <h2 className="text-2xl font-bold">Data Sync & Backup</h2>
      </div>

      <div className="grid gap-6">

        {/* Database Sync Section */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <Icons.Server />
            </div>
            <div>
              <h3 className="font-bold text-lg">Self-Hosted Database Sync</h3>
              <p className="text-sm text-gray-500">
                Sync data to your organization's MariaDB SQL Server.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
             <Input 
                label="Server URL" 
                placeholder="http://192.168.0.98:3000" 
                value={serverUrl} 
                onChange={(e:any) => setServerUrl(e.target.value)}
             />
             <Input 
                label="API Secret Key" 
                type="password"
                placeholder="my-secret-key" 
                value={apiSecret} 
                onChange={(e:any) => setApiSecret(e.target.value)}
             />
          </div>

          <Button onClick={handleSyncToDatabase} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={syncStatus === 'syncing'}>
             {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Database'}
          </Button>

          {syncStatus === 'success' && <p className="text-sm text-green-600 mt-2 text-center">{syncMessage}</p>}
          {syncStatus === 'error' && <p className="text-sm text-red-600 mt-2 text-center">{syncMessage}</p>}

        </div>

        {/* Export Section */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Icons.Share />
            </div>
            <div>
              <h3 className="font-bold text-lg">Export Encrypted Backup</h3>
              <p className="text-sm text-gray-500">
                Share encrypted file to <strong>Google Drive, iCloud</strong>, or Email.
              </p>
            </div>
          </div>
          <Button onClick={handleShareBackup} className="w-full">Share / Save to Drive</Button>
        </div>

        {/* Import Section */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Icons.Upload />
            </div>
            <div>
              <h3 className="font-bold text-lg">Import from Cloud / Device</h3>
              <p className="text-sm text-gray-500">Select a <strong>.json</strong> backup file from your device or cloud drive (iCloud/GDrive).</p>
            </div>
          </div>
          
          {!pendingBackup ? (
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="secondary" className="w-full">Select Backup File</Button>
              {importStatus === 'error' && <p className="text-red-600 text-sm mt-3 text-center">Invalid backup file format.</p>}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2">Backup Found:</h4>
              <ul className="text-sm text-gray-600 mb-4 space-y-1">
                <li>📅 Date: <strong>{new Date(pendingBackup.meta.exportedAt).toLocaleDateString()}</strong></li>
                <li>🔢 Records: <strong>{pendingBackup.meta.recordCount ?? 'Unknown'}</strong></li>
                <li>📝 Note: {pendingBackup.meta.note}</li>
              </ul>
              
              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded mb-4">
                 <strong>⚠️ Warning:</strong> This will <u>replace</u> all current data on this device. 
                 You must use the same Master Password that created this backup to access the data.
              </div>

              <div className="flex gap-2">
                 <Button variant="secondary" onClick={() => setPendingBackup(null)} className="flex-1">Cancel</Button>
                 <Button onClick={confirmImport} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                   Confirm Import
                 </Button>
              </div>
            </div>
          )}
          
          {importStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 text-center rounded-lg animate-pulse">
              <strong>Import Successful!</strong><br/>
              Redirecting to login...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Project Settings & Schema Editor ---

interface FieldEditorProps {
  field: FieldDefinition;
  onSave: (f: FieldDefinition) => void;
  onCancel: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onSave, onCancel }) => {
  const [data, setData] = useState<FieldDefinition>({ ...field });
  const [optionsStr, setOptionsStr] = useState(field.options?.join(', ') || '');

  const handleSubmit = () => {
    const toSave = { ...data };
    if (toSave.type === 'select') {
      toSave.options = optionsStr.split(',').map(s => s.trim()).filter(s => s);
    }
    // Clean up validation
    if (toSave.type !== 'number' && toSave.validation) {
         const { min, max, ...rest } = toSave.validation;
         toSave.validation = rest; 
    }
    onSave(toSave);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
      <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">{field.id.startsWith('f_') ? 'New Field' : 'Edit Field'}</h4>
      <Input label="Label" value={data.label} onChange={(e:any) => setData({...data, label: e.target.value})} />
      
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700">Type</label>
        <select 
          className="w-full px-3 py-2 border rounded-lg bg-white mt-1"
          value={data.type}
          onChange={(e:any) => setData({...data, type: e.target.value as FieldType})}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="select">Select (Dropdown)</option>
          <option value="boolean">Yes/No</option>
          <option value="textarea">Long Text</option>
        </select>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="req" checked={data.required} onChange={(e) => setData({...data, required: e.target.checked})} className="w-4 h-4" />
          <label htmlFor="req" className="text-sm text-gray-700">Required Field</label>
        </div>
        
        {(data.type === 'text' || data.type === 'number') && (
           <div className="flex items-center gap-2">
             <input type="checkbox" id="scan" checked={data.enableScanning} onChange={(e) => setData({...data, enableScanning: e.target.checked})} className="w-4 h-4" />
             <label htmlFor="scan" className="text-sm text-gray-700">Enable Barcode Scanner</label>
           </div>
        )}
      </div>

      {data.type === 'select' && (
        <Input 
          label="Options (comma separated)" 
          placeholder="Male, Female, Other" 
          value={optionsStr} 
          onChange={(e:any) => setOptionsStr(e.target.value)} 
        />
      )}

      {data.type === 'number' && (
        <div className="flex gap-4">
           <Input 
             label="Min Value" 
             type="number"
             value={data.validation?.min ?? ''} 
             onChange={(e:any) => setData({
                 ...data, 
                 validation: { ...data.validation, min: e.target.value ? Number(e.target.value) : undefined }
             })} 
           />
           <Input 
             label="Max Value" 
             type="number"
             value={data.validation?.max ?? ''} 
             onChange={(e:any) => setData({
                 ...data, 
                 validation: { ...data.validation, max: e.target.value ? Number(e.target.value) : undefined }
             })} 
           />
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} className="flex-1">Done</Button>
      </div>
    </div>
  );
};

const ProjectSettings = ({ project, onSave, onBack }: { project: Project, onSave: (p: Project) => void, onBack: () => void }) => {
  const [meta, setMeta] = useState({ name: project.name, description: project.description });
  const [fields, setFields] = useState<FieldDefinition[]>([...project.schema.fields]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveProject = () => {
    onSave({
      ...project,
      name: meta.name,
      description: meta.description,
      schema: { fields },
      updatedAt: Date.now()
    });
  };

  const handleUpdateField = (updated: FieldDefinition) => {
    if (isAdding) {
       setFields([...fields, updated]);
       setIsAdding(false);
    } else {
       setFields(fields.map(f => f.id === updated.id ? updated : f));
       setEditingFieldId(null);
    }
  };

  const deleteField = (id: string) => {
    if(confirm("Remove this field? Existing data for this field will be hidden.")) {
      setFields(fields.filter(f => f.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white min-h-screen sm:min-h-0 sm:rounded-xl shadow-sm">
       <div className="flex items-center gap-4 mb-6 border-b pb-4">
          <Button variant="ghost" onClick={onBack}><Icons.ChevronLeft /> Back</Button>
          <h2 className="text-2xl font-bold">Project Settings</h2>
       </div>

       <div className="space-y-6">
          <section>
             <h3 className="font-bold text-gray-800 mb-3">General Details</h3>
             <Input label="Project Name" value={meta.name} onChange={(e:any) => setMeta({...meta, name: e.target.value})} />
             <Input label="Description" type="textarea" value={meta.description} onChange={(e:any) => setMeta({...meta, description: e.target.value})} />
          </section>

          <section>
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-gray-800">Form Schema ({fields.length} Fields)</h3>
               <Button variant="secondary" className="text-xs" onClick={() => setIsAdding(true)} disabled={isAdding || !!editingFieldId}>+ Add Field</Button>
             </div>
             
             {isAdding && (
               <FieldEditor 
                 field={{ id: `f_${Date.now()}`, label: 'New Field', type: 'text' }} 
                 onSave={handleUpdateField} 
                 onCancel={() => setIsAdding(false)} 
               />
             )}

             <div className="space-y-2">
               {fields.map((f, idx) => (
                 editingFieldId === f.id ? (
                    <FieldEditor 
                      key={f.id} 
                      field={f} 
                      onSave={handleUpdateField} 
                      onCancel={() => setEditingFieldId(null)} 
                    />
                 ) : (
                    <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 group">
                       <div>
                          <div className="flex items-center gap-2">
                             <div className="font-medium text-gray-900">{f.label}</div>
                             {f.enableScanning && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Scanner</span>}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">{f.type} {f.required && '• Required'}</div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setEditingFieldId(f.id)} className="p-2 text-gray-400 hover:text-blue-600"><Icons.Pencil /></button>
                          <button onClick={() => deleteField(f.id)} className="p-2 text-gray-400 hover:text-red-600"><Icons.Trash /></button>
                       </div>
                    </div>
                 )
               ))}
             </div>
          </section>

          <div className="pt-6 mt-6 border-t flex justify-end gap-3">
             <Button variant="secondary" onClick={onBack}>Cancel</Button>
             <Button onClick={handleSaveProject}>Save Changes</Button>
          </div>
       </div>
    </div>
  );
};

const ProjectDashboard = ({ projects, onSelect, onCreate, onDelete, onSettings }: any) => (
  <div className="p-4 md:p-8 max-w-4xl mx-auto">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Projects</h2>
        <p className="text-gray-500">Manage data collection schemas</p>
      </div>
      <Button onClick={onCreate}><Icons.Plus /> New Project</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((p: Project) => (
        <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
            <div className="flex">
              <button onClick={(e) => { e.stopPropagation(); onSettings(p.id); }} className="text-gray-400 hover:text-blue-500 mr-2 p-1">
                <Icons.Settings />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="text-gray-400 hover:text-red-500 p-1">
                <Icons.Trash />
              </button>
            </div>
          </div>
          <p className="text-gray-600 mb-6 text-sm">{p.description || "No description"}</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 text-sm" onClick={() => onSelect(p.id, 'enter')}>
              Collect Data
            </Button>
            <Button variant="ghost" className="text-sm" onClick={() => onSelect(p.id, 'view')}>
              View Data
            </Button>
          </div>
        </div>
      ))}
      {projects.length === 0 && (
        <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No projects yet. Create one to start collecting data.</p>
        </div>
      )}
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('login');
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // We check for active session key in memory, not just localStorage presence
  useEffect(() => {
    if (storageService.isSessionActive()) {
      setUser(storageService.getCurrentUser());
      setView('dashboard');
      loadProjects();
    } else {
      setView('login');
    }

    const handleInstallPrompt = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const loadProjects = () => {
    setProjects(storageService.getProjects());
  };

  const handleLogin = (u: User) => {
    setUser(u);
    setView('dashboard');
    loadProjects();
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setView('login');
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: 'New Clinical Audit',
      description: 'Patient Data Collection',
      schema: {
        fields: [
          { id: 'pid', label: 'Patient MRN/ID', type: 'text', required: true, enableScanning: true },
          { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
          { id: 'age', label: 'Age (Years)', type: 'number', validation: { min: 0, max: 120 } },
          { id: 'diagnosis', label: 'Primary Diagnosis', type: 'text', required: true },
          { id: 'ward', label: 'Ward/Location', type: 'text' },
          { id: 'admissionDate', label: 'Admission Date', type: 'date' },
          { id: 'notes', label: 'Clinical Notes', type: 'textarea' }
        ]
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storageService.saveProject(newProject);
    loadProjects();
  };

  const handleUpdateProject = (updatedProject: Project) => {
    storageService.saveProject(updatedProject);
    loadProjects();
    setView('dashboard');
    setActiveProjectId('');
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Delete project and all its data?')) {
      storageService.deleteProject(id);
      loadProjects();
    }
  };

  const handleSaveRecord = async (data: any) => {
    if (!activeProjectId || !user) return;

    // 1. Prepare the Universal Payload
    // We send 'formData' which contains EVERYTHING (Age, Hb, Platelets, etc.)
    const payload = {
      projectId: activeProjectId,       
      mrn: data.pid || data.mrn || "Unknown", 
      formData: data                    
    };

    try {
      // 2. Send to your Laptop Server
      const response = await fetch('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Saved Successfully! (Record ID: " + result.id + ")");
        setView('dashboard');
        setActiveProjectId('');
      } else {
        alert("❌ Server Error: " + (result.error || "Unknown"));
      }
    } catch (err) {
      alert("❌ Connection Failed. Is 'node server.js' running?");
      console.error(err);
    }
  };

  // --- Rendering ---

  if (view === 'login') {
    return <LoginScreen onLogin={handleLogin} installButton={<InstallPrompt deferredPrompt={deferredPrompt} onInstall={handleInstallClick} />} />;
  }

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('dashboard'); setActiveProjectId(''); }}>
          <div className="bg-blue-600 p-1 rounded-lg">
             <Logo className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-gray-800 hidden sm:block">Logify MD</h1>
          {!isOnline && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
              <Icons.WifiOff /> Offline
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {deferredPrompt && (
             <Button onClick={handleInstallClick} variant="primary" className="text-xs py-1 px-3 bg-green-600 hover:bg-green-700">
               Install App
             </Button>
          )}
          <Button variant="ghost" className="p-2" onClick={() => setView('data-sync')}>
            <Icons.Cloud />
          </Button>
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden md:block">{user?.username}</span>
          </div>
          <Button variant="ghost" className="text-red-500 hover:bg-red-50 p-2" onClick={handleLogout}>
            <Icons.LogOut />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative">
        {view === 'dashboard' && (
          <ProjectDashboard 
            projects={projects} 
            onSelect={(id: string, mode: 'enter' | 'view') => {
              setActiveProjectId(id);
              setView(mode === 'enter' ? 'data-entry' : 'data-view');
            }}
            onCreate={handleCreateProject}
            onDelete={handleDeleteProject}
            onSettings={(id: string) => {
              setActiveProjectId(id);
              setView('project-settings');
            }}
          />
        )}

        {view === 'data-sync' && (
          <DataSync 
            onBack={() => setView('dashboard')} 
            onRestoreComplete={() => {
              handleLogout(); // Force relogin after restore to re-establish trust/keys
            }} 
          />
        )}

        {view === 'project-settings' && activeProject && (
          <ProjectSettings 
            project={activeProject}
            onSave={handleUpdateProject}
            onBack={() => { setView('dashboard'); setActiveProjectId(''); }}
          />
        )}

        {(view === 'data-entry' || view === 'data-view') && activeProject && (
          <div className="p-6 max-w-4xl mx-auto">
             <div className="flex items-center gap-4 mb-6">
               <Button variant="ghost" onClick={() => setView('dashboard')}><Icons.ChevronLeft /> Back</Button>
               <h2 className="text-2xl font-bold">{activeProject.name}</h2>
               <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">{view === 'data-entry' ? 'Collection Mode' : 'View Mode'}</span>
             </div>
             
             {view === 'data-entry' ? (
                <DataEntryForm 
                  project={activeProject} 
                  onSave={handleSaveRecord} 
                  onCancel={() => setView('dashboard')} 
                />
             ) : (
                <DataView 
                  project={activeProject} 
                  onBack={() => setView('dashboard')}
                />
             )}
          </div>
        )}
      </main>
    </div>
  );
}