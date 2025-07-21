import { formataData, formataHora, calculaHorasTrabalhadas, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, getDaysInInterval } from './dateUtils';
import { Registro, TipoRegistro } from '../types/Registro';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

describe('dateUtils', () => {

  // Mock Date para testes de data/hora
  const MOCK_DATE = new Date('2025-07-18T10:30:00.000Z'); // Sexta-feira, 18 de julho de 2025, 10:30:00 UTC
  const REAL_DATE = Date;

  beforeAll(() => {
    global.Date = jest.fn(() => MOCK_DATE) as any;
    global.Date.now = jest.fn(() => MOCK_DATE.getTime());
    global.Date.prototype.getTime = jest.fn(() => MOCK_DATE.getTime());
  });

  afterAll(() => {
    global.Date = REAL_DATE;
  });

  describe('formataData', () => {
    test('deve formatar a data corretamente para YYYY-MM-DD', () => {
      const date = new Date('2023-01-15T10:00:00Z');
      expect(formataData(date)).toBe('2023-01-15');
    });
  });

  describe('formataHora', () => {
    test('deve formatar a hora corretamente para HH:mm:ss', () => {
      const date = new Date('2023-01-15T14:35:01Z');
      expect(formataHora(date)).toBe('14:35:01');
    });
  });

  describe('calculaHorasTrabalhadas', () => {
    test('deve calcular horas para entrada e saída simples', () => {
      const registros: Registro[] = [
        { timestamp: new Date('2025-07-18T08:00:00Z'), tipo: 'entrada' },
        { timestamp: new Date('2025-07-18T17:00:00Z'), tipo: 'saída' },
      ];
      expect(calculaHorasTrabalhadas(registros)).toBe('09h 00m');
    });

    test('deve calcular horas com pausa para almoço', () => {
      const registros: Registro[] = [
        { timestamp: new Date('2025-07-18T08:00:00Z'), tipo: 'entrada' },
        { timestamp: new Date('2025-07-18T12:00:00Z'), tipo: 'saidaAlmoco' },
        { timestamp: new Date('2025-07-18T13:00:00Z'), tipo: 'voltaAlmoco' },
        { timestamp: new Date('2025-07-18T17:00:00Z'), tipo: 'saída' },
      ];
      // 4h antes do almoço + 4h depois do almoço = 8h
      expect(calculaHorasTrabalhadas(registros)).toBe('08h 00m');
    });

    test('deve lidar com registros fora de ordem (deve ordenar internamente)', () => {
      const registros: Registro[] = [
        { timestamp: new Date('2025-07-18T17:00:00Z'), tipo: 'saída' },
        { timestamp: new Date('2025-07-18T08:00:00Z'), tipo: 'entrada' },
      ];
      expect(calculaHorasTrabalhadas(registros)).toBe('09h 00m');
    });

    test('deve retornar 00h 00m se não houver registros válidos', () => {
      const registros: Registro[] = [
        { timestamp: new Date('2025-07-18T08:00:00Z'), tipo: 'entrada' },
      ];
      expect(calculaHorasTrabalhadas(registros)).toBe('00h 00m');
    });

    test('deve calcular corretamente com múltiplos períodos de trabalho e almoço', () => {
      const registros: Registro[] = [
        { timestamp: new Date('2025-07-18T08:00:00Z'), tipo: 'entrada' },
        { timestamp: new Date('2025-07-18T10:00:00Z'), tipo: 'saidaAlmoco' }, // 2h
        { timestamp: new Date('2025-07-18T10:30:00Z'), tipo: 'voltaAlmoco' },
        { timestamp: new Date('2025-07-18T12:00:00Z'), tipo: 'saidaAlmoco' }, // 1.5h
        { timestamp: new Date('2025-07-18T13:00:00Z'), tipo: 'voltaAlmoco' },
        { timestamp: new Date('2025-07-18T17:00:00Z'), tipo: 'saída' }, // 4h
      ];
      // Total: 2h + 1.5h + 4h = 7.5h = 07h 30m
      expect(calculaHorasTrabalhadas(registros)).toBe('07h 30m');
    });
  });

  describe('getStartOfWeek', () => {
    test('deve retornar o início da semana (domingo) para uma data', () => {
      const date = new Date('2025-07-18T10:00:00Z'); // Sexta-feira
      const expected = startOfWeek(date, { locale: ptBR });
      expect(getStartOfWeek(date).toISOString()).toBe(expected.toISOString());
    });
  });

  describe('getEndOfWeek', () => {
    test('deve retornar o fim da semana (sábado) para uma data', () => {
      const date = new Date('2025-07-18T10:00:00Z'); // Sexta-feira
      const expected = endOfWeek(date, { locale: ptBR });
      expect(getEndOfWeek(date).toISOString()).toBe(expected.toISOString());
    });
  });

  describe('getStartOfMonth', () => {
    test('deve retornar o início do mês para uma data', () => {
      const date = new Date('2025-07-18T10:00:00Z');
      const expected = startOfMonth(date);
      expect(getStartOfMonth(date).toISOString()).toBe(expected.toISOString());
    });
  });

  describe('getEndOfMonth', () => {
    test('deve retornar o fim do mês para uma data', () => {
      const date = new Date('2025-07-18T10:00:00Z');
      const expected = endOfMonth(date);
      expect(getEndOfMonth(date).toISOString()).toBe(expected.toISOString());
    });
  });

  describe('getDaysInInterval', () => {
    test('deve retornar todos os dias em um intervalo', () => {
      const start = new Date('2025-07-15T00:00:00Z');
      const end = new Date('2025-07-17T00:00:00Z');
      const expected = eachDayOfInterval({ start, end });
      const result = getDaysInInterval(start, end);
      expect(result.length).toBe(expected.length);
      result.forEach((date, index) => {
        expect(date.toISOString()).toBe(expected[index].toISOString());
      });
    });
  });
});