/*!
 * AvisPro Bénin — widget d'avis à intégrer sur le site d'une entreprise.
 * <div data-avispro="slug-de-l-entreprise"></div>
 * <script src="https://…/widget.js" async></script>
 */
(function () {
  var script = document.currentScript || document.querySelector('script[src*="widget.js"]')
  var root = script ? script.src.replace(/widget\.js.*$/, '') : ''

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] })
  }
  function stars(n) {
    var out = ''
    for (var i = 1; i <= 5; i++) out += '<span style="color:' + (i <= Math.round(n) ? '#f59e0b' : '#d1d5db') + '">★</span>'
    return out
  }

  function render(el, d) {
    var html = '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:420px;border:1px solid #e5e7eb;border-radius:16px;padding:18px;background:#fff;color:#111827;box-shadow:0 4px 18px rgba(0,0,0,.06)">'
    html += '<div style="display:flex;align-items:center;gap:12px"><div style="font-size:34px;font-weight:800;line-height:1">' + (d.note_moyenne ? String(d.note_moyenne).replace('.', ',') : '—') + '</div>'
    html += '<div><div style="font-size:18px">' + stars(d.note_moyenne || 0) + '</div><div style="font-size:12px;color:#6b7280">' + d.avis_count + ' avis · ' + esc(d.nom) + '</div></div></div>'
    d.avis.forEach(function (a) {
      html += '<div style="border-top:1px solid #f3f4f6;margin-top:12px;padding-top:10px"><div style="font-size:13px"><b>' + esc(a.auteur) + '</b> ' + stars(a.note) + (a.verifie ? ' <span style="color:#059669;font-size:11px;font-weight:700">✓ vérifié</span>' : '') + '</div>'
      html += '<div style="font-size:13px;color:#374151;margin-top:3px">' + esc(a.commentaire.length > 140 ? a.commentaire.slice(0, 140) + '…' : a.commentaire) + '</div></div>'
    })
    html += '<a href="' + root + '#/e/' + encodeURIComponent(d.slug) + '" target="_blank" rel="noopener" style="display:block;margin-top:14px;text-align:center;font-size:13px;font-weight:700;color:#be123c;text-decoration:none">Voir tous les avis sur AvisPro ↗</a></div>'
    el.innerHTML = html
  }

  function init() {
    var nodes = document.querySelectorAll('[data-avispro]')
    Array.prototype.forEach.call(nodes, function (el) {
      var slug = el.getAttribute('data-avispro')
      fetch(root + 'api/widget/' + encodeURIComponent(slug), { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json() })
        .then(function (d) { render(el, d) })
        .catch(function () { el.innerHTML = '<span style="font:13px sans-serif;color:#6b7280">Avis indisponibles pour le moment.</span>' })
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init()
})()
