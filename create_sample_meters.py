import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('sample_images', exist_ok=True)
os.makedirs('server/uploads', exist_ok=True)

def create_meter_image(filename, meter_no, reading_val):
    # Create image simulating a real water meter faceplate
    width, height = 600, 600
    img = Image.new('RGB', (width, height), color=(240, 242, 245))
    draw = ImageDraw.Draw(img)
    
    # Outer ring
    draw.ellipse([40, 40, 560, 560], fill=(220, 225, 230), outline=(50, 60, 70), width=12)
    # Inner faceplate
    draw.ellipse([70, 70, 530, 530], fill=(255, 255, 255), outline=(100, 110, 120), width=4)
    
    # Brand / Title
    try:
        font_large = ImageFont.truetype("DejaVuSans-Bold.ttf", 28)
        font_med = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
        font_reading = ImageFont.truetype("DejaVuSansMono-Bold.ttf", 40)
        font_small = ImageFont.truetype("DejaVuSans.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_med = font_large
        font_reading = font_large
        font_small = font_large
        
    draw.text((300, 130), "AQUA METERS", fill=(30, 80, 160), font=font_large, anchor="mm")
    draw.text((300, 170), "Q3 = 2.5 m³/h | Class B", fill=(100, 100, 100), font=font_small, anchor="mm")
    
    # Serial Number / Meter ID printed on faceplate
    draw.rectangle([180, 200, 420, 235], fill=(235, 240, 245), outline=(180, 190, 200), width=2)
    draw.text((300, 217), f"SN: {meter_no}", fill=(20, 20, 20), font=font_med, anchor="mm")
    
    # Reading Display Box (Mechanical Counter Frame)
    draw.rectangle([130, 270, 470, 360], fill=(20, 25, 30), outline=(100, 100, 100), width=4)
    
    # Black digits box for m³
    draw.rectangle([140, 280, 400, 350], fill=(10, 15, 20))
    # Red digits box for decimals
    draw.rectangle([400, 280, 460, 350], fill=(180, 30, 30))
    
    # Format reading: e.g. "00452" (m³) and ".8" (dec)
    str_reading = f"{reading_val:07.1f}" # e.g. "00452.8"
    draw.text((300, 315), str_reading, fill=(255, 255, 255), font=font_reading, anchor="mm")
    
    draw.text((300, 385), "CUBIC METERS (m³)", fill=(60, 60, 60), font=font_small, anchor="mm")
    
    # Dial indicator circle below
    draw.ellipse([250, 420, 350, 520], outline=(150, 150, 150), width=3)
    draw.line([300, 470, 330, 440], fill=(200, 40, 40), width=4)
    draw.ellipse([293, 463, 307, 477], fill=(200, 40, 40))
    
    path1 = os.path.join('sample_images', filename)
    path2 = os.path.join('server/uploads', filename)
    img.save(path1)
    img.save(path2)
    print(f"Created {path1} with reading {reading_val}")

create_meter_image("sample_meter1.jpg", "WM-40291", 452.8)
create_meter_image("sample_meter2.jpg", "WM-40292", 128.5)
create_meter_image("sample_meter3.jpg", "WM-71004", 1284.2)
