(function () {
  var d = document, H = d.documentElement;
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var A = window.AgendaFiscal;
  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function dd(n) { return String(n).padStart(2, '0'); }
  function curta(dt) { return dd(dt.getDate()) + ' ' + MES[dt.getMonth()]; }
  function quando(n) { return n === 0 ? 'hoje' : n === 1 ? 'amanhã' : 'em ' + n + ' dias'; }
  var hoje = new Date(); hoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  /* cabeçalho */
  var topo = d.querySelector('.topo');
  function rola() { if (topo) topo.classList.toggle('rolou', scrollY > 8); }
  addEventListener('scroll', rola, { passive: true }); rola();
  var abre = d.querySelector('.abre'), menu = d.getElementById('menu');
  if (abre && menu) abre.addEventListener('click', function () {
    var on = abre.getAttribute('aria-expanded') !== 'true';
    abre.setAttribute('aria-expanded', String(on)); menu.classList.toggle('aberto', on);
  });

  /* revelação */
  if ('IntersectionObserver' in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    d.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else d.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });

  /* agrupa itens com a mesma data */
  function agrupa(lista) {
    var g = [];
    lista.forEach(function (it) {
      var u = g[g.length - 1];
      if (u && +u.data === +it.data && u.nota === it.nota) { u.nomes.push(it.nome); }
      else g.push({ data: it.data, dias: it.dias, nomes: [it.nome], nota: it.nota, quem: it.quem });
    });
    return g;
  }
  function nomes(arr) { return arr.length > 1 ? arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1] : arr[0]; }

  /* mostrador do mês: relógio de ouro */
  function mostrador(el) {
    if (!A) return;
    var a = hoje.getFullYear(), m = hoje.getMonth(), n = new Date(a, m + 1, 0).getDate();
    var itens = A.itensDoMes(a, m), venc = {};
    itens.forEach(function (it) { if (it.data.getMonth() === m) venc[it.data.getDate()] = 1; });
    var cx = 180, cy = 180, s = '';
    s += '<defs><radialGradient id="faceG" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1F3556"/><stop offset=".6" stop-color="#11203A"/><stop offset="1" stop-color="#0A1422"/></radialGradient>' +
      '<linearGradient id="ouroAro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBEFC4"/><stop offset=".25" stop-color="#D9B24C"/><stop offset=".5" stop-color="#8E6A14"/><stop offset=".72" stop-color="#F0D488"/><stop offset="1" stop-color="#A87F1F"/></linearGradient>' +
      '<linearGradient id="ouroLinha" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A87F1F"/><stop offset=".5" stop-color="#F3DC9A"/><stop offset="1" stop-color="#D4AF37"/></linearGradient></defs>';
    s += '<circle cx="180" cy="180" r="178" fill="none" stroke="url(#ouroAro)" stroke-width="9"/>';
    s += '<circle cx="180" cy="180" r="172" fill="url(#faceG)"/>';
    s += '<circle cx="180" cy="180" r="166" fill="none" stroke="rgba(243,220,154,.28)" stroke-width="1"/>';
    s += '<circle cx="180" cy="180" r="104" fill="none" stroke="rgba(243,220,154,.12)" stroke-width="1"/>';
    for (var i = 1; i <= n; i++) {
      var ang = ((i - 1) / n) * 2 * Math.PI - Math.PI / 2, dt = new Date(a, m, i), w = dt.getDay();
      var c = Math.cos(ang), sn = Math.sin(ang), v = venc[i];
      var r1 = v ? 136 : 150, r2 = 162;
      var cls = 'tick' + (v ? ' venc' : (w === 0 || w === 6) ? ' fds' : '') + (i < hoje.getDate() && !v ? ' passou' : '');
      s += '<line class="' + cls + '" x1="' + (cx + c * r1).toFixed(1) + '" y1="' + (cy + sn * r1).toFixed(1) + '" x2="' + (cx + c * r2).toFixed(1) + '" y2="' + (cy + sn * r2).toFixed(1) + '"/>';
      if (v || i === 1 || i % 5 === 0) s += '<text class="rot' + (v ? ' venc' : '') + '" x="' + (cx + c * (v ? 121 : 135)).toFixed(1) + '" y="' + (cy + sn * (v ? 121 : 135)).toFixed(1) + '">' + dd(i) + '</text>';
    }
    var frac = (hoje.getDate() - 1) / n, C = 2 * Math.PI * 104;
    s += '<circle class="arco" cx="180" cy="180" r="104" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '" transform="rotate(-90 180 180)"/>';
    s += '<g class="agulha" style="transform:rotate(0deg)"><path d="M180 12 L185.5 24 L182.2 70 L177.8 70 L174.5 24 Z" fill="url(#ouroAro)"/><circle cx="180" cy="20" r="2.2" fill="#0A1422"/></g>';
    var svg = el.querySelector('svg'); svg.innerHTML = s;
    var prox = A.proximos(hoje, 12), g = agrupa(prox)[0];
    var cen = el.querySelector('.centro');
    if (g) cen.innerHTML = '<small>' + (g.dias <= 1 ? 'próximo vencimento' : 'faltam') + '</small><strong>' + (g.dias <= 1 ? curta(g.data) : g.dias) + '</strong><span>' + (g.dias <= 1 ? quando(g.dias) + ' · ' : 'dias para ') + nomes(g.nomes) + '</span>';
    var vai = function () {
      svg.querySelector('.arco').style.strokeDashoffset = (C * (1 - frac)).toFixed(1);
      svg.querySelector('.agulha').style.transform = 'rotate(' + (frac * 360).toFixed(2) + 'deg)';
    };
    if (reduz || !('IntersectionObserver' in window)) { vai(); return; }
    var ob = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { setTimeout(vai, 200); ob.disconnect(); } }, { threshold: .35 });
    ob.observe(el);
  }

  function listaProx(el, filtro, n) {
    if (!A) return;
    var prox = A.proximos(hoje, 30).filter(function (it) { return !filtro || filtro.indexOf(it.id) > -1; });
    var g = agrupa(prox).slice(0, n || 4), h = '';
    g.forEach(function (it) {
      h += '<li><span class="dt">' + curta(it.data) + '<i>' + DIAS[it.data.getDay()] + '</i></span><span><b>' + nomes(it.nomes) + '</b>' +
        (it.nota ? '<small class="regra">' + it.nota + '</small>' : '<small>' + it.quem + '</small>') + '</span><span class="dd">' + quando(it.dias) + '</span></li>';
    });
    el.innerHTML = h;
  }

  d.querySelectorAll('[data-mostrador]').forEach(mostrador);
  d.querySelectorAll('[data-prox]').forEach(function (el) {
    var f = el.getAttribute('data-prox'); listaProx(el, f ? f.split(',') : null, +el.getAttribute('data-n') || 4);
  });
  d.querySelectorAll('[data-hoje]').forEach(function (el) {
    el.textContent = 'calculado em ' + dd(hoje.getDate()) + '/' + dd(hoje.getMonth() + 1) + '/' + hoje.getFullYear();
  });

  /* agenda completa por mês */
  var ag = d.querySelector('[data-agenda-completa]');
  if (ag && A) {
    var abas = ag.querySelector('.agenda-meses'), tab = ag.querySelector('.agenda-tab'), meses = [];
    for (var k = 0; k < 3; k++) { var a = hoje.getFullYear() + Math.floor((hoje.getMonth() + k) / 12), m = (hoje.getMonth() + k) % 12; meses.push([a, m]); }
    function mostra(i) {
      abas.querySelectorAll('button').forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); });
      var it = A.itensDoMes(meses[i][0], meses[i][1]).sort(function (x, y) { return x.data - y.data; }), h = '';
      it.forEach(function (x) {
        h += '<li class="' + (x.data < hoje ? 'passou' : '') + '"><span class="dt">' + curta(x.data) + '<i>' + DIAS[x.data.getDay()] + '</i></span><span><b>' + x.nome + '</b><span>' + x.quem + (x.comp ? ' · competência de ' + x.comp : '') + '</span></span><span class="regra">' + (x.nota || '') + '</span></li>';
      });
      tab.innerHTML = h;
    }
    meses.forEach(function (mm, i) {
      var b = d.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.textContent = A.NOMES[mm[1]] + ' ' + mm[0]; b.addEventListener('click', function () { mostra(i); }); abas.appendChild(b);
    });
    mostra(0);
  }

  /* régua da reforma */
  d.querySelectorAll('[data-regua]').forEach(function (r) {
    var bs = [].slice.call(r.querySelectorAll('.regua-anos button')), ps = [].slice.call(r.querySelectorAll('[data-ano-det]'));
    var prog = r.querySelector('.regua-prog');
    function vai(i) {
      bs.forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); b.classList.toggle('feito', j < i); });
      ps.forEach(function (p, j) { p.hidden = i !== j; });
      if (prog) prog.style.width = (bs[i].offsetLeft + 4) + 'px';
    }
    bs.forEach(function (b, i) { b.addEventListener('click', function () { vai(i); }); });
    var ini = +r.getAttribute('data-ini') || 0; vai(ini);
    addEventListener('resize', function () { var i = bs.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; }); if (i > -1) vai(i); });
  });

  /* formulário que vira mensagem de WhatsApp */
  d.querySelectorAll('[data-form-wa]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var dados = new FormData(f), linhas = ['Olá, Anchor! Vim pelo site.'];
      var rot = { nome: 'Nome', empresa: 'Empresa', assunto: 'Assunto', regime: 'Regime', funcionarios: 'Funcionários', cidade: 'Cidade', msg: 'Mensagem' };
      Object.keys(rot).forEach(function (k) { var v = (dados.get(k) || '').toString().trim(); if (v) linhas.push(rot[k] + ': ' + v); });
      window.open('https://wa.me/' + f.getAttribute('data-form-wa') + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
    });
  });
})();
