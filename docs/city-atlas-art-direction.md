# Urban Palimpsest

Urban Palimpsest is the generative philosophy behind China City Atlas 01. It
draws a city from the things people remember after the landmark is gone: the
angle of rain, the width of a river, a roofline at dusk, the rhythm of windows,
or the way a slope changes a street. Each image is built from relationships
between terrain, weather, light, and density. It never traces a photograph or
depends on a logo to name the place.

The algorithm starts with a stable seed and a quiet left-hand work area. A
bounded field of towers, walls, branches, water lines, and transit paths grows
toward the right. Seeded noise changes height, spacing, illumination, and small
surface marks, while the city pattern supplies stricter rules. Beijing favors
an axis, Shanghai a tidal edge, Shenzhen a circuit grid, and Chongqing stacked
vertical depth. The same approach lets each city feel specific without turning
its best-known building into an icon.

Time is expressed as a settled system state rather than an animation. Rain
lanes, reflections, haze, and lit windows imply motion, but every exported
frame remains still and works with reduced-motion preferences. Light and dark
modes have separate palettes and atmosphere parameters. A carefully tuned
implementation should keep the focal field legible in both states, even after
the image is reduced to a gallery card.

Variation is useful only when it remains composed. Density, horizon, glow, and
weather can move inside narrow ranges, but the safe area and visual hierarchy
do not drift. The generator should feel as if its constants were tested across
hundreds of seeds and adjusted by someone who notices one bad window rhythm.
The work is in those limits: enough variation to keep the process alive, and
enough control that every result still belongs to the collection.

The final implementation must stay reproducible, inspectable, and original.
Every pixel should be explainable from a seed, a palette, and a small set of
geometric rules. Adding a city means defining a new relationship between
terrain and light, then tuning it with the same care as the existing patterns.
That discipline matters more than visual noise or a larger pile of motifs.
