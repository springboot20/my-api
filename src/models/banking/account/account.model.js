import { Schema, model } from 'mongoose';
import {
  AvailableAccountEnums,
  AvailableAccountStatus,
  AvailableAccountStatusEnums,
  AvailableAccountTypes,
} from '../../../constants.js';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const AccountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    account_number: {
      type: String,
      required: true,
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
    },
  },
  { timestamps: true }
);

// AccountSchema.index({ user: 1, account_number: 1 });
// AccountSchema.index({ account_number: 1 }, { unique: true });

AccountSchema.plugin(mongooseAggregatePaginate);

export const AccountModel = model('Account', AccountSchema);
