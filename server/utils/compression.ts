import zlib, { ZlibOptions } from 'node:zlib';


export function deflateValue(value: string, options: ZlibOptions = {}): Buffer {
  const compressedBuffer: Buffer = zlib.deflateSync(value, options);

  return compressedBuffer;
}

export function inflateValue(value: Buffer, options: ZlibOptions = {}): Buffer {
  const uncompressedBuffer: Buffer = zlib.inflateSync(value, options);

  return uncompressedBuffer;
}
