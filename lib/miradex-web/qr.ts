import QRCode from "qrcode";

const QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  errorCorrectionLevel: "M",
  margin: 1,
  width: 320,
};

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, QR_OPTIONS);
}
