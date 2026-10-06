import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createSquareProfileImage, validateProfileImageFile } from "../utils/profileImage.js";
import { FaMinus, FaPlus, FaUndoAlt, FaTimes } from "react-icons/fa";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function ProfileImageCropDialog({ file, onCancel, onSave }) {
  const [image, setImage] = useState(null);
  const [frameSize, setFrameSize] = useState(320);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const frameRef = useRef(null);
  const dialogRef = useRef(null);
  const dragRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onCancelRef.current = onCancel;
    onSaveRef.current = onSave;
  }, [onCancel, onSave]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    let sourceImage = null;

    const loadImage = async () => {
      try {
        validateProfileImageFile(file);
        objectUrl = URL.createObjectURL(file);
        sourceImage = new Image();
        sourceImage.onload = () => {
          if (!active) return;
          if (
            !sourceImage.naturalWidth ||
            !sourceImage.naturalHeight ||
            sourceImage.naturalWidth * sourceImage.naturalHeight > 40_000_000
          ) {
            setError("This image has unsupported dimensions. Choose a smaller image.");
            return;
          }
          setImage(sourceImage);
          setZoom(1);
          setPan({ x: 0.5, y: 0.5 });
        };
        sourceImage.onerror = () => {
          if (active) setError("This image could not be opened. Choose another image file.");
        };
        sourceImage.src = objectUrl;
      } catch (loadError) {
        if (active) setError(loadError.message || "This image could not be opened.");
      }
    };

    setError("");
    setImage(null);
    loadImage();

    return () => {
      active = false;
      if (sourceImage) {
        sourceImage.onload = null;
        sourceImage.onerror = null;
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const measure = () => {
      const width = frame.getBoundingClientRect().width;
      if (width > 0) setFrameSize(width);
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector(".profile-crop-close")?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  const baseScale = image
    ? Math.max(frameSize / image.naturalWidth, frameSize / image.naturalHeight)
    : 1;
  const scale = baseScale * zoom;
  const renderedWidth = image ? image.naturalWidth * scale : frameSize;
  const renderedHeight = image ? image.naturalHeight * scale : frameSize;
  const imageOffsetX = (frameSize - renderedWidth) * pan.x;
  const imageOffsetY = (frameSize - renderedHeight) * pan.y;

  const changeZoom = (nextZoom) => {
    const limitedZoom = clamp(nextZoom, 1, 3);
    if (image && limitedZoom !== zoom) {
      const oldScale = baseScale * zoom;
      const nextScale = baseScale * limitedZoom;
      const oldCropSize = frameSize / oldScale;
      const nextCropSize = frameSize / nextScale;
      const centerX = (-imageOffsetX / oldScale) + oldCropSize / 2;
      const centerY = (-imageOffsetY / oldScale) + oldCropSize / 2;
      const maxX = image.naturalWidth - nextCropSize;
      const maxY = image.naturalHeight - nextCropSize;
      setPan({
        x: maxX > 0 ? clamp((centerX - nextCropSize / 2) / maxX, 0, 1) : 0.5,
        y: maxY > 0 ? clamp((centerY - nextCropSize / 2) / maxY, 0, 1) : 0.5,
      });
    }
    setZoom(limitedZoom);
  };

  const handlePointerDown = (event) => {
    if (!image || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
      overflowX: Math.max(0, renderedWidth - frameSize),
      overflowY: Math.max(0, renderedHeight - frameSize),
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    setPan({
      x: drag.overflowX
        ? clamp(drag.panX - (event.clientX - drag.startX) / drag.overflowX, 0, 1)
        : 0.5,
      y: drag.overflowY
        ? clamp(drag.panY - (event.clientY - drag.startY) / drag.overflowY, 0, 1)
        : 0.5,
    });
  };

  const handleKeyDown = (event) => {
    const keyMoves = {
      ArrowLeft: [-0.03, 0],
      ArrowRight: [0.03, 0],
      ArrowUp: [0, -0.03],
      ArrowDown: [0, 0.03],
    };
    const move = keyMoves[event.key];
    if (move) {
      event.preventDefault();
      const multiplier = event.shiftKey ? 3 : 1;
      setPan((current) => ({
        x: clamp(current.x + move[0] * multiplier, 0, 1),
        y: clamp(current.y + move[1] * multiplier, 0, 1),
      }));
    }
  };

  const resetCrop = () => {
    setZoom(1);
    setPan({ x: 0.5, y: 0.5 });
    setError("");
  };

  const saveCrop = async () => {
    if (!image || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const cropSize = frameSize / scale;
      const croppedImage = createSquareProfileImage(image, {
        x: pan.x * (image.naturalWidth - cropSize),
        y: pan.y * (image.naturalHeight - cropSize),
        size: cropSize,
      });
      const saved = await onSaveRef.current(croppedImage);
      if (saved) return;
      setError("The photo could not be saved. Free some browser storage and try again.");
    } catch (saveError) {
      setError(saveError.message || "The crop could not be saved. Please try again.");
    }
    setIsSaving(false);
  };

  return (
    <div className="profile-crop-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancelRef.current();
    }}>
      <section
        className="profile-crop-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-crop-title"
        aria-describedby="profile-crop-help"
      >
        <header className="profile-crop-header">
          <h2 id="profile-crop-title">Crop profile photo</h2>
          <button
            type="button"
            className="profile-crop-close"
            onClick={onCancel}
            aria-label="Cancel photo crop"
          >
            <FaTimes />
          </button>
        </header>

        <p id="profile-crop-help" className="profile-crop-help">
          Drag the photo to reposition it. Use the zoom control to adjust the crop.
        </p>

        <div
          className="profile-crop-frame"
          ref={frameRef}
          tabIndex={0}
          aria-label="Photo crop area. Use arrow keys to reposition the photo."
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          onWheel={(event) => {
            event.preventDefault();
            changeZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
          }}
        >
          {image ? (
            <img
              className="profile-crop-image"
              src={image.src}
              alt=""
              draggable="false"
              style={{
                width: `${renderedWidth}px`,
                height: `${renderedHeight}px`,
                transform: `translate(${imageOffsetX}px, ${imageOffsetY}px)`,
              }}
            />
          ) : (
            <span className="profile-crop-loading" role="status">Loading image…</span>
          )}
        </div>

        <div className="profile-crop-zoom">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => changeZoom(zoom - 0.1)}
            disabled={!image || zoom <= 1}
            aria-label="Zoom out"
          >
            <FaMinus />
          </button>
          <label className="sr-only" htmlFor="profile-crop-zoom">Zoom photo</label>
          <input
            id="profile-crop-zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            disabled={!image}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => changeZoom(zoom + 0.1)}
            disabled={!image || zoom >= 3}
            aria-label="Zoom in"
          >
            <FaPlus />
          </button>
        </div>

        <button
          type="button"
          className="profile-crop-reset"
          onClick={resetCrop}
          disabled={!image}
        >
          <FaUndoAlt />
          Reset crop
        </button>

        {error && <p className="profile-crop-error" role="alert">{error}</p>}

        <footer className="profile-crop-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveCrop}
            disabled={!image || isSaving}
          >
            {isSaving ? "Saving…" : "Use photo"}
          </button>
        </footer>
      </section>
    </div>
  );
}