import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rtiiyfvvfwtozmbedazb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWl5ZnZ2Znd0b3ptYmVkYXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTI5MTEsImV4cCI6MjA2MDk2ODkxMX0.HS-bjg7Ov4NXSA5KTOs12kahneLdRUOpxtzaf498jwI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);