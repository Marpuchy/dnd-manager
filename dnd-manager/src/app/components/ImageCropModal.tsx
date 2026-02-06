"use client";

import React, { useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sourceX = Math.max(0, pixelCrop.x);
  const sourceY = Math.max(0, pixelCrop.y);
  const offsetX = Math.max(0, -pixelCrop.x);
  const offsetY = Math.max(0, -pixelCrop.y);
  const availableWidth = pixelCrop.width - offsetX;
  const availableHeight = pixelCrop.height - offsetY;
  const sourceWidth = Math.min(image.width - sourceX, availableWidth);
  const sourceHeight = Math.min(image.height - sourceY, availableHeight);

  if (sourceWidth > 0 && sourceHeight > 0) {
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      offsetX,
      offsetY,
      sourceWidth,
      sourceHeight
    );
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

type ImageCropModalProps = {
  src: string;
  aspect?: number;
  onClose: () => void;
  onSave: (blob: Blob) => void;
};

export function ImageCropModal({ src, aspect = 3 / 4, onClose, onSave }: ImageCropModalProps) {
  const MAX_ZOOM = 5;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MAX_ZOOM / 2);
  const [minZoom, setMinZoom] = useState(0.1);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null);
  const [hasUserZoomed, setHasUserZoomed] = useState(false);

  useEffect(() => {
    setHasUserZoomed(false);
    setZoom(MAX_ZOOM / 2);
  }, [src, MAX_ZOOM]);
  const aspectRatio = aspect;

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCropArea(croppedAreaPixels);
  }, []);

  const onMediaLoaded = useCallback((size: { width: number; height: number }) => {
    if (!size?.width || !size?.height) return;
    setMediaSize({ width: size.width, height: size.height });
  }, []);

  useEffect(() => {
    if (!mediaSize || !cropSize) return;
    const nextMinZoom = Math.min(
      cropSize.width / mediaSize.width,
      cropSize.height / mediaSize.height
    );
    const safeMinZoom = Math.max(0.05, nextMinZoom);
    setMinZoom(safeMinZoom);
  }, [mediaSize, cropSize]);

  useEffect(() => {
    if (hasUserZoomed) return;
    const defaultZoom = (minZoom + MAX_ZOOM) / 2;
    setZoom(defaultZoom);
  }, [minZoom, hasUserZoomed, MAX_ZOOM]);

  async function handleSave() {
    if (!cropArea) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(src, cropArea);
      if (blob) {
        onSave(blob);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-ring bg-panel/95 p-3 sm:p-4 space-y-4 max-h-[90vh]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">Ajustar imagen</h3>
            <p className="text-[11px] text-ink-muted">Recorta y encuadra la imagen antes de guardar.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] px-2 py-1 rounded-md border border-ring bg-white/70 text-ink hover:bg-white"
          >
            Cancelar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[11px] text-ink-muted uppercase tracking-[0.25em]">
              Editor
            </p>
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-ring bg-white/80 max-h-[45vh]">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={(value) => setZoom(value)}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
                onCropSizeChange={(size) => setCropSize(size)}
                minZoom={minZoom}
                maxZoom={MAX_ZOOM}
                restrictPosition={false}
                objectFit="contain"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-ink-muted uppercase tracking-[0.25em]">
              Vista final
            </p>
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-ring bg-white/80 max-h-[45vh]">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={() => {}}
                onZoomChange={() => {}}
                onCropComplete={() => {}}
                objectFit="contain"
                className="pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] text-ink-muted">Tamaño (zoom)</label>
          <input
            type="range"
            min={minZoom}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => {
              setHasUserZoomed(true);
              setZoom(Number(e.target.value));
            }}
            className="w-full accent-emerald-600"
          />
        </div>


        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
