import PDFDocument from "pdfkit";

export function buildInvoicePdf(order: any) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  doc.fontSize(18).text(order.invoice?.companyName || "Invoice", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Invoice No: ${order.invoice?.invoiceNumber || ""}`);
  doc.text(
    `Invoice Date: ${
      order.invoice?.invoiceDate ? new Date(order.invoice.invoiceDate).toLocaleString() : ""
    }`
  );
  doc.text(`Order Number: ${order.orderNumber}`);
  doc.text(`Payment Method: ${order.paymentMethod}`);
  doc.text(`Payment Status: ${order.paymentStatus}`);
  doc.moveDown();

  doc.fontSize(12).text("Bill To");
  doc.fontSize(10).text(order.billingAddressSnapshot?.fullName || "");
  doc.text(order.billingAddressSnapshot?.addressLine1 || "");
  if (order.billingAddressSnapshot?.addressLine2) doc.text(order.billingAddressSnapshot.addressLine2);
  doc.text(
    `${order.billingAddressSnapshot?.city || ""}, ${order.billingAddressSnapshot?.state || ""} - ${order.billingAddressSnapshot?.postalCode || ""}`
  );
  doc.text(order.billingAddressSnapshot?.country || "");
  doc.text(`Phone: ${order.billingAddressSnapshot?.mobile || ""}`);
  doc.moveDown();

  doc.fontSize(12).text("Items");
  doc.moveDown(0.5);

  order.items.forEach((item: any, index: number) => {
    doc.fontSize(10).text(
      `${index + 1}. ${item.productSnapshot?.productTitle || ""} | Qty: ${item.quantity} | Price: ${item.price} | Tax: ${item.itemTaxAmount} | Total: ${item.itemGrandTotal}`
    );
  });

  doc.moveDown();
  doc.fontSize(11).text(`Subtotal: ${order.subtotal}`);
  doc.text(`Shipping: ${order.shippingTotal}`);
  doc.text(`Discount: ${order.discountAmount}`);
  doc.text(`Tax: ${order.taxAmount}`);
  doc.fontSize(12).text(`Grand Total: ${order.grandTotal}`, { align: "right" });

  doc.moveDown();
  doc.fontSize(10).text(order.invoice?.companyAddress || "");
  if (order.invoice?.companyGst) doc.text(`GSTIN: ${order.invoice.companyGst}`);

  doc.end();
  return doc;
}

export function buildInvoicePdfBuffer(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = buildInvoicePdf(order);

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}