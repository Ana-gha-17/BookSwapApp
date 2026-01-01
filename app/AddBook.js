// AddBook.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import API_BASE from '../config/api';

const STATUS_OPTIONS = ['available', 'requested', 'exchanged', 'sold'];
const CATEGORY_OPTIONS = ['Programming', 'Networking', 'DBMS', 'AI', 'Maths', 'OS', 'Deep Learning', 'Other'];

export default function AddBook() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [edition, setEdition] = useState('');
  const [isbn, setIsbn] = useState('');
  const [condition, setCondition] = useState('');
  const [yearOfPublication, setYearOfPublication] = useState('');
  const [department, setDepartment] = useState('');
  const [rate, setRate] = useState('');
  const [status, setStatus] = useState('available');
  const [category, setCategory] = useState('Programming');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= IMAGE PICK ================= */
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const name = uri.split('/').pop();

    setImage({
      uri,
      name,
      type: 'image/jpeg',
    });
  }

  /* ================= SUBMIT ================= */
  async function handleSubmit() {
    if (!title || !author || !category) {
      return Alert.alert('Validation', 'Title, Author and Category are required');
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const form = new FormData();

      form.append('title', title);
      form.append('author', author);
      form.append('category', category);
      form.append('description', description);
      form.append('edition', edition);
      form.append('isbn', isbn);
      form.append('condition', condition);
      form.append('yearOfPublication', yearOfPublication);
      form.append('department', department);
      form.append('rate', rate);
      form.append('status', status);

      if (image) {
        form.append('image', image);
      }

      const res = await fetch(`${API_BASE}/api/books`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      // Get raw response for safety
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('JSON parse error:', err, 'Raw response:', text);
        throw new Error('Invalid response from server');
      }

      if (!res.ok) throw new Error(data.message || 'Failed to add book');

      Alert.alert('Success', 'Book added successfully');

      /* RESET FORM */
      setTitle('');
      setAuthor('');
      setDescription('');
      setEdition('');
      setIsbn('');
      setCondition('');
      setYearOfPublication('');
      setDepartment('');
      setRate('');
      setStatus('available');
      setCategory('Programming');
      setImage(null);

    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Add Book</Text>

      <TextInput placeholder="Title *" style={styles.input} value={title} onChangeText={setTitle} />
      <TextInput placeholder="Author *" style={styles.input} value={author} onChangeText={setAuthor} />

      <Text style={styles.label}>Category *</Text>
      <View style={styles.row}>
        {CATEGORY_OPTIONS.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[styles.chip, category === c && styles.chipActive]}
          >
            <Text style={category === c ? styles.chipTextActive : styles.chipText}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput placeholder="Description" style={styles.input} value={description} onChangeText={setDescription} multiline />
      <TextInput placeholder="Edition" style={styles.input} value={edition} onChangeText={setEdition} />
      <TextInput placeholder="ISBN" style={styles.input} value={isbn} onChangeText={setIsbn} />
      <TextInput placeholder="Condition (New / Good / Old)" style={styles.input} value={condition} onChangeText={setCondition} />
      <TextInput placeholder="Year of Publication" style={styles.input} value={yearOfPublication} onChangeText={setYearOfPublication} keyboardType="numeric" />
      <TextInput placeholder="Department" style={styles.input} value={department} onChangeText={setDepartment} />
      <TextInput placeholder="Rate / Price" style={styles.input} value={rate} onChangeText={setRate} keyboardType="numeric" />

      <Text style={styles.label}>Status</Text>
      <View style={styles.row}>
        {STATUS_OPTIONS.map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={[styles.chip, status === s && styles.chipActive]}
          >
            <Text style={status === s ? styles.chipTextActive : styles.chipText}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button title="Pick Image" onPress={pickImage} />
      {image && <Image source={{ uri: image.uri }} style={styles.preview} />}

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 12 }} />
      ) : (
        <Button title="Submit" onPress={handleSubmit} />
      )}
    </ScrollView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  label: { fontWeight: '600', marginVertical: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, margin: 4 },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { color: '#007AFF' },
  chipTextActive: { color: '#fff' },
  preview: { width: 120, height: 160, marginVertical: 10, borderRadius: 6 },
});
