export type TipoRegistro = 'entrada' | 'saída';

export interface Registro {
  timestamp: Date;
  tipo: TipoRegistro;
}
