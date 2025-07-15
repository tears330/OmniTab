export type SearchResultType = 'tab' | 'history' | 'bookmark';

export interface BaseSearchResult {
  id: string | number;
  title: string;
  url: string;
  favIconUrl: string;
  type: SearchResultType;
}

export interface TabSearchResult extends BaseSearchResult {
  id: number;
  type: 'tab';
  windowId: number;
}

export interface HistorySearchResult extends BaseSearchResult {
  id: string;
  type: 'history';
  visitCount?: number;
  lastVisitTime?: number;
}

export interface BookmarkSearchResult extends BaseSearchResult {
  id: string;
  type: 'bookmark';
  dateAdded?: number;
}

export type SearchResult =
  | TabSearchResult
  | HistorySearchResult
  | BookmarkSearchResult;

// Message types for communication between content script and background
export interface SearchTabsMessage {
  action: 'search-tabs';
  searchTerm: string;
}

export interface SearchTabsResponse {
  results: SearchResult[];
}

export interface SwitchTabMessage {
  action: 'switch-tab';
  tabId: number;
  windowId: number;
}

export interface OpenUrlMessage {
  action: 'open-url';
  url: string;
}

export interface CloseTabMessage {
  action: 'close-tab';
  tabId: number;
}

export interface ToggleOmniTabMessage {
  action: 'toggle-omnitab';
}

export interface SuccessResponse {
  success: boolean;
}

export type BackgroundMessage =
  | SearchTabsMessage
  | SwitchTabMessage
  | OpenUrlMessage
  | CloseTabMessage;

export type ContentMessage = ToggleOmniTabMessage;

export type MessageResponse = SearchTabsResponse | SuccessResponse;

// Re-export search types
export * from './search';
