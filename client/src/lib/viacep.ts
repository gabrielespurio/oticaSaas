// ViaCEP API integration

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  // Remove any non-digit characters
  const cleanCEP = cep.replace(/\D/g, '');
  
  // Check if CEP has 8 digits
  if (cleanCEP.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data: ViaCEPResponse = await response.json();
    
    // Check if the API returned an error
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching address from ViaCEP:', error);
    return null;
  }
}