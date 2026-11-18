import type { ComponentProps } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Input } from './Input'

type Props<T extends FieldValues> = Omit<ComponentProps<typeof Input>, 'value' | 'onChangeText' | 'erro'> & {
  control: Control<T>
  nome: Path<T>
  mascara?: (texto: string) => string // ex.: mascararCpf, aplicada enquanto a pessoa digita
}

// Liga um <Input> ao react-hook-form: valor, mudança e mensagem de erro do campo.
export function CampoForm<T extends FieldValues>({ control, nome, mascara, ...props }: Props<T>) {
  return (
    <Controller
      control={control}
      name={nome}
      render={({ field, fieldState }) => (
        <Input
          {...props}
          ref={field.ref}
          value={field.value}
          onBlur={field.onBlur}
          onChangeText={(texto) => field.onChange(mascara ? mascara(texto) : texto)}
          erro={fieldState.error?.message}
        />
      )}
    />
  )
}
