/**
 * backup-manager.js — Automated 5-Day Full Backup & Google Drive Integration Engine
 * गौरादह नगरपालिका वडा नं. १ सिफारिस प्रणाली
 * 
 * Features:
 * 1. Automatically triggers every 5 days when any ward staff opens the portal
 * 2. Aggregates all 20 recommendation collections without deleting or modifying any data
 * 3. Saves permanent snapshot in Firestore 'system_backups' collection
 * 4. Downloads local timestamped JSON file (Ward1_Sifarish_AutoBackup_YYYY-MM-DD.json)
 * 5. Sends data to Google Drive Webhook (Google Apps Script) if configured
 * 6. Exposes window.runFullBackup(isManual) for instant manual backups anytime
 */

(function () {
    'use strict';

    const BACKUP_INTERVAL_DAYS = 5;
    const BACKUP_INTERVAL_MS = BACKUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    const LAST_BACKUP_KEY = 'ward1_last_auto_backup_timestamp';
    const GDRIVE_WEBHOOK_KEY = 'ward1_gdrive_webhook_url';

    const ALL_COLLECTIONS = [
        'yojanaBankRecords',
        'yojanaSamjhautaRecords',
        'charKillaRecords',
        'gharBatoRecords',
        'suchanaTansRecords',
        'panRecords',
        'batoPramanitRecords',
        'gharKayamRecords',
        'pariwarikRecords',
        'nabalakRecords',
        'jaggadhaniPratilipiRecords',
        'jaggadhaniPoojaRecords',
        'bargikaranSifarishRecords',
        'bibahaRecords',
        'aamdaniRecords',
        'abhilekhRecords',
        'abibahitRecords',
        'apangataRecords',
        'arkoBibahaRecords',
        'bankRecords'
    ];

    /**
     * Run Full Backup across all collections
     */
    async function runFullBackup(isManual = false) {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn('Firebase Firestore not available for backup.');
            return null;
        }

        const db = firebase.firestore();
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        console.log(`📦 [BackupManager] Starting ${isManual ? 'MANUAL' : 'AUTOMATED'} 5-day backup...`);

        const backupBundle = {
            metadata: {
                system: 'Gauradaha Municipality Ward No. 1 Sifarish CMS',
                ward: '1',
                backupDate: dateStr,
                backupTimestamp: Date.now(),
                isManual: isManual,
                version: '2.5'
            },
            collections: {},
            totalRecords: 0
        };

        try {
            for (const colName of ALL_COLLECTIONS) {
                try {
                    const snap = await db.collection(colName).get();
                    backupBundle.collections[colName] = [];
                    snap.forEach(doc => {
                        backupBundle.collections[colName].push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    backupBundle.totalRecords += snap.size;
                } catch (colErr) {
                    console.warn(`Could not read collection ${colName}:`, colErr);
                    backupBundle.collections[colName] = [];
                }
            }

            // 1. Save backup snapshot in dedicated Firestore collection
            try {
                const backupDocId = `backup_${dateStr}_${Date.now()}`;
                await db.collection('system_backups').doc(backupDocId).set({
                    ...backupBundle.metadata,
                    totalRecords: backupBundle.totalRecords,
                    collectionNames: Object.keys(backupBundle.collections),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (fsErr) {
                console.warn('Could not save to system_backups collection:', fsErr);
            }

            // 2. Local JSON File Download
            const jsonBlob = new Blob([JSON.stringify(backupBundle, null, 2)], { type: 'application/json' });
            const fileName = `Ward1_Sifarish_Backup_${dateStr}.json`;
            const downloadUrl = URL.createObjectURL(jsonBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            // 3. Send to Google Drive Webhook if configured
            const webhookUrl = localStorage.getItem(GDRIVE_WEBHOOK_KEY);
            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    console.log('☁️ Sending backup payload to Google Drive Webhook...');
                    await fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(backupBundle)
                    });
                    console.log('✅ Google Drive Webhook triggered.');
                } catch (gErr) {
                    console.warn('Google Drive Webhook error:', gErr);
                }
            }

            // Update last backup timestamp
            localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
            console.log(`✅ [BackupManager] Full backup completed. Total records: ${backupBundle.totalRecords}`);

            if (isManual) {
                alert(`✅ ब्याकअप सम्पन्न भयो!\nकुल संकलित रेकर्डहरू: ${backupBundle.totalRecords}\nफाइल: ${fileName}`);
            }

            return backupBundle;
        } catch (err) {
            console.error('Backup error:', err);
            if (isManual) {
                alert('ब्याकअप लिन समस्या भयो: ' + err.message);
            }
            return null;
        }
    }

    /**
     * Check if 5 days have elapsed and auto-trigger backup
     */
    function checkAndTriggerAutoBackup() {
        const lastBackupStr = localStorage.getItem(LAST_BACKUP_KEY);
        const lastBackup = lastBackupStr ? parseInt(lastBackupStr, 10) : 0;
        const now = Date.now();

        if (now - lastBackup >= BACKUP_INTERVAL_MS) {
            console.log(`⏰ [BackupManager] 5 days elapsed since last backup (${Math.round((now - lastBackup) / (1000 * 60 * 60 * 24))} days). Triggering auto-backup...`);
            // Run slightly deferred so page UI loads first
            setTimeout(() => {
                runFullBackup(false);
            }, 3000);
        } else {
            const daysRemaining = Math.ceil((BACKUP_INTERVAL_MS - (now - lastBackup)) / (1000 * 60 * 60 * 24));
            console.log(`ℹ️ [BackupManager] अर्को अटो-ब्याकअप ${daysRemaining} दिन पछि हुनेछ।`);
        }
    }

    // Expose to window
    window.runFullBackup = runFullBackup;
    window.getBackupStatus = function () {
        const lastBackupStr = localStorage.getItem(LAST_BACKUP_KEY);
        const lastBackup = lastBackupStr ? parseInt(lastBackupStr, 10) : 0;
        return {
            lastBackupTimestamp: lastBackup,
            lastBackupDate: lastBackup ? new Date(lastBackup).toLocaleString() : 'पहिलो पटक बाँकी',
            daysSinceLast: lastBackup ? Math.floor((Date.now() - lastBackup) / (1000 * 60 * 60 * 24)) : null,
            webhookConfigured: !!localStorage.getItem(GDRIVE_WEBHOOK_KEY)
        };
    };

    // Auto-check on page load
    window.addEventListener('DOMContentLoaded', () => {
        // Wait for Firebase to initialize
        setTimeout(checkAndTriggerAutoBackup, 2500);
    });
})();
