import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCPF, formatPhone, formatCEP } from "@/lib/masks";
import { cn } from "@/lib/utils";

export interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: 'cpf' | 'phone' | 'cep';
  onChange?: (value: string, maskedValue: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, onChange, value = '', ...props }, ref) => {
    const [maskedValue, setMaskedValue] = React.useState(() => {
      const stringValue = String(value);
      switch (mask) {
        case 'cpf':
          return formatCPF(stringValue);
        case 'phone':
          return formatPhone(stringValue);
        case 'cep':
          return formatCEP(stringValue);
        default:
          return stringValue;
      }
    });

    React.useEffect(() => {
      const stringValue = String(value);
      let formatted = '';
      switch (mask) {
        case 'cpf':
          formatted = formatCPF(stringValue);
          break;
        case 'phone':
          formatted = formatPhone(stringValue);
          break;
        case 'cep':
          formatted = formatCEP(stringValue);
          break;
        default:
          formatted = stringValue;
      }
      setMaskedValue(formatted);
    }, [value, mask]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      let formatted = '';
      
      switch (mask) {
        case 'cpf':
          formatted = formatCPF(inputValue);
          break;
        case 'phone':
          formatted = formatPhone(inputValue);
          break;
        case 'cep':
          formatted = formatCEP(inputValue);
          break;
        default:
          formatted = inputValue;
      }
      
      setMaskedValue(formatted);
      
      // Return unmasked value and masked value
      const unmaskedValue = inputValue.replace(/\D/g, '');
      onChange?.(unmaskedValue, formatted);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={maskedValue}
        onChange={handleInputChange}
        className={cn(className)}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };