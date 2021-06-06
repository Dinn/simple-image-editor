import { useState, useEffect, useRef } from "react";

const MAX_CANVAS_WIDTH = 600;
const MAX_CANVAS_HEIGHT = 800;

interface size {
  width: number;
  height: number;
}

export default function ImageEditor() {
  const imageLayer = useRef<HTMLCanvasElement>(null);
  const [imageSource, setImageSource] = useState(
    "/rana-sawalha-X7UR0BDz-UY-unsplash.jpeg"
  );

  useEffect(() => {
    const canvas = imageLayer.current;
    const context = canvas?.getContext("2d");
    const image = createImageElement(imageSource);
    resizeCanvas(canvas, {
      width: MAX_CANVAS_WIDTH,
      height: MAX_CANVAS_HEIGHT,
    });

    image.onload = () => {
      context?.drawImage(image, 0, 0, MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT);
    };
  });

  return (
    <>
      <canvas ref={imageLayer} />
    </>
  );
}

function createImageElement(source: string) {
  const image = new Image();
  image.src = source;
  return image;
}

function resizeCanvas(
  canvas: HTMLCanvasElement | null,
  { width, height }: size
) {
  if (canvas === null) return;
  [canvas.width, canvas.height] = [width, height];
}
