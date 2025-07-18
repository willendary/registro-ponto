import Papa from 'papaparse';
import { Registro } from '../types/Registro';
import { formataData, formataHora, calculaHorasTrabalhadas } from './dateUtils';

export const exportarRegistrosParaCSV = (registrosAgrupados: Record<string, Registro[]>, periodo: string) => {
  let dadosParaCSV: any[] = [];

  if (periodo === 'diario') {
    const data = Object.keys(registrosAgrupados)[0];
    const registrosDoDia = registrosAgrupados[data];
    dadosParaCSV.push([`Relatório Diário - ${data}`]);
    dadosParaCSV.push(['Tipo', 'Horário']);
    registrosDoDia.forEach(registro => {
      dadosParaCSV.push([
        registro.tipo.charAt(0).toUpperCase() + registro.tipo.slice(1),
        formataHora(new Date(registro.timestamp))
      ]);
    });
    dadosParaCSV.push(['', '']);
    dadosParaCSV.push(['Total de Horas Trabalhadas', calculaHorasTrabalhadas(registrosDoDia)]);

  } else {
    dadosParaCSV.push([`Relatório ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`]);
    dadosParaCSV.push(['Data', 'Total de Horas']);

    let totalMilisegundosPeriodo = 0;
    let diasComRegistro = 0;

    Object.keys(registrosAgrupados).sort().forEach(dataDia => {
      const registrosDoDia = registrosAgrupados[dataDia];
      const horasDoDia = calculaHorasTrabalhadas(registrosDoDia);
      dadosParaCSV.push([dataDia, horasDoDia]);

      // Para calcular o total e a média do período
      let entradaAnterior: Date | null = null;
      registrosDoDia.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      registrosDoDia.forEach(registro => {
        if (registro.tipo === 'entrada') {
          entradaAnterior = new Date(registro.timestamp);
        } else if (registro.tipo === 'saída' && entradaAnterior) {
          totalMilisegundosPeriodo += new Date(registro.timestamp).getTime() - entradaAnterior.getTime();
          entradaAnterior = null;
        }
      });
      if (registrosDoDia.length > 0) {
        diasComRegistro++;
      }
    });

    const horasTotal = Math.floor(totalMilisegundosPeriodo / 3600000);
    const minutosTotal = Math.floor((totalMilisegundosPeriodo % 3600000) / 60000);
    const totalHorasFormatado = `${String(horasTotal).padStart(2, '0')}h ${String(minutosTotal).padStart(2, '0')}m`;

    const mediaMilisegundos = diasComRegistro > 0 ? totalMilisegundosPeriodo / diasComRegistro : 0;
    const horasMedia = Math.floor(mediaMilisegundos / 3600000);
    const minutosMedia = Math.floor((mediaMilisegundos % 3600000) / 60000);
    const mediaHorasFormatado = `${String(horasMedia).padStart(2, '0')}h ${String(minutosMedia).padStart(2, '0')}m`;

    dadosParaCSV.push(['', '']);
    dadosParaCSV.push(['Total de Horas no Período', totalHorasFormatado]);
    dadosParaCSV.push(['Média Diária', mediaHorasFormatado]);
  }

  const csv = Papa.unparse(dadosParaCSV);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_ponto_${periodo}_${formataData(new Date())}.csv`);
  link.click();
};
