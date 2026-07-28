const assert = require('node:assert/strict');
const { test } = require('node:test');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { CreateWhatsappAccountDto } = require('../dist/src/whatsapp/dto/create-whatsapp-account.dto');
const { UpdateWhatsappAccountDto } = require('../dist/src/whatsapp/dto/update-whatsapp-account.dto');

const validAccount = {
  name: 'Atendimento',
  phoneNumberId: '1234567890',
  wabaId: '9876543210',
  accessToken: 'a'.repeat(20),
};

test('aceita criação sem businessAccountId', async () => {
  const dto = plainToInstance(CreateWhatsappAccountDto, validAccount);
  assert.deepEqual(await validate(dto), []);
});

test('converte businessAccountId vazio em campo ausente antes da validação', async () => {
  for (const businessAccountId of ['', '   ']) {
    const dto = plainToInstance(CreateWhatsappAccountDto, {
      ...validAccount,
      businessAccountId,
    });
    assert.equal(dto.businessAccountId, undefined);
    assert.deepEqual(await validate(dto), []);
  }
});

test('mantém validação numérica quando businessAccountId é informado', async () => {
  const valid = plainToInstance(CreateWhatsappAccountDto, {
    ...validAccount,
    businessAccountId: '1122334455',
  });
  assert.deepEqual(await validate(valid), []);

  const invalid = plainToInstance(CreateWhatsappAccountDto, {
    ...validAccount,
    businessAccountId: 'business-id',
  });
  const errors = await validate(invalid);
  assert.equal(errors.some((error) => error.property === 'businessAccountId'), true);
});

test('aceita businessAccountId vazio na atualização', async () => {
  const dto = plainToInstance(UpdateWhatsappAccountDto, {
    businessAccountId: '',
  });
  assert.equal(dto.businessAccountId, undefined);
  assert.deepEqual(await validate(dto), []);
});
