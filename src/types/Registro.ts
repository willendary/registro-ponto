export type TipoRegistro = 'entrada' | 'saída' | 'saidaAlmoco' | 'voltaAlmoco';

export interface Registro {
  id?: number; // Adicionado para o ID do banco de dados
  usuarioId?: string; // Adicionado para o ID do usuário
  timestamp: Date;
  tipo: TipoRegistro;
}