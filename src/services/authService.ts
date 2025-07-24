import axios from 'axios';

const API_URL = 'http://localhost:5158/api/Auth';

export const registerUser = async (nome: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      nome,
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};