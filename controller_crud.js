export default {

    sql_ler: (tabela) =>
        `SELECT * FROM ${tabela};`,

    sql_inserir: (tabela, campos, placeholders) =>
        `INSERT INTO ${tabela} (${campos})
         VALUES (${placeholders})
         RETURNING *;`,

    sql_atualizar: (tabela, placeholders, indiceId) =>
        `UPDATE ${tabela}
         SET ${placeholders}
         WHERE id = $${indiceId}
         RETURNING *;`,

    sql_delete: (tabela) =>
        `DELETE FROM ${tabela}
         WHERE id = $1
         RETURNING *;`
};