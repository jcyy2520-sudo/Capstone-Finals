import axios from 'axios';
import { getPublicApiBaseUrl } from './publicApiBase';

const publicApi = axios.create({
  baseURL: getPublicApiBaseUrl(),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// No auth interceptor — this is for public, unauthenticated access only

export default publicApi;
