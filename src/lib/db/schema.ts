/** Row types for the Student Explorer tables (see migrations/0003_student_explorer.sql). */
export type PlaceStatus = "pending" | "approved" | "rejected";

export interface Place {
  id: number;
  name: string;
  description: string | null;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  photo_data: string | null;
  /** "upload" = uploaded by a person, "wikipedia" / "commons" = found automatically. */
  photo_origin: "upload" | "wikipedia" | "commons" | null;
  photo_source_url: string | null;
  photo_author: string | null;
  photo_license: string | null;
  photo_license_url: string | null;
  osm_type: string | null;
  osm_id: number | null;
  osm_tags: Record<string, string> | null;
  description_source_url: string | null;
  status: PlaceStatus;
  featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: number;
  place_id: number;
  content: string;
  created_at: string;
  author: string;
}

export interface PlacePhoto {
  id: number;
  place_id: number;
  data: string;
  mime_type: string;
  created_at: string;
}

export interface Budget {
  id: number;
  name: string;
  total: number;
  expenses: { label: string; amount: number }[];
  created_at: string;
}
