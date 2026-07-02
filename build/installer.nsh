; ---------------------------------------------------------------------------
; Nexior desktop installer — custom NSIS script.
;
; electron-builder picks this up via `nsis.include: build/installer.nsh`. The
; only customization is `.onVerifyInstDir`: when the user changes the install
; directory (typing or Browse dialog), auto-append `${PRODUCT_NAME}` (= AceData)
; if it's not already the last path component. Without this the default NSIS
; DirectoryPage lets the user install straight into a drive root or a shared
; folder — e.g. picking `D:\` installs into `D:\` and Uninstall would rm the
; whole drive. Same pattern electron-builder issue #1442 documents as the
; community-standard fix; UX matches VS Code / Discord installers.
;
; `.onVerifyInstDir` fires per-keystroke, so the append is visible live in the
; textbox. NSIS' StrCpy negative-index syntax gives us the last N chars of the
; path without loops.
; ---------------------------------------------------------------------------

!macro customInit
  ; noop — placeholder so electron-builder's `include` macro chain wires up
  ; cleanly even if we add more custom hooks later.
!macroend

Function .onVerifyInstDir
  ; Fast path: empty $INSTDIR (never happens in real UI, defensive).
  StrCmp $INSTDIR "" done

  ; Preserve scratch registers so we don't clobber values that electron-
  ; builder's generated NSIS or other custom hooks may hold across this
  ; per-keystroke callback.
  Push $R0
  Push $R1
  Push $R2
  Push $R3
  Push $R4

  ; If the trailing path component is already ${PRODUCT_NAME}, do nothing.
  ; NSIS `StrCmp` is CASE-INSENSITIVE (see NSIS docs §4.9.4.6). Windows paths
  ; are also case-insensitive, so `d:\apps\acedata` and `D:\Apps\AceData` are
  ; the same folder and we must NOT append again.
  StrLen $R1 "${PRODUCT_NAME}"
  StrCpy $R0 $INSTDIR $R1 -$R1  ; last N chars of $INSTDIR
  StrCmp $R0 "${PRODUCT_NAME}" restore

  ; Also skip if it ends with "${PRODUCT_NAME}\" (user typed with trailing sep).
  IntOp $R2 $R1 + 1
  StrCpy $R3 $INSTDIR $R2 -$R2
  StrCmp $R3 "${PRODUCT_NAME}\" restore

  ; Append. If $INSTDIR already ends with "\" (e.g. "D:\"), don't double it.
  StrCpy $R4 $INSTDIR 1 -1
  StrCmp $R4 "\" append_plain append_with_sep

  append_plain:
    StrCpy $INSTDIR "$INSTDIR${PRODUCT_NAME}"
    Goto restore

  append_with_sep:
    StrCpy $INSTDIR "$INSTDIR\${PRODUCT_NAME}"

  restore:
    Pop $R4
    Pop $R3
    Pop $R2
    Pop $R1
    Pop $R0
  done:
FunctionEnd
