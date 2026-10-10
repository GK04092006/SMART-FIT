const mongoose = require('mongoose');

/**
 * SosIncident — persisted whenever a participant or guide triggers the Smart SOS.
 * Each document captures the full dispatch chain:
 *   GPS → Nearest Guide → Nearest Emergency Point → Organizer → Incident ID
 */
const sosIncidentSchema = new mongoose.Schema(
  {
    // Auto-generated human-readable ID, e.g. "INC-SOS-7821"
    incidentId: {
      type: String,
      unique: true,
    },

    // Who triggered the SOS
    triggeredBy: {
      type: mongoose.Schema.Types.Mixed, // userId or guest_demo string
      required: true,
    },
    triggeredByName: { type: String, default: 'Unknown' },

    // GPS coordinates at time of trigger (mock values are fine client-side)
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }, // metres
      address: { type: String, default: '' },
    },

    // Nearest guide resolved during the pipeline
    nearestGuide: {
      name:       { type: String, default: '' },
      phone:      { type: String, default: '' },
      distanceKm: { type: Number, default: 0 },
      eta:        { type: String, default: '' },
    },

    // Nearest emergency / first-aid point
    nearestEmergencyPoint: {
      name:       { type: String, default: '' },
      type:       { type: String, default: 'First Aid Post' }, // 'Hospital' | 'First Aid Post' | 'Rescue Base'
      distanceKm: { type: Number, default: 0 },
    },

    // Organizer notification status
    organizerNotified: { type: Boolean, default: false },
    organizerName:     { type: String,  default: '' },

    // Overall incident lifecycle
    status: {
      type: String,
      enum: ['Active', 'Responding', 'Resolved', 'Cancelled'],
      default: 'Active',
    },

    // Optional notes / resolution summary
    notes: { type: String, default: '' },

    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate incidentId before saving
sosIncidentSchema.pre('save', async function (next) {
  if (!this.incidentId) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.incidentId = `INC-SOS-${rand}`;
  }
  next();
});

module.exports =
  mongoose.models.SosIncident ||
  mongoose.model('SosIncident', sosIncidentSchema);
