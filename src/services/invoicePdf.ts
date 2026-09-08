import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

export interface InvoiceDocument {
  id: string; date: string; clientName: string; clientPhone?: string;
  productName: string; quantity: number; unitPrice: number; totalAmount: number; paymentMethod: string;
}
export interface InvoiceShop { name?: string; address?: string; phone?: string; email?: string; nif?: string; logoUrl?: string; logo_url?: string }
const amount = (n: number) => `${Number(n || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`;

export async function buildInvoicePdf(invoice: InvoiceDocument, shop: InvoiceShop) {
  const doc = new jsPDF();
  const blue: [number, number, number] = [14, 107, 168];
  doc.setFillColor(...blue); doc.rect(0, 0, 210, 3, 'F');
  doc.setTextColor(30, 41, 59);
  let titleY = 25;
  const logo = shop.logoUrl || shop.logo_url;
  if (logo) {
    try {
      const image = doc.getImageProperties(logo);
      const scale = Math.min(55 / image.width, 20 / image.height);
      doc.addImage(logo, image.fileType, 18, 16, image.width * scale, image.height * scale);
      titleY = 44;
    } catch { /* The shop name remains visible if a stored logo cannot be decoded. */ }
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  const nameLines = doc.splitTextToSize(shop.name || 'Ma boutique', 95);
  doc.text(nameLines, 18, titleY);
  doc.setFontSize(22); doc.text('FACTURE', 192, 25, { align: 'right' });
  doc.setFillColor(237, 245, 250); doc.roundedRect(130, 28, 64, 10, 2, 2, 'F');
  doc.setFontSize(10); doc.setTextColor(...blue); doc.text(invoice.id, 190, 34, { align: 'right' });
  doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.date).toLocaleDateString('fr-FR'), 192, 43, { align: 'right' });
  const top = Math.max(62, titleY + nameLines.length * 8 + 10);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('ÉMETTEUR', 18, top); doc.text('CLIENT', 118, top);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const sender = doc.splitTextToSize([shop.name || 'Ma boutique', shop.address, shop.phone && `Tél. : ${shop.phone}`, shop.email, shop.nif && `NIF : ${shop.nif}`].filter(Boolean).join('\n'), 88);
  const recipient = doc.splitTextToSize([invoice.clientName, invoice.clientPhone].filter(Boolean).join('\n'), 74);
  doc.text(sender, 18, top + 9); doc.text(recipient, 118, top + 9);
  const tableY = top + 20 + Math.max(sender.length, recipient.length) * 5;
  autoTable(doc, { startY: tableY, margin: { left: 18, right: 18, bottom: 25 }, theme: 'plain',
    head: [['DÉSIGNATION', 'QTÉ', 'PRIX UNITAIRE', 'MONTANT']],
    body: [[invoice.productName, invoice.quantity, amount(invoice.unitPrice), amount(invoice.totalAmount)]],
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 4, overflow: 'linebreak', textColor: [30, 41, 59] },
    headStyles: { fillColor: blue, textColor: [255, 255, 255], fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 77 }, 1: { cellWidth: 15, halign: 'center' }, 2: { cellWidth: 41, halign: 'right' }, 3: { cellWidth: 41, halign: 'right' } },
  });
  let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
  if (y > 230) { doc.addPage(); y = 25; }
  doc.setFontSize(10); doc.text('Mode de paiement', 18, y);
  doc.text(({ cash: 'Espèces', mobile_money: 'Mobile Money', credit: 'Crédit' } as Record<string, string>)[invoice.paymentMethod] || invoice.paymentMethod, 18, y + 7);
  doc.setFillColor(...blue); doc.roundedRect(109, y - 7, 85, 25, 2, 2, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('TOTAL À FACTURER', 114, y); doc.setFontSize(16); doc.text(amount(invoice.totalAmount), 189, y + 10, { align: 'right' });
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  if (invoice.paymentMethod === 'credit') doc.text('Vente à crédit. Le solde est suivi sur le compte client.', 18, y + 30);
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.line(18, 272, 192, 272);
    doc.setTextColor(100); doc.setFontSize(9); doc.text('Merci pour votre confiance.', 18, 280); doc.text(`${page} / ${doc.getNumberOfPages()}`, 192, 280, { align: 'right' });
  }
  return doc;
}
