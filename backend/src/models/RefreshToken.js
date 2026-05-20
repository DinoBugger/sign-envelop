import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      // decide who is the owner of this refreshtoken
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jti: {
      // JWT ID
      // This act like an for each token,a base token have in its payload a jti too, when server decrypt it
      // it compares the jti saved in db and the decrypted jti
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenHash: {
      // refresh token before being saved, it is hashed into something that prevent db admin or hacker to read it, even when they have access to the database
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
