import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro enviado" }, { status: 400 });
    }

    const text = await file.text();

    // Parser CSV robusto para lidar com vírgulas dentro de aspas
    const parseCSVLine = (text: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else current += char;
      }
      result.push(current.trim());
      return result;
    };

    const lines = text.split(/\r?\n/);

    // Expected headers: codigo,descricao,precoUnitario,taxaIVAId
    const articles = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 4) continue;

      articles.push({
        codigo: values[0].replace(/^"|"$/g, ''),
        descricao: values[1].replace(/^"|"$/g, ''),
        precoUnitario: parseFloat(values[2].replace(/^"|"$/g, '').replace(',', '.')),
        taxaIVAId: values[3].replace(/^"|"$/g, ''),
        tipo: "PRODUTO",
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const art of articles) {
      try {
        await db.artigo.upsert({
          where: { codigo: art.codigo },
          update: art,
          create: art,
        });
        successCount++;
      } catch (err) {
        console.error(`Erro ao importar artigo ${art.codigo}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      message: "Importação concluída",
      sucesso: successCount,
      erros: errorCount
    });

  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ error: "Erro interno ao processar ficheiro" }, { status: 500 });
  }
}
