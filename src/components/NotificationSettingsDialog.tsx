import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Switch, TextField, Box } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { NotificationSettings } from '../types/NotificationSettings';

interface Props {
  open: boolean;
  onClose: () => void;
  currentSettings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
}

const NotificationSettingsDialog: React.FC<Props> = ({ open, onClose, currentSettings, onSave }) => {
  const [settings, setSettings] = useState<NotificationSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Configurações de Notificação</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: '16px !important' }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              />
            }
            label="Habilitar Notificações"
          />

          <TimePicker
            label="Lembrar Entrada às"
            value={settings.entryReminderTime}
            onChange={(newValue) => setSettings({ ...settings, entryReminderTime: newValue })}
            disabled={!settings.enabled}
          />

          <TextField
            label="Lembrar Saída após (horas)"
            type="number"
            value={settings.exitReminderDuration}
            onChange={(e) => setSettings({ ...settings, exitReminderDuration: parseInt(e.target.value) || 0 })}
            disabled={!settings.enabled}
            inputProps={{ min: 0, max: 24 }}
          />

          <TextField
            label="Verificar a cada (minutos)"
            type="number"
            value={settings.checkIntervalMinutes}
            onChange={(e) => setSettings({ ...settings, checkIntervalMinutes: parseInt(e.target.value) || 1 })}
            disabled={!settings.enabled}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default NotificationSettingsDialog;