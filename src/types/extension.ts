// Core entities for extension-driven architecture

// Action that can be performed on a search result
export interface ResultAction {
  id: string;
  label: string;
  shortcut?: string; // e.g., "Enter", "Ctrl+Enter"
  primary?: boolean; // Is this the default action?
}

// Pure view entity for displaying search results
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: string; // URL or icon identifier
  actions: ResultAction[];
  type: string; // Extension-specific type for styling
  metadata?: Record<string, unknown>; // Extension-specific data
}

// Command types
export type CommandType = 'search' | 'action';

// Base command interface
export interface BaseCommand {
  id: string;
  name: string;
  description?: string;
  alias?: string[]; // e.g., ['t', 'tab'] for tab search
  icon?: string;
  type: CommandType;
  immediateAlias?: boolean; // Whether the alias triggers immediately without requiring a space (default: false)
}

// Search command - returns results based on query
export interface SearchCommand extends BaseCommand {
  type: 'search';
  placeholder?: string; // Input placeholder text
}

// Action command - executes immediately
export interface ActionCommand extends BaseCommand {
  type: 'action';
}

export type Command = SearchCommand | ActionCommand;

// Extension interface
export interface Extension {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  commands: Command[];

  // Extension lifecycle methods
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
}

// Message types for extension communication
export interface ExtensionMessage<T = unknown> {
  extensionId: string;
  commandId: string;
  type: 'execute' | 'search';
  payload: T;
}

export interface SearchPayload {
  query: string;
}

export interface ActionPayload {
  actionId: string;
  resultId?: string;
  metadata?: Record<string, unknown>;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SearchResponse extends ExtensionResponse<SearchResult[]> {
  data?: SearchResult[];
}

// State management types
export interface OmniTabState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  results: SearchResult[];
  loading: boolean;
  error?: string;
  activeExtension?: string;
  activeCommand?: string;
  availableCommands: Command[];
}

export type StateAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_INITIAL_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | {
      type: 'SET_ACTIVE_EXTENSION';
      payload: { extensionId: string; commandId: string } | undefined;
    }
  | { type: 'SET_COMMANDS'; payload: Command[] }
  | { type: 'RESET' };
