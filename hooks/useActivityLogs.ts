import { supabase } from '@/lib/supabase';

class ActivityLogger {
  // Simple log function - pass userId and role manually
  async log(userId: string, userRole: 'admin' | 'clinic' | 'user', action: string) {
    try {
      if (!userId) {
        console.log('No userId provided, skipping log');
        return;
      }

      let userName = 'Unknown User';

      // Get username based on role
      if (userRole === 'admin') {
        const { data } = await supabase
          .from('admin_profiles')
          .select('nameadmin')
          .eq('id', userId)
          .single();
        userName = data?.nameadmin || 'Admin';
      } else if (userRole === 'clinic') {
        const { data } = await supabase
          .from('clinic_profiles')
          .select('clinic_name')
          .eq('id', userId)
          .single();
        userName = data?.clinic_name || 'Unknown Clinic';
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();
        userName = data ? `${data.first_name} ${data.last_name}` : 'Unknown User';
      }

      // Insert log
      const { error } = await supabase.from('activity_logs').insert({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        action: action,
      });

      if (error) {
        console.error('Activity log insert error:', error);
      }

    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Fetch all logs (for admin)
  async fetchLogs(limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return [];
    }
  }

  // Fetch logs by role
  async fetchLogsByRole(role: 'admin' | 'clinic' | 'user', limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_role', role)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return [];
    }
  }

  // Fetch logs by specific user
  async fetchLogsByUser(userId: string, limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return [];
    }
  }
}

export const activityLogger = new ActivityLogger();