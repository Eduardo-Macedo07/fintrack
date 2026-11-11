import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = React.ComponentProps<typeof Input> & {
  name: string;
  label: string;
  errors?: string[];
};

/** Campo com rótulo e mensagem de erro, ligados por aria para leitores de tela. */
export function Field({ name, label, errors, ...props }: Props) {
  const errorId = `${name}-error`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? errorId : undefined}
        {...props}
      />
      {errors?.length ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
