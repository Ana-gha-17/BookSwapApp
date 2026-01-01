// MyBooks.js
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

const PRIMARY = "#d398bc";
const STATUS_OPTIONS = ['available', 'requested', 'exchanged', 'sold'];

import API_BASE from '../config/api';

export default function MyBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [imageDataMap, setImageDataMap] = useState({});
  const fetchingImageFor = useRef({});

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState('');
  const [editStatus, setEditStatus] = useState('available');
  const [savingId, setSavingId] = useState(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE}/api/books`, {
        headers: { Authorization: 'Bearer ' + token },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load books');

      setBooks(Array.isArray(data.books) ? data.books : []);
    } catch (err) {
      console.error('fetchBooks error:', err);
      Alert.alert('Error', err.message || 'Could not fetch books');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDelete = useCallback(async (bookId) => {
    async function performDelete() {
      setDeletingId(bookId);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(`${API_BASE}/api/books/${bookId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        let data = null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          data = { message: await res.text() };
        }

        if (!res.ok) throw new Error(data.message || `Delete failed with status: ${res.status}`);

        setBooks(prev => prev.filter(b => b._id !== bookId));
        Alert.alert('Success', 'Book deleted successfully');
      } catch (err) {
        console.error('Delete error details:', err);
        Alert.alert('Error', err.message || 'Could not delete book');
      } finally {
        setDeletingId(null);
      }
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Delete Book\n\nAre you sure you want to delete this book? This action cannot be undone.'
      );
      if (confirmed) await performDelete();
    } else {
      Alert.alert(
        'Delete Book',
        'Are you sure you want to delete this book? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  }, []);

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
      }).catch((e) => {
        console.warn('fetchImageAsDataUrl failed', e);
      }).finally(() => {
        fetchingImageFor.current[id] = false;
      });
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

  const startEdit = (book) => {
    setEditingId(book._id);
    setEditRate(book.rate != null ? String(book.rate) : '');
    setEditStatus(book.status || 'available');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRate('');
    setEditStatus('available');
  };

  const saveEdit = async (bookId) => {
    if (editRate && isNaN(Number(editRate))) {
      return Alert.alert('Validation', 'Rate must be a number');
    }
    if (!STATUS_OPTIONS.includes(editStatus)) {
      return Alert.alert('Validation', 'Invalid status');
    }

    setSavingId(bookId);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = {
        rate: editRate === '' ? null : Number(editRate),
        status: editStatus,
      };

      // Fixed: Use PUT (backend route) instead of PATCH
      const res = await fetch(`${API_BASE}/api/books/${bookId}`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update book');

      setBooks(prev => prev.map(b => b._id === bookId ? { ...b, ...data.book } : b));

      Alert.alert('Success', 'Book updated');
      cancelEdit();
    } catch (err) {
      console.error('saveEdit error:', err);
      Alert.alert('Error', err.message || 'Could not update book');
    } finally {
      setSavingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const dataUrl = imageDataMap[item._id];
    let imageUri =
      dataUrl ||
      (item.imageUrl && item.imageUrl.length > 0
        ? item.imageUrl
        : `${API_BASE}/api/books/${item._id}/image`);

    const showPlaceholder = !!imageErrorMap[item._id] && !dataUrl;
    const isDeleting = deletingId === item._id;
    const isEditing = editingId === item._id;
    const isSaving = savingId === item._id;

    const onDeletePress = () => handleDelete(item._id);

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
          <View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
            <Text numberOfLines={2} style={styles.description}>
              {item.description || 'No description available'}
            </Text>
          </View>

          {isEditing ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ marginBottom: 6 }}>Rate (price / rent)</Text>
              <TextInput
                value={editRate}
                onChangeText={setEditRate}
                keyboardType="numeric"
                placeholder="0"
                style={[styles.inputInline, { marginBottom: 8 }]}
              />

              <Text style={{ marginBottom: 6 }}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.statusButton, editStatus === opt && styles.statusButtonActive]}
                    onPress={() => setEditStatus(opt)}
                  >
                    <Text style={[styles.statusButtonText, editStatus === opt && styles.statusButtonTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => saveEdit(item._id)}
                  style={[styles.saveButton, isSaving && { opacity: 0.8 }]}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={cancelEdit}
                  style={[styles.cancelButton, { marginLeft: 8 }]}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.bottomRow}>
              <View>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: '600' }}>
                  Rate: {item.rate != null ? String(item.rate) : '—'}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 13, color: '#666' }}>
                  Status: {item.status || 'available'}
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => startEdit(item)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                  onPress={onDeletePress}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading your books...</Text>
      </View>
    );
  }

  if (!loading && books.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Books Found</Text>
        <Text style={styles.emptySubtitle}>Add some books to your collection to see them here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={item => item._id || item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchBooks();
            }}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
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
  thumbWrap: {
    width: 90,
    height: 120,
    marginRight: 16,
  },
  thumb: {
    width: 90,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  thumbPlaceholder: {
    width: 90,
    height: 120,
    borderRadius: 8,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  thumbPlaceholderText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '700',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '700',
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 24,
  },
  author: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  description: {
    color: '#5d6d7e',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    marginBottom: 12,
  },
  actions: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#2f95dc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    color: '#333',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  inputInline: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    minWidth: 100,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});
