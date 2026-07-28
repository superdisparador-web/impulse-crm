import { Transform } from 'class-transformer';

export const OptionalId = () =>
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  );
