import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import API_BASE from '../config/api';

const PRIMARY = "#d398bc";

export default function MyRequests() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [tab, setTab] = useState('sent');
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const sentRes = await fetch(`${API_BASE}/api/books/requests/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receivedRes = await fetch(`${API_BASE}/api/books/requests/received`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sentData = await sentRes.json();
      const receivedData = await receivedRes.json();

      setSent(sentData.requests || []);
      setReceived(receivedData.requests || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    const token = await AsyncStorage.getItem('token');
    await fetch(`${API_BASE}/api/books/requests/${id}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRequests();
  };

  const handleReject = async (id) => {
    const token = await AsyncStorage.getItem('token');
    await fetch(`${API_BASE}/api/books/requests/${id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRequests();
  };

  const data = tab === 'sent' ? sent : received;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'sent' && styles.activeTab]}
          onPress={() => setTab('sent')}
        >
          <Text style={[styles.tabText, tab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, tab === 'received' && styles.activeTab]}
          onPress={() => setTab('received')}
        >
          <Text style={[styles.tabText, tab === 'received' && styles.activeTabText]}>
            Received
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={PRIMARY} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No requests found</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {item.book?.title || 'Book'}
              </Text>

              <Text style={styles.cardStatus}>
                Status: {item.status}
              </Text>

              {tab === 'received' && item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleAccept(item._id)}>
                    <Text style={styles.acceptButton}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleReject(item._id)}>
                    <Text style={styles.rejectButton}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: PRIMARY,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  cardStatus: {
    fontSize: 14,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  acceptButton: {
    color: 'green',
    fontWeight: '600',
    marginRight: 20,
  },
  rejectButton: {
    color: 'red',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#777',
  },
});
