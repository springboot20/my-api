import { Schema, model } from 'mongoose';
import {
  AvailableAccountEnums,
  AvailableAccountStatus,
  AvailableAccountStatusEnums,
  AvailableAccountTypes,
} from '../../../constants.js';
import bcrypt from 'bcrypt';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const AccountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required:true
    },
    account_number: {
      type: String,
      required:true
    },
    type: {
      type: String,
      enum: AvailableAccountEnums,
      default: AvailableAccountTypes.NONE,
    },
    status: {
      type: String,
      enum: AvailableAccountStatusEnums,
      default: AvailableAccountStatus.ACTIVE,
    },
    cards: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Card',
      },
    ],
    pin: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

AccountSchema.index({ user: 1, account_number: 1 });
AccountSchema.index({ account_number: 1 }, { unique: true });

AccountSchema.plugin(mongooseAggregatePaginate);

export const AccountModel = model('Account', AccountSchema);

/**
 *
 * @param {string} entered_pin
 * @param {string} dbPin
 * @returns Promise<boolean>
 */
AccountSchema.methods.matchPasswords = async function (entered_pin) {
  return await bcrypt.compare(entered_pin, this.pin);
};

AccountSchema.pre('save', async function (next) {
  if (!this.isModified('pin')) return next();
  try {
    const salt = await bcrypt.genSalt(10); // 10 is a reasonable salt rounds value

    this.pin = await bcrypt.hash(this.pin, salt);

    next();
  } catch (error) {
    next(error); // Pass error to next middleware
  }
});
