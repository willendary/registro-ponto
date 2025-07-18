import React, { useState, useEffect, useContext, useRef } from 'react';
import { Container, Typography, CssBaseline, AppBar, Toolbar, Tabs, Tab, Box, Button, Card, CardContent, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, IconButton } from '@mui/material';
import PunchClockIcon from '@mui/icons-material/PunchClock';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsIcon from '@mui/icons-material/Settings';
import RegistroPonto from './pages/RegistroPonto';
import Relatorio from './pages/Relatorio';
import AdicionarRegistroManualDialog from './components/AdicionarRegistroManualDialog';
import EditarRegistroDialog from './components/EditarRegistroDialog';
import NotificationSettingsDialog from './components/NotificationSettingsDialog';
import { Registro, TipoRegistro } from './types/Registro';
import { NotificationSettings } from './types/NotificationSettings';
import { leRegistrosDoDia, salvaRegistro, atualizaRegistro, removeRegistro } from './utils/storage';
import { ThemeContext } from './theme/ThemeContext';
import { requestNotificationPermission, sendNotification } from './utils/notificationService';
import { getNotificationSettings, saveNotificationSettings, isReminderSent, setReminderSent } from './utils/notificationStorage';

function App() {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [dialogAdicionarAberto, setDialogAdicionarAberto] = useState(false);
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<Registro | null>(null);
  const [dialogSettingsAberto, setDialogSettingsAberto] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getNotificationSettings());

  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  const { toggleColorMode, mode } = themeContext;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleAtualizarRelatorio = () => {
    setDataSelecionada(new Date(dataSelecionada.getTime()));
  };

  const startNotificationInterval = (settings: NotificationSettings) => {
    console.log('App: startNotificationInterval called with settings:', settings);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      console.log('App: Previous notification interval cleared.');
    }

    if (!settings.enabled) {
      console.log('App: Notifications are disabled in settings.');
      return;
    }

    const checkReminders = () => {
      console.log('App: checkReminders running at:', new Date().toLocaleTimeString());
      console.log('App: Current Notification.permission:', Notification.permission);
      const hoje = new Date();
      const registrosHoje = leRegistrosDoDia(hoje);
      registrosHoje.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      console.log('App: Registros de hoje:', registrosHoje);

      const isTimeForReminder = (reminderTime: Date | null) => {
        if (!reminderTime) return false;
        const reminderHour = reminderTime.getHours();
        const reminderMinute = reminderTime.getMinutes();
        return hoje.getHours() > reminderHour || (hoje.getHours() === reminderHour && hoje.getMinutes() >= reminderMinute);
      };

      // Lembrete de Entrada (Manhã)
      const primeiraEntrada = registrosHoje.find(r => r.tipo === 'entrada');
      const entryReminderAlreadySent = isReminderSent('entry', hoje);
      if (!primeiraEntrada && settings.entryReminderTime && !entryReminderAlreadySent && isTimeForReminder(settings.entryReminderTime)) {
        sendNotification('Lembrete de Ponto', { body: 'Não esqueça de registrar sua entrada!' });
        setReminderSent('entry', hoje);
        console.log('App: Entry reminder marked as sent.');
      }

      // Lembrete de Saída para Almoço
      const ultimaEntrada = registrosHoje.filter(r => r.tipo === 'entrada').pop();
      const ultimaSaidaAlmoco = registrosHoje.filter(r => r.tipo === 'saidaAlmoco').pop();
      const lunchExitReminderAlreadySent = isReminderSent('lunchExit', hoje);
      if (ultimaEntrada && !ultimaSaidaAlmoco && settings.lunchExitReminderTime && !lunchExitReminderAlreadySent && isTimeForReminder(settings.lunchExitReminderTime)) {
        sendNotification('Lembrete de Ponto', { body: 'Não esqueça de registrar sua saída para o almoço!' });
        setReminderSent('lunchExit', hoje);
        console.log('App: Lunch exit reminder marked as sent.');
      }

      // Lembrete de Entrada Pós-Almoço
      const ultimaVoltaAlmoco = registrosHoje.filter(r => r.tipo === 'voltaAlmoco').pop();
      const afternoonEntryReminderAlreadySent = isReminderSent('afternoonEntry', hoje);
      if (ultimaSaidaAlmoco && !ultimaVoltaAlmoco && settings.afternoonEntryReminderTime && !afternoonEntryReminderAlreadySent && isTimeForReminder(settings.afternoonEntryReminderTime)) {
        sendNotification('Lembrete de Ponto', { body: 'Não esqueça de registrar sua volta do almoço!' });
        setReminderSent('afternoonEntry', hoje);
        console.log('App: Afternoon entry reminder marked as sent.');
      }

      // Lembrete de Saída (Final do Dia)
      const ultimoRegistro = registrosHoje[registrosHoje.length - 1];
      const exitReminderAlreadySent = isReminderSent('exit', hoje);
      if (primeiraEntrada && ultimoRegistro?.tipo !== 'saída' && settings.exitReminderDuration && !exitReminderAlreadySent) {
        const tempoDesdePrimeiraEntrada = hoje.getTime() - new Date(primeiraEntrada.timestamp).getTime();
        const duracaoEmMilisegundos = settings.exitReminderDuration * 60 * 60 * 1000;
        if (tempoDesdePrimeiraEntrada >= duracaoEmMilisegundos) {
          sendNotification('Lembrete de Ponto', { body: `Já se passaram ${settings.exitReminderDuration} horas desde sua entrada. Não esqueça de registrar sua saída!` });
          setReminderSent('exit', hoje);
          console.log('App: Exit reminder marked as sent.');
        }
      }
    };

    const intervalMinutes = settings.checkIntervalMinutes > 0 ? settings.checkIntervalMinutes : 1; // Garante que o intervalo seja pelo menos 1 minuto
    console.log(`App: Setting notification check interval to ${intervalMinutes} minutes.`);
    intervalRef.current = setInterval(checkReminders, intervalMinutes * 60 * 1000);
    checkReminders(); // Verifica ao carregar
  };

  useEffect(() => {
    console.log('App: useEffect hook triggered.');
    requestNotificationPermission();
    startNotificationInterval(notificationSettings);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('App: useEffect cleanup: Notification interval cleared.');
      }
    };
  }, [notificationSettings]);

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
    handleAtualizarRelatorio();
  };

  const handleAbrirEditar = (registro: Registro) => {
    setRegistroSelecionado(registro);
    setDialogEditarAberto(true);
  };

  const handleSalvarEdicao = (registroEditado: Registro) => {
    if (registroSelecionado) {
      atualizaRegistro(registroEditado, registroSelecionado.timestamp);
      handleAtualizarRelatorio();
    }
  };

  const handleAbrirExcluir = (registro: Registro) => {
    setRegistroSelecionado(registro);
    setDialogExcluirAberto(true);
  };

  const handleConfirmarExclusao = () => {
    if (registroSelecionado) {
      removeRegistro(registroSelecionado);
      handleAtualizarRelatorio();
      setDialogExcluirAberto(false);
      setRegistroSelecionado(null);
    }
  };

  const handleSaveNotificationSettings = (settings: NotificationSettings) => {
    console.log('App: Saving notification settings:', settings);
    saveNotificationSettings(settings);
    setNotificationSettings(settings);
    setDialogSettingsAberto(false);
  };

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <PunchClockIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Registro de Ponto
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton sx={{ ml: 1 }} onClick={() => setDialogSettingsAberto(true)} color="inherit">
            <SettingsIcon />
          </IconButton>
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
            <RegistroPonto onRegistro={handleAtualizarRelatorio} />
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

      <NotificationSettingsDialog
        open={dialogSettingsAberto}
        onClose={() => setDialogSettingsAberto(false)}
        currentSettings={notificationSettings}
        onSave={handleSaveNotificationSettings}
      />
    </>
  );
}

export default App;