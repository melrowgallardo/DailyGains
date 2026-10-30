import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  FileCode, 
  Copy, 
  Download, 
  Server, 
  Zap, 
  RotateCcw 
} from './icons';
import { api, DEFAULT_EXERCISES, DEFAULT_REMINDERS } from '../services/apiService';
import { audio } from '../services/audioService';

export default function Settings({ 
  isOnline, 
  setIsOnline, 
  refreshAllData,
  logs = [],
  exercises = [],
  reminders = []
}) {
  const [apiUrl, setApiUrl] = useState(api.getApiUrl());
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  const sqlSchemaCode = `-- =====================================================================
-- DailyGains Cybertech Gym Workout Monitoring Database Schema
-- Database Name: dailygains (MySQL / MariaDB on XAMPP localhost)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS \`dailygains\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`dailygains\`;

-- 1. EXERCISES
CREATE TABLE IF NOT EXISTS \`exercises\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(100) NOT NULL,
    \`category\` VARCHAR(50) NOT NULL DEFAULT 'Strength',
    \`target_muscle\` VARCHAR(50) NOT NULL DEFAULT 'Full Body',
    \`equipment\` VARCHAR(50) NOT NULL DEFAULT 'Barbell',
    \`icon\` VARCHAR(50) DEFAULT 'dumbbell',
    \`description\` VARCHAR(255) NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. WORKOUT LOGS
CREATE TABLE IF NOT EXISTS \`workout_logs\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`exercise_id\` INT NULL,
    \`exercise_name\` VARCHAR(100) NOT NULL,
    \`sets\` INT NOT NULL DEFAULT 1,
    \`reps\` INT NOT NULL DEFAULT 10,
    \`weight\` DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    \`weight_unit\` VARCHAR(10) NOT NULL DEFAULT 'kg',
    \`duration_minutes\` INT NOT NULL DEFAULT 0,
    \`calories_burned\` INT NOT NULL DEFAULT 0,
    \`rpe\` INT NOT NULL DEFAULT 8,
    \`notes\` TEXT NULL,
    \`logged_at\` DATETIME NOT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX \`idx_logged_at\` (\`logged_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. REMINDERS / PROTOCOLS
CREATE TABLE IF NOT EXISTS \`reminders\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`title\` VARCHAR(100) NOT NULL DEFAULT 'Cyber Protocol Activation',
    \`time\` VARCHAR(10) NOT NULL DEFAULT '07:00',
    \`days\` VARCHAR(100) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    \`sound\` VARCHAR(50) NOT NULL DEFAULT 'cyber-siren',
    \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  // Test Connection
  const handleTestConnection = async () => {
    audio.playClick();
    setIsTesting(true);
    setTestResult(null);

    const startTime = performance.now();
    const result = await api.checkConnection(apiUrl);
    const duration = Math.round(performance.now() - startTime);

    setIsTesting(false);
    setIsOnline(result.online);
    setTestResult({
      ...result,
      latency: duration
    });

    if (result.online) {
      audio.playSuccess();
      api.setApiUrl(apiUrl);
      refreshAllData();
    }
  };

  // Sync Local Logs to MySQL
  const handleSyncToDatabase = async () => {
    audio.playClick();
    setIsSyncing(true);
    setSyncResult(null);

    const res = await api.syncLocalLogsToDatabase();
    setIsSyncing(false);
    setSyncResult(res);

    if (res.success) {
      audio.playSuccess();
      refreshAllData();
    }
  };

  const copySqlToClipboard = () => {
    audio.playClick();
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const downloadSqlFile = () => {
    audio.playClick();
    const element = document.createElement('a');
    const file = new Blob([sqlSchemaCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'dailygains_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Settings Header */}
      <div className="cyber-panel cyber-corners" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={20} style={{ color: 'var(--cyber-cyan)' }} />
          <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
            SYSTEM CONFIGURATION & MYSQL BRIDGE
          </h2>
        </div>
        <p className="font-tech" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          PHP XAMPP REST API ENDPOINT, DATABASE MIGRATION CONTROLS, AND STORAGE SYNCHRONIZATION
        </p>
      </div>

      {/* API Endpoint Configuration */}
      <div className="cyber-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} style={{ color: 'var(--cyber-cyan)' }} />
            <span className="font-display" style={{ fontSize: '1rem', fontWeight: 800 }}>
              PHP XAMPP REST API ENDPOINT
            </span>
          </div>

          <span className={`cyber-badge ${isOnline ? 'badge-green' : 'badge-orange'}`}>
            {isOnline ? 'MYSQL CONNECTED (200 OK)' : 'OFFLINE / LOCAL STORAGE MODE'}
          </span>
        </div>

        <p className="font-tech" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Default URL for standard XAMPP deployment: <code style={{ color: 'var(--cyber-cyan)' }}>http://localhost/dailygains/api.php</code>
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="cyber-input font-mono"
            style={{ flex: '1 1 340px' }}
            placeholder="http://localhost/dailygains/api.php"
          />

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="cyber-btn cyber-btn-cyan font-display"
            style={{ padding: '10px 20px' }}
          >
            {isTesting ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
            <span>{isTesting ? 'CONNECTING...' : 'TEST CONNECTION'}</span>
          </button>
        </div>

        {/* Connection Diagnostics Banner */}
        {testResult && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '6px',
            background: testResult.online ? 'rgba(16, 245, 160, 0.08)' : 'rgba(255, 100, 0, 0.08)',
            border: `1px solid ${testResult.online ? 'var(--cyber-green)' : 'var(--cyber-orange)'}`,
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              {testResult.online ? (
                <CheckCircle size={18} style={{ color: 'var(--cyber-green)' }} />
              ) : (
                <AlertTriangle size={18} style={{ color: 'var(--cyber-orange)' }} />
              )}
              <span className="font-tech" style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: testResult.online ? 'var(--cyber-green)' : 'var(--cyber-orange)'
              }}>
                {testResult.online ? 'CONNECTION ESTABLISHED WITH XAMPP MYSQL' : 'COULD NOT REACH PHP ENDPOINT'}
              </span>
            </div>

            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '28px' }}>
              <div>Message: {testResult.message}</div>
              {testResult.data && (
                <>
                  <div>Database: {testResult.data.database}</div>
                  <div>PHP Version: {testResult.data.php_version} | Latency: {testResult.latency}ms</div>
                  <div>Records: {testResult.data.counts?.exercises || 0} exercises, {testResult.data.counts?.logs || 0} logs, {testResult.data.counts?.reminders || 0} reminders</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Deployment Path Info Box */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(2, 6, 23, 0.45)',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.82rem'
        }}>
          <div className="font-tech" style={{ fontWeight: 700, color: 'var(--cyber-orange)', marginBottom: '4px' }}>
            XAMPP HTDOCS TARGET DEPLOYMENT LOCATION:
          </div>
          <div className="font-mono" style={{ color: 'var(--cyber-cyan)' }}>
            C:\Users\Acer\xampp\htdocs\dailygains\api.php
          </div>
          <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>
            Files have already been installed directly into your XAMPP htdocs folder and database tables are auto-provisioned!
          </div>
        </div>
      </div>

      {/* Database Sync Controls */}
      <div className="cyber-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} style={{ color: 'var(--cyber-orange)' }} />
            <span className="font-display" style={{ fontSize: '1rem', fontWeight: 800 }}>
              DATABASE SYNCHRONIZATION TOOLS
            </span>
          </div>

          <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            LOCAL BUFFER: {logs.length} LOGS
          </div>
        </div>

        <p className="font-tech" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Synchronize all workout records stored in your browser to your MySQL database in a single atomic transaction.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSyncToDatabase}
            disabled={isSyncing}
            className="cyber-btn cyber-btn-orange font-display"
          >
            {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            <span>{isSyncing ? 'SYNCING RECORDS...' : 'SYNC LOCAL LOGS TO MYSQL DATABASE'}</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              refreshAllData();
            }}
            className="cyber-btn cyber-btn-ghost font-tech"
          >
            <RefreshCw size={15} />
            <span>RE-FETCH FROM SERVER</span>
          </button>
        </div>

        {syncResult && (
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '6px',
            background: syncResult.success ? 'rgba(16, 245, 160, 0.1)' : 'rgba(255, 26, 83, 0.1)',
            border: `1px solid ${syncResult.success ? 'var(--cyber-green)' : 'var(--cyber-crimson)'}`,
            fontSize: '0.85rem'
          }}>
            <span className="font-tech" style={{ fontWeight: 700, color: syncResult.success ? 'var(--cyber-green)' : 'var(--cyber-crimson)' }}>
              {syncResult.success ? 'SYNC COMPLETE: ' : 'SYNC FAILED: '}
            </span>
            <span style={{ color: 'var(--text-main)' }}>{syncResult.message}</span>
          </div>
        )}
      </div>

      {/* MySQL Schema Exporter */}
      <div className="cyber-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={18} style={{ color: 'var(--cyber-amber)' }} />
            <span className="font-display" style={{ fontSize: '1rem', fontWeight: 800 }}>
              MYSQL DATABASE SCHEMA (SCHEMA.SQL)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={copySqlToClipboard}
              className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
            >
              <Copy size={14} />
              <span>{copiedSql ? 'COPIED TO CLIPBOARD!' : 'COPY SQL'}</span>
            </button>

            <button
              onClick={downloadSqlFile}
              className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
            >
              <Download size={14} />
              <span>DOWNLOAD .SQL</span>
            </button>

            <button
              onClick={() => setShowSqlViewer(!showSqlViewer)}
              className="cyber-btn cyber-btn-cyan cyber-btn-sm font-tech"
            >
              <span>{showSqlViewer ? 'HIDE VIEWER' : 'INSPECT SCHEMA'}</span>
            </button>
          </div>
        </div>

        {showSqlViewer && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.95)',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            maxHeight: '300px'
          }}>
            <pre className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--cyber-cyan)', margin: 0 }}>
              {sqlSchemaCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
