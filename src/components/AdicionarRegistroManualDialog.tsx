import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Alert } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { TipoRegistro } from '../types/Registro';
import { useAuth } from '../context/AuthContext';
import { registrarPonto } from '../services/registroPontoService';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void; // onSave agora apenas notifica que algo foi salvo, o salvamento é feito aqui
}

const AdicionarRegistroManualDialog: React.FC<Props> = ({ open, onClose, onSave }) => {
  const [data, setData] = useState<Date | null>(new Date());
  const [hora, setHora] = useState<Date | null>(new Date());
  const [tipo, setTipo] = useState<TipoRegistro>('entrada');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { token, getUserIdFromToken } = useAuth();
  const userId = getUserIdFromToken();

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!data || !hora) {
      setError('Por favor, selecione a data e a hora.');
      return;
    }
    if (!token || !userId) {
      setError('Usuário não autenticado. Faça login novamente.');
      return;
    }

    try {
      const timestamp = new Date(data);
      timestamp.setHours(hora.getHours());
      timestamp.setMinutes(hora.getMinutes());
      timestamp.setSeconds(hora.getSeconds());

      // A função registrarPonto já espera o tipo, token e userId
      await registrarPonto(tipo, token, userId);
      setSuccess('Registro adicionado com sucesso!');
      onSave(); // Notifica o componente pai para atualizar os dados
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500); // Fecha o dialog após 1.5 segundos
    } catch (err: any) {
      console.error("Erro ao adicionar registro manual:", err);
      setError(err.response?.data?.message || 'Erro ao adicionar registro. Tente novamente.');
    }
  };

  // Resetar estados ao abrir/fechar o dialog
  React.useEffect(() => {
    if (open) {
      setData(new Date());
      setHora(new Date());
      setTipo('entrada');
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Adicionar Registro Manual</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
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

export default AdicionarRegistroManualDialog;