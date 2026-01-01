import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import API_BASE from '../config/api';

const PRIMARY = "#d398bc";
const REQUEST_TYPES = ['exchange', 'buy'];
const CATEGORY_OPTIONS = ['Programming', 'Networking', 'DBMS', 'AI', 'Maths', 'OS', 'Deep Learning', 'Other'];

export default function BrowseBooks() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [imageDataMap, setImageDataMap] = useState({});
  const fetchingImageFor = useRef({});
  const [requestingId, setRequestingId] = useState(null);
  const [reqType, setReqType] = useState('exchange');
  const [reqMessage, setReqMessage] = useState('');
  const [sendingId, setSendingId] = useState(null);

  /* ================= FETCH BOOKS ================= */
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE}/api/books/available`, {
        headers: { Authorization: 'Bearer ' + token },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('JSON parse error in fetchBooks:', err, 'Raw response:', text);
        throw new Error('Invalid response from server');
      }

      if (!res.ok) throw new Error(data.message || 'Failed to load books');

      const availableBooks = Array.isArray(data.books) ? data.books : [];
      setBooks(availableBooks);
      setFilteredBooks(applyFilters(availableBooks, search, categoryFilter));

    } catch (err) {
      console.error('fetchBooks error:', err);
      Alert.alert('Error', err.message || 'Could not fetch books');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  /* ================= FILTER BOOKS ================= */
  const applyFilters = (booksList, searchText, category) => {
    return booksList.filter(b => 
      (!category || b.category === category) &&
      (!searchText || b.title.toLowerCase().includes(searchText.toLowerCase()))
    );
  };

  useEffect(() => {
    setFilteredBooks(applyFilters(books, search, categoryFilter));
  }, [books, search, categoryFilter]);

  /* ================= IMAGE HANDLING ================= */
  function onImageError(id) {
    setImageErrorMap(prev => ({ ...prev, [id]: true }));

    if (Platform.OS === 'web' && !fetchingImageFor.current[id]) {
      fetchingImageFor.current[id] = true;
      fetchImageAsDataUrl(id).then((dataUrl) => {
        if (dataUrl) {
          setImageDataMap(prev => ({ ...prev, [id]: dataUrl }));
          setImageErrorMap(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      }).catch(console.warn)
        .finally(() => { fetchingImageFor.current[id] = false; });
    }
  }

  async function fetchImageAsDataUrl(bookId) {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/books/${bookId}/image`, {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });

      if (!res.ok) throw new Error('Image fetch failed: ' + res.status);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('fetchImageAsDataUrl error:', err);
      return null;
    }
  }

  /* ================= REQUEST HANDLING ================= */
  const startRequest = (bookId) => {
    setRequestingId(bookId);
    setReqType('exchange');
    setReqMessage('');
  };

  const cancelRequest = () => {
    setRequestingId(null);
    setReqType('exchange');
    setReqMessage('');
  };

  const sendRequest = async (bookId) => {
    if (!REQUEST_TYPES.includes(reqType)) {
      return Alert.alert('Validation', 'Invalid request type');
    }

    setSendingId(bookId);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = { type: reqType, message: reqMessage };
      const res = await fetch(`${API_BASE}/api/books/${bookId}/request`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Safe JSON parsing
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('JSON parse error in sendRequest:', err, 'Raw response:', text);
        throw new Error('Invalid response from server');
      }

      if (!res.ok) throw new Error(data.message || 'Failed to send request');

      Alert.alert('Success', 'Request sent');
      cancelRequest();
      fetchBooks();

    } catch (err) {
      console.error('sendRequest error:', err);
      Alert.alert('Error', err.message || 'Could not send request');
    } finally {
      setSendingId(null);
    }
  };

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item }) => {
    const dataUrl = imageDataMap[item._id];
    const imageUri = dataUrl || (item.imageUrl || `${API_BASE}/api/books/${item._id}/image`);
    const showPlaceholder = !!imageErrorMap[item._id] && !dataUrl;
    const isRequesting = requestingId === item._id;
    const isSending = sendingId === item._id;

    return (
      <View style={styles.card}>
        <View style={styles.thumbWrap}>
          {showPlaceholder ? (
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbPlaceholderText}>
                {item.title ? item.title.charAt(0).toUpperCase() : 'B'}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.thumb}
              resizeMode="cover"
              onError={() => onImageError(item._id)}
            />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
          <Text numberOfLines={2} style={styles.description}>{item.description || 'No description'}</Text>
          <Text style={styles.ownerInfo}>
            Owner: {item.owner?.name || 'Unknown'} ({item.owner?.department || ''}, Year {item.owner?.yearOfStudy || ''})
          </Text>
          <Text style={{ fontSize: 14, color: '#333', fontWeight: '600', marginTop: 4 }}>
            Rate: {item.rate != null ? String(item.rate) : '—'}
          </Text>

          {isRequesting ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ marginBottom: 6 }}>Request Type</Text>
              <View style={styles.statusRow}>
                {REQUEST_TYPES.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.statusButton, reqType === opt && styles.statusButtonActive]}
                    onPress={() => setReqType(opt)}
                  >
                    <Text style={[styles.statusButtonText, reqType === opt && styles.statusButtonTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ marginTop: 8, marginBottom: 6 }}>Message (optional)</Text>
              <TextInput
                value={reqMessage}
                onChangeText={setReqMessage}
                placeholder="Add a note..."
                style={[styles.inputInline, { marginBottom: 8 }]}
                multiline
              />

              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => sendRequest(item._id)}
                  style={[styles.saveButton, isSending && { opacity: 0.8 }]}
                  disabled={isSending}
                >
                  {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Send</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={cancelRequest}
                  style={[styles.cancelButton, { marginLeft: 8 }]}
                  disabled={isSending}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.bottomRow}>
              <TouchableOpacity style={styles.requestButton} onPress={() => startRequest(item._id)}>
                <Text style={styles.requestButtonText}>Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  /* ================= RENDER ================= */
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading available books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by book title..."
        style={styles.searchInput}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => setCategoryFilter(null)}
          style={[styles.categoryButton, !categoryFilter && styles.categoryButtonActive]}
        >
          <Text style={!categoryFilter ? styles.categoryTextActive : styles.categoryText}>All</Text>
        </TouchableOpacity>
        {CATEGORY_OPTIONS.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategoryFilter(cat)}
            style={[styles.categoryButton, categoryFilter === cat && styles.categoryButtonActive]}
          >
            <Text style={categoryFilter === cat ? styles.categoryTextActive : styles.categoryText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={item => item._id || item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await fetchBooks(); }}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Available Books</Text>
            <Text style={styles.emptySubtitle}>No books available from other users right now.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchInput: { margin: 16, padding: 12, borderRadius: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  listContainer: { padding: 16, paddingBottom: 30, flexGrow: 1 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, backgroundColor: 'white', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
  thumbWrap: { width: 90, height: 120, marginRight: 16 },
  thumb: { width: 90, height: 120, borderRadius: 8, backgroundColor: '#f5f5f5' },
  thumbPlaceholder: { width: 90, height: 120, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', opacity: 0.8 },
  thumbPlaceholderText: { fontSize: 32, color: 'white', fontWeight: '700' },
  info: { flex: 1, justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 18, color: '#2c3e50', marginBottom: 4, lineHeight: 24 },
  author: { color: '#7f8c8d', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  description: { color: '#5d6d7e', fontSize: 13, lineHeight: 18, flex: 1, marginBottom: 12 },
  ownerInfo: { color: '#5d6d7e', fontSize: 13, marginBottom: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 },
  requestButton: { backgroundColor: '#28a745', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  requestButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 8, marginBottom: 8 },
  statusButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  statusButtonText: { color: '#333' },
  statusButtonTextActive: { color: '#fff' },
  inputInline: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, minHeight: 60 },
  saveButton: { backgroundColor: '#28a745', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  cancelButton: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  cancelButtonText: { color: '#333', fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#7f8c8d', fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', padding: 32 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#2c3e50', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', lineHeight: 22 },
  categoryButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#007AFF', margin: 4 },
  categoryButtonActive: { backgroundColor: '#007AFF' },
  categoryText: { color: '#007AFF' },
  categoryTextActive: { color: '#fff' },
});
