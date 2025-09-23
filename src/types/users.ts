export interface UserItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  is_active: boolean;
}