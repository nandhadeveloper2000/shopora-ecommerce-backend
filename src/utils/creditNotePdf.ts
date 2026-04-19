import PDFDocument from "pdfkit";

export function buildCreditNotePdf(docData: any) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  doc.fontSize(18).text("Credit Note", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Credit Note No: ${docData.creditNoteNumber || ""}`);
  doc.text(`Order Number: ${docData.orderNumber || ""}`);
  doc.text(`Reason: ${docData.reason || ""}`);
  doc.text(`Amount: ${docData.amount || 0}`);
  doc.moveDown();

  doc.fontSize(12).text("Customer");
  doc.fontSize(10).text(docData.customerName || "");
  doc.text(docData.customerEmail || "");
  doc.moveDown();

  doc.fontSize(11).text(`Issued On: ${new Date(docData.createdAt || Date.now()).toLocaleString()}`);
  doc.text(`Status: ${docData.status || ""}`);

  doc.end();
  return doc;
}

export function buildCreditNotePdfBuffer(docData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = buildCreditNotePdf(docData);

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}