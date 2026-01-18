import os
from PIL import Image, ImageDraw, ImageFont

# 确保输出目录存在
output_dir = r"e:\sync\courses\CS3604\12306\report\figs"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def get_font(size=20):
    # 尝试加载中文字体
    fonts = [
        "msyh.ttc", # 微软雅黑
        "simhei.ttf", # 黑体
        "arial.ttf" # 备用英文
    ]
    for font_name in fonts:
        try:
            return ImageFont.truetype(font_name, size)
        except:
            continue
    return ImageFont.load_default()

def draw_rect_text(draw, xy, text, font, fill=(230, 240, 255), outline=(0, 100, 200)):
    # xy is (center_x, center_y)
    try:
        # Pillow >= 9.2.0
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        text_width = right - left
        text_height = bottom - top
    except AttributeError:
        # Older Pillow
        text_width, text_height = draw.textsize(text, font=font)
    
    padding = 15
    w = text_width + padding * 2
    h = text_height + padding * 2
    
    x0 = xy[0] - w / 2
    y0 = xy[1] - h / 2
    x1 = xy[0] + w / 2
    y1 = xy[1] + h / 2
    
    draw.rectangle([x0, y0, x1, y1], fill=fill, outline=outline, width=2)
    # multiline text alignment is tricky, simple loop
    lines = text.split('\n')
    line_height = text_height / len(lines)
    current_y = y0 + padding
    for line in lines:
        # Center each line
        try:
             l, t, r, b = draw.textbbox((0, 0), line, font=font)
             lw = r - l
        except:
             lw, _ = draw.textsize(line, font=font)
        
        draw.text((xy[0] - lw/2, current_y), line, font=font, fill=(0, 0, 0))
        current_y += line_height + 5 # adding some line spacing

    return (x0, y0, x1, y1)

def generate_architecture_graph():
    img_width = 1200
    img_height = 800
    image = Image.new('RGB', (img_width, img_height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    font = get_font(24)
    
    # Nodes positions
    # Root
    root_pos = (img_width // 2, 100)
    
    # Level 1: UI-1 to UI-7
    # 7 nodes
    level1_y = 300
    count = 7
    spacing = img_width // (count + 1)
    level1_positions = []
    
    labels = [
        "首页\n(REQ-UI-1)", "认证\n(REQ-UI-2)", "查询\n(REQ-UI-3)", 
        "订单\n(REQ-UI-4)", "个人\n(REQ-UI-5)", "密码\n(REQ-UI-6)", "餐饮\n(REQ-UI-7)"
    ]
    
    # Draw connections first (to be behind boxes)
    for i in range(count):
        x = spacing * (i + 1)
        y = level1_y
        level1_positions.append((x, y))
        
        # Line from root
        draw.line([root_pos, (x, y)], fill=(100, 100, 100), width=2)
        
    # Level 2: UI-2 children
    ui2_pos = level1_positions[1]
    level2_y = 500
    ui2_children = ["注册\n(UI-2-1)", "登录\n(UI-2-2)"]
    ui2_child_positions = [(ui2_pos[0] - 60, level2_y), (ui2_pos[0] + 60, level2_y)]
    
    for pos in ui2_child_positions:
        draw.line([ui2_pos, pos], fill=(100, 100, 100), width=2)

    # Draw boxes
    draw_rect_text(draw, root_pos, "12306系统\n(ROOT)", font)
    
    for i, pos in enumerate(level1_positions):
        draw_rect_text(draw, pos, labels[i], font)
        
    for i, pos in enumerate(ui2_child_positions):
        draw_rect_text(draw, pos, ui2_children[i], font)
        
    save_path = os.path.join(output_dir, "req_architecture_graph.png")
    image.save(save_path)
    print(f"Saved {save_path}")

def generate_agent_flow():
    img_width = 1000
    img_height = 400
    image = Image.new('RGB', (img_width, img_height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    font = get_font(24)
    
    # Flow: YAML -> Queue -> Agent -> Code
    nodes = [
        "需求文档\n(YAML)", 
        "待办队列\n(Queue)", 
        "智能体\n(Agent)", 
        "代码/测试\n(Code)"
    ]
    
    count = len(nodes)
    spacing = img_width // (count + 1)
    y = img_height // 2
    
    prev_box = None
    
    for i, label in enumerate(nodes):
        x = spacing * (i + 1)
        # Draw box
        current_box = draw_rect_text(draw, (x, y), label, font)
        
        # Draw arrow from prev
        if prev_box:
            # prev_box is (x0, y0, x1, y1)
            start_x = prev_box[2]
            start_y = (prev_box[1] + prev_box[3]) / 2
            end_x = current_box[0]
            end_y = (current_box[1] + current_box[3]) / 2
            
            draw.line([(start_x, start_y), (end_x, end_y)], fill=(50, 50, 50), width=3)
            # Arrow head
            arrow_size = 10
            draw.polygon([
                (end_x, end_y),
                (end_x - arrow_size, end_y - arrow_size/2),
                (end_x - arrow_size, end_y + arrow_size/2)
            ], fill=(50, 50, 50))
            
        prev_box = current_box

    save_path = os.path.join(output_dir, "agent_flow.png")
    image.save(save_path)
    print(f"Saved {save_path}")

if __name__ == "__main__":
    generate_architecture_graph()
    generate_agent_flow()
