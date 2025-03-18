const Security = require('../model/security');

exports.getSecurity = async (req, res) => {
  try {
    const { boatId } = req.params;
    const security = await Security.findOne({ boatId });
    res.json(security);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching security details', error: error.message });
  }
};

exports.updateSecurity = async (req, res) => {
  try {
    const { boatId } = req.params;
    const securityData = {
      ...req.body,
      safetyDocument: req.files?.safetyDocument?.[0]?.filename || req.body.safetyDocument,
      insuranceDocument: req.files?.insuranceDocument?.[0]?.filename || req.body.insuranceDocument
    };

    const security = await Security.findOneAndUpdate(
      { boatId },
      securityData,
      { new: true, upsert: true }
    );
    res.json(security);
  } catch (error) {
    res.status(500).json({ message: 'Error updating security details', error: error.message });
  }
}; 