import os
from PIL import Image, ImageDraw, ImageFont
import yaml

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
        # Pillow >= 9.2.0，直接测多行文本包围盒
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        text_width = right - left
        text_height = bottom - top
    except AttributeError:
        # Older Pillow
        text_width, text_height = draw.textsize(text, font=font)
    
    padding = 20
    w = text_width + padding * 2
    extra_height = 16
    h = text_height + padding * 2 + extra_height
    
    x0 = xy[0] - w / 2
    y0 = xy[1] - h / 2
    x1 = xy[0] + w / 2
    y1 = xy[1] + h / 2
    
    draw.rectangle([x0, y0, x1, y1], fill=fill, outline=outline, width=2)
    # multiline text alignment
    lines = text.split('\n')
    line_spacing = 6
    if len(lines) > 1:
        line_height = max((text_height - line_spacing * (len(lines) - 1)) / len(lines), 1)
    else:
        line_height = text_height
    current_y = y0 + padding
    for line in lines:
        # Center each line
        try:
             l, t, r, b = draw.textbbox((0, 0), line, font=font)
             lw = r - l
        except:
             lw, _ = draw.textsize(line, font=font)
        
        draw.text((xy[0] - lw/2, current_y), line, font=font, fill=(0, 0, 0))
        current_y += line_height + line_spacing

    return (x0, y0, x1, y1)

def load_requirements():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    req_path = os.path.join(base_dir, "requirements.yaml")
    with open(req_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def generate_architecture_graph():
    data = load_requirements()
    root_name = data.get("name", "ROOT")
    root_id = data.get("id", "ROOT")
    level1_nodes = data.get("children", [])
    
    img_width = 1200
    img_height = 800
    image = Image.new('RGB', (img_width, img_height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    font = get_font(24)
    
    root_pos = (img_width // 2, 100)
    
    level1_y = 300
    count = len(level1_nodes)
    spacing = img_width // (count + 1) if count > 0 else img_width
    level1_positions = []
    edges = []
    
    for i in range(count):
        x = spacing * (i + 1)
        y = level1_y
        pos = (x, y)
        level1_positions.append(pos)
        edges.append((root_pos, pos))
    
    req1_node = None
    req1_index = None
    for i, node in enumerate(level1_nodes):
        if node.get("id") == "REQ-1":
            req1_node = node
            req1_index = i
            break
    if req1_node is None and level1_nodes:
        req1_node = level1_nodes[0]
        req1_index = 0
    
    level2_nodes = []
    level2_positions = []
    parent_pos = None
    if req1_node is not None:
        level2_nodes = req1_node.get("children", [])
        if level2_nodes:
            level2_y = 500
            parent_pos = level1_positions[req1_index]
            dx = 160
            total_width = dx * (len(level2_nodes) - 1) if len(level2_nodes) > 1 else 0
            start_x = parent_pos[0] - total_width / 2
            raw_positions = []
            for i, node in enumerate(level2_nodes):
                x = start_x + i * dx
                y = level2_y
                raw_positions.append((x, y))
            if raw_positions:
                min_margin_x = 140
                min_x = min(p[0] for p in raw_positions)
                shift = max(0, min_margin_x - min_x)
                level2_positions = [(x + shift, y) for (x, y) in raw_positions]
                for pos in level2_positions:
                    edges.append((parent_pos, pos))
    
    for start, end in edges:
        draw.line([start, end], fill=(100, 100, 100), width=2)
    
    draw_rect_text(draw, root_pos, f"{root_name}\n({root_id})", font)
    
    for i, pos in enumerate(level1_positions):
        node = level1_nodes[i]
        label = f"{node.get('name', '')}\n({node.get('id', '')})"
        draw_rect_text(draw, pos, label, font)
    
    for i, pos in enumerate(level2_positions):
        node = level2_nodes[i]
        label = f"{node.get('name', '')}\n({node.get('id', '')})"
        draw_rect_text(draw, pos, label, font)
        
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
