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

module.exports = { sendBookingEmailWithPDF };
