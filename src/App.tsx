import React, { useState, useEffect, useContext, useRef } from 'react';
import { Container, Typography, CssBaseline, AppBar, Toolbar, Box, Button, Card, CardContent, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, IconButton } from '@mui/material';
import PunchClockIcon from '@mui/icons-material/PunchClock';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import RegistroPonto from './pages/RegistroPonto';
import Relatorio from './pages/Relatorio';
import AdicionarRegistroManualDialog from './components/AdicionarRegistroManualDialog';
import EditarRegistroDialog from './components/EditarRegistroDialog';
import NotificationSettingsDialog from './components/NotificationSettingsDialog';
import { Registro, TipoRegistro } from './types/Registro';
import { NotificationSettings } from './types/NotificationSettings';
// import { leRegistrosDoDia, salvaRegistro, atualizaRegistro, removeRegistro } from './utils/storage'; // Removido
import { ThemeContext } from './theme/ThemeContext';
import { requestNotificationPermission, sendNotification } from './utils/notificationService';
import { getNotificationSettings, saveNotificationSettings, isReminderSent, setReminderSent } from './utils/notificationStorage';

import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { deletarRegistro, getRegistros } from './services/registroPontoService';
import AdminUsers from './pages/AdminUsers';

function AppContent() {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
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

  const { isAuthenticated, logout, token, getUserIdFromToken, getUserRolesFromToken } = useAuth();
  const userId = getUserIdFromToken();
  const userRoles = getUserRolesFromToken();
  const isAdmin = userRoles.includes('Admin');
  const navigate = useNavigate();

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

    const checkReminders = async () => { // Alterado para async
      console.log('App: checkReminders running at:', new Date().toLocaleTimeString());
      console.log('App: Current Notification.permission:', Notification.permission);
      const hoje = new Date();

      let registrosHoje: Registro[] = [];
      if (token && userId) {
        try {
          const allRegistros = await getRegistros(token, userId);
          registrosHoje = allRegistros.filter(r => {
            const registroDate = new Date(r.timestamp);
            return r.usuarioId === userId &&
                   registroDate.getDate() === hoje.getDate() &&
                   registroDate.getMonth() === hoje.getMonth() &&
                   registroDate.getFullYear() === hoje.getFullYear();
          });
          registrosHoje.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        } catch (error) {
          console.error("Erro ao buscar registros para lembretes:", error);
          return; // Não prossegue com lembretes se não conseguir buscar registros
        }
      }

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
      const ultimaSaidaAlmocoValida = registrosHoje.filter(r => r.tipo === 'saidaAlmoco').pop();
      const ultimaVoltaAlmoco = registrosHoje.filter(r => r.tipo === 'voltaAlmoco').pop();
      const afternoonEntryReminderAlreadySent = isReminderSent('afternoonEntry', hoje);
      if (ultimaSaidaAlmocoValida && !ultimaVoltaAlmoco && settings.afternoonEntryReminderTime && !afternoonEntryReminderAlreadySent && isTimeForReminder(settings.afternoonEntryReminderTime)) {
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
  }, [notificationSettings, token, userId]); // Adicionado token e userId como dependências

  const handleDataChange = (novaData: Date | null) => {
    if (novaData) {
      setDataSelecionada(novaData);
    }
  };

  const handleSalvarRegistroManual = () => { // onSave agora não recebe registro, apenas notifica
    handleAtualizarRelatorio();
  };

  const handleAbrirEditar = (registro: Registro) => {
    setRegistroSelecionado(registro);
    setDialogEditarAberto(true);
  };

  const handleSalvarEdicao = () => { // onSave agora não recebe registro, apenas notifica
    handleAtualizarRelatorio();
  };

  const handleAbrirExcluir = (registro: Registro) => {
    setRegistroSelecionado(registro);
    setDialogExcluirAberto(true);
  };

  const handleConfirmarExclusao = async () => {
    console.log("Tentando confirmar exclusão...");
    if (registroSelecionado && registroSelecionado.id !== undefined && token) {
      console.log("Dados para exclusão: ID=", registroSelecionado.id, "Token presente=", !!token);
      try {
        await deletarRegistro(registroSelecionado.id, token);
        console.log("Registro excluído com sucesso!");
        handleAtualizarRelatorio();
        setDialogExcluirAberto(false);
        setRegistroSelecionado(null);
      } catch (error: any) {
        console.error("Erro ao excluir registro:", error.response?.data || error.message);
        // Adicionar feedback de erro para o usuário, se necessário
      }
    } else {
      console.log("Não foi possível excluir: registroSelecionado ou ID ou token ausente.", { registroSelecionado, token });
    }
  };

  const handleSaveNotificationSettings = (settings: NotificationSettings) => {
    console.log('App: Saving notification settings:', settings);
    saveNotificationSettings(settings);
    setNotificationSettings(settings);
    setDialogSettingsAberto(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          {isAuthenticated && (
            <>
              <Button color="inherit" component={Link} to="/registro-ponto">
                <PunchClockIcon sx={{ mr: 1 }} /> Registrar Ponto
              </Button>
              <Button color="inherit" component={Link} to="/relatorio">
                <AssessmentIcon sx={{ mr: 1 }} /> Relatórios
              </Button>
              {isAdmin && (
                <Button color="inherit" component={Link} to="/admin/users">
                  Gerenciar Usuários
                </Button>
              )}
              <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <IconButton sx={{ ml: 1 }} onClick={() => setDialogSettingsAberto(true)} color="inherit">
                <SettingsIcon />
              </IconButton>
              <IconButton sx={{ ml: 1 }} onClick={handleLogout} color="inherit">
                <LogoutIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><RegistroPonto onRegistro={handleAtualizarRelatorio} /></PrivateRoute>} />
          <Route path="/registro-ponto" element={<PrivateRoute><RegistroPonto onRegistro={handleAtualizarRelatorio} /></PrivateRoute>} />
          <Route path="/relatorio" element={<PrivateRoute><Relatorio data={dataSelecionada} onDataChange={handleDataChange} onEdit={handleAbrirEditar} onDelete={handleAbrirExcluir} /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
        </Routes>

        {isAuthenticated && (
          <>
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
          </>
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;