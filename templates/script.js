async function carregarAlunos() {
    const resposta = await fetch('/listar/alunos')
    const dados = await resposta.json()

    const container = document.getElementById('alunos')

    container.innerHTML = dados.alunos.map(aluno => `
        <div class="card">
            <h3>${aluno.nome}</h3>
            <p>Matrícula: ${aluno.matricula}</p>
            <p>Data de nascimento: ${aluno.data_nascimento}</p>
        </div>
    `).join('')
}

async function carregarCursos() {
    const resposta = await fetch('/listar/cursos')
    const dados = await resposta.json()

    const container = document.getElementById('cursos')

    container.innerHTML = dados.cursos.map(curso => `
        <div class="card">
            <h3>${curso.nome}</h3>
            <p>${curso.descricao}</p>
            <p>Carga horária: ${curso.carga_horaria} horas</p>
        </div>
    `).join('')
}

async function carregarDocentes() {
    const resposta = await fetch('/listar/docentes')
    const dados = await resposta.json()

    const container = document.getElementById('docentes')

    container.innerHTML = dados.docentes.map(docente => `
        <div class="card">
            <h3>${docente.nome}</h3>
            <p>Registro: ${docente.registro}</p>
            <p>Especialidade: ${docente.especialidade}</p>
        </div>
    `).join('')
}

async function carregarDados() {
    try {
        await carregarAlunos()
        await carregarCursos()
        await carregarDocentes()
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro)
    }
}

carregarDados()