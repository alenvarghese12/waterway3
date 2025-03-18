const Amenity = require('../model/amenity');

exports.getAmenities = async (req, res) => {
  try {
    const { boatId } = req.params;
    const amenities = await Amenity.findOne({ boatId });
    res.json(amenities || { amenities: [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching amenities', error: error.message });
  }
};

exports.addAmenity = async (req, res) => {
  try {
    const { boatId } = req.params;
    const { category, item } = req.body;

    let amenities = await Amenity.findOne({ boatId });
    if (!amenities) {
      amenities = new Amenity({ boatId, amenities: [] });
    }

    const categoryIndex = amenities.amenities.findIndex(c => c.category === category);
    if (categoryIndex === -1) {
      amenities.amenities.push({ category, items: [item] });
    } else {
      amenities.amenities[categoryIndex].items.push(item);
    }

    await amenities.save();
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: 'Error adding amenity', error: error.message });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    const { boatId, category, itemId } = req.params;
    const amenities = await Amenity.findOne({ boatId });
    
    const categoryIndex = amenities.amenities.findIndex(c => c.category === category);
    if (categoryIndex !== -1) {
      amenities.amenities[categoryIndex].items = 
        amenities.amenities[categoryIndex].items.filter(item => item._id.toString() !== itemId);
      await amenities.save();
    }

    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting amenity', error: error.message });
  }
};

exports.updateAmenity = async (req, res) => {
  try {
    const { boatId, itemId } = req.params;
    const { category, item } = req.body;

    const amenities = await Amenity.findOne({ boatId });
    if (!amenities) {
      return res.status(404).json({ message: 'Amenities not found' });
    }

    const categoryIndex = amenities.amenities.findIndex(c => c.category === category);
    if (categoryIndex !== -1) {
      const itemIndex = amenities.amenities[categoryIndex].items.findIndex(
        item => item._id.toString() === itemId
      );
      if (itemIndex !== -1) {
        amenities.amenities[categoryIndex].items[itemIndex] = {
          ...amenities.amenities[categoryIndex].items[itemIndex],
          ...item
        };
        await amenities.save();
      }
    }

    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: 'Error updating amenity', error: error.message });
  }
}; 