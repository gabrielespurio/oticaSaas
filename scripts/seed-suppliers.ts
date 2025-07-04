import { storage } from "../server/storage";

async function seedSuppliers() {
  console.log("Seeding suppliers...");

  const suppliers = [
    {
      name: "Luxottica Brasil",
      email: "vendas@luxottica.com.br",
      phone: "(11) 3456-7890",
      cnpj: "12.345.678/0001-01",
      street: "Av. das Nações Unidas",
      number: "1000",
      complement: "Sala 101",
      neighborhood: "Vila Olímpia",
      city: "São Paulo",
      state: "SP",
      zipCode: "04578-000",
      notes: "Fornecedor principal de armações de luxo",
      isActive: true,
    },
    {
      name: "Opticare Distribuidora",
      email: "contato@opticare.com.br",
      phone: "(11) 2456-3890",
      cnpj: "98.765.432/0001-02",
      street: "Rua da Ótica",
      number: "500",
      complement: "",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      notes: "Distribuidor de lentes oftálmicas",
      isActive: true,
    },
    {
      name: "Essilor Brasil",
      email: "vendas@essilor.com.br",
      phone: "(11) 3789-4560",
      cnpj: "11.222.333/0001-03",
      street: "Rua das Lentes",
      number: "250",
      complement: "Galpão A",
      neighborhood: "Mooca",
      city: "São Paulo",
      state: "SP",
      zipCode: "03104-000",
      notes: "Especialista em lentes progressivas",
      isActive: true,
    },
    {
      name: "Zeiss Vision Care",
      email: "comercial@zeiss.com.br",
      phone: "(11) 4567-8901",
      cnpj: "44.555.666/0001-04",
      street: "Av. Paulista",
      number: "1500",
      complement: "Conj. 801",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      notes: "Tecnologia alemã em lentes oftálmicas",
      isActive: true,
    },
    {
      name: "Acessórios Óticos Ltda",
      email: "vendas@acessoriosopticos.com.br",
      phone: "(11) 5678-9012",
      cnpj: "77.888.999/0001-05",
      street: "Rua dos Acessórios",
      number: "75",
      complement: "",
      neighborhood: "Liberdade",
      city: "São Paulo",
      state: "SP",
      zipCode: "01508-000",
      notes: "Fornecedor de estojos, panos e acessórios",
      isActive: true,
    },
  ];

  try {
    for (const supplier of suppliers) {
      await storage.createSupplier(supplier);
      console.log(`Supplier ${supplier.name} created successfully`);
    }
    console.log("All suppliers seeded successfully!");
  } catch (error) {
    console.error("Error seeding suppliers:", error);
  }
}

seedSuppliers().catch(console.error);