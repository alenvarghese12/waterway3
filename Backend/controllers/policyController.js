const Policy = require('../model/policy');

exports.getPolicies = async (req, res) => {
  try {
    const { boatId } = req.params;
    const policies = await Policy.find({ boatId });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policies', error: error.message });
  }
};

exports.addPolicy = async (req, res) => {
  try {
    const { boatId } = req.params;
    const { title, points, type } = req.body;

    // Validate points array
    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ message: 'At least one policy point is required' });
    }

    const policy = new Policy({
      boatId,
      title,
      points,
      type
    });

    await policy.save();
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error adding policy', error: error.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { title, points, type } = req.body;

    // Validate points array
    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ message: 'At least one policy point is required' });
    }

    const policy = await Policy.findByIdAndUpdate(
      policyId, 
      { title, points, type }, 
      { new: true }
    );
    
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error updating policy', error: error.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    await Policy.findByIdAndDelete(policyId);
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting policy', error: error.message });
  }
}; 