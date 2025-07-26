export const products = [
    {
      id: "1",
      image: "https://placehold.co/40x40.png",
      name: "Caneta Azul",
      code: "001-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 92,
      unit: "und",
      category: "Escritório",
    },
    {
      id: "2",
      image: "https://placehold.co/40x40.png",
      name: "Caneta Preta",
      code: "002-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 63,
      unit: "und",
      category: "Escritório",
    },
    {
      id: "3",
      image: "https://placehold.co/40x40.png",
      name: "Caneta Vermelha",
      code: "003-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 19,
      unit: "und",
      category: "Escritório",
    },
    {
      id: "4",
      image: "https://placehold.co/40x40.png",
      name: "Papel A4",
      code: "005-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 11,
      unit: "Resma",
      category: "Escritório",
    },
    {
      id: "5",
      image: "https://placehold.co/40x40.png",
      name: "Quadro",
      code: "004-25",
      patrimony: "123456",
      type: "permanente",
      quantity: 1,
      unit: "und",
      category: "Mobiliário",
    },
  ];
  
  type Movement = {
    id: string;
    productId: string;
    date: string;
    type: 'Entrada' | 'Saída' | 'Devolução';
    quantity: number;
    responsible: string;
  };
  
  export let movements: Movement[] = [
      { id: '1', productId: '1', date: '2024-05-20T07:00:00Z', type: 'Entrada', quantity: 50, responsible: 'João Silva' },
      { id: '2', productId: '1', date: '2024-05-21T11:30:00Z', type: 'Saída', quantity: 10, responsible: 'Maria Oliveira' },
      { id: '3', productId: '2', date: '2024-05-22T06:15:00Z', type: 'Saída', quantity: 5, responsible: 'Carlos Pereira' },
      { id: '4', productId: '3', date: '2024-05-23T08:00:00Z', type: 'Entrada', quantity: 20, responsible: 'João Silva' },
      { id: '5', productId: '1', date: '2024-05-24T13:45:00Z', type: 'Devolução', quantity: 2, responsible: 'Ana Costa' },
  ];
  
  export const addMovement = (movement: Omit<Movement, 'id'>) => {
      movements.push({
          id: (movements.length + 1).toString(),
          ...movement,
      });
  };
  