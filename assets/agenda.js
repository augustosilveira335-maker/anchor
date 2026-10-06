/* Agenda fiscal viva · calcula os próximos vencimentos a partir de hoje.
   Regras (fontes no rodapé da página /agenda-fiscal/):
   - Salário: até o 5º dia útil (CLT art. 459 §1º). Sábado conta como dia útil; domingo e feriado nacional não.
   - FGTS (FGTS Digital): dia 20. Sem expediente bancário, antecipa para o dia útil anterior.
   - INSS e IRRF da folha (DCTFWeb): dia 20. Sem expediente bancário, antecipa.
   - DAS do Simples e DAS do MEI: dia 20. Sem expediente bancário, vai para o dia útil seguinte.
   - 13º: 1ª parcela até 30/11, 2ª até 20/12 (antecipa se não for dia útil).
   - DASN-SIMEI: até 31/05. */
(function (g) {
  function pascoa(a) {
    var b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4,
      h = Math.floor((c + 8) / 25), i = Math.floor((c - h + 1) / 3), k = (19 * b + c - e - i + 15) % 30,
      l = Math.floor(d / 4), m = d % 4, n = (32 + 2 * f + 2 * l - k - m) % 7, o = Math.floor((b + 11 * k + 22 * n) / 451),
      mes = Math.floor((k + n - 7 * o + 114) / 31), dia = ((k + n - 7 * o + 114) % 31) + 1;
    return new Date(a, mes - 1, dia);
  }
  function soma(dt, n) { var x = new Date(dt); x.setDate(x.getDate() + n); return x; }
  function chave(dt) { return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate(); }
  var cache = {};
  function feriados(a) {
    if (cache[a]) return cache[a];
    var p = pascoa(a), leg = {}, banc = {};
    [[1, 1, 'Confraternização Universal'], [4, 21, 'Tiradentes'], [5, 1, 'Dia do Trabalho'], [9, 7, 'Independência'],
     [10, 12, 'Nossa Senhora Aparecida'], [11, 2, 'Finados'], [11, 15, 'Proclamação da República'],
     [11, 20, 'Consciência Negra'], [12, 25, 'Natal']].forEach(function (f) { leg[chave(new Date(a, f[0] - 1, f[1]))] = f[2]; });
    leg[chave(soma(p, -2))] = 'Sexta-feira Santa';
    for (var k in leg) banc[k] = leg[k];
    banc[chave(soma(p, -48))] = 'Carnaval'; banc[chave(soma(p, -47))] = 'Carnaval';
    banc[chave(soma(p, 60))] = 'Corpus Christi';
    banc[chave(new Date(a, 11, 31))] = 'Sem expediente bancário';
    return (cache[a] = { leg: leg, banc: banc });
  }
  function bancario(dt) { var w = dt.getDay(); return w !== 0 && w !== 6 && !feriados(dt.getFullYear()).banc[chave(dt)]; }
  function utilSalario(dt) { return dt.getDay() !== 0 && !feriados(dt.getFullYear()).leg[chave(dt)]; }
  function motivo(dt) {
    var w = dt.getDay(), f = feriados(dt.getFullYear()).banc[chave(dt)];
    return f ? f : w === 6 ? 'sábado' : w === 0 ? 'domingo' : '';
  }
  function ajusta(dt, modo) {
    var x = new Date(dt), passo = modo === 'antecipa' ? -1 : 1;
    while (!bancario(x)) x = soma(x, passo);
    return x;
  }
  function quintoUtil(a, m) { var x = new Date(a, m, 1), n = 0; for (;;) { if (utilSalario(x)) { n++; if (n === 5) return x; } x = soma(x, 1); } }
  var NOMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function itensDoMes(a, m) {
    var r = [], comp = NOMES[(m + 11) % 12];
    var d20 = new Date(a, m, 20);
    function regra(base, final, modo) {
      if (+base === +final) return '';
      return '20/' + String(m + 1).padStart(2, '0') + ' é ' + motivo(base) + (modo === 'antecipa' ? ': antecipa' : ': vai para o dia útil seguinte');
    }
    r.push({ id: 'salario', nome: 'Salários', quem: 'Empresas com funcionários', data: quintoUtil(a, m), base: null, nota: '5º dia útil · sábado conta', comp: comp });
    var fg = ajusta(d20, 'antecipa'); r.push({ id: 'fgts', nome: 'FGTS', quem: 'Empresas com funcionários', data: fg, nota: regra(d20, fg, 'antecipa'), comp: comp });
    r.push({ id: 'inss', nome: 'INSS e IRRF da folha', quem: 'Empresas com funcionários', data: fg, nota: regra(d20, fg, 'antecipa'), comp: comp });
    var das = ajusta(d20, 'posterga'); r.push({ id: 'das', nome: 'DAS do Simples Nacional', quem: 'Empresas do Simples', data: das, nota: regra(d20, das, 'posterga'), comp: comp });
    r.push({ id: 'mei', nome: 'DAS do MEI', quem: 'MEI', data: das, nota: regra(d20, das, 'posterga'), comp: comp });
    if (m === 10) { var p1 = new Date(a, 10, 30), d1 = ajusta(p1, 'antecipa'); r.push({ id: 'd13a', nome: '13º salário · 1ª parcela', quem: 'Empresas com funcionários', data: d1, nota: +p1 === +d1 ? '' : '30/11 é ' + motivo(p1) + ': antecipa', comp: '' }); }
    if (m === 11) { var p2 = new Date(a, 11, 20), d2 = ajusta(p2, 'antecipa'); r.push({ id: 'd13b', nome: '13º salário · 2ª parcela', quem: 'Empresas com funcionários', data: d2, nota: +p2 === +d2 ? '' : '20/12 é ' + motivo(p2) + ': antecipa', comp: '' }); }
    if (m === 4) r.push({ id: 'dasn', nome: 'Declaração anual do MEI', quem: 'MEI', data: new Date(a, 4, 31), nota: 'DASN-SIMEI', comp: '' });
    return r;
  }
  function proximos(hoje, n) {
    var h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()), lista = [];
    for (var i = 0; i < 4; i++) {
      var a = h.getFullYear() + Math.floor((h.getMonth() + i) / 12), m = (h.getMonth() + i) % 12;
      itensDoMes(a, m).forEach(function (it) { if (it.data >= h) lista.push(it); });
    }
    lista.sort(function (x, y) { return x.data - y.data; });
    lista.forEach(function (it) { it.dias = Math.round((it.data - h) / 864e5); });
    return lista.slice(0, n || 6);
  }
  g.AgendaFiscal = { proximos: proximos, itensDoMes: itensDoMes, feriados: feriados, NOMES: NOMES };
})(typeof window !== 'undefined' ? window : globalThis);
