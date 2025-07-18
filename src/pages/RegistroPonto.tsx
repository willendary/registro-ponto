import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { Registro, TipoRegistro } from '../types/Registro';
import { salvaRegistro, leRegistrosDoDia } from '../utils/storage';
import { formataHora } from '../utils/dateUtils';

interface Props {
  onRegistro: () => void;
}

const RegistroPonto: React.FC<Props> = ({ onRegistro }) => {
  const [ultimoRegistro, setUltimoRegistro] = useState<Registro | null>(null);

  const atualizaUltimoRegistro = () => {
    const registrosDeHoje = leRegistrosDoDia(new Date());
    registrosDeHoje.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const ultimo = registrosDeHoje.length > 0 ? registrosDeHoje[registrosDeHoje.length - 1] : null;
    setUltimoRegistro(ultimo);
  };

  useEffect(() => {
    atualizaUltimoRegistro();
    // Adiciona um listener para focar na janela e atualizar, garantindo que os dados estejam sempre sincronizados
    window.addEventListener('focus', atualizaUltimoRegistro);
    return () => {
      window.removeEventListener('focus', atualizaUltimoRegistro);
    };
  }, []);

  const handleRegistro = (tipo: TipoRegistro) => {
    const novoRegistro: Registro = { timestamp: new Date(), tipo };
    salvaRegistro(novoRegistro);
    atualizaUltimoRegistro();
    onRegistro();
  };

  const desabilitaEntrada = ultimoRegistro?.tipo === 'entrada' || ultimoRegistro?.tipo === 'voltaAlmoco';
  const desabilitaSaidaAlmoco = ultimoRegistro?.tipo === 'saidaAlmoco' || ultimoRegistro?.tipo === 'saída';
  const desabilitaVoltaAlmoco = ultimoRegistro?.tipo === 'voltaAlmoco' || ultimoRegistro?.tipo === 'entrada';
  const desabilitaSaida = ultimoRegistro?.tipo === 'saída';

  return (
    <Paper elevation={3} sx={{ padding: 2, marginBottom: 2 }}>
      <Typography variant="h5" gutterBottom>
        Registrar Ponto
      </Typography>
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