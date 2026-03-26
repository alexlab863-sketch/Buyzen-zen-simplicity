export function isMissingSchemaError(error) {
  if (!error) return false;
  const code = error.code || '';
  const text = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return (
    ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(code) ||
    text.includes('could not find the table') ||
    text.includes('schema cache')
  );
}

export function isRlsError(error) {
  if (!error) return false;
  const text = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return (error.code || '') === '42501' || text.includes('row-level security');
}

export function extractMissingColumn(error) {
  const text = `${error?.message || ''} ${error?.details || ''}`;
  const patterns = [
    /column "?([a-zA-Z0-9_]+)"? of relation/i,
    /column "?([a-zA-Z0-9_]+)"? does not exist/i,
    /Could not find the ['"]([a-zA-Z0-9_]+)['"] column/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return '';
}

export async function adaptiveUpsert(supabase, table, conflictKey, row) {
  const payload = { ...row };
  let attempts = 0;

  while (attempts < 10) {
    attempts += 1;
    const { error } = await supabase.from(table).upsert(payload, { onConflict: conflictKey });

    if (!error) return { ok: true, usedRow: payload };

    if (!isMissingSchemaError(error)) return { ok: false, error };

    const missingColumn = extractMissingColumn(error);
    if (!missingColumn || !(missingColumn in payload) || missingColumn === conflictKey) {
      return { ok: false, error };
    }

    delete payload[missingColumn];
  }

  return { ok: false, error: new Error('adaptive upsert attempts exhausted') };
}

export async function adaptiveInsert(supabase, table, row) {
  const payload = { ...row };
  let attempts = 0;

  while (attempts < 10) {
    attempts += 1;
    const { error } = await supabase.from(table).insert(payload);

    if (!error) return { ok: true, usedRow: payload };

    if (!isMissingSchemaError(error)) return { ok: false, error };

    const missingColumn = extractMissingColumn(error);
    if (!missingColumn || !(missingColumn in payload)) {
      return { ok: false, error };
    }

    delete payload[missingColumn];
  }

  return { ok: false, error: new Error('adaptive insert attempts exhausted') };
}
