
import { defineHastPlugin } from "satteri";

export const hastExternalLinks = defineHastPlugin({
  name: "external-links",
  element: {
    filter: ["a"],
    visit(node, context) {
      const href = node.properties.href;

      if (
        typeof href === "string" &&
        (href.startsWith("https://") ||
          href.startsWith("http://"))
      ) {
        context.setProperty(node, "target", "_blank");
        context.setProperty(
          node,
          "rel",
          "noopener noreferrer",
        );
      }
    },
  },
});
