# 🎮 GAMERHOUSE - COLOR STRATEGY GUIDE

## Vision
Un esquema de colores equilibrado que combina el amarillo vibrante de Pikachu (#FFDE00) con el rojo intenso (#E60012) de manera inteligente y profesional. Ni demasiado rojo, ni demasiado amarillo - un balance visual que mantiene el sitio moderno y atractivo.

---

## Paleta Oficial Pikachu

- **Amarillo Principal (#FFDE00)** - Bright, energetic, accent color
- **Amarillo Oscuro (#FFB800)** - Darker variant for subtlety
- **Rojo Pikachu (#E60012)** - Intense, bold, action color
- **Negro (#000000)** - Dark backgrounds for contrast
- **Blanco (#FFFFFF)** - Text on dark backgrounds

---

## Reglas de Aplicación

### 🟡 AMARILLO se usa para:

1. **Bordes Principales** (Primary Borders)
   - Bordes de cards principales
   - Borders de secciones destacadas
   - Header/Footer borders
   - Ejemplo: `border-primary` (uses #FFDE00)

2. **Iconos Importantes** (Key Icons)
   - Icons en header/navigation
   - Call-to-action icons
   - Warning/Alert icons (visual prominence)
   - Ejemplo: `text-primary`, `text-yellow-400`

3. **Hover States** (Interactive Feedback)
   - Hover text color on links
   - Icon color change on hover
   - Subtle glow effects
   - Ejemplo: `hover:text-primary`, `hover:border-primary`

4. **Badges & Labels** (Status Indicators)
   - New order badges
   - Discount badges
   - Category labels
   - Ejemplo: `bg-primary text-black` (high contrast)

5. **Accent Details** (Visual Hierarchy)
   - Underlines on important text
   - Separator lines
   - Dividers between sections
   - Ejemplo: `border-primary/20` for subtle separators

6. **Subtle Glows & Effects** (Premium Feel)
   - Neon borders for cyberpunk feel
   - Glow animations on hover
   - Box shadows with primary color
   - Ejemplo: `box-shadow: 0 0 20px rgba(255, 222, 0, 0.3)`

### 🔴 ROJO se usa para:

1. **Primary Action Buttons** (Main CTAs)
   - "Agregar al carrito" button
   - "Comprar Ahora" button
   - Main action buttons in admin
   - Ejemplo: `bg-gradient-to-r from-red-600 to-red-700` (professional, bold)

2. **Secondary Buttons** (Alternative Actions)
   - "Editar" in admin
   - "Ver Detalles" button
   - Alternative action buttons
   - Ejemplo: `bg-red-600 hover:bg-red-700`

3. **Error/Alert States** (Critical Feedback)
   - Error messages
   - Alert badges
   - Danger confirmations
   - Ejemplo: `text-red-600`, `bg-red-100/20`

4. **Visual Weight Elements** (Design Prominence)
   - Product highlights
   - Featured product banners
   - Important section headers
   - Ejemplo: `text-red-600` for section titles

### ⚫ NEGRO/GRIS (Backgrounds)
- Main background: `#000000` pure black
- Card backgrounds: `rgba(26, 26, 26, 0.8)` dark gray
- Input backgrounds: `rgba(42, 42, 42, 0.8)` slightly lighter gray
- Hover states: Increase opacity slightly

### ⚪ BLANCO (Text)
- Primary text: `#FFFFFF` pure white on dark backgrounds
- Secondary text: `#e5e5e5` light gray
- Tertiary text: `#b0b0b0` medium gray

---

## Balance Guidelines

### The 60-30-10 Rule (Modified for E-commerce)

- **60% - Black & Grays** (Background, layout, structure)
- **30% - Yellow Accents** (Borders, icons, interactive elements)
- **10% - Red Actions** (Buttons, CTAs, key interactions)

### Visual Weight Hierarchy

**Highest Visual Weight (Use Sparingly)**
- Primary action buttons with red gradient
- New order badges in yellow
- Critical alerts with red

**Medium Visual Weight (Use Regularly)**
- Product card borders in yellow
- Hover effects in primary color
- Section dividers in yellow/20

**Low Visual Weight (Use Frequently)**
- Text color (white/gray)
- Background colors (black/dark gray)
- Subtle borders (primary/20)

---

## Example Applications

### Header Component
```
Background: dark gradient (black → dark-900)
Logo: white text with emoji
Border: yellow/30 (subtle separator)
Icons: yellow text, white on hover (NO! yellow on hover)
Search bar: dark background with primary/30 border
```

### Product Card
```
Border: primary (#FFDE00) - 1px solid
Background: dark-800 with slight transparency
Title: white text
Price: white text
"Agregar al Carrito": red gradient button (from-red-600 to-red-700)
Hover: yellow border glow effect
```

### Admin Dashboard
```
Tab headers: white text on dark background
Active tab indicator: yellow (#FFDE00)
Buttons:
  - Primary action (Delete, Save): red-600 with hover:red-700
  - Secondary (Edit, View): red-500
  - Cancel: gray
Badges: yellow background with black text (high contrast)
```

### Footer
```
Background: dark gradient
Title: white text ("GAMERHOUSE")
Links: primary/80 text, primary on hover
Social icons: primary/60, primary on hover
Bottom divider: primary/20 border
Copyright: primary/40 text
```

---

## Anti-Patterns (What NOT to do)

❌ **Don't replace ALL red with yellow** - This makes buttons look weak and unprofessional
❌ **Don't use yellow shadows everywhere** - Reduces visual hierarchy and clarity
❌ **Don't make text yellow on dark gray** - Poor contrast, hard to read
❌ **Don't use red as background color** - Overwhelming and difficult for dark theme
❌ **Don't overuse yellow borders** - Should be accent, not dominant
❌ **Don't mix red and yellow gradients** - Looks chaotic, not balanced

---

## Color Psychology

- **Yellow (#FFDE00)**: Energy, optimism, attention-grabbing - perfect for accents
- **Red (#E60012)**: Action, excitement, urgency - perfect for buttons and CTAs
- **Black (#000000)**: Sophistication, modern, gaming aesthetic
- **White (#FFFFFF)**: Clarity, contrast, readability

---

## Implementation Notes

1. **Use CSS Variables**: Reference colors through Tailwind utilities
   - `primary` → yellow-400 (#FFDE00)
   - `secondary` → red-600 (#E60012)

2. **Accessibility**: Always check contrast ratios
   - Yellow on black: ✅ High contrast (works great)
   - White on black: ✅ High contrast (perfect for text)
   - Red on black: ✅ Good contrast

3. **Responsive Design**: Colors should remain consistent across breakpoints
   - No color changes on mobile, only size/layout

4. **State Management**: Use opacity for state variations
   - Normal: full opacity
   - Hover: full opacity + slight scale
   - Disabled: opacity-50 (60% opacity)

---

## Testing Checklist

- [ ] Header border is subtle yellow, not overwhelming
- [ ] All buttons maintain red/yellow hierarchy
- [ ] Product cards have yellow borders (not red backgrounds)
- [ ] Hover states show yellow, not red
- [ ] Text contrast is readable (WCAG AA standard)
- [ ] No Windows 98-style garish colors
- [ ] Site looks modern and professional
- [ ] Yellow visible but not dominant (30% of visual weight)
- [ ] Red buttons appear actionable and professional
- [ ] Dark background creates sophisticated atmosphere

---

## Commit Strategy

1. Small, focused changes per file
2. One component type at a time (headers → footers → cards)
3. Test visual appearance in browser after each change
4. Commit with clear message describing what was balanced

---

**Last Updated:** 2025-10-27
**Status:** Ready for implementation
