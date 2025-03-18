const Overview = require('../model/overview');
const fs = require('fs');
const path = require('path');

exports.getOverview = async (req, res) => {
  try {
    const { boatId } = req.params;
    const overview = await Overview.findOne({ boatId });
    res.json(overview || { message: 'No overview found' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overview', error: error.message });
  }
};

exports.createOrUpdateOverview = async (req, res) => {
  try {
    const { boatId } = req.params;
    const { description, aboutProperty, propertyHighlights } = req.body;
    
    // Handle file uploads
    const images = req.files ? req.files.map(file => file.filename) : [];

    let overview = await Overview.findOne({ boatId });

    if (overview) {
      // If updating and new images are uploaded, delete old images
      if (images.length > 0 && overview.images) {
        overview.images.forEach(oldImage => {
          const imagePath = path.join(__dirname, '../uploads', oldImage);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }

      overview.description = description;
      overview.aboutProperty = aboutProperty;
      overview.propertyHighlights = JSON.parse(propertyHighlights);
      if (images.length > 0) {
        overview.images = images;
      }
    } else {
      overview = new Overview({
        boatId,
        description,
        aboutProperty,
        propertyHighlights: JSON.parse(propertyHighlights),
        images
      });
    }

    await overview.save();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: 'Error updating overview', error: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { boatId, imageIndex } = req.params;
    const overview = await Overview.findOne({ boatId });

    if (!overview) {
      return res.status(404).json({ message: 'Overview not found' });
    }

    // Delete the file
    const imageToDelete = overview.images[imageIndex];
    const imagePath = path.join(__dirname, '../uploads', imageToDelete);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove the image from the array
    overview.images.splice(imageIndex, 1);
    await overview.save();

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
};

exports.deleteHighlight = async (req, res) => {
  try {
    const { boatId, highlightIndex } = req.params;
    const overview = await Overview.findOne({ boatId });

    if (!overview) {
      return res.status(404).json({ message: 'Overview not found' });
    }

    overview.propertyHighlights.splice(highlightIndex, 1);
    await overview.save();

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting highlight', error: error.message });
  }
}; 