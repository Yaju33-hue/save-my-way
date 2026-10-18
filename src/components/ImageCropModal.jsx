import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaCheck, FaTimes, FaUndo, FaCircle, FaSquare } from "react-icons/fa";

export default function ImageCropModal({
  imageSrc,
  onClose,
  onSave,
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [displayedDimensions, setDisplayedDimensions] = useState({ width: 0, height: 0, left: 0, top: 0 });

  // Crop frame state: coordinates relative to the displayed image
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, size: 160 });
  const [shape, setShape] = useState("circle"); // "circle" | "square"

  // Dragging state
  const [dragMode, setDragMode] = useState(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw'
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, boxX: 0, boxY: 0, boxSize: 0 });

  // Measure and fit image when loaded or on window resize
  const measureImage = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const natW = imageRef.current.naturalWidth || 1;
    const natH = imageRef.current.naturalHeight || 1;

    setNaturalDimensions({ width: natW, height: natH });

    // Fit image inside container with margins
    const maxW = Math.min(container.width - 24, 380);
    const maxH = Math.min(window.innerHeight * 0.42, 340);

    const aspect = natW / natH;
    let dispW = maxW;
    let dispH = maxW / aspect;

    if (dispH > maxH) {
      dispH = maxH;
      dispW = maxH * aspect;
    }

    const dispLeft = (container.width - dispW) / 2;
    const dispTop = (container.height - dispH) / 2;

    setDisplayedDimensions({ width: dispW, height: dispH, left: dispLeft, top: dispTop });

    // Initialize crop box to centered square of ~70% minimum dimension
    const initialSize = Math.max(60, Math.round(Math.min(dispW, dispH) * 0.72));
    const initialX = Math.round((dispW - initialSize) / 2);
    const initialY = Math.round((dispH - initialSize) / 2);

    setCropBox({
      x: initialX,
      y: initialY,
      size: initialSize,
    });
    setImgLoaded(true);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", measureImage);
    return () => window.removeEventListener("resize", measureImage);
  }, [measureImage]);

  const handleImageLoad = () => {
    measureImage();
  };

  // Drag handlers
  const handleStartDrag = (mode, clientX, clientY) => {
    setDragMode(mode);
    setDragStart({
      mouseX: clientX,
      mouseY: clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxSize: cropBox.size,
    });
  };

  const handlePointerDown = (e, mode = "move") => {
    e.stopPropagation();
    e.preventDefault();
    handleStartDrag(mode, e.clientX, e.clientY);
  };

  const handleTouchStart = (e, mode = "move") => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      handleStartDrag(mode, e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handlePointerMove = useCallback((clientX, clientY) => {
    if (!dragMode) return;

    const deltaX = clientX - dragStart.mouseX;
    const deltaY = clientY - dragStart.mouseY;
    const maxBoundW = displayedDimensions.width;
    const maxBoundH = displayedDimensions.height;

    if (dragMode === "move") {
      let newX = dragStart.boxX + deltaX;
      let newY = dragStart.boxY + deltaY;

      // Keep within bounds
      newX = Math.max(0, Math.min(newX, maxBoundW - cropBox.size));
      newY = Math.max(0, Math.min(newY, maxBoundH - cropBox.size));

      setCropBox((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
    } else {
      // Corner resize handles
      let newSize = dragStart.boxSize;
      let newX = dragStart.boxX;
      let newY = dragStart.boxY;

      if (dragMode === "se") {
        const delta = Math.max(deltaX, deltaY);
        newSize = Math.max(50, dragStart.boxSize + delta);
        newSize = Math.min(newSize, maxBoundW - newX, maxBoundH - newY);
      } else if (dragMode === "sw") {
        const delta = Math.max(-deltaX, deltaY);
        newSize = Math.max(50, dragStart.boxSize + delta);
        newSize = Math.min(newSize, dragStart.boxX + dragStart.boxSize, maxBoundH - newY);
        newX = dragStart.boxX + (dragStart.boxSize - newSize);
      } else if (dragMode === "ne") {
        const delta = Math.max(deltaX, -deltaY);
        newSize = Math.max(50, dragStart.boxSize + delta);
        newSize = Math.min(newSize, maxBoundW - newX, dragStart.boxY + dragStart.boxSize);
        newY = dragStart.boxY + (dragStart.boxSize - newSize);
      } else if (dragMode === "nw") {
        const delta = Math.max(-deltaX, -deltaY);
        newSize = Math.max(50, dragStart.boxSize + delta);
        newSize = Math.min(newSize, dragStart.boxX + dragStart.boxSize, dragStart.boxY + dragStart.boxSize);
        newX = dragStart.boxX + (dragStart.boxSize - newSize);
        newY = dragStart.boxY + (dragStart.boxSize - newSize);
      }

      setCropBox({
        x: Math.round(Math.max(0, newX)),
        y: Math.round(Math.max(0, newY)),
        size: Math.round(newSize),
      });
    }
  }, [dragMode, dragStart, displayedDimensions, cropBox.size]);

  useEffect(() => {
    const onMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onEnd = () => setDragMode(null);

    if (dragMode) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onEnd);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragMode, handlePointerMove]);

  // Size slider changer
  const handleSizeSlider = (newSize) => {
    const maxSize = Math.min(displayedDimensions.width, displayedDimensions.height);
    const size = Math.max(50, Math.min(newSize, maxSize));
    // Keep centered as it resizes
    let newX = cropBox.x + (cropBox.size - size) / 2;
    let newY = cropBox.y + (cropBox.size - size) / 2;
    newX = Math.max(0, Math.min(newX, displayedDimensions.width - size));
    newY = Math.max(0, Math.min(newY, displayedDimensions.height - size));
    setCropBox({ x: Math.round(newX), y: Math.round(newY), size: Math.round(size) });
  };

  const handleReset = () => {
    measureImage();
  };

  // Perform final crop onto 256x256 canvas
  const handleConfirmCrop = () => {
    if (!imageRef.current || displayedDimensions.width === 0) return;

    const scale = naturalDimensions.width / displayedDimensions.width;
    const sourceX = cropBox.x * scale;
    const sourceY = cropBox.y * scale;
    const sourceSize = cropBox.size * scale;

    const canvas = document.createElement("canvas");
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(
      imageRef.current,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onSave(croppedDataUrl);
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-card">
        {/* Header */}
        <div className="crop-modal-header">
          <div className="crop-modal-title-wrap">
            <h3 className="crop-modal-title">Crop Profile Picture</h3>
            <span className="crop-modal-sub">Drag box to reposition • Drag corners to resize</span>
          </div>
          <button type="button" className="crop-modal-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {/* Visual Crop Stage */}
        <div className="crop-stage" ref={containerRef}>
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source for cropping"
            className="crop-image-element"
            onLoad={handleImageLoad}
            style={{
              width: `${displayedDimensions.width}px`,
              height: `${displayedDimensions.height}px`,
              left: `${displayedDimensions.left}px`,
              top: `${displayedDimensions.top}px`,
            }}
          />

          {imgLoaded && displayedDimensions.width > 0 && (
            <div
              className={`crop-box ${shape === "circle" ? "shape-circle" : "shape-square"} ${dragMode ? "dragging" : ""}`}
              style={{
                width: `${cropBox.size}px`,
                height: `${cropBox.size}px`,
                left: `${displayedDimensions.left + cropBox.x}px`,
                top: `${displayedDimensions.top + cropBox.y}px`,
              }}
              onMouseDown={(e) => handlePointerDown(e, "move")}
              onTouchStart={(e) => handleTouchStart(e, "move")}
            >
              {/* Corner Handles */}
              <div
                className="crop-handle crop-handle-nw"
                onMouseDown={(e) => handlePointerDown(e, "nw")}
                onTouchStart={(e) => handleTouchStart(e, "nw")}
              />
              <div
                className="crop-handle crop-handle-ne"
                onMouseDown={(e) => handlePointerDown(e, "ne")}
                onTouchStart={(e) => handleTouchStart(e, "ne")}
              />
              <div
                className="crop-handle crop-handle-se"
                onMouseDown={(e) => handlePointerDown(e, "se")}
                onTouchStart={(e) => handleTouchStart(e, "se")}
              />
              <div
                className="crop-handle crop-handle-sw"
                onMouseDown={(e) => handlePointerDown(e, "sw")}
                onTouchStart={(e) => handleTouchStart(e, "sw")}
              />

              {/* Center Crosshair Grid */}
              <div className="crop-grid-line horizontal" />
              <div className="crop-grid-line vertical" />
            </div>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="crop-toolbar">
          <div className="crop-toolbar-row">
            <div className="crop-shape-toggle">
              <button
                type="button"
                className={`crop-shape-btn ${shape === "circle" ? "active" : ""}`}
                onClick={() => setShape("circle")}
                title="Circle frame"
              >
                <FaCircle />
                <span>Circle</span>
              </button>
              <button
                type="button"
                className={`crop-shape-btn ${shape === "square" ? "active" : ""}`}
                onClick={() => setShape("square")}
                title="Square frame"
              >
                <FaSquare />
                <span>Square</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm crop-reset-btn"
              onClick={handleReset}
              title="Reset frame"
            >
              <FaUndo />
              <span>Reset</span>
            </button>
          </div>

          <div className="crop-size-slider-row">
            <span className="crop-slider-label">Crop Size</span>
            <input
              type="range"
              min={50}
              max={Math.min(displayedDimensions.width || 200, displayedDimensions.height || 200)}
              value={cropBox.size}
              onChange={(e) => handleSizeSlider(Number(e.target.value))}
              className="crop-range-slider"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="crop-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirmCrop}>
            <FaCheck />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
