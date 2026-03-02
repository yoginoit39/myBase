export interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  api_key: string;
  created_at: string;
  table_count: number;
}

export interface TableColumn {
  name: string;
  type: 'text' | 'integer' | 'float' | 'boolean' | 'datetime' | 'json';
  nullable: boolean;
  default?: string;
}

export interface ProjectTable {
  table_name: string;
  columns: TableColumn[];
  row_count: number;
  created_at: string;
}

export interface TableListItem {
  table_name: string;
  row_count: number;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
