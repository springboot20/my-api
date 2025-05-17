import { Schema, model } from 'mongoose';

const ProfileSchema = new Schema(
  {
    firstname: {
      type: String,
      default: 'John',
      trim: true,
    },
    lastname: {
      type: String,
      default: 'Doe',
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    present_address: {
      type: String,
      default: '',
    },
    permanent_address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    postal_code: {
      type: String,
      default: '',
    },
    // Add preferred view setting for app switching
    preferred_view: {
      type: String,
      enum: ['app', 'dashboard'],
      default: 'app', // Default to main banking app view
    },
    currency: {
      type: String,
      enum: ['USD', 'NGN'],
      default: 'NGN',
    },
    timezone: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

export const ProfileModel = model('Profile', ProfileSchema);
