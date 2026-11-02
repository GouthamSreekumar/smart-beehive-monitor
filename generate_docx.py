import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_PATH = r"d:\beemonitor\Smart_Beehive_Monitoring_System_Report.docx"

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_page_border(doc):
    for section in doc.sections:
        sectPr = section._sectPr
        pgBorders = parse_xml(
            f'<w:pgBorders {nsdecls("w")} w:offsetFrom="page">'
            f'<w:top w:val="single" w:sz="8" w:space="24" w:color="333333"/>'
            f'<w:left w:val="single" w:sz="8" w:space="24" w:color="333333"/>'
            f'<w:bottom w:val="single" w:sz="8" w:space="24" w:color="333333"/>'
            f'<w:right w:val="single" w:sz="8" w:space="24" w:color="333333"/>'
            f'</w:pgBorders>'
        )
        sectPr.append(pgBorders)

def build_docx():
    doc = Document()

    # Set page margins (0.6 in to match reference report layout)
    for section in doc.sections:
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.6)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Styles
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Helvetica'
    normal_font.size = Pt(10)
    normal_font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(20)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(15)
        run.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
        return p

    def add_heading(text, space_before=14):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
        return p

    def add_subheading(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        return p

    def add_body(text, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.2
        p.add_run(text)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3.5)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
        p.add_run(text)
        return p

    # ==================== PAGE 1 ====================
    add_title("SMART BEEHIVE MONITORING AND NOTIFICATION SYSTEM")

    add_heading("1. INTRODUCTION", space_before=6)
    add_body(
        "Honey bees (Apis mellifera) are vital pollinators in agricultural production and natural ecosystems, "
        "making colony health monitoring and safety a critical concern. Often, colonies suffer from environmental stress, "
        "brood chilling, or overheating unexpectedly, causing severe hive mortality, chalkbrood infections, or absconding. "
        "Traditional methods of checking beehives require manual frame inspections, which are intrusive and time-consuming."
    )
    add_body(
        "To address this issue, this project proposes an IoT-based Smart Beehive Monitoring and Notification System that "
        "automatically measures internal brood nest temperature and relative humidity and provides alerts when environmental "
        "conditions breach predefined biological thresholds. The system integrates a digital DHT22 sensor with an ESP32 "
        "microcontroller to accurately sample microclimate parameters. The data is processed by the ESP32, which transmits "
        "real-time sensor readings to the cloud via Wi-Fi. Beekeepers can monitor hive conditions through an interactive web "
        "dashboard and receive instant notifications when abnormal conditions arise."
    )
    add_body(
        "This solution offers a low-cost, reliable, non-invasive, and scalable way to manage apiary microclimates efficiently "
        "while minimizing manual hive disruption."
    )

    add_heading("2. AIM OF THE PROJECT")
    add_body(
        "The main aim of this project is to design and implement an IoT-enabled beehive monitoring system that continuously "
        "measures intra-hive temperature and relative humidity, sends notifications when microclimate metrics exceed critical "
        "thresholds, and enables beekeepers to monitor colony health remotely in real time."
    )

    add_heading("3. OBJECTIVES")
    add_bullet("", "To measure the beehive's real-time temperature and humidity using a digital DHT22 sensor module.")
    add_bullet("", "To process sensor data through an ESP32 microcontroller and transmit it securely to the cloud via Wi-Fi.")
    add_bullet("", "To develop an interactive user dashboard for real-time microclimate monitoring and historical time-series analytics.")
    add_bullet("", "To send automatic alerts when brood nest temperature or humidity deviates from biological optimal bounds.")
    add_bullet("", "To provide a compact, non-invasive, and cost-effective system suitable for outdoor apiary environments.")

    doc.add_page_break()

    # ==================== PAGE 2 ====================
    add_heading("4. EXISTING SYSTEM", space_before=6)
    add_body(
        "The existing methods for beehive monitoring are mostly manual or analog, such as opening hive covers, removing brood frames, "
        "or placing manual external thermometers under the lid."
    )
    add_body("Disadvantages:")
    add_bullet("", "Manual hive checking disrupts colony thermal homeostasis, damages comb, and stresses the queen.")
    add_bullet("", "Manual checks capture only instantaneous snapshots, missing overnight freezes or sudden overheating.")
    add_bullet("", "No real-time notifications or remote telemetry automation.")
    add_bullet("", "Inefficient tracking of long-term seasonal hive microclimate trends.")

    add_heading("5. PROPOSED SYSTEM")
    add_body(
        "The proposed system introduces an IoT-based smart beehive monitoring device capable of measuring internal hive "
        "temperature and relative humidity accurately and transmitting telemetry to a cloud server in real time."
    )
    add_body(
        "The ESP32 microcontroller collects calibrated digital readings from the DHT22 sensor and compares them with predefined "
        "biological limits (optimum 32.0°C–36.0°C and 50%–70% RH). When the hive microclimate breaches safety boundaries or "
        "sensor data stops transmitting, the system triggers alerts via Wi-Fi to the connected user dashboard."
    )
    add_body(
        "This design eliminates the need for frequent manual hive opening, offering automation, biological safety, and convenience."
    )

    add_heading("6. SYSTEM ARCHITECTURE")
    add_body("The architecture comprises two main layers — Device Layer and Cloud Layer.")

    add_subheading("6.1 Hardware Components")
    add_bullet("ESP32 DevKit V1: ", "Microcontroller with built-in 2.4 GHz Wi-Fi for processing and non-blocking data transmission.")
    add_bullet("DHT22 (AM2302) Sensor: ", "Measures internal temperature (-40°C to +80°C) and relative humidity (0–100% RH).")
    add_bullet("Single-Bus Data Interface: ", "High-speed digital communication pin directly connecting sensor to ESP32 GPIO 4.")
    add_bullet("Enclosure/Mounting Base: ", "Weatherproof housing positioned beneath the inner cover to safely protect electronics from propolis.")
    add_bullet("Jumper Wires: ", "Low-resistance wiring connecting sensor module rails.")
    add_bullet("Power Adapter (5V / USB-C): ", "Supplies continuous power to the ESP32 board.")

    doc.add_page_break()

    # ==================== PAGE 3 ====================
    add_subheading("6.2 Software Components")
    add_bullet("Arduino IDE: ", "Used to develop, compile, and flash non-blocking C++ firmware to the ESP32.")
    add_bullet("FastAPI + PostgreSQL 16 (Cloud): ", "High-performance Python REST API and indexed SQL persistence on Render.")
    add_bullet("Next.js Dashboard Interface: ", "Responsive React & TypeScript interface with Apache ECharts visualization.")
    add_bullet("Docker: ", "Containerized backend and standalone frontend execution for automated cloud scaling.")

    add_heading("7. WORKING PRINCIPLE")
    add_bullet("1. Initialization: ", "The ESP32 initializes Wi-Fi and connects to the digital DHT22 sensor module.")
    add_bullet("2. Data Acquisition: ", "The DHT22 measures real-time internal temperature and relative humidity at configurable intervals (2–5s).")
    add_bullet("3. Data Processing: ", "The ESP32 validates values, performs NaN checks, and packages telemetry into structured JSON.")
    add_bullet("4. Threshold Check: ", "Telemetry is evaluated against brood nest limits (32°C–36°C; 50%–70% RH); deviations trigger warnings.")
    add_bullet("5. Notification: ", "Data is dispatched over HTTPS POST to the cloud backend and committed to PostgreSQL.")
    add_bullet("6. Monitoring: ", "Beekeepers monitor live telemetry, connection freshness, and historical trends via the dashboard.")

    add_heading("8. CONNECTION DETAILS")
    # Table matching PDF
    table_data = [
        ["Component Pin", "Type", "ESP32 Pin", "Voltage"],
        ["DHT22 + (VCC)", "Power", "3V3", "3.3V"],
        ["DHT22 - (GND)", "Ground", "GND", "0V"],
        ["DHT22 out (DATA)", "Digital Data", "D4 (GPIO 4)", "3.3V"],
        ["ESP32 USB-C", "Power Input", "VBUS / 5V", "5.0V"]
    ]
    t = doc.add_table(rows=len(table_data), cols=4)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths = [Inches(1.8), Inches(1.5), Inches(1.8), Inches(1.5)]
    
    for r_idx, row in enumerate(table_data):
        for c_idx, val in enumerate(row):
            cell = t.cell(r_idx, c_idx)
            cell.width = col_widths[c_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(val)
            run.font.name = 'Helvetica'
            run.font.size = Pt(9)
            if r_idx == 0:
                run.bold = True
                set_cell_background(cell, "F2F4F7")
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)

    add_heading("9. CLOUD & CONTAINER HOSTING")
    add_body(
        "The backend server, database, and web dashboard are deployed on Render Cloud Platform using Docker containers "
        "and managed infrastructure for high availability and automatic SSL certification."
    )
    add_bullet("Managed PostgreSQL 16: ", "Automated persistent cloud database storing timestamped readings with composite indexes.")
    add_bullet("Docker Setup: ", "Containerized microservices for FastAPI (Python 3.11) and Next.js 14 standalone.")
    add_bullet("Custom Domain & SSL: ", "Production routing via https://beehivemonitor.gouthamsreekumar.dev with automated Let's Encrypt certificates.")

    doc.add_page_break()

    # ==================== PAGE 4 ====================
    add_heading("10. RESULTS", space_before=6)
    add_body("The implemented system successfully:")
    add_bullet("", "Measures real-time intra-hive temperature and relative humidity with high precision.")
    add_bullet("", "Sends automated warning alerts when brood nest conditions exceed safe biological boundaries.")
    add_bullet("", "Displays live temperature and humidity curves with interactive Apache ECharts time filters.")
    add_bullet("", "Enables remote apiary surveillance from any device globally via beehivemonitor.gouthamsreekumar.dev.")

    add_heading("11. ADVANTAGES")
    add_bullet("", "Non-invasive operation prevents brood chilling, propolis breakage, and colony disturbance.")
    add_bullet("", "Automated notifications and freshness checks reduce manual travel and inspection labor.")
    add_bullet("", "Highly cost-effective and scalable architecture supporting multi-hive apiary fleets.")
    add_bullet("", "Continuous night-and-day longitudinal telemetry reveals subtle seasonal and health trends.")
    add_bullet("", "Improves colony survival rates by giving beekeepers actionable early warnings.")

    add_heading("12. APPLICATIONS")
    add_bullet("Commercial Apiaries: ", "Real-time fleet monitoring across multiple remote apiaries.")
    add_bullet("Backyard & Urban Beekeeping: ", "Effortless surveillance of rooftop and garden hives.")
    add_bullet("Agricultural Pollination: ", "Health and strength auditing of colonies deployed for crop pollination.")
    add_bullet("Academic & Ecological Research: ", "Data-driven observation of microclimate shifts on pollinator survival.")

    add_heading("13. FUTURE ENHANCEMENTS")
    add_bullet("Hive Scale Integration (Load Cell & HX711): ", "Tracking daily honey accumulation and swarming weight loss.")
    add_bullet("Audio Acoustic Frequency Analysis: ", "Capturing hive acoustics to detect queen piping and swarming events.")
    add_bullet("LoRaWAN / Cellular Fallback: ", "Enabling long-range telemetry in remote mountain apiaries lacking Wi-Fi.")
    add_bullet("Solar Energy Harvesting: ", "Pairing a 5V solar panel and lithium battery for perpetual autonomous field use.")

    add_heading("14. CONCLUSION")
    add_body(
        "The Smart Beehive Monitoring and Notification System provides an intelligent, automated solution to track hive microclimates "
        "accurately. It ensures timely alerts, improves colony survival, and enhances apiculture efficiency. The IoT integration "
        "makes the system scalable, robust, and accessible via the cloud, laying a practical foundation for modern precision agriculture."
    )

    doc.add_page_break()

    # ==================== PAGE 5 ====================
    add_heading("15. PROJECT DESIGN", space_before=6)
    add_body("Data Flow:")
    add_bullet("1. ", "DHT22 Sensor → ESP32: Samples and digitizes brood nest temperature and relative humidity.")
    add_bullet("2. ", "ESP32 → Cloud Backend: Transmits microclimate JSON payloads via Wi-Fi over HTTPS.")
    add_bullet("3. ", "Cloud Backend → PostgreSQL 16: Validates and persists timestamped records.")
    add_bullet("4. ", "Cloud → Dashboard: Displays real-time cards, interactive time-series curves, and alert states.")

    add_heading("16. HARDWARE COMPONENTS")
    add_body(
        "Hardware Configuration:\n"
        "• ESP32 DevKit V1: 30-pin, 240 MHz Tensilica Xtensa dual-core, onboard Wi-Fi & BLE.\n"
        "• DHT22 (AM2302): High-stability capacitive polymer humidity sensor & NTC temperature thermistor.\n"
        "• Power: 5V input converted via onboard AMS1117 3.3V LDO regulator to sensor rails."
    )

    # Architecture Overview Table in DOCX
    arch_box_data = [
        ["DEVICE LAYER", "CLOUD LAYER", "USER INTERFACE LAYER"],
        [
            "• DHT22 Sensor\n• ESP32 DevKit V1\n• Non-blocking 2s timer\n• HTTPS Client",
            "• FastAPI (Python 3.11)\n• PostgreSQL 16 DB\n• Health/Status Engine\n• Hosted on Render",
            "• Next.js 14 Dashboard\n• Apache ECharts\n• beehivemonitor.\n  gouthamsreekumar.dev\n• Anomaly Alerts"
        ]
    ]
    arch_table = doc.add_table(rows=2, cols=3)
    arch_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    a_widths = [Inches(2.2), Inches(2.4), Inches(2.2)]
    for r_idx, row in enumerate(arch_box_data):
        for c_idx, val in enumerate(row):
            cell = arch_table.cell(r_idx, c_idx)
            cell.width = a_widths[c_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(val)
            run.font.name = 'Helvetica'
            if r_idx == 0:
                run.bold = True
                run.font.size = Pt(9.5)
                set_cell_background(cell, "F2F4F7")
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                run.font.size = Pt(8.5)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

    doc.add_page_break()

    # ==================== PAGE 6 ====================
    # NEW SECTION: PHYSICAL HARDWARE PROTOTYPE SETUP
    add_heading("17. PHYSICAL HARDWARE PROTOTYPE SETUP", space_before=6)
    add_body(
        "Below is the operational hardware prototype assembled on an 830-point solderless breadboard. "
        "The ESP32 DevKit V1 micro-controller is powered via USB-C and wired directly to the calibrated DHT22 "
        "temperature and relative humidity sensor module."
    )
    add_body(
        "Wiring Connections verified:\n"
        "• Red Jumper: 3.3V Power (ESP32 3V3 → DHT22 VCC)\n"
        "• Black Jumper: Common Ground (ESP32 GND → DHT22 GND)\n"
        "• Blue Jumper: Single-Bus Digital Data Line (ESP32 GPIO 4 / D4 → DHT22 DATA/OUT)"
    )

    proto_img_path = r"C:\Users\sreej\.gemini\antigravity\brain\93060454-fead-4629-bf20-08d2d1cae8c4\.user_uploaded\media_1793603886074_a25b7dc5.jpg"
    if os.path.exists(proto_img_path):
        p_pimg = doc.add_paragraph()
        p_pimg.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_pimg.paragraph_format.space_before = Pt(6)
        p_pimg.paragraph_format.space_after = Pt(4)
        run_pimg = p_pimg.add_run()
        run_pimg.add_picture(proto_img_path, width=Inches(3.4))
        
        p_pcap = doc.add_paragraph()
        p_pcap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_pcap.paragraph_format.space_after = Pt(10)
        run_pcap = p_pcap.add_run("Figure 1: Fully assembled ESP32 DevKit V1 and DHT22 hardware prototype on breadboard")
        run_pcap.italic = True
        run_pcap.font.size = Pt(8.5)
        run_pcap.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    doc.add_page_break()

    # ==================== PAGE 7 ====================
    add_heading("18. LIVE DASHBOARD AND NOTIFICATION INTERFACE", space_before=6)
    add_body(
        "The production web dashboard is accessible globally at https://beehivemonitor.gouthamsreekumar.dev. "
        "It features live brood temperature cards, relative humidity percentages, sensor freshness health pills, "
        "and automated anomaly warning banners."
    )

    user_img_path = r"C:\Users\sreej\.gemini\antigravity\brain\93060454-fead-4629-bf20-08d2d1cae8c4\.user_uploaded\media_1793549216758_21f1c400.png"
    if os.path.exists(user_img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(user_img_path, width=Inches(6.4))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(10)
        run_cap = p_cap.add_run("Figure 2: Production Web Dashboard running with live telemetry at https://beehivemonitor.gouthamsreekumar.dev")
        run_cap.italic = True
        run_cap.font.size = Pt(8.5)
        run_cap.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    add_heading("19. PRODUCTION VERIFICATION AND DEPLOYMENT")
    add_body(
        "The system has been comprehensively validated end-to-end: from physical DHT22 sensing on ESP32 GPIO 4, "
        "to HTTPS ingestion by FastAPI on Render, persistent SQL storage in PostgreSQL 16, and real-time visualization "
        "on Next.js with verified custom domain SSL/TLS certificates."
    )

    status_img = r"C:\Users\sreej\.gemini\antigravity\brain\93060454-fead-4629-bf20-08d2d1cae8c4\.user_uploaded\media_1793550876844_021bd2dd.png"
    if os.path.exists(status_img):
        p_simg = doc.add_paragraph()
        p_simg.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_simg.paragraph_format.space_before = Pt(4)
        p_simg.paragraph_format.space_after = Pt(4)
        run_simg = p_simg.add_run()
        run_simg.add_picture(status_img, width=Inches(5.4))

        p_scap = doc.add_paragraph()
        p_scap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_scap.paragraph_format.space_after = Pt(8)
        run_scap = p_scap.add_run("Figure 3: Verified DNS CNAME routing and Let's Encrypt SSL/TLS active status on Render")
        run_scap.italic = True
        run_scap.font.size = Pt(8.5)
        run_scap.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    # Add page border
    add_page_border(doc)

    doc.save(DOCX_PATH)
    print("DOCX build complete:", DOCX_PATH)

if __name__ == "__main__":
    build_docx()
