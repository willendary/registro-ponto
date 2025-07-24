import axios from 'axios';
import { UsuarioDTO, UsuarioResponseDTO, RegistroUsuarioDTO } from '../types/Usuario';

const API_URL = 'http://localhost:5158/Usuarios';

export const getAllUsers = async (token: string): Promise<UsuarioResponseDTO[]> => {
  const response = await axios.get<any>(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // Verifica se a resposta é um array diretamente ou se está aninhada em uma propriedade 'value' ou '$values'
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (typeof response.data === 'object' && response.data !== null && 'value' in response.data && Array.isArray(response.data.value)) {
    return response.data.value;
  } else if (typeof response.data === 'object' && response.data !== null && '$values' in response.data && Array.isArray(response.data.$values)) {
    return response.data.$values;
  } else {
    console.error('Formato de resposta inesperado para getAllUsers:', response.data);
    throw new Error('Formato de dados de usuários inesperado.');
  }
};

export const createUser = async (userData: RegistroUsuarioDTO, token: string): Promise<UsuarioResponseDTO> => {
  const response = await axios.post<UsuarioResponseDTO>(API_URL, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateUser = async (userId: string, userData: UsuarioDTO, token: string): Promise<void> => {
  await axios.put(`${API_URL}/${userId}`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteUser = async (userId: string, token: string): Promise<void> => {
  await axios.delete(`${API_URL}/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getRoles = async (token: string): Promise<string[]> => {
  const response = await axios.get<any>(`${API_URL}/roles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // Verifica se a resposta é um array diretamente ou se está aninhada em uma propriedade 'value' ou '$values'
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (typeof response.data === 'object' && response.data !== null && 'value' in response.data && Array.isArray(response.data.value)) {
    return response.data.value;
  } else if (typeof response.data === 'object' && response.data !== null && '$values' in response.data && Array.isArray(response.data.$values)) {
    return response.data.$values;
  } else {
    console.error('Formato de resposta inesperado para getRoles:', response.data);
    throw new Error('Formato de dados de roles inesperado.');
  }
};
