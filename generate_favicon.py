import os
import math
from PIL import Image, ImageDraw

def create_favicon_assets():
    # Directories
    app_dir = r"d:\beemonitor\frontend\app"
    public_dir = r"d:\beemonitor\frontend\public"
    os.makedirs(app_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # 1. Generate Clean Vector SVG
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="honeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7B733" />
      <stop offset="50%" stop-color="#E5941E" />
      <stop offset="100%" stop-color="#C77812" />
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1B3826" />
      <stop offset="100%" stop-color="#112418" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Hexagonal Honeycomb Cell -->
  <polygon points="32,3.5 57,17.9 57,46.1 32,60.5 7,46.1 7,17.9"
           fill="url(#honeyGrad)" 
           stroke="#21422C" 
           stroke-width="2.75" 
           stroke-linejoin="round" />

  <!-- Inner Hexagon Accent Ring -->
  <polygon points="32,6.5 54,19.2 54,44.8 32,57.5 10,44.8 10,19.2"
           fill="none" 
           stroke="#FDE6B0" 
           stroke-width="1.2" 
           stroke-opacity="0.65" 
           stroke-linejoin="round" />

  <g filter="url(#subtleShadow)">
    <!-- Wings (Left & Right) in crisp white with soft forest tint -->
    <!-- Left Wing -->
    <path d="M 30,26 C 21,14 12,18 17,29 C 20,35 27,33 30,30 Z" 
          fill="#FFFFFF" 
          fill-opacity="0.95" 
          stroke="#21422C" 
          stroke-width="1.2" 
          stroke-linejoin="round" />
    <!-- Right Wing -->
    <path d="M 34,26 C 43,14 52,18 47,29 C 44,35 37,33 34,30 Z" 
          fill="#FFFFFF" 
          fill-opacity="0.95" 
          stroke="#21422C" 
          stroke-width="1.2" 
          stroke-linejoin="round" />

    <!-- Bee Head -->
    <circle cx="32" cy="18" r="5" fill="url(#bodyGrad)" stroke="#112418" stroke-width="0.8" />
    <!-- Antennae -->
    <path d="M 30,14 Q 28,10 26,11 M 34,14 Q 36,10 38,11" 
          fill="none" 
          stroke="#1B3826" 
          stroke-width="1.5" 
          stroke-linecap="round" />

    <!-- Bee Thorax -->
    <ellipse cx="32" cy="27" rx="6" ry="5.5" fill="url(#bodyGrad)" stroke="#112418" stroke-width="0.8" />

    <!-- Bee Abdomen with Honey-Gold Stripes -->
    <!-- Base Abdomen Shell -->
    <path d="M 27,32 C 27,44 32,51 32,51 C 32,51 37,44 37,32 Z" 
          fill="url(#bodyGrad)" 
          stroke="#112418" 
          stroke-width="0.8" 
          stroke-linejoin="round" />

    <!-- Golden Stripe 1 -->
    <path d="M 27.5,35 Q 32,37.5 36.5,35" 
          fill="none" 
          stroke="#F8C245" 
          stroke-width="2.4" 
          stroke-linecap="round" />
    <!-- Golden Stripe 2 -->
    <path d="M 28.5,40 Q 32,42.5 35.5,40" 
          fill="none" 
          stroke="#F8C245" 
          stroke-width="2.2" 
          stroke-linecap="round" />
    <!-- Golden Stripe 3 -->
    <path d="M 30,45 Q 32,47 34,45" 
          fill="none" 
          stroke="#F8C245" 
          stroke-width="1.8" 
          stroke-linecap="round" />
  </g>
</svg>'''

    # Save SVG to app and public
    with open(os.path.join(app_dir, "icon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    with open(os.path.join(public_dir, "icon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Created icon.svg in app/ and public/")

    # 2. Render High-Resolution Raster Image (512x512) with PIL
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2
    r_hex = size * 0.46

    # Hexagon points (pointy top)
    hex_points = []
    for i in range(6):
        angle_deg = 60 * i - 30
        angle_rad = math.radians(angle_deg)
        x = cx + r_hex * math.cos(angle_rad)
        y = cy + r_hex * math.sin(angle_rad)
        hex_points.append((x, y))

    # Draw Hexagon Outer Border & Honey Fill
    # Dark forest green border outline
    draw.polygon(hex_points, fill=(234, 158, 32, 255), outline=(33, 66, 44, 255), width=int(size * 0.04))

    # Inner hexagon highlight ring
    r_inner = r_hex * 0.94
    inner_points = []
    for i in range(6):
        angle_deg = 60 * i - 30
        angle_rad = math.radians(angle_deg)
        x = cx + r_inner * math.cos(angle_rad)
        y = cy + r_inner * math.sin(angle_rad)
        inner_points.append((x, y))
    draw.polygon(inner_points, outline=(254, 230, 160, 160), width=int(size * 0.015))

    # Wings (Crisp white with subtle dark green edge)
    # Left wing
    left_wing = [
        (cx - size * 0.04, cy - size * 0.1),
        (cx - size * 0.32, cy - size * 0.30),
        (cx - size * 0.36, cy - size * 0.08),
        (cx - size * 0.18, cy + size * 0.06),
        (cx - size * 0.04, cy + size * 0.04),
    ]
    draw.polygon(left_wing, fill=(255, 255, 255, 245), outline=(27, 56, 38, 255), width=int(size * 0.02))

    # Right wing
    right_wing = [
        (cx + size * 0.04, cy - size * 0.1),
        (cx + size * 0.32, cy - size * 0.30),
        (cx + size * 0.36, cy - size * 0.08),
        (cx + size * 0.18, cy + size * 0.06),
        (cx + size * 0.04, cy + size * 0.04),
    ]
    draw.polygon(right_wing, fill=(255, 255, 255, 245), outline=(27, 56, 38, 255), width=int(size * 0.02))

    # Bee Head
    head_r = size * 0.085
    head_y = cy - size * 0.22
    draw.ellipse([cx - head_r, head_y - head_r, cx + head_r, head_y + head_r], fill=(27, 56, 38, 255))

    # Antennae
    draw.arc([cx - size * 0.16, head_y - size * 0.14, cx, head_y], start=180, end=300, fill=(27, 56, 38, 255), width=int(size * 0.025))
    draw.arc([cx, head_y - size * 0.14, cx + size * 0.16, head_y], start=240, end=360, fill=(27, 56, 38, 255), width=int(size * 0.025))

    # Bee Thorax
    th_rx, th_ry = size * 0.10, size * 0.09
    th_y = cy - size * 0.08
    draw.ellipse([cx - th_rx, th_y - th_ry, cx + th_rx, th_y + th_ry], fill=(27, 56, 38, 255))

    # Bee Abdomen
    ab_points = [
        (cx - size * 0.09, cy - size * 0.01),
        (cx + size * 0.09, cy - size * 0.01),
        (cx + size * 0.07, cy + size * 0.22),
        (cx, cy + size * 0.33),  # Stinger point
        (cx - size * 0.07, cy + size * 0.22),
    ]
    draw.polygon(ab_points, fill=(27, 56, 38, 255))

    # Golden Stripes on Abdomen
    stripe_w = int(size * 0.038)
    draw.line([(cx - size * 0.075, cy + size * 0.05), (cx + size * 0.075, cy + size * 0.05)], fill=(248, 194, 69, 255), width=stripe_w)
    draw.line([(cx - size * 0.065, cy + size * 0.13), (cx + size * 0.065, cy + size * 0.13)], fill=(248, 194, 69, 255), width=stripe_w)
    draw.line([(cx - size * 0.045, cy + size * 0.21), (cx + size * 0.045, cy + size * 0.21)], fill=(248, 194, 69, 255), width=stripe_w)

    # 3. Export Multi-size Favicon Assets
    # Apple Touch Icon (180x180)
    apple_icon = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join(app_dir, "apple-icon.png"), "PNG")
    apple_icon.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")

    # PNG icons for public
    icon_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save(os.path.join(public_dir, "favicon-32x32.png"), "PNG")
    
    icon_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    icon_16.save(os.path.join(public_dir, "favicon-16x16.png"), "PNG")

    # High res 512x512
    img.save(os.path.join(public_dir, "icon-512x512.png"), "PNG")

    # Multi-resolution ICO (16, 32, 48)
    img_48 = img.resize((48, 48), Image.Resampling.LANCZOS)
    img_48.save(
        os.path.join(app_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[icon_32, icon_16]
    )
    img_48.save(
        os.path.join(public_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[icon_32, icon_16]
    )
    print("Generated favicon.ico, apple-icon.png, and PNG icons successfully.")

if __name__ == "__main__":
    create_favicon_assets()

