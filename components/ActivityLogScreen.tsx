// ============================================
// ACTIVITY LOG SCREEN COMPONENT
// Copy this entire file to: app/components/ActivityLogScreen.tsx
// ============================================

import { activityLogger } from '@/hooks/useActivityLogs';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ActivityLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  created_at: string;
}

const ActivityLogScreen = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'admin' | 'clinic' | 'user'>('all');

  // Fetch logs
  const fetchLogs = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let data;
      if (filter === 'all') {
        data = await activityLogger.fetchLogs(100);
      } else {
        data = await activityLogger.fetchLogsByRole(filter, 100);
      }

      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'clinic': return '#3b82f6';
      case 'user': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Get role icon
  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'clinic': return '🏥';
      case 'user': return '👤';
      default: return '❓';
    }
  };

  // Format date manually
  const formatDate = (dateString: any) => {
    const date = new Date(dateString);

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${month} ${day}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Render each log item
  const renderLogItem = ({ item }: { item: ActivityLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.roleEmoji}>{getRoleEmoji(item.user_role)}</Text>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.user_role) }]}>
              <Text style={styles.roleText}>{item.user_role}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.action}>{item.action}</Text>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading activity logs...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchLogs(true)} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Logs</Text>
        <Text style={styles.headerSubtitle}>
          {logs.length} {logs.length === 1 ? 'activity' : 'activities'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'admin' && styles.filterTabActive]}
          onPress={() => setFilter('admin')}
        >
          <Text style={[styles.filterText, filter === 'admin' && styles.filterTextActive]}>
            👑 Admins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'clinic' && styles.filterTabActive]}
          onPress={() => setFilter('clinic')}
        >
          <Text style={[styles.filterText, filter === 'clinic' && styles.filterTextActive]}>
            🏥 Clinics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'user' && styles.filterTabActive]}
          onPress={() => setFilter('user')}
        >
          <Text style={[styles.filterText, filter === 'user' && styles.filterTextActive]}>
            👤 Users
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log List */}
      {logs.length > 0 ? (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          scrollEnabled={false} // prevents nested scroll conflicts
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No activity logs yet</Text>
          <Text style={styles.emptySubtext}>
            Activities will appear here when users interact with the system
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: 'green',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  logCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  action: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 44,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ActivityLogScreen;
