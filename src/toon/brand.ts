// The one place the toon format takes its brand from: sign, CTA card, subtitles, label font, studio colours.
// Shifu Po (shifupofengshui.com): ink, paper, gold, seal red; Cinzel for heads, Plus Jakarta Sans for body;
// the official logo (red seal + "SHIFU PO / Business, Love & Life") on a paper board framed in seal red.
import { COLORS, FONTS } from "../lib/brand";

export const TOON_BRAND = {
  /** the name the CTA line ends with ("… di Shifu Po") */
  name: "Shifu Po",
  logo: "assets/brand/logo-shifupo-red.png",
  logoAspect: 1500 / 476,
  signText: "",
  signFrame: COLORS.seal,
  signFill: COLORS.paper,
  signInk: COLORS.ink,
  /** the studio front: paper wall, ink fascia */
  wall: COLORS.paper,
  fascia: COLORS.ink,
  /** Shifu Po's own colour on cards and the assistant's jacket */
  uniform: COLORS.seal,
  colors: {
    primary: COLORS.seal, // the ask's second line, the CTA button
    ink: COLORS.ink, // headlines, the eyebrow pill
    paper: COLORS.paper, // the card
    onPrimary: COLORS.paper,
    highlight: COLORS.gold, // subtitle keywords
    muted: "#6b5f52",
  },
  fonts: { headline: FONTS.display, body: FONTS.body, headlineUpper: true, headlineWeight: 700, headlineScale: 0.62 },
  canvasFont: "Plus Jakarta Sans",
  cta: { button: "KONSULTASI VIA WHATSAPP", tagline: "Feng Shui & BaZi · Business, Love & Life" },
} as const;
