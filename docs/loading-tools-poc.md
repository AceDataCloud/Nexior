# Loading tools integration POC

ChatGPT's real conversation page (`/chatgpt/conversations`, including saved conversations) now passes loading options to its actual `Message` / `AnsweringMark` components. The normal application defaults to dot/matrix for pending and streamed ChatGPT assistant messages. Before text arrives it uses the thinking SVG; streamed text switches to the stream SVG. Completion, failure, Stop, and a tool waiting for user input remove the indicator. Other model groups retain their current default.

Build the review entry with `npm run build:loading` and upload the **entire** `dist-loading` directory. Open `/chatgpt/conversations` to review the real Studio scenario. Its review-only panel selects all seven loaders for the real conversation rows as well as an isolated, read-only example. Example states never enter conversation history or outgoing requests. Collapse the panel and submit a real prompt normally to test the API flow with your account; that uses the selected service's normal quota/pricing. The normal production build has no review panel or URL override and uses dot/matrix.

For direct variant links, use `/chatgpt/conversations?loading_tool=<tool>`. The review build also retains the detailed comparison at `/loading-lab.html`.

Select `?tool=dot-matrix`, `dot-animator`, `ldrs`, `css-loaders`, `loading-io`, `piskel`, or `svgator`. Add `&lang=en` for English. The page uses real application components with local state fixtures; it makes no generation or billing requests.

## Test matrix

1. Select each of the seven implementations. Confirm both the large preview and the actual application component render it.
2. Select Waiting, Thinking and Generating, then Complete and Failed. The waiting indicator must disappear on terminal states.
3. Play the full flow, then stop it and switch implementations. Old timers must not change the newly selected state.
4. Pause/resume, change speed and color, and switch light/dark themes. Test a narrow viewport and OS reduced-motion mode. SVGator retains the sample artwork's original colors; it is not a recolorable loader template.
5. Open `/chatgpt/conversations` with no loading parameter: dot/matrix is selected by default. Switch the review panel's selector; the next real generation uses that implementation. Collapse the panel to view just the conversation.
6. During a real response, Stop must immediately remove the indicator while preserving partial text. Completion/failure must remove it. User questions/consent/action confirmation pause it; answering resumes it. Saved inactive messages must not animate. Tests cover these rendering rules; no billable generation was issued for automated validation.

## Asset provenance and scope

- dot/matrix: selected original SVGs pinned to commit `8d934c6ba8903def566f3fcd37dde1b6fee406de` from https://github.com/icantcodefyi/dot-matrix-animations. Its published gallery states MIT.
- Dot Matrix Animator: actual Spinner HTML/CSS output captured from https://dot-matrix-animation.vercel.app/. Only exported output is used; generator code is not copied. Selectors, dimensions, colors and timing are adapted for isolation.
- LDRS: Grid styles from https://github.com/GriffinJohnston/ldrs. Full MIT notice is retained in `src/assets/loading/LDRS-LICENSE.txt`.
- CSS Loaders: first dots example from https://css-loaders.com/dots/. Selectors and colors are namespaced. This POC does not claim a new license for the site's code.
- loading.io: original Ring CSS from https://github.com/loadingio/css-spinner/tree/master/dist/entries/ring. Loader files are CC0; https://loading.io/css/ states the same.
- Piskel: original four-frame artwork supplied as `src/assets/loading/waiting.piskel` and `piskel-sheet.png`. Open the project in https://www.piskelapp.com/ to edit/export it. No third-party example artwork is copied.
- SVGator: unmodified geometry of its official CSS sample from https://cdn.svgator.com/samples/SVGator-Animation-formats.zip. Its copyright/export-format notice is retained. This is an evaluation sample, not an assertion of a commercial artwork license. Replace it with an owned exported asset before production use. Account creation, paid export, and MCP connection were not performed.

The actual ChatGPT scenario uses the MIT dot/matrix assets by default. The other six options are review variants; SVGator remains an evaluation sample with the scope above. Purchasing an editor subscription remains a separate decision.

The review build resolves its ephemeral hostname against the existing first-party Studio/platform Site configuration. It does not initialize a new Site row for workers.dev. Normal production and customer-domain resolution remain unchanged.
