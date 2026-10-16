import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('ambas as entradas publicadas incluem estilos e scripts sem arquivos externos', async () => {
  const root = new URL('../', import.meta.url);
  const [index, standalone] = await Promise.all(['index.html', 'transparente.html'].map(name => readFile(new URL(name, root), 'utf8')));
  assert.equal(index, standalone);
  assert.match(index, /<style>:root\{color-scheme:dark/);
  assert.match(index, /function makeMask\(/);
  assert.match(index, /\$\('download'\)\.onclick/);
  assert.doesNotMatch(index, /<script[^>]+src=|<link[^>]+rel="stylesheet"|import \{makeMask\}/);
});
