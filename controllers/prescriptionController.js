const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { notifyUser } = require('../services/notification.service');

// Create prescription for patient
exports.createPrescription = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Doctor role required',
      });
    }

    const { appointmentId, patientId, medicines, notes } = req.body;

    if (!appointmentId || !patientId || !medicines || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, patientId, and medicines are required',
      });
    }

    // Get doctor ID from userId
    const doctor = await Doctor.findOne({ userId: req.user._id }).select('_id');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Verify appointment exists and belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctor._id,
      patientId,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or does not belong to this doctor',
      });
    }

    const prescription = await Prescription.create({
      appointmentId,
      patientId,
      doctorId: doctor._id,
      medicines,
      notes,
    });

    // Notify patient about new prescription
    try {
      const patient = await Patient.findById(patientId).select('userId');
      if (patient && patient.userId) {
        await notifyUser(
          patient.userId,
          'Patient',
          'Doctor has uploaded a new prescription for you',
          'info',
          'prescription',
          prescription._id
        );
      }
    } catch (notifyError) {
      console.error('Error notifying patient about prescription:', notifyError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription,
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create prescription',
    });
  }
};

// Get prescriptions for patient
exports.getMyPrescriptions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient role required',
      });
    }

    const patient = await Patient.findOne({ userId: req.user._id }).select('_id');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    const prescriptions = await Prescription.find({ patientId: patient._id })
      .populate('doctorId', 'specialization qualifications')
      .populate('appointmentId', 'appointmentDate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve prescriptions',
    });
  }
};

// Get prescription details
exports.getPrescriptionDetails = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('doctorId', 'specialization qualifications')
      .populate('appointmentId', 'appointmentDate reasonForVisit')
      .populate('patientId', 'firstName lastName');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error('Get prescription details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve prescription',
    });
  }
};

// Update prescription status
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Doctor role required',
      });
    }

    const { prescriptionId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or completed',
      });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { status },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    res.json({
      success: true,
      message: 'Prescription status updated',
      data: prescription,
    });
  } catch (error) {
    console.error('Update prescription status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update prescription',
    });
  }
};

// module.exports = {
//   createPrescription,
//   getMyPrescriptions,
//   getPrescriptionDetails,
//   updatePrescriptionStatus,
// };
