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
  let lastWorkingSegmentStart: Date | null = null; // This will track the start of a continuous working period

  // Ensure records are sorted by timestamp
  registros.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  registros.forEach(registro => {
    const currentPunchTime = new Date(registro.timestamp);

    if (registro.tipo === 'entrada' || registro.tipo === 'voltaAlmoco') {
      // This marks the beginning of a working segment
      lastWorkingSegmentStart = currentPunchTime;
    } else if (registro.tipo === 'saidaAlmoco' || registro.tipo === 'saída') {
      // This marks the end of a working segment
      if (lastWorkingSegmentStart) {
        totalWorkedMillis += currentPunchTime.getTime() - lastWorkingSegmentStart.getTime();
        lastWorkingSegmentStart = null; // Reset for the next working segment
      }
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