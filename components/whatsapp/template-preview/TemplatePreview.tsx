import React from "react";

export interface TemplatePreviewVariable {
  index: number;
  placeholder: string;
  example?: string;
}

export interface TemplatePreviewButton {
  type: string;
  text: string;
}

export interface TemplatePreviewProps {
  image?: string;
  body: string;
  footer?: string;
  buttons?: TemplatePreviewButton[];
  variables?: TemplatePreviewVariable[];
}

export default function TemplatePreview({
  image,
  body,
  footer,
  buttons = [],
}: TemplatePreviewProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {image && (
        <img
          src={image}
          alt="Template"
          className="w-full object-cover max-h-72"
        />
      )}

      <div className="space-y-4 p-5">

        <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">
          {body}
        </div>

        {footer && (
          <div className="text-xs text-slate-400">
            {footer}
          </div>
        )}

      </div>

      {buttons.length > 0 && (
        <div className="border-t">

          {buttons.map((button, index) => (
            <button
              key={index}
              type="button"
              className="flex w-full items-center justify-center border-b last:border-b-0 py-3 text-sm font-medium text-[#00A884] hover:bg-slate-50"
            >
              {button.text}
            </button>
          ))}

        </div>
      )}

    </div>
  );
}