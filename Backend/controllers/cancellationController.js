const CancellationPolicy = require('../model/cancellationPolicy');

exports.getCancellationPolicy = async (req, res) => {
  try {
    const { boatId } = req.params;
    const policy = await CancellationPolicy.findOne({ boatId });
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cancellation policy', error: error.message });
  }
};

exports.updateCancellationPolicy = async (req, res) => {
  try {
    const { boatId } = req.params;
    const policy = await CancellationPolicy.findOneAndUpdate(
      { boatId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cancellation policy', error: error.message });
  }
}; 