import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_PATH = r"d:\beemonitor\Smart_Beehive_Monitoring_System_Report.pdf"

class BorderCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_page_decorations()
            super().showPage()
        super().save()

    def draw_page_decorations(self):
        self.saveState()
        self.setStrokeColor(colors.HexColor("#333333"))
        self.setLineWidth(1)
        self.rect(26, 26, 612 - 52, 792 - 52)
        self.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        alignment=1,
        textColor=colors.HexColor("#111111"),
        spaceAfter=18
    )

    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#111111"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#222222"),
        spaceAfter=7
    )

    bullet_style = ParagraphStyle(
        'BulletDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#222222"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    story = []

    # ==================== PAGE 1 ====================
    story.append(Paragraph("SMART BEEHIVE MONITORING AND NOTIFICATION SYSTEM", title_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. INTRODUCTION", h1_style))
    story.append(Paragraph(
        "Honey bees (<i>Apis mellifera</i>) are vital pollinators in agricultural production and natural ecosystems, "
        "making colony health monitoring and safety a critical concern. Often, colonies suffer from environmental stress, "
        "brood chilling, or overheating unexpectedly, causing severe hive mortality, chalkbrood infections, or absconding. "
        "Traditional methods of checking beehives require manual frame inspections, which are intrusive and time-consuming.",
        body_style
    ))
    story.append(Paragraph(
        "To address this issue, this project proposes an IoT-based Smart Beehive Monitoring and Notification System that "
        "automatically measures internal brood nest temperature and relative humidity and provides alerts when environmental "
        "conditions breach predefined biological thresholds. The system integrates a digital DHT22 sensor with an ESP32 "
        "microcontroller to accurately sample microclimate parameters. The data is processed by the ESP32, which transmits "
        "real-time sensor readings to the cloud via Wi-Fi. Beekeepers can monitor hive conditions through an interactive web "
        "dashboard and receive instant notifications when abnormal conditions arise.",
        body_style
    ))
    story.append(Paragraph(
        "This solution offers a low-cost, reliable, non-invasive, and scalable way to manage apiary microclimates efficiently "
        "while minimizing manual hive disruption.",
        body_style
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("2. AIM OF THE PROJECT", h1_style))
    story.append(Paragraph(
        "The main aim of this project is to design and implement an IoT-enabled beehive monitoring system that continuously "
        "measures intra-hive temperature and relative humidity, sends notifications when microclimate metrics exceed critical "
        "thresholds, and enables beekeepers to monitor colony health remotely in real time.",
        body_style
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("3. OBJECTIVES", h1_style))
    story.append(Paragraph("• To measure the beehive's real-time temperature and humidity using a digital DHT22 sensor module.", bullet_style))
    story.append(Paragraph("• To process sensor data through an ESP32 microcontroller and transmit it securely to the cloud via Wi-Fi.", bullet_style))
    story.append(Paragraph("• To develop an interactive user dashboard for real-time microclimate monitoring and historical time-series analytics.", bullet_style))
    story.append(Paragraph("• To send automatic alerts when brood nest temperature or humidity deviates from biological optimal bounds.", bullet_style))
    story.append(Paragraph("• To provide a compact, non-invasive, and cost-effective system suitable for outdoor apiary environments.", bullet_style))

    story.append(PageBreak())

    # ==================== PAGE 2 ====================
    story.append(Paragraph("4. EXISTING SYSTEM", h1_style))
    story.append(Paragraph(
        "The existing methods for beehive monitoring are mostly manual or analog, such as opening hive covers, removing brood frames, "
        "or placing manual external thermometers under the lid.",
        body_style
    ))
    story.append(Paragraph("<b>Disadvantages:</b>", body_style))
    story.append(Paragraph("• Manual hive checking disrupts colony thermal homeostasis, damages comb, and stresses the queen.", bullet_style))
    story.append(Paragraph("• Manual checks capture only instantaneous snapshots, missing overnight freezes or sudden overheating.", bullet_style))
    story.append(Paragraph("• No real-time notifications or remote telemetry automation.", bullet_style))
    story.append(Paragraph("• Inefficient tracking of long-term seasonal hive microclimate trends.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("5. PROPOSED SYSTEM", h1_style))
    story.append(Paragraph(
        "The proposed system introduces an IoT-based smart beehive monitoring device capable of measuring internal hive "
        "temperature and relative humidity accurately and transmitting telemetry to a cloud server in real time.",
        body_style
    ))
    story.append(Paragraph(
        "The ESP32 microcontroller collects calibrated digital readings from the DHT22 sensor and compares them with predefined "
        "biological limits (optimum 32.0°C–36.0°C and 50%–70% RH). When the hive microclimate breaches safety boundaries or "
        "sensor data stops transmitting, the system triggers alerts via Wi-Fi to the connected user dashboard.",
        body_style
    ))
    story.append(Paragraph(
        "This design eliminates the need for frequent manual hive opening, offering automation, biological safety, and convenience.",
        body_style
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("6. SYSTEM ARCHITECTURE", h1_style))
    story.append(Paragraph("The architecture comprises two main layers — <b>Device Layer</b> and <b>Cloud Layer</b>.", body_style))

    story.append(Paragraph("6.1 Hardware Components", ParagraphStyle('SubHeading', parent=h1_style, fontSize=10, spaceBefore=6)))
    story.append(Paragraph("• <b>ESP32 DevKit V1:</b> Microcontroller with built-in 2.4 GHz Wi-Fi for processing and non-blocking data transmission.", bullet_style))
    story.append(Paragraph("• <b>DHT22 (AM2302) Sensor:</b> Measures internal temperature (-40°C to +80°C) and relative humidity (0–100% RH).", bullet_style))
    story.append(Paragraph("• <b>Single-Bus Data Interface:</b> High-speed digital communication pin directly connecting sensor to ESP32 GPIO 4.", bullet_style))
    story.append(Paragraph("• <b>Enclosure/Mounting Base:</b> Weatherproof housing positioned beneath the inner cover to safely protect electronics from propolis.", bullet_style))
    story.append(Paragraph("• <b>Jumper Wires:</b> Low-resistance wiring connecting sensor module rails.", bullet_style))
    story.append(Paragraph("• <b>Power Adapter (5V / USB-C):</b> Supplies continuous power to the ESP32 board.", bullet_style))

    story.append(PageBreak())

    # ==================== PAGE 3 ====================
    story.append(Paragraph("6.2 Software Components", ParagraphStyle('SubHeading', parent=h1_style, fontSize=10, spaceBefore=4)))
    story.append(Paragraph("• <b>Arduino IDE:</b> Used to develop, compile, and flash non-blocking C++ firmware to the ESP32.", bullet_style))
    story.append(Paragraph("• <b>FastAPI + PostgreSQL 16 (Cloud):</b> High-performance Python REST API and indexed SQL persistence on Render.", bullet_style))
    story.append(Paragraph("• <b>Next.js Dashboard Interface:</b> Responsive React & TypeScript interface with Apache ECharts visualization.", bullet_style))
    story.append(Paragraph("• <b>Docker:</b> Containerized backend and standalone frontend execution for automated cloud scaling.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("7. WORKING PRINCIPLE", h1_style))
    story.append(Paragraph("1. <b>Initialization:</b> The ESP32 initializes Wi-Fi and connects to the digital DHT22 sensor module.", bullet_style))
    story.append(Paragraph("2. <b>Data Acquisition:</b> The DHT22 measures real-time internal temperature and relative humidity at configurable intervals (2–5s).", bullet_style))
    story.append(Paragraph("3. <b>Data Processing:</b> The ESP32 validates values, performs NaN checks, and packages telemetry into structured JSON.", bullet_style))
    story.append(Paragraph("4. <b>Threshold Check:</b> Telemetry is evaluated against brood nest limits (32°C–36°C; 50%–70% RH); deviations trigger warnings.", bullet_style))
    story.append(Paragraph("5. <b>Notification:</b> Data is dispatched over HTTPS POST to the cloud backend and committed to PostgreSQL.", bullet_style))
    story.append(Paragraph("6. <b>Monitoring:</b> Beekeepers monitor live telemetry, connection freshness, and historical trends via the dashboard.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("8. CONNECTION DETAILS", h1_style))

    table_data = [
        ["Component Pin", "Type", "ESP32 Pin", "Voltage"],
        ["DHT22 + (VCC)", "Power", "3V3", "3.3V"],
        ["DHT22 - (GND)", "Ground", "GND", "0V"],
        ["DHT22 out (DATA)", "Digital Data", "D4 (GPIO 4)", "3.3V"],
        ["ESP32 USB-C", "Power Input", "VBUS / 5V", "5.0V"]
    ]
    t = Table(table_data, colWidths=[130, 110, 130, 110])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#444444")),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor("#cccccc")),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    story.append(t)

    story.append(Spacer(1, 14))
    story.append(Paragraph("9. CLOUD & CONTAINER HOSTING", h1_style))
    story.append(Paragraph(
        "The backend server, database, and web dashboard are deployed on <b>Render Cloud Platform</b> using Docker containers "
        "and managed infrastructure for high availability and automatic SSL certification.",
        body_style
    ))
    story.append(Paragraph("• <b>Managed PostgreSQL 16:</b> Automated persistent cloud database storing timestamped readings with composite indexes.", bullet_style))
    story.append(Paragraph("• <b>Docker Setup:</b> Containerized microservices for FastAPI (Python 3.11) and Next.js 14 standalone.", bullet_style))
    story.append(Paragraph("• <b>Custom Domain & SSL:</b> Production routing via <code>https://beehivemonitor.gouthamsreekumar.dev</code> with automated Let's Encrypt certificates.", bullet_style))

    story.append(PageBreak())

    # ==================== PAGE 4 ====================
    story.append(Paragraph("10. RESULTS", h1_style))
    story.append(Paragraph("The implemented system successfully:", body_style))
    story.append(Paragraph("• Measures real-time intra-hive temperature and relative humidity with high precision.", bullet_style))
    story.append(Paragraph("• Sends automated warning alerts when brood nest conditions exceed safe biological boundaries.", bullet_style))
    story.append(Paragraph("• Displays live temperature and humidity curves with interactive Apache ECharts time filters.", bullet_style))
    story.append(Paragraph("• Enables remote apiary surveillance from any device globally via <code>beehivemonitor.gouthamsreekumar.dev</code>.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("11. ADVANTAGES", h1_style))
    story.append(Paragraph("• Non-invasive operation prevents brood chilling, propolis breakage, and colony disturbance.", bullet_style))
    story.append(Paragraph("• Automated notifications and freshness checks reduce manual travel and inspection labor.", bullet_style))
    story.append(Paragraph("• Highly cost-effective and scalable architecture supporting multi-hive apiary fleets.", bullet_style))
    story.append(Paragraph("• Continuous night-and-day longitudinal telemetry reveals subtle seasonal and health trends.", bullet_style))
    story.append(Paragraph("• Improves colony survival rates by giving beekeepers actionable early warnings.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("12. APPLICATIONS", h1_style))
    story.append(Paragraph("• <b>Commercial Apiaries:</b> Real-time fleet monitoring across multiple remote apiaries.", bullet_style))
    story.append(Paragraph("• <b>Backyard & Urban Beekeeping:</b> Effortless surveillance of rooftop and garden hives.", bullet_style))
    story.append(Paragraph("• <b>Agricultural Pollination:</b> Health and strength auditing of colonies deployed for crop pollination.", bullet_style))
    story.append(Paragraph("• <b>Academic & Ecological Research:</b> Data-driven observation of microclimate shifts on pollinator survival.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("13. FUTURE ENHANCEMENTS", h1_style))
    story.append(Paragraph("• <b>Hive Scale Integration (Load Cell & HX711):</b> Tracking daily honey accumulation and swarming weight loss.", bullet_style))
    story.append(Paragraph("• <b>Audio Acoustic Frequency Analysis:</b> Capturing hive acoustics to detect queen piping and swarming events.", bullet_style))
    story.append(Paragraph("• <b>LoRaWAN / Cellular Fallback:</b> Enabling long-range telemetry in remote mountain apiaries lacking Wi-Fi.", bullet_style))
    story.append(Paragraph("• <b>Solar Energy Harvesting:</b> Pairing a 5V solar panel and lithium battery for perpetual autonomous field use.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("14. CONCLUSION", h1_style))
    story.append(Paragraph(
        "The Smart Beehive Monitoring and Notification System provides an intelligent, automated solution to track hive microclimates "
        "accurately. It ensures timely alerts, improves colony survival, and enhances apiculture efficiency. The IoT integration "
        "makes the system scalable, robust, and accessible via the cloud, laying a practical foundation for modern precision agriculture.",
        body_style
    ))

    story.append(PageBreak())

    # ==================== PAGE 5 ====================
    story.append(Paragraph("15. PROJECT DESIGN", h1_style))
    story.append(Paragraph("<b>Data Flow:</b>", body_style))
    story.append(Paragraph("1. DHT22 Sensor → ESP32: Samples and digitizes brood nest temperature and relative humidity.", bullet_style))
    story.append(Paragraph("2. ESP32 → Cloud Backend: Transmits microclimate JSON payloads via Wi-Fi over HTTPS.", bullet_style))
    story.append(Paragraph("3. Cloud Backend → PostgreSQL 16: Validates and persists timestamped records.", bullet_style))
    story.append(Paragraph("4. Cloud → Dashboard: Displays real-time cards, interactive time-series curves, and alert states.", bullet_style))

    story.append(Spacer(1, 14))
    story.append(Paragraph("16. HARDWARE COMPONENTS", h1_style))
    story.append(Paragraph(
        "<b>Hardware Configuration:</b><br/>"
        "• <b>ESP32 DevKit V1:</b> 30-pin, 240 MHz Tensilica Xtensa dual-core, onboard Wi-Fi & BLE.<br/>"
        "• <b>DHT22 (AM2302):</b> High-stability capacitive polymer humidity sensor & NTC temperature thermistor.<br/>"
        "• <b>Power:</b> 5V input converted via onboard AMS1117 3.3V LDO regulator to sensor rails.",
        body_style
    ))

    arch_box_data = [
        ["DEVICE LAYER", "CLOUD LAYER", "USER INTERFACE LAYER"],
        [
            "• DHT22 Sensor\n• ESP32 DevKit V1\n• Non-blocking 2s timer\n• HTTPS Client",
            "• FastAPI (Python 3.11)\n• PostgreSQL 16 DB\n• Health/Status Engine\n• Hosted on Render",
            "• Next.js 14 Dashboard\n• Apache ECharts\n• beehivemonitor.\n  gouthamsreekumar.dev\n• Anomaly Alerts"
        ]
    ]
    arch_table = Table(arch_box_data, colWidths=[165, 175, 165])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f2f4f7")),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9.5),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#555555")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,1), 8.5),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Spacer(1, 10))
    story.append(arch_table)

    story.append(PageBreak())

    # ==================== PAGE 6 ====================
    # NEW SECTION 17: HARDWARE PROTOTYPE SETUP
    story.append(Paragraph("17. PHYSICAL HARDWARE PROTOTYPE SETUP", h1_style))
    story.append(Paragraph(
        "Below is the physical hardware prototype assembled on an 830-point solderless breadboard. "
        "The ESP32 DevKit V1 microcontroller is powered via USB-C and wired directly to the calibrated DHT22 "
        "temperature and relative humidity sensor module.",
        body_style
    ))
    story.append(Paragraph("<b>Wiring Connections:</b>", body_style))
    story.append(Paragraph("• <b>Red Jumper:</b> 3.3V Power Supply (ESP32 3V3 → DHT22 VCC)", bullet_style))
    story.append(Paragraph("• <b>Black Jumper:</b> Common Ground Reference (ESP32 GND → DHT22 GND)", bullet_style))
    story.append(Paragraph("• <b>Blue Jumper:</b> Single-Bus Digital Data Line (ESP32 GPIO 4 / D4 → DHT22 DATA/OUT)", bullet_style))
    story.append(Spacer(1, 8))

    proto_img_path = r"C:\Users\sreej\.gemini\antigravity\brain\93060454-fead-4629-bf20-08d2d1cae8c4\.user_uploaded\media_1793603886074_a25b7dc5.jpg"
    if os.path.exists(proto_img_path):
        img_p = Image(proto_img_path, width=210, height=360)
        img_p.hAlign = 'CENTER'
        story.append(img_p)
        story.append(Spacer(1, 6))
        story.append(Paragraph("<i>Figure 1: Fully assembled ESP32 DevKit V1 and DHT22 hardware prototype on breadboard</i>", ParagraphStyle('Caption1', parent=body_style, fontSize=8, alignment=1, textColor=colors.HexColor("#555555"))))

    story.append(PageBreak())

    # ==================== PAGE 7 ====================
    story.append(Paragraph("18. LIVE DASHBOARD AND NOTIFICATION INTERFACE", h1_style))
    story.append(Paragraph(
        "The production web dashboard is accessible globally at <b>https://beehivemonitor.gouthamsreekumar.dev</b>. "
        "It features live brood temperature cards, relative humidity percentages, sensor freshness health pills, "
        "and automated anomaly warning banners.",
        body_style
    ))
    story.append(Spacer(1, 6))

    user_img_path = r"C:\Users\sreej\.gemini\antigravity\brain\93060454-fead-4629-bf20-08d2d1cae8c4\.user_uploaded\media_1793549216758_21f1c400.png"
    if os.path.exists(user_img_path):
        img = Image(user_img_path, width=495, height=215)
        story.append(img)
        story.append(Spacer(1, 6))
        story.append(Paragraph("<i>Figure 2: Production Web Dashboard running with live telemetry at https://beehivemonitor.gouthamsreekumar.dev</i>", ParagraphStyle('Caption2', parent=body_style, fontSize=8, alignment=1, textColor=colors.HexColor("#555555"))))

    story.append(Spacer(1, 10))
    story.append(Paragraph("19. PRODUCTION VERIFICATION AND DEPLOYMENT", h1_style))
    story.append(Paragraph(
        "The system has been comprehensively validated end-to-end: from physical DHT22 sensing on ESP32 GPIO 4, "
        "to HTTPS ingestion by FastAPI on Render, persistent SQL storage in PostgreSQL 16, and real-time visualization "
        "on Next.js with verified custom domain SSL/TLS certificates.",
        body_style
    ))

    status_img = r"C:\Users\sreej\.gemini\antigravity\brain\93060454-fead-4629-bf20-08d2d1cae8c4\.user_uploaded\media_1793550876844_021bd2dd.png"
    if os.path.exists(status_img):
        story.append(Spacer(1, 4))
        s_img = Image(status_img, width=420, height=170)
        story.append(s_img)
        story.append(Paragraph("<i>Figure 3: Verified DNS CNAME routing and Let's Encrypt SSL/TLS active status on Render</i>", ParagraphStyle('Caption3', parent=body_style, fontSize=8, alignment=1, textColor=colors.HexColor("#555555"))))

    doc.build(story, canvasmaker=BorderCanvas)
    print("PDF build complete:", PDF_PATH)

if __name__ == "__main__":
    build_pdf()
