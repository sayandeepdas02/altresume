import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    withCredentials: true, // Necessary if Django sets cookies, but we use Next.js route handlers mostly.
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
