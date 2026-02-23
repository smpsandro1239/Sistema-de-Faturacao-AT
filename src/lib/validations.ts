import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Password é obrigatória"),
});

export const clientSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  nif: z.string().length(9, "NIF deve ter 9 dígitos").regex(/^\d+$/, "NIF deve conter apenas números"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  morada: z.string().optional(),
  codigoPostal: z.string().optional(),
  localidade: z.string().optional(),
  telefone: z.string().optional(),
});

export const articleSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipo: z.enum(["PRODUTO", "SERVICO"]).optional().default("PRODUTO"),
  precoUnitario: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)]).transform(v => typeof v === "string" ? parseFloat(v) : v),
  unidade: z.string().optional().default("UN"),
  taxaIVAId: z.string().min(1, "Taxa de IVA é obrigatória"),
  isencaoId: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});
