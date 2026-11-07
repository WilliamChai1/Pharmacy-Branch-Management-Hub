# scripts/generate_monthly_deck.py
"""
PMG Pharmacy - Official Monthly Strategic Presentation (.pptx) Generator
Directly populates the official Area Manager PowerPoint master template
with audited store KPIs, rolling 3-month personal sales trajectories,
category performance, and data-driven strategic insights.

Enhanced with:
- Enlarged font typography for maximum meeting room readability.
- Clear visual indicators (▲ Up / ▼ Down) with high-contrast Green (#16A34A) and Red (#DC2626).
- Actionable coaching & strategic commitments.
"""

import os
import sys
import json
import shutil
import pptx
from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE, MSO_SHAPE_TYPE

# Color Palette
COLOR_GREEN       = RGBColor(19, 115, 51)   # #137333 - Positive growth / MoM improvement
COLOR_RED         = RGBColor(220, 38, 38)   # #DC2626 - Decline / underperforming
COLOR_AMBER       = RGBColor(217, 119, 6)   # #D97706 - Warning / attention
COLOR_DARK        = RGBColor(30, 41, 59)    # #1E293B - Neutral text
COLOR_WHITE       = RGBColor(255, 255, 255) # #FFFFFF - Header text
COLOR_PMG_RED     = RGBColor(197, 34, 31)   # #C5221F - Official PMG Red Header
COLOR_SLATE       = RGBColor(75, 85, 99)    # #4B5563 - Official Subtitle Slate Gray
COLOR_DARK_TEXT   = RGBColor(31, 41, 55)    # #1F2937 - Dark bold card headers
COLOR_MUTED_TEXT  = RGBColor(51, 65, 85)    # #334155 - Card body text
COLOR_MUTED_LIGHT = RGBColor(107, 114, 128) # #6B7280 - Secondary text / notes
COLOR_BLUE        = RGBColor(12, 158, 213)  # #0C9ED5 - JASE & Opportunities
COLOR_ORANGE      = RGBColor(233, 113, 49)  # #E97131 - Merchandising & Threats
COLOR_PURPLE      = RGBColor(160, 40, 145)  # #A02891 - Marketing & Digital Health
COLOR_INDIGO      = RGBColor(79, 70, 229)   # #4F46E5 - Mobility & Solutions

def set_slide_header(shape, title_text, subtitle_text, title_size=Pt(15), subtitle_size=Pt(11),
                     title_color=COLOR_PMG_RED, subtitle_color=COLOR_SLATE):
    """
    Sets clean, professional slide headers with official PMG Red title and Slate Gray subtitle.
    Handles both direct TEXT_BOX shapes and GROUP shapes containing text frames.
    Automatically ensures clearance from top-left PMG logo (left >= 2667000 EMU).
    """
    if hasattr(shape, 'left') and shape.left < 2667000:
        diff = 2667000 - shape.left
        shape.left = 2667000
        if hasattr(shape, 'width'):
            shape.width = shape.width - diff

    tf = None
    if shape.has_text_frame:
        tf = shape.text_frame
    elif shape.shape_type == MSO_SHAPE_TYPE.GROUP:
        target_sub = None
        for sub in shape.shapes:
            if sub.has_text_frame and sub.shape_type == MSO_SHAPE_TYPE.TEXT_BOX:
                target_sub = sub
                break
        if not target_sub:
            for sub in shape.shapes:
                if sub.has_text_frame and sub.text_frame.text.strip():
                    target_sub = sub
                    break
        if target_sub:
            tf = target_sub.text_frame
            # Clear text in any other subshape of this group to prevent ghosting
            for sub in shape.shapes:
                if sub != target_sub and sub.has_text_frame:
                    sub.text_frame.text = ''
    if not tf:
        return

    tf.text = ''
    p0 = tf.paragraphs[0]
    p0.space_after = Pt(2)
    r0 = p0.add_run()
    r0.text = title_text
    r0.font.name = 'Arial'
    r0.font.size = title_size
    r0.font.bold = True
    r0.font.color.rgb = title_color

    p1 = tf.add_paragraph()
    r1 = p1.add_run()
    r1.text = subtitle_text
    r1.font.name = 'Arial'
    r1.font.size = subtitle_size
    r1.font.bold = True
    r1.font.color.rgb = subtitle_color

def set_card_content(shape_or_grp, paragraphs_spec):
    """
    Writes formatted paragraphs and runs into a card text box or group subshape.
    paragraphs_spec is a list of tuples:
      (runs_list, space_after)
    where runs_list is a list of tuples:
      (text, font_size, bold, color_rgb)
    """
    tf = None
    if shape_or_grp.has_text_frame:
        tf = shape_or_grp.text_frame
    elif shape_or_grp.shape_type == MSO_SHAPE_TYPE.GROUP:
        if len(shape_or_grp.shapes) > 2 and shape_or_grp.shapes[2].has_text_frame:
            tf = shape_or_grp.shapes[2].text_frame
        else:
            for sub in shape_or_grp.shapes:
                if sub.has_text_frame and sub.text_frame.text.strip():
                    tf = sub.text_frame
                    break
    if not tf:
        return

    tf.text = ''
    for p_idx, (runs, space_after) in enumerate(paragraphs_spec):
        p = tf.paragraphs[0] if p_idx == 0 else tf.add_paragraph()
        if space_after is not None:
            p.space_after = space_after
        for item in runs:
            txt, sz, bld, col = item
            r = p.add_run()
            r.text = txt
            r.font.name = 'Arial'
            if sz is not None:
                r.font.size = sz
            if bld is not None:
                r.font.bold = bld
            if col is not None:
                r.font.color.rgb = col

def create_coaching_slide(prs):
    """
    Creates a dedicated, executive slide for Teammate Coaching & Actionable Recommendations.
    Positioned immediately following Slide 5 (Teammate Personal Sales).
    """
    blank_layout = prs.slide_layouts[6] # Blank layout with master branding
    s = prs.slides.add_slide(blank_layout)

    # Move slide to index 5 (Slide 6 in presentation)
    sldIdLst = prs.slides._sldIdLst
    slide_elem = sldIdLst[-1]
    sldIdLst.remove(slide_elem)
    sldIdLst.insert(5, slide_elem)

    # 1. Slide Header
    hdr_bg = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Pt(210), Pt(22), Pt(708), Pt(56))
    hdr_bg.fill.solid()
    hdr_bg.fill.fore_color.rgb = RGBColor(248, 249, 250)
    hdr_bg.line.color.rgb = RGBColor(226, 232, 240)
    hdr_bg.line.width = Pt(1)

    hdr_tb = s.shapes.add_textbox(Pt(220), Pt(24), Pt(690), Pt(50))
    set_slide_header(hdr_tb, "COACHING & ACTIONABLE RECOMMENDATIONS",
                     "Tailored Recovery Plans & Performance Upgrading for Core Dispensary Staff")

    # 2. Four Staff Coaching Cards (2x2 Grid)
    card_w = Pt(435)
    card_h = Pt(176)
    col1_l = Pt(38)
    col2_l = Pt(487)
    row1_t = Pt(88)
    row2_t = Pt(274)

    cards_data = [
        (col1_l, row1_t, "⚠️ Jong Pei Choo [PA] — 3M Turnover Contraction (-26.0%)",
         "Trajectory: Aug RM 77.9k ➔ Sep RM 68.1k ➔ Oct RM 57.6k (HB 47.19% | GP 26.86% | 1,258 Tx)",
         "Key Bottleneck: Steady footfall decline (-122 Tx MoM) and reduced companion supplement bundling.",
         [
             "1-on-1 session with PIC William Chai to review counter companion scripts.",
             "Establish weekly RM 7,000 House Brand sales target at dispensary.",
             "Proactively counsel chronic patients during morning 7th Mile wet market footfall."
         ]),
        
        (col2_l, row1_t, "⚠️ Muhammad Nur Farizin [PA] — Low House Brand Attachment (28.32%)",
         "Trajectory: Aug RM 30.9k ➔ Sep RM 38.9k ➔ Oct RM 32.3k (HB Basket: RM 9.09 | GP 26.17%)",
         "Key Bottleneck: Lowest House Brand basket size (RM 9.09) in branch; default dispensing without add-ons.",
         [
             "Pair with senior dispenser for weekly 15-minute DPOS companion role-playing.",
             "Enforce daily minimum RM 450+ House Brand attachment at dispensing counter.",
             "Proactively bundle metabolic wellness lines with every regular Rx refill."
         ]),
        
        (col1_l, row2_t, "⚠️ Haniesha Louna [ABM] — 3M Sales Contraction (-28.0%)",
         "Trajectory: Aug RM 46.3k ➔ Sep RM 33.1k ➔ Oct RM 33.3k (HB 40.03% | GP 25.59% | 799 Tx)",
         "Key Bottleneck: Margin dilution from unattached commercial milk checkouts; lowest GP% (25.59%).",
         [
             "Cease unattached low-margin commercial formula sales at checkout.",
             "Cross-sell high-margin wellness supplements (35%+ GP) to lift individual GP ≥27.5%.",
             "Actively guide price-sensitive shoppers to PMG clinical nutrition lines."
         ]),
        
        (col2_l, row2_t, "⚠️ Fiona Fiena [PA] — 3M Sales Drop (-28.7%) & Tx Contraction",
         "Trajectory: Aug RM 46.0k ➔ Sep RM 38.7k ➔ Oct RM 32.8k (Tx: 870 | HB 39.92% | GP 27.19%)",
         "Key Bottleneck: Sharp decline in transaction volume (-194 transactions MoM, down to 870 Tx).",
         [
             "Assign front greeting duty during 7th Mile morning peak (7:30–10:30 AM).",
             "Proactively triage walk-ins to lift daily transaction volume to ≥32 Tx/day.",
             "Bundle fast-moving House Brand essentials at cashier checkout counter."
         ])
    ]

    for cl, ct, title, traj, bneck, act_list in cards_data:
        c_bg = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cl, ct, card_w, card_h)
        c_bg.fill.solid()
        c_bg.fill.fore_color.rgb = RGBColor(255, 255, 255)
        c_bg.line.color.rgb = RGBColor(226, 232, 240)
        c_bg.line.width = Pt(1)

        tb = s.shapes.add_textbox(cl + Pt(12), ct + Pt(8), card_w - Pt(24), card_h - Pt(16))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.text = ''

        # P0: Title
        p0 = tf.paragraphs[0]
        p0.space_after = Pt(2)
        r0 = p0.add_run()
        r0.text = title
        r0.font.name = 'Arial'
        r0.font.size = Pt(10.5)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK_TEXT

        # P1: Trajectory
        p1 = tf.add_paragraph()
        p1.space_after = Pt(2)
        r1 = p1.add_run()
        r1.text = traj
        r1.font.name = 'Arial'
        r1.font.size = Pt(9)
        r1.font.color.rgb = COLOR_SLATE

        # P2: Bottleneck
        p2 = tf.add_paragraph()
        p2.space_after = Pt(2)
        r2 = p2.add_run()
        r2.text = bneck
        r2.font.name = 'Arial'
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_SLATE

        # P3: Action Plan Header
        p3 = tf.add_paragraph()
        p3.space_after = Pt(1.5)
        r3_lbl = p3.add_run()
        r3_lbl.text = "Action Plan (Straightforward Steps):"
        r3_lbl.font.name = 'Arial'
        r3_lbl.font.size = Pt(9)
        r3_lbl.font.bold = True
        r3_lbl.font.color.rgb = COLOR_GREEN

        # Bullets
        for act_item in act_list:
            p_act = tf.add_paragraph()
            p_act.space_after = Pt(1)
            r_dot = p_act.add_run()
            r_dot.text = "• "
            r_dot.font.name = 'Arial'
            r_dot.font.size = Pt(8.5)
            r_dot.font.bold = True
            r_dot.font.color.rgb = COLOR_GREEN

            r_act = p_act.add_run()
            r_act.text = act_item
            r_act.font.name = 'Arial'
            r_act.font.size = Pt(8.5)
            r_act.font.color.rgb = COLOR_MUTED_TEXT

    # 3. Bottom Banner: Star Benchmark Highlights (Clearance from bottom-right master arrow)
    b_bg = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Pt(38), Pt(460), Pt(780), Pt(48))
    b_bg.fill.solid()
    b_bg.fill.fore_color.rgb = RGBColor(240, 253, 244) # Light green tint
    b_bg.line.color.rgb = RGBColor(187, 247, 208)
    b_bg.line.width = Pt(1)

    b_tb = s.shapes.add_textbox(Pt(48), Pt(464), Pt(760), Pt(40))
    b_tf = b_tb.text_frame
    b_tf.word_wrap = True
    b_tf.text = ''
    bp = b_tf.paragraphs[0]
    
    br_lbl = bp.add_run()
    br_lbl.text = "⭐ Star Benchmark Highlights: "
    br_lbl.font.name = 'Arial'
    br_lbl.font.size = Pt(10)
    br_lbl.font.bold = True
    br_lbl.font.color.rgb = RGBColor(22, 101, 52) # Dark green

    br_txt = bp.add_run()
    br_txt.text = (
        "Christina Lee [PRP] delivered RM 34,887.97 in her debut month with 43.24% House Brand share (RM 15.1k HB) and 918 Tx. "
        "Kenix Ling [Pharmacist] led the branch with 53.56% House Brand share (RM 18.1k HB) and 31.65% GP margin."
    )
    br_txt.font.name = 'Arial'
    br_txt.font.size = Pt(9.5)
    br_txt.font.color.rgb = RGBColor(22, 101, 52)

    return s

def fmt_rm(val):
    if val is None or val == 0:
        return 'RM 0.00'
    return f'RM {val:,.2f}'

def fmt_num(val):
    if val is None:
        return '0'
    if isinstance(val, float):
        return f'{val:,.2f}'
    return f'{val:,}'

def fmt_pct(val, decimals=2):
    if val is None:
        return '0.00%'
    return f'{val:.{decimals}f}%'

def set_cell_formatted(cell, val_text, sub_text=None, val_size=Pt(10.5), val_bold=False, val_color=None,
                       sub_size=Pt(9), sub_bold=False, sub_color=None, align=PP_ALIGN.CENTER):
    """
    Sets a cell's main value and optional sub-value (on a new line) with independent
    font sizing, weight, and color (e.g. Green ▲ / Red ▼).
    """
    cell.text = ''
    p = cell.text_frame.paragraphs[0]
    p.alignment = align
    
    r1 = p.add_run()
    r1.text = val_text
    r1.font.name = 'Arial'
    r1.font.size = val_size
    r1.font.bold = val_bold
    if val_color:
        r1.font.color.rgb = val_color

    if sub_text:
        p.add_line_break()
        r2 = p.add_run()
        r2.text = sub_text
        r2.font.name = 'Arial'
        r2.font.size = sub_size
        r2.font.bold = sub_bold
        if sub_color:
            r2.font.color.rgb = sub_color

def set_cell_header(cell, text, font_size=Pt(10.5), bold=True, align=PP_ALIGN.CENTER):
    cell.text = ''
    p = cell.text_frame.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.name = 'Arial'
    r.font.size = font_size
    r.font.bold = bold
    r.font.color.rgb = COLOR_WHITE

def update_presentation(template_path, data, output_path):
    print(f"Loading master template: {template_path}")
    prs = Presentation(template_path)

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (Brand Graphic Intact)
    # =========================================================================
    s1 = prs.slides[0]
    for shape in s1.shapes:
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if 'DATE' in t:
                shape.text_frame.text = 'DATE : 01 November 2026'
                for p in shape.text_frame.paragraphs:
                    for r in p.runs:
                        r.font.name = 'Arial'
                        r.font.size = Pt(14)
                        r.font.bold = True
            elif 'PRESENTER' in t:
                shape.text_frame.text = 'PRESENTER: William Chai (Pharmacist / Area Manager)'
                for p in shape.text_frame.paragraphs:
                    for r in p.runs:
                        r.font.name = 'Arial'
                        r.font.size = Pt(14)
                        r.font.bold = True
            elif 'OUTLET' in t:
                shape.text_frame.text = 'OUTLET : PMG PHARMACY KOTA SENTOSA'
                for p in shape.text_frame.paragraphs:
                    for r in p.runs:
                        r.font.name = 'Arial'
                        r.font.size = Pt(14)
                        r.font.bold = True

    # =========================================================================
    # SLIDE 2: OVERALL SALES PERFORMANCES (MTD Vs LY) — ENLARGED & ARROW INDICATORS
    # =========================================================================
    s2 = prs.slides[1]
    t2 = s2.shapes[1].table

    # Row 0: Headers
    headers_s2 = ['STORE', 'Aug 26', 'Aug 25', 'Sales Vs LY (RM)', 'Sept 26', 'Sept 25', 'Sales Vs LY (RM)', 'Oct 26', 'Oct 25', 'Sales Vs LY (RM)']
    for c_idx, h in enumerate(headers_s2):
        set_cell_header(t2.cell(0, c_idx), h, font_size=Pt(10), bold=True)

    # Row 1: Total Sales
    set_cell_formatted(t2.cell(1, 0), 'Total Sales (RM)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t2.cell(1, 1), '380,852.53', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(1, 2), '314,607.72', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(1, 3), '+66,244.81', '▲ +21.06%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(1, 4), '337,979.41', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(1, 5), '307,840.64', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(1, 6), '+30,138.77', '▲ +9.79%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(1, 7), '340,252.85', val_size=Pt(11), val_bold=True)
    set_cell_formatted(t2.cell(1, 8), '351,989.93', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(1, 9), '-11,737.08', '▼ -3.33%', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_RED)

    # Row 2: HB Sales
    set_cell_formatted(t2.cell(2, 0), 'HB Sales (RM %)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t2.cell(2, 1), '164,354.04', '(43.15%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(2, 2), '114,842.68', '(36.50%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(2, 3), '+49,511.36', '▲ +43.11%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(2, 4), '144,533.00', '(42.76%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(2, 5), '113,114.84', '(36.74%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(2, 6), '+31,418.16', '▲ +27.78%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(2, 7), '147,299.28', '(43.29%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)
    set_cell_formatted(t2.cell(2, 8), '134,562.30', '(38.23%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(2, 9), '+12,736.98', '▲ +9.47%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 3: HM Sales
    set_cell_formatted(t2.cell(3, 0), 'HM Sales (RM %)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t2.cell(3, 1), '38,826.70', '(10.19%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(3, 2), '29,498.80', '(9.38%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(3, 3), '+9,327.90', '▲ +31.62%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(3, 4), '32,643.20', '(9.66%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(3, 5), '30,909.35', '(10.04%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(3, 6), '+1,733.85', '▲ +5.61%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(3, 7), '30,818.81', '(9.06%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)
    set_cell_formatted(t2.cell(3, 8), '28,251.18', '(8.03%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(3, 9), '+2,567.63', '▲ +9.09%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 4: GPRM
    set_cell_formatted(t2.cell(4, 0), 'GPRM (RM %)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t2.cell(4, 1), '100,551.66', '(26.07%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(4, 2), '82,753.23', '(26.07%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(4, 3), '+17,798.43', '▲ +21.51%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(4, 4), '91,857.56', '(26.84%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(4, 5), '82,095.69', '(26.42%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(4, 6), '+9,761.87', '▲ +11.89%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(4, 7), '95,354.80', '(27.81%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)
    set_cell_formatted(t2.cell(4, 8), '94,515.18', '(26.64%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t2.cell(4, 9), '+839.62', '▲ +0.89%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 5: No of Transactions
    set_cell_formatted(t2.cell(5, 0), 'No of Transactions', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t2.cell(5, 1), '8,433', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(5, 2), '7,897', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(5, 3), '+536', '▲ +6.79%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(5, 4), '7,779', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(5, 5), '7,754', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(5, 6), '+25', '▲ +0.32%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(5, 7), '8,066', val_size=Pt(11), val_bold=True)
    set_cell_formatted(t2.cell(5, 8), '8,715', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(5, 9), '-649', '▼ -7.45%', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_RED)

    # Row 6: Basket Size (TS)
    set_cell_formatted(t2.cell(6, 0), 'Basket Size (TS)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t2.cell(6, 1), '45.16', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(6, 2), '39.84', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(6, 3), '+5.32', '▲ +13.36%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(6, 4), '43.45', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(6, 5), '39.70', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(6, 6), '+3.75', '▲ +9.44%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(6, 7), '42.18', val_size=Pt(11), val_bold=True)
    set_cell_formatted(t2.cell(6, 8), '40.39', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(6, 9), '+1.79', '▲ +4.43%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 7: Basket Size (HB)
    set_cell_formatted(t2.cell(7, 0), 'Basket Size (HB)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t2.cell(7, 1), '19.49', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(7, 2), '14.54', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(7, 3), '+4.95', '▲ +34.02%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(7, 4), '18.58', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(7, 5), '14.59', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(7, 6), '+3.99', '▲ +27.36%', val_size=Pt(10), val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)
    set_cell_formatted(t2.cell(7, 7), '18.26', val_size=Pt(11), val_bold=True)
    set_cell_formatted(t2.cell(7, 8), '15.44', val_size=Pt(10.5))
    set_cell_formatted(t2.cell(7, 9), '+2.82', '▲ +18.26%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Shape 2: Takeaways text
    if len(s2.shapes) > 2 and s2.shapes[2].has_text_frame:
        tf2 = s2.shapes[2].text_frame
        tf2.text = (
            "• Sustained YoY Gross Profit Expansion: October 2026 turnover reached RM 340,252.85 with gross profit expanding to RM 95,354.80 (27.81% GP margin, up +1.17 percentage points YoY vs 26.64% in Oct 2025).\n"
            "• Robust House Brand Penetration: HB sales expanded to RM 147,299.28, surging +9.47% YoY and contributing 43.29% of total outlet turnover (vs 38.23% in LY).\n"
            "• Quality Basket Sizes via DPOS Bundling: Average basket size reached RM 42.18 (+4.43% YoY) and HB basket size expanded to RM 18.26 (+18.26% YoY), driven by companion bundling at dispensing counters."
        )
        for p in tf2.paragraphs:
            p.font.name = 'Arial'
            p.font.size = Pt(11)

    # =========================================================================
    # SLIDE 3: TEAMMATES - LEADERSHIP (William, Farizin, Louna) — ENLARGED & ARROWS
    # =========================================================================
    s3 = prs.slides[2]
    t3 = s3.shapes[1].table

    # Row 0: Headers
    set_cell_header(t3.cell(0, 0), 'TEAMMATES', font_size=Pt(11))
    set_cell_header(t3.cell(0, 1), 'William [PIC]', font_size=Pt(11))
    set_cell_header(t3.cell(0, 4), 'Muhammad Nur Farizin [PA]', font_size=Pt(11))
    set_cell_header(t3.cell(0, 7), 'Haniesha Louna [ABM]', font_size=Pt(11))

    # Row 1: Months
    subheaders = ['', 'Aug', 'Sept', 'Oct', 'Aug', 'Sept', 'Oct', 'Aug', 'Sept', 'Oct']
    for c_idx, sh in enumerate(subheaders):
        if c_idx > 0:
            set_cell_header(t3.cell(1, c_idx), sh, font_size=Pt(10.5))

    # Row 2: Total Sales
    set_cell_formatted(t3.cell(2, 0), 'Total Sales', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t3.cell(2, 1), '56,218.31', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(2, 2), '57,034.03', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(2, 3), '54,282.56', '▼ MoM', val_size=Pt(11), val_bold=True, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t3.cell(2, 4), '30,931.79', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(2, 5), '38,902.31', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(2, 6), '32,317.74', '▼ -16.9%', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t3.cell(2, 7), '46,327.58', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(2, 8), '33,077.20', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(2, 9), '33,343.42', '▲ +0.8%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 3: HB Sales (%)
    set_cell_formatted(t3.cell(3, 0), 'HB Sales (%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t3.cell(3, 1), '26,502.91', '(47.14%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(3, 2), '29,411.83', '(51.57%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(3, 3), '26,918.05', '(49.59%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t3.cell(3, 4), '9,492.40', '(30.69%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(3, 5), '12,023.81', '(30.91%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(3, 6), '9,153.55', '▼ 28.32%', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t3.cell(3, 7), '21,296.52', '(45.97%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(3, 8), '15,277.24', '(46.19%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(3, 9), '13,348.87', '▼ 40.03%', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_RED)

    # Row 4: HM sales (%)
    set_cell_formatted(t3.cell(4, 0), 'HM sales (%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t3.cell(4, 1), '5,368.15', '(9.55%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(4, 2), '6,189.80', '(10.85%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(4, 3), '5,112.48', '(9.42%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t3.cell(4, 4), '3,192.90', '(10.32%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(4, 5), '3,825.20', '(9.83%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(4, 6), '2,911.40', '(9.01%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t3.cell(4, 7), '4,244.40', '(9.16%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(4, 8), '2,690.90', '(8.14%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(4, 9), '2,517.60', '(7.55%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    # Row 5: No of Transactions
    set_cell_formatted(t3.cell(5, 0), 'No of Transactions', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t3.cell(5, 1), '466', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(5, 2), '597', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(5, 3), '567', val_size=Pt(11), val_bold=True)

    set_cell_formatted(t3.cell(5, 4), '916', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(5, 5), '1,172', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(5, 6), '1,007', '▼ -14.1%', val_size=Pt(11), val_bold=True, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t3.cell(5, 7), '1,024', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(5, 8), '783', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(5, 9), '799', '▲ +16 Tx', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 6: Basket Size (TS)
    set_cell_formatted(t3.cell(6, 0), 'Basket Size (TS)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t3.cell(6, 1), '120.64', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(6, 2), '95.53', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(6, 3), '95.74', '▲ Stable', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t3.cell(6, 4), '33.77', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(6, 5), '33.19', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(6, 6), '32.09', '▼ Drop', val_size=Pt(11), val_bold=True, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t3.cell(6, 7), '45.24', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(6, 8), '42.24', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(6, 9), '41.73', val_size=Pt(11), val_bold=True)

    # Row 7: Basket Size (HB)
    set_cell_formatted(t3.cell(7, 0), 'Basket Size (HB)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t3.cell(7, 1), '56.87', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(7, 2), '49.27', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(7, 3), '47.47', val_size=Pt(11), val_bold=True)

    set_cell_formatted(t3.cell(7, 4), '10.36', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(7, 5), '10.26', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(7, 6), '9.09', '▼ Low', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t3.cell(7, 7), '20.80', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(7, 8), '19.51', val_size=Pt(10.5))
    set_cell_formatted(t3.cell(7, 9), '16.71', val_size=Pt(11), val_bold=True)

    # Row 8: GPRM (%)
    set_cell_formatted(t3.cell(8, 0), 'GPRM(%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t3.cell(8, 1), '14,105.02', '(25.09%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(8, 2), '16,494.38', '(27.57%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(8, 3), '15,752.68', '▲ 29.02%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t3.cell(8, 4), '8,481.94', '(27.42%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(8, 5), '9,763.77', '(24.96%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(8, 6), '8,468.15', '▲ 26.17%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t3.cell(8, 7), '12,813.91', '(27.66%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(8, 8), '9,196.92', '(27.56%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t3.cell(8, 9), '8,532.55', '▼ 25.59%', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_RED)

    # =========================================================================
    # SLIDE 4: TEAMMATES - CORE DISPENSARY (Fiona, Nurhafizah, Jong Pei Choo)
    # =========================================================================
    s4 = prs.slides[3]
    t4 = s4.shapes[1].table

    # Row 0: Headers
    set_cell_header(t4.cell(0, 0), 'TEAMMATES', font_size=Pt(11))
    set_cell_header(t4.cell(0, 1), 'Fiona Fiena [PA]', font_size=Pt(11))
    set_cell_header(t4.cell(0, 4), 'Nurhafizah Pauli [PA]', font_size=Pt(11))
    set_cell_header(t4.cell(0, 7), 'Jong Pei Choo [PA]', font_size=Pt(11))

    # Row 1: Months
    for c_idx, sh in enumerate(subheaders):
        if c_idx > 0:
            set_cell_header(t4.cell(1, c_idx), sh, font_size=Pt(10.5))

    # Row 2: Total Sales
    set_cell_formatted(t4.cell(2, 0), 'Total Sales', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t4.cell(2, 1), '45,990.94', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(2, 2), '38,723.18', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(2, 3), '32,814.51', '▼ 3M Drop', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t4.cell(2, 4), '32,180.29', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(2, 5), '37,220.70', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(2, 6), '36,325.44', '▲ Steady', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t4.cell(2, 7), '77,868.67', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(2, 8), '68,087.05', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(2, 9), '57,607.00', '▼ 3M Drop', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    # Row 3: HB Sales (%)
    set_cell_formatted(t4.cell(3, 0), 'HB Sales (%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t4.cell(3, 1), '20,374.91', '(44.30%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(3, 2), '15,585.48', '(40.25%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(3, 3), '13,098.35', '(39.92%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t4.cell(3, 4), '10,697.52', '(33.24%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(3, 5), '11,911.70', '(32.00%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(3, 6), '11,342.34', '▼ 31.22%', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t4.cell(3, 7), '40,551.13', '(52.08%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(3, 8), '30,255.60', '(44.44%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(3, 9), '27,181.97', '▲ 47.19%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 4: HM sales (%)
    set_cell_formatted(t4.cell(4, 0), 'HM sales (%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t4.cell(4, 1), '4,134.40', '(8.99%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(4, 2), '3,698.90', '(9.55%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(4, 3), '2,519.96', '(7.68%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t4.cell(4, 4), '4,005.60', '(12.45%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(4, 5), '3,165.70', '(8.51%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(4, 6), '4,212.50', '▲ 11.60%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t4.cell(4, 7), '8,186.15', '(10.51%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(4, 8), '7,185.30', '(10.55%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(4, 9), '5,033.49', '(8.74%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    # Row 5: No of Transactions
    set_cell_formatted(t4.cell(5, 0), 'No of Transactions', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t4.cell(5, 1), '1,062', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(5, 2), '1,064', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(5, 3), '870', '▼ -194 Tx', val_size=Pt(11), val_bold=True, val_color=COLOR_RED, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    set_cell_formatted(t4.cell(5, 4), '1,029', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(5, 5), '1,066', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(5, 6), '1,112', '▲ +46 Tx', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t4.cell(5, 7), '1,380', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(5, 8), '1,327', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(5, 9), '1,258', '▼ -69 Tx', val_size=Pt(11), val_bold=True, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_RED)

    # Row 6: Basket Size (TS)
    set_cell_formatted(t4.cell(6, 0), 'Basket Size (TS)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t4.cell(6, 1), '43.31', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(6, 2), '36.39', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(6, 3), '37.72', '▲ +RM 1.33', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t4.cell(6, 4), '31.27', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(6, 5), '34.92', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(6, 6), '32.67', val_size=Pt(11), val_bold=True)

    set_cell_formatted(t4.cell(6, 7), '56.43', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(6, 8), '51.31', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(6, 9), '45.79', val_size=Pt(11), val_bold=True)

    # Row 7: Basket Size (HB)
    set_cell_formatted(t4.cell(7, 0), 'Basket Size (HB)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t4.cell(7, 1), '19.19', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(7, 2), '14.65', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(7, 3), '15.06', '▲ +RM 0.41', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t4.cell(7, 4), '10.40', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(7, 5), '11.17', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(7, 6), '10.20', val_size=Pt(11), val_bold=True)

    set_cell_formatted(t4.cell(7, 7), '29.38', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(7, 8), '22.80', val_size=Pt(10.5))
    set_cell_formatted(t4.cell(7, 9), '21.61', val_size=Pt(11), val_bold=True)

    # Row 8: GPRM (%)
    set_cell_formatted(t4.cell(8, 0), 'GPRM(%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t4.cell(8, 1), '12,304.53', '(26.75%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(8, 2), '10,891.39', '(27.99%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(8, 3), '8,921.83', '(27.19%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t4.cell(8, 4), '8,731.37', '(27.13%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(8, 5), '9,239.66', '(24.53%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(8, 6), '9,953.55', '▲ 27.40%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t4.cell(8, 7), '19,762.47', '(25.38%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(8, 8), '17,900.38', '(26.25%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t4.cell(8, 9), '15,473.48', '▲ 26.86%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # =========================================================================
    # SLIDE 5: TEAMMATES - STAFF & PHARMACISTS (FULL WIDTH TABLE EXPANSION)
    # =========================================================================
    s5 = prs.slides[4]

    # 1. Remove separate coaching card from Slide 5 (moved to dedicated Slide 6)
    if len(s5.shapes) > 2:
        sp2 = s5.shapes[2]._element
        sp2.getparent().remove(sp2)

    # 2. Expand table to full slide width (matching Slide 3 and Slide 4)
    s5.shapes[1].left = 220869
    t5 = s5.shapes[1].table
    t5.columns[0].width = 2095500
    for c in range(1, 7):
        t5.columns[c].width = 1612900

    # Row 0: Headers
    set_cell_header(t5.cell(0, 0), 'TEAMMATES', font_size=Pt(11.5))
    set_cell_header(t5.cell(0, 1), 'Christina Lee [PRP]', font_size=Pt(11.5))
    set_cell_header(t5.cell(0, 4), 'Kenix Ling [Pharmacist]', font_size=Pt(11.5))

    # Row 1: Months
    subheaders_s5 = ['', 'Aug', 'Sept', 'Oct', 'Aug', 'Sept', 'Oct']
    for c_idx, sh in enumerate(subheaders_s5):
        if c_idx > 0:
            set_cell_header(t5.cell(1, c_idx), sh, font_size=Pt(11))

    # Row 2: Total Sales
    set_cell_formatted(t5.cell(2, 0), 'Total Sales', val_size=Pt(11), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(2, 1), '— (New)', val_size=Pt(11))
    set_cell_formatted(t5.cell(2, 2), '— (New)', val_size=Pt(11))
    set_cell_formatted(t5.cell(2, 3), '34,887.97', '★ Strong Start', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t5.cell(2, 4), '30,321.83', val_size=Pt(11))
    set_cell_formatted(t5.cell(2, 5), '22,669.41', val_size=Pt(11))
    set_cell_formatted(t5.cell(2, 6), '33,851.04', '▲ +49.3%', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 3: HB Sales (%)
    set_cell_formatted(t5.cell(3, 0), 'HB Sales (%)', val_size=Pt(11), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(3, 1), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(3, 2), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(3, 3), '15,084.64', '▲ 43.24%', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t5.cell(3, 4), '13,782.70', '(45.45%)', val_size=Pt(11), sub_size=Pt(9.5))
    set_cell_formatted(t5.cell(3, 5), '10,073.31', '(44.44%)', val_size=Pt(11), sub_size=Pt(9.5))
    set_cell_formatted(t5.cell(3, 6), '18,132.18', '▲ 53.56%', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 4: HM sales (%)
    set_cell_formatted(t5.cell(4, 0), 'HM sales (%)', val_size=Pt(11), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(4, 1), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(4, 2), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(4, 3), '2,744.90', '(7.87%)', val_size=Pt(11.5), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t5.cell(4, 4), '4,002.90', '(13.20%)', val_size=Pt(11), sub_size=Pt(9.5))
    set_cell_formatted(t5.cell(4, 5), '2,654.30', '(11.71%)', val_size=Pt(11), sub_size=Pt(9.5))
    set_cell_formatted(t5.cell(4, 6), '3,658.70', '(10.81%)', val_size=Pt(11.5), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    # Row 5: No of Transactions
    set_cell_formatted(t5.cell(5, 0), 'No of Transactions', val_size=Pt(11), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(5, 1), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(5, 2), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(5, 3), '918', val_size=Pt(11.5), val_bold=True)

    set_cell_formatted(t5.cell(5, 4), '676', val_size=Pt(11))
    set_cell_formatted(t5.cell(5, 5), '611', val_size=Pt(11))
    set_cell_formatted(t5.cell(5, 6), '757', '▲ +146 Tx', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 6: Basket Size (TS)
    set_cell_formatted(t5.cell(6, 0), 'Basket Size (TS)', val_size=Pt(11), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(6, 1), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(6, 2), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(6, 3), '38.00', val_size=Pt(11.5), val_bold=True)

    set_cell_formatted(t5.cell(6, 4), '44.85', val_size=Pt(11))
    set_cell_formatted(t5.cell(6, 5), '37.10', val_size=Pt(11))
    set_cell_formatted(t5.cell(6, 6), '44.72', '▲ +RM 7.62', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 7: Basket Size (HB)
    set_cell_formatted(t5.cell(7, 0), 'Basket Size (HB)', val_size=Pt(11), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(7, 1), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(7, 2), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(7, 3), '16.43', val_size=Pt(11.5), val_bold=True)

    set_cell_formatted(t5.cell(7, 4), '20.39', val_size=Pt(11))
    set_cell_formatted(t5.cell(7, 5), '16.49', val_size=Pt(11))
    set_cell_formatted(t5.cell(7, 6), '23.95', '▲ +RM 7.46', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 8: GPRM (%)
    set_cell_formatted(t5.cell(8, 0), 'GPRM(%)', val_size=Pt(11), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(8, 1), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(8, 2), '—', val_size=Pt(11))
    set_cell_formatted(t5.cell(8, 3), '9,980.79', '▲ 28.61%', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t5.cell(8, 4), '9,335.79', '(30.79%)', val_size=Pt(11), sub_size=Pt(9.5))
    set_cell_formatted(t5.cell(8, 5), '6,538.08', '(28.78%)', val_size=Pt(11), sub_size=Pt(9.5))
    set_cell_formatted(t5.cell(8, 6), '10,713.88', '▲ 31.65%', val_size=Pt(11.5), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # =========================================================================
    # SLIDE 6: CATEGORY SALES FINDING (MTD) — ENLARGED (Pt 9) & ARROWS
    # =========================================================================
    s6 = prs.slides[5]
    t6 = s6.shapes[1].table

    # Row 0: Headers
    headers_s6 = [
        'CATEGORY', 'STOCK CYCLE', 'SALES CONTRIBUTION (%)',
        'NET SOLD PRICE 10/26', 'NET SOLD PRICE 10/25', 'Oct26 Vs Oct25 (RM)',
        'NET SOLD PROFIT 10/26', 'NET SOLD PROFIT 10/25', 'Oct26 VS Oct25 (Profit RM)',
        'GP% 10/26', 'GP% 10/25', 'Oct26 VS Oct25 (GP%)'
    ]
    for c_idx, h in enumerate(headers_s6):
        set_cell_header(t6.cell(0, c_idx), h, font_size=Pt(8.5), bold=True)

    # Category rows data with exact diffs, signs, and directions
    # Format: (Name, Cycle, CycleWarning, Contrib%, Sold26, Sold25, DiffSoldRM, SoldUp, Profit26, Profit25, DiffProfitRM, ProfitUp, GP26, GP25, DiffGP, GPUp)
    cat_rows = [
        ('ELDERLY',  '3.63', True,  '6.4%',  '21,541.22', '22,310.20', '▼ -768.98',   False, '6,312.27',  '5,234.96',  '▲ +1,077.31', True,  '29.30%', '23.46%', '▲ +5.84%', True),
        ('F & B',    '2.59', False, '16.9%', '57,366.34', '54,055.83', '▲ +3,310.51',  True,  '14,218.64', '11,618.96', '▲ +2,599.68', True,  '24.79%', '21.49%', '▲ +3.30%', True),
        ('FIR-AID',  '4.54', True,  '2.6%',  '8,873.34',  '14,370.80', '▼ -5,497.46', False, '2,989.42',  '3,472.61',  '▼ -483.19',   False, '33.69%', '24.16%', '▲ +9.53%', True),
        ('HOME&LIV', '6.30', True,  '0.3%',  '934.47',    '1,320.90',  '▼ -386.43',   False, '233.39',    '399.50',    '▼ -166.11',   False, '24.98%', '30.24%', '▼ -5.26%', False),
        ('MOM&BABY', '5.69', True,  '2.1%',  '7,196.59',  '10,836.98', '▼ -3,640.39', False, '841.54',    '1,191.34',  '▼ -349.80',   False, '11.69%', '10.99%', '▲ +0.70%', True),
        ('NON-SCHE', '1.93', False, '12.1%', '41,009.75', '45,222.60', '▼ -4,212.85', False, '15,841.43', '17,615.63', '▼ -1,774.20', False, '38.63%', '38.95%', '▼ -0.32%', False),
        ('NON-SC-P', '1.71', False, '1.0%',  '3,497.20',  '4,041.40',  '▼ -544.20',   False, '1,261.90',  '1,267.02',  '▼ -5.12',     False, '36.08%', '31.35%', '▲ +4.73%', True),
        ('OTC',      '2.20', False, '12.7%', '42,802.46', '45,871.97', '▼ -3,069.51', False, '10,972.18', '12,241.56', '▼ -1,269.38', False, '25.63%', '26.69%', '▼ -1.06%', False),
        ('PERSONAL', '4.18', True,  '4.5%',  '15,343.16', '16,852.01', '▼ -1,508.85', False, '4,542.98',  '4,678.06',  '▼ -135.08',   False, '29.61%', '27.76%', '▲ +1.85%', True),
        ('SCHE-DRU', '1.87', False, '18.5%', '62,679.91', '62,385.00', '▲ +294.91',   True,  '7,483.85',  '8,741.59',  '▼ -1,257.74', False, '11.94%', '14.01%', '▼ -2.07%', False),
        ('SUPPLEME', '2.08', False, '22.5%', '76,082.27', '73,358.68', '▲ +2,723.59',  True,  '28,112.94', '26,640.17', '▲ +1,472.77', True,  '36.95%', '36.31%', '▲ +0.64%', True),
        ('TOTAL / AVG', '2.47', False, '100.0%', '338,470.45', '351,437.57', '▼ -12,967.12', False, '93,063.40', '93,274.66', '▼ -211.26', False, '27.50%', '26.54%', '▲ +0.96%', True)
    ]

    for r_idx, row in enumerate(cat_rows):
        row_num = r_idx + 1
        name, cycle, cycle_warn, contrib, sold26, sold25, diff_sold, sold_up, prof26, prof25, diff_prof, prof_up, gp26, gp25, diff_gp, gp_up = row
        is_total = (r_idx == len(cat_rows) - 1)
        font_sz = Pt(9.5) if is_total else Pt(8.5)

        # Col 0: Category Name
        set_cell_formatted(t6.cell(row_num, 0), name, val_size=font_sz, val_bold=is_total, align=PP_ALIGN.LEFT)
        
        # Col 1: Stock Cycle (Flag excess in red/amber)
        cycle_color = COLOR_RED if cycle_warn else (COLOR_DARK if not is_total else COLOR_DARK)
        set_cell_formatted(t6.cell(row_num, 1), cycle, val_size=font_sz, val_bold=(cycle_warn or is_total), val_color=cycle_color)

        # Col 2: Sales Contribution %
        set_cell_formatted(t6.cell(row_num, 2), contrib, val_size=font_sz, val_bold=is_total)

        # Col 3: Net Sold 10/26
        set_cell_formatted(t6.cell(row_num, 3), sold26, val_size=font_sz, val_bold=is_total)

        # Col 4: Net Sold 10/25
        set_cell_formatted(t6.cell(row_num, 4), sold25, val_size=font_sz, val_bold=is_total)

        # Col 5: Diff Sold (Green ▲ / Red ▼)
        diff_sold_col = COLOR_GREEN if sold_up else COLOR_RED
        set_cell_formatted(t6.cell(row_num, 5), diff_sold, val_size=font_sz, val_bold=True, val_color=diff_sold_col)

        # Col 6: Net Profit 10/26
        set_cell_formatted(t6.cell(row_num, 6), prof26, val_size=font_sz, val_bold=is_total)

        # Col 7: Net Profit 10/25
        set_cell_formatted(t6.cell(row_num, 7), prof25, val_size=font_sz, val_bold=is_total)

        # Col 8: Diff Profit (Green ▲ / Red ▼)
        diff_prof_col = COLOR_GREEN if prof_up else COLOR_RED
        set_cell_formatted(t6.cell(row_num, 8), diff_prof, val_size=font_sz, val_bold=True, val_color=diff_prof_col)

        # Col 9: GP% 10/26
        set_cell_formatted(t6.cell(row_num, 9), gp26, val_size=font_sz, val_bold=is_total)

        # Col 10: GP% 10/25
        set_cell_formatted(t6.cell(row_num, 10), gp25, val_size=font_sz, val_bold=is_total)

        # Col 11: Diff GP% (Green ▲ / Red ▼)
        diff_gp_col = COLOR_GREEN if gp_up else COLOR_RED
        set_cell_formatted(t6.cell(row_num, 11), diff_gp, val_size=font_sz, val_bold=True, val_color=diff_gp_col)

    # =========================================================================
    # SLIDE 7: TOP EXPANSION DRIVERS — REFINED EXECUTIVE CARDS & HEADER
    # =========================================================================
    s7 = prs.slides[6]
    set_slide_header(s7.shapes[1], "CATEGORY SALES ANALYSIS (MTD): TOP EXPANSION DRIVERS (WHAT GOES UP & REASONS)",
                     "In-Depth Category Deep Dive — October 2026 vs October 2025")

    supp_spec = [
        ([("Supplements ", Pt(12.5), True, COLOR_DARK_TEXT),
          ("▲ +3.71% YoY", Pt(10.5), True, COLOR_GREEN)], Pt(2)),
        ([("+RM 2,723.59 | RM 76,082.27 Total", Pt(9.5), True, COLOR_SLATE)], Pt(3)),
        ([("Top GP Generator: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Delivered RM 28,112.94 in gross profit (36.95% GP margin), contributing 22.5% of outlet revenue.", Pt(9), False, COLOR_SLATE)], Pt(3)),
        ([("Major Item Gainers:", Pt(9.5), True, COLOR_DARK_TEXT)], Pt(2)),
        ([("• Nutribridge Nutri Alpha 800g: ", Pt(9), False, COLOR_SLATE), ("+RM 5,061.46", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Livemore Neomega Softgel: ", Pt(9), False, COLOR_SLATE), ("+RM 2,885.86", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Axon Arm BP Monitor: ", Pt(9), False, COLOR_SLATE), ("+RM 1,820.00", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Nutribridge Multivit & CoQ10: ", Pt(9), False, COLOR_SLATE), ("+RM 1,675.96", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Nutrixlim Lipofit: ", Pt(9), False, COLOR_SLATE), ("+RM 1,667.01", Pt(9), True, COLOR_GREEN)], Pt(3)),
        ([("Underlying Reason: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Systematic DPOS companion bundling at dispensing counters, attaching metabolic protection supplements to chronic prescriptions.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s7.shapes[2], supp_spec)

    sche_spec = [
        ([("Scheduled Drugs ", Pt(12.5), True, COLOR_DARK_TEXT),
          ("▲ +0.47% YoY", Pt(10.5), True, COLOR_GREEN)], Pt(2)),
        ([("+RM 294.91 | RM 62,679.91 Total", Pt(9.5), True, COLOR_SLATE)], Pt(3)),
        ([("Core Revenue Anchor: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Represents 18.5% of outlet sales with RM 7,483.85 GP, maintaining baseline customer retention.", Pt(9), False, COLOR_SLATE)], Pt(3)),
        ([("Major Item Gainers:", Pt(9.5), True, COLOR_DARK_TEXT)], Pt(2)),
        ([("• Ketosteril 100's: ", Pt(9), False, COLOR_SLATE), ("+RM 3,537.80", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Novartis Entresto 50mg: ", Pt(9), False, COLOR_SLATE), ("+RM 3,227.00", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Breztri Aerosphere: ", Pt(9), False, COLOR_SLATE), ("+RM 1,240.00", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Gracure Geloxib: ", Pt(9), False, COLOR_SLATE), ("+RM 1,090.24", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Novugen Amval: ", Pt(9), False, COLOR_SLATE), ("+RM 1,026.00", Pt(9), True, COLOR_GREEN)], Pt(3)),
        ([("Underlying Reason: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Loyal long-term chronic patient base reinforced by pharmacist prescription review, adherence monitoring, and refill reminders.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s7.shapes[3], sche_spec)

    fnb_spec = [
        ([("Food & Beverage ", Pt(12.5), True, COLOR_DARK_TEXT),
          ("▲ +6.12% YoY", Pt(10.5), True, COLOR_GREEN)], Pt(2)),
        ([("+RM 3,310.51 | RM 57,366.34 Total", Pt(9.5), True, COLOR_SLATE)], Pt(3)),
        ([("High-Margin Nutrition: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Delivered RM 14,218.64 in GP (24.79% GP margin, +22.37% profit YoY) via clinical formula conversions.", Pt(9), False, COLOR_SLATE)], Pt(3)),
        ([("Major Item Gainers:", Pt(9.5), True, COLOR_DARK_TEXT)], Pt(2)),
        ([("• Nutribridge Nutri Alpha 800g: ", Pt(9), False, COLOR_SLATE), ("+RM 5,061.46", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• JH Nutrition Oxxymax: ", Pt(9), False, COLOR_SLATE), ("+RM 4,685.99", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• JH Nutrition U-Solve 4g: ", Pt(9), False, COLOR_SLATE), ("+RM 3,503.00", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Flexsure Gold 850g: ", Pt(9), False, COLOR_SLATE), ("+RM 2,575.26", Pt(9), True, COLOR_GREEN)], Pt(1.5)),
        ([("• Immunz-IgG Colostrum: ", Pt(9), False, COLOR_SLATE), ("+RM 2,570.34", Pt(9), True, COLOR_GREEN)], Pt(3)),
        ([("Underlying Reason: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Active customer migration from low-margin commercial tins to clinically proven House Brand medical nutrition.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s7.shapes[4], fnb_spec)

    # =========================================================================
    # SLIDE 8: PRODUCT DECLINES & COMPETITOR DYNAMICS — REFINED CARDS & HEADER
    # =========================================================================
    s8 = prs.slides[7]
    set_slide_header(s8.shapes[1], "CATEGORY SALES ANALYSIS (MTD): PRODUCT DECLINES & COMPETITOR DYNAMICS (WHAT GOES DOWN & REASONS)",
                     "In-Depth Category Deep Dive — October 2026 vs October 2025", title_size=Pt(14))

    form_spec = [
        ([("Intentional Commercial Formula Decline", Pt(12), True, COLOR_PMG_RED)], Pt(2)),
        ([("Commercial Formula Decliners:", Pt(9.5), True, COLOR_DARK_TEXT)], Pt(2)),
        ([("• Ensure Gold Vanilla 800g: ", Pt(9), False, COLOR_SLATE), ("▼ -RM 2,175.60", Pt(9), True, COLOR_RED)], Pt(1.5)),
        ([("• Ensure Gold Vanilla 850g: ", Pt(9), False, COLOR_SLATE), ("▼ -RM 1,388.94", Pt(9), True, COLOR_RED)], Pt(1.5)),
        ([("• Enercal Complete Vanilla 850g: ", Pt(9), False, COLOR_SLATE), ("▼ -RM 688.80", Pt(9), True, COLOR_RED)], Pt(1.5)),
        ([("• Nutren Gluco Balance 800g: ", Pt(9), False, COLOR_SLATE), ("▼ -RM 310.20", Pt(9), True, COLOR_RED)], Pt(3)),
        ([("Strategic Reason:", Pt(9.5), True, COLOR_DARK_TEXT)], Pt(2)),
        ([("Deliberate and highly profitable customer migration. Commercial adult formulas yield negative or near-zero margins (-3.7% to +3.6% GP). Staff proactively guided price-sensitive consumers to PMG clinical nutrition (Nutri Alpha, Nutrenmax) generating 30–36% GP margin.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s8.shapes[2], form_spec)

    baby_spec = [
        ([("Mom & Baby ", Pt(12.5), True, COLOR_DARK_TEXT),
          ("▼ -33.59% YoY", Pt(10.5), True, COLOR_RED)], Pt(2)),
        ([("-RM 3,640.39 | RM 7,196.59 Total", Pt(9.5), True, COLOR_SLATE)], Pt(3)),
        ([("Category Decliners: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Volume dropped across commercial infant formula tins (Morinaga, Frisolac, S-26) and commodity baby diapers.", Pt(9), False, COLOR_SLATE)], Pt(3)),
        ([("Market Reason: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Aging catchment profile in mature Kota Sentosa and aggressive price-undercutting from mother-and-baby specialty stores.", Pt(9), False, COLOR_SLATE)], Pt(3)),
        ([("Remedial Action: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Reallocate shelf space toward high-margin pediatric wellness (Appeton, Champs, JH Gummy Bears) and skin care (Sudocrem, Cetaphil) maintaining >30% GP.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s8.shapes[3], baby_spec)

    acute_spec = [
        ([("Acute Normalization & Competitor Landscape", Pt(12), True, COLOR_DARK_TEXT)], Pt(2)),
        ([("Acute Dip: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("NON-SCHE (-9.32% YoY) and OTC (-6.69% YoY)", Pt(9.5), True, COLOR_RED)], Pt(3)),
        ([("Acute Normalization: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Normalized against high 2025 seasonal baseline; yet in-house acute lines grew strongly (Biowell Atrizine: RM 3,720.12; Biowell Cough & Cold: RM 1,893.60).", Pt(9), False, COLOR_SLATE)], Pt(3)),
        ([("Competitor Pressure: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Retail pharmacy chains in Kuching ran aggressive loss-leaders on commercial milk and commodity FMCG.", Pt(9), False, COLOR_SLATE)], Pt(3)),
        ([("PMG Counter-Strategy: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Emphasized personalized pharmacist counseling, free health checks, and superior clinical value of PMG House Brand solutions.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s8.shapes[4], acute_spec)

    # =========================================================================
    # SLIDE 9: COMMUNITY OUTREACH — CLEAN PLACEHOLDERS & HEADER
    # =========================================================================
    s9 = prs.slides[8]
    set_slide_header(s9.shapes[1], "COMMUNITY OUTREACH - EVENT SUMMARY",
                     "Health Screening Event & Community Health Engagement")

    outreach_summary_spec = [
        ([("Event Summary & Key Metrics", Pt(12), True, COLOR_DARK_TEXT)], Pt(3)),
        ([("Venue: ", Pt(10), True, COLOR_DARK_TEXT), ("[Insert Event Venue / Location]", Pt(10), False, COLOR_SLATE)], Pt(2)),
        ([("Date: ", Pt(10), True, COLOR_DARK_TEXT), ("[Insert Date Conducted]", Pt(10), False, COLOR_SLATE)], Pt(2)),
        ([("Sales Generated: ", Pt(10), True, COLOR_DARK_TEXT), ("[Insert RM Sales Generated]", Pt(10), False, COLOR_SLATE)], Pt(3)),
        ([("Health Screenings Conducted:", Pt(10), True, COLOR_DARK_TEXT)], Pt(2)),
        ([("• Blood Glucose Tests: [__] participants", Pt(9.5), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Total Cholesterol Tests: [__] participants", Pt(9.5), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Uric Acid Tests: [__] participants", Pt(9.5), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Blood Pressure Checks: [__] participants", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("New Member Registrations: ", Pt(10), True, COLOR_DARK_TEXT), ("[__] members", Pt(10), False, COLOR_SLATE)], Pt(4)),
        ([("[Note: You can drop and resize your outreach photos directly onto this slide]", Pt(8.5), False, COLOR_MUTED_LIGHT)], None)
    ]
    set_card_content(s9.shapes[2], outreach_summary_spec)

    outreach_kiss_spec = [
        ([("KISS Analysis (Keep, Improve, Start, Stop)", Pt(12), True, COLOR_DARK_TEXT)], Pt(4)),
        ([("KEEP: ", Pt(10), True, COLOR_GREEN), ("High community engagement and senior citizen participation in morning hours.", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("IMPROVE: ", Pt(10), True, COLOR_ORANGE), ("On-site sales conversion by preparing pre-packed test strip + clinical nutrition starter kits.", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("START: ", Pt(10), True, COLOR_BLUE), ("Digital registration via PMG Medicare App QR code to capture participant profiles.", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("STOP: ", Pt(10), True, COLOR_RED), ("Screening without follow-up branch return vouchers or chronic refill appointment bookings.", Pt(9.5), False, COLOR_SLATE)], None)
    ]
    set_card_content(s9.shapes[3], outreach_kiss_spec)

    # =========================================================================
    # SLIDE 10: KEY CHALLENGES & OPERATIONAL ISSUES (Fixed Header & Exact Cards)
    # =========================================================================
    s10 = prs.slides[9]
    # Shape 1 is the Header Group!
    set_slide_header(s10.shapes[1], "KEY CHALLENGES & OPERATIONAL ISSUES",
                     "Departmental Bottlenecks & Corrective Action Plans")

    # Shape 2: SCD: SUPPLY CHAIN & WAREHOUSE CRITICAL (Tall Left Card)
    scd_spec = [
        ([("SCD: SUPPLY CHAIN & WAREHOUSE ", Pt(12), True, COLOR_PMG_RED),
          ("CRITICAL", Pt(10), True, COLOR_PMG_RED)], Pt(3)),
        ([("Key Issue", Pt(10), True, COLOR_DARK_TEXT)], Pt(1)),
        ([("SCD sent incorrect stock deliveries to Kota Sentosa, including unrequested bulk cartons of Ensure Gold without store purchase orders.", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("Business Impact", Pt(10), True, COLOR_DARK_TEXT)], Pt(1)),
        ([("Severely congested stock storage, tied up branch working capital, and caused physical clutter on retail floors.", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("Corrective Action Plan (Straightforward Steps)", Pt(10), True, COLOR_PMG_RED)], Pt(2)),
        ([("• Expedite RTV warehouse collection for unrequested Ensure Gold cartons.", Pt(9), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Enforce strict dispatch verification against outlet purchase requests.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s10.shapes[2], scd_spec)

    # Shape 3: MERCHANDISING & RETAIL FLOOR (Top Middle Card)
    merch_spec = [
        ([("MERCHANDISING & RETAIL FLOOR", Pt(11.5), True, COLOR_ORANGE)], Pt(3)),
        ([("Issue", Pt(10), True, COLOR_DARK_TEXT)], Pt(1)),
        ([("Excess stock overflow (diapers, cartons, wheelchairs, commodes) encroached onto walkways and rear emergency exit corridor.", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("Action Required (Straightforward Steps)", Pt(10), True, COLOR_ORANGE)], Pt(2)),
        ([("• Decant excess floor stock and restore 1-meter aisle clearance.", Pt(9), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Reorganize bulky mobility equipment into designated display zones.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s10.shapes[3], merch_spec)

    # Shape 4: JASE & SYSTEMS (Top Right Card)
    jase_spec = [
        ([("JASE & SYSTEMS", Pt(11.5), True, COLOR_BLUE)], Pt(3)),
        ([("Issue", Pt(10), True, COLOR_DARK_TEXT)], Pt(1)),
        ([("Delays in processing credit notes and stock reconciliations for returned warehouse stock.", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("Action Required (Straightforward Steps)", Pt(10), True, COLOR_BLUE)], Pt(2)),
        ([("• Log urgent IT/Ops ticket to accelerate credit note turnaround.", Pt(9), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Standardize inter-branch stock transfer logging on terminal POS.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s10.shapes[4], jase_spec)

    # Shape 5: HR & FLOOR MANPOWER (Bottom Middle Card)
    hr_spec = [
        ([("HR & FLOOR MANPOWER", Pt(11.5), True, COLOR_GREEN)], Pt(3)),
        ([("Issue", Pt(10), True, COLOR_DARK_TEXT)], Pt(1)),
        ([("Dispensing workload surges during peaks; disparity in teammate House Brand contribution (ranging from 28.32% to 53.56%).", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("Action Required (Straightforward Steps)", Pt(10), True, COLOR_GREEN)], Pt(2)),
        ([("• Pair junior dispenser Farizin with senior PA in peak hours.", Pt(9), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Conduct 15-minute daily role-play on House Brand companion scripts.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s10.shapes[5], hr_spec)

    # Shape 6: MARKETING (Bottom Right Card)
    mkt_spec = [
        ([("MARKETING", Pt(11.5), True, COLOR_PURPLE)], Pt(3)),
        ([("Issue", Pt(10), True, COLOR_DARK_TEXT)], Pt(1)),
        ([("Intensified local competitor price wars in Kuching (aggressive flyer discounting by Caring Pharmacy, Guardian, Watsons).", Pt(9.5), False, COLOR_SLATE)], Pt(3)),
        ([("Action Required (Straightforward Steps)", Pt(10), True, COLOR_PURPLE)], Pt(2)),
        ([("• Blast WhatsApp promos for chronic refills and free health checks.", Pt(9), False, COLOR_SLATE)], Pt(1.5)),
        ([("• Mount storefront signage highlighting PMG price & value advantage.", Pt(9), False, COLOR_SLATE)], None)
    ]
    set_card_content(s10.shapes[6], mkt_spec)

    # =========================================================================
    # SLIDE 11: IN-DEPTH SWOT STRATEGIC ANALYSIS (Clean Statements — NO Repetition)
    # =========================================================================
    s11 = prs.slides[10]
    if hasattr(s11.shapes[0], 'left') and s11.shapes[0].left < 2667000:
        diff = 2667000 - s11.shapes[0].left
        s11.shapes[0].left = 2667000
        s11.shapes[0].width -= diff
    set_slide_header(s11.shapes[1], "IN-DEPTH SWOT STRATEGIC ANALYSIS — KOTA SENTOSA",
                     "Strategic Assessment Based on October 2026 Operations & Local Catchment Dynamics")

    # Shape 2: S - STRENGTHS (Top Left)
    swot_s_spec = [
        ([("S - STRENGTHS", Pt(13), True, COLOR_GREEN)], Pt(5)),
        ([("• Core House Brand Loyalty: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("High patient trust and proactive counter companion attachment deliver resilient gross profit margins.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Chronic Care Stronghold: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Established 7th Mile suburban community base provides dependable recurring prescription refill volume.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Clinical Authority & Service: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Personalized pharmacist consultations establish competitive differentiation that FMCG retailers cannot match.", Pt(10), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s11.shapes[2], swot_s_spec)

    # Shape 3: W - WEAKNESSES (Top Right)
    swot_w_spec = [
        ([("W - WEAKNESSES", Pt(13), True, COLOR_RED)], Pt(5)),
        ([("• Inventory Holding & Floor Clutter: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Stock cycle exceeding target creates storage congestion and walkway obstruction in retail areas.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Dispensary Upselling Disparity: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Significant performance gap between senior and junior staff in routine companion attachment.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Outreach Monetization Deficit: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Health screening events achieve high community turnout but lack structured on-site conversion to sales.", Pt(10), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s11.shapes[3], swot_w_spec)

    # Shape 4: O - OPPORTUNITIES (Bottom Left)
    swot_o_spec = [
        ([("O - OPPORTUNITIES", Pt(13), True, COLOR_BLUE)], Pt(5)),
        ([("• Structured Chronic Refill Retention: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Deploy advance WhatsApp refill reminders 3–5 days prior to prescription exhaustion to lock in monthly revenue.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Standardized Companion Bundling: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Train junior dispensers with proven scripts pairing regular chronic refills with metabolic wellness lines.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Institutional Eldercare Partnerships: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Channel adult nutrition and clinical mobility equipment into supply agreements with local nursing homes.", Pt(10), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s11.shapes[4], swot_o_spec)

    # Shape 5: T - THREATS (Bottom Right)
    swot_t_spec = [
        ([("T - THREATS", Pt(13), True, COLOR_ORANGE)], Pt(5)),
        ([("• Aggressive Chain Price Wars: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Retail pharmacy chains aggressively discounting commercial adult formulas and FMCG lines as loss-leaders.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Supply Chain Dispatch Misallocations: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Central warehouse sending unrequested bulk stock, tying up working capital and branch floor capacity.", Pt(10), False, COLOR_MUTED_TEXT)], Pt(4)),
        ([("• Living Cost Pressures: ", Pt(10.5), True, COLOR_DARK_TEXT),
          ("Economic inflation leading price-conscious shoppers to cut back on discretionary preventive healthcare purchases.", Pt(10), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s11.shapes[5], swot_t_spec)

    # =========================================================================
    # SLIDE 12: KEY INITIATIVES DONE IN FY2026 (Endpoint Format & Compact Layout)
    # =========================================================================
    s12 = prs.slides[11]
    # Header Title (Shape 1) and Subtitle (Shape 2)
    tf12_1 = s12.shapes[1].text_frame
    tf12_1.text = ''
    p12_1 = tf12_1.paragraphs[0]
    r12_1 = p12_1.add_run()
    r12_1.text = "KEY INITIATIVES DONE IN FY2026"
    r12_1.font.name = 'Arial'
    r12_1.font.size = Pt(15)
    r12_1.font.bold = True
    r12_1.font.color.rgb = COLOR_PMG_RED

    tf12_2 = s12.shapes[2].text_frame
    tf12_2.text = ''
    p12_2 = tf12_2.paragraphs[0]
    r12_2 = p12_2.add_run()
    r12_2.text = "Operational & Strategic Milestones Executed at PMG Pharmacy Kota Sentosa"
    r12_2.font.name = 'Arial'
    r12_2.font.size = Pt(11)
    r12_2.font.bold = True
    r12_2.font.color.rgb = COLOR_SLATE

    # Six Initiatives (Shapes 3 to 8)
    init_01_spec = [
        ([("INITIATIVE 01", Pt(9.5), True, COLOR_BLUE)], Pt(2)),
        ([("Floor DPOS Coaching & Companion Attachment", Pt(10.5), True, COLOR_DARK_TEXT)], Pt(3)),
        ([("Action: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Instituted weekly role-plays for dispensers to attach companion wellness lines during chronic refills.", Pt(9), False, COLOR_MUTED_TEXT)], Pt(2.5)),
        ([("Endpoint: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Drive sustainable House Brand sales expansion and lift dispensary transaction basket size.", Pt(9), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s12.shapes[3], init_01_spec)

    init_02_spec = [
        ([("INITIATIVE 02", Pt(9.5), True, COLOR_BLUE)], Pt(2)),
        ([("Chronic Disease Management & Refill Retention", Pt(10.5), True, COLOR_DARK_TEXT)], Pt(3)),
        ([("Action: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Implemented structured counseling and proactive WhatsApp refill tracking for chronic patients.", Pt(9), False, COLOR_MUTED_TEXT)], Pt(2.5)),
        ([("Endpoint: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Lock in long-term patient loyalty and safeguard recurring scheduled drug prescription revenue.", Pt(9), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s12.shapes[4], init_02_spec)

    init_03_spec = [
        ([("INITIATIVE 03", Pt(9.5), True, COLOR_GREEN)], Pt(2)),
        ([("Clinical Nutrition Migration Strategy", Pt(10.5), True, COLOR_DARK_TEXT)], Pt(3)),
        ([("Action: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Guided consumers from commercial formulas to PMG clinical nutrition (Nutri Alpha, Flexsure Gold).", Pt(9), False, COLOR_MUTED_TEXT)], Pt(2.5)),
        ([("Endpoint: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Protect outlet gross profit margins against aggressive competitor FMCG price-slashing.", Pt(9), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s12.shapes[5], init_03_spec)

    init_04_spec = [
        ([("INITIATIVE 04", Pt(9.5), True, COLOR_ORANGE)], Pt(2)),
        ([("Community Health Outreach & Checkpoints", Pt(10.5), True, COLOR_DARK_TEXT)], Pt(3)),
        ([("Action: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Organized neighborhood screenings offering free glucose, cholesterol, and blood pressure checks.", Pt(9), False, COLOR_MUTED_TEXT)], Pt(2.5)),
        ([("Endpoint: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Build grassroots community presence, uncover chronic cases, and drive new dispensary footfall.", Pt(9), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s12.shapes[6], init_04_spec)

    init_05_spec = [
        ([("INITIATIVE 05", Pt(9.5), True, COLOR_PURPLE)], Pt(2)),
        ([("Advanced Digital Health Screening (TCM AI & AirDoc)", Pt(10.5), True, COLOR_DARK_TEXT)], Pt(3)),
        ([("Action: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Deployed non-invasive TCM AI facial/tongue sensors and AirDoc retinal scanning in consultation room.", Pt(9), False, COLOR_MUTED_TEXT)], Pt(2.5)),
        ([("Endpoint: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Establish high clinical authority and empower early cardiovascular and metabolic risk detection.", Pt(9), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s12.shapes[7], init_05_spec)

    init_06_spec = [
        ([("INITIATIVE 06", Pt(9.5), True, COLOR_INDIGO)], Pt(2)),
        ([("Home Healthcare & Mobility Solutions Hub", Pt(10.5), True, COLOR_DARK_TEXT)], Pt(3)),
        ([("Action: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Expanded clinical eldercare offerings (hospital bed rentals, wheelchairs, ripple mattresses).", Pt(9), False, COLOR_MUTED_TEXT)], Pt(2.5)),
        ([("Endpoint: ", Pt(9.5), True, COLOR_DARK_TEXT),
          ("Position Kota Sentosa as the premier home nursing and rehabilitation hub in the suburban district.", Pt(9), False, COLOR_MUTED_TEXT)], None)
    ]
    set_card_content(s12.shapes[8], init_06_spec)

    # =========================================================================
    # SLIDE 13: RETAIL STORE WALKTHROUGH VIDEO (No Data Placeholder)
    # =========================================================================
    s13 = prs.slides[12]
    set_slide_header(s13.shapes[0], "RETAIL STORE WALKTHROUGH VIDEO",
                     "Outlet Operational Compliance & Floor Standards Review — October 2026")

    # Slide 13: Left Card - Title Header Box (s13.shapes[1].shapes[2])
    tf13_left_title = s13.shapes[1].shapes[2].text_frame
    tf13_left_title.text = ''
    p_lt0 = tf13_left_title.paragraphs[0]
    p_lt0.space_after = Pt(2)
    r_lt0 = p_lt0.add_run()
    r_lt0.text = "WALKTHROUGH RECORDING"
    r_lt0.font.name = 'Arial'
    r_lt0.font.size = Pt(12)
    r_lt0.font.bold = True
    r_lt0.font.color.rgb = COLOR_DARK_TEXT
    
    p_lt1 = tf13_left_title.add_paragraph()
    r_lt1 = p_lt1.add_run()
    r_lt1.text = "Status: Video Audit Paused for October 2026 (Pending Monthly Upload)"
    r_lt1.font.name = 'Arial'
    r_lt1.font.size = Pt(9.5)
    r_lt1.font.italic = True
    r_lt1.font.color.rgb = COLOR_RED

    # Slide 13: Left Card - Bottom Metadata Card (s13.shapes[1].shapes[4].shapes[1])
    tf13_meta = s13.shapes[1].shapes[4].shapes[1].text_frame
    tf13_meta.text = ''
    meta_items = [
        [("Location: ", Pt(9.5), True, COLOR_DARK_TEXT), ("PMG Pharmacy Kota Sentosa", Pt(9.5), False, COLOR_SLATE)],
        [("Audit Cycle: ", Pt(9.5), True, COLOR_DARK_TEXT), ("October 2026 (Video Not Conducted)", Pt(9.5), False, COLOR_RED)],
        [("Next Scheduled Audit: ", Pt(9.5), True, COLOR_DARK_TEXT), ("November 2026 Walkthrough", Pt(9.5), False, COLOR_SLATE)],
        [("System Status: ", Pt(9.5), True, COLOR_DARK_TEXT), ("⚠️ Upload Pending — Alert Active for Next Cycle", Pt(9.5), True, COLOR_AMBER)]
    ]
    for m_idx, m_runs in enumerate(meta_items):
        mp = tf13_meta.paragraphs[0] if m_idx == 0 else tf13_meta.add_paragraph()
        mp.space_after = Pt(1.5)
        for m_txt, m_sz, m_bld, m_col in m_runs:
            mr = mp.add_run()
            mr.text = m_txt
            mr.font.name = 'Arial'
            mr.font.size = m_sz
            mr.font.bold = m_bld
            mr.font.color.rgb = m_col

    # Slide 13: Right Card - Header Title Box (s13.shapes[2].shapes[2])
    tf13_right_title = s13.shapes[2].shapes[2].text_frame
    tf13_right_title.text = ''
    p_rt0 = tf13_right_title.paragraphs[0]
    p_rt0.space_after = Pt(2)
    r_rt0 = p_rt0.add_run()
    r_rt0.text = "WALKTHROUGH SCOPE & SEQUENCE"
    r_rt0.font.name = 'Arial'
    r_rt0.font.size = Pt(12)
    r_rt0.font.bold = True
    r_rt0.font.color.rgb = COLOR_DARK_TEXT

    p_rt1 = tf13_right_title.add_paragraph()
    r_rt1 = p_rt1.add_run()
    r_rt1.text = "Standard 5-Zone Store Operational Audit Checklist"
    r_rt1.font.name = 'Arial'
    r_rt1.font.size = Pt(9.5)
    r_rt1.font.color.rgb = COLOR_SLATE

    # Slide 13: Right Card - 5 Timeline Milestone Text Boxes (s13.shapes[2].shapes[3].shapes[7..11])
    timeline_grp = s13.shapes[2].shapes[3]
    timeline_data = [
        (7, "0:00 - 0:08 Entrance & Ceiling Displays",
         "Promotional banners, ceiling signage, entrance gondola facing [Audit Pending]"),
        (8, "0:09 - 0:18 Supplement & FMCG Gondolas",
         "Shelf talkers, wobblers, eye-level House Brand placement [Audit Pending]"),
        (9, "0:19 - 0:28 Rear Walkway & Stock Staging Area",
         "Emergency walkway clearance, stock cart stowing, adult diapers [Audit Pending]"),
        (10, "0:29 - 0:42 Personal Care & Mobility Displays",
         "Cosmetic shelves, rehabilitation wheelchairs & walking aids [Audit Pending]"),
        (11, "0:43 - 0:53 Prescription Dispensary & Cashier Counter",
         "Glass medicine cabinets, consultation area, clean-counter SOP [Audit Pending]")
    ]
    for sh_idx, t_title, t_desc in timeline_data:
        tb = timeline_grp.shapes[sh_idx].text_frame
        tb.text = ''
        p0 = tb.paragraphs[0]
        p0.space_after = Pt(1.5)
        r0 = p0.add_run()
        r0.text = t_title
        r0.font.name = 'Arial'
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK_TEXT

        p1 = tb.add_paragraph()
        r1 = p1.add_run()
        r1.text = t_desc
        r1.font.name = 'Arial'
        r1.font.size = Pt(9)
        r1.font.color.rgb = COLOR_SLATE

    # =========================================================================
    # SLIDE 14: RETAIL STORE WALKTHROUGH FINDINGS (Pending Video Audit Placeholder)
    # =========================================================================
    s14 = prs.slides[13]
    set_slide_header(s14.shapes[0], "RETAIL STORE WALKTHROUGH FINDINGS",
                     "Store Standards vs. Branch Compliance Audit Checklist — October 2026 (Audit Pending)")

    pillars = [
        ("PILLAR 01", "Gondola & Shelf Tidiness", "Resume daily morning shelf-facing SOP and verify alignment in upcoming video audit.", 1),
        ("PILLAR 02", "Cleanliness – Floor & Fixtures", "Enforce strict 'clear customer seating' rule; maintain swept retail floor and stow packaging.", 2),
        ("PILLAR 03", "Merchandising & Planogram", "Ensure prime eye-level shelf space is dedicated to high-margin House Brands (Nutri Alpha, Flexsure Gold, Oxxymax).", 3),
        ("PILLAR 04", "Pricing & Signage Accuracy", "Conduct weekly price tag audits to synchronize shelf wobblers with monthly campaign rotations.", 4),
        ("PILLAR 05", "Stock Obstruction & Safety", "Enforce immediate clearance of emergency exit corridors; return unrequested bulk stock to SCD.", 5),
        ("PILLAR 06", "Staff Grooming & SOP", "Continue reinforcing official PMG red polo uniform compliance and proactive DPOS greeting at dispensary.", 6)
    ]
    for pil_code, pil_name, pil_action, g_idx in pillars:
        if g_idx < len(s14.shapes):
            pil_spec = [
                ([(pil_code, Pt(9.5), True, COLOR_SLATE)], Pt(1)),
                ([(pil_name, Pt(11), True, COLOR_DARK_TEXT)], Pt(2)),
                ([("PENDING VIDEO AUDIT", Pt(9), True, COLOR_AMBER)], Pt(2)),
                ([("Findings: ", Pt(9), True, COLOR_DARK_TEXT), ("Video audit not conducted for October 2026.", Pt(9), False, COLOR_SLATE)], Pt(2)),
                ([("Action Plan: ", Pt(9), True, COLOR_DARK_TEXT), (pil_action, Pt(9), False, COLOR_SLATE)], None)
            ]
            set_card_content(s14.shapes[g_idx], pil_spec)

    # =========================================================================
    # SLIDE 15: THANK YOU & KEY STRATEGIC COMMITMENTS
    # =========================================================================
    s15 = prs.slides[14]
    set_slide_header(s15.shapes[0], "THANK YOU & OPEN DISCUSSION",
                     "PMG PHARMACY KOTA SENTOSA — MONTHLY PHARMACIST PRESENTATION — NOVEMBER 2026")

    # Presenter card (Group 1)
    grp15_1 = s15.shapes[1]
    for gs in grp15_1.shapes:
        if gs.has_text_frame and '01 October 2026' in gs.text_frame.text:
            gs.text_frame.text = gs.text_frame.text.replace('01 October 2026', '01 November 2026')
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    # Slide 15: Commitments Header Title Box (s15.shapes[2].shapes[2])
    tf15_title = s15.shapes[2].shapes[2].text_frame
    tf15_title.text = ''
    p15_t0 = tf15_title.paragraphs[0]
    p15_t0.space_after = Pt(2)
    r15_t0 = p15_t0.add_run()
    r15_t0.text = "KEY STRATEGIC COMMITMENTS"
    r15_t0.font.name = 'Arial'
    r15_t0.font.size = Pt(13)
    r15_t0.font.bold = True
    r15_t0.font.color.rgb = COLOR_PMG_RED

    p15_t1 = tf15_title.add_paragraph()
    r15_t1 = p15_t1.add_run()
    r15_t1.text = "Focus Areas & Execution Targets for November 2026"
    r15_t1.font.name = 'Arial'
    r15_t1.font.size = Pt(10.5)
    r15_t1.font.bold = True
    r15_t1.font.color.rgb = COLOR_SLATE

    # Slide 15: Four Individual Commitment Card Text Boxes (s15.shapes[2].shapes[3..6].shapes[2])
    commitments_data = [
        (3, "Elevate House Brand Share: ",
         "Target >45% branch HB contribution through weekly 15-minute DPOS companion bundling role-plays with junior dispensary assistants (Farizin & Nurhafizah)."),
        (4, "Accelerate Stock Cycle Rationalization: ",
         "Reduce outlet stock cycle from 2.47 months toward the 2.0 HQ target by clearing excess inventory and expediting warehouse RTV on unrequested bulk stock."),
        (5, "Strengthen Chronic Disease Refill Retention: ",
         "Deploy proactive WhatsApp refill tracking and personalized counseling 3–5 days prior to prescription completion to safeguard Scheduled Drug loyalty."),
        (6, "Enforce Floor 5S Standards & Walkthrough Compliance: ",
         "Resume monthly 5S video audit next month, enforce morning shelf-facing SOPs, and maintain completely clear emergency exit corridors.")
    ]
    for grp_idx, c_title, c_desc in commitments_data:
        tb = s15.shapes[2].shapes[grp_idx].shapes[2].text_frame
        tb.text = ''
        p = tb.paragraphs[0]
        r_head = p.add_run()
        r_head.text = c_title
        r_head.font.name = 'Arial'
        r_head.font.size = Pt(10)
        r_head.font.bold = True
        r_head.font.color.rgb = COLOR_DARK_TEXT

        r_body = p.add_run()
        r_body.text = c_desc
        r_body.font.name = 'Arial'
        r_body.font.size = Pt(9.5)
        r_body.font.color.rgb = COLOR_MUTED_TEXT

    # =========================================================================
    # DEDICATED COACHING & RECOMMENDATIONS SLIDE (INSERT AT INDEX 5 -> SLIDE 6)
    # =========================================================================
    create_coaching_slide(prs)

    # Save presentation
    print(f"Saving updated presentation to: {output_path}")
    prs.save(output_path)
    print("SUCCESS: Presentation successfully generated!")

if __name__ == '__main__':
    base_dir = r"c:\Users\User\Documents\PMG MANAGEMENT HUB"
    template_path = os.path.join(base_dir, "templates", "pmg_monthly_presentation_template.pptx")
    sample_data_path = os.path.join(base_dir, "performance", "sample-data.js")
    output_local = os.path.join(base_dir, "Kota_Sentosa_October_2026_Official.pptx")
    output_perf = os.path.join(base_dir, "performance", "Kota_Sentosa_October_2026_Official.pptx")
    onedrive_dir = r"C:\Users\User\OneDrive - Public Medicare Group Sdn Bhd\William (Pharmacist)\Patient care\KOTA SENTOSA\Full October 2026"
    output_onedrive = os.path.join(onedrive_dir, "Kota_Sentosa_October_2026_Official.pptx") if os.path.exists(onedrive_dir) else None

    # Load data
    with open(sample_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
    start = content.find('{')
    end = content.rfind('}') + 1
    data = json.loads(content[start:end])

    update_presentation(template_path, data, output_local)
    shutil.copy2(output_local, output_perf)
    print(f"Copied to performance folder: {output_perf}")

    if output_onedrive:
        shutil.copy2(output_local, output_onedrive)
        print(f"Copied to OneDrive: {output_onedrive}")
