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

# Color Palette
COLOR_GREEN = RGBColor(22, 163, 74)   # #16A34A - Positive growth / MoM improvement
COLOR_RED   = RGBColor(220, 38, 38)  # #DC2626 - Decline / underperforming
COLOR_AMBER = RGBColor(217, 119, 6)   # #D97706 - Warning / attention
COLOR_DARK  = RGBColor(30, 41, 59)    # #1E293B - Neutral text
COLOR_WHITE = RGBColor(255, 255, 255) # #FFFFFF - Header text

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
    # SLIDE 5: TEAMMATES - STAFF & PHARMACISTS + COACHING
    # =========================================================================
    s5 = prs.slides[4]
    t5 = s5.shapes[1].table

    # Row 0: Headers
    set_cell_header(t5.cell(0, 0), 'TEAMMATES', font_size=Pt(11))
    set_cell_header(t5.cell(0, 1), 'Christina Lee [PRP]', font_size=Pt(11))
    set_cell_header(t5.cell(0, 4), 'Kenix Ling [Pharmacist]', font_size=Pt(11))

    # Row 1: Months
    subheaders_s5 = ['', 'Aug', 'Sept', 'Oct', 'Aug', 'Sept', 'Oct']
    for c_idx, sh in enumerate(subheaders_s5):
        if c_idx > 0:
            set_cell_header(t5.cell(1, c_idx), sh, font_size=Pt(10.5))

    # Row 2: Total Sales
    set_cell_formatted(t5.cell(2, 0), 'Total Sales', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(2, 1), '— (New)', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(2, 2), '— (New)', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(2, 3), '34,887.97', '★ Strong Start', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t5.cell(2, 4), '30,321.83', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(2, 5), '22,669.41', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(2, 6), '33,851.04', '▲ +49.3%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 3: HB Sales (%)
    set_cell_formatted(t5.cell(3, 0), 'HB Sales (%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(3, 1), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(3, 2), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(3, 3), '15,084.64', '▲ 43.24%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t5.cell(3, 4), '13,782.70', '(45.45%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t5.cell(3, 5), '10,073.31', '(44.44%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t5.cell(3, 6), '18,132.18', '▲ 53.56%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 4: HM sales (%)
    set_cell_formatted(t5.cell(4, 0), 'HM sales (%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(4, 1), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(4, 2), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(4, 3), '2,744.90', '(7.87%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    set_cell_formatted(t5.cell(4, 4), '4,002.90', '(13.20%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t5.cell(4, 5), '2,654.30', '(11.71%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t5.cell(4, 6), '3,658.70', '(10.81%)', val_size=Pt(11), val_bold=True, sub_size=Pt(9.5), sub_bold=True)

    # Row 5: No of Transactions
    set_cell_formatted(t5.cell(5, 0), 'No of Transactions', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(5, 1), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(5, 2), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(5, 3), '918', val_size=Pt(11), val_bold=True)

    set_cell_formatted(t5.cell(5, 4), '676', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(5, 5), '611', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(5, 6), '757', '▲ +146 Tx', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 6: Basket Size (TS)
    set_cell_formatted(t5.cell(6, 0), 'Basket Size (TS)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(6, 1), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(6, 2), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(6, 3), '38.00', val_size=Pt(11), val_bold=True)

    set_cell_formatted(t5.cell(6, 4), '44.85', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(6, 5), '37.10', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(6, 6), '44.72', '▲ +RM 7.62', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 7: Basket Size (HB)
    set_cell_formatted(t5.cell(7, 0), 'Basket Size (HB)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(7, 1), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(7, 2), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(7, 3), '16.43', val_size=Pt(11), val_bold=True)

    set_cell_formatted(t5.cell(7, 4), '20.39', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(7, 5), '16.49', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(7, 6), '23.95', '▲ +RM 7.46', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9), sub_bold=True, sub_color=COLOR_GREEN)

    # Row 8: GPRM (%)
    set_cell_formatted(t5.cell(8, 0), 'GPRM(%)', val_size=Pt(10.5), val_bold=True, align=PP_ALIGN.LEFT)
    set_cell_formatted(t5.cell(8, 1), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(8, 2), '—', val_size=Pt(10.5))
    set_cell_formatted(t5.cell(8, 3), '9,980.79', '▲ 28.61%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    set_cell_formatted(t5.cell(8, 4), '9,335.79', '(30.79%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t5.cell(8, 5), '6,538.08', '(28.78%)', val_size=Pt(10.5), sub_size=Pt(9))
    set_cell_formatted(t5.cell(8, 6), '10,713.88', '▲ 31.65%', val_size=Pt(11), val_bold=True, val_color=COLOR_GREEN, sub_size=Pt(9.5), sub_bold=True, sub_color=COLOR_GREEN)

    # Slide 5: Coaching Group (Right side) — Enlarged Typography
    grp5 = s5.shapes[2]
    coaching_text = (
        "COACHING & RECOMMENDATIONS\n"
        "FIND OUT LOW-PERFORMING TEAMMATES & TAILORED RECOVERY ACTION\n\n"
        "⚠️ Jong Pei Choo [PA] — 3M TS Drop (-26.0%)\n"
        "Trajectory: Aug RM 77.9k ➔ Sep RM 68.1k ➔ Oct RM 57.6k (HB 47.2% | GP 26.9%).\n"
        "Coaching: 1-on-1 session with PIC William to review counter companion scripts, set weekly RM 7k HB quota, and advise on footfall conversion.\n\n"
        "⚠️ Muhammad Nur Farizin [PA] — Low HB Share (28.32%)\n"
        "Trajectory: Aug RM 30.9k ➔ Sep RM 38.9k ➔ Oct RM 32.3k (HB Basket: RM 9.09).\n"
        "Coaching: Pair with senior dispenser for structured DPOS role-playing; enforce daily minimum RM 450+ House Brand attachment at dispensing.\n\n"
        "⚠️ Haniesha Louna [ABM] — 3M TS Contraction (-28.0%)\n"
        "Trajectory: Aug RM 46.3k ➔ Sep RM 33.1k ➔ Oct RM 33.3k (HB 40.0% | GP 25.6%).\n"
        "Coaching: Cease unattached low-margin milk checkout; cross-sell high-margin wellness supplements (35%+ GP) to lift GP margin >27.5%.\n\n"
        "⚠️ Fiona Fiena [PA] — 3M TS Drop (-28.7%)\n"
        "Trajectory: Aug RM 46.0k ➔ Sep RM 38.7k ➔ Oct RM 32.8k (Tx: 870).\n"
        "Coaching: Assign front greeting duty during 7th Mile wet market morning peak (7:30–10:30 AM); target ≥32 transactions/day.\n\n"
        "⭐ Christina Lee [PRP] & Ting Kwang Yu [Lead] — Benchmark Highlights\n"
        "Christina delivered RM 34.9k TS (43.2% HB, 28.6% GP, 918 Tx). Ting achieved 52.5% HB share."
    )
    for gs in grp5.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = coaching_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'
                p.font.size = Pt(9.5)

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
    # SLIDE 7: TOP EXPANSION DRIVERS
    # =========================================================================
    s7 = prs.slides[6]
    for shape in s7.shapes:
        if shape.has_text_frame and 'September' in shape.text_frame.text:
            shape.text_frame.text = shape.text_frame.text.replace('September 2026 vs September 2025', 'October 2026 vs October 2025')
            for p in shape.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp7_2 = s7.shapes[2]
    supp_text = (
        "Supplements +3.71% YoY\n"
        "+RM 2,723.59 | RM 76,082.27 Total\n"
        "Top GP Generator: Contributed RM 28,112.94 in gross profit (36.95% GP margin), accounting for 22.5% of outlet revenue.\n"
        "Major Item Gainers:\n"
        "• Nutribridge Nutri Alpha 800gm (F&B): +RM 5,061.46 YoY (GP 22.28%)\n"
        "• Livemore Neomega Softgel 60's x2: +RM 2,885.86 YoY (GP 30.35%)\n"
        "• Axon Arm BP Monitor (Elderly): +RM 1,820.00 YoY (GP 44.62%)\n"
        "• Nutribridge Multivit & CoQ10 60's: +RM 1,675.96 YoY (GP 29.53%)\n"
        "• Nutrixlim Lipofit 10g x 14's: +RM 1,667.01 YoY (GP 27.14%)\n"
        "Underlying Reason: Systematic DPOS companion bundling at dispensing counters, attaching metabolic and vascular protection supplements to regular chronic prescriptions."
    )
    for gs in grp7_2.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = supp_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp7_3 = s7.shapes[3]
    sche_text = (
        "Scheduled Drugs +0.47% YoY\n"
        "+RM 294.91 | RM 62,679.91 Total\n"
        "Core Revenue Anchor: Represents 18.5% of total outlet sales with RM 7,483.85 GP.\n"
        "Major Item Gainers:\n"
        "• Novartis Entresto 50mg: +RM 3,227.00 YoY\n"
        "• Ketosteril 100's: +RM 3,537.80 YoY\n"
        "• Breztri Aerosphere: +RM 1,240.00 YoY\n"
        "• Novugen Amval: +RM 1,026.00 YoY\n"
        "• Gracure Geloxib: +RM 1,090.24 YoY\n"
        "Underlying Reason: Loyal long-term chronic patient base in 7th Mile Kota Sentosa, reinforced by pharmacist prescription review, adherence monitoring, and refill reminder services."
    )
    for gs in grp7_3.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = sche_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp7_4 = s7.shapes[4]
    fnb_text = (
        "Food & Beverage +6.12% YoY\n"
        "+RM 3,310.51 | RM 57,366.34 Total\n"
        "High-Margin Nutrition: Delivered RM 14,218.64 in GP (24.79% GP margin, +22.37% profit YoY).\n"
        "Major Item Gainers:\n"
        "• Nutribridge Nutri Alpha 800g: +RM 5,061.46 YoY (GP 22.28%)\n"
        "• Flexsure Gold 850g: +RM 2,575.26 YoY\n"
        "• JH Nutrition Oxxymax: +RM 4,685.99 YoY\n"
        "• JH Nutrition U-Solve 4g: +RM 3,503.00 YoY\n"
        "• Immunz-IgG Colostrum: +RM 2,570.34 YoY\n"
        "Underlying Reason: Floor strategy migrating price-conscious patients from commercial adult formulas to higher-margin, clinically proven House Brand medical nutrition."
    )
    for gs in grp7_4.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = fnb_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 8: PRODUCT DECLINES & COMPETITOR DYNAMICS
    # =========================================================================
    s8 = prs.slides[7]
    for shape in s8.shapes:
        if shape.has_text_frame and 'September' in shape.text_frame.text:
            shape.text_frame.text = shape.text_frame.text.replace('September 2026 vs September 2025', 'October 2026 vs October 2025')
            for p in shape.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp8_2 = s8.shapes[2]
    decl_form_text = (
        "Intentional Decline in Low-Margin Commercial Formulas\n"
        "Commercial Formula Decliners:\n"
        "• Ensure Gold Vanilla 850g: -RM 1,388.94 YoY (RM 2,935.56 vs RM 4,324.50 in LY)\n"
        "• Ensure Gold Vanilla 800g: -RM 2,175.60 YoY\n"
        "• Enercal Complete Vanilla 850g: -RM 688.80 YoY (RM 539.00 vs RM 1,227.80)\n"
        "• Nutren Gluco Balance 800g: -RM 310.20 YoY (RM 103.80 vs RM 414.00)\n"
        "Strategic Reason:\n"
        "Deliberate and highly profitable customer migration. Commercial adult formulas yield negative or near-zero margins (Ensure Gold at -3.70% to 3.63% GP margin). Staff actively guided price-sensitive chronic consumers toward PMG clinical nutrition (Nutri Alpha, Nutrenmax, Alpha Gold) generating 30–36% GP margin, preserving outlet profitability."
    )
    for gs in grp8_2.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = decl_form_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp8_3 = s8.shapes[3]
    decl_baby_text = (
        "Mom & Baby -33.59% YoY\n"
        "-RM 3,640.39 | RM 7,196.59 Total\n"
        "Category Decliners: Volume dropped across commercial infant formula tins (Morinaga, Frisolac, S-26) and commodity baby diapers.\n"
        "Market Reason: Catchment demographics (aging community profile in mature Kota Sentosa) and fierce price-undercutting from mother-and-baby specialty shops and hypermarkets.\n"
        "Strategic Remedial Action: Reallocate shelf space toward premium pediatric wellness lines (Appeton, Champs, JH Gummy Bears, Kiddypops) and pediatric skin dermatologicals (Sudocrem, Cetaphil, Bzu Bzu, BBZine Cream) which maintain >30% GP."
    )
    for gs in grp8_3.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = decl_baby_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp8_4 = s8.shapes[4]
    decl_acute_text = (
        "Acute Normalization & Competitor Landscape\n"
        "Acute Categories: NON-SCHE (-9.32% YoY) and OTC (-6.69% YoY) normalized against high 2025 seasonal baseline; yet in-house acute lines grew strongly (Biowell Atrizine: RM 3,720.12; Biowell Cough & Cold: RM 1,893.60).\n"
        "Competitor Pressure: Retail pharmacy chains (Caring, Watsons, Guardian) in Kuching ran aggressive promotional loss-leaders on commercial milk and FMCG.\n"
        "PMG Counter-Strategy: Focused on personalized pharmacist counseling, free health checks, and superior clinical value of PMG House Brand healthcare solutions."
    )
    for gs in grp8_4.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = decl_acute_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 9: COMMUNITY OUTREACH (Clean Placeholders)
    # =========================================================================
    s9 = prs.slides[8]
    for shape in s9.shapes:
        if shape.has_text_frame and 'COMMUNITY OUTREACH' in shape.text_frame.text:
            shape.text_frame.text = 'COMMUNITY OUTREACH - EVENT SUMMARY\nHealth Screening Event & Community Health Engagement'
            for p in shape.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp9_2 = s9.shapes[2]
    outreach_summary_text = (
        "Event Summary & Key Metrics\n"
        "Venue: [Insert Event Venue / Location]\n"
        "Date: [Insert Date Conducted]\n"
        "Sales Generated: [Insert RM Sales Generated]\n"
        "Health Screenings Conducted:\n"
        "• Blood Glucose Tests: [__] participants\n"
        "• Total Cholesterol Tests: [__] participants\n"
        "• Uric Acid Tests: [__] participants\n"
        "• Blood Pressure Checks: [__] participants\n"
        "New Member Registrations: [__] members\n"
        "[Note: You can drop and resize your outreach photos directly onto this slide]"
    )
    for gs in grp9_2.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = outreach_summary_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp9_3 = s9.shapes[3]
    outreach_kiss_text = (
        "KISS Analysis (Keep, Improve, Start, Stop)\n"
        "KEEP: [Insert positive factors to maintain — e.g. High community engagement, senior citizen participation]\n"
        "IMPROVE: [Insert conversion & bundling improvements — e.g. Prepare on-site test strip + nutrition starter packs]\n"
        "START: [Insert new digital or screening initiatives — e.g. PMG Medicare App QR code digital registration]\n"
        "STOP: [Insert unmonetized practices — e.g. Screening without follow-up branch return vouchers]"
    )
    for gs in grp9_3.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = outreach_kiss_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 10: KEY CHALLENGES & OPERATIONAL ISSUES
    # =========================================================================
    s10 = prs.slides[9]
    challenges = [
        ("SCD: SUPPLY CHAIN & WAREHOUSE CRITICAL\nKey Issue\nSCD sent incorrect stock deliveries to Kota Sentosa, including unrequested bulk cartons without store purchase orders.\nBusiness Impact\nSeverely congested stock storage, tied up branch working capital, and caused physical clutter on retail floors.\nCorrective Action Plan\nAccelerate return-to-vendor (RTV) warehouse collection and establish strict dispatch verification against outlet purchase requests.", 1),
        ("MERCHANDISING & RETAIL FLOOR\nIssue\nExcess stock overflow (diapers, cartons, wheelchairs, commodes) encroached onto walkways and rear exit.\nAction Required\nImmediate floor decanting; establish clear designated display zones for rehabilitation equipment without compromising customer aisles.", 2),
        ("JASE & SYSTEMS\nIssue\nDelays in processing credit notes and stock reconciliations for returned warehouse stock.\nAction Required\nWork with IT/Operations to streamline inter-branch stock transfers and RTV status tracking.", 3),
        ("HR & FLOOR MANPOWER\nIssue\nDispensing workload surges during peaks; disparity in teammate House Brand contribution (ranging from 28.32% to 53.56%).\nAction Required\nImplement weekly 15-minute DPOS scenario role-plays focusing on retail assistants needing improvement (Farizin and Nurhafizah).", 4),
        ("MARKETING\nIssue\nIntensified local competitor price wars in Kuching (aggressive flyer discounting by Caring Pharmacy, Guardian, Watsons).\nAction Required\nDeploy hyper-local WhatsApp broadcasts and health screening promos highlighting PMG's unique personalized care and value advantage.", 5)
    ]
    for text_val, g_idx in challenges:
        if g_idx < len(s10.shapes):
            grp = s10.shapes[g_idx]
            for gs in grp.shapes:
                if gs.has_text_frame and gs.text_frame.text.strip():
                    gs.text_frame.text = text_val
                    for p in gs.text_frame.paragraphs:
                        p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 11: IN-DEPTH SWOT ANALYSIS
    # =========================================================================
    s11 = prs.slides[10]
    for shape in s11.shapes:
        if shape.has_text_frame and 'September' in shape.text_frame.text:
            shape.text_frame.text = shape.text_frame.text.replace('September 2026', 'October 2026')
            for p in shape.text_frame.paragraphs:
                p.font.name = 'Arial'

    swot_data = [
        ("S - STRENGTHS\nProprietary House Brand Core: 43.29% HB sales contribution (RM 147,299.28, +9.47% YoY), generating RM 95,354.80 in net gross profit (+0.89% YoY) with 27.81% margin.\nEstablished Chronic Care Stronghold: Deep patient loyalty in 7th Mile Kota Sentosa, driving Scheduled Drugs (RM 62,679.91) and Supplements (RM 76,082.27, +3.71% YoY).\nHigh Clinical Trust: Pharmacist consultations (William Chai, Christina Lee, Kenix Ling) establish solid community reputation superior to FMCG chain competitors.", 2),
        ("W - WEAKNESSES\nHigh Inventory Capital Tie-Up: 2.47 months stock cycle (vs 2.0 target); RM 115,471.27 excess stock and aisle clutter observed on retail floor.\nTeammate Performance Disparity: HB attachment ranges from 28.32% (Farizin) and 31.22% (Nurhafizah) to >49% (William, Kenix Ling).\nLow Outreach Direct Conversion: Screenings generate strong headcount but minimal direct sales without pre-set promotional sales packages.", 3),
        ("O - OPPORTUNITIES\nProactive Chronic Refill Retention: Implement semi-automated WhatsApp refill reminders 3–5 days before medication exhaustion to lock in recurring monthly prescription revenue.\nStructured DPOS Up-Selling: Train junior dispensers to attach high-margin wellness lines (Oxxymax, Livason, Flexmore, Progutor) to lift individual basket sizes above RM 40.\nB2B Eldercare Supply: Channel excess adult nutrition and clinical mobility equipment into institutional supply contracts with local nursing homes and eldercare operators.", 4),
        ("T - THREATS\nIntense Kuching Competitor Price Wars: Aggressive loss-leader discounting on commercial adult formulas (Ensure, Enercal, Glucerna) by Caring Pharmacy, Watsons, and Guardian.\nSCD Supply Chain Misallocations: Warehouse sending unrequested bulk stock (e.g. extra cartons of Ensure) straining branch cash flow and floor space.\nConsumer Living Cost Pressures: Economic inflation making price-sensitive customers more cautious on discretionary healthcare spending.", 5)
    ]
    for text_val, g_idx in swot_data:
        if g_idx < len(s11.shapes):
            grp = s11.shapes[g_idx]
            for gs in grp.shapes:
                if gs.has_text_frame and gs.text_frame.text.strip():
                    gs.text_frame.text = text_val
                    for p in gs.text_frame.paragraphs:
                        p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 12: KEY INITIATIVES DONE IN FY2026
    # =========================================================================
    s12 = prs.slides[11]
    initiatives = [
        ("INITIATIVE 01\nFloor DPOS Coaching & Companion Attachment System\nAction: Instituted weekly scenario role-plays for retail assistants to attach high-margin companion wellness lines (Oxxymax, Livason, Flexmore) during routine dispensing.\nResult: House Brand sales expanded to RM 147,299.28 (43.29% of store turnover), and HB basket size surged +18.26% YoY to RM 18.26.", 3),
        ("INITIATIVE 02\nChronic Disease Management & Refill Retention\nAction: Implemented structured patient counseling and refill tracking for cardiovascular, diabetes, and renal chronic patients.\nResult: Scheduled Drug revenue maintained at RM 62,679.91, establishing deep patient loyalty across 7th Mile catchment.", 4),
        ("INITIATIVE 03\nClinical Nutrition Migration Strategy\nAction: Realigned front-end merchandising toward PMG proprietary nutrition formulas (Nutri Alpha, Nutrenmax, Alpha Gold, Flexsure Gold), actively converting price-sensitive consumers away from low-margin commercial formulas.\nResult: Protected gross margin against competitor price wars; F&B revenue rose +6.12% YoY to RM 57,366.34 with 24.79% GP margin.", 5),
        ("INITIATIVE 04\nCommunity Health Outreach & Public Screening Checkpoints\nAction: Organized targeted outreach events providing free glucose, cholesterol, and uric acid checks.\nResult: Screened hundreds of community residents, building deep brand trust and driving sustained prescription footfall to the store.", 6),
        ("INITIATIVE 05\nAdvanced Digital Health Screening Integration (TCM AI & AirDoc)\nAction: Deployed TCM AI tongue/facial sensor analysis and AirDoc retinal scanning inside the pharmacy counseling suite.\nResult: Elevated PMG's clinical authority and attracted health-conscious chronic customers seeking comprehensive non-invasive assessments.", 7),
        ("INITIATIVE 06\nHome Healthcare & Mobility Solutions Expansion\nAction: Expanded rehabilitation equipment offerings (hospital bed rentals, standard/commode wheelchairs, ripple mattresses, oxygen concentrators).\nResult: Positioned Kota Sentosa as the primary home nursing supply hub in the suburban catchment, generating dependable high-ticket sales.", 8)
    ]
    for text_val, g_idx in initiatives:
        if g_idx < len(s12.shapes):
            grp = s12.shapes[g_idx]
            for gs in grp.shapes:
                if gs.has_text_frame and gs.text_frame.text.strip():
                    gs.text_frame.text = text_val
                    for p in gs.text_frame.paragraphs:
                        p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 13: RETAIL STORE WALKTHROUGH VIDEO (No Data Placeholder)
    # =========================================================================
    s13 = prs.slides[12]
    grp13_1 = s13.shapes[1]
    walkthrough_recording_text = (
        "WALKTHROUGH RECORDING\n"
        "Status: Walkthrough Video Not Conducted for October 2026\n"
        "Note: Monthly 5S walkthrough video audit was paused for October 2026.\n"
        "Resuming next month per standard operational audit schedule.\n"
        "Location: PMG Pharmacy Kota Sentosa\n"
        "Compliance Status: [Pending Next Month Video Audit]"
    )
    for gs in grp13_1.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = walkthrough_recording_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp13_2 = s13.shapes[2]
    walkthrough_seq_text = (
        "WALKTHROUGH SCOPE & SEQUENCE\n"
        "0:00 - 0:08 Entrance & Ceiling Displays: [Pending Video Audit]\n"
        "0:09 - 0:18 Supplement & FMCG Gondolas: [Pending Video Audit]\n"
        "0:19 - 0:28 Rear Walkway & Stock Staging Area: [Pending Video Audit]\n"
        "0:29 - 0:42 Personal Care & Mobility Displays: [Pending Video Audit]\n"
        "0:43 - 0:53 Dispensary & Cashier Counter: [Pending Video Audit]\n"
        "(System will alert next month if video is pending upload)"
    )
    for gs in grp13_2.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = walkthrough_seq_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 14: RETAIL STORE WALKTHROUGH FINDINGS (Pending Video Audit Placeholder)
    # =========================================================================
    s14 = prs.slides[13]
    for shape in s14.shapes:
        if shape.has_text_frame and 'Video Audit on' in shape.text_frame.text:
            shape.text_frame.text = shape.text_frame.text.replace('30 Sept 2026', 'October 2026 (Audit Pending)')
            for p in shape.text_frame.paragraphs:
                p.font.name = 'Arial'

    pillars = [
        ("PILLAR 01\nGondola & Shelf Tidiness\nPENDING VIDEO AUDIT\nFindings: Video audit not conducted for October 2026.\nAction Plan: Resume daily morning shelf-facing SOP and verify alignment in upcoming video audit.", 1),
        ("PILLAR 02\nCleanliness – Floor & Fixtures\nPENDING VIDEO AUDIT\nFindings: Video audit not conducted for October 2026.\nAction Plan: Enforce strict 'clear customer seating' rule; maintain swept retail floor and stow packaging.", 2),
        ("PILLAR 03\nMerchandising & Planogram\nPENDING VIDEO AUDIT\nFindings: Video audit not conducted for October 2026.\nAction Plan: Ensure prime eye-level shelf space is dedicated to high-margin House Brands (Nutri Alpha, Flexsure Gold, Oxxymax).", 3),
        ("PILLAR 04\nPricing & Signage Accuracy\nPENDING VIDEO AUDIT\nFindings: Video audit not conducted for October 2026.\nAction Plan: Conduct weekly price tag audits to synchronize shelf wobblers with monthly campaign rotations.", 4),
        ("PILLAR 05\nStock Obstruction & Safety\nPENDING VIDEO AUDIT\nFindings: Video audit not conducted for October 2026.\nAction Plan: Enforce immediate clearance of emergency exit corridors; return unrequested bulk stock to SCD.", 5),
        ("PILLAR 06\nStaff Grooming & SOP\nPENDING VIDEO AUDIT\nFindings: Video audit not conducted for October 2026.\nAction Plan: Continue reinforcing official PMG red polo uniform compliance and proactive DPOS greeting at dispensary.", 6)
    ]
    for text_val, g_idx in pillars:
        if g_idx < len(s14.shapes):
            grp = s14.shapes[g_idx]
            for gs in grp.shapes:
                if gs.has_text_frame and gs.text_frame.text.strip():
                    gs.text_frame.text = text_val
                    for p in gs.text_frame.paragraphs:
                        p.font.name = 'Arial'

    # =========================================================================
    # SLIDE 15: THANK YOU & KEY STRATEGIC COMMITMENTS
    # =========================================================================
    s15 = prs.slides[14]
    grp15_1 = s15.shapes[1]
    for gs in grp15_1.shapes:
        if gs.has_text_frame and '01 October 2026' in gs.text_frame.text:
            gs.text_frame.text = gs.text_frame.text.replace('01 October 2026', '01 November 2026')
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    grp15_2 = s15.shapes[2]
    commitments_text = (
        "KEY STRATEGIC COMMITMENTS\n"
        "Focus Areas & Execution Targets for October 2026\n"
        "01\n"
        "Elevate House Brand Share: Target >45% branch HB contribution through weekly 15-minute DPOS companion bundling role-plays with junior dispensary assistants (Farizin & Nurhafizah).\n"
        "02\n"
        "Accelerate Stock Cycle Rationalization: Reduce outlet stock cycle from 2.47 months toward the 2.0 HQ target by clearing excess inventory and expediting warehouse RTV on unrequested bulk stock.\n"
        "03\n"
        "Strengthen Chronic Disease Refill Retention: Implement semi-automated WhatsApp appointment & refill reminders 3–5 days prior to prescription completion to protect Scheduled Drug loyalty.\n"
        "04\n"
        "Enforce Floor 5S Standards & Walkthrough Compliance: Resume monthly video audit next month, enforce morning shelf-facing SOPs, and maintain completely clear emergency exit corridors."
    )
    for gs in grp15_2.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = commitments_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

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
