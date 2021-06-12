import { useState, useEffect, useRef } from "react";

const MAX_CANVAS_WIDTH = 800;
const MAX_CANVAS_HEIGHT = 600;

const RIGHT_ANGLE = 90;
const STRAIGHT_ANGLE = 180;
const COMPLETE_ANGLE = 360;

const BLUR_FILTER = "blur(10px)";

interface Size {
  width: number;
  height: number;
}

interface Rectangle extends Size {
  x: number;
  y: number;
}

export default function ImageEditor() {
  const imageLayer = useRef<HTMLCanvasElement>(null);
  const blurLayer = useRef<HTMLCanvasElement>(null);
  const [imageSource, setImageSource] = useState("/rana-sawalha-X7UR0BDz-UY-unsplash.jpeg");
  const [rotationAngle, setRotationAngle] = useState(0);

  useEffect(drawImageLayer);
  useEffect(drawBlurLayer);

  function drawImageLayer() {
    const canvas = imageLayer.current;
    const context = canvas?.getContext("2d");
    const image = createImageElement(imageSource);
    image.onload = drawEditedImage;

    function drawEditedImage() {
      const { x, y, width, height } = locateImage(image, rotationAngle);
      const canvasSize = getRotatedCanvasSize({ width, height }, rotationAngle);
      resizeCanvas(canvas, canvasSize);
      context?.rotate((Math.PI / STRAIGHT_ANGLE) * rotationAngle);
      context?.drawImage(image, x, y, width, height);
      context?.restore();
    }
  }

  function drawBlurLayer() {
    const canvas = blurLayer.current;
    const context = canvas?.getContext("2d");
    const image = createImageElement(imageSource);
    image.onload = drawBlurImage;

    function drawBlurImage() {
      const { x, y, width, height } = locateImage(image, rotationAngle);
      const canvasSize = getRotatedCanvasSize({ width, height }, rotationAngle);
      resizeCanvas(canvas, canvasSize);
      context?.rotate((Math.PI / STRAIGHT_ANGLE) * rotationAngle);
      if (context) context.filter = BLUR_FILTER;
      context?.drawImage(image, x, y, width, height);
      context?.restore();
    }
  }

  function handleRotationClick() {
    setRotationAngle((angle) => (angle + RIGHT_ANGLE) % COMPLETE_ANGLE);
  }

  return (
    <>
      <div className="image-editor">
        <canvas ref={imageLayer} />
        <canvas ref={blurLayer} />
      </div>
      <div>
        <button onClick={handleRotationClick}>회전</button>
      </div>
    </>
  );
}

function createImageElement(source: string) {
  const image = new Image();
  image.src = source;
  return image;
}

function resizeCanvas(canvas: HTMLCanvasElement | null, { width, height }: Size) {
  if (canvas === null) return;
  [canvas.width, canvas.height] = [width, height];
}

function getRotatedCanvasSize({ width, height }: Size, rotationAngle: number): Size {
  return {
    width: rotationAngle % STRAIGHT_ANGLE ? height : width,
    height: rotationAngle % STRAIGHT_ANGLE ? width : height,
  };
}

function locateImage(image: HTMLImageElement, rotationAngle: number): Rectangle {
  const canvasSize = getRotatedCanvasSize({ width: MAX_CANVAS_WIDTH, height: MAX_CANVAS_HEIGHT }, rotationAngle);

  const width = image.width > image.height ? canvasSize.width : (image.width * canvasSize.height) / image.height;
  const height = image.width > image.height ? (image.height * canvasSize.width) / image.width : canvasSize.height;
  const x = -Math.floor(rotationAngle / STRAIGHT_ANGLE) * width;
  const y = -Math.floor(((rotationAngle + RIGHT_ANGLE) % COMPLETE_ANGLE) / STRAIGHT_ANGLE) * height;

  return { x, y, width, height };
}
