import type { DetailedHTMLProps, HTMLAttributes } from "react";

// <model-viewer> is a web component without React typings; allow it in JSX with its kebab-case attributes.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}
