import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.VITE_API,
});

export const useApi = () => {
  return { api };
};
