import { createClient } from '@supabase/supabase-js';

const url = 'https://qbyyqkpdqzqquyyzehny.supabase.co';
const key = 'sb_publishable_redpla1rHZP42cqf_KIHqg_l-WrThFZ';

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
