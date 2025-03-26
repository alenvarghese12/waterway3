/**
 * This script imports hotel reservation data from CSV file
 * into MongoDB for use in fraud detection comparison
 */

const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Define schema for hotel reservations
const hotelReservationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  noOfAdults: { type: Number },
  noOfChildren: { type: Number },
  typeOfMealPlan: { type: String },
  roomType: { type: String },
  leadTime: { type: Number }, // Days ahead of arrival date the booking was made
  arrivalDate: { type: Date },
  marketSegment: { type: String },
  repeated: { type: Boolean }, // Whether the customer is a repeat guest
  noOfPreviousCancellations: { type: Number },
  noOfPreviousBookingsNotCancelled: { type: Number },
  avgPricePerRoom: { type: Number },
  noOfSpecialRequests: { type: Number },
  bookingStatus: { type: String, enum: ['Cancelled', 'Not_Cancelled'] }
}, { timestamps: true });

// Create model if it doesn't exist
const HotelReservation = mongoose.model('HotelReservation', hotelReservationSchema);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waterway')
  .then(() => {
    console.log('MongoDB connected successfully');
    importData();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import data from CSV
function importData() {
  const csvFilePath = process.argv[2] || path.join(__dirname, 'Hotel_Reservations.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    console.error('Usage: node importHotelData.js [path/to/Hotel_Reservations.csv]');
    process.exit(1);
  }
  
  console.log(`Importing data from ${csvFilePath}...`);
  
  const results = [];
  let processedCount = 0;
  
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => {
      // Clean/transform field names and values
      const transformedData = {
        bookingId: data.Booking_ID,
        noOfAdults: parseInt(data.no_of_adults || '0', 10),
        noOfChildren: parseInt(data.no_of_children || '0', 10),
        typeOfMealPlan: data.type_of_meal_plan,
        roomType: data.room_type_reserved,
        leadTime: parseInt(data.lead_time || '0', 10),
        arrivalDate: parseDate(data.arrival_date || data.date_of_reservation),
        marketSegment: data.market_segment_type,
        repeated: data.repeated_guest === '1',
        noOfPreviousCancellations: parseInt(data.no_of_previous_cancellations || '0', 10),
        noOfPreviousBookingsNotCancelled: parseInt(data.no_of_previous_bookings_not_canceled || '0', 10),
        avgPricePerRoom: parseFloat(data.avg_price_per_room || '0'),
        noOfSpecialRequests: parseInt(data.no_of_special_requests || '0', 10),
        bookingStatus: data.booking_status
      };
      
      results.push(transformedData);
      processedCount++;
      
      if (processedCount % 1000 === 0) {
        console.log(`Processed ${processedCount} records...`);
      }
    })
    .on('end', async () => {
      console.log(`Parsed ${results.length} records from CSV. Saving to MongoDB...`);
      
      try {
        // Clear existing data
        await HotelReservation.deleteMany({});
        console.log('Cleared existing hotel reservation data');
        
        // Insert in batches
        const BATCH_SIZE = 500;
        for (let i = 0; i < results.length; i += BATCH_SIZE) {
          const batch = results.slice(i, i + BATCH_SIZE);
          await HotelReservation.insertMany(batch, { ordered: false });
          console.log(`Inserted batch ${i/BATCH_SIZE + 1}/${Math.ceil(results.length/BATCH_SIZE)}`);
        }
        
        console.log(`Successfully imported ${results.length} hotel reservations`);
        
        // Create indexes for faster queries
        await HotelReservation.collection.createIndex({ bookingStatus: 1 });
        await HotelReservation.collection.createIndex({ leadTime: 1 });
        await HotelReservation.collection.createIndex({ noOfPreviousCancellations: 1 });
        
        console.log('Created indexes on hotel reservation collection');
        console.log('Import completed successfully');
        
        mongoose.disconnect();
      } catch (error) {
        console.error('Error importing data:', error);
        mongoose.disconnect();
        process.exit(1);
      }
    });
}

// Helper function to parse date string
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  // Try different date formats
  try {
    // MM/DD/YYYY format
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try as ISO date
    return new Date(dateStr);
  } catch (e) {
    console.error(`Error parsing date: ${dateStr}`);
    return new Date();
  }
}

// Handle application termination
process.on('SIGINT', () => {
  mongoose.disconnect();
  console.log('Import process interrupted');
  process.exit(0);
}); 