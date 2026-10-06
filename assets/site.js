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
    d.querySelectorAll('.rv,.foto-rv').forEach(function (el) { io.observe(el); });
  } else d.querySelectorAll('.rv,.foto-rv').forEach(function (el) { el.classList.add('in'); });

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

  /* mostrador do mês: cronômetro de traço fino */
  function mostrador(el) {
    if (!A) return;
    var a = hoje.getFullYear(), m = hoje.getMonth(), n = new Date(a, m + 1, 0).getDate();
    var itens = A.itensDoMes(a, m), venc = {};
    itens.forEach(function (it) { if (it.data.getMonth() === m) venc[it.data.getDate()] = 1; });
    var cx = 180, cy = 180, s = '';
    s += '<circle cx="180" cy="180" r="178" fill="none" stroke="rgba(244,239,230,.55)" stroke-width="1"/>';
    s += '<circle cx="180" cy="180" r="171" fill="none" stroke="rgba(244,239,230,.18)" stroke-width="1"/>';
    s += '<circle cx="180" cy="180" r="104" fill="none" stroke="rgba(244,239,230,.1)" stroke-width="1"/>';
    for (var q = 0; q < 60; q++) {
      var aq = q / 60 * 2 * Math.PI, r0 = q % 5 ? 174 : 172;
      s += '<line x1="' + (cx + Math.cos(aq) * r0).toFixed(1) + '" y1="' + (cy + Math.sin(aq) * r0).toFixed(1) + '" x2="' + (cx + Math.cos(aq) * 178).toFixed(1) + '" y2="' + (cy + Math.sin(aq) * 178).toFixed(1) + '" stroke="rgba(244,239,230,.3)" stroke-width=".7"/>';
    }
    for (var i = 1; i <= n; i++) {
      var ang = ((i - 1) / n) * 2 * Math.PI - Math.PI / 2, dt = new Date(a, m, i), w = dt.getDay();
      var c = Math.cos(ang), sn = Math.sin(ang), v = venc[i];
      var r1 = v ? 138 : 152, r2 = 164;
      var cls = 'tick' + (v ? ' venc' : (w === 0 || w === 6) ? ' fds' : '') + (i < hoje.getDate() && !v ? ' passou' : '');
      s += '<line class="' + cls + '" x1="' + (cx + c * r1).toFixed(1) + '" y1="' + (cy + sn * r1).toFixed(1) + '" x2="' + (cx + c * r2).toFixed(1) + '" y2="' + (cy + sn * r2).toFixed(1) + '"/>';
      if (v || i === 1 || i % 5 === 0) s += '<text class="rot' + (v ? ' venc' : '') + '" x="' + (cx + c * (v ? 122 : 136)).toFixed(1) + '" y="' + (cy + sn * (v ? 122 : 136)).toFixed(1) + '">' + i + '</text>';
    }
    var frac = (hoje.getDate() - 1) / n, C = 2 * Math.PI * 104;
    s += '<circle class="arco" cx="180" cy="180" r="104" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '" transform="rotate(-90 180 180)"/>';
    s += '<g class="agulha" style="transform:rotate(0deg)"><line x1="180" y1="196" x2="180" y2="14" stroke="#C9AE72" stroke-width="1.2"/><circle cx="180" cy="14" r="3" fill="none" stroke="#C9AE72" stroke-width="1"/></g><circle cx="180" cy="180" r="3.5" fill="#C9AE72"/>';
    var svg = el.querySelector('svg'); svg.innerHTML = s;
    var prox = A.proximos(hoje, 12), g = agrupa(prox)[0];
    var cen = el.querySelector('.centro');
    if (g) cen.innerHTML = '<small>' + (g.dias <= 1 ? 'próximo vencimento' : 'faltam') + '</small><strong>' + (g.dias <= 1 ? curta(g.data) : g.dias) + '</strong><span>' + (g.dias <= 1 ? quando(g.dias) + ', ' : 'dias para ') + nomes(g.nomes) + '</span>';
    var vai = function () {
      svg.querySelector('.arco').style.strokeDashoffset = (C * (1 - frac)).toFixed(1);
      svg.querySelector('.agulha').style.transform = 'rotate(' + (frac * 360).toFixed(2) + 'deg)';
    };
    if (reduz || !('IntersectionObserver' in window)) { vai(); return; }
    var ob = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { setTimeout(vai, 250); ob.disconnect(); } }, { threshold: .35 });
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


  /* títulos palavra por palavra */
  function quebra(el) {
    var i = 0;
    (function anda(no) {
      [].slice.call(no.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var partes = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          partes.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(t)); return; }
            var a = d.createElement('span'), b = d.createElement('span');
            a.className = 'pl'; b.className = 'pli'; b.style.setProperty('--i', i++); b.textContent = t; a.appendChild(b); frag.appendChild(a);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.classList && n.classList.contains('sub')) {
          var a2 = d.createElement('span'), b2 = d.createElement('span');
          a2.className = 'pl pl-sub'; b2.className = 'pli'; b2.style.setProperty('--i', i++);
          n.parentNode.replaceChild(a2, n); b2.appendChild(n); a2.appendChild(b2);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') anda(n);
      });
    })(el);
    el.classList.add('split');
  }
  if (!reduz) d.querySelectorAll('.t1, .t2').forEach(function (el) {
    quebra(el);
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { el.classList.add('in'); }, el.closest('.heroi') ? 350 : 0); o.disconnect(); } }); }, { threshold: .2 });
      o.observe(el);
    } else el.classList.add('in');
  });

  /* abertura: só na primeira visita da sessão */
  var intro = d.querySelector('.intro');
  if (intro) {
    var viu = false; try { viu = sessionStorage.getItem('anchor-intro') === '1'; sessionStorage.setItem('anchor-intro', '1'); } catch (e) {}
    if (viu || reduz) intro.remove();
    else { intro.classList.add('vivo'); setTimeout(function () { intro.classList.add('sai'); }, 1250); setTimeout(function () { intro.remove(); }, 2400); }
  }

  /* rolagem suave no desktop */
  if (window.Lenis && !reduz && matchMedia('(pointer:fine)').matches) {
    var lenis = new Lenis({ lerp: .09, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    d.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { var alvo = d.querySelector(a.getAttribute('href')); if (alvo) { e.preventDefault(); lenis.scrollTo(alvo, { offset: -90 }); } });
    });
  }


  /* painel: contadores, próximo prazo real e animação ao aparecer */
  function contar(el) {
    var fim = +el.getAttribute('data-conta'), pre = el.getAttribute('data-pre') || '';
    if (reduz || !fim) { el.textContent = pre + fim.toLocaleString('pt-BR'); return; }
    var t0 = null;
    (function f(t) { t0 = t0 || t; var p = Math.min(1, (t - t0) / 1600), v = Math.round(fim * (1 - Math.pow(1 - p, 3))); el.textContent = pre + v.toLocaleString('pt-BR'); if (p < 1) requestAnimationFrame(f); })(performance.now());
  }
  if (A) {
    var pz = A.proximos(hoje, 8), g0 = agrupa(pz)[0];
    if (g0) {
      d.querySelectorAll('[data-dash-prazo]').forEach(function (e) { e.textContent = curta(g0.data); });
      d.querySelectorAll('[data-dash-prazo-nome]').forEach(function (e) { e.textContent = nomes(g0.nomes); });
    }
  }
  if ('IntersectionObserver' in window && !reduz) {
    var oc = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-conta')) contar(e.target);
        e.target.querySelectorAll('[data-conta]').forEach(contar);
        oc.unobserve(e.target);
      });
    }, { threshold: .3 });
    d.querySelectorAll('[data-dash], .numeros [data-conta], .il').forEach(function (el) { oc.observe(el); });
  } else d.querySelectorAll('[data-dash], .il').forEach(function (el) { el.classList.add('in'); });

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
