const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');

router.get('/:boatId/policies', policyController.getPolicies);
router.post('/:boatId/policies', policyController.addPolicy);
router.put('/:boatId/policies/:policyId', policyController.updatePolicy);
router.delete('/:boatId/policies/:policyId', policyController.deletePolicy);

module.exports = router; 