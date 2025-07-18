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
  let totalWorkedMillis = 0;
  let lastPunchTime: Date | null = null;
  let isWorking = false;
  let isOnLunch = false;

  // Ensure records are sorted by timestamp
  registros.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  registros.forEach(registro => {
    const currentPunchTime = new Date(registro.timestamp);

    if (registro.tipo === 'entrada') {
      lastPunchTime = currentPunchTime;
      isWorking = true;
      isOnLunch = false; // Should not be on lunch when entering
    } else if (registro.tipo === 'saidaAlmoco') {
      if (isWorking && lastPunchTime) {
        totalWorkedMillis += currentPunchTime.getTime() - lastPunchTime.getTime();
      }
      lastPunchTime = currentPunchTime;
      isWorking = false;
      isOnLunch = true;
    } else if (registro.tipo === 'voltaAlmoco') {
      if (isOnLunch && lastPunchTime) {
        // Lunch time is not added to totalWorkedMillis, it's a break.
        // We just update the lastPunchTime to resume working.
      }
      lastPunchTime = currentPunchTime;
      isWorking = true;
      isOnLunch = false;
    } else if (registro.tipo === 'saída') {
      if (isWorking && lastPunchTime) {
        totalWorkedMillis += currentPunchTime.getTime() - lastPunchTime.getTime();
      }
      lastPunchTime = null; // End of day or segment
      isWorking = false;
      isOnLunch = false;
    }
  });

  const horas = Math.floor(totalWorkedMillis / 3600000);
  const minutos = Math.floor((totalWorkedMillis % 3600000) / 60000);

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