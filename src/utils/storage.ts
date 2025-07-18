import { Registro } from '../types/Registro';
import { formataData, getDaysInInterval } from './dateUtils';

const STORAGE_KEY = 'registrosPonto';

export const salvaRegistro = (registro: Registro): void => {
  const dataFormatada = formataData(new Date(registro.timestamp));
  const registros = leRegistros();
  const registrosDoDia = registros[dataFormatada] || [];
  registrosDoDia.push(registro);
  registros[dataFormatada] = registrosDoDia;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
};

export const atualizaRegistro = (registroAtualizado: Registro, timestampOriginal: Date): void => {
  const dataOriginalFormatada = formataData(new Date(timestampOriginal));
  const dataNovaFormatada = formataData(new Date(registroAtualizado.timestamp));
  const registros = leRegistros();

  // Remove o registro da data antiga
  if (registros[dataOriginalFormatada]) {
    registros[dataOriginalFormatada] = registros[dataOriginalFormatada].filter(
      r => new Date(r.timestamp).getTime() !== new Date(timestampOriginal).getTime()
    );
    if (registros[dataOriginalFormatada].length === 0) {
      delete registros[dataOriginalFormatada];
    }
  }

  // Adiciona o registro na data nova
  const registrosDoDiaNovo = registros[dataNovaFormatada] || [];
  registrosDoDiaNovo.push(registroAtualizado);
  registros[dataNovaFormatada] = registrosDoDiaNovo;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
};

export const removeRegistro = (registroParaRemover: Registro): void => {
  const dataFormatada = formataData(new Date(registroParaRemover.timestamp));
  const registros = leRegistros();
  if (registros[dataFormatada]) {
    registros[dataFormatada] = registros[dataFormatada].filter(
      r => new Date(r.timestamp).getTime() !== new Date(registroParaRemover.timestamp).getTime()
    );
    if (registros[dataFormatada].length === 0) {
      delete registros[dataFormatada];
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
};

export const leRegistros = (): Record<string, Registro[]> => {
  const registros = localStorage.getItem(STORAGE_KEY);
  if (registros) {
    try {
      const parsed = JSON.parse(registros);
      Object.keys(parsed).forEach(key => {
        parsed[key] = parsed[key].map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) }));
      });
      return parsed;
    } catch (e) {
      console.error("Erro ao ler registros do localStorage", e);
      return {};
    }
  }
  return {};
};

export const leRegistrosDoDia = (data: Date): Registro[] => {
  const dia = formataData(data);
  const registros = leRegistros();
  return registros[dia] || [];
};

export const leRegistrosNoPeriodo = (dataInicio: Date, dataFim: Date): Record<string, Registro[]> => {
  const registrosCompletos = leRegistros();
  const registrosNoPeriodo: Record<string, Registro[]> = {};

  const diasNoIntervalo = getDaysInInterval(dataInicio, dataFim);

  diasNoIntervalo.forEach(dia => {
    const dataFormatada = formataData(dia);
    if (registrosCompletos[dataFormatada]) {
      registrosNoPeriodo[dataFormatada] = registrosCompletos[dataFormatada];
    }
  });

  return registrosNoPeriodo;
};