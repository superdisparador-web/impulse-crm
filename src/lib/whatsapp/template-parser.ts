import {
  ParsedTemplate,
  ParsedTemplateButton,
  ParsedTemplateHeader,
  ParsedTemplateVariable,
} from "./template-types";

type MetaComponent = {
  type: string;
  format?: string;
  text?: string;
  example?: {
    header_handle?: string[];
    body_text?: string[][];
  };
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
  }>;
};

function extractVariables(text: string): ParsedTemplateVariable[] {
  const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)];

  return matches.map((match) => ({
    index: Number(match[1]),
    placeholder: match[0],
  }));
}

export function parseTemplate(
  components: MetaComponent[] | null | undefined,
): ParsedTemplate {
  const parsed: ParsedTemplate = {
    header: {
      type: "NONE",
    },
    body: "",
    footer: "",
    buttons: [],
    variables: [],
    original: components,
  };

  if (!components?.length) {
    return parsed;
  }

  for (const component of components) {
    switch (component.type) {
      case "HEADER": {
        if (component.format === "TEXT") {
          parsed.header = {
            type: "TEXT",
            text: component.text ?? "",
          };
        } else if (
          component.format === "IMAGE" ||
          component.format === "VIDEO" ||
          component.format === "DOCUMENT"
        ) {
          parsed.header = {
            type: component.format,
            required: true,
            url: component.example?.header_handle?.[0],
          };
        }
        break;
      }

      case "BODY": {
        parsed.body = component.text ?? "";
        parsed.variables = extractVariables(parsed.body);

        if (component.example?.body_text?.length) {
          parsed.variables = parsed.variables.map((variable, index) => ({
            ...variable,
            example: component.example?.body_text?.[0]?.[index],
          }));
        }

        break;
      }

      case "FOOTER": {
        parsed.footer = component.text ?? "";
        break;
      }

      case "BUTTONS": {
        parsed.buttons =
          component.buttons?.map<ParsedTemplateButton>((button) => ({
            type: button.type as ParsedTemplateButton["type"],
            text: button.text,
            url: button.url,
          })) ?? [];

        break;
      }
    }
  }

  return parsed;
}
