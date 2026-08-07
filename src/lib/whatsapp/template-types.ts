export type ParsedTemplateHeader =
  | {
      type: "NONE";
    }
  | {
      type: "TEXT";
      text: string;
    }
  | {
      type: "IMAGE" | "VIDEO" | "DOCUMENT";
      url?: string;
      required: boolean;
    };

export interface ParsedTemplateVariable {
  index: number;
  placeholder: string;
  example?: string;
}

export interface ParsedTemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
}

export interface ParsedTemplate {
  header: ParsedTemplateHeader;
  body: string;
  footer?: string;
  buttons: ParsedTemplateButton[];
  variables: ParsedTemplateVariable[];
  original: unknown;
}
