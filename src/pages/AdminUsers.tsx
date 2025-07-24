import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import { UsuarioDTO, UsuarioResponseDTO, RegistroUsuarioDTO } from '../types/Usuario';
import { getAllUsers, createUser, updateUser, inactiveUser, reactivateUser, getRoles } from '../services/adminService';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UsuarioResponseDTO[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<UsuarioResponseDTO | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('');

  const { token } = useAuth();

  const fetchUsersAndRoles = async () => {
    if (!token) {
      setError('Usuário não autenticado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedUsers = await getAllUsers(token);
      setUsers(fetchedUsers);
      const fetchedRoles = await getRoles(token);
      setRoles(fetchedRoles);
    } catch (err: any) {
      console.error("Erro ao buscar usuários/roles:", err); // Log the raw error
      let errorMessage = 'Erro desconhecido.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, [token]);

  const handleOpenCreateDialog = () => {
    setCurrentUser(null);
    setFormNome('');
    setFormEmail('');
    setFormPassword('');
    setFormRole(roles.length > 0 ? String(roles[0]) : ''); // Garante que formRole seja string
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (user: UsuarioResponseDTO) => {
    setCurrentUser(user);
    setFormNome(user.nome);
    setFormEmail(user.email);
    setFormPassword(''); // Senha não é editada diretamente aqui
    setFormRole(user.roles.length > 0 ? String(user.roles[0]) : ''); // Garante que formRole seja string
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!token) {
      setError('Token de autenticação ausente.');
      return;
    }
    setError(null);
    try {
      if (currentUser) {
        // Atualizar usuário
        const userData: UsuarioDTO = {
          nome: formNome,
          email: formEmail,
          role: formRole,
        };
        await updateUser(currentUser.id, userData, token);
      } else {
        // Criar usuário
        if (!formPassword) {
          setError('A senha é obrigatória para novos usuários.');
          return;
        }
        const newUserData: RegistroUsuarioDTO = {
          nome: formNome,
          email: formEmail,
          password: formPassword,
          role: formRole,
        };
        await createUser(newUserData, token);
      }
      fetchUsersAndRoles(); // Recarrega a lista
      handleCloseDialog();
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err); // Log the raw error
      let errorMessage = 'Erro desconhecido.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleToggleUserStatus = async (user: UsuarioResponseDTO) => {
    if (!token) {
      setError('Token de autenticação ausente.');
      return;
    }
    setError(null);
    try {
      if (user.isAtivo) {
        await inactiveUser(user.id, token);
      } else {
        await reactivateUser(user.id, token);
      }
      fetchUsersAndRoles(); // Recarrega a lista
    } catch (err: any) {
      console.error("Erro ao alterar status do usuário:", err); // Log the raw error
      let errorMessage = 'Erro desconhecido.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  if (loading) {
    return <Typography>Carregando usuários...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>Gerenciamento de Usuários</Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenCreateDialog}
        sx={{ mb: 2 }}
      >
        Adicionar Novo Usuário
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} sx={{ backgroundColor: user.isAtivo ? 'inherit' : '#f5f5f5' }}>
                <TableCell sx={{ color: user.isAtivo ? 'inherit' : 'text.secondary' }}>{user.nome}</TableCell>
                <TableCell sx={{ color: user.isAtivo ? 'inherit' : 'text.secondary' }}>{user.email}</TableCell>
                <TableCell sx={{ color: user.isAtivo ? 'inherit' : 'text.secondary' }}>{Array.isArray(user.roles) ? user.roles.join(', ') : user.roles || ''}</TableCell>
                <TableCell sx={{ color: user.isAtivo ? 'inherit' : 'text.secondary' }}>{user.isAtivo ? 'Ativo' : 'Inativo'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenEditDialog(user)} color="primary" disabled={!user.isAtivo}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleToggleUserStatus(user)} color={user.isAtivo ? "error" : "success"}>
                    {user.isAtivo ? <PersonOffIcon /> : <PersonIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentUser ? 'Editar Usuário' : 'Adicionar Usuário'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            type="text"
            fullWidth
            variant="standard"
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="standard"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
          />
          {!currentUser && (
            <TextField
              margin="dense"
              label="Senha"
              type="password"
              fullWidth
              variant="standard"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
            />
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={formRole}
              label="Role"
              onChange={(e) => setFormRole(e.target.value as string)}
            >
              {roles.map((role) => (
                <MenuItem key={String(role)} value={String(role)}>{String(role)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit}>{currentUser ? 'Salvar Alterações' : 'Adicionar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
