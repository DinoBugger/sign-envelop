import mongoose from "mongoose";
const rsaPublicKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    algorithm: {
      type: String,
      required: true,
      default: "RSA",
      trim: true,
    },
    // key standard for key in this case using Subject Public Key Info
    keyType: {
      type: String,
      required: true,
      default: "spki",
      trim: true,
    },
    publicKey: {
      type: String,
      required: true,
      trim: true,
    },
    // Hashing type of public key because it quite long not comfortable for displaying
    fingerprint: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure a user can have at most one active key record.
rsaPublicKeySchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

const RSAPublicKey = mongoose.model("RSAPublicKey", rsaPublicKeySchema);

export default RSAPublicKey;
