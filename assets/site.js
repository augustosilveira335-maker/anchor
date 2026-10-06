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

  /* mostrador do mês */
  function mostrador(el) {
    if (!A) return;
    var a = hoje.getFullYear(), m = hoje.getMonth(), n = new Date(a, m + 1, 0).getDate();
    var itens = A.itensDoMes(a, m), venc = {};
    itens.forEach(function (it) { if (it.data.getMonth() === m) venc[it.data.getDate()] = 1; });
    var cx = 180, cy = 180, R1 = 150, R2 = 164, s = '';
    s += '<circle class="aro" cx="180" cy="180" r="172"/><circle class="aro" cx="180" cy="180" r="128"/>';
    for (var i = 1; i <= n; i++) {
      var ang = ((i - 1) / n) * 2 * Math.PI - Math.PI / 2, dt = new Date(a, m, i), w = dt.getDay();
      var c = Math.cos(ang), sn = Math.sin(ang), v = venc[i];
      var r1 = v ? R1 - 8 : R1, cls = 'tick' + (v ? ' venc' : (w === 0 || w === 6) ? ' fds' : '') + (i < hoje.getDate() && !v ? ' passou' : '');
      s += '<line class="' + cls + '" x1="' + (cx + c * r1).toFixed(1) + '" y1="' + (cy + sn * r1).toFixed(1) + '" x2="' + (cx + c * R2).toFixed(1) + '" y2="' + (cy + sn * R2).toFixed(1) + '"/>';
      if (v || i === 1 || i % 5 === 0) s += '<text class="rot' + (v ? ' venc' : '') + '" x="' + (cx + c * 182).toFixed(1) + '" y="' + (cy + sn * 182).toFixed(1) + '">' + dd(i) + '</text>';
    }
    var frac = (hoje.getDate() - 1) / n, C = 2 * Math.PI * 128;
    s += '<circle class="arco" cx="180" cy="180" r="128" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '" transform="rotate(-90 180 180)"/>';
    s += '<line class="agulha" x1="180" y1="180" x2="180" y2="40" style="transform:rotate(0deg)"/><circle cx="180" cy="180" r="4" fill="#F4F1EA"/>';
    var svg = el.querySelector('svg'); svg.innerHTML = s;
    var prox = A.proximos(hoje, 12), g = agrupa(prox)[0];
    var cen = el.querySelector('.centro');
    if (g) cen.innerHTML = '<small>' + (g.dias <= 1 ? 'próximo vencimento' : 'faltam') + '</small><strong>' + (g.dias <= 1 ? curta(g.data) : g.dias) + '</strong><span>' + (g.dias <= 1 ? quando(g.dias) + ' · ' : 'dias para ') + nomes(g.nomes) + '</span>';
    requestAnimationFrame(function () { setTimeout(function () {
      svg.querySelector('.arco').style.strokeDashoffset = (C * (1 - frac)).toFixed(1);
      svg.querySelector('.agulha').style.transform = 'rotate(' + (frac * 360).toFixed(2) + 'deg)';
    }, reduz ? 0 : 250); });
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
