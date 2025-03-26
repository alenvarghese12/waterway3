const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD, // Use environment variables for security
  },
});

// Function to generate booking PDF
const generateBookingPDF = (bookingDetails) => {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, 'booking.pdf'); // Save PDF temporarily

  doc.pipe(fs.createWriteStream(filePath)); // Stream PDF content to a file

  // Add content to the PDF
  doc.fontSize(20).text('WaterWay Booking Confirmation', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Boat Name: ${bookingDetails.boatName}`);
  doc.text(`Start Date: ${new Date(bookingDetails.startDate).toDateString()}`);
  doc.text(`End Date: ${new Date(bookingDetails.endDate).toDateString()}`);
  doc.text(`Number of Adults: ${bookingDetails.adults}`);
  doc.text(`Total Amount: ₹ ${bookingDetails.totalAmount}`);
  doc.moveDown();
  doc.text('Thank you for booking with us!', { align: 'center' });

  doc.end(); // Finalize the PDF
  return filePath; // Return the file path for attachment
};

// Function to send booking email with PDF attachment
const sendBookingEmailWithPDF = async (userDetails, bookingDetails) => {
  const pdfFilePath = generateBookingPDF(bookingDetails); // Generate the PDF file

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: userDetails.email,
    subject: 'Booking Confirmation - Boat Rental',
    text: `Hello ${userDetails.name},\n\nWe are from WaterWay Booking,Thank you for booking with us.\n/n Please find attached the confirmation of your booking.\n\nBest regards,\nBoat Rental Team`,
    attachments: [
      {
        filename: 'booking-confirmation.pdf',
        path: pdfFilePath, // Path to the PDF file
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email with PDF sent to:', userDetails.email);

    // Remove the file after sending
    fs.unlink(pdfFilePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  } catch (error) {
    console.error('Error sending email with PDF:', error);
    throw new Error('Failed to send confirmation email with PDF.');
  }
};

/**
 * Generate a fraud warning report PDF for boat owners
 * @param {Object} fraudData - Data about the fraud detection
 * @returns {String} - Path to the generated PDF
 */
const generateFraudWarningPDF = (fraudData) => {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, 'fraud-warning.pdf');

  doc.pipe(fs.createWriteStream(filePath));

  // Add header with logo (if available)
  doc.fontSize(22).text('FRAUD RISK ALERT', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text('Suspicious Cancellation Pattern Detected', { align: 'center' });
  doc.moveDown(2);
  
  // Add warning box
  doc.rect(50, doc.y, 500, 80)
     .fillAndStroke('#fff8e1', '#ff9800');
  
  doc.fill('#d84315')
     .fontSize(14)
     .text(`Risk Level: ${fraudData.fraudRisk.toUpperCase()}`, 70, doc.y - 65);
  
  doc.fill('#333')
     .fontSize(12)
     .text(`Similarity Score: ${fraudData.similarityScore}%`, 70, doc.y - 40);
  
  doc.fill('#333')
     .text(`Cancellation Date: ${new Date(fraudData.cancellationTime).toLocaleString()}`, 70, doc.y - 20);
  
  doc.moveDown(2);
  
  // Add detailed explanation
  doc.fill('#000')
     .fontSize(14)
     .text('Warning Details:', { underline: true });
  
  doc.moveDown();
  
  // Add bullet points for each warning detail
  if (fraudData.warningDetails && fraudData.warningDetails.length > 0) {
    fraudData.warningDetails.forEach(detail => {
      doc.fontSize(11).text(`• ${detail}`, { indent: 20 });
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(11).text('• Unusual cancellation pattern detected', { indent: 20 });
    doc.moveDown(0.5);
  }
  
  doc.moveDown();
  
  // User provided reason section
  doc.fontSize(14).text('User Provided Reason:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(fraudData.userReason || 'No reason provided', { indent: 20 });
  
  doc.moveDown(2);
  
  // Recommendation section
  doc.fontSize(14).text('Recommendation:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(fraudData.recommendation || 'Monitor this customer closely', { indent: 20 });
  
  doc.moveDown(2);
  
  // Footer
  doc.fontSize(10).text('This fraud risk alert is generated based on machine learning analysis comparing this cancellation with hotel booking fraud patterns.', { align: 'center', width: 500 });
  doc.moveDown(0.5);
  doc.fontSize(10).text('This is an automated message. Please use your judgment and consider all factors before taking action.', { align: 'center', width: 500 });

  doc.end();
  return filePath;
};

/**
 * Send fraud warning email to boat owner
 * @param {Object} notificationData - Data for the email
 */
const sendFraudWarningEmail = async (notificationData) => {
  try {
    const pdfFilePath = generateFraudWarningPDF(notificationData);
    
    const riskColors = {
      high: '#d32f2f',
      medium: '#f57c00',
      'low-medium': '#ffb74d',
      low: '#4caf50',
      unknown: '#757575'
    };
    
    const riskColor = riskColors[notificationData.fraudRisk] || riskColors.unknown;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #d32f2f; margin-bottom: 5px;">Fraud Risk Alert</h1>
          <p style="color: #666; font-size: 16px;">Suspicious cancellation detected for ${notificationData.boatName}</p>
        </div>
        
        <div style="background-color: #fff8e1; border-left: 4px solid ${riskColor}; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; color: ${riskColor};">Risk Level: ${notificationData.fraudRisk.toUpperCase()}</p>
          <p style="margin: 8px 0 0 0;">Similarity Score: ${notificationData.similarityScore}%</p>
        </div>
        
        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Warning Details</h3>
        <ul style="padding-left: 20px;">
          ${notificationData.warningDetails.map(detail => `<li style="margin-bottom: 8px;">${detail}</li>`).join('')}
        </ul>
        
        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">User's Cancellation Reason</h3>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px;">"${notificationData.userReason}"</p>
        
        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Recommendation</h3>
        <p>${notificationData.recommendation}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; text-align: center; margin-top: 30px;">
          <p>This fraud risk alert is generated based on machine learning analysis comparing this cancellation with hotel booking fraud patterns.</p>
          <p>This is an automated message. Please use your judgment and consider all factors before taking action.</p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: notificationData.ownerEmail,
      subject: `[IMPORTANT] Fraud Risk Alert for ${notificationData.boatName}`,
      html: htmlContent,
      attachments: [
        {
          filename: 'fraud-risk-report.pdf',
          path: pdfFilePath,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('Fraud warning email sent to boat owner:', notificationData.ownerEmail);

    // Remove the file after sending
    fs.unlink(pdfFilePath, (err) => {
      if (err) console.error('Error deleting fraud warning PDF:', err);
    });
    
    return true;
  } catch (error) {
    console.error('Error sending fraud warning email:', error);
    return false;
  }
};

module.exports = { 
  sendBookingEmailWithPDF,
  sendFraudWarningEmail
};
