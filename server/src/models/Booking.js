import mongoose from 'mongoose';

export const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED'];
export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'];

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: BOOKING_STATUSES, required: true, index: true },
    cancellationReason: { type: String, trim: true, maxlength: 500, default: '' },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, maxlength: 500, default: '' },
    statusHistory: [{
      status: { type: String, enum: BOOKING_STATUSES, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      note: { type: String, trim: true, maxlength: 500, default: '' },
    }],
  },
  { timestamps: true },
);

bookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, startTime: 1 });

bookingSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id.toString(),
    bookingReference: this.bookingReference,
    userId: this.userId,
    resourceId: this.resourceId,
    startTime: this.startTime,
    endTime: this.endTime,
    purpose: this.purpose,
    status: this.status,
    cancellationReason: this.cancellationReason,
    cancelledBy: this.cancelledBy,
    reviewedBy: this.reviewedBy,
    reviewedAt: this.reviewedAt,
    reviewNote: this.reviewNote,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    statusHistory: this.statusHistory,
  };
};

export const Booking = mongoose.model('Booking', bookingSchema);
