import { Request, Response, NextFunction } from "express";
import { CustomError } from "../errors/customError.error";
import { uploadBuffer } from "../services/cloudinary.service";

/**
 * Tipo real por la firma del archivo: algunos navegadores y celulares mandan
 * `application/octet-stream`, así que el mimetype declarado no basta.
 */
function sniff(buffer: Buffer): "jpeg" | "png" | "webp" | "heic" | "avif" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
    return "webp";
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (/^(heic|heix|hevc|mif1|msf1)$/.test(brand)) return "heic";
    if (/^avi[fs]$/.test(brand)) return "avif";
  }
  return null;
}

/** POST /api/admin/uploads — multipart, campo `image`. */
export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) throw new CustomError("Adjunta una imagen en el campo image", 400);
    const kind = sniff(file.buffer);
    if (!kind) throw new CustomError("Formato no permitido. Usa JPG, PNG, WEBP o HEIC", 400);
    // Las fotos HEIC del iPhone se guardan como JPG para que cualquier navegador las vea.
    const result = await uploadBuffer(
      file.buffer,
      undefined,
      kind === "heic" ? { format: "jpg" } : {},
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
