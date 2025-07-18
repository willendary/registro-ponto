
import React, { useState, useEffect } from 'react';
import { Container, Typography, CssBaseline, AppBar, Toolbar, Tabs, Tab, Box, Button, Card, CardContent, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText } from '@mui/material';
import PunchClockIcon from '@mui/icons-material/PunchClock';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RegistroPonto from './components/RegistroPonto';
import Relatorio from './components/Relatorio';
import AdicionarRegistroManualDialog from './components/AdicionarRegistroManualDialog';
import EditarRegistroDialog from './components/EditarRegistroDialog';
import { Registro, TipoRegistro } from './types/Registro';
import { leRegistrosDoDia, salvaRegistro, atualizaRegistro, removeRegistro } from './utils/storage';

function App() {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [dialogAdicionarAberto, setDialogAdicionarAberto] = useState(false);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<Registro | null>(null);

  useEffect(() => {
    const registrosDoDia = leRegistrosDoDia(dataSelecionada);
    registrosDoDia.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setRegistros(registrosDoDia);
  }, [dataSelecionada]);

  const atualizarRegistros = () => {
    const registrosDoDia = leRegistrosDoDia(dataSelecionada);
    registrosDoDia.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setRegistros(registrosDoDia);
  };

  const handleMudancaAba = (event: React.SyntheticEvent, novaAba: number) => {
    setAbaAtiva(novaAba);
  };

  const handleDataChange = (novaData: Date | null) => {
    if (novaData) {
      setDataSelecionada(novaData);
    }
  };

  const handleSalvarRegistroManual = (registro: { timestamp: Date, tipo: TipoRegistro }) => {
    salvaRegistro(registro);
    atualizarRegistros();
  };

  const handleAbrirEditar = (registro: Registro) => {
    setRegistroSelecionado(registro);
    setDialogEditarAberto(true);
  };

  const handleSalvarEdicao = (registroEditado: Registro) => {
    if (registroSelecionado) {
      atualizaRegistro(registroEditado, registroSelecionado.timestamp);
      atualizarRegistros();
    }
  };

  const handleAbrirExcluir = (registro: Registro) => {
    setRegistroSelecionado(registro);
    setDialogExcluirAberto(true);
  };

  const handleConfirmarExclusao = () => {
    if (registroSelecionado) {
      removeRegistro(registroSelecionado);
      atualizarRegistros();
      setDialogExcluirAberto(false);
      setRegistroSelecionado(null);
    }
  };

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <PunchClockIcon sx={{ mr: 2 }} />
          <Typography variant="h6">
            Registro de Ponto
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={abaAtiva} onChange={handleMudancaAba} centered>
            <Tab label="Registrar Ponto" icon={<PunchClockIcon />} iconPosition="start" />
            <Tab label="Relatórios" icon={<AssessmentIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {abaAtiva === 0 && (
          <Box sx={{ mt: 3 }}>
            <RegistroPonto onRegistro={atualizarRegistros} />
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Registro Manual
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Esqueceu de bater o ponto? Adicione um registro manualmente.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => setDialogAdicionarAberto(true)}
                >
                  Adicionar Registro Manual
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}

        {abaAtiva === 1 && (
          <Box sx={{ mt: 3 }}>
            <Relatorio
              registros={registros}
              data={dataSelecionada}
              onDataChange={handleDataChange}
              onEdit={handleAbrirEditar}
              onDelete={handleAbrirExcluir}
            />
          </Box>
        )}
      </Container>

      <AdicionarRegistroManualDialog
        open={dialogAdicionarAberto}
        onClose={() => setDialogAdicionarAberto(false)}
        onSave={handleSalvarRegistroManual}
      />

      <EditarRegistroDialog
        open={dialogEditarAberto}
        onClose={() => setDialogEditarAberto(false)}
        registro={registroSelecionado}
        onSave={handleSalvarEdicao}
      />

      <Dialog
        open={dialogExcluirAberto}
        onClose={() => setDialogExcluirAberto(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você tem certeza que deseja excluir este registro?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogExcluirAberto(false)}>Cancelar</Button>
          <Button onClick={handleConfirmarExclusao} color="error">Excluir</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default App;
