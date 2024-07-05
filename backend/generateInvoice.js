const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const generateInvoice = async (shipmentData) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 750]);
  const { width, height } = page.getSize();

  const fontSize = 12;
  const margin = 50;
  const textYStart = height - margin;

  const today = new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const orderDate = new Date(shipmentData.order.orderPlacedDateTime).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentYear = today.slice(-4)
  const invoiceNumber = `${currentYear}-${shipmentData.order.orderId}`;
  const companyName = shipmentData.billingDetails.company || shipmentData.shipmentDetails.company || '';
  const vatNumber = shipmentData.billingDetails.vatNumber || shipmentData.shipmentDetails.vatNumber || '';
  const kvkNumber = shipmentData.billingDetails.kvkNumber || shipmentData.shipmentDetails.kvkNumber || '';
  const country = shipmentData.billingDetails.countryCode === 'NL' ? 'Nederland' : 'België'
  const vatPercentage = shipmentData.shipmentItems.offer?.reference.charAt(0).toLowerCase() !== 'c' ? (shipmentData.billingDetails?.countryCode === 'BE' ? 0.06 : 0.09) : 0.21

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const drawText = (text, x, y, size = 12, fontType = font) => {
    page.drawText(text, {
        x,
        y,
        size,
        font: fontType,
        color: rgb(0, 0, 0),
    });
  };

  // Header
  page.drawText(`Factuur ${invoiceNumber}`, {
    x: width - margin - 180,
    y: textYStart - 40,
    size: fontSize * 1.1,
    font: boldFont,
    color: rgb(0, 0, 0)
  });

  // Company Logo
  const logoPath = path.join(__dirname, 'public', 'logo.png');
  const logoImage = await pdfDoc.embedPng(fs.readFileSync(logoPath));
  page.drawImage(logoImage, {
    x: margin,
    // y: textYStart,
    y: textYStart - 60,
    height: 60,
    width: 130
  });

  drawText(`${companyName}`, 50, height - 160, 12, boldFont);
  drawText(`${shipmentData.billingDetails.firstName} ${shipmentData.billingDetails.surname}`, 50, height - 175);
  drawText(`${shipmentData.billingDetails.streetName} ${shipmentData.billingDetails.houseNumber}`, 50, height - 190);
  drawText(`${shipmentData.billingDetails.zipCode} ${shipmentData.billingDetails.city}`, 50, height - 205);
  drawText(country, 50, height - 220);

  drawText('jouw-mail@gmail.com', 400, height - 200);
  drawText('Straatnaam 12', 400, height - 215);
  drawText('9900 AZ Groningen', 400, height - 230);
  drawText('Nederland', 400, height - 245);
  
  drawText(`Factuurnummer`, 50, height - 340, 12, boldFont);
  drawText(`${invoiceNumber}`, 50, height - 355);
  drawText(`Factuur Datum`, 50, height - 380, 12, boldFont);
  drawText(`${today}`, 50, height - 395);
  drawText(`Bestelnummer`, 260, height - 340, 12, boldFont);
  drawText(`${shipmentData.order.orderId}`, 260, height - 355);
  drawText(`Bestel Datum`, 260, height - 380, 12, boldFont);
  drawText(`${orderDate}`, 260, height - 395);
  drawText(`BTW-nummer`, 450, height - 340, 12, boldFont);
  drawText(`${vatNumber}`, 450, height - 355);
  drawText(`KvK-nummer`, 450, height - 380, 12, boldFont);
  drawText(`${kvkNumber}`, 450, height - 395);

  let tableY = height - 450;
  drawText('Omschrijving', 50, tableY, 12, boldFont);
  drawText('Aantal', 250, tableY, 12, boldFont);
  drawText('BTW %', 330, tableY, 12, boldFont);
  drawText('Prijs', 410, tableY, 12, boldFont);
  drawText('Subtotal', 490, tableY, 12, boldFont);
  tableY -= 20;

  let totalExclusiveVAT = 0;
  let totalVATAmount = 0;

  // calculate BTW amount 
  shipmentData.shipmentItems.forEach(item => {
    const vatAmount = item.unitPrice - (item.unitPrice / (1 + vatPercentage));
    const priceExVat = item.unitPrice - vatAmount;
    const subtotal = item.quantity * priceExVat;
    totalExclusiveVAT += item.quantity * priceExVat;
    totalVATAmount += vatAmount;
    
    let title = item.product.title;
    let firstLine = title.substring(0, 41);
    let remainingText = title.substring(41); // This will be empty if title is <= 41 characters

    drawText(firstLine, 50, tableY);

    if (remainingText.length > 0) {
      tableY -= 20;
      drawText(remainingText, 50, tableY);
    }
    // drawText(item.product.title, 50, tableY);
    drawText(item.quantity.toString(), 250, tableY);
    drawText((vatPercentage * 100) + '%', 330, tableY);
    drawText('€ ' + priceExVat.toFixed(2), 410, tableY);
    drawText('€ ' + subtotal.toFixed(2), 490, tableY);
    tableY -= 20;
  });

  const total = totalExclusiveVAT + totalVATAmount;

  tableY -= 20;
  drawText(`Totaal excl. BTW`, 350, tableY);
  drawText(`€ ${totalExclusiveVAT.toFixed(2)}`, 490, tableY);
  tableY -= 20;
  drawText(`BTW Bedrag`, 370, tableY);
  drawText(`€ ${totalVATAmount.toFixed(2)}`, 495, tableY);
  tableY -= 20;
  drawText(`Totaal incl. BTW`, 345, tableY, 12, boldFont);
  drawText(`€ ${total.toFixed(2)}`, 490, tableY, 12, boldFont);
  tableY -= 40;

  tableY -= 40;
  drawText(`Bedrijsgegevens`, 50, tableY, 12, boldFont);
  drawText(`Betaalmethode         Betaald via bolPlatform`, 345, tableY);
  tableY -= 20;
  drawText(`KvK-nummer           1234567`, 50, tableY);
  tableY -= 15;
  drawText(`BTW-nummer          NL123456789B01`, 50, tableY);
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

module.exports = generateInvoice;