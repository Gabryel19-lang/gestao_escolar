import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './db.js'
import validar_req from './controller_validacao_tabela.js'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3200

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const baseDir = path.join(__dirname, 'templates')

app.use(express.static(baseDir))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(baseDir, 'index.html'))
})

// Formulário de cadastro de aluno
app.get('/form/aluno', (req, res) => {
    res.sendFile(path.join(baseDir, 'form.aluno.html'))
})
// Formulário de cadastro de curso
app.get('/form/curso', (req, res) => {
    res.sendFile(path.join(baseDir, 'form.curso.html'))
})

// Formulário de cadastro de docente
app.get('/form/docente', (req, res) => {
    res.sendFile(path.join(baseDir, 'form.docente.html'))
})
// Listar alunos, cursos ou docentes
app.get('/listar/:tabela', async (req, res) => {
    const tabela = req.params.tabela

    const consultas = {
        alunos: 'SELECT * FROM aluno',
        cursos: 'SELECT * FROM curso',
        docentes: 'SELECT * FROM docente'
    }

    const query = consultas[tabela]

    if (!query) {
        return res.status(400).json({
            message: 'Tabela inválida.'
        })
    }

    try {
        const resultado = await db.query(query)

        res.status(200).json({
            message: 'Sucesso.',
            [tabela]: resultado.rows
        })
    } catch (erro) {
        console.error(`Erro ao buscar ${tabela}:`, erro)

        res.status(500).json({
            message: `Erro ao buscar ${tabela}.`
        })
    }
})

// Cadastrar aluno
app.post('/cadastrar/aluno', async (req, res) => {
    const { matricula, nome, data_nascimento } = req.body

    if (!matricula || !nome || !data_nascimento) {
        return res.status(400).json({
            message: 'Preencha todos os campos obrigatórios.'
        })
    }

    try {
        const resultado = await db.query(
            `INSERT INTO aluno
                (matricula, nome, data_nascimento)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [matricula, nome, data_nascimento]
        )

        res.status(201).json({
            message: 'Aluno cadastrado com sucesso.',
            aluno: resultado.rows[0]
        })
    } catch (erro) {
        console.error('Erro ao cadastrar aluno:', erro)

        if (erro.code === '23505') {
            return res.status(409).json({
                message: 'Essa matrícula já está cadastrada.'
            })
        }

        res.status(500).json({
            message: 'Erro ao cadastrar aluno.'
        })
    }
})
// ============================================
// CADASTRAR CURSO
// ============================================

app.post('/cadastrar/curso', async (req, res) => {
    const nome = typeof req.body.nome === 'string'
        ? req.body.nome.trim()
        : ''

    const descricao = typeof req.body.descricao === 'string'
        ? req.body.descricao.trim()
        : ''

    const cargaHoraria = Number(req.body.carga_horaria)

    if (
        !nome ||
        !Number.isSafeInteger(cargaHoraria) ||
        cargaHoraria <= 0
    ) {
        return res.status(400).json({
            message: 'Informe o nome e uma carga horária inteira maior que zero.'
        })
    }

    try {
        const resultado = await db.query(
            `INSERT INTO curso
                (nome, descricao, carga_horaria)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [nome, descricao || null, cargaHoraria]
        )

        return res.status(201).json({
            message: 'Curso cadastrado com sucesso!',
            curso: resultado.rows[0]
        })

    } catch (erro) {
        console.error('Erro ao cadastrar curso:', erro)

        if (erro.code === '23505') {
            return res.status(409).json({
                message: 'Já existe um curso com esses dados únicos.'
            })
        }

        return res.status(500).json({
            message: 'Não foi possível cadastrar o curso no banco de dados.'
        })
    }
})


// ============================================
// CADASTRAR DOCENTE
// ============================================

app.post('/cadastrar/docente', async (req, res) => {
    const registro = typeof req.body.registro === 'string'
        ? req.body.registro.trim()
        : ''

    const nome = typeof req.body.nome === 'string'
        ? req.body.nome.trim()
        : ''

    const especialidade = typeof req.body.especialidade === 'string'
        ? req.body.especialidade.trim()
        : ''

    if (!registro || !nome || !especialidade) {
        return res.status(400).json({
            message: 'Preencha o registro, o nome e a especialidade.'
        })
    }

    try {
        const resultado = await db.query(
            `INSERT INTO docente
                (registro, nome, especialidade)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [registro, nome, especialidade]
        )

        return res.status(201).json({
            message: 'Docente cadastrado com sucesso!',
            docente: resultado.rows[0]
        })

    } catch (erro) {
        console.error('Erro ao cadastrar docente:', erro)

        if (erro.code === '23505') {
            return res.status(409).json({
                message: 'Esse registro de docente já está cadastrado.'
            })
        }

        return res.status(500).json({
            message: 'Não foi possível cadastrar o docente no banco de dados.'
        })
    }
})
// ============================================
// ATUALIZAR ALUNO
// ============================================

app.patch('/atualizar/:tabela/:id', async (req, res) => {
    try {
        let { tabela, id } = req.params;

        tabela = tabela.toLowerCase();

        if (!validar_req(tabela, id)) {
    return res.status(400).json({
        Code: 400,
        message: 'Tabela ou ID inválido.'
    });
}

        let campos = Object.keys(req.body);
        let dados = Object.values(req.body);

        if (campos.length === 0) {
            return res.status(400).json({
                Code: 400,
                message: 'Nenhum campo informado para atualização.'
            });
        }

        let set = campos
            .map((campo, i) => `${campo} = $${i + 1}`)
            .join(', ');

        dados.push(id);

        let sql = `
            UPDATE ${tabela}
            SET ${set}
            WHERE id = $${dados.length}
            RETURNING *;
        `;

        let resp = await db.query(sql, dados);

        res.status(200).json({
            Code: 200,
            Message: 'Registro atualizado com sucesso!',
            registro: resp.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            Code: 500,
            Message: 'Erro ao atualizar registro.'
        });
    }
});

app.delete('/deletar/:tabela/:id', async (req, res) => {
    try {
        let { tabela, id } = req.params;

        tabela = tabela.toLowerCase();

        const tabelas = ['aluno', 'curso', 'docente', 'turma'];

        if (!tabelas.includes(tabela) || !/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: 'Tabela ou ID inválido.'
            });
        }
        
        const resultado = await db.query(
            `DELETE FROM ${tabela} WHERE id = $1 RETURNING *`,
            [Number(id)]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                message: 'Registro não encontrado.'
            });
        }

        return res.status(200).json({
            message: 'Registro excluído com sucesso!',
            registro: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            message: 'Erro ao excluir registro.'
        });
    }
});
// Página de erro 404
app.use((req, res) => {
    res.status(404).sendFile(
        path.join(baseDir, 'pg404.html')
    );
});
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})