# Generated visual assets

## Hero background

The full-width intro uses `public/images/technical-hero.webp`, an original image created with the built-in image generation tool and compressed to WebP. It is bundled locally, so the app does not depend on an external image host. A dark gradient keeps the live headline readable in both themes; the background is decorative and contains no text.

Generation prompt: "Use case: stylized-concept. Asset type: full-width website hero background for a polished technical notes dashboard. Create a classy restrained cinematic abstract 3D architectural composition of graphite glass planes and precise microetched circuit traces, subtle fiber-optic cyan light (#14AFF1), a few tiny warm gold highlights (#FFBE11), deep charcoal black. Landscape panoramic 3:1 composition. Keep the LEFT HALF very dark, quiet and nearly empty for overlaid white headline. Concentrate elegant geometric technical detail and depth on the right half. Sophisticated studio lighting, fine material detail, premium enterprise technology aesthetic, minimal tasteful, no text no logos no watermark no characters, avoid busy neon cyberpunk. Save the generated asset locally for inclusion in the website repository."

## Images on notes

Both Add and Edit offer an optional JPEG/PNG/WebP upload, preview, replacement, and removal. Files up to 10 MB are decoded locally, resized to a maximum 1000-pixel edge, and encoded as WebP. Encoded images over 400,000 characters are rejected with a readable message. Saving sends the image with the note through POST/PUT; the mock API validates and persists it. This is intended for a small demo collection: browser storage is finite, so a production API should store images in object storage and return URLs.

The two starter notes have bundled cover images. Previously saved starter notes receive their default cover when they do not yet have an image field; explicit `null` preserves image removal. Other existing notes remain intact. `public/images/note-workspace.webp` was created using the built-in image generation tool with the prompt: "Wide landscape 3:2 original premium editorial still life for a technical notes card: minimalist dark graphite desk with a blank open notebook, sleek glass architectural cube and a thin cyan illuminated line, restrained gold accent, soft studio light, elegant material textures, calm composition, no readable text, no logo, no watermark. Charcoal cyan white and tiny gold palette matching modern enterprise software." The second starter cover uses `public/images/note-small-steps.webp`, an original image created with the built-in image generation tool: "Classy editorial landscape of five graphite stone steps ascending toward an illuminated glass cube, thin cyan edge lighting and a restrained gold highlight; a quiet metaphor for steady progress; no text, logos, or people." Existing starter notes using the old bundled hero cover automatically receive this image; uploaded covers and explicit image removals are preserved.

Image tests cover API persistence/removal, rejected image formats and URLs, resizing and URL cleanup, plus upload preview/save and removal through the editor.

## Expanded starter collection

Five additional examples bring the starter dashboard to seven notes: Make space for focus; Build, measure, learn; Ideas worth keeping; Design for clarity; and Ship something useful. Each has its own original generated WebP cover in `public/images/note-{focus,learn,ideas,clarity,ship}.webp`. Existing collections receive missing new examples once, matched by stable IDs. Existing edits and uploaded images stay intact, and deleted examples do not return on refresh.

All five covers were created with the built-in image generation tool using this common prompt: "Create an original premium editorial 3:2 landscape cover image for a technical notes dashboard. Subject: [subject below]. Refined photorealistic 3D still life, classy architectural materials, tactile graphite and glass, soft cinematic studio illumination, charcoal background with cyan #14AFF1 and very restrained gold #FFBE11. Crisp purposeful composition. No text no logos no watermark no people. Visually distinct subject, understated enterprise design."

- Focus: A single sculptural graphite ring framing a softly glowing cyan sphere, dark stone plinth, quiet empty space, focus and attention.
- Learn: An elegant sequence of three translucent glass prisms with thin cyan light passing between them, a small gold intersection, iteration and discovery.
- Ideas: Three delicate floating glass tiles with tiny luminous gold points and cyan edge light above a dark reflective surface, captured ideas.
- Clarity: Precisely aligned translucent glass panels forming a simple geometric doorway, cyan edges, warm gold light beyond, clarity and intentional design.
- Ship: A small flawless brushed graphite cube resting at the end of an architectural runway, cyan guiding lines and a restrained gold edge, completion and purposeful delivery.


