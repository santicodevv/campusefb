// uuid@13 solo se publica como ESM y Jest corre en CommonJS: en los e2e se
// reemplaza por el generador nativo de Node, equivalente para v4.
import { randomUUID } from 'crypto';

export const v4 = (): string => randomUUID();
