import { resolveAuthenticatedUser } from "../utils/auth.js";
import * as certificateService from "../services/certificateService.js";
import { decryptPrivateKeyBin, getUploadedFileNameFromRequest, prepareSignedPdfBuffer, validateSignRequestData } from "../services/signService.js";

const isClientInputError = (error) => {
  return [
    "MISSING_PDF_FILE",
    "MISSING_PRIVATE_KEY_FILE",
    "INVALID_PIN_CODE",
    "INVALID_PRIVATE_KEY_BLOB",
    "UNSUPPORTED_PRIVATE_KEY_BLOB_VERSION",
    "INVALID_PRIVATE_KEY_PEM",
    "INVALID_PDF_HASH",
    "INVALID_PDF_FILE",
  ].includes(error?.code);
};

export const signPdfDocument = async (req, res) => {
  const decoded = resolveAuthenticatedUser(req, res);
  if (!decoded) return;

  try {
    const { pdfFile, binFile, pinCode } = validateSignRequestData({ files: req.files, body: req.body });
    const certificate = await certificateService.getActiveCertificate(decoded.id);

    if (!certificate) {
      return res.status(404).json({ message: "No active certificate found" });
    }

    const privateKeyPem = decryptPrivateKeyBin({ binFile, pinCode });
    const { signedPdfBuffer, hashHex, signatureBase64, certificateAttachmentName, sourceFileName } = await prepareSignedPdfBuffer({
      pdfFile,
      privateKeyPem,
      certificate,
    });

    const downloadName = `${getUploadedFileNameFromRequest(pdfFile, sourceFileName).replace(/\.pdf$/i, "")}-signed.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.setHeader("X-PDF-SHA256", hashHex);
    res.setHeader("X-Digital-Signature", signatureBase64);
    res.setHeader("X-Certificate-Attachment", certificateAttachmentName);

    return res.status(200).send(signedPdfBuffer);
  } catch (error) {
    if (isClientInputError(error)) {
      return res.status(400).json({ message: error.message });
    }

    if (error?.name === "Error" && /No active certificate/.test(error.message)) {
      return res.status(404).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Failed to sign PDF document" });
  }
};
