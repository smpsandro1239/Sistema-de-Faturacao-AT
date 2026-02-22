import { db } from "@/lib/db";

/**
 * Regista uma ação de auditoria
 */
export async function registarAuditoria(params: {
  utilizadorId: string;
  acao: "CREATE" | "UPDATE" | "DELETE" | "EMIT" | "ANNUL" | "EXPORT" | "LOGIN" | "CONFIG";
  entidade: string;
  entidadeId: string;
  documentoId?: string;
  valorAntigo?: Record<string, unknown>;
  valorNovo?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.auditoria.create({
      data: {
        utilizadorId: params.utilizadorId,
        documentoId: params.documentoId,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        valorAntigo: params.valorAntigo ? JSON.stringify(params.valorAntigo) : null,
        valorNovo: params.valorNovo ? JSON.stringify(params.valorNovo) : null,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Erro ao registar auditoria:", error);
    // Não lançar erro para não interromper operações
  }
}

/**
 * Busca logs de auditoria com paginação
 */
export async function buscarAuditoria(params: {
  entidade?: string;
  entidadeId?: string;
  utilizadorId?: string;
  acao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  pagina?: number;
  porPagina?: number;
}): Promise<{
  dados: Array<{
    id: string;
    utilizadorId: string;
    acao: string;
    entidade: string;
    entidadeId: string;
    valorAntigo: string | null;
    valorNovo: string | null;
    ip: string | null;
    createdAt: Date;
  }>;
  total: number;
  pagina: number;
  porPagina: number;
}> {
  const { pagina = 1, porPagina = 50 } = params;
  const skip = (pagina - 1) * porPagina;

  const where: Record<string, unknown> = {};

  if (params.entidade) where.entidade = params.entidade;
  if (params.entidadeId) where.entidadeId = params.entidadeId;
  if (params.utilizadorId) where.utilizadorId = params.utilizadorId;
  if (params.acao) where.acao = params.acao;

  if (params.dataInicio || params.dataFim) {
    where.createdAt = {};
    if (params.dataInicio) (where.createdAt as Record<string, unknown>).gte = params.dataInicio;
    if (params.dataFim) (where.createdAt as Record<string, unknown>).lte = params.dataFim;
  }

  const [dados, total] = await Promise.all([
    db.auditoria.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: porPagina,
    }),
    db.auditoria.count({ where }),
  ]);

  return {
    dados,
    total,
    pagina,
    porPagina,
  };
}

/**
 * Ações de auditoria mais comuns
 */
export const AcoesAuditoria = {
  CRIAR_CLIENTE: { acao: "CREATE" as const, entidade: "Cliente" },
  ATUALIZAR_CLIENTE: { acao: "UPDATE" as const, entidade: "Cliente" },
  ELIMINAR_CLIENTE: { acao: "DELETE" as const, entidade: "Cliente" },
  
  CRIAR_ARTIGO: { acao: "CREATE" as const, entidade: "Artigo" },
  ATUALIZAR_ARTIGO: { acao: "UPDATE" as const, entidade: "Artigo" },
  ELIMINAR_ARTIGO: { acao: "DELETE" as const, entidade: "Artigo" },
  
  CRIAR_SERIE: { acao: "CREATE" as const, entidade: "Serie" },
  ATUALIZAR_SERIE: { acao: "UPDATE" as const, entidade: "Serie" },
  
  CRIAR_DOCUMENTO: { acao: "CREATE" as const, entidade: "Documento" },
  EMITIR_DOCUMENTO: { acao: "EMIT" as const, entidade: "Documento" },
  ANULAR_DOCUMENTO: { acao: "ANNUL" as const, entidade: "Documento" },
  
  EXPORTAR_SAFT: { acao: "EXPORT" as const, entidade: "SAF-T" },
  
  LOGIN: { acao: "LOGIN" as const, entidade: "Utilizador" },
  CONFIGURACAO: { acao: "CONFIG" as const, entidade: "Empresa" },
};

/**
 * Descrições legíveis das ações
 */
export const DescricoesAcoes: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Eliminação",
  EMIT: "Emissão",
  ANNUL: "Anulação",
  EXPORT: "Exportação",
  LOGIN: "Login",
  CONFIG: "Configuração",
};

/**
 * Descrições legíveis das entidades
 */
export const DescricoesEntidades: Record<string, string> = {
  Cliente: "Cliente",
  Artigo: "Artigo",
  Serie: "Série",
  Documento: "Documento",
  "SAF-T": "SAF-T",
  Utilizador: "Utilizador",
  Empresa: "Empresa",
};
