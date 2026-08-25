import importlib

required = ["fitz", "cv2", "pytesseract", "openpyxl", "numpy"]
for name in required:
    importlib.import_module(name)
    print(f"{name}: OK")
