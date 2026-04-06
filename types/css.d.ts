declare module "maplibre-gl/dist/maplibre-gl.css" {
  const content: { css: string };
  export default content;
}

declare module "*.css" {
  const content: { css: string };
  export default content;
}
