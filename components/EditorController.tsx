import { MouseEventHandler } from "react";

interface Props {
  disabled?: boolean;
  isRotationMode?: boolean;
  isBlurMode?: boolean;
  onClear: MouseEventHandler;
  onSave: MouseEventHandler;
  onRotate: MouseEventHandler;
  onRotateLeft: MouseEventHandler;
  onRotateRight: MouseEventHandler;
  onBlur: MouseEventHandler;
}

export default function EditorController({
  disabled = false,
  isBlurMode = false,
  isRotationMode = false,
  onClear,
  onSave,
  onRotate,
  onRotateLeft,
  onRotateRight,
  onBlur,
}: Props) {
  return (
    <div className="editor-controller">
      <button className="control-button" onClick={onClear} disabled={disabled}>
        초기화
      </button>
      <button className="control-button" onClick={onRotateLeft} disabled={disabled || !isRotationMode}>
        왼쪽
      </button>
      <button className="control-button" onClick={onRotate} disabled={disabled || isBlurMode}>
        회전 {isRotationMode ? "종료" : "시작"}
      </button>
      <button className="control-button" onClick={onRotateRight} disabled={disabled || !isRotationMode}>
        오른쪽
      </button>
      <button className="control-button" onClick={onBlur} disabled={disabled || isRotationMode}>
        블러 {isBlurMode ? "종료" : "시작"}
      </button>
      <button className="control-button" onClick={onSave} disabled={disabled}>
        저장
      </button>
    </div>
  );
}
