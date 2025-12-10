import { model, models, Schema } from 'mongoose';

const AccountSchema = new Schema(
  {
    gid: { type: String, required: true },
    mail: { type: String, required: true },
    mcc: { type: String, required: true, unique: true },
    refreshToken: { type: String, required: true },
    accessToken: { type: String },
    expiredTime: { type: Number },
  },
  {
    timestamps: true,
  },
);

const Account = models.Account || model('Account', AccountSchema);

export default Account;
