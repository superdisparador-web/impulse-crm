import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, table, form, sidebar] = await Promise.all([
  readFile(new URL("../components/users/UsersPage.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/users/UserTable.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/users/UserForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/layout/Sidebar.tsx", import.meta.url), "utf8"),
]);

test("Central de Usuários reutiliza o design system e oferece filtros enterprise", () => {
  for (const component of ["PageHeader", "Card", "Input", "Select", "Button"]) {
    assert.match(page, new RegExp(component));
  }
  for (const label of ["Total de usuários", "Últimos acessos hoje", "Data de criação", "Exportar", "Limpar filtros"]) {
    assert.match(page, new RegExp(label));
  }
});

test("tabela de usuários cobre estados, ordenação e ações completas", () => {
  for (const component of ["TableContainer", "TableHeader", "TableBody", "TableRow"]) {
    assert.match(table, new RegExp(component));
  }
  for (const action of ["Visualizar", "Editar", "Resetar senha", "Desativar", "Arquivar", "Excluir", "Duplicar usuário"]) {
    assert.match(table, new RegExp(action));
  }
  assert.match(table, /animate-pulse/);
  assert.match(table, /Nenhum usuário encontrado/);
});

test("formulário premium cobre acesso, organização e permissões", () => {
  for (const label of ["Dados pessoais", "Acesso", "Organização", "Permissões", "Confirmar senha", "Gerar senha", "Copiar", "Enviar convite"]) {
    assert.match(form, new RegExp(label));
  }
  for (const strength of ["Fraca", "Média", "Boa", "Excelente"]) {
    assert.match(form, new RegExp(strength));
  }
});

test("drawer e navegação expõem a Central de Usuários", () => {
  for (const label of ["Dashboard do usuário", "Último IP", "Atualizado em", "Somente leitura", "Sem acesso"]) {
    assert.match(page, new RegExp(label));
  }
  assert.ok(sidebar.indexOf('title: "Corretores"') < sidebar.indexOf('title: "Usuários"'));
});
