import cloudinary from "../config/cloudinary";

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  mimetype: string
) {
  const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteFromCloudinary(publicId: string) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}