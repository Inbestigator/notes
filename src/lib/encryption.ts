import {
  aesKey,
  decrypt,
  encrypt,
  exportKey,
  generateKey,
  importKey,
} from "@enc/core";

const aesOptions = aesKey("Integrity protection", 128);

export async function generateEncryptionKey() {
  const key = await generateKey(aesOptions);
  return (await exportKey("jwk", key)).k!;
}

const getCryptoKey = (key: string, type: KeyType) =>
  importKey(
    "jwk",
    type,
    {
      alg: "A128GCM",
      ext: true,
      k: key,
      key_ops: ["encrypt", "decrypt"],
      kty: "oct",
    },
    aesOptions,
    false,
  );

export async function encryptData(
  publicKey: string,
  data: Uint8Array<ArrayBuffer>,
) {
  const key = await getCryptoKey(publicKey, "public");
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await encrypt(data.buffer, key, { iv });
  return { encrypted, iv };
}

export async function decryptData(
  iv: Uint8Array<ArrayBuffer>,
  encrypted: Uint8Array<ArrayBuffer>,
  privateKey: string,
) {
  const key = await getCryptoKey(privateKey, "private");
  return decrypt(encrypted.buffer, key, { iv });
}

/*
This code is sourced from https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/data/encode.ts
Thank you!
*/

const CONCAT_BUFFERS_VERSION = 1;
/** how many bytes we use to encode how many bytes the next chunk has.
 * Corresponds to DataView setter methods (setUint32, setUint16, etc).
 *
 * NOTE ! values must not be changed, which would be backwards incompatible !
 */
const VERSION_DATAVIEW_BYTES = 4;
const NEXT_CHUNK_SIZE_DATAVIEW_BYTES = 4;

const DATA_VIEW_BITS_MAP = { 1: 8, 2: 16, 4: 32 } as const;

// getter
function dataView(buffer: Uint8Array, bytes: 1 | 2 | 4, offset: number): number;
// setter
function dataView(
  buffer: Uint8Array,
  bytes: 1 | 2 | 4,
  offset: number,
  value: number,
): Uint8Array;
/**
 * abstraction over DataView that serves as a typed getter/setter in case
 * you're using constants for the byte size and want to ensure there's no
 * discrepenancy in the encoding across refactors.
 *
 * DataView serves for an endian-agnostic handling of numbers in ArrayBuffers.
 */
function dataView(
  buffer: Uint8Array,
  bytes: 1 | 2 | 4,
  offset: number,
  value?: number,
): Uint8Array | number {
  if (value != null) {
    if (value > Math.pow(2, DATA_VIEW_BITS_MAP[bytes]) - 1) {
      throw new Error(
        `attempting to set value higher than the allocated bytes (value: ${value}, bytes: ${bytes})`,
      );
    }
    const method = `setUint${DATA_VIEW_BITS_MAP[bytes]}` as const;
    new DataView(buffer.buffer)[method](offset, value);
    return buffer;
  }
  const method = `getUint${DATA_VIEW_BITS_MAP[bytes]}` as const;
  return new DataView(buffer.buffer)[method](offset);
}

/**
 * Resulting concatenated buffer has this format:
 *
 * [
 *   VERSION chunk (4 bytes)
 *   LENGTH chunk 1 (4 bytes)
 *   DATA chunk 1 (up to 2^32 bits)
 *   LENGTH chunk 2 (4 bytes)
 *   DATA chunk 2 (up to 2^32 bits)
 *   ...
 * ]
 *
 * @param buffers each buffer (chunk) must be at most 2^32 bits large (~4GB)
 */
export const concatBuffers = (...buffers: Uint8Array[]) => {
  const bufferView = new Uint8Array(
    VERSION_DATAVIEW_BYTES +
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES * buffers.length +
      buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0),
  );

  let cursor = 0;

  // as the first chunk we'll encode the version for backwards compatibility
  dataView(bufferView, VERSION_DATAVIEW_BYTES, cursor, CONCAT_BUFFERS_VERSION);
  cursor += VERSION_DATAVIEW_BYTES;

  for (const buffer of buffers) {
    dataView(
      bufferView,
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES,
      cursor,
      buffer.byteLength,
    );
    cursor += NEXT_CHUNK_SIZE_DATAVIEW_BYTES;

    bufferView.set(buffer, cursor);
    cursor += buffer.byteLength;
  }

  return bufferView;
};

/** can only be used on buffers created via `concatBuffers()` */
export const splitBuffers = (concatenatedBuffer: Uint8Array) => {
  const buffers = [];

  let cursor = 0;

  cursor += VERSION_DATAVIEW_BYTES;

  while (true) {
    const chunkSize = dataView(
      concatenatedBuffer,
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES,
      cursor,
    );
    cursor += NEXT_CHUNK_SIZE_DATAVIEW_BYTES;

    buffers.push(concatenatedBuffer.slice(cursor, cursor + chunkSize));
    cursor += chunkSize;
    if (cursor >= concatenatedBuffer.byteLength) {
      break;
    }
  }

  return buffers;
};
