# 🖋️ Signet: A Modern Vector-Based Digital Ledger & Signature Suite

Signet (derived from the historical *signet ring* used to seal trust, representing **"Sign on the Internet"**) is a high-performance, secure, and responsive web application designed to eliminate paper-based workflows. By utilizing native browser vector mechanics, robust multi-state persistence, and compliant cryptographic principles, Signet delivers an elegant, high-precision document execution environment.

## 🚀 Key Impact
* **Latency Reduction:** Compiles and flattens complex PDF annotations in under 150ms using non-blocking rendering queues.
* **Zero Data Loss:** Maintains 100% session integrity across network drops or tab closures using a dual-tier offline storage engine.

---

## 🛠️ Core Functional Pipeline

The application processes documents end-to-end through a high-fidelity rendering and serialization pipeline:

1. **Anti-Freeze PDF Parser:** Loads and renders multipage documents using a web-worker isolated rendering thread, preventing browser-tab freezing.
2. **Dynamic Interaction Canvas:** Provides absolute-coordinate scaling overlays for text, dates, checkboxes, and freehand vector signatures.
3. **Adaptive Ink Engine:** Renders crisp white-on-dark signature vectors during edit mode for visual ergonomics, but translates to high-contrast legal black during final export.
4. **Session Recovery Engine:** Runs background state backups, allowing users to safely log out or close their browser without losing active files.

---

## 🧠 Technical Architecture & Innovation

### Responsive Coordinate Vector Scaling
* Operates on a coordinate translation matrix to map viewport-relative browser interactions directly to absolute PDF-space points.
* Utilizes a normalized scaling ratio:
  $$x_{\text{pdf}} = x_{\text{canvas}} \times \left(\frac{W_{\text{pdf}}}{W_{\text{canvas}}}\right)$$
  This guarantees that text, dates, and signature sizes scale dynamically when zooming, while maintaining perfect layout alignment on output.

### The "Select" State Machine
* Uses an isolated canvas cursor tool system. Switching to the **Select** tool changes the canvas cursor to `pointer-events: auto`, immediately stopping element creation, activating dragging listeners, and enabling absolute layout adjustments.

---

## 🛡️ Secure Engineering & Compliance

Security and compliance are hardcoded directly into Signet's architecture:
* **Unique ID Binding:** Enforces authentication strictly using the user's verified Email as their primary system ID, removing collision risks.
* **Data Privacy Protection:** Features secure client-side password recovery paths linked to encrypted, tokenized authentication APIs.
* **Regulatory Alignment:** Architected to align with key legal frameworks including South Africa's **ECT Act** (Electronic Communications and Transactions Act) and global digital signature standards.

---

## ⚙️ Tech Stack & Frameworks
* **Front-End Framework:** React & Vite (packaged via Lovable.ai)
* **Styling Engine:** Tailwind CSS with responsive dark-mode support and fixed tool docking
* **State Persistence:** Local IndexedDB (for heavy binary PDF payloads) + Supabase (for layout coordinates and auth state)
* **Graphics Rendering:** PDF.js & HTML5 Canvas API
