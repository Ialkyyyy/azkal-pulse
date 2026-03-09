import { AuditData } from "./scoring";

const HISTORY_KEY = "azkal_pulse_history";
const MAX_HISTORY = 50;

export async function saveToHistory(audit: AuditData): Promise<void> {
  const history = await getHistory();
  history.unshift(audit);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
}

export async function getHistory(): Promise<AuditData[]> {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  return result[HISTORY_KEY] || [];
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY);
}

export async function getPreviousAudit(url: string): Promise<AuditData | null> {
  const history = await getHistory();
  // Skip the first entry (it's the current audit), find the most recent one for this URL
  for (let i = 1; i < history.length; i++) {
    if (history[i].url === url) return history[i];
  }
  return null;
}
