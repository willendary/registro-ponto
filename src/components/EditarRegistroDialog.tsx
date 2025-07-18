
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { Registro, TipoRegistro } from '../types/Registro';

interface Props {
  open: boolean;
  registro: Registro | null;
  onClose: () => void;
  onSave: (registro: Registro) => void;
}

const EditarRegistroDialog: React.FC<Props> = ({ open, registro, onClose, onSave }) => {
  const [timestamp, setTimestamp] = useState<Date | null>(null);
  const [tipo, setTipo] = useState<TipoRegistro>('entrada');

  useEffect(() => {
    if (registro) {
      setTimestamp(new Date(registro.timestamp));
      setTipo(registro.tipo);
    } else {
      setTimestamp(null);
    }
  }, [registro]);

  const handleSave = () => {
    if (registro && timestamp) {
      onSave({ ...registro, timestamp, tipo });
      onClose();
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    if (timestamp && newDate) {
      const newTimestamp = new Date(timestamp);
      newTimestamp.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      setTimestamp(newTimestamp);
    }
  };

  const handleTimeChange = (newTime: Date | null) => {
    if (timestamp && newTime) {
      const newTimestamp = new Date(timestamp);
      newTimestamp.setHours(newTime.getHours());
      newTimestamp.setMinutes(newTime.getMinutes());
      setTimestamp(newTimestamp);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Editar Registro</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: '16px !important' }}>
          <DatePicker
            label="Data"
            value={timestamp}
            onChange={handleDateChange}
          />
          <TimePicker
            label="Hora"
            value={timestamp}
            onChange={handleTimeChange}
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

export default EditarRegistroDialog;
