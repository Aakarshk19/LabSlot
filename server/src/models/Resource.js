import mongoose from 'mongoose';

const bookingConfigSchema = new mongoose.Schema(
  {
    minDurationMinutes: { type: Number, default: 30, min: 15 },
    maxDurationMinutes: { type: Number, default: 180, min: 15 },
    maxAdvanceDays: { type: Number, default: 14, min: 1 },
    cancellationCutoffHours: { type: Number, default: 1, min: 0 },
    operatingStart: { type: String, default: '08:00' },
    operatingEnd: { type: String, default: '18:00' },
    slotIntervalMinutes: { type: Number, default: 30, min: 15 },
  },
  { _id: false },
);

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    resourceCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      required: true,
      enum: ['WORKSTATION', 'COMPUTER', 'ELECTRONIC_EQUIPMENT', 'LABORATORY_INSTRUMENT'],
    },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    specifications: { type: String, trim: true, maxlength: 2000, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'MAINTENANCE', 'DEACTIVATED'],
      default: 'AVAILABLE',
      required: true,
    },
    bookingConfig: { type: bookingConfigSchema, default: () => ({}) },
    bookingLockUntil: { type: Date, default: null },
    bookingLockOwner: { type: String, default: null },
  },
  { timestamps: true },
);

resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ location: 1 });
resourceSchema.index({ name: 'text', resourceCode: 'text', description: 'text' });

resourceSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    resourceCode: this.resourceCode,
    description: this.description,
    category: this.category,
    location: this.location,
    specifications: this.specifications,
    imageUrl: this.imageUrl,
    status: this.status,
    bookingConfig: this.bookingConfig,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Resource = mongoose.model('Resource', resourceSchema);
