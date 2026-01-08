const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionDetails,
  updatePrescriptionStatus,
} = require('../controllers/prescriptionController');

// Get all prescriptions for logged-in patient
router.get('/', getMyPrescriptions);

// Get prescription details
router.get('/:prescriptionId', getPrescriptionDetails);

// Create prescription (doctor only)
router.post('/', createPrescription);

// Update prescription status (doctor only)
router.patch('/:prescriptionId/status', updatePrescriptionStatus);

module.exports = router;
