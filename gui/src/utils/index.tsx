// 将引用对象转换为实际引用
export function conv_ref(x: any) {
  return x as unknown as React.RefObject<HTMLDivElement>;
}

/**
 * 格式化 JSON 字符串，智能处理数组：
 * - 如果数组内部不包含其他数组或对象，则该数组全在一行内
 * - 否则每个元素一行
 * @param obj 要格式化的对象
 * @returns 格式化后的 JSON 字符串
 */
export function formatJsonCompact(obj: any): string {
  // 首先将对象转为标准 JSON 字符串
  const jsonString = JSON.stringify(obj, null, 2);

  // 使用正则表达式查找不包含 { 或 [ 的数组，并将其转换为单行格式
  return jsonString.replace(
    /\[\n\s+([^\[\{]*?(?:\n\s+[^\[\{]*?)*)\n\s+\]/g,
    (match, p1) => {
      // 检查是否包含嵌套的数组或对象
      if (p1.includes("[") || p1.includes("{")) {
        return match; // 如包含嵌套结构，保持原样
      }

      // 将捕获的数组内容按逗号分隔并去除前导空格
      const values = p1.split(",").map((item: string) => item.trim());
      return `[${values.join(", ")}]`;
    }
  );
}
