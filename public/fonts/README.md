# Poster font (for PDF export)

PDF export outlines text to vector paths so it never depends on fonts installed
on the printer/viewer — and so **Japanese text doesn't turn into tofu** (the
classic jsPDF limitation).

To enable this, drop a TrueType/OpenType font here named **`poster.ttf`**:

```
public/fonts/poster.ttf
```

Recommended: [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
(download the static `.ttf`). Pick a weight that matches the poster titles.

If no font is present, PDF export still works but falls back to jsPDF's standard
font — Latin text renders, Japanese may be missing. SVG export is unaffected
(it always carries the live text).
