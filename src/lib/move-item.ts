/** from 자리의 항목을 빼서 to 자리에 넣은 새 배열. 범위를 벗어나면 그대로 돌려준다. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items];
  if (from < 0 || from >= result.length || to < 0 || to >= result.length) return result;
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved as T);
  return result;
}
