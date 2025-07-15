import type { ExtensionResponse } from '@/types/extension';

import { HISTORY_MESSAGES } from './constants';

/**
 * Open a history item in a new tab
 */
export async function openHistoryItem(url: string): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.tabs.create({ url }, () => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      resolve({ success: true });
    });
  });
}

/**
 * Remove a history item
 */
export async function removeHistoryItem(
  url: string
): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    chrome.history.deleteUrl({ url }, () => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      resolve({
        success: true,
        data: { message: HISTORY_MESSAGES.REMOVED_FROM_HISTORY },
      });
    });
  });
}

/**
 * Clear today's history
 */
export async function clearTodayHistory(): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    chrome.history.deleteRange(
      {
        startTime: startOfDay.getTime(),
        endTime: Date.now(),
      },
      () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        resolve({
          success: true,
          data: { message: HISTORY_MESSAGES.CLEARED_TODAY_HISTORY },
        });
      }
    );
  });
}

/**
 * Clear last hour's history
 */
export async function clearLastHourHistory(): Promise<ExtensionResponse> {
  return new Promise((resolve) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    chrome.history.deleteRange(
      {
        startTime: oneHourAgo,
        endTime: Date.now(),
      },
      () => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }

        resolve({
          success: true,
          data: { message: HISTORY_MESSAGES.CLEARED_HOUR_HISTORY },
        });
      }
    );
  });
}
