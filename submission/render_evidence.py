from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
FONT = ImageFont.load_default(size=18)
TITLE = ImageFont.load_default(size=26)


def clean_line(line: str) -> str:
    line = line.replace("Γ£ô", "PASS").replace("ΓÇö", "-")
    line = line.replace("\x1b", "")
    return line.encode("ascii", "ignore").decode("ascii")


def render(source: str, target: str, title: str) -> None:
    lines = (ROOT / source).read_text(encoding="utf-8", errors="ignore").splitlines()
    lines = [clean_line(line) for line in lines][-45:]
    width, height = 1600, max(900, 90 + len(lines) * 26)
    image = Image.new("RGB", (width, height), (16, 18, 23))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((30, 25, width - 30, height - 25), radius=18, fill=(28, 31, 38))
    draw.text((60, 48), title, font=TITLE, fill=(238, 240, 244))
    y = 100
    for line in lines:
        draw.text((60, y), line[:145], font=FONT, fill=(210, 214, 222))
        y += 26
    image.save(ROOT / target)


render("verification-output.txt", "verification.png", "T3N Private Incident Triage Agent - Verification")
render("demo-output.txt", "demo.png", "T3N Private Incident Triage Agent - Demo")
