# scripts/generate_monthly_deck.py
"""
PMG Pharmacy - Official Monthly Strategic Presentation (.pptx) Generator
Directly populates the official Area Manager PowerPoint master template
with audited store KPIs, rolling 3-month personal sales trajectories,
category performance, and data-driven strategic insights.
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

def fmt_diff_rm_pct(diff_rm, pct):
    sign = '+' if diff_rm > 0 else ''
    pct_sign = '+' if pct > 0 else ''
    return f'{sign}{diff_rm:,.2f}\x0b({pct_sign}{pct:.2f}%)'

def set_cell_value(cell, text, font_size=Pt(9), bold=False, color=None, align=PP_ALIGN.CENTER):
    cell.text = text
    for p in cell.text_frame.paragraphs:
        p.alignment = align
        for r in p.runs:
            r.font.name = 'Arial'
            r.font.size = font_size
            r.font.bold = bold
            if color:
                r.font.color.rgb = color

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
    # SLIDE 2: OVERALL SALES PERFORMANCES (MTD Vs LY)
    # =========================================================================
    s2 = prs.slides[1]
    t2 = s2.shapes[1].table

    # Row 0: Headers
    headers_s2 = ['STORE', 'Aug 26', 'Aug 25', 'Sales Vs LY (RM)', 'Sept 26', 'Sept 25', 'Sales Vs LY (RM)', 'Oct 26', 'Oct 25', 'Sales Vs LY (RM)']
    for c_idx, h in enumerate(headers_s2):
        set_cell_value(t2.cell(0, c_idx), h, font_size=Pt(9), bold=True)

    # Row 1: Total Sales
    set_cell_value(t2.cell(1, 0), 'Total Sales (RM)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t2.cell(1, 1), '380,852.53')
    set_cell_value(t2.cell(1, 2), '314,607.72')
    set_cell_value(t2.cell(1, 3), '+66,244.81\x0b(+21.06%)')
    set_cell_value(t2.cell(1, 4), '337,979.41')
    set_cell_value(t2.cell(1, 5), '307,840.64')
    set_cell_value(t2.cell(1, 6), '+30,138.77\x0b(+9.79%)')
    set_cell_value(t2.cell(1, 7), '340,252.85', bold=True)
    set_cell_value(t2.cell(1, 8), '351,989.93')
    set_cell_value(t2.cell(1, 9), '-11,737.08\x0b(-3.33%)', bold=True)

    # Row 2: HB Sales
    set_cell_value(t2.cell(2, 0), 'HB Sales (RM %)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t2.cell(2, 1), '164,354.04\x0b(43.15%)')
    set_cell_value(t2.cell(2, 2), '114,842.68\x0b(36.50%)')
    set_cell_value(t2.cell(2, 3), '+49,511.36\x0b(+43.11%)')
    set_cell_value(t2.cell(2, 4), '144,533.00\x0b(42.76%)')
    set_cell_value(t2.cell(2, 5), '113,114.84\x0b(36.74%)')
    set_cell_value(t2.cell(2, 6), '+31,418.16\x0b(+27.78%)')
    set_cell_value(t2.cell(2, 7), '147,299.28\x0b(43.29%)', bold=True)
    set_cell_value(t2.cell(2, 8), '134,562.30\x0b(38.23%)')
    set_cell_value(t2.cell(2, 9), '+12,736.98\x0b(+9.47%)', bold=True)

    # Row 3: HM Sales
    set_cell_value(t2.cell(3, 0), 'HM Sales (RM %)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t2.cell(3, 1), '38,826.70\x0b(10.19%)')
    set_cell_value(t2.cell(3, 2), '29,498.80\x0b(9.38%)')
    set_cell_value(t2.cell(3, 3), '+9,327.90\x0b(+31.62%)')
    set_cell_value(t2.cell(3, 4), '32,643.20\x0b(9.66%)')
    set_cell_value(t2.cell(3, 5), '30,909.35\x0b(10.04%)')
    set_cell_value(t2.cell(3, 6), '+1,733.85\x0b(+5.61%)')
    set_cell_value(t2.cell(3, 7), '30,818.81\x0b(9.06%)', bold=True)
    set_cell_value(t2.cell(3, 8), '28,251.18\x0b(8.03%)')
    set_cell_value(t2.cell(3, 9), '+2,567.63\x0b(+9.09%)', bold=True)

    # Row 4: GPRM
    set_cell_value(t2.cell(4, 0), 'GPRM (RM %)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t2.cell(4, 1), '100,551.66\x0b(26.07%)')
    set_cell_value(t2.cell(4, 2), '82,753.23\x0b(26.07%)')
    set_cell_value(t2.cell(4, 3), '+17,798.43\x0b(+21.51%)')
    set_cell_value(t2.cell(4, 4), '91,857.56\x0b(26.84%)')
    set_cell_value(t2.cell(4, 5), '82,095.69\x0b(26.42%)')
    set_cell_value(t2.cell(4, 6), '+9,761.87\x0b(+11.89%)')
    set_cell_value(t2.cell(4, 7), '95,354.80\x0b(27.81%)', bold=True)
    set_cell_value(t2.cell(4, 8), '94,515.18\x0b(26.64%)')
    set_cell_value(t2.cell(4, 9), '+839.62\x0b(+0.89%)', bold=True)

    # Row 5: No of Transactions
    set_cell_value(t2.cell(5, 0), 'No of Transactions', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t2.cell(5, 1), '8,433')
    set_cell_value(t2.cell(5, 2), '7,897')
    set_cell_value(t2.cell(5, 3), '+536\x0b(+6.79%)')
    set_cell_value(t2.cell(5, 4), '7,779')
    set_cell_value(t2.cell(5, 5), '7,754')
    set_cell_value(t2.cell(5, 6), '+25\x0b(+0.32%)')
    set_cell_value(t2.cell(5, 7), '8,066', bold=True)
    set_cell_value(t2.cell(5, 8), '8,715')
    set_cell_value(t2.cell(5, 9), '-649\x0b(-7.45%)', bold=True)

    # Row 6: Basket Size (TS)
    set_cell_value(t2.cell(6, 0), 'Basket Size (TS)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t2.cell(6, 1), '45.16')
    set_cell_value(t2.cell(6, 2), '39.84')
    set_cell_value(t2.cell(6, 3), '+5.32\x0b(+13.36%)')
    set_cell_value(t2.cell(6, 4), '43.45')
    set_cell_value(t2.cell(6, 5), '39.70')
    set_cell_value(t2.cell(6, 6), '+3.75\x0b(+9.44%)')
    set_cell_value(t2.cell(6, 7), '42.18', bold=True)
    set_cell_value(t2.cell(6, 8), '40.39')
    set_cell_value(t2.cell(6, 9), '+1.79\x0b(+4.43%)', bold=True)

    # Row 7: Basket Size (HB)
    set_cell_value(t2.cell(7, 0), 'Basket Size (HB)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t2.cell(7, 1), '19.49')
    set_cell_value(t2.cell(7, 2), '14.54')
    set_cell_value(t2.cell(7, 3), '+4.95\x0b(+34.02%)')
    set_cell_value(t2.cell(7, 4), '18.58')
    set_cell_value(t2.cell(7, 5), '14.59')
    set_cell_value(t2.cell(7, 6), '+3.99\x0b(+27.36%)')
    set_cell_value(t2.cell(7, 7), '18.26', bold=True)
    set_cell_value(t2.cell(7, 8), '15.44')
    set_cell_value(t2.cell(7, 9), '+2.82\x0b(+18.26%)', bold=True)

    # Shape 2: Takeaways text
    if len(s2.shapes) > 2 and s2.shapes[2].has_text_frame:
        tf2 = s2.shapes[2].text_frame
        tf2.text = (
            "Sustained YoY Gross Profit Growth: October 2026 delivered RM 340,252.85 in total revenue (-3.33% YoY) with gross profit expanding to RM 95,354.80 (27.81% GP margin, up +1.17 percentage points YoY vs 26.64% in Oct 2025).\n"
            "Robust House Brand Momentum: HB sales reached RM 147,299.28, surging +9.47% YoY and contributing 43.29% of total outlet sales (up significantly from 38.23% in Oct 2025).\n"
            "Quality Basket Sizes via DPOS Bundling: Average basket size reached RM 42.18 (+4.43% YoY) and HB basket size expanded to RM 18.26 (+18.26% YoY), driven by consistent companion bundling at dispensing counters."
        )
        for p in tf2.paragraphs:
            p.font.name = 'Arial'
            p.font.size = Pt(10)

    # =========================================================================
    # SLIDE 3: TEAMMATES - LEADERSHIP (William, Farizin, Louna)
    # =========================================================================
    s3 = prs.slides[2]
    t3 = s3.shapes[1].table

    # Row 0: Team headers
    set_cell_value(t3.cell(0, 0), 'TEAMMATES', font_size=Pt(9), bold=True)
    set_cell_value(t3.cell(0, 1), 'William', font_size=Pt(9), bold=True)
    set_cell_value(t3.cell(0, 4), 'Farizin', font_size=Pt(9), bold=True)
    set_cell_value(t3.cell(0, 7), 'Louna', font_size=Pt(9), bold=True)

    # Row 1: Months
    subheaders = ['', 'Aug', 'Sept', 'Oct', 'Aug', 'Sept', 'Oct', 'Aug', 'Sept', 'Oct']
    for c_idx, sh in enumerate(subheaders):
        if c_idx > 0:
            set_cell_value(t3.cell(1, c_idx), sh, font_size=Pt(9), bold=True)

    # Row 2: Total Sales
    set_cell_value(t3.cell(2, 0), 'Total Sales', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    # William
    set_cell_value(t3.cell(2, 1), '56,218.31')
    set_cell_value(t3.cell(2, 2), '57,034.03')
    set_cell_value(t3.cell(2, 3), '54,282.56', bold=True)
    # Farizin
    set_cell_value(t3.cell(2, 4), '30,931.79')
    set_cell_value(t3.cell(2, 5), '38,902.31')
    set_cell_value(t3.cell(2, 6), '32,317.74', bold=True)
    # Louna
    set_cell_value(t3.cell(2, 7), '46,327.58')
    set_cell_value(t3.cell(2, 8), '33,077.20')
    set_cell_value(t3.cell(2, 9), '33,343.42', bold=True)

    # Row 3: HB Sales (%)
    set_cell_value(t3.cell(3, 0), 'HB Sales (%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t3.cell(3, 1), '26,502.91\x0b(47.14%)')
    set_cell_value(t3.cell(3, 2), '29,411.83\x0b(51.57%)')
    set_cell_value(t3.cell(3, 3), '26,918.05\x0b(49.59%)', bold=True)

    set_cell_value(t3.cell(3, 4), '9,492.40\x0b(30.69%)')
    set_cell_value(t3.cell(3, 5), '12,023.81\x0b(30.91%)')
    set_cell_value(t3.cell(3, 6), '9,153.55\x0b(28.32%)', bold=True)

    set_cell_value(t3.cell(3, 7), '21,296.52\x0b(45.97%)')
    set_cell_value(t3.cell(3, 8), '15,277.24\x0b(46.19%)')
    set_cell_value(t3.cell(3, 9), '13,348.87\x0b(40.03%)', bold=True)

    # Row 4: HM sales (%)
    set_cell_value(t3.cell(4, 0), 'HM sales (%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t3.cell(4, 1), '5,368.15\x0b(9.55%)')
    set_cell_value(t3.cell(4, 2), '6,189.80\x0b(10.85%)')
    set_cell_value(t3.cell(4, 3), '5,112.48\x0b(9.42%)', bold=True)

    set_cell_value(t3.cell(4, 4), '3,192.90\x0b(10.32%)')
    set_cell_value(t3.cell(4, 5), '3,825.20\x0b(9.83%)')
    set_cell_value(t3.cell(4, 6), '2,911.40\x0b(9.01%)', bold=True)

    set_cell_value(t3.cell(4, 7), '4,244.40\x0b(9.16%)')
    set_cell_value(t3.cell(4, 8), '2,690.90\x0b(8.14%)')
    set_cell_value(t3.cell(4, 9), '2,517.60\x0b(7.55%)', bold=True)

    # Row 5: No of Transactions
    set_cell_value(t3.cell(5, 0), 'No of Transactions', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t3.cell(5, 1), '466')
    set_cell_value(t3.cell(5, 2), '597')
    set_cell_value(t3.cell(5, 3), '567', bold=True)

    set_cell_value(t3.cell(5, 4), '916')
    set_cell_value(t3.cell(5, 5), '1172')
    set_cell_value(t3.cell(5, 6), '1007', bold=True)

    set_cell_value(t3.cell(5, 7), '1024')
    set_cell_value(t3.cell(5, 8), '783')
    set_cell_value(t3.cell(5, 9), '799', bold=True)

    # Row 6: Basket Size (TS)
    set_cell_value(t3.cell(6, 0), 'Basket Size (TS)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t3.cell(6, 1), '120.64')
    set_cell_value(t3.cell(6, 2), '95.53')
    set_cell_value(t3.cell(6, 3), '95.74', bold=True)

    set_cell_value(t3.cell(6, 4), '33.77')
    set_cell_value(t3.cell(6, 5), '33.19')
    set_cell_value(t3.cell(6, 6), '32.09', bold=True)

    set_cell_value(t3.cell(6, 7), '45.24')
    set_cell_value(t3.cell(6, 8), '42.24')
    set_cell_value(t3.cell(6, 9), '41.73', bold=True)

    # Row 7: Basket Size (HB)
    set_cell_value(t3.cell(7, 0), 'Basket Size (HB)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t3.cell(7, 1), '56.87')
    set_cell_value(t3.cell(7, 2), '49.27')
    set_cell_value(t3.cell(7, 3), '47.47', bold=True)

    set_cell_value(t3.cell(7, 4), '10.36')
    set_cell_value(t3.cell(7, 5), '10.26')
    set_cell_value(t3.cell(7, 6), '9.09', bold=True)

    set_cell_value(t3.cell(7, 7), '20.80')
    set_cell_value(t3.cell(7, 8), '19.51')
    set_cell_value(t3.cell(7, 9), '16.71', bold=True)

    # Row 8: GPRM (%)
    set_cell_value(t3.cell(8, 0), 'GPRM(%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t3.cell(8, 1), '14,105.02\x0b(25.09%)')
    set_cell_value(t3.cell(8, 2), '16,494.38\x0b(27.57%)')
    set_cell_value(t3.cell(8, 3), '15,752.68\x0b(29.02%)', bold=True)

    set_cell_value(t3.cell(8, 4), '8,481.94\x0b(27.42%)')
    set_cell_value(t3.cell(8, 5), '9,763.77\x0b(24.96%)')
    set_cell_value(t3.cell(8, 6), '8,468.15\x0b(26.17%)', bold=True)

    set_cell_value(t3.cell(8, 7), '12,813.91\x0b(27.66%)')
    set_cell_value(t3.cell(8, 8), '9,196.92\x0b(27.56%)')
    set_cell_value(t3.cell(8, 9), '8,532.55\x0b(25.59%)', bold=True)

    # =========================================================================
    # SLIDE 4: TEAMMATES - CORE DISPENSARY (Fiona, Nurhafizah, Jong Pei Choo)
    # =========================================================================
    s4 = prs.slides[3]
    t4 = s4.shapes[1].table

    # Row 0: Headers
    set_cell_value(t4.cell(0, 0), 'TEAMMATES', font_size=Pt(9), bold=True)
    set_cell_value(t4.cell(0, 1), 'Fiona', font_size=Pt(9), bold=True)
    set_cell_value(t4.cell(0, 4), 'Nurhafizah', font_size=Pt(9), bold=True)
    set_cell_value(t4.cell(0, 7), 'Jong Pei Choo', font_size=Pt(9), bold=True)

    # Row 1: Months
    for c_idx, sh in enumerate(subheaders):
        if c_idx > 0:
            set_cell_value(t4.cell(1, c_idx), sh, font_size=Pt(9), bold=True)

    # Row 2: Total Sales
    set_cell_value(t4.cell(2, 0), 'Total Sales', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t4.cell(2, 1), '45,990.94')
    set_cell_value(t4.cell(2, 2), '38,723.18')
    set_cell_value(t4.cell(2, 3), '32,814.51', bold=True)

    set_cell_value(t4.cell(2, 4), '32,180.29')
    set_cell_value(t4.cell(2, 5), '37,220.70')
    set_cell_value(t4.cell(2, 6), '36,325.44', bold=True)

    set_cell_value(t4.cell(2, 7), '77,868.67')
    set_cell_value(t4.cell(2, 8), '68,087.05')
    set_cell_value(t4.cell(2, 9), '57,607.00', bold=True)

    # Row 3: HB Sales (%)
    set_cell_value(t4.cell(3, 0), 'HB Sales (%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t4.cell(3, 1), '20,374.91\x0b(44.30%)')
    set_cell_value(t4.cell(3, 2), '15,585.48\x0b(40.25%)')
    set_cell_value(t4.cell(3, 3), '13,098.35\x0b(39.92%)', bold=True)

    set_cell_value(t4.cell(3, 4), '10,697.52\x0b(33.24%)')
    set_cell_value(t4.cell(3, 5), '11,911.70\x0b(32.00%)')
    set_cell_value(t4.cell(3, 6), '11,342.34\x0b(31.22%)', bold=True)

    set_cell_value(t4.cell(3, 7), '40,551.13\x0b(52.08%)')
    set_cell_value(t4.cell(3, 8), '30,255.60\x0b(44.44%)')
    set_cell_value(t4.cell(3, 9), '27,181.97\x0b(47.19%)', bold=True)

    # Row 4: HM sales (%)
    set_cell_value(t4.cell(4, 0), 'HM sales (%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t4.cell(4, 1), '4,134.40\x0b(8.99%)')
    set_cell_value(t4.cell(4, 2), '3,698.90\x0b(9.55%)')
    set_cell_value(t4.cell(4, 3), '2,519.96\x0b(7.68%)', bold=True)

    set_cell_value(t4.cell(4, 4), '4,005.60\x0b(12.45%)')
    set_cell_value(t4.cell(4, 5), '3,165.70\x0b(8.51%)')
    set_cell_value(t4.cell(4, 6), '4,212.50\x0b(11.60%)', bold=True)

    set_cell_value(t4.cell(4, 7), '8,186.15\x0b(10.51%)')
    set_cell_value(t4.cell(4, 8), '7,185.30\x0b(10.55%)')
    set_cell_value(t4.cell(4, 9), '5,033.49\x0b(8.74%)', bold=True)

    # Row 5: No of Transactions
    set_cell_value(t4.cell(5, 0), 'No of Transactions', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t4.cell(5, 1), '1062')
    set_cell_value(t4.cell(5, 2), '1064')
    set_cell_value(t4.cell(5, 3), '870', bold=True)

    set_cell_value(t4.cell(5, 4), '1029')
    set_cell_value(t4.cell(5, 5), '1066')
    set_cell_value(t4.cell(5, 6), '1112', bold=True)

    set_cell_value(t4.cell(5, 7), '1380')
    set_cell_value(t4.cell(5, 8), '1327')
    set_cell_value(t4.cell(5, 9), '1258', bold=True)

    # Row 6: Basket Size (TS)
    set_cell_value(t4.cell(6, 0), 'Basket Size (TS)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t4.cell(6, 1), '43.31')
    set_cell_value(t4.cell(6, 2), '36.39')
    set_cell_value(t4.cell(6, 3), '37.72', bold=True)

    set_cell_value(t4.cell(6, 4), '31.27')
    set_cell_value(t4.cell(6, 5), '34.92')
    set_cell_value(t4.cell(6, 6), '32.67', bold=True)

    set_cell_value(t4.cell(6, 7), '56.43')
    set_cell_value(t4.cell(6, 8), '51.31')
    set_cell_value(t4.cell(6, 9), '45.79', bold=True)

    # Row 7: Basket Size (HB)
    set_cell_value(t4.cell(7, 0), 'Basket Size (HB)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t4.cell(7, 1), '19.19')
    set_cell_value(t4.cell(7, 2), '14.65')
    set_cell_value(t4.cell(7, 3), '15.06', bold=True)

    set_cell_value(t4.cell(7, 4), '10.40')
    set_cell_value(t4.cell(7, 5), '11.17')
    set_cell_value(t4.cell(7, 6), '10.20', bold=True)

    set_cell_value(t4.cell(7, 7), '29.38')
    set_cell_value(t4.cell(7, 8), '22.80')
    set_cell_value(t4.cell(7, 9), '21.61', bold=True)

    # Row 8: GPRM (%)
    set_cell_value(t4.cell(8, 0), 'GPRM(%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t4.cell(8, 1), '12,304.53\x0b(26.75%)')
    set_cell_value(t4.cell(8, 2), '10,891.39\x0b(27.99%)')
    set_cell_value(t4.cell(8, 3), '8,921.83\x0b(27.19%)', bold=True)

    set_cell_value(t4.cell(8, 4), '8,731.37\x0b(27.13%)')
    set_cell_value(t4.cell(8, 5), '9,239.66\x0b(24.53%)')
    set_cell_value(t4.cell(8, 6), '9,953.55\x0b(27.40%)', bold=True)

    set_cell_value(t4.cell(8, 7), '19,762.47\x0b(25.38%)')
    set_cell_value(t4.cell(8, 8), '17,900.38\x0b(26.25%)')
    set_cell_value(t4.cell(8, 9), '15,473.48\x0b(26.86%)', bold=True)

    # =========================================================================
    # SLIDE 5: TEAMMATES - STAFF & PHARMACISTS + COACHING
    # =========================================================================
    s5 = prs.slides[4]
    t5 = s5.shapes[1].table

    # Row 0: Headers
    set_cell_value(t5.cell(0, 0), 'TEAMMATES', font_size=Pt(9), bold=True)
    set_cell_value(t5.cell(0, 1), 'Christina Lee [PRP]', font_size=Pt(9), bold=True)
    set_cell_value(t5.cell(0, 4), 'Kenix Ling', font_size=Pt(9), bold=True)

    # Row 1: Months
    subheaders_s5 = ['', 'Aug', 'Sept', 'Oct', 'Aug', 'Sept', 'Oct']
    for c_idx, sh in enumerate(subheaders_s5):
        if c_idx > 0:
            set_cell_value(t5.cell(1, c_idx), sh, font_size=Pt(9), bold=True)

    # Row 2: Total Sales
    set_cell_value(t5.cell(2, 0), 'Total Sales', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t5.cell(2, 1), '— (New)')
    set_cell_value(t5.cell(2, 2), '— (New)')
    set_cell_value(t5.cell(2, 3), '34,887.97', bold=True)

    set_cell_value(t5.cell(2, 4), '30,321.83')
    set_cell_value(t5.cell(2, 5), '22,669.41')
    set_cell_value(t5.cell(2, 6), '33,851.04', bold=True)

    # Row 3: HB Sales (%)
    set_cell_value(t5.cell(3, 0), 'HB Sales (%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t5.cell(3, 1), '—')
    set_cell_value(t5.cell(3, 2), '—')
    set_cell_value(t5.cell(3, 3), '15,084.64\x0b(43.24%)', bold=True)

    set_cell_value(t5.cell(3, 4), '13,782.70\x0b(45.45%)')
    set_cell_value(t5.cell(3, 5), '10,073.31\x0b(44.44%)')
    set_cell_value(t5.cell(3, 6), '18,132.18\x0b(53.56%)', bold=True)

    # Row 4: HM sales (%)
    set_cell_value(t5.cell(4, 0), 'HM sales (%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t5.cell(4, 1), '—')
    set_cell_value(t5.cell(4, 2), '—')
    set_cell_value(t5.cell(4, 3), '2,744.90\x0b(7.87%)', bold=True)

    set_cell_value(t5.cell(4, 4), '4,002.90\x0b(13.20%)')
    set_cell_value(t5.cell(4, 5), '2,654.30\x0b(11.71%)')
    set_cell_value(t5.cell(4, 6), '3,658.70\x0b(10.81%)', bold=True)

    # Row 5: No of Transactions
    set_cell_value(t5.cell(5, 0), 'No of Transactions', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t5.cell(5, 1), '—')
    set_cell_value(t5.cell(5, 2), '—')
    set_cell_value(t5.cell(5, 3), '918', bold=True)

    set_cell_value(t5.cell(5, 4), '676')
    set_cell_value(t5.cell(5, 5), '611')
    set_cell_value(t5.cell(5, 6), '757', bold=True)

    # Row 6: Basket Size (TS)
    set_cell_value(t5.cell(6, 0), 'Basket Size (TS)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t5.cell(6, 1), '—')
    set_cell_value(t5.cell(6, 2), '—')
    set_cell_value(t5.cell(6, 3), '38.00', bold=True)

    set_cell_value(t5.cell(6, 4), '44.85')
    set_cell_value(t5.cell(6, 5), '37.10')
    set_cell_value(t5.cell(6, 6), '44.72', bold=True)

    # Row 7: Basket Size (HB)
    set_cell_value(t5.cell(7, 0), 'Basket Size (HB)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t5.cell(7, 1), '—')
    set_cell_value(t5.cell(7, 2), '—')
    set_cell_value(t5.cell(7, 3), '16.43', bold=True)

    set_cell_value(t5.cell(7, 4), '20.39')
    set_cell_value(t5.cell(7, 5), '16.49')
    set_cell_value(t5.cell(7, 6), '23.95', bold=True)

    # Row 8: GPRM (%)
    set_cell_value(t5.cell(8, 0), 'GPRM(%)', font_size=Pt(9), bold=True, align=PP_ALIGN.LEFT)
    set_cell_value(t5.cell(8, 1), '—')
    set_cell_value(t5.cell(8, 2), '—')
    set_cell_value(t5.cell(8, 3), '9,980.79\x0b(28.61%)', bold=True)

    set_cell_value(t5.cell(8, 4), '9,335.79\x0b(30.79%)')
    set_cell_value(t5.cell(8, 5), '6,538.08\x0b(28.78%)')
    set_cell_value(t5.cell(8, 6), '10,713.88\x0b(31.65%)', bold=True)

    # Slide 5: Coaching Group (Right side)
    grp5 = s5.shapes[2]
    coaching_text = (
        "COACHING & RECOMMENDATIONS\n"
        "FIND OUT LOW-PERFORMING TEAMMATES & RECOMMENDATIONS\n"
        "Jong Pei Choo [PA]\n"
        "3M TS dropped (-26.0% from RM 77.9k to RM 57.6k). Strategy: 1-on-1 coaching with PIC William on counter attachment scripts, set weekly HB sales quota (RM 7k/week), and monitor daily footfall conversion.\n"
        "Muhammad Nur Farizin [PA]\n"
        "Lowest HB share (28.32%) and low HB basket size (RM 9.09). Strategy: Pair with senior dispenser for structured DPOS role-playing to attach companion supplements (Oxxymax, Livason, Flexmore) during dispensing.\n"
        "Haniesha Louna [ABM]\n"
        "3M TS declined (-28.0% from RM 46.3k to RM 33.3k). Strategy: Discontinue unattached checkout; actively cross-sell high-margin wellness supplements (35%+ GP) on regular chronic scripts to lift GP >27.5%.\n"
        "Fiona Fiena [PA]\n"
        "3M TS drop (-28.7% to RM 32.8k) with transactions down to 870. Strategy: Assign front counter greeting duty during 7th Mile wet market morning peak (7:30–10:30 AM); target ≥32 Tx/day.\n"
        "*Note: New PRP Christina Lee delivered RM 34,887.97 TS with strong 43.24% HB contribution and RM 9,980.79 GPRM (28.61%). Ting Kwang Yu contributed RM 24,704.57 TS with 52.45% HB share."
    )
    for gs in grp5.shapes:
        if gs.has_text_frame and gs.text_frame.text.strip():
            gs.text_frame.text = coaching_text
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'
                p.font.size = Pt(8.5)

    # =========================================================================
    # SLIDE 6: CATEGORY SALES FINDING (MTD)
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
        set_cell_value(t6.cell(0, c_idx), h, font_size=Pt(8), bold=True)

    categories_data = [
        ('ELDERLY', '3.63', '6.4%', '21,541.22', '22,310.20', '-768.98', '6,312.27', '5,234.96', '+1,077.31', '29.30%', '23.46%', '+5.84%'),
        ('F & B', '2.59', '16.9%', '57,366.34', '54,055.83', '+3,310.51', '14,218.64', '11,618.96', '+2,599.68', '24.79%', '21.49%', '+3.30%'),
        ('FIR-AID', '4.54', '2.6%', '8,873.34', '14,370.80', '-5,497.46', '2,989.42', '3,472.61', '-483.19', '33.69%', '24.16%', '+9.53%'),
        ('HOME&LIV', '6.30', '0.3%', '934.47', '1,320.90', '-386.43', '233.39', '399.50', '-166.11', '24.98%', '30.24%', '-5.26%'),
        ('MOM&BABY', '5.69', '2.1%', '7,196.59', '10,836.98', '-3,640.39', '841.54', '1,191.34', '-349.80', '11.69%', '10.99%', '+0.70%'),
        ('NON-SCHE', '1.93', '12.1%', '41,009.75', '45,222.60', '-4,212.85', '15,841.43', '17,615.63', '-1,774.20', '38.63%', '38.95%', '-0.32%'),
        ('NON-SC-P', '1.71', '1.0%', '3,497.20', '4,041.40', '-544.20', '1,261.90', '1,267.02', '-5.12', '36.08%', '31.35%', '+4.73%'),
        ('OTC', '2.20', '12.7%', '42,802.46', '45,871.97', '-3,069.51', '10,972.18', '12,241.56', '-1,269.38', '25.63%', '26.69%', '-1.06%'),
        ('PERSONAL', '4.18', '4.5%', '15,343.16', '16,852.01', '-1,508.85', '4,542.98', '4,678.06', '-135.08', '29.61%', '27.76%', '+1.85%'),
        ('SCHE-DRU', '1.87', '18.5%', '62,679.91', '62,385.00', '+294.91', '7,483.85', '8,741.59', '-1,257.74', '11.94%', '14.01%', '-2.07%'),
        ('SUPPLEME', '2.08', '22.5%', '76,082.27', '73,358.68', '+2,723.59', '28,112.94', '26,640.17', '+1,472.77', '36.95%', '36.31%', '+0.64%'),
        ('TOTAL / AVG', '2.47', '100.0%', '338,470.45', '351,437.57', '-12,967.12', '93,063.40', '93,274.66', '-211.26', '27.50%', '26.54%', '+0.96%')
    ]

    for r_idx, row in enumerate(categories_data):
        is_total = (r_idx == len(categories_data) - 1)
        for c_idx, val in enumerate(row):
            align = PP_ALIGN.LEFT if c_idx == 0 else PP_ALIGN.CENTER
            set_cell_value(t6.cell(r_idx + 1, c_idx), val, font_size=Pt(7.5), bold=is_total, align=align)

    # =========================================================================
    # SLIDE 7: TOP EXPANSION DRIVERS
    # =========================================================================
    s7 = prs.slides[6]
    for shape in s7.shapes:
        if shape.has_text_frame and 'September' in shape.text_frame.text:
            shape.text_frame.text = shape.text_frame.text.replace('September 2026 vs September 2025', 'October 2026 vs October 2025')
            for p in shape.text_frame.paragraphs:
                p.font.name = 'Arial'

    # Group 2: Supplements
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

    # Group 3: Scheduled Drugs
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

    # Group 4: Food & Beverage
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

    # Group 2: Commercial Formula
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

    # Group 3: Mom & Baby
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

    # Group 4: Acute Normalization & Competitor Landscape
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
    # SLIDE 9: COMMUNITY OUTREACH (Clean Placeholders for User Photo & Data)
    # =========================================================================
    s9 = prs.slides[8]
    # Header
    for shape in s9.shapes:
        if shape.has_text_frame and 'COMMUNITY OUTREACH' in shape.text_frame.text:
            shape.text_frame.text = 'COMMUNITY OUTREACH - EVENT SUMMARY\nHealth Screening Event & Community Health Engagement'
            for p in shape.text_frame.paragraphs:
                p.font.name = 'Arial'

    # Group 2: Event Summary Placeholder
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

    # Group 3: KISS Analysis Placeholder
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
    # SLIDE 13: RETAIL STORE WALKTHROUGH VIDEO (No Data Placeholder for Oct 2026)
    # =========================================================================
    s13 = prs.slides[12]
    # Group 1: Recording metadata
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

    # Group 2: Sequence
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
    # Update date in Group 1
    grp15_1 = s15.shapes[1]
    for gs in grp15_1.shapes:
        if gs.has_text_frame and '01 October 2026' in gs.text_frame.text:
            gs.text_frame.text = gs.text_frame.text.replace('01 October 2026', '01 November 2026')
            for p in gs.text_frame.paragraphs:
                p.font.name = 'Arial'

    # Group 2: Commitments
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
    onedrive_dir = r"C:\Users\User\OneDrive - Public Medicare Group Sdn Bhd\William (Pharmacist)\Patient care\KOTA SENTOSA\Full October 2026"
    output_onedrive = os.path.join(onedrive_dir, "Kota_Sentosa_October_2026_Official.pptx") if os.path.exists(onedrive_dir) else None

    # Load data
    with open(sample_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
    start = content.find('{')
    end = content.rfind('}') + 1
    data = json.loads(content[start:end])

    update_presentation(template_path, data, output_local)

    if output_onedrive:
        shutil.copy2(output_local, output_onedrive)
        print(f"Copied to OneDrive: {output_onedrive}")
