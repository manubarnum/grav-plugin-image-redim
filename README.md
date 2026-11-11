# Image Redim — Grav 2 / Admin 2 plugin

🇫🇷 [Version française](README.fr.md)

**Image Redim** adds visual (WYSIWYG) image resizing to the Markdown editor of **Admin 2** in Grav 2,
and to **Editor Pro**. Hover an image in the editor, drag a handle or type a size, and the plugin writes the matching
Grav media action for you, such as `![alt](photo.jpg?resize=800)`.

The original image file is never modified. Grav generates the resized copy itself, in its image cache.

## Requirements

- Grav 2.x
- The **api** and **admin2** plugins
- The default Admin 2 Markdown editor (CodeMirror), or **Editor Pro**

## Installation

### Manual

1. Download the latest release ZIP from the [Releases page](https://github.com/manubarnum/grav-plugin-image-redim/releases).
2. Unzip it into `user/plugins/` and rename the folder to `image-redim`.
3. Clear the Grav cache.
4. Reload the admin with a hard refresh (Ctrl+F5).

### GPM

Once the plugin is listed in the Grav repository:

```bash
bin/gpm install image-redim
```

## Usage

1. Open a page in Admin 2.
2. In the editor, hover an image such as `![alt](photo.jpg)`, or place the text cursor on it.
   In Editor Pro, hover the image itself.
3. Click the **⤡ Resize** button that appears next to it.
4. In the panel that opens:
   - drag the blue handle on the preview, or type a width and height;
   - keep **Proportions** checked to preserve the aspect ratio;
   - pick the resize method.
5. Click **Apply**. The image line is rewritten in the editor.

In Editor Pro, a click on an image still opens Editor Pro's own **Edit Image** dialog;
the **⤡ Resize** button appears in the corner of the image while the mouse is over it.

**Original size** removes the size parameters and restores the original image.
Other parameters already in the image URL (`lightbox`, `classes`, `quality`…) are kept.

File names with spaces are supported. Admin 2 writes them between angle brackets, for example
`![Untitled.jpg](<My photo.jpg>)`, and the plugin keeps that form.

## Resize methods

| Method | Markdown written | Result |
|---|---|---|
| `resize` | `photo.jpg?resize=800` | Grav generates a smaller copy. With a width only, the height is proportional. Lighter pages. |
| `cropResize` | `photo.jpg?cropResize=800,600` | The image is reduced to fit inside the box, without distortion and without padding. Nothing is cut off. |
| `html` | `photo.jpg?width=800&height=533` | The original file is served unchanged. Only the `width` / `height` HTML attributes are added. |

In Grav 2, neither `resize` nor `cropResize` enlarges an image beyond its original size.

## Configuration

In **Admin → Plugins → Image Redim**:

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Enables the plugin. |
| `mode` | `resize` | Default resize method in the panel: `resize`, `cropResize` or `html`. |
| `lock_ratio` | `true` | Keeps the aspect ratio by default. |

Changes are saved to `user/config/plugins/image-redim.yaml`.

## How it works

Admin 2 is a JavaScript single-page application. It does not load plugin CSS and JS through Twig,
as the classic admin did. Image Redim therefore registers an invisible **floating widget**
through the `onApiFloatingWidgets` event, with `autoLoad: true` and `showFab: false`.
The widget is scoped with `routes: ['/pages']`, so Admin 2 only loads
`admin-next/widgets/image-redim.js` on the Pages screens.
The interface strings are translated server-side from `languages.yaml`, in the user's admin
language, and passed to the script in the widget `config`. Errors are shown with Admin 2 toasts.

That script:

- attaches to the CodeMirror 6 editors that Admin 2 exposes (`.cm-editor`, `__cmView`);
- attaches to Editor Pro (TipTap), whose editor is reachable from its `.ProseMirror` element;
- detects Markdown images under the mouse or the text cursor, or the image under the mouse in Editor Pro;
- finds the image file in the page media list provided by Admin 2 to show a preview;
- rewrites the image destination through the editor API, so undo (Ctrl+Z) works.
  In Editor Pro, it changes the image's Markdown source (`data-src`), then asks Editor Pro's
  `/editor-pro/resolve` API for the new image to show in the editor.

The plugin does nothing on the public site. Image processing is done by Grav's own media actions.

```
image-redim/
├── admin-next/widgets/image-redim.js   # editor integration (browser side)
├── blueprints.yaml                     # plugin definition and settings form
├── image-redim.php                     # registers the widget (server side)
├── image-redim.yaml                    # default settings
├── languages.yaml                      # English and French translations
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Limitations

- Supported editors: the default Admin 2 Markdown editor (CodeMirror) and **Editor Pro**.
  Editor Pro's raw Markdown mode is not supported; use the visual mode.
- The panel preview works for images attached to the page. For external images, you can still type
  the size by hand.

## Troubleshooting

Open the browser console (F12). You should see:

```
[Image Redim] loaded
[Image Redim] editor detected
```

With Editor Pro, the second line is `[Image Redim] editor detected (Editor Pro)`.

- **No message:** the plugin is not loaded. Check that it is enabled, clear the cache, then open the **Pages** list
  and the page from there.
- **Only the first message:** no supported editor was found on the page.

## Translations

English and French are included in `languages.yaml`. To add a language, copy the `en:` block,
change the code (for example `de:`) and translate the values. Pull requests are welcome.

## License

MIT — © 2026 Enkirche. See [LICENSE](LICENSE).

[Report an issue](https://github.com/manubarnum/grav-plugin-image-redim/issues)
