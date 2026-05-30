import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectName: { type: String, required: true, trim: true },
    subjectEmail: { type: String, required: true, trim: true },
    subjectCountry: { type: String, default: "VN" },
    subjectProvince: { type: String, trim: true },
    userSerialNumber: { type: String, required: true },
    issuerName: { type: String, required: true, default: "Your Non-Profit CA" },
    algorithm: { type: String, required: true, default: "RSA" },
    keySize: { type: Number, required: true, default: 2048 },
    keyType: { type: String, required: true, default: "spki" },
    publicKey: { type: String, required: true, trim: true },
    fingerprint: { type: String, required: true, unique: true, trim: true },
    certSerialNumber: { type: String, required: true, unique: true },
    signatureAlgorithm: { type: String, default: "SHA256withRSA" },
    rawCertificate: { type: String, required: true },
    validFrom: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },
    revokedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

certificateSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

certificateSchema.index({ certSerialNumber: 1 });

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
