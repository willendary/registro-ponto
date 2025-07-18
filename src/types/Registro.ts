export type TipoRegistro = 'entrada' | 'saída' | 'saidaAlmoco' | 'voltaAlmoco';

export interface Registro {
  timestamp: Date;
  tipo: TipoRegistro;
}
