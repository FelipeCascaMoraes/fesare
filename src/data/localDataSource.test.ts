import { createLocalDataSource, loadAll } from './localDataSource';

describe('localDataSource', () => {
  it('carrega dados demonstrativos na primeira execução, todos marcados', async () => {
    const all = await loadAll(createLocalDataSource());
    expect(all.clients.length).toBeGreaterThan(0);
    for (const list of Object.values(all)) {
      for (const item of list) expect(item.isDemo).toBe(true);
    }
  });

  it('cria, atualiza e remove registros reais', async () => {
    const ds = createLocalDataSource();
    const c = await ds.clients.create({ name: 'Cliente real' });
    expect(c.isDemo).toBe(false);
    const u = await ds.clients.update(c.id, { city: 'Santos' });
    expect(u.city).toBe('Santos');
    await ds.clients.remove(c.id);
    expect((await ds.clients.list()).some((x) => x.id === c.id)).toBe(false);
  });

  it('remove apenas os dados demonstrativos e permite recarregá-los', async () => {
    const ds = createLocalDataSource();
    const real = await ds.clients.create({ name: 'Cliente real' });
    await ds.clearDemoData();
    let all = await loadAll(ds);
    expect(all.clients.map((c) => c.id)).toEqual([real.id]);
    expect(all.projects).toHaveLength(0);

    await ds.restoreDemoData();
    all = await loadAll(ds);
    expect(all.clients.some((c) => c.id === real.id)).toBe(true);
    expect(all.clients.some((c) => c.isDemo)).toBe(true);
  });

  it('não recria a demonstração depois que ela foi removida', async () => {
    await createLocalDataSource().clearDemoData();
    const all = await loadAll(createLocalDataSource());
    expect(all.clients).toHaveLength(0);
  });

  it('informa erro claro quando os dados locais estão corrompidos', async () => {
    const ds = createLocalDataSource();
    localStorage.setItem('fesare:v1:clients', '{quebrado');
    await expect(ds.clients.list()).rejects.toThrow(/corrompidos/);
  });

  it('falha ao atualizar registro inexistente', async () => {
    await expect(createLocalDataSource().tasks.update('nao-existe', { title: 'x' })).rejects.toThrow(/não encontrado/);
  });
});
