

















import {
  accountSummary, currentProfile, currentRecords, achievementRows, listBackups,
  linkAccount, forgetMe, restoreBackup, notePromptShown, notePromptNever,
  resolveSaveConflict, syncNow, RULES_LANDED,
} from './account.js';
import { isSyncEnabled } from './firebaseAccount.js';
import { SAVE_SYNC_ENABLED } from './gameSave.js';
import { mountAccountPanel, panelModel } from './accountPanel.js';
import { mountSavePrompt, mountConflictDialog } from './savePrompt.js';
import { localDayNumber } from './dayKey.js';







export function mountProfilePanel(host, { filter = 'all' } = {}) {
  if (!host || typeof document === 'undefined') return null;
  try {
    const nowMs = Date.now();
    const model = panelModel({
      summary: accountSummary(nowMs),
      profile: currentProfile(),
      today: localDayNumber(nowMs),
      kartRecords: currentRecords(),
      rows: achievementRows(nowMs),
      backups: listBackups(),
      syncEnabled: isSyncEnabled(),
      saveSync: SAVE_SYNC_ENABLED,
      rulesLanded: RULES_LANDED,
      filter,
    });
    return mountAccountPanel(host, model, {
      
      
      
      onLink: () => {
        const p = linkAccount();
        Promise.resolve(p).then((res) => {
          if (res?.conflict) askAboutConflict(res.conflict, () => mountProfilePanel(host, { filter }));
          else mountProfilePanel(host, { filter });
        }).catch(() => {});
      },
      onForget: () => {
        Promise.resolve(forgetMe()).finally(() => mountProfilePanel(host, { filter }));
      },
      onRestore: (index) => {
        restoreBackup(index);
        mountProfilePanel(host, { filter });
      },
      
      
      
      onSync: () => syncNow(),
    });
  } catch (_) {
    return null;
  }
}











export function showSavePrompt(host, session) {
  if (!host || typeof document === 'undefined') return false;
  try {
    if (!session?.offer?.offer) { host.textContent = ''; host.hidden = true; return false; }
    host.hidden = false;
    mountSavePrompt(host, {
      reason: session.offer.reason,
      summary: session.summary,
      justUnlocked: session.justUnlocked,
      achievementRows: session.rows,
    }, {
      onAccept: () => {
        
        const p = linkAccount();
        host.textContent = '';
        host.hidden = true;
        Promise.resolve(p).then((res) => {
          if (res?.conflict) askAboutConflict(res.conflict);
        }).catch(() => {});
      },
      onDismiss: () => { host.textContent = ''; host.hidden = true; },
      onNever: () => { notePromptNever(); host.textContent = ''; host.hidden = true; },
    });
    
    
    
    notePromptShown(session.offer.reason);
    return true;
  } catch (_) {
    return false;
  }
}









export function askAboutConflict(conflict, onDone) {
  if (!conflict || typeof document === 'undefined') return null;
  try {
    const overlay = document.createElement('div');
    overlay.className = 'account-conflict-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(8,10,14,.82);'
      + 'display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;';
    const box = document.createElement('div');
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    mountConflictDialog(box, conflict, {
      onChoose: (resolution) => {
        resolveSaveConflict(conflict, resolution);
        overlay.remove();
        try { onDone?.(); } catch (_) {  }
      },
    });
    return overlay;
  } catch (_) {
    return null;
  }
}
