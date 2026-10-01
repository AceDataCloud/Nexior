# Loading tools integration POC

Build the review entry with `npm run build:loading`. Its output is `dist-loading/loading-lab.html`; serve or upload the **entire** `dist-loading` directory. The review build also includes the full application at `/`. Use `/?loading_tool=<tool>` to opt into that loader in the real application. The normal production build does not include the lab entry or enable URL-based overrides.

Select `?tool=dot-matrix`, `dot-animator`, `ldrs`, `css-loaders`, `loading-io`, `piskel`, or `svgator`. Add `&lang=en` for English. The page uses real application components with local state fixtures; it makes no generation or billing requests.

## Test matrix

1. Select each of the seven implementations. Confirm both the large preview and the actual application component render it.
2. Select Waiting, Thinking and Generating, then Complete and Failed. The waiting indicator must disappear on terminal states.
3. Play the full flow, then stop it and switch implementations. Old timers must not change the newly selected state.
4. Pause/resume, change speed and color, and switch light/dark themes. Test a narrow viewport and OS reduced-motion mode. SVGator retains the sample artwork's original colors; it is not a recolorable loader template.
5. Open the normal application with no loading options: existing loading behavior remains unchanged.

## Asset provenance and scope

- dot/matrix: selected original SVGs pinned to commit `8d934c6ba8903def566f3fcd37dde1b6fee406de` from https://github.com/icantcodefyi/dot-matrix-animations. Its published gallery states MIT.
- Dot Matrix Animator: actual Spinner HTML/CSS output captured from https://dot-matrix-animation.vercel.app/. Only exported output is used; generator code is not copied. Selectors, dimensions, colors and timing are adapted for isolation.
- LDRS: Grid styles from https://github.com/GriffinJohnston/ldrs. Full MIT notice is retained in `src/assets/loading/LDRS-LICENSE.txt`.
- CSS Loaders: first dots example from https://css-loaders.com/dots/. Selectors and colors are namespaced. This POC does not claim a new license for the site's code.
- loading.io: original Ring CSS from https://github.com/loadingio/css-spinner/tree/master/dist/entries/ring. Loader files are CC0; https://loading.io/css/ states the same.
- Piskel: original four-frame artwork supplied as `src/assets/loading/waiting.piskel` and `piskel-sheet.png`. Open the project in https://www.piskelapp.com/ to edit/export it. No third-party example artwork is copied.
- SVGator: unmodified geometry of its official CSS sample from https://cdn.svgator.com/samples/SVGator-Animation-formats.zip. Its copyright/export-format notice is retained. This is an evaluation sample, not an assertion of a commercial artwork license. Replace it with an owned exported asset before production use. Account creation, paid export, and MCP connection were not performed.

The comparison is an opt-in component integration. Choosing a production design or purchasing an editor subscription remains a separate decision.
