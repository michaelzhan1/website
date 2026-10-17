import { renderToString } from "katex";
import type { KatexOptions } from "katex";
import { defineHastPlugin } from "satteri";
import type { Element } from "hast";

const katexOptions: KatexOptions = {
  output: "htmlAndMathml",
  throwOnError: true,
};

const textContent = (node: Element) =>
  node.children
    .filter((child): child is { type: "text"; value: string } => child.type === "text")
    .map((child) => child.value)
    .join("");

const isMathCode = (node: Element) => {
  const className = node.properties.className;
  return (
    Array.isArray(className) &&
    className.includes("language-math") &&
    (className.includes("math-inline") || className.includes("math-display"))
  );
};

const renderMath = (node: Element, displayMode: boolean) => {
  try {
    return {
      type: "raw" as const,
      value: renderToString(textContent(node), {
        ...katexOptions,
        displayMode,
      }),
    };
  } catch (error) {
    return {
      type: "element" as const,
      tagName: "span",
      properties: { className: ["katex-error"] },
      children: [{ type: "text" as const, value: String(error) }],
    };
  }
};

export const satteriKatex = defineHastPlugin({
  name: "satteri-katex",
  element: [
    {
      filter: ["code"],
      visit(node) {
        if (isMathCode(node) && node.properties.className?.includes("math-inline")) {
          return renderMath(node, false);
        }
      },
    },
    {
      filter: ["pre"],
      visit(node) {
        const code = node.children.find(
          (child): child is Element => child.type === "element" && child.tagName === "code",
        );
        if (code && isMathCode(code) && code.properties.className?.includes("math-display")) {
          return renderMath(code, true);
        }
      }
    },
  ],
});
