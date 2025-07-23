import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Alert } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { Registro, TipoRegistro } from '../types/Registro';
import { useAuth } from '../context/AuthContext';
import { atualizarRegistro } from '../services/registroPontoService';

interface Props {
  open: boolean;
  registro: Registro | null;
  onClose: () => void;
  onSave: () => void; // onSave agora apenas notifica que algo foi salvo, o salvamento é feito aqui
}

const EditarRegistroDialog: React.FC<Props> = ({ open, registro, onClose, onSave }) => {
  const [timestamp, setTimestamp] = useState<Date | null>(null);
  const [tipo, setTipo] = useState<TipoRegistro>('entrada');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { token } = useAuth();

  useEffect(() => {
    if (registro) {
      setTimestamp(new Date(registro.timestamp));
      setTipo(registro.tipo);
      setError(null);
      setSuccess(null);
    } else {
      setTimestamp(null);
    }
  }, [registro, open]); // Adicionado 'open' para resetar ao abrir

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!registro || !timestamp || registro.id === undefined) {
      setError('Dados do registro inválidos.');
      return;
    }
    if (!token) {
      setError('Usuário não autenticado. Faça login novamente.');
      return;
    }

    try {
      const registroAtualizado: Registro = {
        ...registro,
        timestamp: timestamp,
        tipo: tipo,
      };
      await atualizarRegistro(registro.id, registroAtualizado, token);
      setSuccess('Registro atualizado com sucesso!');
      onSave(); // Notifica o componente pai para atualizar os dados
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500); // Fecha o dialog após 1.5 segundos
    } catch (err: any) {
      console.error("Erro ao atualizar registro:", err);
      setError(err.response?.data?.message || 'Erro ao atualizar registro. Tente novamente.');
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
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
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
              <MenuItem value="saidaAlmoco">Saída Almoço</MenuItem>
              <MenuItem value="voltaAlmoco">Volta Almoço</MenuItem>
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