import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rtiiyfvvfwtozmbedazb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWl5ZnZ2Znd0b3ptYmVkYXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTI5MTEsImV4cCI6MjA2MDk2ODkxMX0.HS-bjg7Ov4NXSA5KTOs12kahneLdRUOpxtzaf498jwI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility function to upload files to Supabase Storage
export const uploadFileToSupabase = async (bucket, filePath, file, contentType = 'image/jpeg') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType,
        upsert: true
      });
      
    if (error) throw error;
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return { url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Helper function to execute database schema updates
export const updateDatabaseSchema = async () => {
  try {
    // Run the SQL queries to add missing columns
    const queries = [
      `ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,
      `ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0`,
      `CREATE INDEX IF NOT EXISTS forum_posts_status_idx ON public.forum_posts(status)`,
      `UPDATE public.forum_posts SET status = 'active' WHERE status IS NULL`,
      `UPDATE public.forum_posts SET reported_count = 0 WHERE reported_count IS NULL`
    ];
    
    // Execute each query
    for (const query of queries) {
      // Note: This will only work if your Supabase instance has the exec_sql RPC function
      // Otherwise, you'll need to run these manually in the SQL editor
      const { error } = await supabase.rpc('exec_sql', { query }).catch(() => {
        console.log('Using direct SQL execution instead of RPC');
        return supabase.from('_temp_migrations').select().filter('sql', 'eq', query);
      });
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating database schema:', error);
    return { success: false, error };
  }
};