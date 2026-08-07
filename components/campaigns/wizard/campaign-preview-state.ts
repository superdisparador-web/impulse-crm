export type PreviewState = {
  device: "mobile" | "desktop";
  theme: "light" | "dark";
  zoom: number;
  fullscreen: boolean;
};
export type PreviewAction =
  | { type: "device"; value: "mobile" | "desktop" }
  | { type: "theme"; value: "light" | "dark" }
  | { type: "zoom"; value: number }
  | { type: "resetZoom" }
  | { type: "fullscreen"; value: boolean };
export const initialPreviewState: PreviewState = {
  device: "mobile",
  theme: "light",
  zoom: 100,
  fullscreen: false,
};
export function previewReducer(
  state: PreviewState,
  action: PreviewAction,
): PreviewState {
  switch (action.type) {
    case "device":
      return { ...state, device: action.value };
    case "theme":
      return { ...state, theme: action.value };
    case "zoom":
      return {
        ...state,
        zoom: Math.max(75, Math.min(125, state.zoom + action.value)),
      };
    case "resetZoom":
      return { ...state, zoom: 100 };
    case "fullscreen":
      return { ...state, fullscreen: action.value };
  }
}
