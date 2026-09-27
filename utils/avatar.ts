import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { createUserFileUpload } from "./trpc";

// Mirrors monoweb's USER_IMAGE_MAX_SIZE_KIB: S3 rejects larger uploads.
const MAX_SIZE_BYTES = 512 * 1024;
const AVATAR_SIZE = 512;
const CDN_URL = "https://cdn.online.ntnu.no";

export class AvatarPermissionError extends Error {}

/** Lets the user pick or take a photo and crop it square. Returns null if they cancel. */
export async function pickAvatar(source: "camera" | "library"): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    shape: "oval",
    quality: 1,
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new AvatarPermissionError("Online har ikke tilgang til kameraet.");
    result = await ImagePicker.launchCameraAsync({ ...options, cameraType: ImagePicker.CameraType.front });
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

// arrayBuffer rather than blob(): Response.blob() goes through React Native's slower Blob and warns about it.
const readBytes = async (uri: string) => new Uint8Array(await (await fetch(uri)).arrayBuffer());

/** Downscales to a square JPEG and lowers the quality until it fits the upload limit. */
async function prepareAvatar(uri: string): Promise<Uint8Array> {
  // The pickers crop square, but center-crop anyway so an odd result never gets stretched.
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const side = Math.min(original.width, original.height);
  const crop = {
    originX: Math.floor((original.width - side) / 2),
    originY: Math.floor((original.height - side) / 2),
    width: side,
    height: side,
  };

  for (const [size, compress] of [
    [AVATAR_SIZE, 0.85],
    [AVATAR_SIZE, 0.7],
    [384, 0.7],
    [256, 0.6],
  ] as const) {
    const context = ImageManipulator.manipulate(uri).crop(crop);
    if (side > size) context.resize({ width: size, height: size });
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress });
    const bytes = await readBytes(saved.uri);
    if (bytes.byteLength <= MAX_SIZE_BYTES) return bytes;
  }
  throw new Error("Bildet er for stort.");
}

/** Uploads a picked image through the API's presigned S3 post and returns its public URL. */
export async function uploadAvatar(uri: string): Promise<string> {
  const prepared = await prepareAvatar(uri);
  const post = await createUserFileUpload("avatar.jpg", "image/jpeg");

  // Expo's fetch can't send React Native's { uri, name, type } file parts ("Unsupported FormDataPart
  // implementation"); it takes Blobs or anything with bytes(). The image was re-encoded to JPEG above,
  // so iPhone HEIC photos never reach S3 as HEIC.
  const file = { name: "avatar.jpg", type: "image/jpeg", bytes: async () => prepared };

  const form = new FormData();
  for (const [key, value] of Object.entries(post.fields)) form.append(key, value);
  // S3 requires the file to be the last field.
  form.append("file", file as unknown as Blob);

  const response = await fetch(post.url, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Opplastingen feilet (${response.status}).`);

  const key = post.fields.key.split("/").map(encodeURIComponent).join("/");
  return `${CDN_URL}/${key}`;
}
