import { Registro } from '../types/Registro';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formataData = (data: Date): string => {
  return format(data, 'yyyy-MM-dd');
};

export const formataHora = (data: Date): string => {
  return format(data, 'HH:mm:ss');
};

export const calculaHorasTrabalhadas = (registros: Registro[]): string => {
  let totalMilisegundos = 0;
  let entradaAnterior: Date | null = null;

  registros.forEach(registro => {
    if (registro.tipo === 'entrada') {
      entradaAnterior = new Date(registro.timestamp);
    } else if (registro.tipo === 'saída' && entradaAnterior) {
      totalMilisegundos += new Date(registro.timestamp).getTime() - entradaAnterior.getTime();
      entradaAnterior = null;
    }
  });

  const horas = Math.floor(totalMilisegundos / 3600000);
  const minutos = Math.floor((totalMilisegundos % 3600000) / 60000);

  return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m`;
};

export const getStartOfWeek = (date: Date): Date => {
  return startOfWeek(date, { locale: ptBR });
};

export const getEndOfWeek = (date: Date): Date => {
  return endOfWeek(date, { locale: ptBR });
};

export const getStartOfMonth = (date: Date): Date => {
  return startOfMonth(date);
};

export const getEndOfMonth = (date: Date): Date => {
  return endOfMonth(date);
};

export const getDaysInInterval = (start: Date, end: Date): Date[] => {
  return eachDayOfInterval({ start, end });
};