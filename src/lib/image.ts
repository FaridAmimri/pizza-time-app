/** Réduit la photo du téléphone (souvent > 5 Mo) avant envoi : plus rapide, même lisibilité. */
export async function compresserImage(file: File, maxCote = 2200) {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxCote / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const apercu = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: apercu.split(",")[1], mediaType: "image/jpeg" as const, apercu };
}
