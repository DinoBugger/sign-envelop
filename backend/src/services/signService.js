import fs from "fs";
import crypto from "crypto";
import { PDFDocument } from "pdf-lib";
import signpdf, { Signer } from "@signpdf/signpdf";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";

const PIN_CODE_PATTERN = /^\d{6}$/;
const BLOB_MAGIC = "NPK1";
const BLOB_VERSION = 1;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
};

const SIGNATURE_LENGTH = 8192;

const createSignError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const getSingleUploadedFile = (fileLike) => {
  if (Array.isArray(fileLike)) {
    return fileLike[0] || null;
  }

  return fileLike || null;
};

const normalizePinCode = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const sanitizeFileStem = (value, fallback) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const safeValue = normalizedValue
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safeValue || fallback;
};

const resolveFileBuffer = (fileLike) => {
  const uploadedFile = getSingleUploadedFile(fileLike);

  if (!uploadedFile) {
    return null;
  }

  if (Buffer.isBuffer(uploadedFile)) {
    return uploadedFile;
  }

  if (Buffer.isBuffer(uploadedFile.buffer)) {
    return uploadedFile.buffer;
  }

  if (typeof uploadedFile.path === "string" && uploadedFile.path) {
    return fs.readFileSync(uploadedFile.path);
  }

  if (typeof uploadedFile === "string") {
    return Buffer.from(uploadedFile, "base64");
  }

  return null;
};

export const validateSignRequestData = ({ files, body } = {}) => {
  const pdfFile = getSingleUploadedFile(files?.documentFile) || getSingleUploadedFile(files?.pdf);
  if (!pdfFile) {
    throw createSignError("Thiếu file PDF cần ký.", "MISSING_PDF_FILE");
  }

  const binFile = getSingleUploadedFile(files?.privateKeyFile) || getSingleUploadedFile(files?.bin);
  if (!binFile) {
    throw createSignError("Thiếu file khóa bí mật (.bin).", "MISSING_PRIVATE_KEY_FILE");
  }

  const pinCode = normalizePinCode(body?.pinCode ?? body?.pin);
  if (!PIN_CODE_PATTERN.test(pinCode)) {
    throw createSignError("Mã PIN không hợp lệ (phải là chuỗi đúng 6 chữ số).", "INVALID_PIN_CODE");
  }

  return {
    pdfFile,
    binFile,
    pinCode,
  };
};

export const hashPdfFileContent = (pdfFile) => {
  const pdfBuffer = resolveFileBuffer(pdfFile);

  if (!pdfBuffer) {
    throw createSignError("Thiếu file PDF cần ký.", "MISSING_PDF_FILE");
  }

  return crypto.createHash("sha256").update(pdfBuffer).digest("hex");
};

export const encryptHashToDigitalSignature = ({ hashHex, privateKeyPem } = {}) => {
  const normalizedHash = typeof hashHex === "string" ? hashHex.trim() : "";

  if (!/^[a-f0-9]{64}$/i.test(normalizedHash)) {
    throw createSignError("Mã hash SHA-256 không hợp lệ.", "INVALID_PDF_HASH");
  }

  if (typeof privateKeyPem !== "string" || !privateKeyPem.includes("BEGIN PRIVATE KEY")) {
    throw createSignError("Private key PEM không hợp lệ.", "INVALID_PRIVATE_KEY_PEM");
  }

  return crypto.privateEncrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(normalizedHash, "hex"),
  );
};

export const decryptPrivateKeyBin = ({ binFile, pinCode } = {}) => {
  const uploadedBuffer = resolveFileBuffer(binFile);

  if (!uploadedBuffer) {
    throw createSignError("Thiếu file khóa bí mật (.bin).", "MISSING_PRIVATE_KEY_FILE");
  }

  const normalizedPin = normalizePinCode(pinCode);
  if (!PIN_CODE_PATTERN.test(normalizedPin)) {
    throw createSignError("Mã PIN không hợp lệ (phải là chuỗi đúng 6 chữ số).", "INVALID_PIN_CODE");
  }

  if (uploadedBuffer.length < 12) {
    throw createSignError("File khóa bí mật (.bin) không hợp lệ.", "INVALID_PRIVATE_KEY_BLOB");
  }

  const magic = uploadedBuffer.toString("ascii", 0, 4);
  if (magic !== BLOB_MAGIC) {
    throw createSignError("File khóa bí mật (.bin) không hợp lệ.", "INVALID_PRIVATE_KEY_BLOB");
  }

  const version = uploadedBuffer.readUInt8(4);
  if (version !== BLOB_VERSION) {
    throw createSignError("Phiên bản file khóa bí mật không được hỗ trợ.", "UNSUPPORTED_PRIVATE_KEY_BLOB_VERSION");
  }

  const saltLength = uploadedBuffer.readUInt8(5);
  const ivLength = uploadedBuffer.readUInt8(6);
  const authTagLength = uploadedBuffer.readUInt8(7);
  const ciphertextLength = uploadedBuffer.readUInt32BE(8);

  const expectedLength = 12 + saltLength + ivLength + authTagLength + ciphertextLength;
  if (uploadedBuffer.length !== expectedLength) {
    throw createSignError("File khóa bí mật (.bin) không hợp lệ.", "INVALID_PRIVATE_KEY_BLOB");
  }

  let offset = 12;
  const salt = uploadedBuffer.subarray(offset, offset + saltLength);
  offset += saltLength;
  const iv = uploadedBuffer.subarray(offset, offset + ivLength);
  offset += ivLength;
  const authTag = uploadedBuffer.subarray(offset, offset + authTagLength);
  offset += authTagLength;
  const ciphertext = uploadedBuffer.subarray(offset, offset + ciphertextLength);

  const derivedKey = crypto.scryptSync(normalizedPin, salt, 32, SCRYPT_OPTIONS);
  const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
  decipher.setAuthTag(authTag);

  const privateKeyPem = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");

  if (!privateKeyPem.includes("BEGIN PRIVATE KEY")) {
    throw createSignError("Private key giải mã không hợp lệ.", "INVALID_PRIVATE_KEY_PEM");
  }

  return privateKeyPem;
};

const getUploadedFileName = (fileLike, fallback) => {
  const uploadedFile = getSingleUploadedFile(fileLike);
  const originalName = typeof uploadedFile?.originalname === "string" ? uploadedFile.originalname : "";
  return sanitizeFileStem(originalName || fallback, fallback);
};

class PdfHashSigner extends Signer {
  constructor(privateKeyPem) {
    super();
    this.privateKeyPem = privateKeyPem;
    this.lastHashHex = "";
    this.lastSignatureBase64 = "";
  }

  async sign(pdfBuffer) {
    this.lastHashHex = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
    const signatureBuffer = encryptHashToDigitalSignature({ hashHex: this.lastHashHex, privateKeyPem: this.privateKeyPem });
    this.lastSignatureBase64 = signatureBuffer.toString("base64");
    return signatureBuffer;
  }
}

export const prepareSignedPdfBuffer = async ({ pdfFile, privateKeyPem, certificate } = {}) => {
  const pdfBuffer = resolveFileBuffer(pdfFile);

  if (!pdfBuffer) {
    throw createSignError("Thiếu file PDF cần ký.", "MISSING_PDF_FILE");
  }

  if (typeof privateKeyPem !== "string" || !privateKeyPem.includes("BEGIN PRIVATE KEY")) {
    throw createSignError("Private key PEM không hợp lệ.", "INVALID_PRIVATE_KEY_PEM");
  }

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(pdfBuffer);
  } catch (error) {
    throw createSignError("File PDF không hợp lệ.", "INVALID_PDF_FILE");
  }
  const certificateText = typeof certificate?.rawCertificate === "string" && certificate.rawCertificate.trim() ? certificate.rawCertificate.trim() : JSON.stringify(certificate ?? {}, null, 2);
  const certificateAttachmentName = `certificate-${sanitizeFileStem(certificate?.certSerialNumber, "certificate")}.txt`;

  await pdfDoc.attach(Buffer.from(certificateText, "utf8"), certificateAttachmentName, {
    mimeType: "text/plain",
    description: "Chung thu so duoc nhung kem theo tai lieu da ky.",
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  pdfDoc.setProducer("node-auth-system signing backend");
  pdfDoc.setCreator("node-auth-system signing backend");
  pdfDoc.setSubject(`Signed by ${certificate?.subjectName || "unknown user"}`);
  pdfDoc.setKeywords(["digital-signature", certificate?.subjectName || "unknown-user", certificate?.certSerialNumber || "unknown-serial"]);

  pdflibAddPlaceholder({
    pdfDoc,
    reason: "Xac nhan tai lieu duoc ky so.",
    contactInfo: certificate?.subjectEmail || "no-reply@local",
    name: certificate?.subjectName || "Signed document",
    location: certificate?.subjectProvince || certificate?.subjectCountry || "VN",
    signingTime: new Date(),
    signatureLength: SIGNATURE_LENGTH,
  });

  const pdfWithPlaceholder = await pdfDoc.save({ useObjectStreams: false });
  const signer = new PdfHashSigner(privateKeyPem);
  const signedPdfBuffer = await signpdf.sign(Buffer.from(pdfWithPlaceholder), signer);

  return {
    signedPdfBuffer,
    hashHex: signer.lastHashHex,
    signatureBase64: signer.lastSignatureBase64,
    certificateAttachmentName,
    sourceFileName: getUploadedFileName(pdfFile, "document.pdf"),
  };
};

export const getUploadedFileNameFromRequest = getUploadedFileName;
