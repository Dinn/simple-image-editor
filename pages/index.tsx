import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent, ChangeEvent } from "react";

const MAX_CANVAS_WIDTH = 800;
const MAX_CANVAS_HEIGHT = 600;

const RIGHT_ANGLE = 90;
const STRAIGHT_ANGLE = 180;
const COMPLETE_ANGLE = 360;

const BLUR_FILTER = "blur(10px)";

const LEFT_CLICK = 1;

const HIGHEST_ENCODING_QUALITY = 1;

const INITIAL_AREA: BlurryArea = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

interface Size {
  width: number;
  height: number;
}

interface Rectangle extends Size {
  x: number;
  y: number;
}

interface BlurryArea extends Rectangle {
  blurryImage?: ImageData;
}

export default function ImageEditor() {
  const imageLayer = useRef<HTMLCanvasElement>(null);
  const blurLayer = useRef<HTMLCanvasElement>(null);
  const dragLayer = useRef<HTMLCanvasElement>(null);

  const [isRotationMode, setIsRotationMode] = useState(false);
  const [isBlurMode, setIsBlurMode] = useState(false);

  const [imageSource, setImageSource] = useState("");
  const [rotationAngle, setRotationAngle] = useState(0);

  const [blurryArea, setBlurryArea] = useState<BlurryArea>(INITIAL_AREA);
  const [blurryAreas, setBlurryAreas] = useState<BlurryArea[]>([]);

  useEffect(drawImageLayer, [imageSource, rotationAngle, blurryAreas]);
  useEffect(drawBlurLayer, [imageSource, rotationAngle]);
  useEffect(drawDragLayer, [imageSource, rotationAngle]);
  useEffect(drawDragArea, [blurryArea]);

  function drawImageLayer() {
    const canvas = imageLayer.current;
    if (canvas === null || imageSource === "") return;

    const context = canvas.getContext("2d");
    const image = createImageElement(imageSource);
    image.onload = drawEditedImage;

    function drawEditedImage() {
      const { x, y, width, height } = locateImage(image, rotationAngle);
      const canvasSize = getRotatedCanvasSize({ width, height }, rotationAngle);
      resizeCanvas(canvas, canvasSize);
      context?.rotate((Math.PI / STRAIGHT_ANGLE) * rotationAngle);
      context?.drawImage(image, x, y, width, height);

      blurryAreas
        .filter(({ blurryImage }) => blurryImage !== undefined)
        .forEach(({ blurryImage, ...area }) => {
          const left = area.width > 0 ? area.x : area.x + area.width;
          const top = area.height > 0 ? area.y : area.y + area.height;
          context?.putImageData(blurryImage as ImageData, left, top);
        });

      context?.restore();
    }
  }

  function drawBlurLayer() {
    const canvas = blurLayer.current;
    if (canvas === null || imageSource === "") return;

    const context = canvas.getContext("2d");
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

  function drawDragLayer() {
    const canvas = dragLayer.current;
    if (canvas === null || imageSource === "") return;

    const image = createImageElement(imageSource);
    image.onload = fitCanvasToImage;

    function fitCanvasToImage() {
      const { width, height } = locateImage(image, rotationAngle);
      const canvasSize = getRotatedCanvasSize({ width, height }, rotationAngle);
      resizeCanvas(canvas, canvasSize);
    }
  }

  function drawDragArea() {
    const canvas = dragLayer.current;
    const context = canvas?.getContext("2d");
    if (canvas) context?.clearRect(0, 0, canvas.width, canvas.height);
    if (context) context.fillStyle = "rgba(255, 255, 255, 0.2)";
    context?.fillRect(blurryArea.x, blurryArea.y, blurryArea.width, blurryArea.height);
  }

  function handleMouseDown({ buttons, clientX, clientY }: ReactMouseEvent<HTMLCanvasElement>) {
    if (!isBlurMode) return;
    if (buttons !== LEFT_CLICK) return;

    const canvasPosition = dragLayer.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
    setBlurryArea({
      ...INITIAL_AREA,
      x: clientX - canvasPosition.x,
      y: clientY - canvasPosition.y,
    });
  }

  function handleMouseMove({ buttons, clientX, clientY }: ReactMouseEvent<HTMLCanvasElement>) {
    if (!isBlurMode) return;
    if (buttons !== LEFT_CLICK) return;

    const canvasPosition = dragLayer.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
    setBlurryArea((area) => ({
      ...area,
      width: clientX - area.x - canvasPosition.x,
      height: clientY - area.y - canvasPosition.y,
    }));
  }

  function handleMouseUp() {
    if (!isBlurMode) return;

    const canvas = blurLayer.current;
    const context = canvas?.getContext("2d");
    if (blurryArea.width !== 0 && blurryArea.height !== 0) {
      setBlurryAreas((areas) => [
        ...areas,
        {
          ...blurryArea,
          blurryImage: context?.getImageData(blurryArea.x, blurryArea.y, blurryArea.width, blurryArea.height),
        },
      ]);
    }
    setBlurryArea(INITIAL_AREA);
  }

  function handleMouseLeave({ buttons }: ReactMouseEvent<HTMLCanvasElement>) {
    if (buttons !== LEFT_CLICK) return;
    handleMouseUp();
  }

  function handleImageInput(e: ChangeEvent<HTMLInputElement>) {
    const uploadingFile = e.target.files?.[0];
    if (uploadingFile === undefined) {
      alert("파일 업로드에 실패했습니다.");
      return;
    }
    setImageSource(URL.createObjectURL(uploadingFile));
  }

  function handleClearClick() {
    setBlurryAreas([]);
    setRotationAngle(0);
    setIsBlurMode(false);
    setIsRotationMode(false);
    setImageSource("");
  }

  function handleRotationClick() {
    if (isRotationMode) {
      setImageSource(imageLayer.current?.toDataURL("image/jpeg", HIGHEST_ENCODING_QUALITY) ?? "");
      setRotationAngle(0);
    }
    setIsRotationMode((rotationMode) => !rotationMode);
  }
  function handleRotationRightClick() {
    setRotationAngle((angle) => (angle + RIGHT_ANGLE) % COMPLETE_ANGLE);
  }
  function handleRotationLeftClick() {
    setRotationAngle((angle) => (angle + COMPLETE_ANGLE - RIGHT_ANGLE) % COMPLETE_ANGLE);
  }

  function handleBlurClick() {
    if (isBlurMode) {
      setImageSource(imageLayer.current?.toDataURL("image/jpeg", HIGHEST_ENCODING_QUALITY) ?? "");
      setBlurryAreas([]);
    }
    setIsBlurMode((blurMode) => !blurMode);
  }

  return (
    <>
      <div className="image-editor">
        {imageSource ? (
          <>
            <canvas className="blur-layer" ref={blurLayer} />
            <canvas className="image-layer" ref={imageLayer} />
            <canvas
              className="drag-layer"
              ref={dragLayer}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </>
        ) : (
          <input type="file" accept="image/*" onChange={handleImageInput} />
        )}
      </div>
      <div className="editor-controller">
        <button className="control-button" onClick={handleClearClick}>
          초기화
        </button>
        <button className="control-button" onClick={handleRotationLeftClick} disabled={!isRotationMode}>
          왼쪽
        </button>
        <button className="control-button" onClick={handleRotationClick} disabled={isBlurMode}>
          회전 {isRotationMode ? "종료" : "시작"}
        </button>
        <button className="control-button" onClick={handleRotationRightClick} disabled={!isRotationMode}>
          오른쪽
        </button>
        <button className="control-button" onClick={handleBlurClick} disabled={isRotationMode}>
          블러 {isBlurMode ? "종료" : "시작"}
        </button>
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
