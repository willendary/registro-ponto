
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { TipoRegistro } from '../types/Registro';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (registro: { timestamp: Date, tipo: TipoRegistro }) => void;
}

const AdicionarRegistroManualDialog: React.FC<Props> = ({ open, onClose, onSave }) => {
  const [data, setData] = useState<Date | null>(new Date());
  const [hora, setHora] = useState<Date | null>(new Date());
  const [tipo, setTipo] = useState<TipoRegistro>('entrada');

  const handleSave = () => {
    if (data && hora) {
      const timestamp = new Date(data);
      timestamp.setHours(hora.getHours());
      timestamp.setMinutes(hora.getMinutes());
      timestamp.setSeconds(hora.getSeconds());
      onSave({ timestamp, tipo });
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Adicionar Registro Manual</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: '16px !important' }}>
          <DatePicker
            label="Data"
            value={data}
            onChange={setData}
          />
          <TimePicker
            label="Hora"
            value={hora}
            onChange={setHora}
          />
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={tipo}
              label="Tipo"
              onChange={(e: SelectChangeEvent<TipoRegistro>) => setTipo(e.target.value as TipoRegistro)}
            >
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="saída">Saída</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AdicionarRegistroManualDialog;
