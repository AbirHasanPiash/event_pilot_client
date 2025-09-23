export type Category = {
  id: number;
  name?: string;
  description?: string;
} | null;

export interface Event {
  id: number;
  organizer: number; // or string if you serialize differently
  organizer_name: string;

  title: string;
  description: string;
  category?: Category | null;
  category_id?: number | null;
  tags: string[];
  image?: string | null;

  start_time: string;
  end_time: string;
  venue: string;
  location_map_url: string;
  visibility: string;
  status: string;
  capacity: number | null;
  allow_waitlist: boolean;

  attending_count: number;
  interested_count: number;
  reaction_status?: string | null;

  created_at: string;
  updated_at: string;
}

export type AdminEventForm = {
  id?: number | null;
  title: string;
  description: string;
  category?: Category;
  tags: string[];
  image: File | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  location_map_url: string;
  visibility: string;
  status: string;
  capacity: number | null;
  allow_waitlist: boolean;
};

export type EventFormData = {
  id?: number | null;
  title: string;
  description: string;
  category?: Category;
  tags: string[];
  image: File | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  location_map_url: string;
  visibility: string;
  status: string;
  capacity: number | null;
  allow_waitlist: boolean;
};
