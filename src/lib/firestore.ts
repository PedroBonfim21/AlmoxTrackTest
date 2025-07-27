
import { db, storage } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, runTransaction, getDoc, increment, writeBatch, QueryConstraint, or, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { parseISO } from 'date-fns';

// Product Type
export type Product = {
    id: string;
    image?: string;
    name: string;
    code: string;
    patrimony: string;
    type: 'consumo' | 'permanente';
    quantity: number;
    unit: string;
    category: string;
};

// Movement Type
export type Movement = {
    id: string;
    productId: string;
    date: string; // ISO 8601 format
    type: 'Entrada' | 'Saída' | 'Devolução';
    quantity: number;
    responsible: string;
    department?: string;
    supplier?: string;
    invoice?: string;
};

type EntryData = {
    items: { id: string; quantity: number }[];
    date: string;
    supplier: string;
    invoice: string;
    responsible: string;
}

type ExitData = {
    items: { id: string; quantity: number }[];
    date: string;
    requester: string;
    department: string;
    purpose?: string;
    responsible: string;
}

type ReturnData = {
    items: { id: string; quantity: number }[];
    date: string;
    department: string;
    reason: string;
    responsible: string;
}

// Filter Type for getMovements
type MovementFilters = {
  startDate?: string;
  endDate?: string;
  movementType?: string;
  materialType?: string;
  department?: string;
  products?: Product[]; // Needed for materialType filtering
};

type ProductFilters = {
    searchTerm?: string;
    materialType?: 'consumo' | 'permanente';
}


// Product Functions
const productsCollection = collection(db, 'products');
const movementsCollection = collection(db, 'movements');

export const getProducts = async (filters: ProductFilters = {}): Promise<Product[]> => {
    const { searchTerm, materialType } = filters;
    
    let constraints: QueryConstraint[] = [];

    if (materialType) {
        constraints.push(where('type', '==', materialType));
    }

    if (searchTerm) {
        // This is a common and effective way to implement "starts-with" search in Firestore.
        // It finds all documents where the 'name' field is greater than or equal to the search term
        // and less than the search term followed by a high-unicode character.
        constraints.push(where('name', '>=', searchTerm));
        constraints.push(where('name', '<=', searchTerm + '\uf8ff'));
    }
    
    // Add a default ordering to make queries more consistent
    constraints.push(orderBy('name'));
    constraints.push(limit(25)); // Limit results to prevent fetching too much data

    const finalQuery = query(productsCollection, ...constraints);
    const snapshot = await getDocs(finalQuery);

    const products: Product[] = [];
    snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() } as Product);
    });

    // If search term is a code, try an exact match as a fallback (less common)
    if (searchTerm && products.length === 0) {
        const codeQuery = query(productsCollection, where('code', '==', searchTerm));
        const codeSnapshot = await getDocs(codeQuery);
        codeSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() } as Product);
        });
    }

    return products;
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const docRef = await addDoc(productsCollection, productData);
    return docRef.id;
};

export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await updateDoc(productDoc, productData);
};

export const deleteProduct = async (productId: string): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};

export const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};


// Transactional Functions for Movements
export const finalizeEntry = async (entryData: EntryData): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            for (const item of entryData.items) {
                const productRef = doc(db, "products", item.id);
                
                // Increment product quantity
                transaction.update(productRef, { quantity: increment(item.quantity) });

                // Create movement record
                const movementData: Omit<Movement, 'id'> = {
                    productId: item.id,
                    date: entryData.date,
                    type: 'Entrada',
                    quantity: item.quantity,
                    responsible: entryData.responsible,
                    supplier: entryData.supplier,
                    invoice: entryData.invoice,
                };
                const movementRef = doc(collection(db, "movements"));
                transaction.set(movementRef, movementData);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e; // Re-throw the error to be caught by the calling function
    }
};

export const finalizeExit = async (exitData: ExitData): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            for (const item of exitData.items) {
                const productRef = doc(db, "products", item.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error(`Produto com ID ${item.id} não encontrado.`);
                }
                
                const currentQuantity = productDoc.data().quantity;
                if (currentQuantity < item.quantity) {
                    throw new Error(`Estoque insuficiente para ${productDoc.data().name}.`);
                }

                // Decrement product quantity
                transaction.update(productRef, { quantity: increment(-item.quantity) });

                // Create movement record
                const movementData: Omit<Movement, 'id'> = {
                    productId: item.id,
                    date: exitData.date,
                    type: 'Saída',
                    quantity: item.quantity,
                    responsible: exitData.responsible,
                    department: exitData.department,
                };
                const movementRef = doc(collection(db, "movements"));
                transaction.set(movementRef, movementData);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const finalizeReturn = async (returnData: ReturnData): Promise<void> => {
     try {
        await runTransaction(db, async (transaction) => {
            for (const item of returnData.items) {
                const productRef = doc(db, "products", item.id);
                const productDoc = await transaction.get(productRef);
                 if (!productDoc.exists()) {
                    throw new Error(`Produto com ID ${item.id} não encontrado.`);
                }

                // Increment product quantity
                transaction.update(productRef, { quantity: increment(item.quantity) });

                // Create movement record
                const movementData: Omit<Movement, 'id'> = {
                    productId: item.id,
                    date: returnData.date,
                    type: 'Devolução',
                    quantity: item.quantity,
                    responsible: returnData.responsible,
                    department: returnData.department,
                };
                const movementRef = doc(collection(db, "movements"));
                transaction.set(movementRef, movementData);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};


// Movement Functions
export const getMovements = async (filters: MovementFilters = {}): Promise<Movement[]> => {
    const { startDate, endDate, movementType, materialType, department, products } = filters;

    let constraints: QueryConstraint[] = [];

    if (startDate) {
        constraints.push(where('date', '>=', startDate));
    }
    if (endDate) {
        const toDate = new Date(parseISO(endDate));
        toDate.setHours(23, 59, 59, 999);
        constraints.push(where('date', '<=', toDate.toISOString()));
    }
    if (movementType) {
        constraints.push(where('type', '==', movementType));
    }
    if (department) {
        constraints.push(where('department', '==', department));
    }
    
    // This filter cannot be done in the same query as other range filters.
    // It's applied client-side after the main query.
    if (materialType && products) {
        const productIds = products
            .filter((p) => p.type === materialType)
            .map((p) => p.id);
        
        if (productIds.length > 0) {
            constraints.push(where('productId', 'in', productIds));
        } else {
            // If no products match the material type, return no movements.
            return [];
        }
    }

    const finalQuery = query(movementsCollection, ...constraints);
    const snapshot = await getDocs(finalQuery);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
};

export const getMovementsForItem = async (productId: string): Promise<Movement[]> => {
    const q = query(movementsCollection, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
    // Sort by date descending
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const addMovement = async (movementData: Omit<Movement, 'id'>): Promise<string> => {
    const docRef = await addDoc(movementsCollection, movementData);
    return docRef.id;
};

export const updateProductQuantityOnEntry = async (productId: string, quantity: number): Promise<void> => {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
        quantity: increment(quantity)
    });
};
