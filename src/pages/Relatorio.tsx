import React, { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import { Registro, TipoRegistro } from '../types/Registro';
import { formataHora, calculaHorasTrabalhadas, formataData, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, getDaysInInterval } from '../utils/dateUtils';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Box, ToggleButton, ToggleButtonGroup, Accordion, AccordionSummary, AccordionDetails, Button, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { exportarRegistrosParaCSV } from '../utils/exportUtils';
import { exportToPdf } from '../utils/pdfExportUtils';
import { useAuth } from '../context/AuthContext';
import { getRegistros, atualizarRegistro, deletarRegistro } from '../services/registroPontoService';

interface Props {
  data: Date;
  onDataChange: (data: Date | null) => void;
  onEdit: (registro: Registro) => void;
  onDelete: (registro: Registro) => void;
}

type PeriodoRelatorio = 'diario' | 'semanal' | 'mensal';

const Relatorio: React.FC<Props> = ({ data, onDataChange, onEdit, onDelete }) => {
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('diario');
  const [registrosExibidos, setRegistrosExibidos] = useState<Registro[]>([]);
  const [registrosAgrupados, setRegistrosAgrupados] = useState<Record<string, Registro[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, getUserIdFromToken } = useAuth();
  const userId = getUserIdFromToken();

  const fetchRegistros = async () => {
    if (!token || !userId) {
      setError('Usuário não autenticado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allRegistros = await getRegistros(token, userId);
      const registrosDoUsuario = allRegistros.filter(r => r.usuarioId === userId);

      let dataInicio: Date = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
      let dataFim: Date = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59, 999));

      if (periodo === 'semanal') {
        dataInicio = getStartOfWeek(data);
        dataFim = getEndOfWeek(data);
      } else if (periodo === 'mensal') {
        dataInicio = getStartOfMonth(data);
        dataFim = getEndOfMonth(data);
      }

      const filteredRegistros = registrosDoUsuario.filter(r => {
        const registroDate = new Date(r.timestamp);
        return registroDate.getTime() >= dataInicio.getTime() && registroDate.getTime() <= dataFim.getTime();
      });

      const grouped: Record<string, Registro[]> = {};
      filteredRegistros.forEach(registro => {
        const dateKey = formataData(new Date(registro.timestamp));
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(registro);
      });

      // Sort records within each day
      for (const dateKey in grouped) {
        grouped[dateKey].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }

      setRegistrosAgrupados(grouped);

      if (periodo === 'diario') {
        const registrosDoDia = grouped[formataData(data)] || [];
        setRegistrosExibidos(registrosDoDia);
      } else {
        setRegistrosExibidos([]);
      }
    } catch (err: any) {
      console.error("Erro ao buscar registros:", err);
      setError('Erro ao carregar registros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, [data, periodo, token, userId]);

  const handlePeriodoChange = (event: React.MouseEvent<HTMLElement>, newPeriodo: PeriodoRelatorio | null) => {
    if (newPeriodo) {
      setPeriodo(newPeriodo);
    }
  };

  const calculaTotalHorasPeriodo = (): string => {
    let totalMilisegundos = 0;
    Object.values(registrosAgrupados).forEach(registrosDoDia => {
      const horasDoDia = calculaHorasTrabalhadas(registrosDoDia);
      const [horasStr, minutosStr] = horasDoDia.split('h ').map(s => parseInt(s.replace('m', '')));
      totalMilisegundos += (horasStr * 3600000) + (minutosStr * 60000);
    });

    const horas = Math.floor(totalMilisegundos / 3600000);
    const minutos = Math.floor((totalMilisegundos % 3600000) / 60000);

    return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m`;
  };

  const calculaMediaDiaria = (): string => {
    const diasComRegistro = Object.keys(registrosAgrupados).length;
    if (diasComRegistro === 0) return '00h 00m';

    let totalMilisegundosPeriodo = 0;
    Object.values(registrosAgrupados).forEach(registrosDoDia => {
      const horasDoDia = calculaHorasTrabalhadas(registrosDoDia);
      const [horasStr, minutosStr] = horasDoDia.split('h ').map(s => parseInt(s.replace('m', '')));
      totalMilisegundosPeriodo += (horasStr * 3600000) + (minutosStr * 60000);
    });

    const mediaMilisegundos = totalMilisegundosPeriodo / diasComRegistro;
    const horas = Math.floor(mediaMilisegundos / 3600000);
    const minutos = Math.floor((mediaMilisegundos % 3600000) / 60000);

    return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m`;
  };

  const handleExportCSV = () => {
    exportarRegistrosParaCSV(registrosAgrupados, periodo);
  };

  const handleExportPDF = () => {
    const filename = `relatorio_ponto_${periodo}_${formataData(new Date())}.pdf`;
    exportToPdf('relatorio-content', filename);
  };

  const getDisplayTipoRegistro = (tipo: TipoRegistro): string => {
    switch (tipo) {
      case 'entrada':
        return 'Entrada';
      case 'saída':
        return 'Saída';
      case 'saidaAlmoco':
        return 'Saída Almoço';
      case 'voltaAlmoco':
        return 'Volta Almoço';
      default:
        return tipo;
    }
  };

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Paper elevation={3} sx={{ padding: 2 }} id="relatorio-content">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Typography variant="h5">Relatório de Horas</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              sx={{ marginRight: 1 }}
            >
              Exportar CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportPDF}
            >
              Exportar PDF
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <ToggleButtonGroup
          value={periodo}
          exclusive
          onChange={handlePeriodoChange}
          aria-label="período do relatório"
          sx={{ marginBottom: 2 }}
        >
          <ToggleButton value="diario" aria-label="diário">Diário</ToggleButton>
          <ToggleButton value="semanal" aria-label="semanal">Semanal</ToggleButton>
          <ToggleButton value="mensal" aria-label="mensal">Mensal</ToggleButton>
        </ToggleButtonGroup>

        {periodo === 'diario' && (
          <DatePicker
            label="Selecione a Data"
            value={data}
            onChange={onDataChange}
          />
        )}
        {periodo === 'semanal' && (
          <DatePicker
            label="Selecione uma Data na Semana"
            value={data}
            onChange={onDataChange}
          />
        )}
        {periodo === 'mensal' && (
          <DatePicker
            label="Selecione um Mês"
            views={['month', 'year']}
            value={data}
            onChange={onDataChange}
          />
        )}

        {periodo === 'diario' ? (
          <TableContainer component={Paper} sx={{ marginTop: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Horário</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrosExibidos.map((registro, index) => (
                  <TableRow key={registro.id || index}>
                    <TableCell>{registro.tipo.charAt(0).toUpperCase() + registro.tipo.slice(1)}</TableCell>
                    <TableCell>{formataHora(new Date(registro.timestamp))}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton onClick={() => onEdit(registro)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => onDelete(registro)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="h6">Total de Horas no Período: {calculaTotalHorasPeriodo()}</Typography>
            <Typography variant="h6">Média Diária: {calculaMediaDiaria()}</Typography>
            {Object.keys(registrosAgrupados).sort().map(dataDia => (
              <Accordion key={dataDia} sx={{ mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{dataDia} - {calculaHorasTrabalhadas(registrosAgrupados[dataDia])}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Horário</TableCell>
                          <TableCell align="right">Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {registrosAgrupados[dataDia].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((registro, index) => (
                          <TableRow key={registro.id || index}>
                            <TableCell>{getDisplayTipoRegistro(registro.tipo)}</TableCell>
                            <TableCell>{formataHora(new Date(registro.timestamp))}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton onClick={() => onEdit(registro)} size="small">
                                  <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => onDelete(registro)} size="small">
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default Relatorio;
