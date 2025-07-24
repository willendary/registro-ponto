export interface UsuarioDTO {
  nome: string;
  email: string;
  password?: string; // Opcional para edição, obrigatório para criação
  role?: string; // Para atribuição de role na criação/edição
}

export interface UsuarioResponseDTO {
  id: string;
  nome: string;
  email: string;
  roles: string[];
}

export interface RegistroUsuarioDTO {
  nome: string;
  email: string;
  password: string;
  role?: string;
}
