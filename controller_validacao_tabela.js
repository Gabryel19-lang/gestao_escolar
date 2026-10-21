const tabelas = ['aluno', 'curso', 'docente', 'turma'];

function validar_req(tabela, id = null) {

    if (!tabelas.includes(tabela?.toLowerCase())) {
        return false;
    }

    if (id === null) {
        return true;
    }

    if (!/^[1-9]\d*$/.test(String(id))) {
        return false;
    }

    return Number.isSafeInteger(Number(id));
}

export default validar_req;