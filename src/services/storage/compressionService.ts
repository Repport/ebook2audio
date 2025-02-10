
export async function compressToZip(audioBuffer: ArrayBuffer): Promise<{ compressedData: Uint8Array; compressionRatio: number }> {
  try {
    // Create a zip stream using the web streams API
    const zipWriter = new Writer();
    
    // Add the audio file to the zip
    const filename = 'audio.mp3';
    await zipWriter.add(filename, new Uint8Array(audioBuffer));
    
    // Get the compressed data
    const compressedData = await zipWriter.close();
    
    // Calculate compression ratio
    const compressionRatio = Number((audioBuffer.byteLength / compressedData.length).toFixed(2));
    
    return {
      compressedData,
      compressionRatio
    };
  } catch (error) {
    console.error('Error compressing audio:', error);
    throw error;
  }
}

class Writer {
  private encoder = new TextEncoder();
  private chunks: Uint8Array[] = [];
  private compressor: CompressionStream;
  private writer: WritableStreamDefaultWriter<Uint8Array>;

  constructor() {
    this.compressor = new CompressionStream('deflate');
    const writable = this.compressor.writable;
    this.writer = writable.getWriter();
  }

  async add(filename: string, content: Uint8Array): Promise<void> {
    // Simple ZIP header and file entry
    const header = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // signature
      0x14, 0x00, // version
      0x00, 0x00, // flags
      0x08, 0x00, // compression method (deflate)
      0x00, 0x00, // file time
      0x00, 0x00, // file date
      0x00, 0x00, 0x00, 0x00, // crc32
      0x00, 0x00, 0x00, 0x00, // compressed size
      0x00, 0x00, 0x00, 0x00, // uncompressed size
      filename.length, 0x00, // filename length
      0x00, 0x00  // extra field length
    ]);

    const filenameBytes = this.encoder.encode(filename);
    await this.writer.write(header);
    await this.writer.write(filenameBytes);
    await this.writer.write(content);
  }

  async close(): Promise<Uint8Array> {
    await this.writer.close();
    const reader = this.compressor.readable.getReader();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) this.chunks.push(value);
    }

    // Combine all chunks
    const totalLength = this.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }
}
