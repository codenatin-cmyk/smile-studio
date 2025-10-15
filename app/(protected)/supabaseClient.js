import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xnzoxtidzexqeymiisis.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuem94dGlkemV4cWV5bWlpc2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk0MDYsImV4cCI6MjA2OTM1NTQwNn0.27zW_CmxYp1npvWlzArMGkn-j0PI8OvCk7Q-t8N7JTs";


export const supabase = createClient(supabaseUrl, supabaseAnonKey);