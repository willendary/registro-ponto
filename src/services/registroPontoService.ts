import axios from 'axios';
import { Registro, TipoRegistro } from '../types/Registro';

const API_URL = 'http://localhost:5158/RegistroPonto';

interface RegistroPontoDTO {
  usuarioId: string;
  dataHora: string;
  tipo: TipoRegistro;
}

type ApiResponse<T> = T | { value: T } | { $values: T };

export const registrarPonto = async (tipo: TipoRegistro, token: string, userId: string, dataHoraManual?: Date) => {
  const dataHora = dataHoraManual ? dataHoraManual.toISOString() : new Date().toISOString();
  const registroDto: RegistroPontoDTO = {
    usuarioId: userId,
    dataHora: dataHora,
    tipo: tipo,
  };

  const response = await axios.post(API_URL, registroDto, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getRegistros = async (token: string, userId: string, dataInicio?: Date, dataFim?: Date): Promise<Registro[]> => {
  let url = `${API_URL}/ByUsuario/${userId}`;
  const params: any = {};

  if (dataInicio) {
    params.dataInicio = dataInicio.toISOString();
  }
  if (dataFim) {
    params.dataFim = dataFim.toISOString();
  }

  const response = await axios.get<ApiResponse<Registro[]>>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: params,
  });
  console.log('Resposta bruta da API:', response.data);
  // Verifica se a resposta é um array diretamente ou se está aninhada em uma propriedade 'value' ou '$values'
  let dataToProcess: any[] = [];
  if (typeof response.data === 'object' && response.data !== null && '$values' in response.data && Array.isArray(response.data.$values)) {
    dataToProcess = response.data.$values;
  } else if (typeof response.data === 'object' && response.data !== null && 'value' in response.data && Array.isArray(response.data.value)) {
    dataToProcess = response.data.value;
  } else if (Array.isArray(response.data)) {
    dataToProcess = response.data;
  } else {
    console.error('Formato de resposta inesperado:', response.data);
    throw new Error('Formato de dados de registro inesperado.');
  }
  return dataToProcess.map((r: any) => ({ ...r, timestamp: new Date(r.dataHora) }));
};

export const atualizarRegistro = async (id: number, registro: Registro, token: string) => {
  const registroDto = {
    usuarioId: registro.usuarioId, // Assumindo que o registro já tem o userId
    dataHora: registro.timestamp.toISOString(),
    tipo: registro.tipo,
  };
  const response = await axios.put(`${API_URL}/${id}`, registroDto, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deletarRegistro = async (id: number, token: string) => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
