import { Registro } from '../types/Registro';

export const formataData = (data: Date): string => {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${ano}-${mes}-${dia}`;
};

export const formataHora = (data: Date): string => {
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  const segundos = String(data.getSeconds()).padStart(2, '0');
  return `${horas}:${minutos}:${segundos}`;
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
