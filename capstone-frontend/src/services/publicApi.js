import axios from 'axios';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/public',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// No auth interceptor — this is for public, unauthenticated access only

export default publicApi;
