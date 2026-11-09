/**
 * Image Redim — Admin 2 (Grav 2)
 *
 * Chargé par Admin 2 comme « widget flottant » invisible (autoLoad, showFab:false).
 * S'accroche aux éditeurs CodeMirror 6 de l'admin (élément .cm-editor, dont
 * Admin 2 expose la vue sur la propriété __cmView).
 *
 * - Survol (ou curseur) sur une image Markdown ![alt](photo.jpg)
 *   -> bouton « ⤡ Redimensionner »
 * - Panneau : aperçu avec poignée, largeur / hauteur, proportions, méthode
 * - « Appliquer » réécrit l'image : ![alt](photo.jpg?resize=800,0)
 */
(function () {
  'use strict';

  // Admin 2 attend qu'un élément personnalisé soit défini pour ce widget
  var TAG = window.__GRAV_WIDGET_TAG || 'grav-image-redim--widget';
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends HTMLElement {});
  }
  if (window.__IMAGE_REDIM_LOADED__) return;
  window.__IMAGE_REDIM_LOADED__ = true;

  var CFG = { mode: 'resize', lock_ratio: true };
  // Accepte ![alt](photo.jpg), ![alt](photo.jpg "titre") et ![alt](<nom avec espaces.jpg>)
  var IMG_RE = /!\[([^\]]*)\]\((<[^>\n]*>|[^)\s]+)((?:\s+"[^"]*")?)\)/g;
  var SIZE_KEYS = ['resize', 'cropResize', 'forceResize', 'width', 'height'];

  /* ---------------- Configuration (lue depuis la déclaration du widget) ---------------- */

  function loadConfig() {
    try {
      var base = (window.__GRAV_API_SERVER_URL || '') + (window.__GRAV_API_PREFIX || '/api/v1');
      var headers = {};
      if (window.__GRAV_API_TOKEN) headers['X-API-Token'] = window.__GRAV_API_TOKEN;
      fetch(base + '/floating-widgets', { headers: headers, credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (json) {
          if (!json) return;
          var list = Array.isArray(json) ? json : (json.data || []);
          list.forEach(function (w) {
            if (w && w.id === 'image-redim' && w.config) Object.assign(CFG, w.config);
          });
        })
        .catch(function () {});
    } catch (e) { /* valeurs par défaut */ }
  }

  /* ---------------- Styles ---------------- */

  var css = '' +
    '.ir-trigger{position:fixed;z-index:2147483000;padding:4px 10px;font:600 12px/1.4 system-ui,sans-serif;color:#fff;background:#3d424e;border:0;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer}' +
    '.ir-trigger:hover{background:#2b8be6}' +
    '.ir-panel{position:fixed;z-index:2147483001;width:320px;padding:12px;font:13px/1.4 system-ui,sans-serif;color:#222;background:#fff;border:1px solid #d5d8de;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.25)}' +
    'html.dark .ir-panel{color:#e6e6e6;background:#1f2228;border-color:#3a3f48}' +
    '.ir-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}' +
    '.ir-title{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ir-close{border:0;background:none;font-size:20px;line-height:1;cursor:pointer;color:inherit;opacity:.6}' +
    '.ir-stage{position:relative;height:220px;overflow:hidden;border-radius:4px;background:repeating-conic-gradient(#e9e9e9 0 25%,#fafafa 0 50%) 0 0/16px 16px}' +
    '.ir-box{position:absolute;top:0;left:0;outline:2px solid #2b8be6}' +
    '.ir-box img{display:block;width:100%;height:100%;object-fit:fill;pointer-events:none;user-select:none}' +
    '.ir-noimg{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#666;font-size:12px;background:rgba(43,139,230,.08);text-align:center;padding:4px;box-sizing:border-box}' +
    '.ir-handle{position:absolute;right:-7px;bottom:-7px;width:14px;height:14px;background:#2b8be6;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.2);cursor:nwse-resize;touch-action:none}' +
    '.ir-row{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}' +
    '.ir-row label{display:flex;gap:4px;align-items:center;margin:0}' +
    '.ir-row input[type=number]{width:72px;padding:3px 5px;color:inherit;background:transparent;border:1px solid #999;border-radius:4px}' +
    '.ir-row select{flex:1;padding:3px;color:inherit;background:transparent;border:1px solid #999;border-radius:4px}' +
    'html.dark .ir-row select option{background:#1f2228}' +
    '.ir-info{margin-top:6px;font-size:11px;opacity:.7;min-height:1em}' +
    '.ir-actions{display:flex;justify-content:space-between;gap:8px;margin-top:10px}' +
    '.ir-actions button{padding:5px 10px;border-radius:4px;border:1px solid #aaa;background:transparent;color:inherit;cursor:pointer}' +
    '.ir-actions .ir-apply{background:#2b8be6;border-color:#2b8be6;color:#fff;font-weight:600}';
  var style = document.createElement('style');
  style.id = 'image-redim-style';
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------------- Utilitaires Markdown ---------------- */

  function parseUrl(url) {
    var q = url.indexOf('?');
    var base = q === -1 ? url : url.slice(0, q);
    var params = [];
    if (q !== -1) {
      url.slice(q + 1).split('&').forEach(function (p) {
        if (!p) return;
        var i = p.indexOf('=');
        params.push(i === -1 ? [p, null] : [p.slice(0, i), p.slice(i + 1)]);
      });
    }
    return { base: base, params: params };
  }

  function currentSize(params) {
    var w = null, h = null, mode = null;
    params.forEach(function (kv) {
      if ((kv[0] === 'resize' || kv[0] === 'cropResize' || kv[0] === 'forceResize') && kv[1]) {
        var s = kv[1].split(',');
        w = parseInt(s[0], 10) || null; h = parseInt(s[1], 10) || null;
        mode = kv[0] === 'cropResize' ? 'cropResize' : 'resize';
      } else if (kv[0] === 'width') { w = parseInt(kv[1], 10) || null; mode = mode || 'html'; }
      else if (kv[0] === 'height') { h = parseInt(kv[1], 10) || null; mode = mode || 'html'; }
    });
    return { w: w, h: h, mode: mode };
  }

  function buildUrl(parsed, w, h, mode) {
    var params = parsed.params.filter(function (kv) { return SIZE_KEYS.indexOf(kv[0]) === -1; });
    if (w || h) {
      if (mode === 'html') {
        if (w) params.push(['width', String(w)]);
        if (h) params.push(['height', String(h)]);
      } else if (!h) {
        // Largeur seule = hauteur proportionnelle. Ne jamais écrire « ,0 » :
        // la bibliothèque d'images de Grav 2 le prend pour une hauteur nulle.
        params.push([mode, String(w)]);
      } else if (w) {
        params.push([mode, w + ',' + h]);
      }
    }
    var qs = params.map(function (kv) { return kv[1] === null ? kv[0] : kv[0] + '=' + kv[1]; }).join('&');
    return parsed.base + (qs ? '?' + qs : '');
  }

  function fileName(path) {
    try { return decodeURIComponent(path.split('?')[0].split('#')[0].split('/').pop() || ''); }
    catch (e) { return path.split('/').pop(); }
  }

  /* URL réelle de l'image : médias de la page fournis par Admin 2 */
  function resolveImageSrc(mdPath) {
    var clean = mdPath.split('?')[0];
    if (/^(https?:)?\/\//.test(clean)) return clean;
    var name = fileName(clean);
    try {
      var media = typeof window.__GRAV_PAGE_MEDIA === 'function' ? window.__GRAV_PAGE_MEDIA() : [];
      for (var i = 0; i < media.length; i++) {
        if (media[i].filename === name) return media[i].url || media[i].thumb;
      }
    } catch (e) {}
    if (clean.charAt(0) === '/') return (window.__GRAV_API_SERVER_URL || '') + clean;
    return null;
  }

  /* ---------------- CodeMirror 6 ---------------- */

  function imageAt(view, pos) {
    if (pos == null) return null;
    var line = view.state.doc.lineAt(pos), off = pos - line.from, m;
    IMG_RE.lastIndex = 0;
    while ((m = IMG_RE.exec(line.text))) {
      if (off >= m.index && off <= m.index + m[0].length) {
        var angle = m[2].charAt(0) === '<';
        return {
          from: line.from + m.index, to: line.from + m.index + m[0].length,
          text: m[0], alt: m[1], url: angle ? m[2].slice(1, -1) : m[2], angle: angle, title: m[3]
        };
      }
    }
    return null;
  }

  function imageAtCursor(view) { return imageAt(view, view.state.selection.main.head); }

  function replaceImage(view, img, newUrl) {
    // Chevrons conservés (ou ajoutés) si le nom contient des espaces
    var dest = (img.angle || /\s/.test(newUrl)) ? '<' + newUrl + '>' : newUrl;
    var md = '![' + img.alt + '](' + dest + img.title + ')';
    var doc = view.state.doc, from = img.from, to = img.to;
    // Le texte a pu bouger (édition collaborative, frappe) : on le retrouve
    if (doc.sliceString(from, to) !== img.text) {
      var all = doc.toString(), idx = all.indexOf(img.text, Math.max(0, from - 2000));
      if (idx === -1) idx = all.indexOf(img.text);
      if (idx === -1) { alert('Image Redim : l\'image a été modifiée entre-temps, réessayez.'); return; }
      from = idx; to = idx + img.text.length;
    }
    view.dispatch({ changes: { from: from, to: to, insert: md }, selection: { anchor: from + md.length } });
    view.focus();
  }

  /* ---------------- Bouton flottant ---------------- */

  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ir-trigger';
  trigger.textContent = '⤡ Redimensionner';
  trigger.style.display = 'none';
  var triggerCtx = null, hideTimer = null;

  trigger.addEventListener('mousedown', function (e) { e.preventDefault(); });
  trigger.addEventListener('click', function () { if (triggerCtx) openPanel(triggerCtx.view, triggerCtx.img); });
  trigger.addEventListener('mouseleave', function () { hideTrigger(400); });

  function showTrigger(view, img) {
    clearTimeout(hideTimer);
    var c = view.coordsAtPos(img.to) || view.coordsAtPos(img.from);
    if (!c) return;
    trigger.style.left = Math.min(c.right + 8, window.innerWidth - 150) + 'px';
    trigger.style.top = (c.top - 4) + 'px';
    trigger.style.display = 'block';
    triggerCtx = { view: view, img: img };
  }

  function hideTrigger(delay) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (panel || trigger.matches(':hover')) return;
      trigger.style.display = 'none';
      triggerCtx = null;
    }, delay || 0);
  }

  function updateFromCursor(view) {
    var img = imageAtCursor(view);
    if (img) showTrigger(view, img); else if (!trigger.matches(':hover')) hideTrigger(0);
  }

  var hooked = new WeakSet();
  function hookEditor(el) {
    var view = el.__cmView;
    if (!view || hooked.has(view)) return;
    hooked.add(view);

    el.addEventListener('mousemove', function (e) {
      var pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      var img = imageAt(view, pos);
      if (img) showTrigger(view, img);
      else if (!imageAtCursor(view)) hideTrigger(400);
    });
    el.addEventListener('mouseleave', function () { if (!imageAtCursor(view)) hideTrigger(400); });
    el.addEventListener('keyup', function () { updateFromCursor(view); });
    el.addEventListener('mouseup', function () { setTimeout(function () { updateFromCursor(view); }, 0); });
    if (view.scrollDOM) view.scrollDOM.addEventListener('scroll', function () {
      if (triggerCtx && triggerCtx.view === view) showTrigger(view, triggerCtx.img);
    });
    console.info('[Image Redim] éditeur détecté');
  }

  /* ---------------- Panneau ---------------- */

  var panel = null;

  function closePanel() {
    if (panel) { panel.remove(); panel = null; }
    document.removeEventListener('keydown', onKey, true);
    hideTrigger(0);
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); closePanel(); } }

  function openPanel(view, img) {
    if (panel) { panel.remove(); panel = null; }
    var parsed = parseUrl(img.url);
    var cur = currentSize(parsed.params);
    var natW = null, natH = null, ratio = null;
    var state = { w: cur.w, h: cur.h, mode: cur.mode || CFG.mode, lock: !!CFG.lock_ratio };

    panel = document.createElement('div');
    panel.className = 'ir-panel';
    panel.innerHTML =
      '<div class="ir-head"><span class="ir-title"></span><button type="button" class="ir-close" title="Fermer">×</button></div>' +
      '<div class="ir-stage"><div class="ir-box"><span class="ir-handle" title="Glisser pour redimensionner"></span></div></div>' +
      '<div class="ir-row">' +
        '<label>L <input type="number" min="1" class="ir-w"></label>' +
        '<label>H <input type="number" min="1" class="ir-h"></label>' +
        '<label><input type="checkbox" class="ir-lock"> Proportions</label>' +
      '</div>' +
      '<div class="ir-row"><select class="ir-mode">' +
        '<option value="resize">resize (Grav génère l\'image)</option>' +
        '<option value="cropResize">cropResize (tient dans le cadre)</option>' +
        '<option value="html">html (attributs width/height)</option>' +
      '</select></div>' +
      '<div class="ir-info"></div>' +
      '<div class="ir-actions"><button type="button" class="ir-reset">Taille d\'origine</button>' +
      '<button type="button" class="ir-apply">Appliquer</button></div>';
    document.body.appendChild(panel);

    var $ = function (s) { return panel.querySelector(s); };
    $('.ir-title').textContent = fileName(img.url) || 'Image';
    var stage = $('.ir-stage'), box = $('.ir-box'), handle = $('.ir-handle');
    var inW = $('.ir-w'), inH = $('.ir-h'), lock = $('.ir-lock'), modeSel = $('.ir-mode'), info = $('.ir-info');
    lock.checked = state.lock;
    modeSel.value = state.mode;

    var tr = trigger.getBoundingClientRect();
    var left = Math.max(8, Math.min(tr.left, window.innerWidth - 340));
    var top = tr.bottom + 6;
    if (top + 420 > window.innerHeight) top = Math.max(8, tr.top - 426);
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';

    var scale = 1;
    function render() {
      inW.value = state.w || '';
      inH.value = state.h || '';
      var w = state.w || natW || 200;
      var h = state.h || (ratio && state.w ? Math.round(state.w / ratio) : natH) || 150;
      var maxW = stage.clientWidth - 12, maxH = stage.clientHeight - 12;
      scale = Math.min(1, maxW / Math.max(natW || w, w), maxH / Math.max(natH || h, h));
      box.style.width = Math.round(w * scale) + 'px';
      box.style.height = Math.round(h * scale) + 'px';
      var txt = natW ? 'Original : ' + natW + ' × ' + natH + ' px' : 'Dimensions d\'origine inconnues';
      if (state.w || state.h) txt += ' → ' + (state.w || 'auto') + ' × ' + (state.h || 'auto');
      if (natW && state.w > natW && state.mode !== 'html') txt += ' ⚠ agrandissement';
      info.textContent = txt;
    }
    function setW(w) {
      state.w = w > 0 ? Math.round(w) : null;
      if (state.lock && ratio && state.w) state.h = Math.round(state.w / ratio);
      render();
    }
    function setH(h) {
      state.h = h > 0 ? Math.round(h) : null;
      if (state.lock && ratio && state.h) state.w = Math.round(state.h * ratio);
      render();
    }

    var src = resolveImageSrc(img.url);
    if (src) {
      var im = new Image();
      im.onload = function () {
        natW = im.naturalWidth; natH = im.naturalHeight; ratio = natW / natH;
        if (!state.w && !state.h) { state.w = natW; state.h = natH; }
        else if (state.w && !state.h) state.h = Math.round(state.w / ratio);
        else if (state.h && !state.w) state.w = Math.round(state.h * ratio);
        render();
      };
      im.onerror = function () { render(); };
      im.src = src;
      box.insertBefore(im, handle);
    } else {
      var ph = document.createElement('div');
      ph.className = 'ir-noimg';
      ph.textContent = 'Aperçu indisponible (image hors médias de la page)';
      box.insertBefore(ph, handle);
      if (state.w && state.h) ratio = state.w / state.h;
    }
    render();

    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      var sx = e.clientX, sy = e.clientY, sw = box.offsetWidth, sh = box.offsetHeight;
      function move(ev) {
        var nw = Math.max(10, sw + ev.clientX - sx), nh = Math.max(10, sh + ev.clientY - sy);
        if (state.lock && ratio) setW(nw / scale);
        else { state.w = Math.round(nw / scale); state.h = Math.round(nh / scale); render(); }
      }
      function up() { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); }
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
    });

    inW.addEventListener('input', function () { setW(parseInt(inW.value, 10)); });
    inH.addEventListener('input', function () { setH(parseInt(inH.value, 10)); });
    lock.addEventListener('change', function () {
      state.lock = lock.checked;
      if (state.lock && state.w && state.h && !natW) ratio = state.w / state.h;
      if (state.lock && state.w) setW(state.w);
    });
    modeSel.addEventListener('change', function () { state.mode = modeSel.value; render(); });

    $('.ir-reset').addEventListener('click', function () {
      replaceImage(view, img, buildUrl(parsed, null, null, state.mode));
      closePanel();
    });
    $('.ir-apply').addEventListener('click', function () {
      var w = state.w, h = state.h;
      // Proportions conservées : la largeur seule suffit (ex. resize=800)
      if (state.mode !== 'html' && state.lock && w) h = null;
      // Grav exige une largeur : on la déduit de la hauteur si besoin
      if (state.mode !== 'html' && !w && h && ratio) w = Math.round(h * ratio);
      replaceImage(view, img, buildUrl(parsed, w, h, state.mode));
      closePanel();
    });
    $('.ir-close').addEventListener('click', closePanel);
    document.addEventListener('keydown', onKey, true);
  }

  document.addEventListener('mousedown', function (e) {
    if (panel && !panel.contains(e.target) && e.target !== trigger) closePanel();
  }, true);

  /* ---------------- Initialisation ---------------- */

  function scan() {
    document.querySelectorAll('.cm-editor').forEach(hookEditor);
    // Éditeur retiré (navigation dans l'admin) : on masque le bouton
    if (triggerCtx && !document.body.contains(triggerCtx.view.dom)) {
      trigger.style.display = 'none'; triggerCtx = null;
      if (panel) closePanel();
    }
  }

  document.body.appendChild(trigger);
  loadConfig();
  scan();
  var t = null;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 150); })
    .observe(document.body, { childList: true, subtree: true });
  console.info('[Image Redim] chargé');
})();
