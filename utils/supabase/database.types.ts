export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      guests: {
        Row: {
          id: string
          status: string
          first_name: string
          last_name: string
          phone: string
          email: string | null
          visit_date: string | null
          gathering_time: string | null
          total_guests: number | null
          should_enroll_children: boolean
          vehicle_type: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_color: string | null
          food_allergies: string | null
          special_needs: string | null
          additional_notes: string | null
          photo_path: string | null
          qr_code: string | null
          code_word: string | null
          qr_expiry: string | null
          created_at: string
          updated_at: string
          pre_approved_by: string | null
          pre_approved_at: string | null
          approved_by: string | null
          approved_at: string | null
          denied_by: string | null
          denied_at: string | null
        }
        Insert: {
          id?: string
          status?: string
          first_name: string
          last_name: string
          phone: string
          email?: string | null
          visit_date?: string | null
          gathering_time?: string | null
          total_guests?: number | null
          should_enroll_children?: boolean
          vehicle_type?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_color?: string | null
          food_allergies?: string | null
          special_needs?: string | null
          additional_notes?: string | null
          photo_path?: string | null
          qr_code?: string | null
          code_word?: string | null
          qr_expiry?: string | null
          created_at?: string
          updated_at?: string
          pre_approved_by?: string | null
          pre_approved_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          denied_by?: string | null
          denied_at?: string | null
        }
        Update: {
          id?: string
          status?: string
          first_name?: string
          last_name?: string
          phone?: string
          email?: string | null
          visit_date?: string | null
          gathering_time?: string | null
          total_guests?: number | null
          should_enroll_children?: boolean
          vehicle_type?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_color?: string | null
          food_allergies?: string | null
          special_needs?: string | null
          additional_notes?: string | null
          photo_path?: string | null
          qr_code?: string | null
          code_word?: string | null
          qr_expiry?: string | null
          created_at?: string
          updated_at?: string
          pre_approved_by?: string | null
          pre_approved_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          denied_by?: string | null
          denied_at?: string | null
        }
      }
      guest_children: {
        Row: {
          id: string
          guest_id: string
          name: string
          dob: string | null
          allergies: string | null
          photo_url: string | null
        }
        Insert: {
          id?: string
          guest_id: string
          name: string
          dob?: string | null
          allergies?: string | null
          photo_url?: string | null
        }
        Update: {
          id?: string
          guest_id?: string
          name?: string
          dob?: string | null
          allergies?: string | null
          photo_url?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    CompositeTypes: {}
  }
}
