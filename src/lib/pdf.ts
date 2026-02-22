import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LinhaDocumento {
  codigoArtigo: string;
  descricaoArtigo: string;
  quantidade: number;
  precoUnitario: number;
  taxaIVAPercentagem: number;
  base: number;
  valorIVA: number;
}

interface DocumentoPDF {
  numeroFormatado: string;
  tipo: string;
  dataEmissao: string | null;
  clienteNome: string;
  clienteNif: string;
  clienteMorada: string | null;
  clienteCodigoPostal: string | null;
  clienteLocalidade: string | null;
  empresaNome: string;
  empresaNif: string;
  empresaMorada: string;
  empresaCodigoPostal: string;
  empresaLocalidade: string;
  totalBase: number;
  totalIVA: number;
  totalLiquido: number;
  hash: string | null;
  atcud: string | null;
  observacoes: string | null;
  linhas: LinhaDocumento[];
  qrCodeURL?: string;
}

const getTipoDocumentoLabel = (tipo: string): string => {
  const tipos: Record<string, string> = {
    FATURA: "Fatura",
    FATURA_RECIBO: "Fatura-Recibo",
    NOTA_CREDITO: "Nota de Crédito",
    NOTA_DEBITO: "Nota de Débito",
  };
  return tipos[tipo] || tipo;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export async function gerarPDFDocumento(documento: DocumentoPDF, options: { output?: 'file' | 'buffer' } = {}): Promise<any> {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor: [number, number, number] = [5, 150, 105]; // emerald-600
  const darkColor: [number, number, number] = [15, 23, 42]; // slate-900
  const grayColor: [number, number, number] = [100, 116, 139]; // slate-500
  
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header - Empresa
  doc.setFontSize(20);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text(documento.empresaNome, margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`NIF: ${documento.empresaNif}`, margin, yPos);
  
  yPos += 5;
  doc.text(documento.empresaMorada, margin, yPos);
  
  yPos += 5;
  doc.text(`${documento.empresaCodigoPostal} ${documento.empresaLocalidade}`, margin, yPos);
  
  // Document Type Badge (right side)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  const tipoLabel = getTipoDocumentoLabel(documento.tipo);
  doc.text(tipoLabel, pageWidth - margin, 25, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(documento.numeroFormatado, pageWidth - margin, 33, { align: 'right' });
  
  if (documento.atcud) {
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`ATCUD: ${documento.atcud}`, pageWidth - margin, 40, { align: 'right' });
  }
  
  // Separator line
  yPos = 55;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  // Cliente Info
  yPos = 65;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Destinatário', margin + 5, yPos + 3);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  yPos += 10;
  doc.text(`${documento.clienteNome}`, margin + 5, yPos);
  doc.text(`NIF: ${documento.clienteNif}`, pageWidth - margin - 5, yPos, { align: 'right' });
  
  yPos += 5;
  const moradaCliente = [
    documento.clienteMorada,
    documento.clienteCodigoPostal && documento.clienteLocalidade 
      ? `${documento.clienteCodigoPostal} ${documento.clienteLocalidade}`
      : ''
  ].filter(Boolean).join(', ');
  
  doc.text(moradaCliente, margin + 5, yPos);
  
  // Data de Emissão
  yPos += 15;
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Data de Emissão: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(documento.dataEmissao ? formatDate(documento.dataEmissao) : 'Rascunho', margin + 35, yPos);
  
  // Tabela de Linhas
  yPos += 15;
  
  const tableData = documento.linhas.map((linha) => [
    linha.codigoArtigo,
    linha.descricaoArtigo,
    linha.quantidade.toString(),
    formatCurrency(linha.precoUnitario),
    `${linha.taxaIVAPercentagem}%`,
    formatCurrency(linha.base),
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Código', 'Descrição', 'Qtd', 'Preço Unit.', 'IVA', 'Base']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });
  
  // Totais
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  doc.setFontSize(10);
  
  // Base Tributável
  doc.setTextColor(...grayColor);
  doc.text('Base Tributável:', pageWidth - margin - 70, finalY);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(documento.totalBase), pageWidth - margin, finalY, { align: 'right' });
  
  // Total IVA
  doc.setTextColor(...grayColor);
  doc.text('Total IVA:', pageWidth - margin - 70, finalY + 7);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(documento.totalIVA), pageWidth - margin, finalY + 7, { align: 'right' });
  
  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.line(pageWidth - margin - 70, finalY + 12, pageWidth - margin, finalY + 12);
  
  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Total:', pageWidth - margin - 70, finalY + 20);
  doc.text(formatCurrency(documento.totalLiquido), pageWidth - margin, finalY + 20, { align: 'right' });
  
  // Observações
  let obsY = finalY + 35;
  if (documento.observacoes) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, obsY - 5, pageWidth - 2 * margin, 15, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text('Observações:', margin + 5, obsY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(documento.observacoes, margin + 40, obsY);
    
    obsY += 20;
  }
  
  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, obsY, pageWidth - margin, obsY);
  
  // Footer Fiscal
  const footerY = obsY + 15;
  
  // QR Code placeholder area
  if (documento.qrCodeURL) {
    try {
      doc.addImage(documento.qrCodeURL, 'PNG', margin, footerY, 30, 30);
    } catch {
      // Se não conseguir adicionar o QR code, desenha um placeholder
      doc.setDrawColor(...grayColor);
      doc.rect(margin, footerY, 30, 30);
      doc.setFontSize(8);
      doc.text('QR Code', margin + 15, footerY + 17, { align: 'center' });
    }
  }
  
  // Informações Fiscais
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Documento Certificado AT', pageWidth - margin, footerY + 5, { align: 'right' });
  
  if (documento.hash) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    const hashTruncated = documento.hash.substring(0, 30) + '...';
    doc.text(`Hash: ${hashTruncated}`, pageWidth - margin, footerY + 12, { align: 'right' });
    
    if (documento.atcud) {
      doc.text(`ATCUD: ${documento.atcud}`, pageWidth - margin, footerY + 18, { align: 'right' });
    }
    
    doc.setTextColor(180, 190, 200);
    doc.text('Processado por programa certificado nº AT/DEMO/2024', pageWidth - margin, footerY + 28, { align: 'right' });
  }
  
  if (options.output === 'buffer') {
    return Buffer.from(doc.output('arraybuffer'));
  }

  // Save (Browser only)
  if (typeof window !== 'undefined') {
    const fileName = `${documento.numeroFormatado.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }
}
