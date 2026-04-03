# Model Weights

This folder is reserved for local vision-model checkpoints used by the image pipeline.

Do not commit large weight files to git.

## Required downloads

### SAM 2

- File: `sam2_hiera_large.pt`
- Source: `facebook/sam2-hiera-large` on Hugging Face
- Suggested path: `backend/data/weights/sam2_hiera_large.pt`

### YOLOv11

- Base file: `yolo11n.pt` (Ultralytics)
- Fine-tuned output: `yolo11_food.pt`
- Suggested path: `backend/data/weights/yolo11_food.pt`

### Depth Anything V2

- File: `depth_anything_v2_vitl.pth`
- Source: `depth-anything/Depth-Anything-V2-Large` on Hugging Face
- Suggested path: `backend/data/weights/depth_anything_v2_vitl.pth`

## Expected layout

```text
weights/
  .gitkeep
  README.md
  sam2_hiera_large.pt
  yolo11_food.pt
  depth_anything_v2_vitl.pth
```

## Notes

- Keep filenames stable to match default paths in wrapper stubs.
- `/health` can later expose which model files were detected and loaded.
