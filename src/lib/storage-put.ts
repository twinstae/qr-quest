/**
 * presign으로 받은 주소에 파일을 실제로 올린다. 성공하면 true.
 * 네트워크가 끊겨 fetch가 던져도 false — 필드가 업로드 중인 채로 멈추지 않게.
 * 브라우저 테스트·Storybook에서는 alias로 storage-put.fake.ts가 대신 연결된다.
 */
export async function putToStorage(uploadUrl: string, file: File): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type PutToStorage = typeof putToStorage;
