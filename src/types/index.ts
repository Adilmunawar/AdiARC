export type InventoryStatus = 'Valid' | 'No Match' | 'Stripped';

export interface InventoryItem {
  id: string | null;
  fileName: string;
  fileHandle: FileSystemFileHandle;
  status: InventoryStatus;
  sourceTag: string | null;
}

export interface SQLConfig {
  server: string;
  database: string;
  user: string;
  password?: string;
}
