"""Convert resources/icon.ico to public/icon.png and resources/icon.png (256px)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICO = ROOT / 'public' / 'icon.ico'
OUT = [ROOT / 'public' / 'icon.png', ROOT / 'resources' / 'icon.png']


def main() -> None:
    img = Image.open(ICO)
    if hasattr(img, 'size'):
        img = img.convert('RGBA')
    for path in OUT:
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path, format='PNG')
        print(f'Wrote {path} ({img.size[0]}x{img.size[1]})')


if __name__ == '__main__':
    main()
