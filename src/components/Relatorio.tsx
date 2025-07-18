
import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import { Registro } from '../types/Registro';
import { formataHora, calculaHorasTrabalhadas } from '../utils/dateUtils';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Props {
  registros: Registro[];
  data: Date;
  onDataChange: (data: Date | null) => void;
  onEdit: (registro: Registro) => void;
  onDelete: (registro: Registro) => void;
}

const Relatorio: React.FC<Props> = ({ registros, data, onDataChange, onEdit, onDelete }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h5" gutterBottom>
          Relatório de Horas
        </Typography>
        <DatePicker
          label="Selecione a Data"
          value={data}
          onChange={onDataChange}
        />
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
              {registros.map((registro, index) => (
                <TableRow key={index}>
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
        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Total de Horas Trabalhadas: {calculaHorasTrabalhadas(registros)}
        </Typography>
      </Paper>
    </LocalizationProvider>
  );
};

export default Relatorio;
