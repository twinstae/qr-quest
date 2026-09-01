import type { ImageStorage } from "./types.ts";

export function createFakeImageStorage(): ImageStorage {
  return {
    async presignUpload({ filename }) {
      const key = `${crypto.randomUUID()}-${filename}`;
      return {
        uploadUrl: `https://fake-storage.test/upload/${key}`,
        publicUrl: `https://fake-storage.test/public/${key}`,
      };
    },
  } satisfies ImageStorage;
}

export default createFakeImageStorage;
