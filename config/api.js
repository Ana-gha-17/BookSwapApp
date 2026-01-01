import { Platform } from 'react-native';


const API_BASE =
  Platform.OS === 'android'
    ? 'http://192.168.20.4:5000'
    : 'http://localhost:5000';

export default API_BASE;
