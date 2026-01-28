"use client";

import React, { useCallback, useState } from "react";
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

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

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

export function ImageCropModal({ src, aspect = 3 / 5, onClose, onSave }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCropArea(croppedAreaPixels);
  }, []);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-ring bg-panel/95 p-4 space-y-4">
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

        <div className="relative w-full aspect-[3/5] rounded-xl overflow-hidden border border-ring bg-white/80">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="horizontal-cover"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] text-ink-muted">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
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
