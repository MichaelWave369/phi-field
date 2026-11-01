# Φ Field gateway artwork, v1

Assets for **phi-field.com** · Source visual theme: neon cyberpunk + post-apocalyptic tech + high fantasy.

## Image files
- `phi-field-desktop-master.png`: clean, text-free desktop master at native generation resolution (1672 × 941). No interactive elements or titles are embedded.
- `phi-field-desktop.webp`: production primary desktop background (1672 × 941).
- `phi-field-desktop-ui-ready.webp`: same primary scene with subtle darkening for readable live text and cards.
- `phi-field-desktop-alternate.webp`: a second clean cinematic composition.
- `phi-field-mobile-portal-focus.webp`: 1080 × 1920 center crop for narrow phones; emphasizes the Phi gateway but cuts off the side characters and castle.
- `phi-field-mobile-full-world.webp`: 1080 × 1920 mobile adaptation preserving the entire original world as a central panorama, surrounded by softened ambience, with lower dark space for stacked UI cards.
- `phi-field-art-direction.webp`: concept sheet; visual reference ONLY, not a production background (contains illustrative UI/text).

## Living overlay assets
- `phi-field-animated-halo.svg`: transparent vector orbital glyph overlay with CSS animation (does not include the central Phi, which is already painted into the background).
- `PhiFieldLivingOverlay.jsx` and `phi-field-living-overlay.css`: optional decorative, pointer-events:none React ambient effect. Animated aurora, mist, glyph orbital lines, and particles. Respects `prefers-reduced-motion`.

## Integration
1. Copy production `.webp` and `.svg` files into a React/Vite app's `public/assets/` directory.
2. Copy `.jsx` and `.css` into `src/components/` and update the CSS `background-image` paths if needed.
3. Give the hero `className="phi-hero"`; render `<PhiFieldLivingOverlay />` as a first child; place real heading, interactive `<a>` destination cards and footer after the effect layer.
4. Keep live links and button labels in React, NEVER as pixels. Preserve your current real destinations for PhiOS Live, XR, and Mobile.
5. On mobile, stack three CTA cards vertically; place them in the dark lower half so the hero art stays legible.
6. For accessibility, keep the effects decorative, retain text contrast, and provide reduced-motion support.

The base image has a dragon, aircraft, and waterfalls **painted into it**. The bundled overlay makes ambience move but does not animate those objects independently. True dragon flight, moving craft or waterfall flow need dedicated separate sprites/videos or artist-created scene layers, not just a background still.

## Suggested palette
- Night navy `#070B1A`, cyan `#46DFFF`, magenta `#D04EED`, violet `#8B5CF6`, mint `#57FFD4`, pale text `#E7F2FF`.

Note: These are original AI-generated fantasy/scifi images referencing broad genres, not copies of in-game Fallout / Dragon Age art. Keep the site MIT/open-source text separate from generated image license claims; check your project distribution policy.
