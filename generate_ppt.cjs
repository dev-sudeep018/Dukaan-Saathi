const pptxgen = require("pptxgenjs");

let pptx = new pptxgen();

pptx.layout = "LAYOUT_16x9";
pptx.defineSlideMaster({
  title: "MASTER_SLIDE",
  background: { color: "FFFFFF" },
  objects: [
    { text: { text: "Dukaan Saathi - Hackathon Pitch", options: { x: 0.5, y: 6.8, w: 5, h: 0.5, color: "0F172A", fontSize: 10, italic: true } } }
  ]
});

// Helper to add a slide
function addSlide(title, subtitle, bullets, notes) {
  let slide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  slide.addNotes(notes);
  
  slide.addText(title, { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 36, bold: true, color: "0F172A" });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.5, y: 1.5, w: "90%", h: 0.5, fontSize: 24, color: "F59E0B", bold: true });
  }
  
  if (bullets && bullets.length > 0) {
    let bulletOptions = { x: 0.5, y: 2.2, w: 5.5, h: 4, fontSize: 20, color: "333333", bullet: true, lineSpacing: 35 };
    slide.addText(bullets.map(b => ({ text: b })), bulletOptions);
  }
  
  // Add a placeholder for screenshots
  slide.addShape(pptx.ShapeType.rect, { 
    x: 6.5, y: 2.0, w: 6, h: 4, 
    fill: { color: "E2E8F0" }, 
    line: { color: "CBD5E1", width: 2 } 
  });
  slide.addText("Paste Screenshot Here", {
    x: 6.5, y: 2.0, w: 6, h: 4, 
    align: "center", valign: "middle", 
    color: "94A3B8", fontSize: 18, bold: true
  });
}

// Slide 1
let titleSlide = pptx.addSlide();
titleSlide.addText("Dukaan Saathi", { x: "10%", y: "30%", w: "80%", h: 1, fontSize: 54, bold: true, color: "0F172A", align: "center" });
titleSlide.addText("The AI Era for Kirana Stores", { x: "10%", y: "45%", w: "80%", h: 0.5, fontSize: 28, color: "F59E0B", align: "center" });
titleSlide.addText("Team Name: [Your Team Name]", { x: "10%", y: "60%", w: "80%", h: 0.5, fontSize: 20, color: "64748B", align: "center" });
titleSlide.addNotes("Hello everyone, we are presenting Dukaan Saathi—an intelligent AI business partner built specifically for traditional Kirana stores and local shops to digitize their business with zero friction.");

// Slide 2
addSlide(
  "The Problem",
  "Why existing software fails",
  [
    "Traditional shops rely on pen and paper.",
    "Udhaar (Credit) tracking is messy and error-prone.",
    "No analytics or real-time inventory tracking.",
    "Existing software is too complex for rural shop owners."
  ],
  "Today, millions of Kirana stores still run on physical notebooks. Tracking daily sales, managing credit (Udhaar), and knowing what's out of stock is a massive headache. Existing software solutions are built for supermarkets, not for small shopkeepers, because the learning curve is too steep."
);

// Slide 3
addSlide(
  "The Solution",
  "Meet Dukaan Saathi",
  [
    "Zero Learning Curve",
    "Voice-First AI Logging",
    "Multilingual Support (English, Hindi, Telugu)",
    "Designed for Mobile & Desktop"
  ],
  "Our solution is Dukaan Saathi. It’s an intuitive, voice-first dashboard that requires zero technical skills to use. It speaks the shopkeeper's language—literally—with full support for regional languages so anyone can use it immediately."
);

// Slide 4
addSlide(
  "Feature 1: AI Voice Assistant",
  "Talk, Don't Type",
  [
    "Log sales naturally via voice.",
    "NLP Parsing automatically extracts items, prices, and names.",
    "Updates inventory instantly."
  ],
  "The core of our app is the AI Assistant. A shopkeeper doesn't have time to navigate complex menus while dealing with a line of customers. With Dukaan Saathi, they just tap the microphone and say 'I sold 2 kilos of sugar to Ramesh for 100 rupees', and our AI automatically parses the natural language and logs the sale and updates the inventory."
);

// Slide 5
addSlide(
  "Feature 2: Smart Dashboard",
  "Real-time Analytics at a glance",
  [
    "Real-time Sales Analytics",
    "Daily & Monthly Revenue Tracking",
    "Beautiful, intuitive UI for quick insights"
  ],
  "All those voice inputs feed directly into a real-time smart dashboard. For the first time, a small shop owner can see their daily revenue, top-selling items, and overall growth at a glance, helping them make better business decisions."
);

// Slide 6
addSlide(
  "Feature 3: Digital Udhaar Book",
  "Never lose track of credit",
  [
    "Replace the physical Khata Book",
    "Track individual customer balances",
    "One-click settlements"
  ],
  "Credit, or Udhaar, is the backbone of local Indian commerce. We built a dedicated Udhaar tracker that automatically creates customer profiles when the AI detects an unpaid sale, ensuring no money is ever lost to lost notebooks."
);

// Slide 7
addSlide(
  "Feature 4: Premium UI/UX",
  "Accessibility meets Design",
  [
    "World-class UI/UX",
    "System-wide Dark Mode support",
    "Lightning-fast responsive interface"
  ],
  "We believe utility shouldn't mean ugly. We engineered a premium, lightning-fast UI with dynamic Dark Mode support and responsive design, ensuring it looks and works perfectly whether the shopkeeper is using a cheap Android phone or a desktop computer."
);

// Slide 8
addSlide(
  "Technical Architecture",
  "What powers Dukaan Saathi",
  [
    "Frontend: React + Vite, Tailwind CSS (v4)",
    "Animations: Framer Motion",
    "Backend: Node.js, Express.js",
    "Database: SQLite (Lightweight, local-first)"
  ],
  "Under the hood, Dukaan Saathi is powered by a modern Vite/React frontend styled with Tailwind CSS for rapid, responsive UI development. The backend runs on Express and Node.js, utilizing SQLite to keep data lightweight and easily deployable."
);

// Slide 9
addSlide(
  "Future Roadmap",
  "Where we go from here",
  [
    "Direct WhatsApp Integration (receipts)",
    "Native Android/iOS App deployment",
    "Predictive AI (Stock alerts)"
  ],
  "For our next steps, we plan to integrate WhatsApp APIs so receipts can be sent instantly to customers. We also plan to wrap this PWA into a native Android application, and introduce predictive AI that tells the shopkeeper exactly what to restock before they run out."
);

// Slide 10
let finalSlide = pptx.addSlide();
finalSlide.addText("Thank You!", { x: "10%", y: "30%", w: "80%", h: 1, fontSize: 54, bold: true, color: "0F172A", align: "center" });
finalSlide.addText("Try it live: https://dukaan-saathi-new.onrender.com/onboarding", { x: "10%", y: "50%", w: "80%", h: 0.5, fontSize: 24, color: "F59E0B", align: "center" });
finalSlide.addNotes("Thank you for your time. Dukaan Saathi is live right now—feel free to scan the QR code to try it yourself, and we'd be happy to show you a live demo and answer any questions.");

pptx.writeFile({ fileName: "Dukaan_Saathi_Pitch.pptx" }).then(() => {
    console.log("PPTX created successfully!");
}).catch(err => {
    console.error("Error creating PPTX", err);
});
