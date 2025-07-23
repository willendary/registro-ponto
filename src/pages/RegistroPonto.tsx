import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Paper, Alert } from '@mui/material';
import { Registro, TipoRegistro } from '../types/Registro';
import { formataHora } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { registrarPonto, getRegistros } from '../services/registroPontoService';

interface Props {
  onRegistro: () => void;
}

const RegistroPonto: React.FC<Props> = ({ onRegistro }) => {
  const [ultimoRegistro, setUltimoRegistro] = useState<Registro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, getUserIdFromToken } = useAuth();
  const userId = getUserIdFromToken();

  const fetchUltimoRegistro = async () => {
    if (!token || !userId) {
      setError('Usuário não autenticado.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const allRegistros = await getRegistros(token, userId);
      console.log('Todos os registros da API (filtrados por usuário):', allRegistros);
      const registrosDoUsuarioHoje = allRegistros.filter(r => {
        const registroDate = new Date(r.timestamp);
        const today = new Date();
        const isToday = registroDate.getUTCFullYear() === today.getUTCFullYear() &&
                        registroDate.getUTCMonth() === today.getUTCMonth() &&
                        registroDate.getUTCDate() === today.getUTCDate();
        return isToday;
      });
      console.log('Registros do usuário hoje:', registrosDoUsuarioHoje);

      registrosDoUsuarioHoje.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const ultimo = registrosDoUsuarioHoje.length > 0 ? registrosDoUsuarioHoje[registrosDoUsuarioHoje.length - 1] : null;
      setUltimoRegistro(ultimo);
    } catch (err: any) {
      console.error("Erro ao buscar registros:", err);
      setError('Erro ao carregar registros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUltimoRegistro();
    window.addEventListener('focus', fetchUltimoRegistro);
    return () => {
      window.removeEventListener('focus', fetchUltimoRegistro);
    };
  }, [token, userId]);

  const handleRegistro = async (tipo: TipoRegistro) => {
    if (!token || !userId) {
      setError('Usuário não autenticado. Faça login novamente.');
      return;
    }
    try {
      setError(null);
      await registrarPonto(tipo, token, userId);
      await fetchUltimoRegistro(); // Atualiza o último registro após salvar
      onRegistro(); // Notifica o componente pai (App) para atualizar relatórios
    } catch (err: any) {
      console.error("Erro ao registrar ponto:", err);
      setError('Erro ao registrar ponto. Tente novamente.');
    }
  };

  const desabilitaEntrada = ultimoRegistro?.tipo === 'entrada' || ultimoRegistro?.tipo === 'voltaAlmoco';
  const desabilitaSaidaAlmoco = ultimoRegistro?.tipo === 'saidaAlmoco' || ultimoRegistro?.tipo === 'saída';
  const desabilitaVoltaAlmoco = ultimoRegistro?.tipo === 'voltaAlmoco' || ultimoRegistro?.tipo === 'entrada';
  const desabilitaSaida = ultimoRegistro?.tipo === 'saída';

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ padding: 2, marginBottom: 2 }}>
      <Typography variant="h5" gutterBottom>
        Registrar Ponto
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 2, marginBottom: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" color="success" onClick={() => handleRegistro('entrada')} disabled={desabilitaEntrada}>
          Registrar Entrada
        </Button>
        <Button variant="outlined" color="warning" onClick={() => handleRegistro('saidaAlmoco')} disabled={!ultimoRegistro || desabilitaSaidaAlmoco}>
          Saída Almoço
        </Button>
        <Button variant="outlined" color="info" onClick={() => handleRegistro('voltaAlmoco')} disabled={!ultimoRegistro || desabilitaVoltaAlmoco}>
          Volta Almoço
        </Button>
        <Button variant="contained" color="error" onClick={() => handleRegistro('saída')} disabled={!ultimoRegistro || desabilitaSaida}>
          Registrar Saída
        </Button>
      </Box>
      {ultimoRegistro && (
        <Typography variant="body1">
          Último registro: {ultimoRegistro.tipo.charAt(0).toUpperCase() + ultimoRegistro.tipo.slice(1)} às {formataHora(new Date(ultimoRegistro.timestamp))}
        </Typography>
      )}
    </Paper>
  );
};

export default RegistroPonto;
