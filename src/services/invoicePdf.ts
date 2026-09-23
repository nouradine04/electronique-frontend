import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { imageAsDataUrl } from './localMedia.js';

export interface InvoiceDocument {
  id: string; date: string; clientName: string; clientPhone?: string;
  productName: string; quantity: number; unitPrice: number; totalAmount: number; paymentMethod: string;
}
export interface InvoiceShop { name?: string; address?: string; phone?: string; email?: string; nif?: string; logoUrl?: string; logo_url?: string }
const amount = (n: number) => `${Number(n || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`;

export async function buildInvoicePdf(invoice: InvoiceDocument, shop: InvoiceShop) {
  const doc = new jsPDF();
  const blue: [number, number, number] = [14, 107, 168];
  doc.setFillColor(...blue); doc.rect(18, 0, 42, 4, 'F');
  doc.setTextColor(30, 41, 59);
  let titleY = 25;
  const logo = shop.logoUrl || shop.logo_url;
  if (logo) {
    try {
      const data = await imageAsDataUrl(logo) as string;
      const image = doc.getImageProperties(data);
      const scale = Math.min(55 / image.width, 20 / image.height);
      doc.addImage(data, image.fileType, 18, 16, image.width * scale, image.height * scale);
      titleY = 44;
    } catch { /* The shop name remains visible if a stored logo cannot be decoded. */ }
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  const nameLines = doc.splitTextToSize(shop.name || 'Ma boutique', 95);
  doc.text(nameLines, 18, titleY);
  doc.setFontSize(26); doc.setTextColor(...blue); doc.text('FACTURE', 192, 25, { align: 'right' });
  doc.setFontSize(9);
  const reference = doc.splitTextToSize(`N° ${invoice.id}`, 72);
  doc.text(reference, 192, 34, { align: 'right' });
  doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 192, 39 + reference.length * 4, { align: 'right' });
  const top = Math.max(64, titleY + nameLines.length * 8 + 10, 50 + reference.length * 4);
  doc.setDrawColor(221, 231, 239); doc.setLineWidth(.3); doc.line(18, top - 9, 192, top - 9);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...blue); doc.text('VOTRE BOUTIQUE', 18, top); doc.text('FACTURÉ À', 118, top);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const sender = doc.splitTextToSize([shop.name || 'Ma boutique', shop.address, shop.phone && `Tél. : ${shop.phone}`, shop.email, shop.nif && `NIF : ${shop.nif}`].filter(Boolean).join('\n'), 88);
  const recipient = doc.splitTextToSize([invoice.clientName || 'Client', invoice.clientPhone && `Tél. : ${invoice.clientPhone}`].filter(Boolean).join('\n'), 74);
  doc.text(sender, 18, top + 9); doc.text(recipient, 118, top + 9);
  const tableY = top + 23 + Math.max(sender.length, recipient.length) * 5;
  autoTable(doc, { startY: tableY, margin: { left: 18, right: 18, bottom: 25 }, theme: 'plain',
    head: [['DÉSIGNATION', 'QTÉ', 'PRIX UNITAIRE', 'MONTANT']],
    body: [[invoice.productName, invoice.quantity, amount(invoice.unitPrice), amount(invoice.totalAmount)]],
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 5, overflow: 'linebreak', textColor: [30, 41, 59] },
    headStyles: { fillColor: blue, textColor: [255, 255, 255], fontSize: 8, cellPadding: 3, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 77 }, 1: { cellWidth: 15, halign: 'center', cellPadding: { top: 5, bottom: 5, left: 2, right: 2 } }, 2: { cellWidth: 41, halign: 'right' }, 3: { cellWidth: 41, halign: 'right' } },
  });
  let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
  if (y > 230) { doc.addPage(); y = 25; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...blue); doc.text('PAIEMENT', 18, y);
  doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(({ cash: 'Espèces', mobile_money: 'Mobile Money', credit: 'Crédit' } as Record<string, string>)[invoice.paymentMethod] || invoice.paymentMethod, 18, y + 7);
  doc.setFillColor(237, 245, 250); doc.rect(109, y - 7, 85, 29, 'F');
  doc.setDrawColor(...blue); doc.setLineWidth(.7); doc.line(109, y + 22, 194, y + 22);
  doc.setTextColor(...blue); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('TOTAL DE LA FACTURE', 114, y);
  const total = amount(invoice.totalAmount);
  doc.setFontSize(19);
  if (doc.getTextWidth(total) > 75) doc.setFontSize(19 * 75 / doc.getTextWidth(total));
  doc.text(total, 189, y + 13, { align: 'right' });
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  if (invoice.paymentMethod === 'credit') doc.text('Vente à crédit. Le solde est suivi sur le compte client.', 18, y + 30);
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.line(18, 272, 192, 272);
    doc.setTextColor(100); doc.setFontSize(9); doc.text('Merci pour votre confiance.', 18, 280); doc.text(`${page} / ${doc.getNumberOfPages()}`, 192, 280, { align: 'right' });
  }
  return doc;
}
